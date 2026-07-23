/**
 * Provision Stripe objects for item-based pricing:
 *   - one Billing Meter (event_name "item_created", sum aggregation)
 *   - per paid tier: a product, monthly + annual flat base prices, and a
 *     metered overage price (referencing the meter) at the tier's per-item rate
 *
 * Idempotent: prices are created with stable `lookup_key`s and reused if present;
 * the meter is matched by event_name. Prints the env vars to set afterwards.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-item-pricing.ts [--dry-run]
 *
 * Run against TEST mode first. After running, copy the printed env vars into
 * .env.local (dev) / .env.production (prod) and redeploy.
 */
import Stripe from 'stripe';
import { PLANS, STRIPE_API_VERSION, type PlanConfig } from '../src/lib/plans-config';

const DRY_RUN = process.argv.includes('--dry-run');
const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error('STRIPE_SECRET_KEY is required');
  process.exit(1);
}
const stripe = new Stripe(KEY, { apiVersion: STRIPE_API_VERSION });

const METER_EVENT_NAME = 'item_created';
const PAID_TIERS: PlanConfig[] = [PLANS.pro, PLANS.teams, PLANS.platinum];

// cents-as-decimal string for a dollar amount (handles sub-cent per-item rates).
// Cast to any at call sites: Stripe types unit_amount_decimal as a branded Decimal.
const cents = (usd: number): any => (usd * 100).toString();

async function ensureMeter(): Promise<string> {
  const existing = await stripe.billing.meters.list({ status: 'active', limit: 100 });
  const found = existing.data.find(m => m.event_name === METER_EVENT_NAME);
  if (found) {
    console.log(`meter: reusing ${found.id} (${METER_EVENT_NAME})`);
    return found.id;
  }
  if (DRY_RUN) {
    console.log(`meter: WOULD create meter event_name=${METER_EVENT_NAME}`);
    return 'mtr_DRYRUN';
  }
  const meter = await stripe.billing.meters.create({
    display_name: 'Items created',
    event_name: METER_EVENT_NAME,
    default_aggregation: { formula: 'sum' },
    customer_mapping: { type: 'by_id', event_payload_key: 'stripe_customer_id' },
    value_settings: { event_payload_key: 'value' },
  });
  console.log(`meter: created ${meter.id}`);
  return meter.id;
}

async function ensureProduct(plan: PlanConfig): Promise<string> {
  const lookup = `gc_${plan.id}`;
  const existing = await stripe.products.search({ query: `metadata['gc_plan']:'${plan.id}'`, limit: 1 }).catch(() => null);
  if (existing?.data?.[0]) {
    console.log(`product[${plan.id}]: reusing ${existing.data[0].id}`);
    return existing.data[0].id;
  }
  if (DRY_RUN) {
    console.log(`product[${plan.id}]: WOULD create "${plan.displayName}"`);
    return `prod_DRYRUN_${plan.id}`;
  }
  const product = await stripe.products.create({
    name: `Graffiticode ${plan.displayName}`,
    metadata: { gc_plan: plan.id, gc_lookup: lookup },
  });
  console.log(`product[${plan.id}]: created ${product.id}`);
  return product.id;
}

async function ensurePrice(lookupKey: string, params: Stripe.PriceCreateParams): Promise<string> {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) {
    console.log(`  price[${lookupKey}]: reusing ${existing.data[0].id}`);
    return existing.data[0].id;
  }
  if (DRY_RUN) {
    console.log(`  price[${lookupKey}]: WOULD create ${JSON.stringify(params.recurring)} ${params.unit_amount ?? params.unit_amount_decimal}`);
    return `price_DRYRUN_${lookupKey}`;
  }
  const price = await stripe.prices.create({ ...params, lookup_key: lookupKey });
  console.log(`  price[${lookupKey}]: created ${price.id}`);
  return price.id;
}

// Metered overage price, TIERED so the included bucket is free (covered by the
// flat base fee) and only items above `includedItems` are charged at the rate.
// Reporting one meter event per item then yields base + (overage x rate).
async function ensureMeteredPrice(lookupKey: string, productId: string, plan: PlanConfig, meterId: string): Promise<string> {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1, active: true });
  const found = existing.data[0];
  if (found && found.billing_scheme === 'tiered') {
    console.log(`  price[${lookupKey}]: reusing tiered ${found.id}`);
    return found.id;
  }
  if (DRY_RUN) {
    console.log(`  price[${lookupKey}]: WOULD create tiered (0 up to ${plan.includedItems}, then ${plan.overageRatePerItem}/item)`);
    return `price_DRYRUN_${lookupKey}`;
  }
  const price = await stripe.prices.create({
    product: productId,
    currency: 'usd',
    billing_scheme: 'tiered',
    tiers_mode: 'graduated',
    tiers: [
      { up_to: plan.includedItems, unit_amount: 0 },
      { up_to: 'inf', unit_amount_decimal: cents(plan.overageRatePerItem as number) },
    ],
    recurring: { interval: 'month', usage_type: 'metered', meter: meterId },
    lookup_key: lookupKey,
    // If a prior (flat) price holds this lookup key, move it to the new tiered one.
    ...(found ? { transfer_lookup_key: true } : {}),
  });
  console.log(`  price[${lookupKey}]: created tiered ${price.id}${found ? ' (transferred lookup key from ' + found.id + ')' : ''}`);
  return price.id;
}

async function main() {
  console.log(`\n=== Provisioning item-based pricing${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);
  const meterId = await ensureMeter();
  const envLines: string[] = [];

  for (const plan of PAID_TIERS) {
    console.log(`\n--- ${plan.displayName} (${plan.id}) ---`);
    const productId = await ensureProduct(plan);

    const monthly = await ensurePrice(`gc_${plan.id}_monthly`, {
      product: productId,
      currency: 'usd',
      unit_amount: plan.basePriceMonthly * 100,
      recurring: { interval: 'month' },
    });
    const annual = await ensurePrice(`gc_${plan.id}_annual`, {
      product: productId,
      currency: 'usd',
      unit_amount: plan.basePriceAnnual * 100,
      recurring: { interval: 'year' },
    });
    const metered = await ensureMeteredPrice(`gc_${plan.id}_meter`, productId, plan, meterId);

    envLines.push(`${plan.stripe.baseMonthlyPriceIdEnv}=${monthly}`);
    envLines.push(`${plan.stripe.baseAnnualPriceIdEnv}=${annual}`);
    envLines.push(`${plan.stripe.meterPriceIdEnv}=${metered}`);
  }

  console.log(`\n=== Set these env vars (${DRY_RUN ? 'dry-run placeholders' : 'real ids'}) ===\n`);
  console.log(envLines.join('\n'));
  console.log('\nNote: STRIPE_PRO_* and STRIPE_TEAMS_* base prices already exist for');
  console.log('legacy Silver/Gold subscribers — only reuse/rotate them deliberately.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
