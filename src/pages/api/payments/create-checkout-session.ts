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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, planId, interval } = req.body;

    console.log('Create checkout session request:', { userId, planId, interval });

    if (!userId || !planId || !interval) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate Stripe configuration
    if (!stripe) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return res.status(500).json({ error: 'Payment system not configured. Please contact support.' });
    }

    // Get or create Stripe customer for user
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    let stripeCustomerId = userData?.stripeCustomerId;

    // Verify if existing customer ID is valid in current mode
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          console.log(`Customer ${stripeCustomerId} doesn't exist in current Stripe mode, creating new...`);
          stripeCustomerId = null;
          // Clear the invalid customer ID
          await db.collection('users').doc(userId).update({
            stripeCustomerId: null
          });
        } else {
          throw error;
        }
      }
    }

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: {
          userId: userId,
        },
        email: userData?.email,
        name: userData?.name,
      });

      stripeCustomerId = customer.id;

      // Save Stripe customer ID to user document
      await db.collection('users').doc(userId).update({
        stripeCustomerId,
      });
    }

    // Get the appropriate price ID
    const priceId = STRIPE_PRICE_IDS[planId]?.[interval];

    console.log('Price ID mapping:', { planId, interval, priceId, allPriceIds: STRIPE_PRICE_IDS });

    // Check if price IDs are still placeholders
    if (!priceId || priceId === 'undefined' || priceId.includes('TEST_')) {
      console.error('Price IDs not configured. Please create products in Stripe TEST dashboard first.');
      return res.status(503).json({
        error: 'Payment system configuration incomplete',
        details: 'Stripe products have not been created yet. Please create Pro and Max products in your Stripe TEST dashboard and update the price IDs in .env.local',
        instruction: 'Go to https://dashboard.stripe.com/test/products to create products',
        currentPriceId: priceId
      });
    }

    if (!priceId.startsWith('price_')) {
      console.error('Invalid price ID format:', { planId, interval, priceId });
      return res.status(400).json({
        error: 'Invalid price configuration',
        details: 'Price ID must start with "price_"'
      });
    }

    // Check for existing active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    // If user has an existing subscription, they should use quick-subscribe (Payment Methods tab)
    // Stripe Checkout cannot properly handle subscription upgrades/downgrades with prorations
    if (existingSubscriptions.data.length > 0) {
      return res.status(400).json({
        error: 'Cannot change subscription through checkout',
        message: 'To upgrade or downgrade your plan, please add a payment method in the Payment Methods tab first.',
        requiresPaymentMethod: true,
      });
    }

    // Get customer's default payment method if exists
    let defaultPaymentMethod = null;
    if (stripeCustomerId) {
      const customer = await stripe.customers.retrieve(stripeCustomerId) as Stripe.Customer;
      defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
    }

    // Create checkout session for NEW subscriptions only
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/payments?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/payments?canceled=true`,
      // Allow modifying quantities, promo codes, etc
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // Save payment method for future use (subscription mode)
      payment_method_collection: 'always',
      metadata: {
        userId,
        planId,
        interval,
      },
      // Add 30-day free trial for Starter plan
      ...(planId === 'starter' && {
        subscription_data: {
          trial_period_days: 30,
        },
      }),
    };

    // If customer has a saved payment method, configure to use it
    if (defaultPaymentMethod) {
      console.log('Customer has default payment method:', defaultPaymentMethod);

      // Tell Stripe to use saved payment methods
      sessionConfig.payment_method_collection = 'if_required';
      sessionConfig.customer_update = {
        address: 'auto',
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}