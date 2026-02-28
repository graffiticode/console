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
  [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '']: { name: 'starter', units: 2000 },
  [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || '']: { name: 'starter', units: 2000 },
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: { name: 'pro', units: 100000 },
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '']: { name: 'pro', units: 100000 },
  [process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID || '']: { name: 'teams', units: 2000000 },
  [process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID || '']: { name: 'teams', units: 2000000 },
};

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
        const priceId = subscription.items.data[0]?.price.id;
        const planInfo = PLAN_MAPPING[priceId] || { name: 'starter', units: 2000 };

        // Build update object
        const updateData: Record<string, any> = {
          'subscription.status': subscription.status,
          'subscription.plan': planInfo.name,
          'subscription.units': planInfo.units,
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000).toISOString(),
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
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

        // Reset to starter tier but preserve overage units (they're purchased separately)
        await db.collection('users').doc(userId).update({
          'subscription.status': 'canceled',
          'subscription.plan': 'starter',
          'subscription.units': 2000,
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

          // Reset usage counter for new billing period if this is a subscription invoice
          if (invoice.subscription) {
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

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Handle overage purchases
        if (paymentIntent.metadata?.type === 'overage_purchase') {
          const userId = paymentIntent.metadata.userId;
          const units = parseInt(paymentIntent.metadata.units);
          const blocks = parseInt(paymentIntent.metadata.blocks || '1');
          const plan = paymentIntent.metadata.plan;
          const pricePerUnit = parseFloat(paymentIntent.metadata.pricePerUnit || '0');
          const isAutoRecharge = paymentIntent.metadata.autoRecharge === 'true';

          if (userId && units) {
            if (isAutoRecharge) {
              // Auto-recharge: units already credited immediately — just log payment
              await db.collection('overage_purchases').doc(paymentIntent.id).set({
                userId,
                units,
                blocks,
                plan,
                pricePerUnit,
                amount: paymentIntent.amount / 100,
                paymentIntentId: paymentIntent.id,
                timestamp: new Date(),
                status: 'completed',
                autoRecharge: true,
                webhookProcessed: true,
              });
            } else {
              // Manual purchase: credit units now
              const userDoc = await db.collection('users').doc(userId).get();
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
                amount: paymentIntent.amount / 100,
                paymentIntentId: paymentIntent.id,
                timestamp: new Date(),
                status: 'completed',
                webhookProcessed: true,
              });
            }
          }
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