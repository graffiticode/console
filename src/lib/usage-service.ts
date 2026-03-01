import Stripe from "stripe";
import { getFirestore } from "../utils/db";
import { OVERAGE_PRICING } from "./overage-pricing";

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

/**
 * Charge Stripe in background after units have already been credited.
 * If payment fails, flag auto-recharge so user must manually purchase next time.
 */
async function chargeStripeAsync(uid: string, customerId: string, plan: string, units: number, pricePerUnit: number) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2022-08-01',
  });
  const db = getFirestore();

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1,
    });

    if (!paymentMethods.data.length) {
      console.error('Auto-recharge: no payment method for user', uid);
      await db.collection('users').doc(uid).collection('settings').doc('billing').update({
        autoRecharge: false,
        autoRechargeDisabledReason: 'no_payment_method',
        autoRechargeDisabledAt: new Date().toISOString(),
      });
      return;
    }

    const amount = Math.round(units * pricePerUnit * 100); // cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethods.data[0].id,
      confirm: true,
      description: `Auto-recharge: ${units.toLocaleString()} compile units - ${plan} plan`,
      metadata: {
        userId: uid,
        units: units.toString(),
        blocks: '1',
        plan,
        type: 'overage_purchase',
        autoRecharge: 'true',
        pricePerUnit: pricePerUnit.toString(),
      },
    });

    if (paymentIntent.status === 'succeeded') {
      console.log('Auto-recharge: payment succeeded for user', uid, units, 'units');
      // Update overage_purchases record status
      const purchaseQuery = await db.collection('overage_purchases')
        .where('userId', '==', uid)
        .where('status', '==', 'pending_payment')
        .where('autoRecharge', '==', true)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      if (!purchaseQuery.empty) {
        await purchaseQuery.docs[0].ref.update({ status: 'succeeded' });
      }
    } else {
      console.error('Auto-recharge: payment status', paymentIntent.status, 'for user', uid);
      await db.collection('users').doc(uid).collection('settings').doc('billing').update({
        autoRecharge: false,
        autoRechargeDisabledReason: 'payment_failed',
        autoRechargeDisabledAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Auto-recharge: Stripe charge failed for user', uid, error);
    await db.collection('users').doc(uid).collection('settings').doc('billing').update({
      autoRecharge: false,
      autoRechargeDisabledReason: 'payment_failed',
      autoRechargeDisabledAt: new Date().toISOString(),
    });
  }
}

/**
 * Attempt auto-recharge: credit units immediately, charge Stripe async.
 * Returns true if units were credited.
 */
async function tryAutoRecharge(uid: string): Promise<boolean> {
  const db = getFirestore();

  try {
    // Get billing settings
    const settingsDoc = await db.collection('users').doc(uid).collection('settings').doc('billing').get();
    if (!settingsDoc.exists) return false;

    const settings = settingsDoc.data();
    if (!settings?.autoRecharge) return false;

    // Check monthly block limit — reset counter if last recharge was in a previous month
    let blocksUsed = settings.overageBlocksUsedThisPeriod || 0;
    const lastRechargeAt = settings.lastAutoRechargeAt ? new Date(settings.lastAutoRechargeAt) : null;
    const now = new Date();
    if (lastRechargeAt && (lastRechargeAt.getMonth() !== now.getMonth() || lastRechargeAt.getFullYear() !== now.getFullYear())) {
      blocksUsed = 0;
      await db.collection('users').doc(uid).collection('settings').doc('billing').update({
        overageBlocksUsedThisPeriod: 0,
      });
    }
    const limit = settings.autoRechargeLimit || 1;
    if (blocksUsed >= limit) return false;

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    if (!userData?.stripeCustomerId) return false;

    const plan = userData.subscription?.plan || 'demo';
    if (plan === 'demo') return false;

    const pricing = OVERAGE_PRICING[plan];
    if (!pricing) return false;

    const units = pricing.blockSize;
    const currentOverage = userData.subscription?.overageUnits || 0;

    // Credit units immediately
    await db.collection('users').doc(uid).update({
      'subscription.overageUnits': currentOverage + units,
      'subscription.lastOveragePurchase': new Date().toISOString(),
    });

    // Increment blocks used this period
    await db.collection('users').doc(uid).collection('settings').doc('billing').update({
      overageBlocksUsedThisPeriod: blocksUsed + 1,
      lastAutoRechargeAt: new Date().toISOString(),
    });

    // Log the auto-recharge
    await db.collection('overage_purchases').add({
      userId: uid,
      units,
      blocks: 1,
      plan,
      pricePerUnit: pricing.pricePerUnit,
      amount: units * pricing.pricePerUnit,
      timestamp: new Date(),
      status: 'pending_payment',
      autoRecharge: true,
    });

    // TODO Send email to primary account holder notifying them of the auto-recharge

    console.log('Auto-recharge: credited', units, 'units to user', uid, '- charging Stripe async');

    // Charge Stripe in background (fire-and-forget)
    chargeStripeAsync(uid, userData.stripeCustomerId, plan, units, pricing.pricePerUnit).catch(err => {
      console.error('Auto-recharge: background charge error', err);
    });

    return true;
  } catch (error) {
    console.error('Auto-recharge: error for user', uid, error);
    return false;
  }
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
    let allowed = currentUsage <= totalAvailable;

    // If over limit, try auto-recharge
    if (!allowed) {
      const recharged = await tryAutoRecharge(uid);
      if (recharged) {
        // Re-read overage units after crediting
        const refreshedDoc = await db.doc(`users/${uid}`).get();
        const refreshedOverage = refreshedDoc.data()?.subscription?.overageUnits || 0;
        const newTotal = allocatedUnits + refreshedOverage;
        allowed = currentUsage <= newTotal;
        return {
          allowed,
          reason: allowed ? undefined : 'Usage limit reached',
          currentUsage,
          totalAvailable: newTotal,
        };
      }
    }

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
