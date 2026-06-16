/* Versioned, rotatable symmetric encryption for account secrets and
 * get-val-private values.
 *
 * Ciphertext formats
 * ------------------
 *   Legacy (unversioned, AES-256-CBC, deterministic IV):
 *       <ivHex>:<encHex>
 *   Versioned (AES-256-GCM, random IV, authenticated):
 *       v<N>:<ivHex>:<ctHex>:<tagHex>
 *
 * decrypt() understands BOTH and selects the key by version. encrypt() emits
 * the legacy CBC format by default (GRAFFITICODE_SECRET_KEY_VERSION unset/0) so
 * older compiler services that only understand the legacy format keep working.
 * Once every console + compiler service has been upgraded AND has the target
 * key in its keyring, set GRAFFITICODE_SECRET_KEY_VERSION=<N> on the console to
 * start writing GCM under key N. This is the change that makes rotation
 * possible without breaking already-stored ciphertext.
 *
 * Keyring (resolved from env)
 * ---------------------------
 *   v1                : GRAFFITICODE_SECRET_KEY            (the canonical key)
 *   v2, v3, ...       : GRAFFITICODE_SECRET_KEYS, a JSON object e.g.
 *                       {"2":"<secret2>","3":"<secret3>"}
 *   write version     : GRAFFITICODE_SECRET_KEY_VERSION    (0/unset => legacy)
 *
 * IMPORTANT: bump GRAFFITICODE_SECRET_KEY_VERSION only AFTER key N is present in
 * the keyring of every service that decrypts (all l0NNN compiler services and
 * the console). The console encrypts; the compiler services decrypt — if the
 * console writes a version a compiler can't read, compiles break.
 */
import crypto from "crypto";

const GCM_IV_BYTES = 12;
const VERSIONED_RE = /^v(\d+):/;

function keyForVersion(version: number): string | null {
  if (version === 1) {
    // v1 is always the canonical single key, so single-key deployments work.
    return process.env.GRAFFITICODE_SECRET_KEY || null;
  }
  const raw = process.env.GRAFFITICODE_SECRET_KEYS;
  if (!raw) return null;
  try {
    const ring = JSON.parse(raw) as Record<string, string>;
    return ring[String(version)] || null;
  } catch {
    return null;
  }
}

function deriveAesKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

// Version that NEW ciphertext is written under. 0 (or unset) => legacy CBC.
export function currentVersion(): number {
  const v = parseInt(process.env.GRAFFITICODE_SECRET_KEY_VERSION || "0", 10);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

// True when encrypt() will actually encrypt (vs. passthrough). Used to refuse
// storing secrets when no usable key is configured.
export function isConfigured(): boolean {
  const v = currentVersion();
  return v === 0 ? !!keyForVersion(1) : !!keyForVersion(v);
}

function encryptLegacy(plaintext: string, secret: string): string {
  const iv = crypto.createHmac("sha256", secret).update(plaintext).digest().subarray(0, 16);
  const cipher = crypto.createCipheriv("aes-256-cbc", deriveAesKey(secret), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + enc.toString("hex");
}

function encryptGcm(plaintext: string, version: number, secret: string): string {
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveAesKey(secret), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v${version}:${iv.toString("hex")}:${ct.toString("hex")}:${tag.toString("hex")}`;
}

export function encrypt(plaintext: string): string {
  const version = currentVersion();
  if (version === 0) {
    // Legacy mode (default). Passthrough when no key — preserves prior behavior
    // for local dev / unconfigured environments.
    const secret = keyForVersion(1);
    return secret ? encryptLegacy(plaintext, secret) : plaintext;
  }
  const secret = keyForVersion(version);
  if (!secret) {
    throw new Error(`No key configured for GRAFFITICODE_SECRET_KEY_VERSION=${version}.`);
  }
  return encryptGcm(plaintext, version, secret);
}

export function decrypt(ciphertext: string): string {
  if (typeof ciphertext !== "string") return ciphertext;

  const versioned = ciphertext.match(VERSIONED_RE);
  if (versioned) {
    const version = parseInt(versioned[1], 10);
    const [, ivHex, ctHex, tagHex] = ciphertext.split(":");
    const secret = keyForVersion(version);
    if (!secret || !ivHex || !ctHex || !tagHex) return ciphertext;
    try {
      const decipher = crypto.createDecipheriv("aes-256-gcm", deriveAesKey(secret), Buffer.from(ivHex, "hex"));
      decipher.setAuthTag(Buffer.from(tagHex, "hex"));
      const dec = Buffer.concat([decipher.update(Buffer.from(ctHex, "hex")), decipher.final()]);
      return dec.toString("utf8");
    } catch {
      // Wrong key or tampered ciphertext. Stay lenient (don't crash the parse/
      // compile path); the bad value simply fails downstream.
      return ciphertext;
    }
  }

  // Legacy CBC: <ivHex>:<encHex>
  const secret = keyForVersion(1);
  if (!secret) return ciphertext;
  const [ivHex, encHex] = ciphertext.split(":");
  if (!ivHex || !encHex) return ciphertext;
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", deriveAesKey(secret), Buffer.from(ivHex, "hex"));
    const dec = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return ciphertext;
  }
}

// Re-encrypt a stored value under the current write version if it isn't already
// in that format. Returns null when no rewrite is needed (so callers skip the
// write). Used for lazy / backfill key migration.
export function reencryptToCurrent(ciphertext: string): string | null {
  const version = currentVersion();
  const isVersioned = VERSIONED_RE.test(ciphertext);
  if (version === 0 && !isVersioned) return null;             // already legacy
  if (version > 0 && new RegExp(`^v${version}:`).test(ciphertext)) return null; // already current
  const plain = decrypt(ciphertext);
  if (plain === ciphertext) return null;                      // couldn't decrypt — leave as-is
  return encrypt(plain);
}
