import bent from "bent";

const apiUrl = process.env.NEXT_PUBLIC_GC_API_URL || "https://api.graffiticode.org";

const getApiString = bent(apiUrl, "GET", "string");
const getApiJSON = bent(apiUrl, "GET", "json");

export const getBaseUrlForApi = () => apiUrl;
export const getLanguageAsset = (lang, file) => getApiString(`/${lang}/${file}`);

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
      "x-artcompiler-storage-type": "persistent",
    };
    const post = bent(apiUrl, "POST", "json", headers);
    const body = { id, data };
    const resp = await post('/compile', body);
    if (resp.status !== "success") {
      throw new Error(`failed to post compile ${id}: ${error.message}`);
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
