/**
 * LLM-as-judge — a single shared code-quality scorer, used two ways:
 *   - OFFLINE, in scripts/model-eval.ts: pairwise model comparison (win-rate) + per-run
 *     pointwise scores, so model/prompt changes can be judged above the (saturated) compile line.
 *   - INLINE (async), from generateCode: fire-and-forget after the response is returned, logging
 *     a pointwise score to rag_analytics/{requestId} with zero user-facing latency (JUDGE_MODE=async).
 *
 * One module so the rubric and prompt live in exactly one place — offline metrics and inline logs
 * are then directly comparable. Reference-free: the eval sets and live requests have no gold answer,
 * so the judge scores the candidate against the prompt (intent) alone, on three rubric dimensions.
 *
 * Provider-neutral: calls run through llm-generation-service's completeOnce, so the judge can be
 * an Anthropic OR an OpenAI model. That matters for cross-family comparison — a Claude judge scoring
 * Claude-vs-GPT output is grading its own family's work, so judgePanel (below) runs one judge per
 * family and the harness measures the disagreement rather than assuming it away.
 *
 * Imports llm-generation-service, not code-generation-service: the latter imports judgeCode, and
 * going through it would close a cycle. The tier/model tables live in llm-models, which is
 * cycle-free.
 */
import {
  completeOnce,
  type SystemPrompt,
} from "./llm-generation-service";
import {
  inferProviderFromModel,
  modelForProvider,
  type LlmProvider,
} from "./llm-models";
import { getJudgeConfig } from "./rag-config";

const JUDGE_MAX_TOKENS = 2048; // room for a reason-before-score <analysis> block + the JSON verdict

export interface JudgeVerdict {
  correctness: number;          // 1–5: does the code correctly accomplish what the prompt asks
  instructionFollowing: number; // 1–5: did it do specifically what was asked (no more, no less)
  idiomaticity: number;         // 1–5: clean, idiomatic Graffiticode for the dialect
  overall: number;              // 1–5: holistic quality
  rationale: string;
  model: string;
  latencyMs: number;
}

export interface PairVerdict {
  winner: "A" | "B" | "tie";
  byDimension: {
    correctness: "A" | "B" | "tie";
    instructionFollowing: "A" | "B" | "tie";
    idiomaticity: "A" | "B" | "tie";
  };
  agreed: boolean; // true when the two A/B orderings agree on the overall winner
  model: string;
}

/**
 * The 1-5 `overall` scale, in one place.
 *
 * These anchors were maintained in three hand-kept copies — this prompt,
 * data/model-eval/labels/README.md, and scripts/gen-label-worksheet.ts. Since
 * --calibrate measures judge-vs-human agreement, any drift between the copies
 * corrupts the trust gate itself: the judge and the human would be scoring
 * against different scales and the disagreement would look like judge error.
 * The worksheet now renders from this constant; the README points here as
 * canonical.
 */
export const OVERALL_ANCHORS: Array<{ score: number; meaning: string }> = [
  { score: 1, meaning: "Broken or off-task — doesn't render, or renders something unrelated to the intent." },
  { score: 2, meaning: "Renders but **wrong** — misses the core ask, or the central logic is wrong." },
  { score: 3, meaning: "On-intent but **materially flawed** — a requirement missing, or a formula a user would notice is wrong." },
  { score: 4, meaning: "Correct and complete; only **minor** polish issues (formatting, numbers-as-text, awkward structure)." },
  { score: 5, meaning: "Correct, complete, idiomatic — nothing to change." },
];

/** Why the scale is anchored low — shared by the judge prompt and the human worksheet. */
export const ANCHOR_DISCIPLINE =
  "Compiling/rendering is saturated and is table stakes, NOT quality: \"it renders\" is a 2, not a " +
  "free 3. Correctness dominates presentation — a clean program that computes the wrong value is at " +
  "most a 3. Do not default to high scores.";

/** Markdown table of the anchors, for the human labeling worksheet. */
export function anchorTableMarkdown(): string {
  return [
    "| overall | meaning |",
    "|---|---|",
    ...OVERALL_ANCHORS.map((a) => `| **${a.score}** | ${a.meaning} |`),
  ].join("\n");
}

