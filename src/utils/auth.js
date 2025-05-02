import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { client } from '../lib/auth';

// Initialize Firebase Admin SDK if not already initialized
function initializeFirebaseAdmin() {
  if (!getApps().length) {
    // Use Application Default Credentials
    // This is more secure and follows Google's best practices
    try {
      initializeApp();
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      // The API will still work with Graffiticode auth as fallback
    }
  }
  
  return getAuth();
}

/**
 * Verify a Firebase ID token
 * @param {string} token - The Firebase ID token to verify
 * @returns {Promise<object>} - The decoded token payload
 */
export async function verifyIdToken(token) {
  // First try to use the Firebase Admin SDK
  try {
    const auth = initializeFirebaseAdmin();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.log('Firebase token verification failed, trying Graffiticode auth', error);
    
    // Fall back to Graffiticode auth client if Firebase fails
    try {
      const verifiedToken = await client.verifyToken(token);
      return {
        uid: verifiedToken.address || verifiedToken.uid,
        ...verifiedToken
      };
    } catch (clientError) {
      console.error('Failed to verify token with Graffiticode auth client:', clientError);
      throw new Error('Invalid or expired authentication token');
    }
  }
}