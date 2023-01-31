//http://localhost:51/form?lang=1&data=%22hellox%22
//http://localhost:3100/form?lang=1&data=%22hellox%22

import React from 'react';
import {
  getBaseUrlForApi,
  getLanguageAsset,
} from "../../../utils";

export default async function handler(req, res) {
  try {
    const { lang, id } = req.query;
    const baseUrl = getBaseUrlForApi();
    const dataUrl = `${baseUrl}data?id=${id}`;
    const data = JSON.stringify({url: dataUrl});
    const path = `form?id=${id}`;
    const formUrl = baseUrl + path;
    console.log("GET /form formUrl=" + formUrl);
    res.redirect(formUrl);
  } catch (x) {
    console.log("catch x=" + x);
    res.sendStatus(500);
  }
};
