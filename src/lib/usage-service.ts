import { getFirestore } from "../utils/db";

const PLAN_ALLOCATIONS = {
  demo: 100,
  starter: 2000,
  pro: 100000,
  teams: 2000000
};

export interface CompileAllowedResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  totalAvailable?: number;
}

export async function checkCompileAllowed(uid: string): Promise<CompileAllowedResult> {
  try {
    const db = getFirestore();

    // Get current usage from stored total
    const usageDoc = await db.collection('usage').doc(uid).get();
    let currentUsage = usageDoc.exists ? (usageDoc.data()?.currentMonthTotal || 0) : 0;

    // Get subscription and calculate available units
    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.data() || {};
    const subscription = userData.subscription || {};
    const plan = subscription.plan || 'demo';
    let allocatedUnits = PLAN_ALLOCATIONS[plan] || PLAN_ALLOCATIONS.demo;
    const overageUnits = subscription.overageUnits || 0;

    // Check for preserved allocation (from downgrade)
    const now = new Date();
    const preservedUntil = subscription.preservedUntil;
    const preservedAllocation = subscription.preservedAllocation;
    if (preservedUntil && preservedAllocation && new Date(preservedUntil) > now) {
      allocatedUnits = preservedAllocation;
    }

    // Cross-check stored total against actual usage records for the billing period
    // The stored total can get out of sync (e.g. after calendar month reset vs billing period)
    try {
      // Use billing period start from Stripe subscription, fall back to first of month
      let periodStart: Date;
      if (subscription.currentPeriodStart) {
        periodStart = new Date(subscription.currentPeriodStart);
      } else {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const usageRecords = await db.collection('usage')
        .where('userId', '==', uid)
        .where('createdAt', '>=', periodStart)
        .get();
      let calculatedTotal = 0;
      usageRecords.docs.forEach(doc => {
        calculatedTotal += doc.data().units || 0;
      });
      if (calculatedTotal > currentUsage) {
        console.log(`checkCompileAllowed: using calculated total (${calculatedTotal}) instead of stored (${currentUsage})`);
        currentUsage = calculatedTotal;
        // Fix the stored total
        await db.collection('usage').doc(uid).update({ currentMonthTotal: calculatedTotal });
      }
    } catch (err) {
      console.error('checkCompileAllowed: error calculating actual usage', err);
    }

    const totalAvailable = allocatedUnits + overageUnits;
    const allowed = currentUsage <= totalAvailable;

    return {
      allowed,
      reason: allowed ? undefined : 'Usage limit reached',
      currentUsage,
      totalAvailable
    };
  } catch (error) {
    console.error('checkCompileAllowed error:', error);
    return {
      allowed: false,
      reason: 'Unable to verify usage limit'
    };
  }
}
