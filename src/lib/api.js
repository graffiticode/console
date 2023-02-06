import bent from "bent";

const apiUrl = process.env.NEXT_PUBLIC_GC_API_URL || "https://api.graffiticode.org";

const getApiString = bent(apiUrl, "GET", "string");

export const getBaseUrlForApi = () => apiUrl;
export const getLanguageAsset = (lang, file) => getApiString(`/${lang}/${file}`);
