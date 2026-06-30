/**
 * Language server client
 *
 * Fetches per-language documentation (language-info.json + usage-guide.md)
 * from each language's Express server (e.g. l0158.graffiticode.org) and
 * caches the result in-memory with a TTL.
 *
 * The console merges this data into the GraphQL `LanguageInfo` resolver so
 * the MCP server can surface the inline envelope + full markdown guide.
 */

export interface LanguageInfoEnvelope {
  id: string;
  description?: string;
  supported_item_types?: string[];
  example_prompts?: Array<{ prompt: string; produces?: string; notes?: string }>;
  authoring_guide?: string;
}

export interface LanguageServerDoc {
  envelope: LanguageInfoEnvelope | null;
  usageGuide: string | null;
}

export interface LanguageScope {
  id: string;
  summary: string;
  in_scope: string[];
  out_of_scope: string[];
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;

const cacheTtlMs = (() => {
  const raw = process.env.LANGUAGE_SERVER_CACHE_TTL_MS;
  if (!raw) return DEFAULT_TTL_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_MS;
})();

const cache = new Map<string, { doc: LanguageServerDoc; expires: number }>();
const scopeCache = new Map<string, { value: LanguageScope | null; expires: number }>();

import { isLangOverridden } from "./api";

const apiUrl = process.env.NEXT_PUBLIC_GC_API_URL || "https://api.graffiticode.org";

// Build the URL for a language resource. By default these route through the API
// gateway (`${apiUrl}/L<id>/<file>`) so a per-user language-server binding
// override (resolved server-side from the caller's token) can apply. The
// LANGUAGE_SERVER_BASE_URL escape hatch still points directly at a single
// language server for local development (the override does not apply there).
function assetUrlFor(langId: string, file: string): string {
  const override = process.env.LANGUAGE_SERVER_BASE_URL;
  if (override) {
    return `${override.replace(/\/+$/, "")}/${file}`;
  }
  return `${apiUrl}/L${langId}/${file}`;
}

async function fetchText(url: string, accessToken?: string): Promise<string | null> {
  try {
    const res = await fetch(url, accessToken ? { headers: { Authorization: accessToken } } : undefined);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function getLanguageServerDoc(langId: string, accessToken?: string): Promise<LanguageServerDoc> {
  const now = Date.now();
  // When this language is overridden for the caller the fetch is redirected to a
  // test revision, so skip the shared (lang-keyed) cache on read and write.
  const overridden = await isLangOverridden(langId, accessToken);
  const cached = !overridden && cache.get(langId);
  if (cached && now < cached.expires) {
    return cached.doc;
  }

  // Prefer the canonical `usage-guide.md`; fall back to the legacy
  // `user-guide.md` name for languages that haven't been renamed yet.
  const [envelopeRaw, usageGuideRaw] = await Promise.all([
    fetchText(assetUrlFor(langId, "language-info.json"), accessToken),
    fetchText(assetUrlFor(langId, "usage-guide.md"), accessToken)
      .then((s) => s ?? fetchText(assetUrlFor(langId, "user-guide.md"), accessToken)),
  ]);

  let envelope: LanguageInfoEnvelope | null = null;
  if (envelopeRaw) {
    try {
      envelope = JSON.parse(envelopeRaw) as LanguageInfoEnvelope;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`language-server-client: invalid JSON from L${langId} language-info.json: ${message}`);
      envelope = null;
    }
  }

  const doc: LanguageServerDoc = { envelope, usageGuide: usageGuideRaw };

  const success = envelope !== null || usageGuideRaw !== null;
  if (!overridden) {
    const ttl = success ? cacheTtlMs : FAILURE_TTL_MS;
    cache.set(langId, { doc, expires: now + ttl });
  }

  if (!success) {
    console.warn(`language-server-client: could not fetch docs for L${langId}`);
  }

  return doc;
}

export function clearLanguageServerCache(langId?: string): void {
  if (langId) {
    cache.delete(langId);
    scopeCache.delete(langId);
  } else {
    cache.clear();
    scopeCache.clear();
  }
}

// Fetches a language's scope.json — the routing-only descriptor served at
// ${base}/scope.json. Cached separately from the heavier envelope+guide so
// the router and catalog can poll it cheaply. Returns null when the file
// is unavailable or malformed; callers should fall back to a static seed.
export async function getLanguageScope(langId: string, accessToken?: string): Promise<LanguageScope | null> {
  const now = Date.now();
  const overridden = await isLangOverridden(langId, accessToken);
  const cached = !overridden && scopeCache.get(langId);
  if (cached && now < cached.expires) {
    return cached.value;
  }

  const raw = await fetchText(assetUrlFor(langId, "scope.json"), accessToken);

  let scope: LanguageScope | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && typeof parsed.summary === "string") {
        scope = {
          id: String(parsed.id ?? langId),
          summary: String(parsed.summary),
          in_scope: Array.isArray(parsed.in_scope) ? parsed.in_scope.map(String) : [],
          out_of_scope: Array.isArray(parsed.out_of_scope) ? parsed.out_of_scope.map(String) : [],
        };
      } else {
        console.warn(`language-server-client: L${langId} scope.json missing required fields`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`language-server-client: invalid JSON from L${langId} scope.json: ${message}`);
    }
  }

  if (!overridden) {
    const ttl = scope !== null ? cacheTtlMs : FAILURE_TTL_MS;
    scopeCache.set(langId, { value: scope, expires: now + ttl });
  }
  return scope;
}
