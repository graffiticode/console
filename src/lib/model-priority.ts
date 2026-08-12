// Ordered model-family priority, per language — and, optionally, the TIER each family
// serves that language at.
//
// This is a STATIC HINT produced by offline evaluation (`scripts/model-eval.ts`),
// not a runtime decision. The first family in a language's list whose provider is
// available serves the request; on an *availability* failure (missing credentials,
// timeout, 429, 5xx, open circuit — see failoverableProviderError in
// llm-generation-service.ts) the next family is tried. A language absent from the
// table has not been evaluated and uses DEFAULT_MODEL_PRIORITY.
//
// It is deliberately NOT client-settable. Which model runs is a platform decision
// for the same reason head routing and composition are — see
// docs/language-routing-and-composition.md. Neither an end user nor a client agent
// (including MCP) can select or influence it; there is no GraphQL field to do so.
//
// It is the single place model routing is decided: an entry names the family order AND,
// with a `+tier` suffix, the tier each family serves at. Nothing else in the pipeline
// chooses a model — a dialect's `gc:tier=` only supplies the default for languages this
// table has no opinion about.
//
// It lives in its own module, one language per line, so that changing an ordering
// is a one-line diff a reviewer can actually read. Do not move it onto the
// LANGUAGES entries in languages.ts — those are single-line objects hundreds of
// characters wide, and an ordering buried at the end of one is unreviewable.
//
// Ships INERT: with the table empty every language resolves to the default, so
// deploying this changes no behavior. Populating a line is then a reviewable data
// change rather than a release — the same discipline `freePlan` uses in
// languages.ts.

// Type-only import: llm-models imports modelPriorityFor from here, so this must
// stay erasable or the two modules form a runtime cycle.
import type { GenerationTier, LlmProvider } from "./llm-models";

/**
 * A family, optionally pinned to a tier: "anthropic" or "anthropic+fast".
 *
 * Tier belongs here, beside the ordering, because it is a property of the (language,
 * FAMILY) pair — not of the language alone. L0176 wants haiku primary and terra on
 * failover: the best fast model, falling back to a *balanced* one rather than to the
 * cheapest openai model, which is the single variant measured that fails outright. A
 * dialect-level `gc:tier=` cannot say that. It declares one tier for the language, so the
 * fallback would inherit `fast` and land on exactly the model being avoided.
 *
 * A bare family (no suffix) means "no opinion" — the route's tier applies, which is the
 * dialect's own `gc:tier=` / `gc:model=opus` directive or the small-edit fast downgrade.
 * That keeps every existing entry behaving exactly as before.
 */
export type PriorityEntry = LlmProvider | `${LlmProvider}+${GenerationTier}`;

/**
 * The five things a language runs a model for, and what each costs by default:
 *
 *   create          the dialect's tier (its `gc:tier=`), or a `+tier` suffix below
 *   update          same as create — a revision is not assumed to be easier
 *   repair          always "balanced" — error correction is a narrow, mechanical task,
 *                   and it is pinned to the family that wrote the code
 *   propertyUpdate  always "fast" — the L0166 small-edit path
 *   spec            always "fast" — get_spec, the INVERSE direction (item → English)
 *
 * Those defaults are unchanged and apply to every language. A language may override any of
 * the last four when it has evidence, which is what the object form of an entry is for.
 *
 * `spec` is here rather than beside spec-generation-service's own constants because this table
 * is meant to be the one place you can read what model runs where. It was the counter-example:
 * get_spec resolved `process.env.SPEC_MODEL || "claude-haiku-…"` on its own, invisible from here,
 * and for a dialect whose PRODUCT is the spec (L0177's recipe) that is the load-bearing model
 * choice, not a detail. Note it takes only a TIER: spec-gen calls the Anthropic Messages API
 * directly, so a `+tier` suffix or an openai entry in `order` has no effect on it.
 */
export type GenerationMode = "create" | "update" | "repair" | "propertyUpdate" | "spec";

/**
 * A language's entry: either a bare ordering, or an ordering plus per-mode tier overrides.
 *
 * The array form stays the norm — most languages want one tier for creates and updates and
 * the standard repair/property behavior, and a single line is what makes this table
 * reviewable. Reach for the object form only when a mode genuinely differs, e.g. a dialect
 * whose initial authoring is heavy but whose revisions are not:
 *
 *   "0175": { order: ["openai+quality", "anthropic+quality"], update: "balanced" }
 *
 * `order` is optional so a language can state a tier opinion WITHOUT claiming a family ordering
 * it has no eval for — an entry with no order falls through to DEFAULT_MODEL_PRIORITY exactly as
 * an absent one does, and evaluatedLanguageIds() still does not count it as evaluated.
 */
