import type { NextApiRequest, NextApiResponse } from "next";
import { verifyClaimToken } from "../../lib/claim-token";
import { logClaimView } from "./resolvers";

const ALLOWED_SRC = new Set(["chat", "footer", "unknown"]);

/**
 * Records that a claim link was opened.
 *
 * Fires before sign-in — that's the point, since the drop-off being measured is
 * between opening the link and completing an account. So it can't ride on the
 * authenticated GraphQL path.
 *
 * The token is VERIFIED rather than trusted, for two reasons: it yields the real
 * sessionNamespace, which is what the funnel report joins on, and it means the
 * endpoint can't be used to write arbitrary sessions into the log. An invalid
 * token is answered 204 all the same — this is telemetry, and a caller has
 * nothing to learn from us about why a token didn't verify.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { token, src } = (req.body || {}) as { token?: string; src?: string };
  if (!token) {
    res.status(204).end();
    return;
  }

  try {
    const { sessionNamespace } = await verifyClaimToken(token);
    logClaimView({
      session: sessionNamespace,
      src: ALLOWED_SRC.has(String(src)) ? String(src) : "unknown",
    });
  } catch {
    // Expired or forged token — nothing to record, and nothing to report.
  }

  res.status(204).end();
}
