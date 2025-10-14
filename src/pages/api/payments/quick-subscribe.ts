import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-08-01',
});

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

    if (!defaultPaymentMethod) {
      return res.status(400).json({
        error: 'No default payment method set',
        requiresCheckout: true
      });
    }

    // Get the price ID
    const priceId = STRIPE_PRICE_IDS[planId]?.[interval];

    if (!priceId || !priceId.startsWith('price_')) {
      return res.status(400).json({
        error: 'Invalid plan configuration'
      });
    }

    console.log('Creating subscription with:', {
      customer: stripeCustomerId,
      priceId,
      paymentMethod: defaultPaymentMethod
    });

    // Create the subscription directly
    const subscription = await stripe.subscriptions.create({
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

    // Check if payment needs confirmation (3D Secure, etc)
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    if (paymentIntent.status === 'requires_action') {
      // Payment requires additional authentication
      return res.status(200).json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
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