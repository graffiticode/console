/**
 * Language server client
 *
 * Fetches per-language documentation (language-info.json + user-guide.md)
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
  userGuide: string | null;
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

function baseUrlFor(langId: string): string {
  const override = process.env.LANGUAGE_SERVER_BASE_URL;
  if (override) {
    return override.replace(/\/+$/, "");
  }
  return `https://l${langId}.graffiticode.org`;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function getLanguageServerDoc(langId: string): Promise<LanguageServerDoc> {
  const now = Date.now();
  const cached = cache.get(langId);
  if (cached && now < cached.expires) {
    return cached.doc;
  }

  const base = baseUrlFor(langId);
  const [envelopeRaw, userGuideRaw] = await Promise.all([
    fetchText(`${base}/language-info.json`),
    fetchText(`${base}/user-guide.md`),
  ]);

  let envelope: LanguageInfoEnvelope | null = null;
  if (envelopeRaw) {
    try {
      envelope = JSON.parse(envelopeRaw) as LanguageInfoEnvelope;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`language-server-client: invalid JSON from ${base}/language-info.json: ${message}`);
      envelope = null;
    }
  }

  const doc: LanguageServerDoc = { envelope, userGuide: userGuideRaw };

  const success = envelope !== null || userGuideRaw !== null;
  const ttl = success ? cacheTtlMs : FAILURE_TTL_MS;
  cache.set(langId, { doc, expires: now + ttl });

  if (!success) {
    console.warn(`language-server-client: could not fetch docs for L${langId} from ${base}`);
  }

  return doc;
}

export function clearLanguageServerCache(langId?: string): void {
  if (langId) cache.delete(langId);
  else cache.clear();
}
