#!/usr/bin/env node

import admin from 'firebase-admin';

// Force connection to production Firestore (bypass emulator)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Use GRAFFITICODE_APP_CREDENTIALS for the graffiticode-app project
if (process.env.GRAFFITICODE_APP_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;
} else {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS environment variable not set');
  console.error('Set it to the path of your graffiticode-app service account key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "graffiticode-app"
});
const db = admin.firestore();

async function adjustOverageCredits(userId: string, adjustment: number, reason: string) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error(`User ${userId} not found`);
  }

  const userData = userDoc.data();
  const currentOverage = userData?.subscription?.overageUnits || 0;
  const newOverage = Math.max(0, currentOverage + adjustment);

  await userRef.update({
    'subscription.overageUnits': newOverage
  });

  await db.collection('overage_adjustments').add({
    userId,
    previousUnits: currentOverage,
    adjustment,
    newUnits: newOverage,
    reason,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    adjustedBy: 'admin-script'
  });

  return { previousUnits: currentOverage, newUnits: newOverage };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx ts-node scripts/adjust-overage-credits.ts <userId> <adjustment> [reason]');
    console.log('  userId: User ID');
    console.log('  adjustment: Number of credits to add (positive) or remove (negative)');
    console.log('  reason: Optional reason for adjustment');
    console.log('\nExamples:');
    console.log('  npx ts-node scripts/adjust-overage-credits.ts abc123 1000 "Support credit"');
    console.log('  npx ts-node scripts/adjust-overage-credits.ts abc123 -500 "Correction"');
    process.exit(1);
  }

  const userId = args[0];
  const adjustment = parseInt(args[1], 10);
  const reason = args[2] || 'Manual adjustment';

  if (isNaN(adjustment)) {
    console.error('Error: adjustment must be a number');
    process.exit(1);
  }

  console.log(`User: ${userId}`);
  console.log(`Adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`);

  const result = await adjustOverageCredits(userId, adjustment, reason);

  console.log(`\nSuccess!`);
  console.log(`Previous: ${result.previousUnits}`);
  console.log(`New: ${result.newUnits}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
