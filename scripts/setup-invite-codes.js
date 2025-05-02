// One-time setup script to create initial invite codes and mark existing users as verified
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

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

async function setupInviteCodes() {
  console.log('Starting invite code setup...');
  
  try {
    // Step 1: Mark all existing users as verified
    const usersSnapshot = await db.collection('users').get();
    const updatePromises = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.isVerified !== true) {
        console.log(`Marking user ${doc.id} as verified`);
        updatePromises.push(
          doc.ref.update({
            isVerified: true,
            verifiedAt: new Date().toISOString()
          })
        );
      }
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Updated ${updatePromises.length} users to verified status`);
    
    // Step 2: Create invite codes collection if it doesn't exist
    const inviteCodesSnapshot = await db.collection('inviteCodes').get();
    if (inviteCodesSnapshot.empty) {
      console.log('Creating initial invite codes...');
      
      // Find admin users to give them invite codes
      const adminUsersSnapshot = await db.collection('users').where('isAdmin', '==', true).get();
      const adminCreatePromises = [];
      
      adminUsersSnapshot.forEach(doc => {
        const adminData = doc.data();
        // Create 3 invite codes for each admin
        for (let i = 0; i < 3; i++) {
          const inviteCode = {
            id: uuidv4(),
            code: Math.random().toString(36).substring(2, 10).toUpperCase(),
            createdBy: adminData.uid,
            createdAt: new Date().toISOString(),
            used: false
          };
          
          adminCreatePromises.push(
            db.collection('inviteCodes').doc(inviteCode.id).set(inviteCode)
          );
        }
      });
      
      await Promise.all(adminCreatePromises);
      console.log(`✅ Created ${adminCreatePromises.length} invite codes for ${adminUsersSnapshot.size} admins`);
    } else {
      console.log(`Invite codes collection already exists with ${inviteCodesSnapshot.size} codes`);
    }
    
    // Step 3: Create a few additional codes if none exist yet
    if (inviteCodesSnapshot.empty) {
      const additionalCodes = [];
      
      for (let i = 0; i < 5; i++) {
        const inviteCode = {
          id: uuidv4(),
          code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          used: false
        };
        
        additionalCodes.push(
          db.collection('inviteCodes').doc(inviteCode.id).set(inviteCode)
        );
      }
      
      await Promise.all(additionalCodes);
      console.log(`✅ Created ${additionalCodes.length} additional invite codes`);
    }
    
    console.log('✅ Invite code setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up invite codes:', error);
    process.exit(1);
  }
}

setupInviteCodes()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });