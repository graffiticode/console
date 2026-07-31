/**
 * model-eval.ts — per-dialect, per-variant output-quality harness.
 *
 * Answers "which variant writes valid, first-shot code more often, and at what
 * cost/latency" for a dialect, so the family ordering in src/lib/model-priority.ts
 * is set from measurement rather than assumption.
 *
 * WHAT VARIES vs WHAT IS FROZEN — this is the whole design:
 *   - Today the VARIANT is the model: `options.model` is pinned (which bypasses the
 *     language's family ordering and the fast-tier small-edit downgrade), and RAG
 *     retrieval runs ONCE per case and the identical `precomputedExamples` go to
 *     every variant. So the model is the only thing that moves.
 *   - Results are keyed on an opaque `variantId`, not on `model`, because the other
 *     axis this repo needs is the inverse: vary the prompt template or retrieval
 *     config with the model frozen. That axis is not built here, but every other
 *     part (case loader, trial runner, CIs, judge, calibration) is axis-agnostic.
 *
 * SIGNALS
 *   objective (free, deterministic, from generateCode's return):
 *     firstPassCompile = fixAttempts === 0 && compiled
 *     finalCompile     = compiled after error-correction
 *     fixRounds, latencyMs, cost (priced via src/lib/model-pricing.ts)
 *   subjective (--judge, costs judge calls):
 *     pointwise 1-5 on the shared rubric; pairwise blind + order-controlled
 *     (both A/B orderings, must agree) round-robin over ALL variant pairs.
 *   cross-family trust (--panel):
 *     one judge PER FAMILY on every candidate, reporting agreement and
 *     SELF-PREFERENCE (each judge's own-family mean minus other-family mean).
 *     A Claude judge ranking Claude against GPT is grading its own family, so a
 *     single-judge cross-family ordering is not defensible. Required before
 *     committing a MODEL_PRIORITY line.
 *
 * GATE: eval cases must not be in the RAG corpus (see scripts/eval-holdout.ts). A
 * leaked case grades every model on copying a retrieved answer, which flatters
 * whichever family mimics best — the exact axis being measured. The gate runs
 * before any spend and fails the run; --allow-leak downgrades it to a loud warning.
 *
 * PREREQS (prod env, like other scripts/):
 *   - .env.local: ANTHROPIC_API_KEY, OPENAI_API_KEY (generation, RAG, judges),
 *     Firebase creds, and EVAL_API_KEY (a DEDICATED eval account — generateCode
 *     writes usage records under its uid; keep it off real users).
 *   - api.graffiticode.org reachable (the compile step).
 *
 * EVAL SET: data/model-eval/<lang>.json = [{ id, prompt, currentCode? }].
 *   Seed from marks-3/4 training examples, but HOLD THEM OUT of RAG — the gate
 *   above enforces this rather than trusting it.
 *
 * USAGE
 *   npm run eval:holdout   -- --lang 0166              # gate only, free
 *   npm run eval           -- --lang 0166 --models claude-opus-5,gpt-5.6-sol --trials 3
 *   npm run eval           -- --lang 0166 --panel      # + cross-family judge panel
 *   npm run eval:calibrate -- --lang 0166              # judge vs human labels
 *
 * Output is timestamped by default (--no-stamp for a fixed path), so run-over-run
 * regressions are visible instead of clobbered.
 */
import "./eval-env"; // MUST be first: prod Firestore/auth/api bootstrap, before any app import

import { writeFileSync, readFileSync, existsSync } from "fs";
import { generateCode, getRelevantExamples } from "../src/lib/code-generation-service";
import { getCredentialsForApiKey } from "../src/lib/api-credentials";
import { judgeCode, judgePair, judgePanel, judgeModelForFamily } from "../src/lib/judge-service";
import { inferProviderFromModel, type LlmProvider } from "../src/lib/llm-models";
import { estimateUsdCost } from "../src/lib/model-pricing";
import { assertHoldout } from "./eval-holdout";
import { pickRepresentative } from "./eval-representative";


interface EvalCase { id: string; prompt: string; currentCode?: string | null }

/**
 * `variantId` is the thing under test, and `model` is only one KIND of variant.
 *
 * Today the harness varies the model with retrieval frozen. The other axis this
 * repo needs is the inverse — vary the prompt template or retrieval config with
 * the model frozen — and it wants every other piece here unchanged: same case
 * loader, same trial runner, same CIs, same judge, same calibration. Grouping on
 * an opaque variantId instead of on `model` is what keeps that a new flag rather
 * than a rewrite. `model` stays alongside it because pricing and the judge panel
 * genuinely need to know which model ran.
 */
interface RunResult {
  lang: string; variantId: string; model: string; family?: LlmProvider; caseId: string; trial: number;
  ok: boolean; firstPass: boolean; finalCompile: boolean; fixRounds: number;
  stub: boolean;   // parsed, but emitted no content — see isStub
  latencyMs: number; inputTokens: number; outputTokens: number; cost: number;
  code?: string;   // retained for the --judge pass; discarded from the console table
  error?: string;
}

