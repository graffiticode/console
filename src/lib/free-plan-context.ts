import crypto from "crypto";

export const FREE_PLAN_UID = "free-plan";

export const FREE_PLAN_SESSION_HEADER = "x-free-plan-session";

export const FREE_PLAN_ITEM_TTL_MS = 48 * 60 * 60 * 1000;

export type FreePlanContext = {
  freePlan: true;
  uid: typeof FREE_PLAN_UID;
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
    uid: FREE_PLAN_UID,
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
