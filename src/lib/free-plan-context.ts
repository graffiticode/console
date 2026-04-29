import crypto from "crypto";
import { client as authClient } from "./auth";

export const FREE_PLAN_SESSION_HEADER = "x-free-plan-session";

export const FREE_PLAN_ITEM_TTL_MS = 48 * 60 * 60 * 1000;

export type FreePlanContext = {
  freePlan: true;
  sessionUuid: string;
  sessionNamespace: string;
};

export function deriveSessionNamespace(uuid: string): string {
  const salt = process.env.FREE_PLAN_NAMESPACE_SALT || "";
  return crypto.createHash("sha256").update(`${salt}:${uuid}`).digest("hex");
}

function readHeader(req, name: string): string | undefined {
  const value = req.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function isFreePlanRequest(req): FreePlanContext | { freePlan: false } {
  const sessionUuid = readHeader(req, FREE_PLAN_SESSION_HEADER);
  if (!sessionUuid) return { freePlan: false };
  return {
    freePlan: true,
    sessionUuid,
    sessionNamespace: deriveSessionNamespace(sessionUuid),
  };
}

export function getFreePlanApiKey(): string {
  const key = process.env.FREE_PLAN_API_KEY;
  if (!key) {
    throw new Error("FREE_PLAN_API_KEY is not configured");
  }
  return key;
}

// Resolve the UID that owns FREE_PLAN_API_KEY by asking the auth service. We
// cache the result in-process; rotating the API key + redeploying yields a
// fresh resolution on the next process. If the lookup fails (auth service
// down, key not registered), we clear the cache so the next request retries.
let freePlanUidPromise: Promise<string> | null = null;

export function getFreePlanUid(): Promise<string> {
  if (!freePlanUidPromise) {
    freePlanUidPromise = (async () => {
      const apiKey = getFreePlanApiKey();
      try {
        const result = await authClient.apiKeys.authenticate({ token: apiKey });
        const uid = result?.uid;
        if (!uid) {
          throw new Error("auth service did not return a uid for FREE_PLAN_API_KEY");
        }
        return uid;
      } catch (err) {
        freePlanUidPromise = null;
        throw err;
      }
    })();
  }
  return freePlanUidPromise;
}

export class FreePlanError extends Error {
  readonly code: string;
  readonly status: number;
  readonly payload: Record<string, unknown>;
  readonly extensions: Record<string, unknown>;

  constructor(code: string, status: number, payload: Record<string, unknown>) {
    super(typeof payload.message === "string" ? payload.message : code);
    this.code = code;
    this.status = status;
    this.payload = payload;
    this.extensions = { code, status, ...payload };
  }
}

export function buildSignupUrl(medium: string, brand?: string): string {
  const params = new URLSearchParams({
    utm_source: "free_plan",
    utm_medium: medium,
  });
  if (brand) params.set("utm_campaign", brand);
  return `https://graffiticode.org/signup?${params.toString()}`;
}
