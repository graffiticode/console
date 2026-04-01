import bent from "bent";

const apiUrl = process.env.NEXT_PUBLIC_GC_API_URL || "https://api.graffiticode.org";
const getApiString = bent(apiUrl, "GET", "string");
const getApiJSON = bent(apiUrl, "GET", "json");

export const getBaseUrlForApi = () => apiUrl;
export const getLanguageAsset = async (lang, file) => {
  try {
    return await getApiString(`/${lang}/${file}`);
  } catch (err) {
    console.warn(`Failed to fetch ${lang}/${file}:`, err.message);
    return null;
  }
};

// Lexicon cache with 1 hour TTL
const LEXICON_CACHE_TTL_MS = 60 * 60 * 1000;
const lexiconCache = new Map<string, { value: any; expires: number }>();

// Get and parse lexicon for a language
export const getLanguageLexicon = async (lang: string) => {
  const cached = lexiconCache.get(lang);
  if (cached && Date.now() < cached.expires) {
    return cached.value;
  }

  try {
    const lexiconData = await getLanguageAsset(`L${lang}`, 'lexicon.js');
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
