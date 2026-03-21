import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getFirestore } from '../../../utils/db';
import { OVERAGE_PRICING } from '../../../lib/overage-pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-08-01',
});

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

      // For new users without a document, return starter plan info
      const userData = userDoc.exists ? userDoc.data() : null;
      const subscriptionData = userData?.subscription || {};
      const currentPlan = subscriptionData.plan || 'demo';
      const currentOverage = subscriptionData.overageUnits || 0;

      // Demo users cannot purchase overage units
      if (currentPlan === 'demo') {
        return res.status(200).json({
          plan: currentPlan,
          overageAvailable: false,
          currentOverageBalance: currentOverage,
          message: 'Please upgrade to a paid plan to purchase additional units'
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
        suggestedBlocks: [1, 3, 5], // Suggested purchase amounts
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
    const { userId, blocks = 1 } = req.body;

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
    const currentPlan = subscriptionData.plan || 'demo';

    // Demo users cannot purchase overage units
    if (currentPlan === 'demo') {
      return res.status(400).json({ error: 'Please upgrade to a paid plan to purchase additional units' });
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

    // Verify payment method exists
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

    // Create an invoice item and invoice for the overage purchase
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      amount,
      currency: 'usd',
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

    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      description: `${units.toLocaleString()} compile units (${blocks} block${blocks > 1 ? 's' : ''}) - ${currentPlan} plan @ ${pricing.description}`,
      auto_advance: true,
      collection_method: 'charge_automatically',
      default_payment_method: paymentMethods.data[0].id,
      metadata: {
        userId,
        units: units.toString(),
        blocks: blocks.toString(),
        plan: currentPlan,
        type: 'overage_purchase',
        pricePerUnit: pricing.pricePerUnit.toString(),
      },
    });

    // Finalize and pay the invoice immediately
    const paidInvoice = await stripe.invoices.pay(invoice.id);

    if (paidInvoice.status === 'paid') {
      const currentOverage = subscriptionData.overageUnits || 0;

      return res.status(200).json({
        success: true,
        units,
        blocks,
        blockSize: pricing.blockSize,
        pricePerBlock: pricing.blockSize * pricing.pricePerUnit,
        amount: amount / 100,
        newOverageBalance: currentOverage + units,
        invoiceId: paidInvoice.id,
        description: pricing.description,
        note: 'Units will be credited shortly via payment processing'
      });
    } else {
      return res.status(200).json({
        success: false,
        status: paidInvoice.status,
        invoiceId: paidInvoice.id,
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