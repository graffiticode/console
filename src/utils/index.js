import bent from 'bent';

export function isNonEmptyString(str) {
  return (typeof (str) === "string" && str.length > 0);
}

export function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}

export function getApiHost(lang, config) {
  config = config || global.config || {};
  if (config.useLocalCompiles) {
    return "localhost";
  }
  if (config.hosts && config.hosts[lang]) {
    return config.hosts[lang];
  }
  return 'api.graffiticode.org';
}

export function getApiPort(lang, config) {
  config = config || global.config || {};
  if (config.useLocalCompiles) {
    lang = lang.indexOf("L") === 0 && lang.substring(1) || lang;
    return '3100';
  }
  if (config.ports && config.ports[lang]) {
    return config.ports[lang];
  }
  return "443";
}

export const buildGetLanguageAsset = ({ getBaseUrlForLanguage, bent }) => {
  return async (lang, file) => {
    const baseUrl = getBaseUrlForLanguage(lang);
    const getLanguageAsset = bent(baseUrl, "string");
    const asset = await getLanguageAsset(file);
    return asset;
  };
};

const buildGetBaseUrlForLanguage = ({
  isNonEmptyString,
  env,
  getConfig,
  getApiHost,
  getApiPort
}) => (lang) => {
  if (!isNonEmptyString(lang)) {
    throw new Error("lang must be a non empty string");
  }
  const envBaseUrl = env[`BASE_URL_${lang.toUpperCase()}`];
  if (isNonEmptyString(envBaseUrl)) {
    return envBaseUrl;
  }
  const config = {
    useLocalCompiles: true
  };
  const host = getApiHost(lang, config);
  const port = getApiPort(lang, config);
  let protocol = "https";
  if (host === "localhost") {
    protocol = "http";
  } else if (isNonEmptyString(config.protocol)) {
    protocol = config.protocol;
  }
  return `${protocol}://${host}:${port}/L${lang}/`;
};

export const getBaseUrlForLanguage = buildGetBaseUrlForLanguage({
  isNonEmptyString,
  env: process.env,
  getApiHost,
  getApiPort
});

export const getLanguageAsset = buildGetLanguageAsset({ getBaseUrlForLanguage, bent });

