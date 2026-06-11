import { getFirestore } from "../utils/db";
import { FreePlanError, buildSignupUrl } from "./free-plan-context";

const db = getFirestore();

const DEFAULT_BURST_LIMIT = 5;
const DEFAULT_BURST_WINDOW_SECONDS = 60;
const DEFAULT_DAILY_LIMIT = 20;

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function todayKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function buildLimitError(retryAfterSeconds: number, brand?: string): FreePlanError {
  return new FreePlanError("free_plan_rate_limit_exceeded", 429, {
    error: "free_plan_rate_limit_exceeded",
    message:
      "The Graffiticode free plan allows 20 compiles per session per 24 hours. " +
      "Create a free account at graffiticode.org/signup to remove this limit.",
    retry_after_seconds: retryAfterSeconds,
    signup_url: buildSignupUrl("rate_limit", brand),
  });
}

function buildBurstError(
  retryAfterSeconds: number,
  limit: number,
  windowSeconds: number,
  brand?: string,
): FreePlanError {
  return new FreePlanError("free_plan_rate_limit_exceeded", 429, {
    error: "free_plan_rate_limit_exceeded",
    message:
      `The Graffiticode free plan allows ${limit} requests every ${windowSeconds} seconds. ` +
      `Please retry in ${retryAfterSeconds}s, or create a free account at graffiticode.org/signup ` +
      `to remove this limit.`,
    retry_after_seconds: retryAfterSeconds,
    signup_url: buildSignupUrl("rate_limit", brand),
  });
}

// Sliding-window burst limiter: a Firestore doc holding the recent hit
// timestamps (epoch ms) for a namespace, pruned to the window on every call.
// Same correctness/abuse trade-off as checkDailyLimit — a client minting a fresh
// namespace gets a fresh window, so the global daily spend cap remains the real
// backstop. This bounds the in-flight call count, which both stops runaway agent
// loops and limits how far concurrent calls can overshoot the spend cap. Swap for
// a Redis sliding window if per-namespace write volume ever warrants it.
export async function checkBurstLimit(
  namespace: string,
  brand?: string,
  now = new Date(),
): Promise<void> {
  const limit = intEnv("FREE_PLAN_BURST_LIMIT", DEFAULT_BURST_LIMIT);
  const windowSeconds = intEnv("FREE_PLAN_BURST_WINDOW_SECONDS", DEFAULT_BURST_WINDOW_SECONDS);
  const windowMs = windowSeconds * 1000;
  const nowMs = now.getTime();
  const cutoff = nowMs - windowMs;

  const ref = db
    .collection("free-plan-state")
    .doc("sessions")
    .collection(namespace)
    .doc("burst");

  const retryAfterSeconds = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const raw = snap.exists ? snap.data()?.hits : undefined;
    // Keep only hits still inside the window; this prunes the array each call so
    // it stays bounded by `limit` rather than growing unbounded.
    const recent = (Array.isArray(raw) ? raw : [])
      .map(Number)
      .filter((t) => Number.isFinite(t) && t > cutoff);

    if (recent.length >= limit) {
      // Over the limit: persist the pruned window but do NOT record this hit.
      // The caller may retry once the oldest in-window hit ages out a slot.
      const oldest = Math.min(...recent);
      tx.set(ref, { hits: recent, updated: now.toISOString() }, { merge: true });
      return Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    }

    recent.push(nowMs);
    tx.set(ref, { hits: recent, updated: now.toISOString() }, { merge: true });
    return 0;
  });

  if (retryAfterSeconds > 0) {
    throw buildBurstError(retryAfterSeconds, limit, windowSeconds, brand);
  }
}

// Per-session daily limit. Trivially correct (a Firestore counter), not
// abuse-resistant — clients can mint a new UUID to bypass. Replace with Redis
// + per-IP for the real limiter.
export async function checkDailyLimit(
  namespace: string,
  brand?: string,
  now = new Date(),
): Promise<void> {
  const limit = intEnv("FREE_PLAN_DAILY_LIMIT", DEFAULT_DAILY_LIMIT);
  const ref = db
    .collection("free-plan-state")
    .doc("sessions")
    .collection(namespace)
    .doc(todayKey(now));

  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? Number(snap.data()?.count) : 0;
    const incremented = (Number.isFinite(prev) ? prev : 0) + 1;
    tx.set(ref, { count: incremented, updated: now.toISOString() }, { merge: true });
    return incremented;
  });

  if (next > limit) {
    throw buildLimitError(86400, brand);
  }
}