export type PriorityConfig =
  | PriorityEntry[]
  | {
      order?: PriorityEntry[];
      /** Tier for fresh authoring. Defaults to the dialect's own `gc:tier=`, else balanced. */
      create?: GenerationTier;
      /** Tier for a revision (currentCode present). Defaults to the create tier. */
      update?: GenerationTier;
      /** Tier for error correction. Defaults to "balanced". */
      repair?: GenerationTier;
      /** Tier for the L0166 small-property-edit path. Defaults to "fast". */
      propertyUpdate?: GenerationTier;
      /** Tier for get_spec. Defaults to "fast". Tier only — see GenerationMode. */
      spec?: GenerationTier;
    };

/** The ordering out of either entry form. */
function orderOf(config: PriorityConfig | undefined): PriorityEntry[] {
  if (!config) return [];
  return Array.isArray(config) ? config : config.order || [];
}

/**
 * Per-language family ordering. Keys are canonical 4-digit language ids ("0166").
 *
 * EVERY entry must cite the eval run that justifies it — the value of a static
 * hint is that you can see why it says what it says. An ordering without evidence
 * is a guess with extra steps, so do not add a line without one.
 *
 * Populate with `npm run eval -- --lang <id> --models <a>,<b> --judge`, and only
 * after `--calibrate` shows the judge agrees with human labels for that dialect.
 */
export const MODEL_PRIORITY: Record<string, PriorityConfig> = {
  // "0166": ["anthropic", "openai"],  // eval YYYY-MM-DD: finalRate .94 vs .81
  // "0158": ["openai", "anthropic"],  // eval YYYY-MM-DD: $/win 0.031 vs 0.052

  // eval 2026-08-11 (model-eval-2026-08-11T00-09-52-156Z, 7 cases x 10 trials, --converge 5,
  // hold-out enforced, dialect 2bf6bf310261, 70 runs per variant):
  //   FAST      haiku-4.5    70/70 compile, $0.0017, p50 3.6s
  //             gpt-5.6-luna 67/70 (96%),   $0.0026, p50 4.5s — all three failures the same
  //             parse error ("Too few arguments for ITEMS"), so ~4% of generations
  //   BALANCED  terra 21/21 $0.0035 p50 2.9s · sonnet 21/21 $0.0047 p50 5.8s
  //   Human labels (anchor v2): all 28 candidates scored 3 — 7 per model across BOTH tiers,
  //   so quality is tied and cost is the only live variable. Behavior check on the case with
  //   a known silent-failure mode (clozeformula accepted-answer set): 20/20.
  //   Judge NOT used: zero label variance leaves Spearman undefined, and a dialect at
  //   ceiling has nothing for a judge to discriminate.
  //
  // Supersedes the 2026-08-03 balanced-tier line (terra over sonnet on cost and latency).
  // That measurement was not wrong; it answered a narrower question, before the fast tier
  // had been tried on this dialect at all.
  //
  // Failover is +balanced ON PURPOSE. The cheapest openai model (luna) is the one variant
  // measured here that fails outright, so the fallback trades a little cost for terra's
  // 21/21 rather than inheriting `fast` from the primary.
  "0176": ["anthropic+fast", "openai+balanced"],

  // eval 2026-08-09 (model-eval-0175-converge-merged-from-checkpoint, 7 cases x 3 trials,
  // --converge 5, hold-out enforced, 21 runs per variant, 0 errors):
  //   ALL THREE converge 100% — every variant reaches a warning-free item, so compile-based
  //   metrics are saturated and say nothing. What separates them is the cost of getting there:
  //     turns-to-clean  sol 1.4   opus 1.1   sonnet 1.8
  //     $/converged     sol .069  opus .103  sonnet .086
  //     p50             sol 36.5s opus 40.4s sonnet 63.1s
  //   Human labels, anchor v2, n=7 each: sol 3.86, opus 3.71, sonnet 2.71.
  //   Judge NOT used: --calibrate (n=21) gives rho .32, CI [-.09,.66] — spans zero — and
  //   rho -.26 on openai-authored candidates, so it is not a fair cross-family arbiter here.
  //   Its LEVEL is fine (MAE .57, 95% within +-1); it is the RANKING that disagrees, which is
  //   the part an ordering needs.
  //
  // HONEST BASIS: sol's 3.86 vs opus's 3.71 is a one-case difference and inside noise. This line
  // rests on (a) cost and latency, which are unambiguous, and (b) the reviewer's judgment that
  // sol's items are more nuanced in ways a 1-5 overall score does not capture — the labels are
  // consistent with that read but do not establish it. Re-examine if the anchors gain a band for
  // it, or if a larger label set moves the means apart.
  //
  // Note this also buys 0175 failover it did not have: it was falling through to
  // DEFAULT_MODEL_PRIORITY (anthropic-only), so an OpenAI outage now degrades to opus instead of
  // failing — and an OpenAI credit lapse mid-sweep is exactly the failure this eval hit.
  //
  // Tiers are explicit here rather than inherited. L0175 used to carry `gc:model=opus` in its
  // instructions.md, which meant the eval above (sol vs opus, both quality-tier) was measuring a
  // pairing the table did not state — you had to read a different repo to know which models a
  // line referred to. The directive has been removed; this entry names them outright.
  //
  // Every mode is stated even where it equals the default, because the point of moving these
  // here was that you can read what runs without opening another repo.
  //
  // `update: "quality"` preserves today's behavior. Dropping revisions to balanced is plausible
  // — composing a five-target ELA item from a passage is the hard part, and a revision has the
  // working artifact in hand — but NOTHING here measures it: every case in every eval set is a
  // fresh create, so the harness has never scored a second turn. Change it when there is a run
  // behind it, not because the reasoning sounds right.
  "0175": {
    order: ["openai", "anthropic"],
    create: "quality",
    update: "quality",
    repair: "balanced",
  },

  // NOT AN EVAL RESULT — a decision, recorded here so it is visible. L0177 has no eval set, no
  // labels, and (as of 2026-08-11) zero rows in `training_examples`, so nothing below is measured
  // and this line must be replaced by a run, not extended by argument.
  //
  // No `order`/`create` on purpose: which family and tier WRITE an author-embed program is exactly
  // what the eval has to answer (the output is a dozen property functions — structurally 0176,
  // which went fast — while the empty corpus argues the other way), and balanced is the right
  // hedge until it does. The only claim made here is about `spec`.
  //
  // `spec: "balanced"` because for this dialect get_spec IS the product: the compiled data is
  // secondary and the recipe is what the caller implements. Its spec-directive.md is not the usual
  // verbalize-the-content task the "fast" default was chosen for — it is negative-constraint
  // reasoning (never assert the unverified widgetTypes config path; every config-behaviour check
  // must be differential INCLUDING enabling keys; the Goal must not claim a restriction is in
  // force), and assertCoverage cannot catch a violation because a recipe's substance is not in the
  // source it covers. A confidently wrong recipe tells a developer a restriction holds when the
  // Author API failed open, which is the specific hazard the directive exists to prevent.
  "0177": { spec: "balanced" },
};

