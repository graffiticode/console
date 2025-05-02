// Script to make a user an admin
const admin = require('firebase-admin');

// Get the user ID from command line arguments
const uid = process.argv[2];
if (!uid) {
  console.error('ERROR: User ID not provided');
  console.error('Usage: node make-user-admin.js <userId>');
  console.error('Example: node make-user-admin.js 0x1234567890abcdef1234567890abcdef12345678');
  process.exit(1);
}

// Initialize Firebase Admin using Application Default Credentials (ADC)
// This follows Google's best practices for authentication
if (!admin.apps.length) {
  try {
    // This will use:
    // - If running on Google Cloud: the service account attached to the environment
    // - If running locally: ADC from gcloud CLI (after running `gcloud auth application-default login`)
    // - Or credentials specified by GOOGLE_APPLICATION_CREDENTIALS environment variable
    admin.initializeApp({
      // No explicit credentials required, the SDK will use ADC
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    console.error('\nTo authenticate locally:');
    console.error('1. Run: gcloud auth application-default login');
    console.error('2. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to a service account file');
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