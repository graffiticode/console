//http://localhost:51/form?lang=1&data=%22hellox%22
//http://localhost:3100/form?lang=1&data=%22hellox%22
import { getBaseUrlForApi } from "../../../lib/api";
import { isNonEmptyString } from "../../../utils";

export default async function handler(req, res) {
  try {
    const { token, lang, id } = req.query;
    if (!isNonEmptyString(id)) {
      res.status(400).send("must provide a task id");
      return;
    }

    // const dataUrl = `${apiUrl}/data?id=${id}`;
    // const data = JSON.stringify({ url: dataUrl });
    // console.log("GET /form dataUrl=" + dataUrl);
    const qs = new URLSearchParams();
    qs.set("id", id);
    qs.set("lang", lang);
    qs.set("access_token", token);

    const formUrl = `${getBaseUrlForApi()}/form?${qs.toString()}`;
    res.redirect(formUrl);
  } catch (x) {
    console.log("catch x=" + x);
    res.status(500).send();
  }
};
