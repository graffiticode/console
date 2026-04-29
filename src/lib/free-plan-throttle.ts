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

// Stub for the burst limiter. Today this is a no-op so the wire-up is in place
// without standing up Redis. When Redis lands, replace this with a sliding-window
// counter keyed by namespace.
export async function checkBurstLimit(
  _namespace: string,
  _brand?: string,
): Promise<void> {
  void intEnv("FREE_PLAN_BURST_LIMIT", DEFAULT_BURST_LIMIT);
  void intEnv("FREE_PLAN_BURST_WINDOW_SECONDS", DEFAULT_BURST_WINDOW_SECONDS);
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
