// Email identity for sharing a connection. The owner names a person by email;
// the auth service maps a linked email to an account. An email with no account
// is shared as a hash, and becomes a grant when that person signs in with it,
// so the owner sees the same result either way and learns nothing about
// whether an account exists. Emails are never logged.
import { createHash } from "crypto";

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_GC_AUTH_URL || "https://auth.graffiticode.org";
const INTERNAL_API_KEY = process.env.AUTH_SERVICE_INTERNAL_API_KEY || process.env.INTERNAL_API_KEY || "";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const emailHash = (email: string) => createHash("sha256").update(normalizeEmail(email)).digest("hex");

export const isEmail = (email: unknown): email is string =>
  typeof email === "string" && email.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

// The account an email is linked to, or null. Null also when the lookup is
// unavailable: the share then waits as pending rather than failing.
export async function accountForEmail(email: string): Promise<string | null> {
  if (!INTERNAL_API_KEY) return null;
  try {
    const url = `${AUTH_SERVICE_URL.replace(/\/$/, "")}/linked-emails/internal/lookup?email=${encodeURIComponent(normalizeEmail(email))}`;
    const res = await fetch(url, { headers: { "X-Internal-API-Key": INTERNAL_API_KEY } });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.status === "success" && body.data?.matched && typeof body.data.uid === "string" ? body.data.uid : null;
  } catch {
    return null;
  }
}

// Hashes of the signed-in user's own verified emails, for claiming pending
// shares. Empty when the auth service cannot be reached.
export async function verifiedEmailHashes(userToken: string): Promise<string[]> {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL.replace(/\/$/, "")}/linked-emails`, { headers: { Authorization: userToken } });
    if (!res.ok) return [];
    const body = await res.json();
    const emails: any[] = body?.data?.emails || [];
    return [...new Set(emails.filter(e => e?.verifiedAt && typeof e.email === "string").map(e => emailHash(e.email)))].slice(0, 20);
  } catch {
    return [];
  }
}
