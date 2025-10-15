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

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  invoicePdf?: string;
  type: 'subscription' | 'overage' | 'one-time';
  plan?: string;
  period?: {
    start: string;
    end: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit = 12, startingAfter } = req.query;

    if (!userId || typeof userId !== 'string') {
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

    const invoices: Invoice[] = [];

    // If user has a Stripe customer and Stripe is configured, fetch invoices from Stripe
    if (stripeCustomerId && stripe) {
      // Fetch subscription invoices from Stripe
      const stripeInvoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: Number(limit),
        starting_after: startingAfter as string,
      });

      for (const invoice of stripeInvoices.data) {
        // Extract plan information from line items
        let planName = 'Unknown';
        let type: Invoice['type'] = 'subscription';

        if (invoice.lines.data.length > 0) {
          const firstLineItem = invoice.lines.data[0];
          if (firstLineItem.description?.toLowerCase().includes('pro')) {
            planName = 'Pro';
          } else if (firstLineItem.description?.toLowerCase().includes('team') ||
                     firstLineItem.description?.toLowerCase().includes('max')) {
            planName = 'Max';
          } else if (firstLineItem.description?.toLowerCase().includes('overage')) {
            type = 'overage';
            planName = 'Overage Units';
          }
        }

        invoices.push({
          id: invoice.id,
          date: new Date(invoice.created * 1000).toISOString(),
          amount: (invoice.amount_paid || invoice.amount_due) / 100, // Convert from cents
          status: invoice.status || 'pending',
          description: invoice.description || `${planName} subscription`,
          invoicePdf: invoice.invoice_pdf || undefined,
          type,
          plan: planName,
          period: invoice.period_start && invoice.period_end ? {
            start: new Date(invoice.period_start * 1000).toISOString(),
            end: new Date(invoice.period_end * 1000).toISOString(),
          } : undefined,
        });
      }

      // Also fetch recent payment intents for overage purchases
      const payments = await stripe.paymentIntents.list({
        customer: stripeCustomerId,
        limit: Number(limit),
      });

      for (const payment of payments.data) {
        if (payment.metadata?.type === 'overage_purchase' && payment.status === 'succeeded') {
          invoices.push({
            id: payment.id,
            date: new Date(payment.created * 1000).toISOString(),
            amount: payment.amount / 100,
            status: 'paid',
            description: payment.description || 'Overage units purchase',
            type: 'overage',
            plan: payment.metadata.plan,
          });
        }
      }
    }

    // Also fetch any manual credits or adjustments from Firestore
    try {
      const creditsQuery = await db
        .collection('billing_events')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(Number(limit))
        .get();

      creditsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.type === 'credit' || data.type === 'adjustment') {
          invoices.push({
            id: doc.id,
            date: data.timestamp.toDate().toISOString(),
            amount: data.amount,
            status: 'completed',
            description: data.description || 'Account credit',
            type: 'one-time',
          });
        }
      });
    } catch (creditsError) {
      console.error('Error fetching billing events (may need Firestore index):', creditsError);
      // Continue without manual credits
    }

    // Sort all invoices by date (most recent first)
    invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate summary statistics
    const totalPaid = invoices
      .filter(inv => inv.status === 'paid' || inv.status === 'completed')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalPending = invoices
      .filter(inv => inv.status === 'pending' || inv.status === 'draft')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return res.status(200).json({
      invoices: invoices.slice(0, Number(limit)),
      summary: {
        totalPaid,
        totalPending,
        count: invoices.length,
        hasMore: invoices.length > Number(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({
      error: 'Failed to fetch billing history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}