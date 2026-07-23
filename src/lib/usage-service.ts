import { getFirestore } from "../utils/db";
import { includedItemsFor, isHardCapped, DEFAULT_PLAN } from "./plans-config";

export interface ItemCreateAllowedResult {
  allowed: boolean;
  reason?: string;
  /** Items created this billing period. */
  currentUsage?: number;
  /** Included + (customer overage limit, if any). Infinity when uncapped. */
  totalAvailable?: number;
}

/**
 * Gate item CREATION against the account's item budget for the period.
 *
 * - Free/hard-cap tiers: blocked once `currentUsage >= includedItems`.
 * - Paid tiers: allowed up to `includedItems + overageLimitItems`; when the
 *   customer set no overage cap (`overageLimitItems` null/absent), unlimited —
 *   overage bills in arrears via the Stripe meter.
 *
 * currentUsage is the item count for the period. It is derived from the stored
 * counter, self-healed against the sum of `units` on usage records since the
 * period start (billable item records carry units: 1; compiles/generations
 * carry units: 0, so the sum equals the item count).
 */
export async function checkItemCreateAllowed(uid: string): Promise<ItemCreateAllowedResult> {
  try {
    const db = getFirestore();

    // Current usage from the stored counter.
    const usageDoc = await db.collection('usage').doc(uid).get();
    let currentUsage = usageDoc.exists ? (usageDoc.data()?.currentMonthTotal || 0) : 0;

    // Subscription → plan, included allowance, optional customer overage cap.
    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.data() || {};
    const subscription = userData.subscription || {};
    const plan = subscription.plan || DEFAULT_PLAN;
    let includedItems = includedItemsFor(plan);

    // Preserved allocation from a downgrade keeps the old (larger) bucket for a grace window.
    const now = new Date();
    const preservedUntil = subscription.preservedUntil;
    const preservedAllocation = subscription.preservedAllocation;
    if (preservedUntil && preservedAllocation && new Date(preservedUntil) > now) {
      includedItems = preservedAllocation;
    }

    // Self-heal the stored counter against the actual records for the period.
    try {
      const periodStart = subscription.currentPeriodStart
        ? new Date(subscription.currentPeriodStart)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const usageRecords = await db.collection('usage')
        .where('userId', '==', uid)
        .where('createdAt', '>=', periodStart)
        .get();
      let calculatedTotal = 0;
      usageRecords.docs.forEach(doc => {
        calculatedTotal += doc.data().units || 0;
      });
      if (calculatedTotal !== currentUsage) {
        console.log(`checkItemCreateAllowed: syncing stored (${currentUsage}) → calculated (${calculatedTotal})`);
        currentUsage = calculatedTotal;
        await db.collection('usage').doc(uid).update({ currentMonthTotal: calculatedTotal });
      }
    } catch (err) {
      console.error('checkItemCreateAllowed: error calculating actual usage', err);
    }

    // Hard-cap (Free): no overage path — blocked at the included bucket.
    if (isHardCapped(plan)) {
      const totalAvailable = includedItems;
      return {
        allowed: currentUsage < totalAvailable,
        reason: currentUsage < totalAvailable ? undefined : 'Free plan item limit reached — upgrade to create more',
        currentUsage,
        totalAvailable,
      };
    }

    // Paid: allow up to the customer's overage cap, or unlimited when unset.
    const overageLimit = typeof subscription.overageLimitItems === 'number'
      ? subscription.overageLimitItems
      : null;
    const totalAvailable = overageLimit === null ? Infinity : includedItems + overageLimit;
    const allowed = currentUsage < totalAvailable;
    return {
      allowed,
      reason: allowed ? undefined : 'Overage spend limit reached — raise or remove your cap to create more',
      currentUsage,
      totalAvailable,
    };
  } catch (error) {
    console.error('checkItemCreateAllowed error:', error);
    // Fail open on infra errors so a transient Firestore blip doesn't block creation.
    return { allowed: true, reason: 'Unable to verify item limit' };
  }
}
