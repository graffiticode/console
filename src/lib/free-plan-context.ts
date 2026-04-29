import crypto from "crypto";

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

// --- Firebase ID token exchange ---
//
// The api.graffiticode.org auth middleware only accepts Firebase ID tokens (JWTs)
// — it does not fall back to api-key lookup. So when the console forwards a
// free-plan request downstream, it must send an ID token, not the raw api key.
//
// We exchange FREE_PLAN_API_KEY for a Firebase ID token via the auth service +
// Google identity toolkit, and cache the result in-process for ~55 minutes.

const AUTH_URL = process.env.NEXT_PUBLIC_GC_AUTH_URL || "https://auth.graffiticode.org";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

interface FreePlanCredentials {
  idToken: string;
  uid: string;
  expiresAt: number;
}

let credentialsCache: FreePlanCredentials | null = null;
let inFlight: Promise<FreePlanCredentials> | null = null;

function decodeJwtSub(jwt: string): string | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function exchangeApiKeyForIdToken(): Promise<FreePlanCredentials> {
  if (!FIREBASE_API_KEY) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not configured");
  }
  const apiKey = getFreePlanApiKey();

  // Step 1: api key → Firebase custom token
  const authResponse = await fetch(`${AUTH_URL}/authenticate/api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: apiKey }),
  });
  if (!authResponse.ok) {
    throw new Error(`auth /authenticate/api-key failed: ${authResponse.status} ${await authResponse.text()}`);
  }
  const authData = await authResponse.json() as {
    status: string;
    data?: { firebaseCustomToken?: string };
    error?: { message?: string };
  };
  if (authData.status !== "success") {
    throw new Error(`auth failed: ${authData.error?.message || "unknown"}`);
  }
  const customToken = authData.data?.firebaseCustomToken;
  if (!customToken) throw new Error("auth returned no firebaseCustomToken");

  // Step 2: custom token → Firebase ID token
  const fbResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  if (!fbResponse.ok) {
    throw new Error(`firebase signInWithCustomToken failed: ${fbResponse.status} ${await fbResponse.text()}`);
  }
  const fbData = await fbResponse.json() as {
    idToken?: string;
    error?: { message?: string };
  };
  if (!fbData.idToken) {
    throw new Error(`no idToken from firebase: ${fbData.error?.message || "unknown"}`);
  }

  const uid = decodeJwtSub(fbData.idToken);
  if (!uid) throw new Error("could not decode uid from idToken");

  return {
    idToken: fbData.idToken,
    uid,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };
}

export async function getFreePlanCredentials(): Promise<FreePlanCredentials> {
  const now = Date.now();
  if (credentialsCache && credentialsCache.expiresAt > now + 5 * 60 * 1000) {
    return credentialsCache;
  }
  if (!inFlight) {
    inFlight = exchangeApiKeyForIdToken()
      .then(creds => {
        credentialsCache = creds;
        inFlight = null;
        return creds;
      })
      .catch(err => {
        inFlight = null;
        throw err;
      });
  }
  return inFlight;
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
