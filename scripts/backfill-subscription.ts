#!/usr/bin/env node
// Backfill a user's Firestore `subscription` from their live Stripe subscription.
// Use when a checkout/upgrade succeeded in Stripe but the webhook never wrote it back.
//
// Confirm (dry-run):
//   STRIPE_LIVE_KEY=sk_live_... npx tsx scripts/backfill-subscription.ts <uid>
// Apply:
//   STRIPE_LIVE_KEY=sk_live_... npx tsx scripts/backfill-subscription.ts <uid> --apply
// Override plan mapping if price id isn't in env:
//   ... --plan pro

import admin from 'firebase-admin';
import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
try {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {}

delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

const liveKey = process.env.STRIPE_LIVE_KEY;
if (!liveKey || !liveKey.startsWith('sk_live_')) {
  console.error('Error: set STRIPE_LIVE_KEY=sk_live_... in the environment for this run.');
  process.exit(1);
}
if (!process.env.GRAFFITICODE_APP_CREDENTIALS) {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS not set');
  process.exit(1);
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'graffiticode-app' });
const db = admin.firestore();
const stripe = new Stripe(liveKey, { apiVersion: '2022-08-01' });

// Same mapping the webhook uses (stripe.ts). Price ids come from env; in a
// test-mode .env.local these are test ids and won't match a live sub — use --plan then.
const PLAN_MAPPING: Record<string, { name: string; units: number }> = {
  [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'x1']: { name: 'starter', units: 5000 },
  [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || 'x2']: { name: 'starter', units: 5000 },
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'x3']: { name: 'pro', units: 100000 },
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'x4']: { name: 'pro', units: 100000 },
  [process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID || 'x5']: { name: 'teams', units: 2000000 },
  [process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID || 'x6']: { name: 'teams', units: 2000000 },
};
const PLAN_UNITS: Record<string, number> = { starter: 5000, pro: 100000, teams: 2000000 };

async function main() {
  const args = process.argv.slice(2);
  const uid = args.find(a => !a.startsWith('--'));
  const apply = args.includes('--apply');
  const planOverride = (() => { const i = args.indexOf('--plan'); return i >= 0 ? args[i + 1] : null; })();
  if (!uid) { console.error('Usage: backfill-subscription.ts <uid> [--plan starter|pro|teams] [--apply]'); process.exit(1); }

  const userRef = db.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) { console.error(`No user ${uid}`); process.exit(1); }
  const user = userSnap.data() || {};
  const customerId = user.stripeCustomerId;
  if (!customerId) { console.error('User has no stripeCustomerId'); process.exit(1); }
  console.log(`user ${uid} | customer ${customerId} | existing subscription: ${JSON.stringify(user.subscription)}`);

  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  console.log(`\nlive subscriptions: ${subs.data.length}`);
  subs.data.forEach(s => {
    const p = s.items.data[0]?.price;
    console.log(`  ${s.id} status=${s.status} price=${p?.id} amount=${p?.unit_amount} interval=${p?.recurring?.interval} period ${new Date(s.current_period_start * 1000).toISOString()} -> ${new Date(s.current_period_end * 1000).toISOString()}`);
  });

  const active = subs.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status));
  if (!active) { console.error('\nNo active/trialing subscription found in live Stripe; nothing to backfill.'); process.exit(1); }

  const priceId = active.items.data[0]?.price.id || '';
  let planInfo = PLAN_MAPPING[priceId];
  if (planOverride) {
    if (!(planOverride in PLAN_UNITS)) { console.error(`--plan must be starter|pro|teams`); process.exit(1); }
    planInfo = { name: planOverride, units: PLAN_UNITS[planOverride] };
  }
  if (!planInfo) {
    console.error(`\nPrice ${priceId} is not in the local PLAN_MAPPING (likely test-vs-live price ids).`);
    console.error(`Re-run with --plan <starter|pro|teams> after confirming the plan from the Stripe dashboard.`);
    process.exit(1);
  }

  const updateData: Record<string, any> = {
    'subscription.status': active.status,
    'subscription.plan': planInfo.name,
    'subscription.units': planInfo.units,
    'subscription.stripeSubscriptionId': active.id,
    'subscription.currentPeriodStart': new Date(active.current_period_start * 1000).toISOString(),
    'subscription.currentPeriodEnd': new Date(active.current_period_end * 1000).toISOString(),
    'subscription.cancelAtPeriodEnd': active.cancel_at_period_end,
    'subscription.updatedAt': new Date().toISOString(),
  };

  console.log(`\n${apply ? 'APPLYING' : 'DRY-RUN — would write'}:`);
  console.log(JSON.stringify(updateData, null, 2));

  if (apply) {
    await userRef.update(updateData);
    await db.collection('subscription_events').add({
      userId: uid, type: 'manual_backfill', subscriptionId: active.id, plan: planInfo.name, timestamp: new Date(),
    });
    console.log('\n✅ Written. Re-run scripts/diagnose-usage-limit.ts to verify the gate now passes.');
  } else {
    console.log('\n(dry-run) re-run with --apply to commit.');
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
