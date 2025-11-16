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

// Map Stripe product/price IDs to our plan names
const PLAN_MAPPING = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID || '']: 'teams',
  [process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID || '']: 'teams',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    // For new users without a document, return free tier
    if (!userDoc.exists) {
      return res.status(200).json({
        plan: 'free',
        interval: null,
        status: 'active',
        currentBillingPeriod: null,
        cancelAtPeriodEnd: false,
        nextBillingDate: null,
        units: 1000, // Free tier units
        overageUnits: 0,
        overageRate: null,
      });
    }

    const userData = userDoc.data();
    let stripeCustomerId = userData?.stripeCustomerId;

    // If Stripe is not configured or no Stripe customer, return free tier
    if (!stripe || !stripeCustomerId) {
      const preservedRenewalDate = userData?.subscription?.renewalDate || null;

      return res.status(200).json({
        plan: userData?.subscription?.plan || 'free',
        interval: null,
        status: 'active',
        currentBillingPeriod: null,
        cancelAtPeriodEnd: false,
        nextBillingDate: preservedRenewalDate,
        units: 2000, // Starter tier units
        overageUnits: 0,
        overageRate: null,
      });
    }

    // Verify the customer exists in current mode (test/live)
    try {
      await stripe.customers.retrieve(stripeCustomerId);
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        // Customer doesn't exist in current mode, treat as free tier
        console.log(`Customer ${stripeCustomerId} doesn't exist in current Stripe mode`);
        const preservedRenewalDate = userData?.subscription?.renewalDate || null;

        return res.status(200).json({
          plan: userData?.subscription?.plan || 'free',
          interval: null,
          status: 'active',
          currentBillingPeriod: null,
          cancelAtPeriodEnd: false,
          nextBillingDate: preservedRenewalDate,
          units: 2000, // Starter tier units
          overageUnits: 0,
          overageRate: null,
        });
      }
      throw error;
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    // Also check for trialing subscriptions
    if (!subscriptions.data.length) {
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'trialing',
        limit: 1,
      });
      subscriptions.data.push(...trialingSubscriptions.data);
    }

    // If no active subscription, return free tier with preserved renewal date if available
    if (!subscriptions.data.length) {
      // Check if there's a preserved renewal date from a previous subscription
      const preservedRenewalDate = userData?.subscription?.renewalDate || null;

      // Check for preserved allocation from a downgrade
      const preservedUntil = userData?.subscription?.preservedUntil;
      const preservedAllocation = userData?.subscription?.preservedAllocation;
      const hasPreservedAllocation = preservedUntil && preservedAllocation && new Date(preservedUntil) > new Date();

      return res.status(200).json({
        plan: userData?.subscription?.plan || 'free',
        interval: null,
        status: 'active',
        currentBillingPeriod: null,
        cancelAtPeriodEnd: false,
        nextBillingDate: preservedRenewalDate, // Use preserved renewal date if available
        units: hasPreservedAllocation ? preservedAllocation : 2000, // Use preserved allocation or Starter tier units
        overageUnits: 0,
        overageRate: null,
        isUsingPreservedAllocation: hasPreservedAllocation,
        preservedUntil: hasPreservedAllocation ? preservedUntil : null,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    const planName = PLAN_MAPPING[priceId] || 'free';

    // Get billing interval from Stripe subscription
    const stripeInterval = subscription.items.data[0]?.price.recurring?.interval;
    const interval = stripeInterval === 'year' ? 'annual' : stripeInterval === 'month' ? 'monthly' : null;

    // Get unit allocation based on plan (monthly base)
    const baseUnitAllocation = {
      free: 2000,  // Updated to match Starter plan
      pro: 100000, // Updated to match current Pro plan
      teams: 2000000, // Updated to match current Teams plan
    };

    // Check for preserved allocation from a downgrade
    const preservedUntil = userData?.subscription?.preservedUntil;
    const preservedAllocation = userData?.subscription?.preservedAllocation;
    const hasPreservedAllocation = preservedUntil && preservedAllocation && new Date(preservedUntil) > new Date();

    // Use preserved allocation if available, otherwise calculate normally
    const planUnits = hasPreservedAllocation
      ? preservedAllocation
      : (interval === 'annual'
        ? (baseUnitAllocation[planName] || 1000) * 12
        : (baseUnitAllocation[planName] || 1000));

    // Get overage rate based on plan
    const overageRate = {
      free: null,
      pro: 0.001, // $0.001 per unit
      teams: 0.0002, // $0.0002 per unit
    };

    // Get any purchased overage units from metadata or database
    const overageUnits = parseInt(subscription.metadata?.overageUnits || '0');

    // Check for scheduled changes and get the correct renewal date
    let scheduledPlan = null;
    let scheduledInterval = null;
    let effectiveRenewalDate = subscription.current_period_end;

    if (subscription.schedule) {
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule as string);

        // Check if there are future phases
        if (schedule.phases && schedule.phases.length > 1) {
          // Get the current phase (phase[0]) for the renewal date
          const currentPhase = schedule.phases[0];
          if (currentPhase.end_date) {
            effectiveRenewalDate = currentPhase.end_date as number;
          }

          // Get the next phase (phase[1]) for scheduled changes
          const nextPhase = schedule.phases[1];
          if (nextPhase && nextPhase.items && nextPhase.items.length > 0) {
            const nextPriceId = nextPhase.items[0].price as string;
            scheduledPlan = PLAN_MAPPING[nextPriceId] || null;

            // Get the scheduled interval from the price
            const nextPrice = await stripe.prices.retrieve(nextPriceId);
            const nextInterval = nextPrice.recurring?.interval;
            scheduledInterval = nextInterval === 'year' ? 'annual' : nextInterval === 'month' ? 'monthly' : null;
          }
        }
      } catch (scheduleError) {
        console.error('Error fetching subscription schedule:', scheduleError);
        // Continue without scheduled info
      }
    }

    return res.status(200).json({
      plan: planName,
      interval,
      scheduledPlan,
      scheduledInterval,
      status: subscription.status,
      currentBillingPeriod: {
        start: new Date(subscription.current_period_start * 1000).toISOString(),
        end: new Date(effectiveRenewalDate * 1000).toISOString(),
      },
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      nextBillingDate: effectiveRenewalDate
        ? new Date(effectiveRenewalDate * 1000).toISOString()
        : null,
      units: planUnits,
      overageUnits,
      overageRate: overageRate[planName],
      stripeSubscriptionId: subscription.id,
      isUsingPreservedAllocation: hasPreservedAllocation,
      preservedUntil: hasPreservedAllocation ? preservedUntil : null,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({
      error: 'Failed to fetch subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}