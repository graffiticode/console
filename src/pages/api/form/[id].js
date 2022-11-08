import React from 'react';
import {
  getLanguageAsset,
} from "../../../utils";

export default async function handler(req, res) {
  const { id } = req.query;
  const lang = '0';
  const path = '/form.js';
  const form = await getLanguageAsset(lang, path);
  if (path.indexOf(".svg") > 0) {
    res.setHeader("Content-Type", "image/svg+xml");
  } else if (path.indexOf(".js") > 0) {
    res.setHeader("Content-Type", "application/javascript");
  }
  res.send(form);
};
