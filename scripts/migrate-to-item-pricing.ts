/**
 * Migrate existing paid subscriptions onto item-based pricing:
 *   - attach each paid tier's metered overage price to the subscription (so
 *     overage bills in arrears) if not already present
 *   - move straggler `starter` subs to Silver (pro) base + metered
 *
 * The flat base amounts for Silver ($100) / Gold ($1000) are unchanged, so their
 * base prices are reused; only the metered line item is added. Uses
 * proration_behavior: 'none' and billing_cycle_anchor: 'unchanged' so nothing
 * is charged/credited mid-cycle.
 *
 * PREREQ: run scripts/setup-item-pricing.ts first and set the STRIPE_*_METER_PRICE_ID
 * (and STRIPE_PLATINUM_* ) env vars.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... npx tsx scripts/migrate-to-item-pricing.ts [--apply]
 *
 * Default is a dry run; pass --apply to mutate Stripe.
 */
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { STRIPE_API_VERSION, priceIdToPlan, stripeMeterPriceId, stripeBasePriceId, type PlanId } from '../src/lib/plans-config';

const APPLY = process.argv.includes('--apply');
const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) { console.error('STRIPE_SECRET_KEY is required'); process.exit(1); }
const stripe = new Stripe(KEY, { apiVersion: STRIPE_API_VERSION });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(process.env.GRAFFITICODE_APP_CREDENTIALS as string)),
  });
}
const db = admin.firestore();

async function main() {
  console.log(`\n=== Migrate subscriptions to item pricing${APPLY ? '' : ' (DRY RUN)'} ===\n`);
  const usersSnap = await db.collection('users').where('stripeCustomerId', '!=', null).get();
  let checked = 0, migrated = 0, skipped = 0;

  for (const doc of usersSnap.docs) {
    const customerId = doc.data().stripeCustomerId as string;
    if (!customerId) continue;
    checked++;

    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 3 });
    const sub = subs.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status));
    if (!sub) { skipped++; continue; }

    const items = sub.items.data;
    let plan = (items.map(it => priceIdToPlan(it?.price?.id)).find(Boolean) || null) as PlanId | null;
    const interval = items[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';

    // Straggler starter -> Silver (pro)
    let baseSwap: { fromItemId: string; toPriceId: string } | null = null;
    if (plan === 'starter') {
      const toPriceId = stripeBasePriceId('pro', interval);
      const starterItem = items.find(it => priceIdToPlan(it?.price?.id) === 'starter');
      if (toPriceId && starterItem) {
        baseSwap = { fromItemId: starterItem.id, toPriceId };
        plan = 'pro';
      }
    }

    if (!plan || plan === 'demo') { skipped++; continue; }

    const meterPriceId = stripeMeterPriceId(plan);
    if (!meterPriceId) { console.log(`  ${doc.id}: no meter price configured for ${plan}; skipping`); skipped++; continue; }
    const hasMeter = items.some(it => it?.price?.id === meterPriceId);

    if (hasMeter && !baseSwap) { skipped++; continue; }

    const updateItems: Stripe.SubscriptionUpdateParams.Item[] = [];
    if (baseSwap) updateItems.push({ id: baseSwap.fromItemId, price: baseSwap.toPriceId });
    if (!hasMeter) updateItems.push({ price: meterPriceId });

    console.log(`  ${doc.id}: ${plan} — ${baseSwap ? 'swap base + ' : ''}add metered ${meterPriceId}`);
    if (APPLY) {
      await stripe.subscriptions.update(sub.id, {
        items: updateItems,
        proration_behavior: 'none',
        billing_cycle_anchor: 'unchanged',
      });
    }
    migrated++;
  }

  console.log(`\nchecked=${checked} migrated=${migrated} skipped=${skipped}${APPLY ? '' : ' (dry run — re-run with --apply)'}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
