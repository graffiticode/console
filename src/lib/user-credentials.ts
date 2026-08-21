// Per-user credential storage, split across two docs under users/{uid}/settings:
//   - secrets doc:     { <name>: { backend?, value: <ciphertext>, updatedAt } } -> get-val-private
//   - credentials doc: { <name>: { backend?, value: <plaintext>,  updatedAt } } -> get-val-public
// The public read path never opens the secrets doc, so a secret value cannot be
// returned in cleartext through get-val-public.
//
// Extracted from pages/api/resolvers.ts so the code-generation layer can load
// parse values without importing a Next.js API module. resolvers.ts re-exports
// the two loaders and still owns the credential-management mutations, which is
// why the doc refs and StoredVar are exported rather than kept private.
import { getFirestore } from "../utils/db";
import { decrypt } from "./secret-crypto";

const db = getFirestore();

export type StoredVar = { backend?: string; value: string; updatedAt: string };

export function secretsDocRef(uid: string) {
  return db.collection('users').doc(uid).collection('settings').doc('secrets');
}

export function credentialsDocRef(uid: string) {
  return db.collection('users').doc(uid).collection('settings').doc('credentials');
}

// Loads the user's private credential fields as a plaintext name->value map for
// the private parse callback. Never throws into the parse path — returns {} on
// any failure. Reads ONLY the secrets doc.
export async function getSecretsForUser(uid: string): Promise<Record<string, string>> {
  try {
    if (!uid) return {};
    const doc = await secretsDocRef(uid).get();
    if (!doc.exists) return {};
    const stored = (doc.data()?.secrets || {}) as Record<string, StoredVar>;
    const out: Record<string, string> = {};
    for (const [name, entry] of Object.entries(stored)) {
      if (entry?.value != null) out[name] = decrypt(entry.value);
    }
    return out;
  } catch (err) {
    console.error("getSecretsForUser failed:", err);
    return {};
  }
}

// Loads the user's public credential fields as a plaintext name->value map for
// the public parse callback. Never throws into the parse path — returns {} on
// any failure. Reads ONLY the credentials doc (never the secrets doc).
export async function getPublicValuesForUser(uid: string): Promise<Record<string, string>> {
  try {
    if (!uid) return {};
    const doc = await credentialsDocRef(uid).get();
    if (!doc.exists) return {};
    const stored = (doc.data()?.credentials || {}) as Record<string, StoredVar>;
    const out: Record<string, string> = {};
    for (const [name, entry] of Object.entries(stored)) {
      if (entry?.value != null && entry.value !== "") out[name] = entry.value;
    }
    return out;
  } catch (err) {
    console.error("getPublicValuesForUser failed:", err);
    return {};
  }
}
