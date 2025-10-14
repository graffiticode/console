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
    const { userId } = req.body;

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
      return res.status(400).json({ error: 'No subscription found' });
    }

    // Find subscription that's set to cancel at period end
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 10,
    });

    const cancelingSubscription = subscriptions.data.find(
      sub => sub.cancel_at_period_end === true
    );

    if (!cancelingSubscription) {
      return res.status(400).json({
        error: 'No subscription scheduled for cancellation found'
      });
    }

    // Resume the subscription by removing the cancellation
    const resumedSubscription = await stripe.subscriptions.update(
      cancelingSubscription.id,
      {
        cancel_at_period_end: false,
        metadata: {
          ...cancelingSubscription.metadata,
          resumedAt: new Date().toISOString(),
        },
      }
    );

    // Log the resumption event
    await db.collection('subscription_events').add({
      userId,
      type: 'resumption',
      subscriptionId: resumedSubscription.id,
      timestamp: new Date(),
      previousCancelAt: cancelingSubscription.cancel_at
        ? new Date(cancelingSubscription.cancel_at * 1000).toISOString()
        : null,
    });

    // Update user document
    await db.collection('users').doc(userId).update({
      'subscription.status': 'active',
      'subscription.cancelAt': null,
      'subscription.canceledAt': null,
      'subscription.resumedAt': new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      subscription: {
        id: resumedSubscription.id,
        status: resumedSubscription.status,
        cancelAtPeriodEnd: resumedSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(resumedSubscription.current_period_end * 1000).toISOString(),
      },
      message: 'Subscription has been resumed successfully',
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return res.status(500).json({
      error: 'Failed to resume subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}