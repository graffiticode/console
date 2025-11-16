import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-08-01',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, reason, feedback, immediately = false } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getFirestore();

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (!subscriptions.data.length) {
      // Also check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'trialing',
        limit: 1,
      });

      if (!trialingSubscriptions.data.length) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      subscriptions.data.push(...trialingSubscriptions.data);
    }

    const subscription = subscriptions.data[0];

    // Cancel the subscription
    let canceledSubscription: Stripe.Subscription;

    if (immediately) {
      // Cancel immediately
      canceledSubscription = await stripe.subscriptions.cancel(subscription.id);
    } else {
      // Cancel at the end of the current billing period
      canceledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
        metadata: {
          ...subscription.metadata,
          cancelReason: reason || 'user_requested',
          cancelFeedback: feedback || '',
          canceledAt: new Date().toISOString(),
        },
      });
    }

    // Log cancellation in Firestore
    await db.collection('subscription_events').add({
      userId,
      type: 'cancellation',
      subscriptionId: subscription.id,
      reason: reason || 'user_requested',
      feedback: feedback || '',
      immediately,
      timestamp: new Date(),
      cancelAt: canceledSubscription.cancel_at
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
        : null,
    });

    // Update user document
    // When immediately canceling (downgrading to free), preserve the renewal date from the subscription
    const updateData: any = {
      'subscription.status': immediately ? 'active' : 'canceling', // Keep status as 'active' for free plan
      'subscription.plan': immediately ? 'free' : userData?.subscription?.plan, // Set to free plan if immediate cancellation
      'subscription.cancelAt': canceledSubscription.cancel_at
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
        : null,
      'subscription.canceledAt': new Date().toISOString(),
    };

    // Preserve the renewal date when downgrading to free
    if (immediately && subscription.current_period_end) {
      updateData['subscription.renewalDate'] = new Date(subscription.current_period_end * 1000).toISOString();
      updateData['subscription.interval'] = null; // Free plan has no interval
      updateData['subscription.stripeSubscriptionId'] = null; // Clear Stripe subscription ID
    }

    await db.collection('users').doc(userId).update(updateData);

    return res.status(200).json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        cancelAt: canceledSubscription.cancel_at
          ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
          : null,
        currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
      },
      message: immediately
        ? 'Subscription canceled immediately'
        : `Subscription will be canceled at the end of the current billing period`,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}