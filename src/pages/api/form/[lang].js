//http://localhost:51/form?lang=1&data=%22hellox%22
//http://localhost:3100/form?lang=1&data=%22hellox%22

import React from 'react';
import {
  getBaseUrlForApi,
  getLanguageAsset,
} from "../../../utils";

export default async function handler(req, res) {
  try {
    console.log("GET /form query=" + JSON.stringify(req.query));
    const { lang, data } = req.query;
    const baseUrl = getBaseUrlForApi(lang);
    const path = `form?lang=${lang}&data=${data}`;
    const url = baseUrl + path;
    console.log("GET /form url=" + url);
    res.redirect(url);
  } catch (x) {
    console.log("catch x=" + x);
    res.sendStatus(500);
  }
};