/**
 * Used by any language with no MODEL_PRIORITY entry, i.e. every language until an
 * eval says otherwise.
 *
 * Anthropic first — the known-good default — with openai as a blind fallback so an
 * unevaluated language DEGRADES instead of failing when Anthropic is down. This was
 * anthropic-only until 2026-08-12, on the reasoning that a single entry means such a
 * language never silently runs on a provider nobody measured it against. What that
 * reasoning left out is what happens when the one family is unavailable: L0177
 * create_item returned `Overloaded` three times running with nowhere to fall through
 * to, and a dialect with no eval set is exactly the kind most likely to be in this
 * position.
 *
 * The cost is unchanged and still real: a language that lands on openai here is
 * running on a provider nothing has scored it against, and this applies to EVERY
 * unevaluated language, not just the one that prompted it. A dialect that would
 * rather fail than generate unmeasured must say so with its own `order`. An eval,
 * not this constant, is what should eventually decide each language's ordering.
 *
 * Still overridable at runtime without a deploy — see configuredDefaultPriority.
 */
export const DEFAULT_MODEL_PRIORITY: LlmProvider[] = ["anthropic", "openai"];

/** Canonical 4-digit form. Matches findLanguageById in languages.ts. */
function normalizeLangId(lang: string | number): string {
  return String(lang).trim().replace(/^L/i, "").padStart(4, "0");
}

const KNOWN_PROVIDERS = new Set<LlmProvider>(["anthropic", "openai"]);
// Duplicated from llm-models' TIERS for the same reason KNOWN_PROVIDERS duplicates its
// PROVIDERS: this module may only import types from there, or the two form a runtime cycle.
const KNOWN_TIERS = new Set<GenerationTier>(["quality", "balanced", "fast"]);

/**
 * Split "anthropic+fast" into its parts. Returns null when the FAMILY is unrecognized —
 * an entry naming no known provider is not routable and the caller drops it.
 *
 * An unrecognized TIER degrades to no override rather than dropping the entry: a typo in
 * the suffix should cost the tier opinion, not the family's place in the failover chain.
 * That matches how the rest of this module fails — a bad table entry falls through to the
 * known-good default instead of taking generation down for that dialect.
 */
