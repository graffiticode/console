import React from 'react';
import bent from 'bent';
console.log("[id].js loaded");
export default async function handler(req, res) {
  const baseUrl = 'http://localhost:3100/L0';
  const path = '/form.js';
  const getLanguageAsset = bent(baseUrl, "string");
  const asset = await getLanguageAsset(path);
  if (path.indexOf(".svg") > 0) {
    res.setHeader("Content-Type", "image/svg+xml");
  } else if (path.indexOf(".js") > 0) {
    res.setHeader("Content-Type", "application/javascript");
  }
  res.send(asset);
};
