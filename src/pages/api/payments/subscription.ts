import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-08-01',
});

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

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    let stripeCustomerId = userData?.stripeCustomerId;

    // If no Stripe customer, return free tier
    if (!stripeCustomerId) {
      return res.status(200).json({
        plan: 'free',
        status: 'active',
        currentBillingPeriod: null,
        cancelAtPeriodEnd: false,
        nextBillingDate: null,
        units: 1000, // Free tier units
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
        return res.status(200).json({
          plan: 'free',
          status: 'active',
          currentBillingPeriod: null,
          cancelAtPeriodEnd: false,
          nextBillingDate: null,
          units: 1000, // Free tier units
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

    // If no active subscription, return free tier
    if (!subscriptions.data.length) {
      return res.status(200).json({
        plan: 'free',
        status: 'active',
        currentBillingPeriod: null,
        cancelAtPeriodEnd: false,
        nextBillingDate: null,
        units: 1000, // Free tier units
        overageUnits: 0,
        overageRate: null,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    const planName = PLAN_MAPPING[priceId] || 'free';

    // Get unit allocation based on plan
    const unitAllocation = {
      free: 1000,
      pro: 50000,
      teams: 1000000,
    };

    // Get overage rate based on plan
    const overageRate = {
      free: null,
      pro: 0.001, // $0.001 per unit
      teams: 0.0002, // $0.0002 per unit
    };

    // Get any purchased overage units from metadata or database
    const overageUnits = parseInt(subscription.metadata?.overageUnits || '0');

    return res.status(200).json({
      plan: planName,
      status: subscription.status,
      currentBillingPeriod: {
        start: new Date(subscription.current_period_start * 1000).toISOString(),
        end: new Date(subscription.current_period_end * 1000).toISOString(),
      },
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      nextBillingDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      units: unitAllocation[planName] || 1000,
      overageUnits,
      overageRate: overageRate[planName],
      stripeSubscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({
      error: 'Failed to fetch subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}