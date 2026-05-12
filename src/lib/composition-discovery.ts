import { getLanguageAsset } from "./api";

type NodePool = Record<string, any>;
type AssetFetcher = (lang: string, file: string) => Promise<string | null>;

const SCHEMA_CACHE_TTL_MS = 60 * 60 * 1000;
const schemaCache = new Map<string, { value: any; expires: number }>();

async function getLanguageSchema(lang: string, fetcher: AssetFetcher): Promise<any> {
  const cached = schemaCache.get(lang);
  if (cached && Date.now() < cached.expires) {
    return cached.value;
  }
  const text = await fetcher(`L${lang}`, "schema.json");
  if (!text) return null;
  let schema: any;
  if (typeof text === "string") {
    try {
      schema = JSON.parse(text);
    } catch (e: any) {
      throw new Error(`L${lang}/schema.json is not valid JSON: ${e.message}`);
    }
  } else {
    schema = text;
  }
  schemaCache.set(lang, { value: schema, expires: Date.now() + SCHEMA_CACHE_TTL_MS });
  return schema;
}

export interface ResolveResult {
  upstreams: string[];
  ast: NodePool;
}

// Walks a parsed nodePool for DATA(USE(STR("<lang>"))) patterns. For each one,
// fetches L<lang>/schema.json and inlines it on the USE node as `.schema`. Returns
// the ordered list of upstream langs (scan order) and the rewritten nodePool.
// Throws if any referenced lang has no accessible schema.json.
// `fetcher` is injectable for tests; defaults to getLanguageAsset.
export async function resolveUpstreams(
  nodePool: NodePool,
  fetcher: AssetFetcher = getLanguageAsset
): Promise<ResolveResult> {
  const upstreams: string[] = [];
  const useRewrites: { nid: string; lang: string }[] = [];

  for (const nid of Object.keys(nodePool)) {
    if (nid === "root") continue;
    const node = nodePool[nid];
    if (!node || typeof node !== "object" || node.tag !== "DATA") continue;
    const useNid = node.elts?.[0];
    const useNode = useNid != null ? nodePool[useNid] : null;
    if (!useNode || useNode.tag !== "USE") continue;
    const strNid = useNode.elts?.[0];
    const strNode = strNid != null ? nodePool[strNid] : null;
    if (!strNode || strNode.tag !== "STR") continue;
    const lang = String(strNode.elts?.[0] ?? "");
    if (!/^\d{3,5}$/.test(lang)) {
      throw new Error(`Composition error: \`use\` argument must be a language id, got "${lang}"`);
    }
    useRewrites.push({ nid: String(useNid), lang });
    upstreams.push(lang);
  }

  if (useRewrites.length === 0) {
    return { upstreams: [], ast: nodePool };
  }

  // Fetch all required schemas in parallel.
  const schemas = await Promise.all(
    useRewrites.map(async ({ lang }) => {
      const schema = await getLanguageSchema(lang, fetcher);
      if (schema == null) {
        throw new Error(`Composition error: language L${lang} has no accessible schema.json`);
      }
      return schema;
    })
  );

  const rewritten: NodePool = { ...nodePool };
  for (let i = 0; i < useRewrites.length; i++) {
    const { nid } = useRewrites[i];
    rewritten[nid] = { ...nodePool[nid], schema: schemas[i] };
  }

  return { upstreams, ast: rewritten };
}
