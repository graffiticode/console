import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';
import * as admin from 'firebase-admin';

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-08-01',
  });
}

// Map our plan IDs to Stripe price IDs
const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  teams: {
    monthly: process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID,
  },
};

// Map Stripe price IDs back to our plan names
const PLAN_MAPPING: Record<string, string> = {
  [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '']: 'starter',
  [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || '']: 'starter',
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID || '']: 'teams',
  [process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID || '']: 'teams',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    const { userId, planId, interval } = req.body;

    if (!userId || !planId || !interval) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get user and their Stripe customer
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;
    const currentPlan = userData?.subscription?.plan || 'starter';

    if (!stripeCustomerId) {
      return res.status(400).json({
        error: 'No payment method on file',
        requiresCheckout: true
      });
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
    let defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

    // If no default is set, check if there are any payment methods and use one
    if (!defaultPaymentMethod) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
        limit: 1,
      });

      if (paymentMethods.data.length > 0) {
        // Use the first payment method and set it as default
        defaultPaymentMethod = paymentMethods.data[0].id;
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: defaultPaymentMethod,
          },
        });
      } else {
        return res.status(400).json({
          error: 'No payment method on file',
          requiresCheckout: true
        });
      }
    }

    // Get the price ID
    const priceId = STRIPE_PRICE_IDS[planId]?.[interval];

    if (!priceId || !priceId.startsWith('price_')) {
      return res.status(400).json({
        error: 'Invalid plan configuration'
      });
    }

    // Check if user already has an active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    let subscription: Stripe.Subscription;
    let isUpgrade = false;
    let oldAllocation = 0;
    let existingSub: Stripe.Subscription | null = null;

    if (existingSubscriptions.data.length > 0) {
      // User has existing subscription - update it
      existingSub = existingSubscriptions.data[0];
      const existingPriceId = existingSub.items.data[0]?.price.id;

      // Determine the current plan and interval from the existing subscription
      const existingPlan = PLAN_MAPPING[existingPriceId] || 'starter';
      const currentPrice = await stripe.prices.retrieve(existingPriceId);
      const currentInterval = currentPrice.recurring?.interval === 'year' ? 'annual' : 'monthly';

      // Determine if this is an upgrade or downgrade
      isUpgrade =
        (existingPlan === 'pro' && planId === 'teams') || // Pro -> Max
        (currentInterval === 'monthly' && interval === 'annual'); // Monthly -> Annual

      if (isUpgrade) {
        // For upgrades: Apply immediately with proration credit for unused time
        // If there's an existing schedule, release it first
        if (existingSub.schedule) {
          await stripe.subscriptionSchedules.release(existingSub.schedule as string);
        }

        subscription = await stripe.subscriptions.update(existingSub.id, {
          items: [{
            id: existingSub.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'create_prorations', // Credit unused time and charge for upgrade
          metadata: {
            userId,
            planId,
            interval,
          },
        });
      } else {
        // For downgrades/lateral moves: Apply immediately but preserve renewal date and allocation

        // Calculate the old plan's allocation to preserve
        if (existingPlan === 'teams') {
          oldAllocation = 2000000; // Teams monthly allocation
        } else if (existingPlan === 'pro') {
          oldAllocation = 100000; // Pro monthly allocation
        } else {
          oldAllocation = 2000; // Starter allocation
        }

        // Multiply by 12 if current plan is annual
        if (currentInterval === 'annual') {
          oldAllocation = oldAllocation * 12;
        }

        // If there's an existing schedule, release it first
        if (existingSub.schedule) {
          await stripe.subscriptionSchedules.release(existingSub.schedule as string);
        }

        // Store the current renewal date before making changes
        const preservedRenewalDate = existingSub.current_period_end;

        // Update subscription immediately to the new plan
        // Use 'none' proration to avoid charging/crediting - just switch the plan
        subscription = await stripe.subscriptions.update(existingSub.id, {
          items: [{
            id: existingSub.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'none', // No proration - immediate switch without credits/charges
          metadata: {
            userId,
            planId,
            interval,
          },
          // Preserve the billing cycle anchor to keep the same renewal date
          billing_cycle_anchor: 'unchanged',
        });
      }
    } else {
      // No existing subscription - create new one
      subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        default_payment_method: defaultPaymentMethod as string,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          planId,
          interval,
        },
      });
    }

    // Check if payment needs confirmation (3D Secure, etc) - only for new subscriptions
    if (subscription.latest_invoice) {
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

      if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Payment requires additional authentication
        return res.status(200).json({
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          subscriptionId: subscription.id,
        });
      }
    }

    // Update user's subscription info in database
    const updateData: any = {
      'subscription.status': subscription.status,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.plan': planId,
      'subscription.interval': interval,
      'subscription.updatedAt': new Date().toISOString(),
    };

    // If this was a downgrade, store the preserved allocation
    if (existingSub && !isUpgrade) {
      updateData['subscription.preservedAllocation'] = oldAllocation;
      updateData['subscription.preservedUntil'] = new Date(subscription.current_period_end * 1000).toISOString();
    } else if (currentPlan === 'starter') {
      // If upgrading from starter, clear any preserved fields and canceledAt
      updateData['subscription.preservedAllocation'] = admin.firestore.FieldValue.delete();
      updateData['subscription.preservedUntil'] = admin.firestore.FieldValue.delete();
      updateData['subscription.canceledAt'] = admin.firestore.FieldValue.delete();
    }

    await db.collection('users').doc(userId).update(updateData);

    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: planId,
        interval,
      },
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}