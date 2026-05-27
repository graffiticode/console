import type { NextApiRequest, NextApiResponse } from "next";
import { readSsoCookie } from "@graffiticode/auth-react/server";

// GET: cheaply report whether the shared SSO cookie is present (no token
// exchange). Used by the single-sign-out watcher to detect a sign-out that
// happened on a sibling app.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ present: false });
  }
  const present = !!readSsoCookie(req.headers.cookie);
  return res.status(200).json({ present });
}
