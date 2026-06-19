import bent from "bent";

const apiUrl = process.env.NEXT_PUBLIC_GC_API_URL || "https://api.graffiticode.org";
const getApiString = bent(apiUrl, "GET", "string");
const getApiJSON = bent(apiUrl, "GET", "json");

export const getBaseUrlForApi = () => apiUrl;
export const getLanguageAsset = async (lang, file) => {
  try {
    // Bypass the CDN edge cache (api.graffiticode.org serves these with `max-age=3600`) so a
    // language deploy propagates without a manual cache purge. A unique query string forces a
    // cache MISS → fresh origin fetch; the in-memory caches below dedupe so origin load stays low.
    return await getApiString(`/${lang}/${file}?_cb=${Date.now()}`);
  } catch (err) {
    console.warn(`Failed to fetch ${lang}/${file}:`, err.message);
    return null;
  }
};

// Lexicon cache: short TTL so a language deploy (new dimensions/standards/tags) is picked up
// within minutes rather than up to an hour. Origin fetches bypass the CDN (see getLanguageAsset).
const LEXICON_CACHE_TTL_MS = 5 * 60 * 1000;
const lexiconCache = new Map<string, { value: any; expires: number }>();

// Get and parse lexicon for a language
export const getLanguageLexicon = async (lang: string) => {
  const cached = lexiconCache.get(lang);
  if (cached && Date.now() < cached.expires) {
    return cached.value;
  }

  try {
    const lexiconData = await getLanguageAsset(`L${lang}`, 'lexicon.json');
    let lexicon = null;

    if (lexiconData) {
      if (typeof lexiconData === 'string') {
        const lexiconStr = lexiconData.substring(lexiconData.indexOf("{"));
        try {
          lexicon = JSON.parse(lexiconStr);
        } catch (e) {
          console.warn(`Failed to parse lexicon for L${lang}:`, e.message);
        }
      } else {
        lexicon = lexiconData;
      }
    }

    if (lexicon) {
      lexiconCache.set(lang, { value: lexicon, expires: Date.now() + LEXICON_CACHE_TTL_MS });
    }
    return lexicon;
  } catch (error) {
    console.warn(`Failed to fetch lexicon for L${lang}:`, error.message);
    return null;
  }
};

// Standardized message shown when a language service can't be reached.
export const languageOfflineMessage = (lang: string) =>
  `Language L${lang} is offline. Try again later.`;

// Detect exceptions thrown when a language service is unavailable: the
// lexicon.json asset can't be fetched/parsed, or the API connection fails.
export const isLanguageOfflineError = (err: any): boolean => {
  if (!err) return false;
  const message = typeof err === "string" ? err : (err.message || "");
  if (/lexicon|unable to use lexicon|malformed lexicon|offline/i.test(message)) {
    return true;
  }
  const netCodes = /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN|ECONNABORTED/i;
  if (netCodes.test(String(err.code || "")) || netCodes.test(message)) {
    return true;
  }
  const status = typeof err.statusCode === "number" ? err.statusCode
    : (typeof err.status === "number" ? err.status : 0);
  return status >= 500;
};

export const getApiTask = async ({ auth, id }) => {
  try {
    const headers = { "Authorization": auth.token };
    const { status, error, data: task } = await getApiJSON(`/task?id=${id}`, null, headers);
    if (status !== "success") {
      throw new Error(`failed to get task ${id}: ${error.message}`);
    }
    return task;
  } catch (err) {
    throw err;
  }
};

export const postApiCompile = async ({ accessToken, id, data }) => {
  try {
    // console.log(
    //   "postApiCompile()",
    //   "id=" + id,
    //   "data=" + JSON.stringify(data, null, 2)
    // );
    const headers = {
      authorization: accessToken,
      "x-graffiticode-storage-type": "persistent",
    };
    const post = bent(apiUrl, "POST", "json", headers);
    const body = { id, data };
    const resp = await post('/compile', body);
    if (resp.status !== "success") {
      throw new Error(`failed to post compile ${id}: ${resp.status}`);
    }
    // console.log(
    //   "postApiCompile()",
    //   "resp=" + JSON.stringify(resp, null, 2),
    // );
    return resp;
  } catch (x) {
    console.log(
      "postApiCompile()",
      "ERROR",
      x,
    );
    throw x;
  }
};
