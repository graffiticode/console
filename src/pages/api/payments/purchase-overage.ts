import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-08-01',
});

// Overage pricing based on plan's compile unit price
const OVERAGE_PRICING = {
  pro: {
    pricePerUnit: 0.001,    // $0.001 per unit = $1 per 1000 units
    blockSize: 1000,         // Purchase in blocks of 1000
    minBlocks: 1,            // Minimum 1 block (1000 units)
    description: '$1 per 1,000 units'
  },
  max: {
    pricePerUnit: 0.0005,    // $0.0005 per unit = $0.50 per 1000 units
    blockSize: 1000,         // Purchase in blocks of 1000
    minBlocks: 1,            // Minimum 1 block (1000 units)
    description: '$0.50 per 1,000 units'
  },
  teams: {
    pricePerUnit: 0.0005,    // $0.0005 per unit = $0.50 per 1000 units
    blockSize: 1000,         // Purchase in blocks of 1000
    minBlocks: 1,            // Minimum 1 block (1000 units)
    description: '$0.50 per 1,000 units'
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request to fetch pricing info
  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(userId as string).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      const subscriptionData = userData?.subscription || {};
      const currentPlan = subscriptionData.plan || 'free';
      const currentOverage = subscriptionData.overageUnits || 0;

      if (currentPlan === 'free') {
        return res.status(200).json({
          plan: 'free',
          overageAvailable: false,
          currentOverageBalance: 0,
          message: 'Upgrade to Pro or Max to purchase overage units'
        });
      }

      const pricing = OVERAGE_PRICING[currentPlan];

      if (!pricing) {
        return res.status(200).json({
          plan: currentPlan,
          overageAvailable: false,
          currentOverageBalance: currentOverage,
          message: 'Overage not available for this plan'
        });
      }

      return res.status(200).json({
        plan: currentPlan,
        overageAvailable: true,
        currentOverageBalance: currentOverage,
        blockSize: pricing.blockSize,
        pricePerBlock: pricing.blockSize * pricing.pricePerUnit,
        pricePerUnit: pricing.pricePerUnit,
        minBlocks: pricing.minBlocks,
        description: pricing.description,
        suggestedBlocks: [1, 5, 10, 20], // Suggested purchase amounts
      });
    } catch (error) {
      console.error('Error fetching overage pricing:', error);
      return res.status(500).json({
        error: 'Failed to fetch pricing information',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, blocks = 1, useDefaultPaymentMethod = true } = req.body; // Default to 1 block

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
      return res.status(400).json({ error: 'No payment method on file' });
    }

    // Get user's current plan
    const subscriptionData = userData?.subscription || {};
    const currentPlan = subscriptionData.plan || 'free';

    if (currentPlan === 'free') {
      return res.status(400).json({
        error: 'Overage purchases are not available on the free plan',
        upgradeRequired: true
      });
    }

    // Validate purchase amount
    const pricing = OVERAGE_PRICING[currentPlan];
    if (!pricing) {
      return res.status(400).json({ error: 'Invalid plan for overage purchase' });
    }

    // Validate number of blocks
    if (!Number.isInteger(blocks) || blocks < pricing.minBlocks) {
      return res.status(400).json({
        error: `Minimum purchase is ${pricing.minBlocks} block(s) (${(pricing.minBlocks * pricing.blockSize).toLocaleString()} units)`,
        minBlocks: pricing.minBlocks,
        blockSize: pricing.blockSize,
        pricePerBlock: pricing.blockSize * pricing.pricePerUnit,
        description: pricing.description
      });
    }

    // Calculate total units and cost
    const units = blocks * pricing.blockSize;

    // Calculate the cost
    const amount = Math.round(units * pricing.pricePerUnit * 100); // Convert to cents

    // Get default payment method if requested
    let paymentMethodId: string | undefined;

    if (useDefaultPaymentMethod) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
        limit: 1,
      });

      if (!paymentMethods.data.length) {
        return res.status(400).json({
          error: 'No payment method on file',
          requiresPaymentMethod: true
        });
      }

      paymentMethodId = paymentMethods.data[0].id;
    }

    // Create a payment intent for immediate charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: useDefaultPaymentMethod, // Auto-confirm if using default payment method
      description: `${units.toLocaleString()} compile units (${blocks} block${blocks > 1 ? 's' : ''}) - ${currentPlan} plan @ ${pricing.description}`,
      metadata: {
        userId,
        units: units.toString(),
        blocks: blocks.toString(),
        plan: currentPlan,
        type: 'overage_purchase',
        pricePerUnit: pricing.pricePerUnit.toString(),
      },
    });

    // If payment was confirmed successfully, update the user's overage balance
    if (paymentIntent.status === 'succeeded') {
      // Update user's overage balance in Firestore
      const currentOverage = subscriptionData.overageUnits || 0;
      await db.collection('users').doc(userId).update({
        'subscription.overageUnits': currentOverage + units,
        'subscription.lastOveragePurchase': new Date().toISOString(),
      });

      // Log the purchase
      await db.collection('overage_purchases').add({
        userId,
        units,
        blocks,
        blockSize: pricing.blockSize,
        pricePerUnit: pricing.pricePerUnit,
        amount: amount / 100, // Store in dollars
        plan: currentPlan,
        paymentIntentId: paymentIntent.id,
        timestamp: new Date(),
      });

      return res.status(200).json({
        success: true,
        units,
        blocks,
        blockSize: pricing.blockSize,
        pricePerBlock: pricing.blockSize * pricing.pricePerUnit,
        amount: amount / 100,
        newOverageBalance: currentOverage + units,
        paymentIntentId: paymentIntent.id,
        description: pricing.description,
      });
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure or other additional authentication required
      return res.status(200).json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } else {
      // Payment requires additional steps
      return res.status(200).json({
        success: false,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }
  } catch (error) {
    console.error('Error purchasing overage:', error);
    return res.status(500).json({
      error: 'Failed to purchase overage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}