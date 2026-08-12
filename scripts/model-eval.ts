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
 *     drift            = compiled, but the wrong design (hooked langs only, e.g. L0175
 *                        asked for c1-t9 EBSR, emitted hot-text) — see driftedFromPrompt
 *     warnings         = what the compiler objected to, split fixable/unfixable by
 *                        scripts/eval-warning-taxonomy.ts
 *     fixRounds, latencyMs, cost (priced via src/lib/model-pricing.ts)
 *
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
 * CONVERGENCE (--converge N) — the metric that matters for a dialect whose compile rate is
 * saturated. Compiling is table stakes; Graffiticode's actual advantage is that the compiler
 * talks back, so what distinguishes models is the item they reach after iterating and what that
 * iteration costs. A run becomes one AGENT SESSION: generate, then feed the compiler's own
 * warnings back (as an agent would through update_item) for up to N turns. Reports convergence
 * rate, turns-to-clean, residual warnings, per-turn defect buckets, and $/converged, with latency
 * and cost accumulated across the whole session.
 *
 * Without it, a variant that emits a mediocre item in one turn beats one that reaches a good item
 * in three — and a human labeling first-shot output would score them the same. The 0175 baseline
 * (2026-08-08) hit 100% compile, 0 stubs and 0 drift on all three variants while 35 of 60 compiles
 * carried warnings the harness never looked at; under --converge the same three separated at once.
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
 *   npm run eval           -- --lang 0175 --converge 5 # agent-session mode (see CONVERGENCE)
 *   npm run eval           -- --lang 0166 --panel      # + cross-family judge panel
 *   npm run eval:calibrate -- --lang 0166              # judge vs human labels
 *
 * Output is timestamped by default (--no-stamp for a fixed path), so run-over-run
 * regressions are visible instead of clobbered.
 */
import "./eval-env"; // MUST be first: prod Firestore/auth/api bootstrap, before any app import

import { writeFileSync, readFileSync, existsSync, appendFileSync } from "fs";
import { generateCode, getRelevantExamples } from "../src/lib/code-generation-service";
import { getCredentialsForApiKey } from "../src/lib/api-credentials";
import { judgeCode, judgePair, judgePanel, judgeModelForFamily, anchorVersion } from "../src/lib/judge-service";
import { inferProviderFromModel, type LlmProvider } from "../src/lib/llm-models";
import { estimateUsdCost } from "../src/lib/model-pricing";
import { assertHoldout } from "./eval-holdout";
import { pickRepresentative } from "./eval-representative";
import { verifyExampleForPrompt } from "../src/lib/lang-embedding";
import { warningsFromVerification, bucketCounts, classifyWarning } from "./eval-warning-taxonomy";
import { dialectFingerprint, sameDialect, formatFingerprint, type DialectFingerprint } from "./eval-dialect-fingerprint";


/**
 * `design` is authored but not yet READ by this harness, and is here rather than in a sibling
 * README because it is part of a case's meaning.
 *
 * Two 0177-shaped checks need it, and neither can be derived after the fact:
 *   - Warning fixability is CASE-RELATIVE for a dialect whose docs say "do not invent `domain`,
 *     `user-id`, or `reference`". A hole for a value the prompt never supplied is unfixable BY
 *     DESIGN — the L0175 passage-level analog — so feeding it to the convergence loop asks the
 *     model to hallucinate a serving domain and scores every variant as never-converged. The same
 *     warning text for a value the prompt DID supply is a real defect. `supplies` is what separates
 *     them; see the fixable/unfixable split in scripts/eval-warning-taxonomy.ts.
 *   - Design capture / drift wants the intended view, and for this dialect the view IS the mode,
 *     so it is a one-token comparison rather than an embedding hook.
 * Recording it while authoring costs nothing; re-deriving it from prose later costs a re-read of
 * every case, and `view: null` (deliberately no view stated) cannot be re-derived at all.
 */
interface EvalCaseDesign {
  /** The view the prompt asks for, or null when it deliberately names none. */
  view?: string | null;
  /** Required properties the PROMPT actually supplies. A hole outside this set is unfixable. */
  supplies?: string[];
  /** Holes the compiler should legitimately report for a correct generation. */
  expectHoles?: string[];
  note?: string;
}

