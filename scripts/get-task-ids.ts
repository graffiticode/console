#!/usr/bin/env node

import admin from 'firebase-admin';

delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

const args = process.argv.slice(2);

if (args.includes('--help') || !args.includes('--lang')) {
  console.log(`
Usage: npx tsx scripts/get-task-ids.ts --lang <language> [--mark <marks>]

Options:
  --lang <language>   Language code (e.g., "0166") [required]
  --mark <marks>      Filter by mark value(s), comma-separated (default: all)
  --help              Show this help message

Examples:
  npx tsx scripts/get-task-ids.ts --lang 0166
  npx tsx scripts/get-task-ids.ts --lang 0166 --mark 4
  npx tsx scripts/get-task-ids.ts --lang 0166 --mark 3,4
`);
  process.exit(args.includes('--help') ? 0 : 1);
}

const lang = args[args.indexOf('--lang') + 1];
const markValues: number[] | null = args.includes('--mark')
  ? args[args.indexOf('--mark') + 1].split(',').map(v => parseInt(v.trim()))
  : null;

const userId = '24493e1c7a7f1ad57e3c478087c74c2dacb0cba1';

if (process.env.GRAFFITICODE_APP_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;
} else {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS environment variable not set');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'graffiticode-app'
});

async function main() {
  const db = admin.firestore();
  let query: any = db.collection(`users/${userId}/items`).where('lang', '==', lang);

  if (markValues) {
    if (markValues.length === 1) {
      query = query.where('mark', '==', markValues[0]);
    } else {
      query = query.where('mark', 'in', markValues);
    }
  }

  const snapshot = await query.get();
  const taskIds: string[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.taskId) {
      taskIds.push(data.taskId);
    }
  });

  const markLabel = markValues ? `mark=${markValues.join(',')}` : 'all marks';
  console.error(`Found ${taskIds.length} task IDs for L${lang} (${markLabel})`);

  taskIds.forEach(id => console.log(id));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
