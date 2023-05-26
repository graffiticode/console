import { getBaseUrlForApi } from "../../../lib/api";
import { isNonEmptyString } from "../../../utils";

export default async function handler(req, res) {
  try {
    const { token, id } = req.query;
    if (!isNonEmptyString(id)) {
      res.status(400).send("must provide a task id");
      return;
    }

    // const dataUrl = `${apiUrl}/data?id=${id}`;
    // const data = JSON.stringify({ url: dataUrl });
    // console.log("GET /form dataUrl=" + dataUrl);
    const qs = new URLSearchParams();
    qs.set("id", id);
    if (token) {
      qs.set("access_token", token);
    }
    const formUrl = `${getBaseUrlForApi()}/form?${qs.toString()}`;
    console.log("GET /form formUrl=" + formUrl);
    res.redirect(formUrl);
  } catch (x) {
    console.log("catch x=" + x);
    res.status(500).send();
  }
};
