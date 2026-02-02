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

    // Get current usage
    const usageDoc = await db.collection('usage').doc(uid).get();
    const currentUsage = usageDoc.exists ? (usageDoc.data()?.currentMonthTotal || 0) : 0;

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
    // Fail closed - block on error to prevent unbilled usage
    return {
      allowed: false,
      reason: 'Unable to verify usage limit'
    };
  }
}
