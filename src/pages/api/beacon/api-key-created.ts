// API-key creation beacon.
//
// Key creation runs entirely client-side against the auth service SDK
// (src/components/APIKeysCard.tsx), so no server in this repo ever sees it. This
// route exists solely to make that decision observable to the funnel digest.
//
// Fire-and-forget from the client: always 204, never blocks or fails the UI.

import type { NextApiRequest, NextApiResponse } from "next";
import { emitEvent, actor } from "../../../lib/funnel-events";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const uid = req.body?.uid;
  if (typeof uid === "string" && uid) {
    emitEvent("api_key_created", { ...actor({ uid }), source: req.body?.source });
  }
  return res.status(204).end();
}
