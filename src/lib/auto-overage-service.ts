import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { getFirestore } from '../utils/db';
import { AUTO_OVERAGE_INCREMENTS } from './overage-pricing';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-08-01' })
  : null;

// Hold a per-user lock this long while a charge is in flight, so the hot path
// (called per compile) can't fire multiple charges before units are credited.
const LOCK_MS = 60_000;

export interface AutoOverageResult {
  charged: boolean;
  unitsAdded: number;
}

/**
 * Charge a single auto-overage increment ($10 Pro / $100 Team) and credit the
 * units, if the user has auto-overage enabled and is on an eligible plan.
 *
 * Safe to call on the hot path: a Firestore lock dedups concurrent calls, and
 * the invoice is tagged `type: 'auto_overage'` so the Stripe webhook does NOT
 * double-credit (this function credits synchronously to unblock immediately).
 */
export async function chargeAutoOverage(uid: string): Promise<AutoOverageResult> {
  if (!stripe) return { charged: false, unitsAdded: 0 };

  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  const nowMs = Date.now();

  let increment: { amountUsd: number; units: number } | undefined;
  let stripeCustomerId: string | undefined;
  let plan = '';

  // Acquire lock + validate eligibility atomically.
  const acquired = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return false;
    const data = snap.data() || {};
    const sub = data.subscription || {};
    if (!sub.autoOverageEnabled) return false;
    plan = sub.plan || 'demo';
    increment = AUTO_OVERAGE_INCREMENTS[plan];
    if (!increment) return false;
    stripeCustomerId = data.stripeCustomerId;
    if (!stripeCustomerId) return false;
    if ((sub.autoOverageLockUntil || 0) > nowMs) return false; // charge in flight
    tx.update(userRef, { 'subscription.autoOverageLockUntil': nowMs + LOCK_MS });
    return true;
  });

  if (!acquired || !increment || !stripeCustomerId) return { charged: false, unitsAdded: 0 };

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
      limit: 1,
    });
    if (!paymentMethods.data.length) {
      await userRef.update({ 'subscription.autoOverageLockUntil': 0 });
      return { charged: false, unitsAdded: 0 };
    }

    const amount = Math.round(increment.amountUsd * 100); // cents
    const description = `Auto overage: ${increment.units.toLocaleString()} compile units ($${increment.amountUsd}) - ${plan} plan`;
    const metadata = {
      userId: uid,
      units: String(increment.units),
      plan,
      type: 'auto_overage',
    };

    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      description,
      auto_advance: true,
      collection_method: 'charge_automatically',
      default_payment_method: paymentMethods.data[0].id,
      metadata,
    });

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoice.id,
      amount,
      currency: 'usd',
      description,
      metadata,
    });

    const paid = await stripe.invoices.pay(invoice.id);
    if (paid.status !== 'paid') {
      await userRef.update({ 'subscription.autoOverageLockUntil': 0 });
      return { charged: false, unitsAdded: 0 };
    }

    // Credit units synchronously and release the lock.
    await userRef.update({
      'subscription.overageUnits': admin.firestore.FieldValue.increment(increment.units),
      'subscription.lastOveragePurchase': new Date().toISOString(),
      'subscription.autoOverageLockUntil': 0,
    });

    await db.collection('overage_purchases').add({
      userId: uid,
      units: increment.units,
      blocks: 1,
      plan,
      amount: amount / 100,
      invoiceId: paid.id,
      timestamp: new Date(),
      status: 'completed',
      auto: true,
    });

    return { charged: true, unitsAdded: increment.units };
  } catch (error) {
    console.error('chargeAutoOverage error:', error);
    try {
      await userRef.update({ 'subscription.autoOverageLockUntil': 0 });
    } catch {
      /* best-effort lock release */
    }
    return { charged: false, unitsAdded: 0 };
  }
}
