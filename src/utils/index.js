import bent from 'bent';


export function isNonEmptyString(str) {
  return (typeof (str) === "string" && str.length > 0);
}

export function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}

export function getApiHost(config) {
  config = config || global.config || {};
  if (config.useLocalCompiles) {
    return "localhost";
  }
  return 'api.graffiticode.org';
}

export function getApiPort(config) {
  config = config || global.config || {};
  if (config.useLocalCompiles) {
    return '3100';
  }
  return "443";
}

export const buildGetLanguageAsset = ({ getBaseUrlForApi, bent }) => {
  return async (lang, file) => {
    const baseUrl = getBaseUrlForApi();
    const url = `${baseUrl}/${lang}/`;
    const getLanguageAsset = bent(url, "string");
    const asset = await getLanguageAsset(file);
    return asset;
  };
};

const buildGetBaseUrlForApi = ({
  env,
  config,
  getApiHost,
  getApiPort
}) => () => {
  const host = getApiHost(config);
  const port = getApiPort(config);
  let protocol;
  if (host === "localhost") {
    protocol = "http";
  } else if (isNonEmptyString(config.protocol)) {
    protocol = config.protocol;
  } else {
    protocol = "https";
  }
  return `${protocol}://${host}:${port}/`;
};

export const getBaseUrlForApi = buildGetBaseUrlForApi({
  env: process.env,
  config: global.config || {},
  getApiHost,
  getApiPort
});

export const getLanguageAsset = buildGetLanguageAsset({ getBaseUrlForApi, bent });

