#!/usr/bin/env node
// Diagnose why a user is blocked by the usage limit.
// Usage: npx tsx scripts/diagnose-usage-limit.ts <emailOrUid>

import admin from 'firebase-admin';
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

if (!process.env.GRAFFITICODE_APP_CREDENTIALS) {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS not set');
  process.exit(1);
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'graffiticode-app',
});
const db = admin.firestore();

// Mirror of usage-service.ts PLAN_ALLOCATIONS
const PLAN_ALLOCATIONS: Record<string, number> = {
  demo: 250, starter: 5000, pro: 100000, teams: 2000000,
};

async function findUid(arg: string): Promise<string | null> {
  if (!arg.includes('@')) {
    const doc = await db.doc(`users/${arg}`).get();
    if (doc.exists) return arg;
  }
  for (const field of ['email', 'signInEmail', 'notificationEmail']) {
    const snap = await db.collection('users').where(field, '==', arg).limit(1).get();
    if (!snap.empty) return snap.docs[0].id;
  }
  return null;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) { console.error('Usage: diagnose-usage-limit.ts <emailOrUid>'); process.exit(1); }

  const uid = await findUid(arg);
  if (!uid) { console.error(`No user found for "${arg}"`); process.exit(1); }

  const userData = (await db.doc(`users/${uid}`).get()).data() || {};
  const sub = userData.subscription || {};
  const usageDoc = await db.collection('usage').doc(uid).get();
  const storedTotal = usageDoc.exists ? (usageDoc.data()?.currentMonthTotal || 0) : 0;
  const lastReset = usageDoc.data()?.lastReset;

  const now = new Date();
  const plan = sub.plan || 'demo';
  const planKnown = plan in PLAN_ALLOCATIONS;
  let allocatedUnits = PLAN_ALLOCATIONS[plan] || PLAN_ALLOCATIONS.demo;
  const overageUnits = sub.overageUnits || 0;

  let preservedApplied = false;
  if (sub.preservedUntil && sub.preservedAllocation && new Date(sub.preservedUntil) > now) {
    allocatedUnits = sub.preservedAllocation;
    preservedApplied = true;
  }

  const periodStart = sub.currentPeriodStart
    ? new Date(sub.currentPeriodStart)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const recs = await db.collection('usage')
    .where('userId', '==', uid)
    .where('createdAt', '>=', periodStart)
    .get();
  let calc = 0;
  recs.docs.forEach(d => { calc += d.data().units || 0; });

  const currentUsage = calc; // checkCompileAllowed syncs stored -> calc
  const totalAvailable = allocatedUnits + overageUnits;
  const allowed = currentUsage <= totalAvailable;

  console.log(`\n=== Usage-limit diagnosis for ${userData.email || userData.signInEmail || uid} ===`);
  console.log(`uid:                 ${uid}`);
  console.log(`\n-- subscription --`);
  console.log(`plan:                ${plan}  ${planKnown ? '' : '  ⚠️  UNKNOWN KEY → falls back to demo (250)'}`);
  console.log(`status:              ${sub.status}`);
  console.log(`units (stored):      ${sub.units}`);
  console.log(`overageUnits:        ${overageUnits}`);
  console.log(`currentPeriodStart:  ${sub.currentPeriodStart}`);
  console.log(`currentPeriodEnd:    ${sub.currentPeriodEnd}`);
  console.log(`stripeSubscriptionId:${sub.stripeSubscriptionId}`);
  console.log(`updatedAt:           ${sub.updatedAt}`);
  if (sub.preservedAllocation) console.log(`preservedAllocation: ${sub.preservedAllocation} until ${sub.preservedUntil}${preservedApplied ? '  ⚠️ ACTIVE (caps allocation)' : ' (expired)'}`);
  console.log(`autoOverageEnabled:  ${!!sub.autoOverageEnabled}`);
  console.log(`\n-- usage doc --`);
  console.log(`currentMonthTotal:   ${storedTotal}`);
  console.log(`lastReset:           ${lastReset}`);
  console.log(`\n-- recomputed (what checkCompileAllowed does) --`);
  console.log(`periodStart used:    ${periodStart.toISOString()}`);
  console.log(`usage records since: ${recs.size}`);
  console.log(`calculated usage:    ${calc}  ${calc !== storedTotal ? `(differs from stored ${storedTotal})` : ''}`);
  console.log(`allocatedUnits:      ${allocatedUnits}`);
  console.log(`totalAvailable:      ${totalAvailable}  (= ${allocatedUnits} + ${overageUnits} overage)`);
  console.log(`\n>>> allowed:         ${allowed}  (${currentUsage} <= ${totalAvailable})`);
  if (!allowed) {
    console.log(`\nVERDICT: blocked because used ${currentUsage} > available ${totalAvailable}.`);
    if (!planKnown) console.log(`  → ROOT CAUSE likely: plan "${plan}" is not a known key, so allocation defaulted to demo 250.`);
    else if (preservedApplied) console.log(`  → ROOT CAUSE likely: a downgrade left preservedAllocation=${sub.preservedAllocation} capping this account.`);
    else console.log(`  → plan "${plan}" resolves to ${PLAN_ALLOCATIONS[plan]} units; usage genuinely exceeds it (check if upgrade webhook ran: updatedAt/stripeSubscriptionId above).`);
  }
  console.log('');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
