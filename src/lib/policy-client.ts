// Server-side client for the policy authority (delegated API permissions).
//
// The console is policy's entry point: it manages a user's connections and
// asks for intent tokens when a user deliberately saves. Policy is a private
// Cloud Run service in project graffiticode; the console calls it with its own
// service account's ID tokens (Cloud Run IAM + X-Caller-Identity) and the
// user's Firebase ID token in Authorization, which policy re-verifies.
//
// Unset POLICY_URL disables connections: every call reports "unavailable"
// rather than falling back to anything.
import { GoogleAuth } from "google-auth-library";

const POLICY_AUDIENCE = "urn:graffiticode:policy";

export class PolicyError extends Error {
  status: number;
  reason?: string;
  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

export type Connection = {
  connectionId: string;
  backend: string;
  status: "active" | "disabled";
  label: string | null;
};

export type ExecutionIntent = { intentToken: string; saveActionId: string | null };

let auth: GoogleAuth | null = null;
const idTokenClients = new Map<string, Promise<any>>();

async function idToken(audience: string): Promise<string> {
  auth ??= new GoogleAuth();
  if (!idTokenClients.has(audience)) {
    idTokenClients.set(audience, auth.getIdTokenClient(audience));
  }
  const client = await idTokenClients.get(audience);
  const headers = await client.getRequestHeaders();
  const value = headers.Authorization ?? headers.authorization;
  if (typeof value !== "string") {
    throw new PolicyError("no service identity token", 503);
  }
  return value.replace(/^Bearer\s+/, "");
}

export function policyEnabled(): boolean {
  return Boolean(process.env.POLICY_URL);
}

async function call(method: string, path: string, userToken: string, body?: unknown) {
  const policyUrl = process.env.POLICY_URL;
  if (!policyUrl) {
    throw new PolicyError("connections are unavailable", 503, "unavailable");
  }
  const [invoker, caller] = await Promise.all([idToken(policyUrl), idToken(POLICY_AUDIENCE)]);
  const res = await fetch(`${policyUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Serverless-Authorization": `Bearer ${invoker}`,
      "X-Caller-Identity": caller,
      Authorization: `Bearer ${userToken}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // fall through with a null body
  }
  if (!res.ok || json?.status !== "success") {
    // Only the reason travels back; policy never returns secrets or tokens in
    // an error, and this never logs a request body.
    throw new PolicyError(`policy ${path} failed (${res.status})`, res.status, json?.error?.reason);
  }
  return json.data;
}

export const listConnections = (userToken: string): Promise<Connection[]> =>
  call("GET", "/v1/connections", userToken);

export const createConnection = (
  userToken: string,
  { backend, label, key, secret }: { backend: string; label?: string | null; key: string; secret: string },
): Promise<Connection> =>
  call("POST", "/v1/connections", userToken, { backend, label: label ?? null, credential: { key, secret } });

export const rotateConnection = (userToken: string, connectionId: string, { key, secret }: { key: string; secret: string }) =>
  call("POST", `/v1/connections/${encodeURIComponent(connectionId)}/rotate`, userToken, { credential: { key, secret } });

export const disableConnection = (userToken: string, connectionId: string) =>
  call("POST", `/v1/connections/${encodeURIComponent(connectionId)}/disable`, userToken, {});

export const deleteConnection = (userToken: string, connectionId: string) =>
  call("DELETE", `/v1/connections/${encodeURIComponent(connectionId)}`, userToken);

// An intent binds a deliberate save (or Author Site session) to this user and
// connection. It is requested only at the entry point where the user acted,
// and travels with that compile (and its job retries) as `intentToken`.
export const issueIntent = (userToken: string, { mode, connectionId }: { mode: "save" | "author"; connectionId: string }): Promise<ExecutionIntent> =>
  call("POST", "/v1/intents", userToken, { mode, connectionId });
