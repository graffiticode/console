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

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

async function clearOne(id: string): Promise<'deleted' | 'missing'> {
  const compileRef = db.doc(`compiles/${id}`);
  const doc = await compileRef.get();
  if (!doc.exists) return 'missing';
  await compileRef.delete();
  return 'deleted';
}

async function main() {
  // taskIds from args, plus any newline-separated ids piped on stdin (single-process batch)
  const ids = [
    ...process.argv.slice(2),
    ...(await readStdin()).split('\n'),
  ].map(s => s.trim()).filter(Boolean);

  if (ids.length === 0) {
    console.log('Usage: npx tsx scripts/clear-compile.ts <taskId> [taskId ...]');
    console.log('   or: <source of ids> | npx tsx scripts/clear-compile.ts');
    console.log('  taskId: The compile record ID (e.g., eyJ0YXNrSWRzIjpbIk11OXFvMU81N29Ta0cwcXF4U3BXIl19)');
    process.exit(1);
  }

  let deleted = 0;
  let missing = 0;
  const batchSize = 20;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(clearOne));
    results.forEach(r => (r === 'deleted' ? deleted++ : missing++));
    if (ids.length > 1) process.stdout.write(`\r${deleted + missing}/${ids.length}`);
  }

  if (ids.length === 1) {
    console.log(missing ? `Compile record not found: ${ids[0]}` : `Deleted compile record: ${ids[0]}`);
    if (missing) process.exit(1);
  } else {
    console.log(`\nDone. Deleted: ${deleted}, Not found: ${missing}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
