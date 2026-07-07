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
 * Built on the same raw-axios POST /v1/messages pattern as spec/router calls (there is no
 * @anthropic-ai/sdk in this repo). Deliberately does NOT import from code-generation-service to
 * avoid a code-gen ↔ judge import cycle (code-gen imports judgeCode); the temperature guard and
 * default model are inlined instead.
 */
import axios from "axios";
import { getJudgeConfig } from "./rag-config";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const JUDGE_MAX_TOKENS = 1024;

// Mirror of code-generation-service.modelRejectsTemperature — Opus 4.x / Sonnet 5 / Fable / Mythos
// 400 on `temperature`. Kept local to avoid importing code-generation-service (cycle).
const rejectsTemperature = (model: string) => /(opus|sonnet-5|fable|mythos)/i.test(model || "");

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

// Router-style structured parse: first {...} block, then JSON.parse. Never throws.
function parseJson(text: string): any | null {
  const m = (text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

async function callJudge(system: string, user: string, model: string, apiKey: string, timeoutMs: number): Promise<string> {
  const resp = await axios.post(
    ANTHROPIC_URL,
    {
      model,
      system,
      messages: [{ role: "user", content: user }],
      max_tokens: JUDGE_MAX_TOKENS,
      ...(rejectsTemperature(model) ? {} : { temperature: 0 }),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      timeout: timeoutMs,
    },
  );
  return resp.data?.content?.[0]?.text ?? "";
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
  model?: string;
  apiKey?: string;
}

/**
 * Pointwise: score one candidate against the intent. Returns null on any failure (missing key,
 * API error, unparseable verdict) so callers never have to guard against a throw.
 */
export async function judgeCode(args: JudgeCodeArgs): Promise<JudgeVerdict | null> {
  const cfg = getJudgeConfig();
  const model = args.model || cfg.judgeModel;
  const apiKey = args.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const system = `${RUBRIC}

Then an overall 1–5, anchored (correctness dominates — a clean program that computes the wrong value
is at most a 3):
  5 = correct, complete, idiomatic — nothing to change.
  4 = correct and complete; only minor polish issues (formatting, numbers-as-text, awkward structure).
  3 = on-intent but materially flawed — a requirement missing, or a formula a user would notice is wrong.
  2 = renders but wrong — misses the core ask, or the central logic is wrong.
  1 = broken or off-task.

Return ONLY a JSON object, no prose, no code fences. All four score fields are REQUIRED integers 1–5
(never omit "overall"); put "rationale" LAST:
{"correctness":N,"instructionFollowing":N,"idiomaticity":N,"overall":N,"rationale":"cite the specific defect(s), or 'all requirements verified correct'"}`;
  const user = `${intentBlock(args.prompt, args.lang, args.spec, args.currentCode)}

CANDIDATE:
${args.code}`;

  const t0 = performance.now();
  try {
    const text = await callJudge(system, user, model, apiKey, cfg.judgeTimeoutMs);
    const o = parseJson(text);
    if (!o) return null;
    const correctness = score5(pick(o, "correctness"));
    const instructionFollowing = score5(pick(o, "instructionFollowing", "instruction_following"));
    const idiomaticity = score5(pick(o, "idiomaticity"));
    // A verdict missing any dimension is unusable — skip it rather than record a 0.
    if (correctness === null || instructionFollowing === null || idiomaticity === null) return null;
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
    return null;
  }
}

type Side = "A" | "B" | "tie";
function normSide(v: any): Side {
  const s = String(v || "").trim().toUpperCase();
  return s === "A" ? "A" : s === "B" ? "B" : "tie";
}
function flip(s: Side): Side {
  return s === "A" ? "B" : s === "B" ? "A" : "tie";
}

async function judgeOnce(prompt: string, lang: string, first: string, second: string, spec: string | null | undefined, model: string, apiKey: string, timeoutMs: number): Promise<{ winner: Side; dims: Record<string, Side> } | null> {
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
    const text = await callJudge(system, user, model, apiKey, timeoutMs);
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
  model?: string;
  apiKey?: string;
}

/**
 * Pairwise, blind, order-controlled: run BOTH A/B orderings (positions swapped) and require
 * agreement on the overall winner; on disagreement, call it a tie (position bias). Per-dimension
 * verdicts are combined the same way. Returns null if either ordering fails.
 */
export async function judgePair(args: JudgePairArgs): Promise<PairVerdict | null> {
  const cfg = getJudgeConfig();
  const model = args.model || cfg.judgeModel;
  const apiKey = args.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Ordering 1: A=codeA, B=codeB. Ordering 2: A=codeB, B=codeA (flip the verdict back).
  const r1 = await judgeOnce(args.prompt, args.lang, args.codeA, args.codeB, args.spec, model, apiKey, cfg.judgeTimeoutMs);
  const r2 = await judgeOnce(args.prompt, args.lang, args.codeB, args.codeA, args.spec, model, apiKey, cfg.judgeTimeoutMs);
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
