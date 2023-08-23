import { getBaseUrlForApi } from "../../../lib/api";
import { isNonEmptyString } from "../../../utils";

export default async function handler(req, res) {
  try {
    console.log("GET /data req.query=" + JSON.stringify(req.query, null, 2));
    const { access_token, id } = req.query;
    console.log("GET /data id=" + id);
    if (!isNonEmptyString(id)) {
      res.status(400).send("must provide a task id");
      return;
    }

    // const dataUrl = `${apiUrl}/data?id=${id}`;
    // const data = JSON.stringify({ url: dataUrl });
    // console.log("GET /form dataUrl=" + dataUrl);
    const qs = new URLSearchParams();
    qs.set("id", id);
    if (access_token) {
      qs.set("access_token", access_token);
    }
    const url = `${getBaseUrlForApi()}/data?${qs.toString()}`;
    res.redirect(url);
  } catch (x) {
    console.log("catch x=" + x);
    res.status(500).send();
  }
};
