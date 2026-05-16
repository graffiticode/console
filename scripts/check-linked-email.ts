#!/usr/bin/env tsx
// Read-only inspection of the auth-service `linked-emails` Firestore
// collection for a given email. Looks up both by sha256(normalized email) doc
// id and by a `where email ==` query, so we can spot stored variants
// (capitalization, plus-tags) that the hash-keyed lookup would miss.
//
//   GRAFFITICODE_CREDENTIALS=~/graffiticode-key.json \
//   npx tsx scripts/check-linked-email.ts <email>

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
  console.error('usage: check-linked-email.ts <email>');
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
  const normalized = normalize(email);
  const id = docId(email);
  console.log(`email: ${email}`);
  console.log(`normalized: ${normalized}`);
  console.log(`doc id (sha256): ${id}`);
  console.log('---');

  const ref = db.doc(`linked-emails/${id}`);
  const snap = await ref.get();
  if (snap.exists) {
    console.log(`linked-emails/${id} EXISTS:`);
    console.log(JSON.stringify(snap.data(), null, 2));
  } else {
    console.log(`linked-emails/${id} does NOT exist`);
  }
  console.log('---');

  console.log(`scanning collection for any row with email matching (case-insensitive)…`);
  const allSnap = await db.collection('linked-emails').get();
  const matches = allSnap.docs.filter((d) => {
    const e = (d.data().email || '').toString().toLowerCase();
    return e === normalized || e.replace(/\+[^@]*/, '') === normalized.replace(/\+[^@]*/, '');
  });
  if (matches.length === 0) {
    console.log('no rows found via full-collection scan');
  } else {
    for (const d of matches) {
      console.log(`${d.id}:`);
      console.log(JSON.stringify(d.data(), null, 2));
    }
  }

  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
