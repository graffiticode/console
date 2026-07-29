import { modelPriorityFor } from "./model-priority";

export type LlmProvider = "anthropic" | "openai";
export type ProviderMode = LlmProvider | "auto";
export type GenerationTier = "quality" | "balanced" | "fast";

export const ANTHROPIC_MODELS = {
  // Opus 5 rather than 4.8: same $5/$25, current generation. Two behaviors this
  // codebase has to respect — thinking is ON by default (omitting `thinking` runs
  // adaptive, unlike 4.8), and `max_tokens` caps thinking PLUS response text, so
  // DEFAULT_MAX_TOKENS buys less answer here than it did on 4.8; and
  // `thinking:{type:"disabled"}` is a 400 at effort xhigh/max.
  QUALITY: "claude-opus-5",
  BALANCED: "claude-sonnet-5",
  FAST: "claude-haiku-4-5-20251001",
  DEFAULT: "claude-sonnet-5",
} as const;

export const OPENAI_MODELS = {
  QUALITY: "gpt-5.6-sol",
  BALANCED: "gpt-5.6-terra",
  FAST: "gpt-5.6-luna",
  DEFAULT: "gpt-5.6-terra",
} as const;

// Backwards-compatible names used by router, judge, and evaluation code.
export const CLAUDE_MODELS = {
  OPUS: ANTHROPIC_MODELS.QUALITY,
  SONNET: ANTHROPIC_MODELS.BALANCED,
  HAIKU: ANTHROPIC_MODELS.FAST,
  DEFAULT: ANTHROPIC_MODELS.DEFAULT,
} as const;

const PROVIDERS = new Set<LlmProvider>(["anthropic", "openai"]);
const PROVIDER_MODES = new Set<ProviderMode>(["auto", ...PROVIDERS]);
const TIERS = new Set<GenerationTier>(["quality", "balanced", "fast"]);

export function parseProviderMode(value: unknown): ProviderMode | undefined {
  const normalized = String(value || "").trim().toLowerCase() as ProviderMode;
  return PROVIDER_MODES.has(normalized) ? normalized : undefined;
}

export function parseGenerationTier(value: unknown): GenerationTier | undefined {
  const normalized = String(value || "").trim().toLowerCase() as GenerationTier;
  return TIERS.has(normalized) ? normalized : undefined;
}

export function inferProviderFromModel(model?: string): LlmProvider | undefined {
  if (!model) return undefined;
  if (/^claude-/i.test(model)) return "anthropic";
  if (/^(gpt-|o\d|codex-)/i.test(model)) return "openai";
  return undefined;
}

export function inferTierFromModel(model?: string): GenerationTier | undefined {
  if (!model) return undefined;
  if (/(opus|sol)(?:-|$)/i.test(model)) return "quality";
  if (/(haiku|luna)(?:-|$)/i.test(model)) return "fast";
  if (/(sonnet|terra)(?:-|$)/i.test(model)) return "balanced";
  return undefined;
}

export function modelForProvider(
  provider: LlmProvider,
  tier: GenerationTier,
): string {
  if (provider === "openai") {
    return tier === "quality"
      ? OPENAI_MODELS.QUALITY
      : tier === "fast"
        ? OPENAI_MODELS.FAST
        : OPENAI_MODELS.BALANCED;
  }
  return tier === "quality"
    ? ANTHROPIC_MODELS.QUALITY
    : tier === "fast"
      ? ANTHROPIC_MODELS.FAST
      : ANTHROPIC_MODELS.BALANCED;
}

export function configuredProviderMode(): ProviderMode {
  return parseProviderMode(process.env.CODEGEN_PROVIDER) || "auto";
}

export function configuredPrimaryProvider(): LlmProvider {
  const configured = parseProviderMode(process.env.CODEGEN_PRIMARY_PROVIDER);
  return configured === "openai" ? "openai" : "anthropic";
}

export function configuredFallbackEnabled(): boolean {
  return !/^(0|false|off|no)$/i.test(
    process.env.CODEGEN_FALLBACK_ENABLED || "true",
  );
}

export function modelRejectsTemperature(model?: string): boolean {
  return !!model && /(opus|sonnet-5|fable|mythos|gpt-5\.6)/i.test(model);
}

export interface LanguageGenerationPolicy {
  tier?: GenerationTier;
}

// `provider` is deliberately absent: which FAMILY runs is owned by
// src/lib/model-priority.ts, so a dialect-owned `gc:provider=` directive would be a
// second source of truth for one decision. A dialect still chooses its own TIER
// (how much model to spend within whichever family serves it), which is what
// `gc:tier=` and the legacy `gc:model=opus` express.
const GENERATION_DIRECTIVE_RE =
  /<!--\s*gc:(model|tier)\s*[:=]\s*([a-z0-9._-]+)\s*-->/gi;