const RUBRIC = `You are a strict, discriminating judge of Graffiticode DSL code — a family of domain-specific
languages (spreadsheets, assessments, charts, …); each request targets one dialect. You are given the
natural-language request (the author's INTENT) and one or more candidate programs. There is NO
reference solution — judge each candidate on how well it realizes the intent.

Method — do this BEFORE scoring:
1. Enumerate the discrete requirements in the intent (each value, column, formula, condition, format).
2. For EACH requirement, verify whether the candidate satisfies it — trace the actual formulas and
   logic, do not assume. A well-formed formula that computes the wrong thing (wrong operand, wrong
   condition, wrong base, flat where tiered was asked, tax on the wrong subtotal, …) is a FAILURE.
3. The single worst material failure caps the score — correctness dominates presentation.

Scoring discipline:
- Compiling/rendering is table stakes, NOT quality. A program that renders but gets the central logic
  wrong is poor, not average — do not give credit for merely running.
- Do NOT default to high scores. Reserve the top score for candidates that are correct, complete, AND
  idiomatic. If any requirement is unmet or any formula is wrong, it is not a top score.
- Be concrete: name the specific requirement(s) missed or formula(s) wrong; only say "all requirements
  verified correct" when you have actually checked each one.

Score these dimensions, each an integer 1–5:
- correctness: is every value / formula / condition / structure actually right for the intent?
- instructionFollowing: is every requested element present, and nothing extraneous added?
- idiomaticity: clean, minimal, idiomatic Graffiticode for this dialect?`;

// Coerce to an integer in 1–5, or null when missing/non-numeric. NEVER 0: 0 is
// outside the rubric, and a missing field silently scored 0 reads as "worst" and
// poisons aggregates (the model intermittently omits `overall` under the rubric).
function score5(n: any): number | null {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return null;
  return Math.min(5, Math.max(1, x));
}

function pick(o: any, ...keys: string[]): any {
  for (const k of keys) if (o[k] !== undefined) return o[k];
  return undefined;
}

// String-aware forward scan collecting every balanced top-level {...} object that
// parses. Robust to a reason-before-score <analysis> block that contains braces
// (formulas, "{}" cells) ahead of the verdict — unlike a greedy first-to-last regex.
function extractJsonObjects(text: string): any[] {
  const s = text || "", out: any[] = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") { if (depth === 0) start = i; depth++; }
    else if (c === "}" && depth > 0) {
      if (--depth === 0 && start !== -1) {
        try { out.push(JSON.parse(s.slice(start, i + 1))); } catch { /* skip non-JSON */ }
        start = -1;
      }
    }
  }
  return out;
}

// The verdict is the LAST verdict-shaped object (after any reasoning). Never throws.
function parseJson(text: string): any | null {
  const objs = extractJsonObjects(text);
  if (!objs.length) {
    const m = (text || "").match(/\{[\s\S]*\}/); // fallback: greedy single block
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i];
    if (o && (o.overall !== undefined || o.correctness !== undefined || o.winner !== undefined)) return o;
  }
  return objs[objs.length - 1];
}

/**
 * One judge call. The provider is derived from the model id, so a judge model is
 * the only thing a caller picks — there is no separate provider argument to get
 * out of sync with it.
 *
 * Temperature is left to the adapter's own model rules (completeOnce → the
 * provider adapter drops it where the model rejects it), which is why the local
 * copy of the temperature guard is gone.
 */
async function callJudge(
  system: SystemPrompt,
  user: string,
  model: string,
  timeoutMs: number,
): Promise<string> {
  const provider = inferProviderFromModel(model);
  if (!provider) throw new Error(`Unrecognized judge model "${model}"`);
  const { content, failure } = await completeOnce({
    provider,
    model,
    systemPrompt: system,
    messages: [{ role: "user", content: user }],
    options: { maxTokens: JUDGE_MAX_TOKENS, temperature: 0, timeoutMs },
  });
  if (failure) throw new Error(failure.message);
  return content;
}

/**
 * Validate a judge model and confirm its provider has a credential.
 *
 * Returns null rather than throwing, because both callers already contract to
 * return null on any failure — a judge is an observer, and a missing OPENAI_API_KEY
 * should silently drop that judge from a panel, not fail the run being scored.
 */
function resolveJudgeModel(model: string | undefined): string | null {
  if (!model) return null;
  const provider = inferProviderFromModel(model);
  if (!provider) return null;
  const key = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  return key ? model : null;
}

/** The quality-tier model for a family — the default judge for that family. */
export function judgeModelForFamily(family: LlmProvider): string {
  return modelForProvider(family, "quality");
}

function intentBlock(prompt: string, lang: string, spec?: string | null, currentCode?: string | null): string {
  const parts = [`Dialect: L${lang}`, ``, `REQUEST (author intent):`, prompt];
  if (currentCode) parts.push(``, `PRIOR CODE (this was an edit of):`, currentCode);
  if (spec) parts.push(``, `INTENT ANCHOR (platform-neutral spec of the produced item):`, spec);
  return parts.join("\n");
}

