import bent from "bent";
import { getBaseUrlForApi } from "../../../../../../lib/api.js";

export const compile = async ({ id, data, access_token, user }) => {
  const index = Object.keys(data).length > 0 && 1 || 2;
  id = id.split("+").slice(0, index).join("+");  // Re-compile state with code id.
  const baseUrl = getBaseUrlForApi();
  if (access_token === undefined) {
    access_token = await user.getToken();
  }
  const headers = {
    authorization: access_token,
    "x-graffiticode-storage-type": "persistent",    
  };
  const post = bent(baseUrl, "POST", "json", headers);
  const body = { id, data };
  const resp = await post('/compile', body);
  return resp;
};
