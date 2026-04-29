import type { NextApiRequest, NextApiResponse } from "next";
import bent from "bent";
import { getBaseUrlForApi } from "../../lib/api";
import { getFreePlanCredentials, isFreePlanRequest } from "../../lib/free-plan-context";

const FREE_PLAN_PREFIX = "free-plan ";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Free-Plan-Session");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const freePlan = isFreePlanRequest(req);
  const incomingAuth = (req.headers.authorization as string) || "";
  let downstreamAuth: string;

  if (freePlan.freePlan || incomingAuth.startsWith(FREE_PLAN_PREFIX)) {
    try {
      const { idToken } = await getFreePlanCredentials();
      downstreamAuth = idToken;
    } catch (err) {
      res.status(500).json({ error: "free_plan_misconfigured", message: err instanceof Error ? err.message : String(err) });
      return;
    }
  } else {
    if (!incomingAuth) {
      res.status(401).json({ error: "unauthenticated" });
      return;
    }
    downstreamAuth = incomingAuth;
  }

  try {
    const headers = {
      authorization: downstreamAuth,
      "x-graffiticode-storage-type": "persistent",
    };
    const post = bent(getBaseUrlForApi(), "POST", "json", headers);
    const resp = await post("/compile", req.body);
    res.status(200).json(resp);
  } catch (err: any) {
    const status = typeof err?.statusCode === "number" ? err.statusCode : 502;
    let body: unknown = { error: "compile_proxy_failed", message: err?.message };
    if (typeof err?.json === "function") {
      try {
        body = await err.json();
      } catch {
        // fall back to default body
      }
    }
    res.status(status).json(body);
  }
}