/**
 * A program that parses but emits no content — e.g. L0176's preamble alone:
 *   set-var "lrn-id" get-val-public "itemId"..
 * It compiles, so a taskId-only success test counted it as a first-pass WIN and
 * pickRepresentative then seeded it as the case's labeled candidate. That single
 * hole is why a variant could show 88% first-pass while humans scored three of
 * its seven outputs a 1.
 *
 * The test is content structure, not length or dialect keywords: every dialect in
 * these eval sets builds its content out of bracketed lists, so zero brackets
 * (outside string literals) means nothing was authored. Verified against all 32
 * labeled candidates in 0166 + 0176 — real programs carry 2-11 brackets, the two
 * known stubs carry 0. Deliberately NOT a quality test: a substantive program
 * that gets the task wrong still compiled, and belongs to the human/judge scale.
 */
function isStub(code: string | null | undefined): boolean {
  if (!code) return true;
  return !code.replace(/"(\\.|[^"\\])*"/g, '""').includes("[");
}

function parseArgs(argv: string[]) {
  const a = { langs: [] as string[], models: ["claude-sonnet-5", "gpt-5.6-terra"],
    trials: 3, limit: 3, out: "model-eval.json", setDir: "data/model-eval",
    labelsDir: "data/model-eval/labels", judge: false, calibrate: false,
    panel: false, allowLeak: false, stamp: true, holdoutOnly: false,
    thinking: undefined as unknown, effort: undefined as string | undefined };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--lang") { while (argv[i + 1] && !argv[i + 1].startsWith("--")) a.langs.push(argv[++i]); }
    else if (v === "--models") a.models = argv[++i].split(",").map((s) => s.trim());
    else if (v === "--trials") a.trials = parseInt(argv[++i], 10);
    else if (v === "--limit") a.limit = parseInt(argv[++i], 10);
    else if (v === "--out") a.out = argv[++i];
    else if (v === "--set-dir") a.setDir = argv[++i];
    else if (v === "--labels-dir") a.labelsDir = argv[++i];
    // Phase 2 (LLM-as-judge). --judge adds a subjective pass; --calibrate scores judge vs human labels.
    else if (v === "--judge") a.judge = true;
    else if (v === "--calibrate") a.calibrate = true;
    // --panel scores every candidate with one judge PER FAMILY and reports
    // agreement + self-preference. Required before a cross-family ordering.
    else if (v === "--panel") { a.panel = true; a.judge = true; }
    // Deliberately measure retrieval-assisted performance (see eval-holdout.ts).
    else if (v === "--allow-leak") a.allowLeak = true;
    // --no-stamp writes exactly --out instead of a timestamped sibling.
    else if (v === "--no-stamp") a.stamp = false;
    // Run only the hold-out gate and exit. Costs nothing and needs no eval
    // account — check the eval set is clean before committing to a paid sweep.
    else if (v === "--holdout-only") a.holdoutOnly = true;
    // Matched-comparison controls — applied identically to every model.
    else if (v === "--thinking") {
      const t = argv[++i];
      a.thinking = t === "adaptive" ? { type: "adaptive" }
        : (t === "disabled" || t === "off") ? { type: "disabled" }
        : (() => { console.error(`--thinking must be adaptive|disabled|off (got ${t})`); process.exit(1); })();
    }
    else if (v === "--effort") a.effort = argv[++i];
  }
  a.langs = a.langs.flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);
  if (!a.langs.length) { console.error("Provide at least one --lang (e.g. --lang 0166)"); process.exit(1); }
  return a;
}

// Priced from src/lib/model-pricing.ts rather than a local table: a second copy of
// the rates drifts, and a drifted $/win silently reorders the comparison this
// harness exists to settle. usdCostFor bills uncached input + output only (no
// cache read/create), which is right for a RELATIVE comparison.
function costOf(model: string, input: number, output: number): number {
  return estimateUsdCost({ inputTokens: input, outputTokens: output }, model);
}

function loadCases(setDir: string, lang: string): EvalCase[] {
  const path = `${setDir}/${lang}.json`;
  if (!existsSync(path)) {
    console.error(`No eval set at ${path}. Create it: [{ "id": "...", "prompt": "..." }]`);
    return [];
  }
  const cases = JSON.parse(readFileSync(path, "utf8")) as EvalCase[];
  if (!Array.isArray(cases) || !cases.length) { console.error(`Empty eval set: ${path}`); return []; }
  return cases;
}