// Matches any gc:model/gc:tier/gc:provider directive for STRIPPING purposes.
// Broader than the parser on purpose: a stale `gc:provider=` in a dialect's
// instructions.md is no longer honored, but it must still never reach the LLM.
const GENERATION_DIRECTIVE_STRIP_RE =
  /<!--\s*gc:(model|tier|provider)\s*[:=]\s*([a-z0-9._-]+)\s*-->/gi;

/**
 * Removes private routing directives before instructions enter the prompt and
 * returns the language's provider-neutral generation policy.
 */
export function parseLanguageGenerationPolicy(
  instructions: string,
): { cleaned: string; policy: LanguageGenerationPolicy } {
  const policy: LanguageGenerationPolicy = {};
  let match: RegExpExecArray | null;

  while ((match = GENERATION_DIRECTIVE_RE.exec(instructions)) !== null) {
    const [, , rawValue] = match;
    const tier =
      parseGenerationTier(rawValue) ||
      inferTierFromModel(rawValue) ||
      (rawValue.toLowerCase() === "opus"
        ? "quality"
        : rawValue.toLowerCase() === "sonnet"
          ? "balanced"
          : rawValue.toLowerCase() === "haiku"
            ? "fast"
            : undefined);
    if (tier) policy.tier = tier;
  }

  GENERATION_DIRECTIVE_RE.lastIndex = 0;
  GENERATION_DIRECTIVE_STRIP_RE.lastIndex = 0;
  return {
    cleaned: instructions.replace(GENERATION_DIRECTIVE_STRIP_RE, ""),
    policy,
  };
}

export interface GenerationRouteInput {
  /** Language id — the ONLY input that selects a family. */
  lang?: string | number | null;
  tier?: GenerationTier;
  /**
   * Internal/eval escape hatch: pin one exact model. Reachable only from
   * in-process TS callers (scripts/model-eval.ts); there is no GraphQL field for
   * it, so a client cannot set it. A pin disables failover — an eval that
   * silently fell back to another family would be measuring the wrong thing.
   */
  model?: string;
}

export interface GenerationRoute {
  /** Family order to try, most preferred first. Never empty. */
  providers: LlmProvider[];
  tier: GenerationTier;
  model?: string;
  /** Where the ordering came from, for telemetry and log lines. */
  source: "model_pin" | "operator_override" | "language_priority";
}

/**
 * Resolve which model families may serve a request, in order.
 *
 * Precedence, none of it client-reachable:
 *   1. an internal/eval `model` pin (single family, no failover)
 *   2. an operator override (CODEGEN_PROVIDER / CODEGEN_PRIMARY_PROVIDER) — for
 *      canary and incident response
 *   3. the language's static priority list, else the default
 *
 * Tier is orthogonal: it picks the model WITHIN the chosen family via
 * modelForProvider. A language's `gc:tier=` directive and the small-edit fast
 * downgrade both act here, and neither changes which family serves the request.
 */
export function resolveGenerationRoute(
  input: GenerationRouteInput,
): GenerationRoute {
  const explicitTier = parseGenerationTier(input.tier);
  if (input.tier !== undefined && !explicitTier) {
    throw new Error(
      `Invalid code generation tier "${input.tier}"; expected quality, balanced, or fast`,
    );
  }
  const tier = explicitTier || inferTierFromModel(input.model) || "balanced";

  // 1. Exact model pin (internal/eval only).
  const pinnedProvider = inferProviderFromModel(input.model);
  if (input.model && pinnedProvider) {
    return {
      providers: [pinnedProvider],
      tier,
      model: input.model,
      source: "model_pin",
    };
  }

  // 2. Operator override. CODEGEN_PROVIDER names one family to force everywhere;
  //    "auto" (the default) means "defer to the language". CODEGEN_PRIMARY_PROVIDER
  //    only reorders — it never removes a family, so an override cannot cost a
  //    language its failover.
  const configuredMode = configuredProviderMode();
  if (configuredMode !== "auto") {
    return { providers: [configuredMode], tier, source: "operator_override" };
  }

  // 3. The language's static priority list.
  const priority = modelPriorityFor(input.lang);
  const primary = configuredPrimaryProvider();
  const providers =
    process.env.CODEGEN_PRIMARY_PROVIDER && priority.includes(primary)
      ? [primary, ...priority.filter(provider => provider !== primary)]
      : priority;

  return {
    providers: configuredFallbackEnabled() ? providers : providers.slice(0, 1),
    tier,
    source: "language_priority",
  };
}
