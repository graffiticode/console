// Per-model Anthropic pricing, USD per token.
//
// Replaces four hardcoded Sonnet-rate constants that were applied to every
// model regardless of which one ran — so an Opus generation (5× Sonnet's input
// rate) was recorded at Sonnet's price. Cost telemetry is not a billing control
// here (the free plan meters items, not dollars), but it does feed
// cost-per-acquired-account in the funnel report, and a figure that silently
// understates the expensive model is worse than no figure.
//
// Rates are per 1M tokens, from the published price list. Keep this table in
// sync when adding a model to CLAUDE_MODELS.

const PER_MILLION = 1_000_000;

interface ModelRate {
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M output tokens. */
  output: number;
  /**
   * Promotional rate in effect until the given date (ISO). After it, `input`
   * and `output` above apply. Encoded rather than ignored because the
   * introductory Sonnet 5 rate is a third off, and this is the default
   * generation model — treating it as the standard rate would overstate almost
   * all free-plan spend while the promotion lasts. Self-expiring: once the date
   * passes, the standard rate applies with no code change.
   */
  intro?: { input: number; output: number; until: string };
}

const MODEL_RATES: Record<string, ModelRate> = {
  "claude-fable-5": { input: 10, output: 50 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-5": {
    input: 3,
    output: 15,
    intro: { input: 2, output: 10, until: "2026-08-31" },
  },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

// Unknown models fall back to the default generation model's rate rather than
// to zero: a missing table entry should make the estimate approximate, not
// silently free.
const FALLBACK = MODEL_RATES["claude-sonnet-5"];

/**
 * Cache pricing is a fixed multiple of a model's input rate, so it needs no
 * per-model entries: a 5-minute-TTL write costs 1.25×, a read costs 0.1×.
 */
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

/** Model ids may carry a date suffix (`claude-haiku-4-5-20251001`); the table is keyed without one. */
function rateFor(model: string | undefined, now: Date): { input: number; output: number } {
  const id = String(model || "");
  const entry =
    MODEL_RATES[id] ??
    MODEL_RATES[id.replace(/-\d{8}$/, "")] ??
    FALLBACK;
  if (entry.intro && now < new Date(`${entry.intro.until}T23:59:59Z`)) {
    return { input: entry.intro.input, output: entry.intro.output };
  }
  return { input: entry.input, output: entry.output };
}

export function estimateUsdCost(
  usage:
    | {
        inputTokens?: number;
        outputTokens?: number;
        cacheCreationInputTokens?: number;
        cacheReadInputTokens?: number;
      }
    | undefined,
  model?: string,
  now = new Date(),
): number {
  if (!usage) return 0;
  const rate = rateFor(model, now);
  const cacheWrite = usage.cacheCreationInputTokens || 0;
  const cacheRead = usage.cacheReadInputTokens || 0;
  // inputTokens is reported inclusive of the cached portions; bill the
  // remainder at the full rate and the cached parts at their own multiples.
  const uncachedInput = Math.max(0, (usage.inputTokens || 0) - cacheWrite - cacheRead);

  const usd =
    uncachedInput * rate.input +
    (usage.outputTokens || 0) * rate.output +
    cacheWrite * rate.input * CACHE_WRITE_MULTIPLIER +
    cacheRead * rate.input * CACHE_READ_MULTIPLIER;

  return usd / PER_MILLION;
}
