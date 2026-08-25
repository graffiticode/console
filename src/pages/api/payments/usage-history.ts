import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { STRIPE_API_VERSION } from '../../../lib/plans-config';
import { getFirestore } from '../../../utils/db';
import { requireUser } from '../../../lib/api-auth';
import {
  buildUsageCycles,
  linePriceId,
  ITEM_DATA_START,
  type UsageRow,
} from '../../../lib/usage-history';

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
}

// Prices are immutable in Stripe, so this never needs invalidating and survives
// across requests on a warm instance. Cold start costs 2-4 retrievals.
const priceCache = new Map<string, Stripe.Price>();

/** Per-cycle usage history: item counts from Firestore, boundaries + money from Stripe. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = auth.uid;

  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '12'), 10) || 12, 1), 36);
    const includeCurrent = req.query.includeCurrent === 'true';

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;

    // An account that has never had a billing cycle is an empty state, not an
    // error — the same for one whose Stripe side we cannot reach.
    if (!stripeCustomerId || !stripe) {
      return res.status(200).json({
        cycles: [],
        hasStripeCustomer: Boolean(stripeCustomerId),
        stripeAvailable: Boolean(stripe),
        itemDataStart: new Date(ITEM_DATA_START).toISOString(),
      });
    }

    let invoices: Stripe.Invoice[];
    try {
      // limit + 2: a cycle's overage lives on the NEXT invoice, and the oldest
      // fetched invoice is needed only to bound the oldest displayable cycle.
      invoices = (await stripe.invoices.list({ customer: stripeCustomerId, limit: limit + 2 })).data;
    } catch (stripeError) {
      // Most often a live customer id under a test key, which is exactly the
      // state `npm run dev` is in. Degrade rather than 500 — a broken Usage tab
      // for every account is a worse failure than a missing table.
      console.error('usage-history: Stripe unavailable', stripeError);
      return res.status(200).json({
        cycles: [],
        hasStripeCustomer: true,
        stripeAvailable: false,
        itemDataStart: new Date(ITEM_DATA_START).toISOString(),
      });
    }

    for (const inv of invoices) {
      for (const line of inv.lines?.data ?? []) {
        const id = linePriceId(line);
        if (!id || priceCache.has(id)) continue;
        try {
          priceCache.set(id, await stripe.prices.retrieve(id));
        } catch {
          // classifyLine falls back to advance-vs-arrears period semantics.
        }
      }
    }

    // Lower bound clamped to the cutover: there are no item rows before it, and
    // clamping skips tens of thousands of pre-pricing compile/ai_generation docs.
    const oldestStart = invoices.reduce(
      (min, inv) => Math.min(min, inv.created * 1000),
      Date.now(),
    );
    const snap = await db.collection('usage')
      .where('userId', '==', userId)
      .where('createdAt', '>=', new Date(Math.max(oldestStart, ITEM_DATA_START)))
      .select('createdAt', 'type', 'units', 'nonBillableReason')
      .get();

    const rows: UsageRow[] = [];
    for (const doc of snap.docs) {
      const r = doc.data();
      if (r.type !== 'item_created') continue;
      const t = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      rows.push({
        createdAtMs: t.getTime(),
        units: r.units || 0,
        // Sponsored and billable are disjoint (a sponsored row is units: 0).
        // A 'local-script' row is neither — ours, not the customer's.
        sponsored: r.nonBillableReason === 'sponsored',
      });
    }

    const cycles = buildUsageCycles({
      invoices,
      priceOf: (id) => priceCache.get(id),
      rows,
      limit,
      includeCurrent,
      nowMs: Date.now(),
    });

    // Closed cycles are immutable, so this is safe to hold briefly.
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.status(200).json({
      cycles,
      hasStripeCustomer: true,
      stripeAvailable: true,
      itemDataStart: new Date(ITEM_DATA_START).toISOString(),
    });
  } catch (error) {
    console.error('Error fetching usage history:', error);
    return res.status(500).json({
      error: 'Failed to fetch usage history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
