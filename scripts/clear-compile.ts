#!/usr/bin/env node

import admin from 'firebase-admin';

// Force connection to production Firestore (bypass emulator)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Use GRAFFITICODE_CREDENTIALS for the graffiticode project
if (process.env.GRAFFITICODE_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_CREDENTIALS;
} else {
  console.error('Error: GRAFFITICODE_CREDENTIALS environment variable not set');
  console.error('Set it to the path of your graffiticode service account key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "graffiticode"
});
const db = admin.firestore();

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.log('Usage: npx ts-node scripts/clear-compile.ts <taskId>');
    console.log('  taskId: The compile record ID (e.g., eyJ0YXNrSWRzIjpbIk11OXFvMU81N29Ta0cwcXF4U3BXIl19)');
    process.exit(1);
  }

  const compileRef = db.doc(`compiles/${id}`);
  const doc = await compileRef.get();

  if (!doc.exists) {
    console.log(`Compile record not found: ${id}`);
    process.exit(1);
  }

  await compileRef.delete();
  console.log(`Deleted compile record: ${id}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
