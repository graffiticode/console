/**
 * Compiler-warning extraction and classification for the eval harness.
 *
 * WHY THIS EXISTS. The 0175 sweep reported 100% compile across three variants while 35 of its 60
 * compile results carried warnings — dangling evidence ids, bare distractor pools, length
 * giveaways. Compiling is table stakes for this dialect; the warnings ARE the quality signal, and
 * they were being discarded. `generateCode` already returns them (its `verification` result), so
 * this is pure extraction, not new plumbing.
 *
 * THE FIXABLE/UNFIXABLE SPLIT is the load-bearing part. The convergence loop asks a model to repair
 * what the compiler complained about, so a warning the model cannot legitimately fix must not drive
 * it. `Passage reads above grade 5` is about the stimulus the PROMPT supplied — 27 of the 68
 * messages in the baseline sweep, 40% of the total. Feeding that back tells a model to rewrite the
 * user's passage, which is both wrong and unwinnable, and would score every variant as "never
 * converged". So unfixable buckets are reported and excluded from the convergence target.
 *
 * Matchers are written against the 11 distinct message shapes the L0175 compiler actually emitted
 * in that sweep, not against guesses. An unrecognized message classifies as `unknown` + fixable and
 * is surfaced by `unknownWarnings()`, so a new compiler warning shows up as a miss to fix here
 * rather than silently leaving the metric.
 */

export type WarningBucket =
  | "passage-level"
  | "missing-task-model"
  | "dangling-reference"
  | "thin-pool"
  | "giveaway"
  | "unknown";

export interface ClassifiedWarning {
  message: string;
  bucket: WarningBucket;
  fixable: boolean;
}

/**
 * Buckets whose warnings the model cannot fix without rewriting content it was given. Kept as a
 * set rather than a flag on each rule so the policy is one readable line.
 */
const UNFIXABLE: ReadonlySet<WarningBucket> = new Set<WarningBucket>(["passage-level"]);

const RULES: Array<[RegExp, WarningBucket]> = [
  // "Passage reads above grade 5 (est. grade 8.1); shorten sentences and use simpler…"
  [/passage reads (?:above|below) grade/i, "passage-level"],
  // "Outcome 'q1' does not specify a task-model; add one (e.g. `task-model tm3`)…"
  [/does not specify a task-model/i, "missing-task-model"],
  // "claim 'd4' cites unknown evidence id 'e2'."
  [/cites unknown evidence id/i, "dangling-reference"],
  // "Only 2 distractor claim(s) target this outcome; this item wants 3"
  // "Only 4 viable distractor(s) target outcome 'q1'; author at least 5…"
  // "Only 3 non-supporting evidence source(s) available; author at least 5"
  // "Only 3 Part B foil source(s) available; author at least 5 non-supporting evidence lines…"
  // "Distractor error types not represented: insignificant."
  //
  // Deliberately matches "Only N …" followed by ANY pool noun rather than enumerating the
  // phrasings: the first version of this rule listed the three shapes present in the baseline
  // sweep and then missed "Part B foil source(s)" in the very next run — same defect, different
  // wording. Every one of these warnings means the same thing (the authored pool is too shallow),
  // so the rule should key on that, not on the compiler's current sentence.
  [/only \d+ .{0,40}(?:distractor|source|foil|claim)/i, "thin-pool"],
  [/error types not represented/i, "thin-pool"],
  // "Part A/Part B/Options: the correct option (…) is 60% longer … possible length giveaway."
  // "Part B options do not overlap the correct Part A option — possible A↔B giveaway."
  [/giveaway/i, "giveaway"],
];

export function classifyWarning(message: string): ClassifiedWarning {
  const text = String(message || "");
  for (const [re, bucket] of RULES) {
    if (re.test(text)) return { message: text, bucket, fixable: !UNFIXABLE.has(bucket) };
  }
  // Unknown defaults to FIXABLE: a warning we don't recognize is more likely a real defect than a
  // stimulus complaint, and treating it as unfixable would quietly shrink the convergence target.
  return { message: text, bucket: "unknown", fixable: true };
}

/**
 * Every composed item in a verification result, across the three shapes the compiler returns
 * (single item / `{kind:"items", items:[…]}` / bare array). Mirrors `toItems()` inside
 * @graffiticode/l0175, which is module-private there.
 */
function toItems(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.kind === "items" && Array.isArray(data.items)) return data.items;
  if (data.kind === "item") return [data];
  if (data.type) return [data]; // lenient: a bare item-shaped object
  return [];
}

export interface WarningReport {
  all: ClassifiedWarning[];
  fixable: ClassifiedWarning[];
  unfixable: ClassifiedWarning[];
  /** Leftover foil depth the compiler reports per item after composition; summed. Lower is thinner. */
  alternativeClaims: number | null;
}

/**
 * Pull the compiler's warnings (and its own `review.alternativeClaims` pool-depth measure) out of
 * a `generateCode` result's `verification` field. Returns an empty report rather than throwing when
 * the language emits no such structure, so non-L0175 evals are unaffected.
 */
export function warningsFromVerification(verification: any): WarningReport {
  const items = toItems(verification?.data);
  const all: ClassifiedWarning[] = [];
  let alternativeClaims: number | null = null;
  for (const item of items) {
    for (const w of item?.warnings || []) all.push(classifyWarning(typeof w === "string" ? w : String(w?.message ?? w)));
    const alt = item?.review?.alternativeClaims;
    if (typeof alt === "number") alternativeClaims = (alternativeClaims ?? 0) + alt;
  }
  return {
    all,
    fixable: all.filter((w) => w.fixable),
    unfixable: all.filter((w) => !w.fixable),
    alternativeClaims,
  };
}

/** Distinct unrecognized messages — print these after a run so the taxonomy can be extended. */
export function unknownWarnings(reports: WarningReport[]): string[] {
  const seen = new Set<string>();
  for (const r of reports) {
    for (const w of r.all) if (w.bucket === "unknown") seen.add(w.message);
  }
  return [...seen];
}

/** Counts by bucket, for the run payload and the console summary. */
export function bucketCounts(reports: WarningReport[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of reports) {
    for (const w of r.all) out[w.bucket] = (out[w.bucket] || 0) + 1;
  }
  return out;
}
