import { getFirestore } from "../utils/db";
import { FreePlanError, buildSignupUrl } from "./free-plan-context";

const db = getFirestore();

const DEFAULT_DAILY_CAP_USD = 20;

function getDailyCapUsd(): number {
  const raw = process.env.FREE_PLAN_DAILY_SPEND_CAP_USD;
  const parsed = raw ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_CAP_USD;
}

function todayKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function nextUtcMidnightIso(now = new Date()): string {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ));
  return next.toISOString();
}

function spendDocRef(now = new Date()) {
  return db.collection("free-plan-state").doc(`spend-${todayKey(now)}`);
}

export async function getTodaySpendUsd(now = new Date()): Promise<number> {
  const snap = await spendDocRef(now).get();
  if (!snap.exists) return 0;
  const data = snap.data() || {};
  const usd = Number(data.usd);
  return Number.isFinite(usd) ? usd : 0;
}

export async function recordSpend(usd: number, now = new Date()): Promise<void> {
  if (!Number.isFinite(usd) || usd <= 0) return;
  const ref = spendDocRef(now);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? Number(snap.data()?.usd) : 0;
    const next = (Number.isFinite(prev) ? prev : 0) + usd;
    tx.set(ref, { usd: next, updated: now.toISOString() }, { merge: true });
  });
}

export function buildCapReachedError(brand?: string, now = new Date()): FreePlanError {
  return new FreePlanError("free_plan_daily_limit_reached", 429, {
    error: "free_plan_daily_limit_reached",
    message:
      "The Graffiticode free plan has reached its daily usage limit and will resume tomorrow UTC. " +
      "Create a free account at graffiticode.org/signup for uninterrupted access.",
    signup_url: buildSignupUrl("circuit_breaker", brand),
    resumes_at: nextUtcMidnightIso(now),
  });
}

export async function assertNotCappedOrThrow(brand?: string, now = new Date()): Promise<void> {
  const cap = getDailyCapUsd();
  const today = await getTodaySpendUsd(now);
  if (today >= cap) {
    throw buildCapReachedError(brand, now);
  }
}
