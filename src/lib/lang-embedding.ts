// Per-language RAG embedding hooks.
//
// Some languages (e.g. L0175 ELA assessments) paste a large reading passage into the prompt. If
// that prompt is embedded verbatim the passage prose dominates the vector and retrieval matches on
// passage topic instead of item design. A hooked language supplies passage-aware helpers from its
// own published package so the same logic runs on the doc side (captured prompt + generated code)
// and the query side (live prompt):
//   - embeddingText : the prompt with the passage removed — what actually gets embedded.
//   - tags / facets : a passage-independent design signature derived from the code, stored as
//                     metadata and used as a query-time filter/boost (NOT mixed into the vector).
//
// This module is the single dispatch point. Languages without a hook are untouched.
import {
  buildEmbeddingArtifacts,
  stripReadingPassage,
  extractQueryFacets,
  type DesignFacets,
  type EmbeddingArtifacts,
} from "@graffiticode/l0175";

interface EmbeddingHook {
  buildArtifacts: (input: { prompt: string; code?: string }) => EmbeddingArtifacts;
  stripQuery: (prompt: string) => string;
  queryFacets: (prompt: string) => DesignFacets;
}

// Keyed by bare language id (no "L"/"l" prefix).
const HOOKS: Record<string, EmbeddingHook> = {
  "0175": {
    buildArtifacts: ({ prompt, code }) => buildEmbeddingArtifacts({ prompt, code }),
    stripQuery: (prompt) => stripReadingPassage(prompt),
    queryFacets: (prompt) => extractQueryFacets(prompt),
  },
};

function normalizeLang(lang?: string | null): string {
  if (!lang) return "";
  return String(lang).replace(/^l/i, "").trim();
}

export function hasEmbeddingHook(lang?: string | null): boolean {
  return Boolean(HOOKS[normalizeLang(lang)]);
}

/**
 * Doc side: passage-free embedding text + design tags/facets for one captured example, or null if
 * the language has no hook (caller keeps its existing behavior).
 */
export function buildExampleArtifacts(
  lang: string | null | undefined,
  input: { prompt: string; code?: string },
): EmbeddingArtifacts | null {
  const hook = HOOKS[normalizeLang(lang)];
  if (!hook || !input.prompt) return null;
  try {
    return hook.buildArtifacts(input);
  } catch (err) {
    console.warn(`lang-embedding: buildArtifacts failed for L${normalizeLang(lang)}:`, (err as Error).message);
    return null;
  }
}

/** Query side: strip the reading passage from a live prompt. Returns the prompt unchanged if no hook. */
export function stripQueryPassage(lang: string | null | undefined, prompt: string): string {
  const hook = HOOKS[normalizeLang(lang)];
  if (!hook || !prompt) return prompt;
  try {
    const stripped = hook.stripQuery(prompt);
    return stripped && stripped.trim() ? stripped : prompt;
  } catch {
    return prompt;
  }
}

/** Query side: design facets recovered from a live prompt (best-effort), or null. */
export function queryFacets(lang: string | null | undefined, prompt: string): DesignFacets | null {
  const hook = HOOKS[normalizeLang(lang)];
  if (!hook || !prompt) return null;
  try {
    return hook.queryFacets(prompt);
  } catch {
    return null;
  }
}

/**
 * Re-rank adjustment from comparing query facets to a stored doc's facets. A confident target
 * mismatch excludes the doc (a c1-t4 example is wrong for a c1-t11 request); overlapping facets
 * boost it. Generic over facet shape, so it is safe for any hooked language.
 */
export function facetAdjustment(
  qf: DesignFacets | null | undefined,
  docFacets: any,
): { keep: boolean; boost: number } {
  if (!qf) return { keep: true, boost: 0 };
  const df = docFacets || {};
  if (qf.target && df.target && qf.target !== df.target) return { keep: false, boost: 0 };
  const overlap = (a?: string[], b?: string[]) =>
    Array.isArray(a) && Array.isArray(b) && a.some((x) => b.includes(x));
  let boost = 0;
  if (qf.target && df.target && qf.target === df.target) boost += 0.1;
  if (overlap(qf.itemTypes, df.itemTypes)) boost += 0.08;
  if (overlap(qf.standards, df.standards)) boost += 0.05;
  if (overlap(qf.dimensions, df.dimensions)) boost += 0.05;
  return { keep: true, boost };
}
