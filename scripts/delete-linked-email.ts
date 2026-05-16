#!/usr/bin/env tsx
// Delete a row from the auth-service `linked-emails` Firestore collection.
// Use after deleting a user account directly in Firestore: removes the stale
// email -> uid mapping so the email can be re-added or re-claimed.
//
//   GRAFFITICODE_CREDENTIALS=~/graffiticode-key.json \
//   npx tsx scripts/delete-linked-email.ts <email>

import crypto from 'crypto';
import fs from 'fs';
import admin from 'firebase-admin';

const credsPath = process.env.GRAFFITICODE_CREDENTIALS;
if (!credsPath) {
  console.error('GRAFFITICODE_CREDENTIALS not set');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('usage: delete-linked-email.ts <email>');
  process.exit(1);
}

const normalize = (s: string) => s.trim().toLowerCase();
const docId = (s: string) => crypto.createHash('sha256').update(normalize(s)).digest('hex');

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(credsPath, 'utf8'))),
  projectId: 'graffiticode',
});

const db = admin.firestore();

(async () => {
  const id = docId(email);
  const ref = db.doc(`linked-emails/${id}`);
  const snap = await ref.get();
  if (!snap.exists) {
    console.log(`linked-emails/${id} does not exist — nothing to delete`);
    process.exit(0);
  }
  console.log(`deleting linked-emails/${id}:`);
  console.log(JSON.stringify(snap.data(), null, 2));
  await ref.delete();
  console.log('deleted');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