function parseEntry(entry: string): { provider: LlmProvider; tier?: GenerationTier } | null {
  const [rawProvider, rawTier] = String(entry).trim().toLowerCase().split("+", 2);
  if (!KNOWN_PROVIDERS.has(rawProvider as LlmProvider)) return null;
  const tier = rawTier && KNOWN_TIERS.has(rawTier as GenerationTier)
    ? (rawTier as GenerationTier)
    : undefined;
  return { provider: rawProvider as LlmProvider, tier };
}

/**
 * Operator escape hatch for the default ordering: CODEGEN_DEFAULT_PRIORITY, a
 * comma-separated family list (e.g. "anthropic,openai" to give unevaluated
 * languages a blind fallback during an incident). Unparseable or empty values
 * fall back to DEFAULT_MODEL_PRIORITY rather than failing the request.
 */
function configuredDefaultPriority(): LlmProvider[] {
  const raw = process.env.CODEGEN_DEFAULT_PRIORITY;
  if (!raw) return DEFAULT_MODEL_PRIORITY;
  // Parses through the same helper, so the operator hatch accepts "anthropic+fast" too.
  const parsed = raw
    .split(",")
    .map(part => parseEntry(part)?.provider)
    .filter((p): p is LlmProvider => !!p);
  return parsed.length ? dedupe(parsed) : DEFAULT_MODEL_PRIORITY;
}

function dedupe(providers: LlmProvider[]): LlmProvider[] {
  return [...new Set(providers)];
}

/**
 * The family ordering to try for `lang`, most preferred first.
 *
 * Never empty: an unknown language, an empty table entry, or a table entry whose
 * families are all unrecognized resolves to the default. A silent fall-through to
 * the default is the right failure mode here — a typo in the table should degrade
 * to the known-good provider, not take generation down for that dialect.
 */
export function modelPriorityFor(lang: string | number | undefined | null): LlmProvider[] {
  const fallback = configuredDefaultPriority();
  if (lang === undefined || lang === null || String(lang).trim() === "") {
    return fallback;
  }
  const configured = orderOf(MODEL_PRIORITY[normalizeLangId(lang)]);
  if (!configured.length) return fallback;
  // Tier suffixes are stripped here: this function answers "which families, in what order",
  // and every existing caller expects exactly that. Tier comes from modelTiersFor.
  const valid = dedupe(
    configured.map(entry => parseEntry(entry)?.provider).filter((p): p is LlmProvider => !!p),
  );
  return valid.length ? valid : fallback;
}

/**
 * Per-family tier overrides for `lang`, e.g. `{ anthropic: "fast", openai: "balanced" }`.
 *
 * Empty for every language whose entries carry no `+tier` suffix, which is the normal case
 * — and an empty result means "no opinion", leaving the route's tier (the dialect's own
 * `gc:tier=` directive, or the small-edit downgrade) in force. That is what keeps this
 * addition invisible to every language that predates it.
 *
 * Deliberately separate from modelPriorityFor rather than folded into one richer return
 * type: the ordering has several callers that do not care about tier, and widening their
 * shape to carry a field they ignore would be a worse trade than reading the table twice.
 */
export function modelTiersFor(
  lang: string | number | undefined | null,
): Partial<Record<LlmProvider, GenerationTier>> {
  if (lang === undefined || lang === null || String(lang).trim() === "") return {};
  const configured = orderOf(MODEL_PRIORITY[normalizeLangId(lang)]);
  if (!configured.length) return {};
  const out: Partial<Record<LlmProvider, GenerationTier>> = {};
  for (const entry of configured) {
    const parsed = parseEntry(entry);
    // First mention wins, matching dedupe()'s first-wins ordering above.
    if (parsed?.tier && !out[parsed.provider]) out[parsed.provider] = parsed.tier;
  }
  return out;
}

/** Languages with an explicit ordering — i.e. the ones that have been evaluated. */
export function evaluatedLanguageIds(): string[] {
  return Object.keys(MODEL_PRIORITY).filter(id => orderOf(MODEL_PRIORITY[id]).length);
}

/**
 * The tier a language wants for a given mode, or undefined to keep the default.
 *
 * Defaults live at the CALL SITES, not here — repair hardcodes "balanced", the property path
 * hardcodes "fast", and create/update fall back to the route tier — so returning undefined
 * means "you were right, carry on". That keeps this table purely a place to record
 * exceptions, and keeps a language with no entry behaving identically to before it existed.
 */
export function modeTierFor(
  lang: string | number | undefined | null,
  mode: GenerationMode,
): GenerationTier | undefined {
  if (lang === undefined || lang === null || String(lang).trim() === "") return undefined;
  const config = MODEL_PRIORITY[normalizeLangId(lang)];
  if (!config || Array.isArray(config)) return undefined;
  const tier = config[mode];
  return tier && KNOWN_TIERS.has(tier) ? tier : undefined;
}
