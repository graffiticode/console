import admin from 'firebase-admin';

// NOTE: JSON.stringify the firebase service acccount key and set it to
// the environment variable GOOGLE_APP_CREDENTIALS

if (!admin.apps.length) {
  try {
    const credentials = process.env.GOOGLE_APP_CREDENTIALS;
    console.log("GOOGLE_APP_CREDENTIALS=" + credentials);
    const serviceAccount = JSON.parse(credentials);
    console.log("serviceAccount=" + JSON.stringify(serviceAccount, null, 2));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export default admin.firestore();