interface EvalCase { id: string; prompt: string; currentCode?: string | null; design?: EvalCaseDesign }

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
  drift?: boolean; // compiled, but the wrong design — see driftedFromPrompt (undefined ⇒ unjudgeable)
  latencyMs: number; inputTokens: number; outputTokens: number; cost: number;
  code?: string;   // retained for the --judge pass; discarded from the console table
  error?: string;

  // ── Compiler feedback (see scripts/eval-warning-taxonomy.ts) ──────────────
  // Compiling is table stakes for a dialect like L0175; the WARNINGS are the quality
  // signal, and they were being thrown away. Recorded for every run, single-shot or not.
  warningsFixable: number;    // what a repair turn could legitimately act on
  warningsUnfixable: number;  // stimulus-level complaints (e.g. the prompt's passage reads above grade)
  warningBuckets?: Record<string, number>;
  /** Messages the taxonomy didn't recognize — surfaced after the run so it can be extended. */
  unknownWarnings?: string[];
  /**
   * Which version of the dialect this was measured against. Stamped per RUN, not only on the
   * payload, so a checkpoint rebuild keeps it and a label seeded from these rows can carry it.
   */
  dialect?: DialectFingerprint;
  // Other supported claims of the same dimension (`supported - 1`), NOT foil depth: an EBSR
  // with six authored distractors still reports 0. Kept in the payload, deliberately not a
  // column — it reads as a quality number and is not one. Pool depth is the thin-pool
  // WARNINGS, which the taxonomy already buckets.
  alternativeClaims?: number | null;

  // ── Convergence (--converge N) ────────────────────────────────────────────
  // A run is one AGENT SESSION, not one generation: turn 1 plus repair turns driven by
  // the compiler's warnings. latencyMs/cost/tokens above are cumulative over the session,
  // so `$/win` prices the whole chain rather than the opening move.
  turns: number;              // 1 when no repair turns ran
  converged?: boolean;        // reached zero FIXABLE warnings
  turnsToClean?: number | null; // turn index at which that happened; null if never
  stuck?: boolean;            // a turn failed to reduce the fixable count
  // Per turn: not just HOW MANY warnings but WHICH — the counts alone can say a model needed a
  // repair turn without saying what it got wrong, which is the part that explains a result.
  // `warnings` holds the compiler's messages verbatim (a handful of short strings next to a full
  // program, so the payload cost is nil) and is what the repair prompt was built from.
  turnLog?: Array<{
    turn: number; fixable: number; unfixable: number; errors: boolean; cost: number; latencyMs: number;
    buckets: Record<string, number>; warnings: string[];
  }>;
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

/**
 * Compiled, and it authored something — but something ELSE. A prompt that asks for
 * c1-t9 EBSR can come back as hot-text: valid program, wrong design, and both
 * `firstPass` and `finalCompile` score it a win. isStub catches "authored nothing";
 * this catches "authored the wrong thing", for the languages that can tell.
 *
 * The whole check is delegated to verifyExampleForPrompt (src/lib/lang-embedding.ts) —
 * the same helper the batch capture step uses to drop drifted training examples. It
 * derives the INTENDED design from the prompt's own facets (no expectation field on
 * the eval case to keep in sync) and compares it to the code's signature.
 *
 * Tri-state on purpose. `undefined` means unjudgeable — the language has no embedding
 * hook (every dialect but L0175 today), or the prompt declares no target to judge
 * against — and must not be collapsed into "clean", because a rate computed over
 * unjudgeable runs would read as 0% drift on languages that never checked.
 *
 * Reporting only: drift is deliberately NOT folded into firstPass/finalCompile.
 * Compiling and being on-design are different claims, and the compile columns have to
 * stay comparable with the 0166/0176 runs already on disk.
 */
function driftedFromPrompt(lang: string, prompt: string, code?: string): boolean | undefined {
  if (!code) return undefined;
  const verdict = verifyExampleForPrompt(lang, { prompt, code });
  return verdict ? !verdict.ok : undefined;
}

function parseArgs(argv: string[]) {
  const a = { langs: [] as string[], models: ["claude-sonnet-5", "gpt-5.6-terra"],
    trials: 3, limit: 3, out: "model-eval.json", setDir: "data/model-eval",
    labelsDir: "data/model-eval/labels", judge: false, calibrate: false,
    panel: false, allowLeak: false, stamp: true, holdoutOnly: false,
    // --converge N: run each case as an agent SESSION — generate, then repair against the
    // compiler's warnings up to N turns. Default 1 = today's single-shot behavior, so runs on
    // disk stay comparable and the new mode is always an explicit choice.
    converge: 1, fromCheckpoint: undefined as string | undefined,
    calibrateOut: undefined as string | undefined,
    thinking: undefined as unknown, effort: undefined as string | undefined };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--lang") { while (argv[i + 1] && !argv[i + 1].startsWith("--")) a.langs.push(argv[++i]); }
    else if (v === "--models") a.models = argv[++i].split(",").map((s) => s.trim());
    else if (v === "--trials") a.trials = parseInt(argv[++i], 10);
    else if (v === "--converge") a.converge = Math.max(1, parseInt(argv[++i], 10) || 1);
    // Rebuild a run payload from a .partial.jsonl checkpoint — summarize and write the normal
    // output file for a sweep that was interrupted. Generates nothing, costs nothing.
    else if (v === "--from-checkpoint") a.fromCheckpoint = argv[++i];
    // Per-row calibration dump (case, model, human, judge, rationale) for diagnosing WHICH
    // candidates the judge misreads — the aggregate cannot say.
    else if (v === "--calibrate-out") a.calibrateOut = argv[++i];
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

/**
 * Append-as-you-go checkpoint.
 *
 * The payload is written once, after every run finishes. A sweep is now an hours-long job —
 * 63 sessions x up to 5 turns — and a converge sweep that was stopped two sessions from the end
 * lost all 86 completed generations (~$6) because nothing had been written yet. One JSONL line
 * per completed run makes an interrupted sweep salvageable: `--from-checkpoint` turns those lines
 * back into a normal run payload with no generation at all.
 *
 * Deliberately dumb: append one JSON line, never rewrite. A crash mid-write costs the last line,
 * not the file.
 */
function checkpointPath(out: string): string {
  return out.replace(/(\.json)?$/, "") + ".partial.jsonl";
}

function loadCheckpoint(path: string): RunResult[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l) as RunResult; } catch { return null; } })
    .filter((r): r is RunResult => !!r);
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

/**
 * The repair turn, phrased the way an AGENT would phrase it through `update_item`: hand back the
 * compiler's own warning text against the current program and ask for a fix.
 *
 * Deliberately quotes the compiler verbatim rather than paraphrasing. What is being measured is
 * whether a model can act on the feedback the platform actually gives it — a nicer, harness-written
 * hint would measure a channel no real caller has.
 *
 * "Do not change the design" matters: without it a model can clear a thin-pool warning by swapping
 * the item for an easier one, which converges the metric while defeating its purpose. The eval also
 * checks design drift independently (driftedFromPrompt), so that dodge would show up.
 */
function repairPrompt(originalPrompt: string, warnings: string[]): string {
  return [
    "The program you wrote compiles, but the Graffiticode compiler reported these warnings:",
    ...warnings.map((w) => `- ${w}`),
    "",
    "Revise the program to resolve them. Keep the same passage, the same target, the same item",
    "type, and the same correct answer — fix only what the warnings call out.",
    "",
    "For reference, the original request was:",
    originalPrompt,
  ].join("\n");
}

/**
 * One AGENT SESSION for a (case, variant, trial): the initial generation, then up to
 * `maxTurns - 1` compiler-driven repair turns.
 *
 * The loop lives here rather than in the product because `generateCode`'s internal fix loop is
 * error-only (`verificationSucceeded` treats an empty `errors` array as done, so a warning never
 * triggers it). Iterating at this level measures iterate-ability exactly as an agent experiences
 * it today — no production behavior changes, and the single-shot mode (`maxTurns = 1`) stays
 * byte-comparable with the 0166/0176 runs already on disk.
 *
 * Stops on: zero fixable warnings, the turn budget, a hard compile failure (nothing to repair
 * against), or NO PROGRESS — a turn that fails to reduce the fixable count. Without the last one a
 * model that rewrites the same flawed item five times bills five turns to reach turn one's result.
 */
async function runOne(
  auth: any, lang: string, model: string, c: EvalCase, trial: number, precomputed: any[],
  gen: { thinking?: unknown; effort?: string }, maxTurns = 1,
): Promise<RunResult> {
  const t0 = performance.now();
  const base: RunResult = {
    lang, variantId: model, model, family: inferProviderFromModel(model),
    caseId: c.id, trial, ok: false, firstPass: false, finalCompile: false, stub: false,
    fixRounds: 0, latencyMs: 0, inputTokens: 0, outputTokens: 0, cost: 0,
    warningsFixable: 0, warningsUnfixable: 0, turns: 0,
  };
  const acc = { ...base };
  const turnLog: NonNullable<RunResult["turnLog"]> = [];
  let code: string | undefined;
  let prompt = c.prompt;
  let currentCode = c.currentCode ?? null;
  let report = { fixable: [] as any[], unfixable: [] as any[], all: [] as any[], alternativeClaims: null as number | null };
  let turnsToClean: number | null = null;
  let stuck = false;

  try {
    for (let turn = 1; turn <= Math.max(1, maxTurns); turn++) {
      const tTurn = performance.now();
      const res: any = await generateCode({
        auth, prompt, lang, currentCode,
        // pin model → bypasses opt-in + Haiku downgrade; thinking/effort applied
        // identically across models for a matched comparison (undefined ⇒ API default).
        options: { model, thinking: gen.thinking, effort: gen.effort },
        precomputedExamples: precomputed, // identical RAG context across models
        rid: `eval-${lang}-${model}-${c.id}-${trial}-t${turn}`,
      });
      const turnLatency = performance.now() - tTurn;
      const inputTokens = res?.usage?.input_tokens ?? 0;
      const outputTokens = res?.usage?.output_tokens ?? 0;
      const turnCost = costOf(model, inputTokens, outputTokens);

      // compiled ⇔ verification produced a taskId AND we got back code that
      // actually authored something. A stub parses, so it would otherwise score as
      // a first-pass win — the metric would reward emitting nothing.
      const stub = isStub(res?.code);
      const compiled = !!res?.taskId && !!res?.code && !stub;
      const fixRounds = res?.fixAttempts ?? 0;
      const next = typeof res?.code === "string" ? res.code : undefined;
      const prevFixable = report.fixable.length;
      report = warningsFromVerification(res?.verification);

      acc.ok = true;
      acc.inputTokens += inputTokens;
      acc.outputTokens += outputTokens;
      acc.cost += turnCost;
      acc.turns = turn;
      turnLog.push({
        turn, fixable: report.fixable.length, unfixable: report.unfixable.length,
        errors: !compiled, cost: turnCost, latencyMs: turnLatency,
        buckets: bucketCounts([report as any]),
        warnings: report.all.map((w: any) => w.message),
      });

      if (turn === 1) {
        // First-shot columns keep their original meaning: they describe the opening move, so
        // they stay comparable with runs made before convergence existed.
        acc.finalCompile = compiled;
        acc.firstPass = compiled && fixRounds === 0;
        acc.fixRounds = fixRounds;
        acc.stub = stub;
      } else if (compiled) {
        // A repair turn may only improve the session's standing, never revoke a compile.
        acc.finalCompile = true;
        acc.stub = false;
      }
      if (next) code = next;

      // Order matters: a program that did not compile produces NO warnings, so testing
      // "zero fixable warnings" first would read its silence as convergence and stamp a
      // turnsToClean on a run that never worked.
      if (!compiled) break;                       // nothing to repair against
      if (!report.fixable.length) { if (turnsToClean === null) turnsToClean = turn; break; }
      if (turn > 1 && report.fixable.length >= prevFixable) { stuck = true; break; }
      if (turn >= maxTurns) break;

      prompt = repairPrompt(c.prompt, report.fixable.map((w) => w.message));
      currentCode = code ?? currentCode;
    }

    return {
      ...acc,
      latencyMs: performance.now() - t0,
      drift: driftedFromPrompt(lang, c.prompt, code),
      code,
      warningsFixable: report.fixable.length,
      warningsUnfixable: report.unfixable.length,
      warningBuckets: bucketCounts([report as any]),
      unknownWarnings: report.all.filter((w: any) => w.bucket === "unknown").map((w: any) => w.message),
      alternativeClaims: report.alternativeClaims,
      // Convergence is "the compiler has nothing left to say about a WORKING program".
      // Without the finalCompile conjunct, a run that never compiled scores converged —
      // luna's three parse failures reported converged:true and inflated its rate to 100%
      // while its compile rate was 96%.
      converged: acc.finalCompile && report.fixable.length === 0,
      turnsToClean: acc.finalCompile ? turnsToClean : null,
      stuck,
      turnLog,
    };
  } catch (e: any) {
    return { ...acc, latencyMs: performance.now() - t0, turnLog, error: e?.message || String(e) };
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
    // Drift is rated over the JUDGEABLE runs only, not over n. A language with no
    // embedding hook produces all-undefined, and dividing by n would print 0% —
    // "no drift" and "never checked" must not look the same.
    const judgeable = rs.filter((r) => r.drift !== undefined);
    const drifted = judgeable.filter((r) => r.drift).length;
    const lat = ok.map((r) => r.latencyMs);
    const totalCost = rs.reduce((s, r) => s + r.cost, 0);
    // Convergence: the share of sessions that reached zero FIXABLE warnings, the turns it took
    // when they did, and what was still outstanding when they didn't. `turnsToClean` averages
    // over converged runs only — folding in the ones that never converged as if they cost
    // maxTurns would flatter a variant that gives up early.
    const converged = rs.filter((r) => r.converged).length;
    const cleanTurns = rs.map((r) => r.turnsToClean).filter((t): t is number => typeof t === "number");
    rows.push({
      lang, variantId, model, family: rs[0].family, runs: n, errors: n - ok.length,
      firstPassRate: first / n, finalRate: final / n, stubRate: stubs / n,
      driftRate: judgeable.length ? drifted / judgeable.length : null, driftJudged: judgeable.length,
      convergedRate: converged / n,
      avgTurnsToClean: cleanTurns.length ? cleanTurns.reduce((s, t) => s + t, 0) / cleanTurns.length : null,
      avgTurns: rs.reduce((s, r) => s + (r.turns || 0), 0) / n,
      avgWarningsFixable: rs.reduce((s, r) => s + (r.warningsFixable || 0), 0) / n,
      avgWarningsUnfixable: rs.reduce((s, r) => s + (r.warningsUnfixable || 0), 0) / n,
      stuckRate: rs.filter((r) => r.stuck).length / n,
      // See RunResult.alternativeClaims — other supported claims of the same dimension, not
      // pool depth. Retained in the payload, not printed.
      avgAlternativeClaims: (() => {
        const xs = rs.map((r) => r.alternativeClaims).filter((x): x is number => typeof x === "number");
        return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
      })(),
      costPerConverged: converged > 0 ? totalCost / converged : Infinity,
      // Buckets in the FINAL state. After a converged session this is empty by definition, which
      // is why it cannot be the diagnostic — see defectsFirstTurn below.
      warningBuckets: rs.reduce((acc: Record<string, number>, r) => {
        for (const [bucket, k] of Object.entries(r.warningBuckets || {})) acc[bucket] = (acc[bucket] || 0) + k;
        return acc;
      }, {}),
      // What the variant got wrong in its OPENING item, which is the thing that explains a turn
      // count. First turn rather than every turn: a defect that survives a repair would otherwise
      // be counted once per turn and read as several distinct mistakes.
      // Classified from the stored MESSAGES, not from the buckets recorded during the run: the
      // messages are the raw data and the buckets are derived, so re-deriving here means a
      // taxonomy fix applies retroactively to payloads already on disk. (It had to — the sweep
      // that first hit `Only N Part B foil source(s)` recorded it as `unknown`, and rebuilding
      // from its own stored buckets would have preserved the misfiling forever.) Falls back to
      // the stored buckets for older payloads that predate per-turn message capture.
      defectsFirstTurn: rs.reduce((acc: Record<string, number>, r) => {
        const first = r.turnLog?.[0];
        if (first?.warnings?.length) {
          for (const w of first.warnings) {
            const b = classifyWarning(w).bucket;
            acc[b] = (acc[b] || 0) + 1;
          }
        } else {
          for (const [bucket, k] of Object.entries(first?.buckets || {})) acc[bucket] = (acc[bucket] || 0) + k;
        }
        return acc;
      }, {}),
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
    ["lang", "model", "runs", "err", "1st-pass", "final", "conv", "turns", "warn", "drift", "p50", "p90", "$/run", "$/conv"]
      .map((h, i) => h.padEnd([6, 26, 5, 4, 9, 7, 6, 6, 6, 7, 7, 7, 8, 8][i])).join(""));
  for (const r of rows) {
    console.log([
      r.lang.padEnd(6), r.model.padEnd(26), String(r.runs).padEnd(5), String(r.errors).padEnd(4),
      pct(r.firstPassRate).padEnd(9), pct(r.finalRate).padEnd(7),
      pct(r.convergedRate).padEnd(6),
      // Mean turns among runs that DID converge — blank when none did.
      (r.avgTurnsToClean === null ? "—" : r.avgTurnsToClean.toFixed(1)).padEnd(6),
      // Residual fixable warnings per run: what the compiler still objected to at the end.
      r.avgWarningsFixable.toFixed(1).padEnd(6),
      // "—" = nothing judgeable (no embedding hook, or no target in the prompt).
      (r.driftRate === null ? "—" : pct(r.driftRate)).padEnd(7),
      ms(r.latencyP50).padEnd(7), ms(r.latencyP90).padEnd(7),
      ("$" + r.avgCost.toFixed(4)).padEnd(8),
      (r.costPerConverged === Infinity ? "—" : "$" + r.costPerConverged.toFixed(4)).padEnd(8),
    ].join(""));
  }
  // Which defects each variant actually made. A turn count says a model needed help; this says
  // what it needed help WITH, which is the part that transfers into dialect instructions or RAG.
  const anyDefects = rows.some((r) => Object.keys(r.defectsFirstTurn || {}).length);
  if (anyDefects) {
    console.log("\nDefects in the opening item (compiler warnings before any repair turn):");
    for (const r of rows) {
      const parts = Object.entries(r.defectsFirstTurn || {}).sort((a, b) => b[1] - a[1]).map(([b, k]) => `${b}=${k}`);
      console.log(`  ${r.model.padEnd(20)} ${parts.length ? parts.join("  ") : "none"}`);
    }
  }

  const unfixable = rows.reduce((s, r) => s + r.avgWarningsUnfixable, 0);
  if (unfixable > 0) {
    console.log(
      "\nNOTE: stimulus-level warnings (e.g. the prompt's passage reading above grade) are EXCLUDED " +
      "from 'warn' and from convergence — they are the eval set's to fix, not the model's. " +
      `Mean per run across variants: ${(unfixable / rows.length).toFixed(1)}.`,
    );
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
  // `model` and `rationale` ride along so a disagreement is DIAGNOSABLE. The aggregate alone
  // says the judge and the human differ; it cannot say on which candidate or why, and the first
  // question anyone asks of a calibration run is "did it catch the one that mattered?".
  const rows: { lang: string; id: string; model: string | null; human: number; judge: number; rationale: string; authorFamily: LlmProvider | null }[] = [];
  let staleSkipped = 0;
  process.stderr.write("[calibrate] ");
  for (const lang of args.langs) {
    const path = `${args.labelsDir}/${lang}.json`;
    if (!existsSync(path)) { console.error(`\nNo labels at ${path} (see labels/README.md)`); continue; }
    const labels = JSON.parse(readFileSync(path, "utf8")) as any[];
    const prompts = new Map(loadCases(args.setDir, lang).map((c) => [c.id, c.prompt]));
    // The 4-5 band is dialect-specific and versioned. A row scored under an older version was
    // scored against different anchor MEANINGS, so comparing it to a judge on the current ones
    // reports a scale mismatch as judge error — the one failure this gate exists to prevent.
    // Rows with no version predate versioning entirely and are equally unusable.
    // Has the dialect moved since these candidates were generated? Unlike a stale anchor version
    // (which changes what a SCORE means, so those rows are unusable), a moved dialect changes what
    // the CODE means — the program may no longer compile. The score still describes the artifact
    // the human saw, so warn rather than skip, and say how many.
    const liveDialect = await dialectFingerprint(lang);
    const staleDialect = labels.filter((l) => l.overall != null && l.dialect && !sameDialect(l.dialect, liveDialect));
    if (staleDialect.length) {
      console.error(
        `\n[calibrate] L${lang}: ${staleDialect.length} row(s) were generated against dialect ` +
        `${[...new Set(staleDialect.map((l) => l.dialect.hash))].join("/")}, now ${liveDialect.hash}. ` +
        `Their code may no longer compile; re-sweep before treating this as current.`,
      );
    }

    const current = anchorVersion(lang);
    const stale = labels.filter((l) => l.overall != null && l.code && (l.anchorVersion ?? 0) !== current);
    if (stale.length) {
      staleSkipped += stale.length;
      console.error(
        `\n[calibrate] L${lang}: skipping ${stale.length} row(s) scored under anchor version ` +
        `${[...new Set(stale.map((l) => l.anchorVersion ?? "none"))].join("/")} (current is ${current}). Rescore them.`,
      );
    }
    for (const lab of labels) {
      if (lab.overall == null || !lab.code) continue; // skip unlabeled / template rows
      if ((lab.anchorVersion ?? 0) !== current) continue;
      const prompt = lab.prompt || prompts.get(lab.id);
      if (!prompt) { console.error(`\nNo prompt for label ${lang}/${lab.id}`); continue; }
      // Which family AUTHORED the labeled candidate. Calibration has to be read
      // per authoring family: a judge can track human labels well on its own
      // family's output and poorly on the other's, and a single pooled MAE hides
      // exactly that — while being the number that gates the ordering.
      const authorFamily = inferProviderFromModel(lab.model) ?? null;
      const v = await judgeCode({ prompt, code: lab.code, lang });
      process.stderr.write(v ? "." : "!");
      if (v) rows.push({
        lang, id: lab.id, model: lab.model ?? null, human: Number(lab.overall), judge: v.overall,
        rationale: String(v.rationale || ""), authorFamily,
      });
    }
  }
  process.stderr.write("\n");
  if (!rows.length) {
    // Distinguish "nothing scored yet" from "everything scored against retired anchors" — the fix
    // is different (label them vs rescore them), and the generic message sent you looking for
    // missing fields that are all present.
    console.error(staleSkipped
      ? `No usable labels: all ${staleSkipped} scored row(s) were written under a retired anchor version. Rescore them against the current anchors (see data/model-eval/labels/README.md).`
      : "No usable labels found (each needs { id, code, overall }).");
    return;
  }
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

  // Per-row, so a run answers "did the judge catch THAT one?" rather than only "how well does it
  // agree on average". Printed for small sets (the labeling sets are 14-21 rows); --calibrate-out
  // dumps every row as JSON regardless, rationale included.
  if (rows.length <= 40) {
    console.log("\nPer candidate (▲ judge scored above the human, ▼ below):");
    console.log(["case", "model", "human", "judge", ""].map((h, i) => h.padEnd([30, 16, 6, 6, 2][i])).join(""));
    for (const r of [...rows].sort((a, b) => (a.human - a.judge) - (b.human - b.judge) || a.id.localeCompare(b.id))) {
      const d = r.judge - r.human;
      console.log([
        r.id.slice(0, 28).padEnd(30), String(r.model || "?").slice(0, 14).padEnd(16),
        String(r.human).padEnd(6), String(r.judge).padEnd(6),
        (d > 0 ? "▲" : d < 0 ? "▼" : " ").padEnd(2),
      ].join(""));
    }
  }
  if (args.calibrateOut) {
    writeFileSync(args.calibrateOut, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
    console.log(`\nWrote ${rows.length} judged row(s) → ${args.calibrateOut}`);
  }

  console.log("\nThis is the judge's trust gate — widen the CI read: label until it is tight enough for the decision it gates.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Calibration is generation-free (judge only) — short-circuit before requiring an eval account.
  if (args.calibrate) { await runCalibrate(args); return; }

  // Salvage path: rebuild the summary + payload from an interrupted sweep's checkpoint. Also
  // generation-free, so it short-circuits ahead of the hold-out gate and the eval account.
  if (args.fromCheckpoint) {
    if (!existsSync(args.fromCheckpoint)) { console.error(`No checkpoint at ${args.fromCheckpoint}`); process.exit(1); }
    const runs = loadCheckpoint(args.fromCheckpoint);
    if (!runs.length) { console.error(`Checkpoint is empty: ${args.fromCheckpoint}`); process.exit(1); }
    const summary = summarize(runs);
    printTable(summary);
    const out = args.out.replace(/(\.json)?$/, "-from-checkpoint.json");
    writeFileSync(out, JSON.stringify({
      generatedAt: new Date().toISOString(),
      holdout: "enforced (inherited from the interrupted run)",
      // Loud, because a partial sweep is not a balanced design: whichever variants the loop had
      // reached have more runs than the rest, so cross-variant rates are not directly comparable.
      partial: `rebuilt from ${args.fromCheckpoint} — ${runs.length} runs; the sweep did not finish`,
      args, summary, runs,
    }, null, 2));
    console.log(`\nRebuilt ${runs.length} runs → ${out}`);
    // Only warn when the design is actually unbalanced. A checkpoint rebuild is not inherently
    // partial — a merged one can be complete — and crying partial over a balanced set trains the
    // reader to ignore the notice on the runs where it matters.
    const perVariant = new Map<string, Set<string>>();
    const counts = new Map<string, number>();
    for (const r of runs) {
      counts.set(r.variantId, (counts.get(r.variantId) || 0) + 1);
      (perVariant.get(r.variantId) ?? perVariant.set(r.variantId, new Set()).get(r.variantId)!).add(r.caseId);
    }
    const balanced = new Set([...counts.values()]).size === 1 && new Set([...perVariant.values()].map((s) => s.size)).size === 1;
    console.log(balanced
      ? `Balanced: every variant has ${[...counts.values()][0]} runs over ${[...perVariant.values()][0].size} cases.`
      : "PARTIAL: run counts or case coverage differ per variant; treat rates as indicative, not as a settled comparison.");
    return;
  }

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

  // Timestamped by default. `--out` alone clobbered the previous run, so there was
  // no way to see whether a model got better or worse between runs — which is the
  // only way to catch a regression after an ordering is committed. --no-stamp
  // restores the old single-file behavior for scripted use.
  //
  // Resolved BEFORE the run, not after it, because the checkpoint hangs off the same path. With
  // the stamp applied only at write time, every run's checkpoint was `<out>.partial.jsonl` — so a
  // second sweep appended to the first one's rows and --from-checkpoint would rebuild a payload
  // silently blending two runs.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = args.stamp ? args.out.replace(/(\.json)?$/, `-${stamp}.json`) : args.out;
  const ckptPath = checkpointPath(outPath);

  const allRuns: RunResult[] = [];
  for (const lang of args.langs) {
    const cases = loadCases(args.setDir, lang);
    if (!cases.length) continue;
    // Fingerprint BEFORE generating: a dialect that ships mid-sweep would otherwise be recorded
    // as whatever it happened to be when the run finished.
    const fingerprint = await dialectFingerprint(lang);
    console.error(`[${lang}] dialect ${formatFingerprint(fingerprint)}`);
    console.error(`\n[${lang}] ${cases.length} cases × ${args.models.length} models × ${args.trials} trials`);
    for (const c of cases) {
      // Retrieve RAG examples ONCE, reuse for every model (isolation).
      const precomputed = (await getRelevantExamples({ prompt: c.prompt, lang, limit: args.limit, rid: null })) || [];
      for (const model of args.models) {
        for (let t = 0; t < args.trials; t++) {
          const r = await runOne(auth, lang, model, c, t, precomputed, { thinking: args.thinking, effort: args.effort }, args.converge);
          r.dialect = fingerprint;
          allRuns.push(r);
          try { appendFileSync(ckptPath, JSON.stringify(r) + "\n"); } catch { /* never fail a run over a checkpoint write */ }
          // 'd' outranks '.'/'o': a drifted program compiled, but the stream should
          // not read as a clean win when the design came out wrong. In converge mode a
          // digit shows how many turns the session took, and 'w' marks one that ran out
          // of turns (or got stuck) with the compiler still objecting.
          process.stderr.write(
            r.ok
              ? (r.stub ? "s"
                : !r.finalCompile ? "x"
                : r.drift ? "d"
                : !r.converged ? "w"
                : args.converge > 1 ? String(Math.min(9, r.turns))
                : r.firstPass ? "." : "o")
              : "!",
          );
        }
      }
    }
  }
  process.stderr.write("\n");

  const summary = summarize(allRuns);
  printTable(summary);
  console.log(
    args.converge > 1
      ? "Legend: <n> converged in n turn(s)  'w' warnings remained (budget or stuck)  'd' off-design (facet drift)  's' stub (authored nothing)  'x' never compiled  '!' error"
      : "Legend: '.' first-pass compile  'o' compiled after fixes  'w' compiled with warnings  'd' compiled but off-design (facet drift)  's' stub (parsed, authored nothing)  'x' never compiled  '!' error",
  );

  // Columns the table no longer prints must still be able to raise their hand, or dropping them
  // from the layout would silently retire the signal they were added for.
  const stubs = summary.reduce((s, r) => s + r.stubRate * r.runs, 0);
  if (stubs > 0) console.log(`NOTE: ${stubs} run(s) emitted a stub (parsed, authored nothing) — see stubRate in the run payload.`);
  // Scan EVERY turn, not the final state. An unclassified warning that a repair turn fixed leaves
  // no trace in the final report, so the first version of this notice stayed silent through a
  // sweep that hit two of them — the taxonomy gap only showed up as `unknown=2` in a breakdown.
  const unknown = [...new Set(allRuns.flatMap((r) =>
    (r.turnLog || []).flatMap((t) => (t.warnings || []).filter((w) => classifyWarning(w).bucket === "unknown")),
  ))];
  if (unknown.length) {
    console.log(`NOTE: ${unknown.length} unclassified compiler warning(s) — counted as fixable; add them to scripts/eval-warning-taxonomy.ts:`);
    for (const m of unknown.slice(0, 8)) console.log(`  · ${m.slice(0, 140)}`);
  }
  const stuckRuns = allRuns.filter((r) => r.stuck).length;
  if (stuckRuns > 0) console.log(`NOTE: ${stuckRuns} session(s) stopped early on no-progress (a repair turn failed to reduce the fixable warning count).`);

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

  const payload = {
    generatedAt: new Date().toISOString(),
    // The exact ordering this run would justify, so the committed MODEL_PRIORITY
    // line can be traced back to the numbers behind it.
    holdout: args.allowLeak ? "LEAK-ALLOWED — do not use to set an ordering" : "enforced",
    // One entry per dialect measured, so the payload answers "against what?" without walking runs.
    dialects: Object.fromEntries(
      [...new Set(allRuns.map((r) => r.lang))].map((l) => [l, allRuns.find((r) => r.lang === l)?.dialect ?? null]),
    ),
    args, summary, runs: allRuns,
    ...(judgements ? { judgements } : {}),
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${allRuns.length} runs${judgements ? " + judge scores" : ""} + summary → ${outPath}`);
  console.log(`Checkpoint (per-run, written as the sweep ran): ${ckptPath}`);
  if (judgements && !args.panel) {
    console.log("NOTE: single-judge scores. Re-run with --panel before setting a cross-family ordering.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
