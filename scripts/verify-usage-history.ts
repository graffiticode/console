#!/usr/bin/env node
/**
 * Test suite for src/lib/usage-history.ts.
 *
 * The repo has no unit-test runner, so this script IS the test suite for the
 * cycle-assembly logic. `--fixtures` runs it against hand-built invoices with no
 * network — the only place the awkward paths (mid-history plan change, void
 * invoice, a cycle straddling the item-data cutover, an annual base line) get
 * exercised at all. Without `--fixtures` it runs against a live account.
 *
 * Usage:
 *   npx tsx scripts/verify-usage-history.ts --fixtures
 *
 *   eval "$(grep '^# STRIPE_SECRET_KEY=sk_live' .env.local | sed 's/^# /export /')"
 *   env -u FIRESTORE_EMULATOR_HOST GRAFFITICODE_APP_CREDENTIALS=$HOME/graffiticode-app-key.json \
 *     npx tsx scripts/verify-usage-history.ts --uid <uid> [--include-current]
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch { }

// priceIdToPlan() resolves a base price id by comparing against env vars, so the
// fixtures must register theirs. This is not test scaffolding to be waved at: if
// these vars are ABSENT in prod, plan detection returns undefined and the
// allowance column silently goes blank. Setting them here is what makes the
// fixture exercise the same lookup production uses.
process.env.STRIPE_PRO_MONTHLY_PRICE_ID = 'pro_base';
process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID = 'teams_base';
process.env.STRIPE_PRO_ANNUAL_PRICE_ID = 'annual_base';

import { buildUsageCycles, ITEM_DATA_START, type UsageRow } from '../src/lib/usage-history';

const arg = (n: string, d?: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const has = (n: string) => process.argv.includes(`--${n}`);

let failures = 0;
function check(label: string, actual: any, expected: any) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}${ok ? '' : `  (expected ${JSON.stringify(expected)})`}`);
}

// ---------------------------------------------------------------- fixtures

const secs = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m - 1, d) / 1000);

const PRICES: Record<string, any> = {
  pro_base: { id: 'pro_base', recurring: { usage_type: 'licensed', interval: 'month' } },
  pro_meter: { id: 'pro_meter', recurring: { usage_type: 'metered', interval: 'month' } },
  teams_base: { id: 'teams_base', recurring: { usage_type: 'licensed', interval: 'month' } },
  annual_base: { id: 'annual_base', recurring: { usage_type: 'licensed', interval: 'year' } },
};
const priceOf = (id: string) => PRICES[id];

function line(priceId: string, amountCents: number, start: number, end: number, quantity?: number) {
  return {
    amount: amountCents,
    quantity,
    period: { start, end },
    pricing: { type: 'price_details', price_details: { price: priceId } },
  };
}
function invoice(id: string, created: number, lines: any[], status = 'paid', url = `https://stripe/${id}`) {
  return { id, created, status, hosted_invoice_url: url, lines: { data: lines } } as any;
}

function runFixtures() {
  console.log(`ITEM_DATA_START = ${new Date(ITEM_DATA_START).toISOString()}\n`);

  // --- Scenario 1: three monthly cycles spanning the item-data cutover.
  const invoices = [
    // Opens cycle A (Jun 23 -> Jul 23): entirely BEFORE item data exists.
    invoice('in_A', secs(2026, 6, 23), [line('pro_base', 10000, secs(2026, 6, 23), secs(2026, 7, 23))]),
    // Opens cycle B; its metered line closes cycle A.
    invoice('in_B', secs(2026, 7, 23), [
      line('pro_base', 10000, secs(2026, 7, 23), secs(2026, 8, 23)),
      line('pro_meter', 0, secs(2026, 6, 23), secs(2026, 7, 23), 0),
    ]),
    // Opens cycle C (current); its metered line closes cycle B with 328 items.
    invoice('in_C', secs(2026, 8, 23), [
      line('pro_base', 10000, secs(2026, 8, 23), secs(2026, 9, 23)),
      line('pro_meter', 0, secs(2026, 7, 23), secs(2026, 8, 23), 328),
    ]),
    // Void invoices must be ignored entirely.
    invoice('in_VOID', secs(2026, 8, 1), [line('pro_base', 99999, secs(2026, 8, 1), secs(2026, 9, 1))], 'void'),
  ];

  const rows: UsageRow[] = [
    ...Array.from({ length: 328 }, () => ({ createdAtMs: Date.UTC(2026, 7, 1), units: 1, sponsored: false })),
    ...Array.from({ length: 14 }, () => ({ createdAtMs: Date.UTC(2026, 7, 2), units: 0, sponsored: true })),
    // A local-script row: units 0, not sponsored. Must be invisible.
    { createdAtMs: Date.UTC(2026, 7, 3), units: 0, sponsored: false },
    // Inside cycle A, before item data began — must not surface anywhere.
    { createdAtMs: Date.UTC(2026, 6, 1), units: 1, sponsored: false },
  ];

  const nowMs = Date.UTC(2026, 7, 25);
  const cycles = buildUsageCycles({ invoices, priceOf, rows, nowMs });

  console.log('Scenario 1: monthly cycles across the cutover, void invoice present');
  check('void invoice excluded', cycles.some(c => c.id === 'in_VOID'), false);
  check('current cycle excluded by default', cycles.map(c => c.id), ['in_B', 'in_A']);

  const b = cycles.find(c => c.id === 'in_B')!;
  check('B period', [b.start.slice(0, 10), b.end.slice(0, 10)], ['2026-07-23', '2026-08-23']);
  check('B dataAvailable', b.dataAvailable, true);
  check('B itemsUsed (sponsored + local excluded)', b.itemsUsed, 328);
  check('B sponsoredItems', b.sponsoredItems, 14);
  check('B includedItems', b.includedItems, 500);
  check('B overageItems', b.overageItems, 0);
  check('B meteredQuantity', b.meteredQuantity, 328);
  check('B reconciles', b.reconciles, true);
  check('B amountUsd (base only, overage $0)', b.amountUsd, 100);
  check('B invoiceUrl is the CLOSING invoice', b.invoiceUrl, 'https://stripe/in_C');

  const a = cycles.find(c => c.id === 'in_A')!;
  check('A predates cutover -> dataAvailable false', a.dataAvailable, false);
  check('A itemsUsed withheld', a.itemsUsed, null);
  check('A includedItems withheld', a.includedItems, null);
  check('A money still real', a.amountUsd, 100);

  const withCurrent = buildUsageCycles({ invoices, priceOf, rows, nowMs, includeCurrent: true });
  check('includeCurrent surfaces the open cycle', withCurrent[0].id, 'in_C');
  check('open cycle flagged', withCurrent[0].isCurrent, true);

  // --- Scenario 2: mid-history plan change produces two adjacent short cycles.
  console.log('\nScenario 2: mid-cycle plan change');
  const changed = [
    invoice('in_1', secs(2026, 7, 23), [line('pro_base', 10000, secs(2026, 7, 23), secs(2026, 8, 23))]),
    // Upgrade on Aug 2 re-anchors the period.
    invoice('in_2', secs(2026, 8, 2), [line('teams_base', 100000, secs(2026, 8, 2), secs(2026, 9, 2))]),
    invoice('in_3', secs(2026, 9, 2), [line('teams_base', 100000, secs(2026, 9, 2), secs(2026, 10, 2))]),
  ];
  const two = buildUsageCycles({ invoices: changed, priceOf, rows: [], nowMs: Date.UTC(2026, 8, 15) });
  const first = two.find(c => c.id === 'in_1')!;
  const second = two.find(c => c.id === 'in_2')!;
  check('first cycle ends where second begins (tiles, no gap)', first.end, second.start);
  check('first cycle is the short one', first.end.slice(0, 10), '2026-08-02');
  check('allowances differ per cycle', [first.includedItems, second.includedItems], [500, 10000]);

  // --- Scenario 3: annual base line withholds item columns.
  console.log('\nScenario 3: annual plan');
  const annual = [
    invoice('in_Y1', secs(2026, 7, 23), [line('annual_base', 100000, secs(2026, 7, 23), secs(2027, 7, 23))]),
    invoice('in_Y2', secs(2027, 7, 23), [line('annual_base', 100000, secs(2027, 7, 23), secs(2028, 7, 23))]),
  ];
  // Far enough forward that both annual cycles have closed.
  const yearly = buildUsageCycles({ invoices: annual, priceOf, rows, nowMs: Date.UTC(2028, 8, 1) });
  const y = yearly.find(c => c.id === 'in_Y1')!;
  check('annual cycle withholds itemsUsed', y.itemsUsed, null);
  check('annual cycle withholds includedItems', y.includedItems, null);
  check('annual money still shown', y.amountUsd, 1000);

  // --- Scenario 4: the price lookup fails; the advance/arrears fallback carries it.
  console.log('\nScenario 4: unresolvable price (fallback classifier)');
  const blind = buildUsageCycles({ invoices, priceOf: () => undefined, rows, nowMs });
  check('still finds the same cycles', blind.map(c => c.id), ['in_B', 'in_A']);
  check('still attributes the metered quantity', blind.find(c => c.id === 'in_B')!.meteredQuantity, 328);
}

// ---------------------------------------------------------------- live mode

async function runLive(uid: string) {
  const Stripe = (await import('stripe')).default;
  const admin = (await import('firebase-admin')).default;
  const { STRIPE_API_VERSION } = await import('../src/lib/plans-config');

  delete process.env.FIRESTORE_EMULATOR_HOST;
  const keyPath = process.env.GRAFFITICODE_APP_CREDENTIALS;
  if (!keyPath) { console.error('GRAFFITICODE_APP_CREDENTIALS not set'); process.exit(1); }
  if (!process.env.STRIPE_SECRET_KEY) { console.error('STRIPE_SECRET_KEY not set'); process.exit(1); }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))),
    projectId: 'graffiticode-app',
  });
  const db = admin.firestore();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });

  const userDoc = await db.doc(`users/${uid}`).get();
  const customer = userDoc.data()?.stripeCustomerId;
  if (!customer) { console.log('no stripeCustomerId — nothing to show'); return; }

  const invoices = (await stripe.invoices.list({ customer, limit: 14 })).data;

  const cache = new Map<string, any>();
  for (const inv of invoices) {
    for (const l of inv.lines.data as any[]) {
      const p = l?.pricing?.price_details?.price;
      const id = typeof p === 'string' ? p : p?.id;
      if (id && !cache.has(id)) cache.set(id, await stripe.prices.retrieve(id));
    }
  }

  const snap = await db.collection('usage')
    .where('userId', '==', uid)
    .where('createdAt', '>=', new Date(ITEM_DATA_START))
    .select('createdAt', 'type', 'units', 'nonBillableReason')
    .get();
  const rows: UsageRow[] = [];
  for (const d of snap.docs) {
    const r = d.data();
    if (r.type !== 'item_created') continue;
    const t = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    rows.push({ createdAtMs: t.getTime(), units: r.units || 0, sponsored: r.nonBillableReason === 'sponsored' });
  }

  const cycles = buildUsageCycles({
    invoices, priceOf: (id) => cache.get(id), rows,
    nowMs: Date.now(), includeCurrent: has('include-current'),
  });

  console.log(`\n${uid}  customer=${customer}  ${rows.length} usage rows since cutover\n`);
  for (const c of cycles) {
    const items = c.dataAvailable ? `${c.itemsUsed} / ${c.includedItems}` : '—';
    console.log(
      `  ${c.start.slice(0, 10)} -> ${c.end.slice(0, 10)}  ${(c.planName ?? '?').padEnd(9)}` +
      `  items=${items.padEnd(12)} sponsored=${c.sponsoredItems ?? '—'}` +
      `  overage=${c.overageItems ?? '—'}  $${c.amountUsd.toFixed(2)}` +
      `  metered=${c.meteredQuantity}${c.reconciles ? '' : '  ** DOES NOT RECONCILE **'}` +
      `${c.isCurrent ? '  (current)' : ''}`,
    );
  }
  const bad = cycles.filter(c => !c.reconciles);
  console.log(`\n${cycles.length} cycle(s), ${bad.length} not reconciling.`);
  if (bad.length) failures += bad.length;
}

async function main() {
  if (has('fixtures')) {
    runFixtures();
  } else {
    const uid = arg('uid');
    if (!uid) { console.error('need --uid <uid> or --fixtures'); process.exit(1); }
    await runLive(uid);
  }
  console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
