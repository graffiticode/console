// Reports item-creation usage to Stripe's Billing Meter for paid tiers.
//
// The subscription carries a metered (usage-based) price; we send one meter
// event per successfully created item and Stripe bills the overage above the
// included bucket in arrears on the next invoice. Free/contact-sales tiers have
// no meter and are skipped. Best-effort: never throws into the create path.
import Stripe from 'stripe';
import { STRIPE_API_VERSION, getPlan } from './plans-config';

let stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (stripe) return stripe;
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
  return stripe;
}

export async function reportItemUsage({
  plan,
  stripeCustomerId,
  identifier,
}: {
  plan: string | undefined | null;
  stripeCustomerId: string | undefined | null;
  /** Idempotency key (Stripe dedupes within a 24h window). Use itemId__taskId. */
  identifier?: string;
}): Promise<void> {
  try {
    const eventName = getPlan(plan).stripe.meterEventName;
    if (!eventName || !stripeCustomerId) return;
    const client = getStripe();
    if (!client) return;
    await client.billing.meterEvents.create({
      event_name: eventName,
      payload: { stripe_customer_id: stripeCustomerId, value: '1' },
      ...(identifier ? { identifier } : {}),
    });
  } catch (err) {
    console.error('reportItemUsage()', 'ERROR', err);
  }
}
