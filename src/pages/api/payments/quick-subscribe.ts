import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-08-01',
  });
}

// Map our plan IDs to Stripe price IDs
const STRIPE_PRICE_IDS = {
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

    console.log('Quick subscribe request:', { userId, planId, interval });

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
        console.log('Auto-set payment method as default:', defaultPaymentMethod);
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

    if (existingSubscriptions.data.length > 0) {
      // User has existing subscription - update it
      const existingSub = existingSubscriptions.data[0];
      const existingPriceId = existingSub.items.data[0]?.price.id;

      // Determine the current plan and interval from the existing subscription
      const currentPlan = PLAN_MAPPING[existingPriceId] || 'free';
      const currentPrice = await stripe.prices.retrieve(existingPriceId);
      const currentInterval = currentPrice.recurring?.interval === 'year' ? 'annual' : 'monthly';

      // Determine if this is an upgrade or downgrade
      const isUpgrade =
        (currentPlan === 'pro' && planId === 'teams') || // Pro -> Max
        (currentInterval === 'monthly' && interval === 'annual'); // Monthly -> Annual

      console.log('Updating existing subscription:', {
        subscriptionId: existingSub.id,
        currentPlan,
        currentInterval,
        newPlan: planId,
        newInterval: interval,
        isUpgrade,
        currentPriceId: existingPriceId,
        newPriceId: priceId,
        currentPeriodEnd: new Date(existingSub.current_period_end * 1000).toISOString()
      });

      if (isUpgrade) {
        // For upgrades: Apply immediately with proration credit for unused time
        console.log('Processing upgrade - applying immediately with proration credit');

        // If there's an existing schedule, release it first
        if (existingSub.schedule) {
          await stripe.subscriptionSchedules.release(existingSub.schedule as string);
          console.log('Released existing schedule');
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

        console.log('Upgrade applied immediately with proration credit');
      } else {
        // For downgrades/lateral moves: Schedule change for renewal date
        console.log('Processing downgrade/lateral move - scheduling for renewal date');

        // Use subscription schedules to preserve renewal date across interval changes
        // IMPORTANT: Always keep the existing subscription's renewal date - never recalculate it
        console.log('Current subscription details:', {
          id: existingSub.id,
          currentPeriodStart: new Date(existingSub.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(existingSub.current_period_end * 1000).toISOString(),
          hasSchedule: !!existingSub.schedule
        });

        // Always use the subscription's existing renewal date
        let renewalDate: number;

        if (existingSub.schedule) {
          // Update existing schedule - preserve the renewal date from current phase
          const existingSchedule = await stripe.subscriptionSchedules.retrieve(existingSub.schedule as string);
          const currentPhase = existingSchedule.phases[0];
          renewalDate = currentPhase.end_date as number;

          console.log('Updating schedule - preserving renewal date:', new Date(renewalDate * 1000).toISOString());

          await stripe.subscriptionSchedules.update(existingSub.schedule as string, {
            phases: [
              {
                items: [{ price: existingPriceId, quantity: 1 }],
                start_date: currentPhase.start_date,
                end_date: renewalDate,
              },
              {
                items: [{ price: priceId, quantity: 1 }],
                start_date: renewalDate,
              },
            ],
          });

          console.log('Updated schedule - renewal date preserved:', new Date(renewalDate * 1000).toISOString());
        } else {
          // Create new schedule from subscription - use the subscription's current renewal date
          renewalDate = existingSub.current_period_end;

          console.log('Creating new schedule with current renewal date:', new Date(renewalDate * 1000).toISOString());

          await stripe.subscriptionSchedules.create({
            from_subscription: existingSub.id,
          } as any); // Type assertion needed for from_subscription

          // Retrieve the created schedule
          const schedules = await stripe.subscriptionSchedules.list({ customer: stripeCustomerId, limit: 1 });
          if (schedules.data.length > 0) {
            const schedule = schedules.data[0];

            // Update with our phases using the existing renewal date
            await stripe.subscriptionSchedules.update(schedule.id, {
              phases: [
                {
                  items: [{ price: existingPriceId, quantity: 1 }],
                  start_date: existingSub.current_period_start,
                  end_date: renewalDate,
                },
                {
                  items: [{ price: priceId, quantity: 1 }],
                  start_date: renewalDate,
                },
              ],
            });

            console.log('Created schedule - renewal date:', new Date(renewalDate * 1000).toISOString());
          }
        }

        // Retrieve updated subscription
        subscription = await stripe.subscriptions.retrieve(existingSub.id);
      }

      console.log('Subscription updated - renewal date preserved:', {
        subscriptionId: subscription.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      });
    } else {
      // No existing subscription - create new one
      console.log('Creating subscription with:', {
        customer: stripeCustomerId,
        priceId,
        paymentMethod: defaultPaymentMethod
      });

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
    await db.collection('users').doc(userId).update({
      'subscription.status': subscription.status,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.plan': planId,
      'subscription.interval': interval,
      'subscription.updatedAt': new Date().toISOString(),
    });

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