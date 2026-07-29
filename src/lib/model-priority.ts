// Ordered model-family priority, per language.
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
import type { LlmProvider } from "./llm-models";

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
export const MODEL_PRIORITY: Record<string, LlmProvider[]> = {
  // "0166": ["anthropic", "openai"],  // eval YYYY-MM-DD: finalRate .94 vs .81
  // "0158": ["openai", "anthropic"],  // eval YYYY-MM-DD: $/win 0.031 vs 0.052
};

/**
 * Used by any language with no MODEL_PRIORITY entry, i.e. every language until an
 * eval says otherwise.
 *
 * Anthropic-only on purpose: this is the known-good default, and a single entry
 * means an unevaluated language never silently runs on a provider nobody measured
 * it against. The cost is that such a language has no failover — during an
 * Anthropic outage it fails rather than degrading. Making that trade differently
 * is an operator decision, so it is overridable at runtime (see
 * configuredDefaultPriority) rather than requiring a deploy.
 */
export const DEFAULT_MODEL_PRIORITY: LlmProvider[] = ["anthropic"];

/** Canonical 4-digit form. Matches findLanguageById in languages.ts. */
function normalizeLangId(lang: string | number): string {
  return String(lang).trim().replace(/^L/i, "").padStart(4, "0");
}

const KNOWN_PROVIDERS = new Set<LlmProvider>(["anthropic", "openai"]);

/**
 * Operator escape hatch for the default ordering: CODEGEN_DEFAULT_PRIORITY, a
 * comma-separated family list (e.g. "anthropic,openai" to give unevaluated
 * languages a blind fallback during an incident). Unparseable or empty values
 * fall back to DEFAULT_MODEL_PRIORITY rather than failing the request.
 */
function configuredDefaultPriority(): LlmProvider[] {
  const raw = process.env.CODEGEN_DEFAULT_PRIORITY;
  if (!raw) return DEFAULT_MODEL_PRIORITY;
  const parsed = raw
    .split(",")
    .map(part => part.trim().toLowerCase())
    .filter((part): part is LlmProvider => KNOWN_PROVIDERS.has(part as LlmProvider));
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
  const configured = MODEL_PRIORITY[normalizeLangId(lang)];
  if (!configured?.length) return fallback;
  const valid = dedupe(configured.filter(provider => KNOWN_PROVIDERS.has(provider)));
  return valid.length ? valid : fallback;
}

/** Languages with an explicit ordering — i.e. the ones that have been evaluated. */
export function evaluatedLanguageIds(): string[] {
  return Object.keys(MODEL_PRIORITY).filter(id => MODEL_PRIORITY[id]?.length);
}