interface JudgeCodeArgs {
  prompt: string;
  code: string;
  lang: string;
  spec?: string | null;
  currentCode?: string | null;
  /** Judge model id; its provider is inferred. Defaults to JUDGE_MODEL. */
  model?: string;
}

/**
 * Pointwise: score one candidate against the intent. Returns null on any failure (missing key,
 * API error, unparseable verdict) so callers never have to guard against a throw.
 */
export async function judgeCode(args: JudgeCodeArgs): Promise<JudgeVerdict | null> {
  const cfg = getJudgeConfig();
  const model = resolveJudgeModel(args.model || cfg.judgeModel);
  if (!model) return null;

  const system = `${RUBRIC}

Then an overall 1–5. ${ANCHOR_DISCIPLINE}
${[...OVERALL_ANCHORS].reverse().map((a) => `  ${a.score} = ${a.meaning.replace(/\*\*/g, "")}`).join("\n")}

First work through the Method in an <analysis>…</analysis> block: list the intent's requirements, then
check EACH against the candidate — name the formula/value and say whether it is right. Reason to the
score; do not pre-commit to a high one. THEN, after </analysis>, output the verdict as a single JSON
object (no code fences). All four score fields are REQUIRED integers 1–5 (never omit "overall"); put
"rationale" LAST:
{"correctness":N,"instructionFollowing":N,"idiomaticity":N,"overall":N,"rationale":"cite the specific defect(s), or 'all requirements verified correct'"}`;
  const user = `${intentBlock(args.prompt, args.lang, args.spec, args.currentCode)}

CANDIDATE:
${args.code}`;

  // One retry: at ~1.0 temp the judge occasionally emits malformed / missing-field
  // JSON, which would silently drop the item from the sample. Retry once before giving up.
  const t0 = performance.now();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callJudge(system, user, model, cfg.judgeTimeoutMs);
      const o = parseJson(text);
      if (!o) continue;
      const correctness = score5(pick(o, "correctness"));
      const instructionFollowing = score5(pick(o, "instructionFollowing", "instruction_following"));
      const idiomaticity = score5(pick(o, "idiomaticity"));
      // A verdict missing any dimension is unusable — retry rather than record a 0.
      if (correctness === null || instructionFollowing === null || idiomaticity === null) continue;
      // The judge intermittently omits `overall`; repair from the dimension mean
      // instead of recording a spurious 0 that would floor the aggregate.
      const overall = score5(pick(o, "overall")) ?? Math.round((correctness + instructionFollowing + idiomaticity) / 3);
      return {
        correctness,
        instructionFollowing,
        idiomaticity,
        overall,
        rationale: typeof o.rationale === "string" ? o.rationale.slice(0, 1000) : "",
        model,
        latencyMs: Math.round(performance.now() - t0),
      };
    } catch {
      // fall through to retry
    }
  }
  return null;
}

type Side = "A" | "B" | "tie";
function normSide(v: any): Side {
  const s = String(v || "").trim().toUpperCase();
  return s === "A" ? "A" : s === "B" ? "B" : "tie";
}
function flip(s: Side): Side {
  return s === "A" ? "B" : s === "B" ? "A" : "tie";
}

async function judgeOnce(prompt: string, lang: string, first: string, second: string, spec: string | null | undefined, model: string, timeoutMs: number): Promise<{ winner: Side; dims: Record<string, Side> } | null> {
  const system = `${RUBRIC}

Two candidates, A and B. Decide which better realizes the intent overall and per dimension. Ties allowed.
Return ONLY a JSON object, no prose, no code fences:
{"winner":"A|B|tie","correctness":"A|B|tie","instructionFollowing":"A|B|tie","idiomaticity":"A|B|tie","rationale":"one sentence"}`;
  const user = `${intentBlock(prompt, lang, spec)}

CANDIDATE A:
${first}

CANDIDATE B:
${second}`;
  try {
    const text = await callJudge(system, user, model, timeoutMs);
    const o = parseJson(text);
    if (!o) return null;
    return {
      winner: normSide(pick(o, "winner")),
      dims: {
        correctness: normSide(pick(o, "correctness")),
        instructionFollowing: normSide(pick(o, "instructionFollowing", "instruction_following")),
        idiomaticity: normSide(pick(o, "idiomaticity")),
      },
    };
  } catch {
    return null;
  }
}

interface JudgePairArgs {
  prompt: string;
  codeA: string;
  codeB: string;
  lang: string;
  spec?: string | null;
  /** Judge model id; its provider is inferred. Defaults to JUDGE_MODEL. */
  model?: string;
}

/**
 * Pairwise, blind, order-controlled: run BOTH A/B orderings (positions swapped) and require
 * agreement on the overall winner; on disagreement, call it a tie (position bias). Per-dimension
 * verdicts are combined the same way. Returns null if either ordering fails.
 */
export async function judgePair(args: JudgePairArgs): Promise<PairVerdict | null> {
  const cfg = getJudgeConfig();
  const model = resolveJudgeModel(args.model || cfg.judgeModel);
  if (!model) return null;

  // Ordering 1: A=codeA, B=codeB. Ordering 2: A=codeB, B=codeA (flip the verdict back).
  const r1 = await judgeOnce(args.prompt, args.lang, args.codeA, args.codeB, args.spec, model, cfg.judgeTimeoutMs);
  const r2 = await judgeOnce(args.prompt, args.lang, args.codeB, args.codeA, args.spec, model, cfg.judgeTimeoutMs);
  if (!r1 || !r2) return null;

  const combine = (a: Side, bRaw: Side): Side => {
    const b = flip(bRaw); // r2 was positionally flipped
    if (a === b) return a;
    return "tie";
  };

  const winner = combine(r1.winner, r2.winner);
  return {
    winner,
    byDimension: {
      correctness: combine(r1.dims.correctness, r2.dims.correctness),
      instructionFollowing: combine(r1.dims.instructionFollowing, r2.dims.instructionFollowing),
      idiomaticity: combine(r1.dims.idiomaticity, r2.dims.idiomaticity),
    },
    agreed: flip(r2.winner) === r1.winner,
    model,
  };
}

// ── Cross-provider panel (OFFLINE / HARNESS ONLY) ────────────────────────────
//
// Do NOT call this from the inline production path. `judgeCode` is what
// generateCode uses, one call per request; a panel multiplies that per-request
// cost by the number of judges for a signal production does not act on. The
// panel exists to answer a question only the harness asks: when we rank model
// FAMILIES against each other, how much of the ranking is the judge preferring
// its own family?
//
// A single-family judge cannot answer that about itself. Running one judge per
// family and reporting the disagreement makes the bias measurable instead of
// assumed — and where the judges disagree, the honest move is a human label, not
// a tiebreak. Position bias is already handled separately by judgePair, which
// runs both A/B orderings; this is the provider-bias analogue, not a replacement.

export interface PanelEntry {
  /** Family of the JUDGE (not of the candidate). */
  judge: LlmProvider;
  model: string;
  verdict: JudgeVerdict | null;
}

export interface PanelVerdict {
  entries: PanelEntry[];
  /** Judges that returned a usable verdict. */
  scored: PanelEntry[];
  /** Mean `overall` across scored judges, or null when none scored. */
  meanOverall: number | null;
  /** Largest pairwise gap in `overall` between judges — 0 with fewer than two. */
  spread: number;
  /**
   * True when every scored judge lands within one point on `overall`. Below that,
   * the panel is not a usable ranking signal for this candidate and the case
   * should go to a human label.
   */
  agreed: boolean;
}

/**
 * Score one candidate with one judge per family.
 *
 * `judges` defaults to both families' quality-tier models. A family with no
 * credential is dropped (resolveJudgeModel returns null), so this degrades to a
 * single-judge run rather than failing — but `scored.length` then tells the
 * caller it cannot measure self-preference, and it should say so rather than
 * report a bias of zero.
 */
export async function judgePanel(args: {
  prompt: string;
  code: string;
  lang: string;
  spec?: string | null;
  currentCode?: string | null;
  judges?: LlmProvider[];
}): Promise<PanelVerdict> {
  const families = args.judges?.length ? args.judges : (["anthropic", "openai"] as LlmProvider[]);
  const entries: PanelEntry[] = [];

  for (const family of families) {
    const model = judgeModelForFamily(family);
    const verdict = await judgeCode({
      prompt: args.prompt,
      code: args.code,
      lang: args.lang,
      spec: args.spec,
      currentCode: args.currentCode,
      model,
    });
    entries.push({ judge: family, model, verdict });
  }

  const scored = entries.filter((e) => e.verdict);
  const overalls = scored.map((e) => e.verdict!.overall);
  const meanOverall = overalls.length
    ? overalls.reduce((s, x) => s + x, 0) / overalls.length
    : null;
  const spread = overalls.length > 1 ? Math.max(...overalls) - Math.min(...overalls) : 0;
  return { entries, scored, meanOverall, spread, agreed: spread <= 1 };
}
