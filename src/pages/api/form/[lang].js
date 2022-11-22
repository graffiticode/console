import React from 'react';
import {
  getLanguageAsset,
} from "../../../utils";

export default async function handler(req, res) {
  try {
    const { lang, type = 'js', data } = req.query;
    console.log("GET /form query=" + JSON.stringify(req.query));
    const getHtml = type === 'html';
    const path = getHtml && 'form.html' || 'form.js';
    const mimeType = getHtml && 'text/html' || 'application/javascript';
    if (getHtml) {
      path = `form.html?lang=${lang}&data=${data}`;
    }
    const form = await getLanguageAsset(lang, path);
    res.setHeader("Content-Type", mimeType);
    console.log("GET /form/[lang] mimeType=" + res.getHeader('Content-Type') + " form=" + form);
    res.send(form);
  } catch (x) {
    console.log("catch x=" + x);
  }
};
