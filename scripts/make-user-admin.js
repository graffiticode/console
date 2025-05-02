// Script to make a user an admin
const admin = require('firebase-admin');

// Initialize Firebase Admin
// IMPORTANT: You must set the FIREBASE_SERVICE_ACCOUNT_KEY environment variable
// with a base64-encoded Firebase service account key JSON before running this script
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
  console.error('Please set this variable with a base64-encoded Firebase service account key');
  console.error('Example: export FIREBASE_SERVICE_ACCOUNT_KEY=$(base64 -w 0 service-account.json)');
  process.exit(1);
}

// Get the user ID from command line arguments
const uid = process.argv[2];
if (!uid) {
  console.error('ERROR: User ID not provided');
  console.error('Usage: node make-user-admin.js <userId>');
  console.error('Example: node make-user-admin.js 0x1234567890abcdef1234567890abcdef12345678');
  process.exit(1);
}

// Initialize Firebase
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString()
);

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function makeUserAdmin(uid) {
  console.log(`Looking for user with ID: ${uid}`);
  
  try {
    // Check if user exists
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('uid', '==', uid).get();
    
    if (userQuery.empty) {
      console.error(`❌ User with ID ${uid} not found`);
      return false;
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    console.log(`Found user: ${userData.uid}`);
    
    // Update user to be admin and verified
    await userDoc.ref.update({
      isAdmin: true,
      isVerified: true,
      verifiedAt: new Date().toISOString()
    });
    
    console.log(`✅ User ${uid} is now an admin and verified`);
    return true;
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    return false;
  }
}

// Run the script
makeUserAdmin(uid)
  .then(success => {
    if (success) {
      console.log('Done!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });