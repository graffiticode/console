import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';
import admin from '../../../utils/db';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-08-01',
});

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Map Stripe price IDs to our plan names
const PLAN_MAPPING = {
  [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '']: { name: 'starter', units: 5000 },
  [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || '']: { name: 'starter', units: 5000 },
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: { name: 'pro', units: 100000 },
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '']: { name: 'pro', units: 100000 },
  [process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID || '']: { name: 'teams', units: 2000000 },
  [process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID || '']: { name: 'teams', units: 2000000 },
};

// Detach duplicate cards (same fingerprint) for a customer, keeping exactly one.
// Runs on payment_method.attached, so it covers every entry point: Checkout,
// SetupIntent, and the manual add endpoint. Exported for the one-off cleanup
// script (scripts/dedupe-payment-methods.ts).
export async function dedupePaymentMethods(
  stripeClient: Stripe,
  customerId: string,
  attachedPmId: string,
): Promise<{ keepId: string; detached: string[] } | undefined> {
  const attached = await stripeClient.paymentMethods.retrieve(attachedPmId);
  const fingerprint = attached.card?.fingerprint;
  if (!fingerprint) return;

  // All card PMs sharing this fingerprint = the same physical card.
  const all = await stripeClient.paymentMethods.list({ customer: customerId, type: 'card' });
  const dupes = all.data.filter((pm) => pm.card?.fingerprint === fingerprint);
  if (dupes.length < 2) return; // nothing to collapse

  const customer = (await stripeClient.customers.retrieve(customerId)) as Stripe.Customer;
  const customerDefault = customer.invoice_settings?.default_payment_method as string | undefined;

  // Protect any PM an in-use subscription points at (covers the Checkout race
  // where the new card was just wired up as the subscription's default).
  const subs = await stripeClient.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
  const protectedIds = new Set<string>(
    subs.data
      .filter((s) => ['active', 'trialing', 'past_due', 'incomplete'].includes(s.status))
      .map((s) => s.default_payment_method as string)
      .filter(Boolean),
  );

  // Keep the customer's current default if it's one of the dupes; otherwise keep
  // the newest (the just-attached card) and promote it to default.
  let keepId = dupes.find((pm) => pm.id === customerDefault)?.id;
  if (!keepId) {
    keepId = dupes.reduce((a, b) => (a.created > b.created ? a : b)).id;
    await stripeClient.customers.update(customerId, {
      invoice_settings: { default_payment_method: keepId },
    });
  }

  const detached: string[] = [];
  for (const pm of dupes) {
    if (pm.id === keepId || protectedIds.has(pm.id)) continue;
    await stripeClient.paymentMethods.detach(pm.id);
    detached.push(pm.id);
  }
  return { keepId, detached };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  const db = getFirestore();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No userId in checkout session metadata');
          break;
        }

        // Handle setup mode sessions (e.g., adding payment method to resume subscription)
        if (session.mode === 'setup' && session.metadata?.action === 'resume_subscription') {
          const subscriptionId = session.metadata.subscriptionId;

          if (subscriptionId) {
            // Resume the subscription
            await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: false,
            });

            // Update user document
            await db.collection('users').doc(userId).update({
              'subscription.status': 'active',
              'subscription.cancelAt': null,
              'subscription.canceledAt': null,
              'subscription.resumedAt': new Date().toISOString(),
            });

            // Log the event
            await db.collection('subscription_events').add({
              userId,
              type: 'subscription_resumed_via_checkout',
              sessionId: session.id,
              subscriptionId,
              timestamp: new Date(),
            });
          }

          break;
        }

        // Update user's subscription status
        await db.collection('users').doc(userId).update({
          'subscription.status': 'active',
          'subscription.stripeSubscriptionId': session.subscription,
          'subscription.updatedAt': new Date().toISOString(),
        });

        // Log the event
        await db.collection('subscription_events').add({
          userId,
          type: 'checkout_completed',
          sessionId: session.id,
          subscriptionId: session.subscription,
          timestamp: new Date(),
        });

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersQuery = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (usersQuery.empty) {
          console.error('No user found for customer:', customerId);
          break;
        }

        const userDoc = usersQuery.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Get plan details
        const firstItem = subscription.items.data[0] as any;
        const priceId = firstItem?.price.id;
        const planInfo = PLAN_MAPPING[priceId] || { name: 'starter', units: 5000 };

        // API-version resilience: current_period_start/end moved from the
        // Subscription to its items in 2025-03-31.basil. Read the top-level
        // field (<=2024 payloads) or fall back to the first item (>=basil,
        // incl. the account-default 2026 endpoint). Guard undefined so a
        // missing value never yields an "Invalid Date".
        const sub = subscription as any;
        const periodStart = sub.current_period_start ?? firstItem?.current_period_start;
        const periodEnd = sub.current_period_end ?? firstItem?.current_period_end;

        // Build update object
        const updateData: Record<string, any> = {
          'subscription.status': subscription.status,
          'subscription.plan': planInfo.name,
          'subscription.units': planInfo.units,
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.currentPeriodStart': periodStart ? new Date(periodStart * 1000).toISOString() : null,
          'subscription.currentPeriodEnd': periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          'subscription.updatedAt': new Date().toISOString(),
          // Note: overageUnits field is intentionally NOT updated here - overage persists across billing cycles
        };

        // Record trial usage if this is a trialing subscription and user hasn't used trial before
        if (subscription.status === 'trialing' && !userData?.trialUsedAt) {
          updateData.trialUsedAt = new Date().toISOString();
        }

        await db.collection('users').doc(userId).update(updateData);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersQuery = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (usersQuery.empty) {
          console.error('No user found for customer:', customerId);
          break;
        }

        const userDoc = usersQuery.docs[0];
        const userId = userDoc.id;

        // Reset to free tier but preserve overage units (they're purchased separately)
        await db.collection('users').doc(userId).update({
          'subscription.status': 'canceled',
          'subscription.plan': 'demo',
          'subscription.units': 250,
          'subscription.stripeSubscriptionId': null,
          'subscription.canceledAt': new Date().toISOString(),
          // DO NOT reset overage units - they roll over and persist until used
        });

        // Log the event
        await db.collection('subscription_events').add({
          userId,
          type: 'subscription_canceled',
          subscriptionId: subscription.id,
          timestamp: new Date(),
        });

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const usersQuery = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersQuery.empty) {
          const userDoc = usersQuery.docs[0];
          const userId = userDoc.id;

          // Log successful payment
          await db.collection('payment_events').add({
            userId,
            type: 'invoice_paid',
            invoiceId: invoice.id,
            amount: invoice.amount_paid / 100,
            timestamp: new Date(),
          });

          if (invoice.metadata?.type === 'overage_purchase') {
            // Overage invoice: credit units
            const units = parseInt(invoice.metadata.units);
            const blocks = parseInt(invoice.metadata.blocks || '1');
            const plan = invoice.metadata.plan;
            const pricePerUnit = parseFloat(invoice.metadata.pricePerUnit || '0');

            if (units) {
              const userData = userDoc.data();
              const currentOverage = userData?.subscription?.overageUnits || 0;

              await db.collection('users').doc(userId).update({
                'subscription.overageUnits': currentOverage + units,
                'subscription.lastOveragePurchase': new Date().toISOString(),
              });

              await db.collection('overage_purchases').add({
                userId,
                units,
                blocks,
                plan,
                pricePerUnit,
                amount: invoice.amount_paid / 100,
                invoiceId: invoice.id,
                timestamp: new Date(),
                status: 'completed',
                webhookProcessed: true,
              });
            }
          } else if ((invoice as any).subscription ?? (invoice as any).parent?.subscription_details?.subscription) {
            // Subscription invoice: reset usage counter for new billing period.
            // invoice.subscription moved to invoice.parent.subscription_details
            // .subscription in 2025-03-31.basil; accept either shape.
            await db.collection('usage').doc(userId).set({
              currentMonthTotal: 0,
              lastReset: new Date().toISOString(),
            }, { merge: true });

            // Clear preserved allocation on renewal (subscription invoice paid)
            // This happens when a downgraded plan renews for the first time
            const userData = userDoc.data();
            if (userData?.subscription?.preservedAllocation) {
              await db.collection('users').doc(userId).update({
                'subscription.preservedAllocation': admin.firestore.FieldValue.delete(),
                'subscription.preservedUntil': admin.firestore.FieldValue.delete(),
              });
            }
          }
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const usersQuery = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersQuery.empty) {
          const userDoc = usersQuery.docs[0];
          const userId = userDoc.id;

          // Log failed payment
          await db.collection('payment_events').add({
            userId,
            type: 'payment_failed',
            invoiceId: invoice.id,
            amount: invoice.amount_due / 100,
            timestamp: new Date(),
            error: 'Payment failed',
          });

          // Update subscription status
          await db.collection('users').doc(userId).update({
            'subscription.paymentStatus': 'failed',
            'subscription.paymentFailedAt': new Date().toISOString(),
          });
        }

        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        const customerId = paymentMethod.customer as string;

        // Find user by Stripe customer ID
        const usersQuery = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!usersQuery.empty) {
          const userDoc = usersQuery.docs[0];
          const userId = userDoc.id;

          // Log payment method addition
          await db.collection('payment_events').add({
            userId,
            type: 'payment_method_added',
            paymentMethodId: paymentMethod.id,
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
            timestamp: new Date(),
          });
        }

        // Collapse duplicate cards (same fingerprint). Isolated so a failure
        // here never fails the webhook (which would trigger Stripe retries).
        try {
          const result = await dedupePaymentMethods(stripe, customerId, paymentMethod.id);
          if (result?.detached.length) {
            console.log('Deduped payment methods', { customerId, ...result });
          }
        } catch (e) {
          console.error('Payment method dedup failed:', e);
        }

        break;
      }

      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        const customerId = setupIntent.customer as string;

        if (customerId) {
          // Find user by Stripe customer ID
          const usersQuery = await db
            .collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();

          if (!usersQuery.empty) {
            const userDoc = usersQuery.docs[0];
            const userId = userDoc.id;

            // Log successful setup
            await db.collection('payment_events').add({
              userId,
              type: 'setup_intent_succeeded',
              setupIntentId: setupIntent.id,
              paymentMethodId: setupIntent.payment_method,
              timestamp: new Date(),
            });
          }
        }

        break;
      }

      default:
        // Unhandled event type
    }

    // Log all webhook events for debugging
    await db.collection('webhook_events').add({
      type: event.type,
      eventId: event.id,
      timestamp: new Date(),
      processed: true,
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Log the error
    await db.collection('webhook_events').add({
      type: event.type,
      eventId: event.id,
      timestamp: new Date(),
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return 200 to acknowledge receipt (prevents Stripe from retrying)
    res.status(200).json({ received: true, error: true });
  }
}