async function runOne(
  auth: any, lang: string, model: string, c: EvalCase, trial: number, precomputed: any[],
  gen: { thinking?: unknown; effort?: string },
): Promise<RunResult> {
  const t0 = performance.now();
  const base: RunResult = {
    lang, variantId: model, model, family: inferProviderFromModel(model),
    caseId: c.id, trial, ok: false, firstPass: false, finalCompile: false, stub: false,
    fixRounds: 0, latencyMs: 0, inputTokens: 0, outputTokens: 0, cost: 0,
  };
  try {
    const res: any = await generateCode({
      auth, prompt: c.prompt, lang, currentCode: c.currentCode ?? null,
      // pin model → bypasses opt-in + Haiku downgrade; thinking/effort applied
      // identically across models for a matched comparison (undefined ⇒ API default).
      options: { model, thinking: gen.thinking, effort: gen.effort },
      precomputedExamples: precomputed, // identical RAG context across models
      rid: `eval-${lang}-${model}-${c.id}-${trial}`,
    });
    const latencyMs = performance.now() - t0;
    // compiled ⇔ verification produced a taskId AND we got back code that
    // actually authored something. A stub parses, so it would otherwise score as
    // a first-pass win — the metric would reward emitting nothing.
    const stub = isStub(res?.code);
    const compiled = !!res?.taskId && !!res?.code && !stub;
    const fixRounds = res?.fixAttempts ?? 0;
    const inputTokens = res?.usage?.input_tokens ?? 0;
    const outputTokens = res?.usage?.output_tokens ?? 0;
    return {
      ...base, ok: true, latencyMs, inputTokens, outputTokens,
      finalCompile: compiled, firstPass: compiled && fixRounds === 0, fixRounds, stub,
      cost: costOf(model, inputTokens, outputTokens),
      code: typeof res?.code === "string" ? res.code : undefined,
    };
  } catch (e: any) {
    return { ...base, latencyMs: performance.now() - t0, error: e?.message || String(e) };
  }
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

function summarize(runs: RunResult[]) {
  // Group by lang → variant. Keys join on U+241F (SYMBOL FOR UNIT SEPARATOR),
  // not a raw NUL: a NUL byte in the source makes git treat this whole file as
  // binary and print `Bin <n> bytes` instead of a diff, which is how this file
  // became unreviewable in the first place.
  const groups = new Map<string, RunResult[]>();
  for (const r of runs) {
    const k = `${r.lang}\u241f${r.variantId}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  const rows: any[] = [];
  for (const [k, rs] of groups) {
    const [lang, variantId] = k.split("\u241f");
    const model = rs[0].model;
    const n = rs.length, ok = rs.filter((r) => r.ok);
    const first = rs.filter((r) => r.firstPass).length;
    const final = rs.filter((r) => r.finalCompile).length;
    const stubs = rs.filter((r) => r.stub).length;
    const lat = ok.map((r) => r.latencyMs);
    const totalCost = rs.reduce((s, r) => s + r.cost, 0);
    rows.push({
      lang, variantId, model, family: rs[0].family, runs: n, errors: n - ok.length,
      firstPassRate: first / n, finalRate: final / n, stubRate: stubs / n,
      avgFixRounds: rs.reduce((s, r) => s + r.fixRounds, 0) / n,
      latencyP50: quantile(lat, 0.5), latencyP90: quantile(lat, 0.9),
      avgCost: totalCost / n,
      costPerSuccess: final > 0 ? totalCost / final : Infinity,
    });
  }
  return rows.sort((a, b) => a.lang.localeCompare(b.lang) || b.finalRate - a.finalRate);

}

function printTable(rows: any[]) {
  const pct = (x: number) => (100 * x).toFixed(0) + "%";
  const ms = (x: number) => (x / 1000).toFixed(1) + "s";
  console.log(
    "\n" +
    ["lang", "model", "runs", "err", "1st-pass", "final", "stub", "fixes", "p50", "p90", "$/run", "$/win"]
      .map((h, i) => h.padEnd([6, 20, 5, 4, 9, 7, 6, 6, 7, 7, 8, 8][i])).join(""));
  for (const r of rows) {
    console.log([
      r.lang.padEnd(6), r.model.padEnd(20), String(r.runs).padEnd(5), String(r.errors).padEnd(4),
      pct(r.firstPassRate).padEnd(9), pct(r.finalRate).padEnd(7), pct(r.stubRate).padEnd(6),
      r.avgFixRounds.toFixed(2).padEnd(6),
      ms(r.latencyP50).padEnd(7), ms(r.latencyP90).padEnd(7),
      ("$" + r.avgCost.toFixed(4)).padEnd(8),
      (r.costPerSuccess === Infinity ? "—" : "$" + r.costPerSuccess.toFixed(4)).padEnd(8),
    ].join(""));
  }
}

// ── Phase 2: LLM-as-judge ────────────────────────────────────────────────────

/**
 * The candidate to judge per (lang, case, variant): the MEDIAN-LATENCY successful
 * run, not the first one.
 *
 * "First ok" makes the judged program depend on trial scheduling, so re-running
 * the same inputs can judge different code and move the ordering for reasons that
 * have nothing to do with the models. Median is stable under re-run and is a fair
 * representative rather than a best-of — picking the best trial would inflate
 * whichever model has the higher variance. Ties break on trial index so the
 * choice is fully determined.
 */
function repCode(runs: RunResult[]): Map<string, string> {
  const buckets = new Map<string, RunResult[]>();
  for (const r of runs) {
    // finalCompile, not `ok`: `ok` only means the generateCode call returned.
    // Handing the judge a program that failed verification double-counts a
    // failure the objective metric already recorded, and does it unevenly — only
    // for whichever variant happened to fail. Observed on 0176: an OpenAI judge
    // scored 5/5 twice on code that does not parse. Compiling is table stakes,
    // so a candidate that fails it has nothing for the judge to rank.
    if (!r.finalCompile || !r.code) continue;
    const k = `${r.lang}|${r.caseId}|${r.variantId}`;
    (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(r);
  }
  const m = new Map<string, string>();
  for (const [k, rs] of buckets) {
    const rep = pickRepresentative(rs);
    if (rep?.code) m.set(k, rep.code);
  }
  return m;
}

function promptMap(setDir: string, langs: string[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const lang of langs) for (const c of loadCases(setDir, lang)) m.set(`${lang}|${c.id}`, c.prompt);
  return m;
}

/** All unordered pairs — round-robin, so a 3+-model run is fully compared. */
function allPairs<T>(xs: T[]): Array<[T, T]> {
  const out: Array<[T, T]> = [];
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) out.push([xs[i], xs[j]]);
  return out;
}

async function runJudge(runs: RunResult[], args: any) {
  const rep = repCode(runs);
  const prompts = promptMap(args.setDir, args.langs);
  const caseKeys = [...new Set(runs.map((r) => `${r.lang}|${r.caseId}`))];
  const variants: string[] = args.models;

  const pointwise: any[] = [];
  const panels: any[] = [];
  const pairwise: any[] = [];
  process.stderr.write("[judge] ");
  for (const ck of caseKeys) {
    const [lang, caseId] = ck.split("|");
    const prompt = prompts.get(ck);
    if (!prompt) continue;

    for (const variantId of variants) {
      const code = rep.get(`${lang}|${caseId}|${variantId}`);
      if (!code) continue;
      const authorFamily = inferProviderFromModel(variantId);

      if (args.panel) {
        // One judge per family. Recorded per judge so self-preference can be
        // computed downstream; a mean alone would hide exactly the bias we are
        // trying to see.
        const pv = await judgePanel({ prompt, code, lang });
        process.stderr.write(pv.scored.length ? (pv.agreed ? "=" : "≠") : "!");
        for (const e of pv.scored) {
          pointwise.push({
            lang, caseId, variantId, model: variantId, authorFamily,
            judge: e.judge, judgeModel: e.model,
            correctness: e.verdict!.correctness,
            instructionFollowing: e.verdict!.instructionFollowing,
            idiomaticity: e.verdict!.idiomaticity,
            overall: e.verdict!.overall,
          });
        }
        panels.push({
          lang, caseId, variantId, authorFamily,
          judges: pv.scored.length, agreed: pv.agreed, spread: pv.spread,
          meanOverall: pv.meanOverall,
          byJudge: Object.fromEntries(pv.scored.map((e) => [e.judge, e.verdict!.overall])),
        });
      } else {
        const v = await judgeCode({ prompt, code, lang });
        process.stderr.write(v ? "." : "!");
        if (v) pointwise.push({
          lang, caseId, variantId, model: variantId, authorFamily,
          judge: inferProviderFromModel(v.model), judgeModel: v.model,
          correctness: v.correctness, instructionFollowing: v.instructionFollowing,
          idiomaticity: v.idiomaticity, overall: v.overall,
        });
      }
    }

    // Round-robin: every unordered pair, not just the first two.
    for (const [va, vb] of allPairs(variants)) {
      const a = rep.get(`${lang}|${caseId}|${va}`);
      const b = rep.get(`${lang}|${caseId}|${vb}`);
      if (!a || !b) continue;
      // With --panel, run the pairwise comparison once per judge family too: a
      // win-rate from a single family's judge is the same self-preference problem
      // as a pointwise score from one.
      const judgeModels = args.panel
        ? (["anthropic", "openai"] as LlmProvider[]).map(judgeModelForFamily)
        : [undefined];
      for (const judgeModel of judgeModels) {
        const pv = await judgePair({ prompt, codeA: a, codeB: b, lang, model: judgeModel });
        process.stderr.write(pv ? "*" : "!");
        if (pv) pairwise.push({
          lang, caseId, a: va, b: vb,
          judge: inferProviderFromModel(pv.model), judgeModel: pv.model,
          winner: pv.winner, agreed: pv.agreed, byDimension: pv.byDimension,
        });
      }
    }
  }
  process.stderr.write("\n");
  return {
    pointwise, pairwise, panels,
    summary: summarizeJudge(pointwise, pairwise, panels),
  };
}

/**
 * Self-preference: each judge's mean score for its OWN family's output minus its
 * mean for the other family's.
 *
 * This is the number that decides whether panel scores can be trusted to rank
 * families at all. A large positive delta on both judges means each is flattering
 * its own family and neither can arbitrate; a delta near zero on both means the
 * scores are comparable across families. Requires candidates from at least two
 * families to be meaningful — with one, it is not "no bias", it is "unmeasurable",
 * and the report says so rather than printing 0.
 */
function selfPreference(pointwise: any[]) {
  const rows: any[] = [];
  const judges = [...new Set(pointwise.map((p) => p.judge).filter(Boolean))];
  for (const judge of judges) {
    const seen = pointwise.filter((p) => p.judge === judge && p.authorFamily);
    const own = seen.filter((p) => p.authorFamily === judge).map((p) => p.overall);
    const other = seen.filter((p) => p.authorFamily !== judge).map((p) => p.overall);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    rows.push({
      judge,
      nOwn: own.length,
      nOther: other.length,
      ownMean: own.length ? mean(own) : NaN,
      otherMean: other.length ? mean(other) : NaN,
      delta: own.length && other.length ? mean(own) - mean(other) : NaN,
    });
  }
  return rows;
}

function summarizeJudge(pointwise: any[], pairwise: any[], panels: any[]) {
  // Pointwise, keyed by (lang, variant, judge) — NOT collapsed across judges. Two
  // judges disagreeing is the signal; averaging them together first erases it.
  const pw = new Map<string, { n: number; c: number; i: number; d: number; o: number }>();
  for (const p of pointwise) {
    const k = `${p.lang}\u241f${p.variantId}\u241f${p.judge || "?"}`;
    const g = pw.get(k) ?? { n: 0, c: 0, i: 0, d: 0, o: 0 };
    g.n++; g.c += p.correctness; g.i += p.instructionFollowing; g.d += p.idiomaticity; g.o += p.overall;
    pw.set(k, g);
  }
  const point = [...pw].map(([k, g]) => {
    const [lang, variantId, judge] = k.split("\u241f");
    return { lang, variantId, judge, n: g.n, correctness: g.c / g.n,
      instructionFollowing: g.i / g.n, idiomaticity: g.d / g.n, overall: g.o / g.n };
  }).sort((a, b) => a.lang.localeCompare(b.lang) || b.overall - a.overall);

  // Win rates per (lang, pair, judge).
  const wr = new Map<string, { n: number; a: number; b: number; tie: number; agreed: number }>();
  for (const p of pairwise) {
    const k = `${p.lang}\u241f${p.a}\u241f${p.b}\u241f${p.judge || "?"}`;
    const g = wr.get(k) ?? { n: 0, a: 0, b: 0, tie: 0, agreed: 0 };
    g.n++; if (p.winner === "A") g.a++; else if (p.winner === "B") g.b++; else g.tie++;
    if (p.agreed) g.agreed++;
    wr.set(k, g);
  }
  const pair = [...wr].map(([k, g]) => {
    const [lang, a, b, judge] = k.split("\u241f");
    return { lang, a, b, judge, n: g.n, aWins: g.a, bWins: g.b, ties: g.tie, agreeRate: g.agreed / g.n };
  }).sort((x, y) => x.lang.localeCompare(y.lang) || x.a.localeCompare(y.a));

  // Panel agreement per language: share of candidates where the judges landed
  // within a point. Low agreement means the panel cannot rank, and this is the
  // number that says how many cases need a human label instead.
  const pan = new Map<string, { n: number; agreed: number; spread: number }>();
  for (const p of panels) {
    if (!p.judges || p.judges < 2) continue;
    const g = pan.get(p.lang) ?? { n: 0, agreed: 0, spread: 0 };
    g.n++; if (p.agreed) g.agreed++; g.spread += p.spread;
    pan.set(p.lang, g);
  }
  const panel = [...pan].map(([lang, g]) => ({
    lang, n: g.n, agreeRate: g.agreed / g.n, avgSpread: g.spread / g.n,
  }));

  return { pointwise: point, pairwise: pair, panel, selfPreference: selfPreference(pointwise) };
}

function printJudge(s: any) {
  const f2 = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : "n/a");
  const pctOf = (x: number) => (Number.isFinite(x) ? (100 * x).toFixed(0) + "%" : "n/a");

  console.log("\n[judge] pointwise mean scores (1–5, reference-free), BY JUDGE");
  console.log(["lang", "variant", "judge", "n", "correct", "instr", "idiom", "overall"]
    .map((h, i) => h.padEnd([6, 20, 10, 4, 8, 8, 8, 8][i])).join(""));
  for (const r of s.pointwise) console.log([r.lang.padEnd(6), r.variantId.padEnd(20),
    String(r.judge).padEnd(10), String(r.n).padEnd(4),
    f2(r.correctness).padEnd(8), f2(r.instructionFollowing).padEnd(8), f2(r.idiomaticity).padEnd(8),
    f2(r.overall).padEnd(8)].join(""));

  if (s.panel?.length) {
    console.log("\n[judge] panel agreement (do the two families' judges agree within 1 point?)");
    console.log(["lang", "n", "agree", "avg-spread"].map((h, i) => h.padEnd([6, 5, 8, 11][i])).join(""));
    for (const r of s.panel) console.log([r.lang.padEnd(6), String(r.n).padEnd(5),
      pctOf(r.agreeRate).padEnd(8), f2(r.avgSpread).padEnd(11)].join(""));
    console.log("  Low agreement ⇒ the panel cannot rank these candidates; label them by hand");
    console.log("  (npx tsx scripts/create-eval-items.ts) rather than trusting either judge.");
  }

  if (s.selfPreference?.length) {
    console.log("\n[judge] self-preference — each judge's own-family mean minus other-family mean");
    console.log(["judge", "n-own", "n-other", "own", "other", "delta"]
      .map((h, i) => h.padEnd([10, 7, 9, 7, 7, 7][i])).join(""));
    for (const r of s.selfPreference) console.log([String(r.judge).padEnd(10),
      String(r.nOwn).padEnd(7), String(r.nOther).padEnd(9),
      f2(r.ownMean).padEnd(7), f2(r.otherMean).padEnd(7), f2(r.delta).padEnd(7)].join(""));
    const unmeasurable = s.selfPreference.filter((r: any) => !Number.isFinite(r.delta));
    if (unmeasurable.length) {
      console.log("  delta n/a ⇒ UNMEASURABLE (candidates from only one family), not zero bias.");
    }
    console.log("  A large positive delta on both judges means each flatters its own family and");
    console.log("  neither can arbitrate a cross-family ordering — fall back to compile rate,");
    console.log("  cost/win and human labels for that decision.");
  }

  if (s.pairwise.length) {
    console.log("\n[judge] pairwise win-rate (blind, order-controlled), BY JUDGE");
    console.log(["lang", "A", "B", "judge", "n", "A-wins", "B-wins", "ties", "agree"]
      .map((h, i) => h.padEnd([6, 18, 18, 10, 4, 7, 7, 6, 7][i])).join(""));
    for (const r of s.pairwise) console.log([r.lang.padEnd(6), r.a.padEnd(18), r.b.padEnd(18),
      String(r.judge).padEnd(10), String(r.n).padEnd(4), String(r.aWins).padEnd(7),
      String(r.bWins).padEnd(7), String(r.ties).padEnd(6), pctOf(r.agreeRate).padEnd(7)].join(""));
  }
}

// Spearman rank correlation (ρ) with tie-aware (average) ranks. Returns NaN when
// either vector has zero rank variance (all-tied) — ρ is undefined there, and a
// naive 0/first-seen tie-break fabricates a spurious correlation against array order.
function spearman(a: number[], b: number[]): number {
  const rank = (xs: number[]): number[] => {
    const idx = xs.map((v, i) => [v, i] as [number, number]).sort((x, y) => x[0] - y[0]);
    const r = new Array<number>(xs.length);
    for (let i = 0; i < idx.length;) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1; // average of the 1-based ranks i+1..j+1
      for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const ra = rank(a), rb = rank(b), n = a.length;
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const ma = mean(ra), mb = mean(rb);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = ra[i] - ma, y = rb[i] - mb; num += x * y; da += x * x; db += y * y; }
  return da && db ? num / Math.sqrt(da * db) : NaN;
}

// 95% Wilson score interval for a proportion k/n — stays in [0,1] and keeps correct
// coverage at small n / near 0–1, unlike the naive Wald interval. Returns [lo, hi].
function wilson(k: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 0];
  const p = k / n, d = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / d;
  const half = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

// Percentile bootstrap CI for a statistic over paired rows (resample with replacement).
// tsx script → Math.random is fine here (this is not a Workflow script). Resamples whose
// statistic is undefined (e.g. ρ on an all-tied draw) are dropped; CI is conditional on the rest.
function bootstrapCI<T>(rows: T[], stat: (rs: T[]) => number, iters = 2000, alpha = 0.025): [number, number] {
  const n = rows.length, vals: number[] = [];
  for (let b = 0; b < iters; b++) {
    const sample = new Array<T>(n);
    for (let i = 0; i < n; i++) sample[i] = rows[(Math.random() * n) | 0];
    const s = stat(sample);
    if (Number.isFinite(s)) vals.push(s);
  }
  if (!vals.length) return [NaN, NaN];
  vals.sort((x, y) => x - y);
  const q = (p: number) => vals[Math.min(vals.length - 1, Math.max(0, Math.round(p * (vals.length - 1))))];
  return [q(alpha), q(1 - alpha)];
}

// Count of each integer score 1–5 → a compact "1:0 2:1 3:2 4:3 5:6" histogram string.
function scoreHist(vals: number[]): string {
  const c = [0, 0, 0, 0, 0];
  for (const v of vals) { const s = Math.min(5, Math.max(1, Math.round(v))); c[s - 1]++; }
  return c.map((n, i) => `${i + 1}:${n}`).join("  ");
}

// Calibration: score judge vs a small hand-labeled set. This is the trust gate for the judge —
// run it before relying on aggregate judge numbers (or wiring any inline gate/selector).
// Labels: data/model-eval/labels/<lang>.json = [{ id, code, overall, correctness?, ... }].
async function runCalibrate(args: any) {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("Set ANTHROPIC_API_KEY for --calibrate"); process.exit(1); }
  const rows: { lang: string; id: string; human: number; judge: number; authorFamily: LlmProvider | null }[] = [];
  process.stderr.write("[calibrate] ");
  for (const lang of args.langs) {
    const path = `${args.labelsDir}/${lang}.json`;
    if (!existsSync(path)) { console.error(`\nNo labels at ${path} (see labels/README.md)`); continue; }
    const labels = JSON.parse(readFileSync(path, "utf8")) as any[];
    const prompts = new Map(loadCases(args.setDir, lang).map((c) => [c.id, c.prompt]));
    for (const lab of labels) {
      if (lab.overall == null || !lab.code) continue; // skip unlabeled / template rows
      const prompt = lab.prompt || prompts.get(lab.id);
      if (!prompt) { console.error(`\nNo prompt for label ${lang}/${lab.id}`); continue; }
      // Which family AUTHORED the labeled candidate. Calibration has to be read
      // per authoring family: a judge can track human labels well on its own
      // family's output and poorly on the other's, and a single pooled MAE hides
      // exactly that — while being the number that gates the ordering.
      const authorFamily = inferProviderFromModel(lab.model) ?? null;
      const v = await judgeCode({ prompt, code: lab.code, lang });
      process.stderr.write(v ? "." : "!");
      if (v) rows.push({ lang, id: lab.id, human: Number(lab.overall), judge: v.overall, authorFamily });
    }
  }
  process.stderr.write("\n");
  if (!rows.length) { console.error("No usable labels found (each needs { id, code, overall })."); return; }
  const n = rows.length;
  const exactK = rows.filter((r) => Math.round(r.human) === r.judge).length;
  const within1K = rows.filter((r) => Math.abs(r.human - r.judge) <= 1).length;
  const maeStat = (rs: typeof rows) => rs.reduce((s, r) => s + Math.abs(r.human - r.judge), 0) / rs.length;
  const rhoStat = (rs: typeof rows) => spearman(rs.map((r) => r.human), rs.map((r) => r.judge));
  const mae = maeStat(rows);
  const rho = rhoStat(rows);

  // Confidence intervals: Wilson for the two proportions, bootstrap for MAE and ρ.
  const [exLo, exHi] = wilson(exactK, n);
  const [w1Lo, w1Hi] = wilson(within1K, n);
  const [maeLo, maeHi] = bootstrapCI(rows, maeStat);
  const pct = (x: number) => (100 * x).toFixed(0) + "%";

  console.log(`\n[calibrate] n=${n}  (95% CIs — Wilson for rates, bootstrap for MAE/ρ)`);
  console.log(`  exact     = ${pct(exactK / n).padEnd(4)}  CI [${pct(exLo)}, ${pct(exHi)}]`);
  console.log(`  within±1  = ${pct(within1K / n).padEnd(4)}  CI [${pct(w1Lo)}, ${pct(w1Hi)}]`);
  console.log(`  MAE       = ${mae.toFixed(2)}  CI [${maeLo.toFixed(2)}, ${maeHi.toFixed(2)}]`);
  if (Number.isNaN(rho)) {
    console.log(`  Spearman ρ = n/a (no rank variance — human labels are all tied)`);
  } else {
    const [rLo, rHi] = bootstrapCI(rows, rhoStat);
    console.log(`  Spearman ρ = ${rho.toFixed(2)}  CI [${rLo.toFixed(2)}, ${rHi.toFixed(2)}]`);
  }
  console.log(`\n  human score 1–5:  ${scoreHist(rows.map((r) => r.human))}`);
  console.log(`  judge score 1–5:  ${scoreHist(rows.map((r) => r.judge))}`);
  const thinBuckets = [1, 2, 3, 4, 5].filter((s) => rows.filter((r) => Math.round(r.human) === s).length < 3);
  if (thinBuckets.length) console.log(`  ⚠ thin human coverage at score(s) ${thinBuckets.join(", ")} (<3) — per-mark agreement there is unreliable regardless of total n.`);
  // Per-authoring-family breakdown — the cross-family trust gate.
  const families = [...new Set(rows.map((r) => r.authorFamily).filter(Boolean))] as LlmProvider[];
  if (families.length > 1) {
    console.log(`\n  by authoring family (does the judge track humans equally well on both?)`);
    for (const fam of families) {
      const fr = rows.filter((r) => r.authorFamily === fam);
      const fRho = rhoStat(fr);
      console.log(
        `    ${String(fam).padEnd(10)} n=${String(fr.length).padEnd(4)} ` +
        `MAE=${maeStat(fr).toFixed(2)}  ` +
        `ρ=${Number.isNaN(fRho) ? "n/a" : fRho.toFixed(2)}`,
      );
    }
    console.log(`    A materially worse MAE on one family means the judge is not a fair`);
    console.log(`    cross-family arbiter, whatever the pooled number says.`);
  } else if (families.length === 1) {
    console.log(`\n  ⚠ all labels are ${families[0]}-authored — this cannot check cross-family`);
    console.log(`    fairness. Label some candidates from the other family before setting an ordering.`);
  } else {
    console.log(`\n  ⚠ labels carry no \`model\` field, so per-family calibration is unavailable.`);
  }

  console.log("\nThis is the judge's trust gate — widen the CI read: label until it is tight enough for the decision it gates.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Calibration is generation-free (judge only) — short-circuit before requiring an eval account.
  if (args.calibrate) { await runCalibrate(args); return; }

  // GATE: eval cases must not be in the RAG corpus, or every model is scored
  // partly on copying a retrieved answer. Runs BEFORE the eval account and before
  // any spend, because the whole run would be unusable for setting an ordering.
  const holdoutOk = await assertHoldout(
    args.langs,
    (lang) => loadCases(args.setDir, lang),
    { allowLeak: args.allowLeak },
  );
  if (!holdoutOk) process.exit(1);
  if (args.holdoutOnly) { console.error("[holdout] gate only — no generation run."); return; }

  const apiKey = process.env.EVAL_API_KEY;
  if (!apiKey) { console.error("Set EVAL_API_KEY (a dedicated eval account's api key) in .env.local"); process.exit(1); }
  const creds = await getCredentialsForApiKey(apiKey);
  const auth = { token: creds.idToken, uid: creds.uid };

  const allRuns: RunResult[] = [];
  for (const lang of args.langs) {
    const cases = loadCases(args.setDir, lang);
    if (!cases.length) continue;
    console.error(`\n[${lang}] ${cases.length} cases × ${args.models.length} models × ${args.trials} trials`);
    for (const c of cases) {
      // Retrieve RAG examples ONCE, reuse for every model (isolation).
      const precomputed = (await getRelevantExamples({ prompt: c.prompt, lang, limit: args.limit, rid: null })) || [];
      for (const model of args.models) {
        for (let t = 0; t < args.trials; t++) {
          const r = await runOne(auth, lang, model, c, t, precomputed, { thinking: args.thinking, effort: args.effort });
          allRuns.push(r);
          process.stderr.write(r.ok ? (r.firstPass ? "." : r.finalCompile ? "o" : r.stub ? "s" : "x") : "!");
        }
      }
    }
  }
  process.stderr.write("\n");

  const summary = summarize(allRuns);
  printTable(summary);
  console.log("Legend: '.' first-pass compile  'o' compiled after fixes  's' stub (parsed, authored nothing)  'x' never compiled  '!' error");

  // ── Phase 2 (subjective) — LLM-as-judge, opt-in via --judge (keeps Phase 1 cheap). ──
  // Reference-free rubric (correctness / instruction-following / idiomaticity / overall) scored
  // against the prompt intent. Pointwise per (case, model); pairwise blind + order-controlled
  // (both A/B orderings, require agreement) for the first two models. Calibrate the judge against
  // human labels via --calibrate before trusting these numbers.
  let judgements: any = undefined;
  if (args.judge) {
    judgements = await runJudge(allRuns, args);
    printJudge(judgements.summary);
  }

  // Timestamped by default. `--out` alone clobbered the previous run, so there was
  // no way to see whether a model got better or worse between runs — which is the
  // only way to catch a regression after an ordering is committed. --no-stamp
  // restores the old single-file behavior for scripted use.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = args.stamp
    ? args.out.replace(/(\.json)?$/, `-${stamp}.json`)
    : args.out;
  const payload = {
    generatedAt: new Date().toISOString(),
    // The exact ordering this run would justify, so the committed MODEL_PRIORITY
    // line can be traced back to the numbers behind it.
    holdout: args.allowLeak ? "LEAK-ALLOWED — do not use to set an ordering" : "enforced",
    args, summary, runs: allRuns,
    ...(judgements ? { judgements } : {}),
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${allRuns.length} runs${judgements ? " + judge scores" : ""} + summary → ${outPath}`);
  if (judgements && !args.panel) {
    console.log("NOTE: single-judge scores. Re-run with --panel before setting a cross-family ordering.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
