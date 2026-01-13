import { useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { apiFirebaseConfig } from '../lib/firebase';
import useGraffiticodeAuth from './use-graffiticode-auth';

const authUrl = process.env.NEXT_PUBLIC_GC_AUTH_URL || "https://auth.graffiticode.org";
const isDevelopment = process.env.NODE_ENV === 'development';

export type OAuthProvider = 'google';

// Create a separate Firebase app instance for OAuth
// This prevents the main auth session from being affected during OAuth popup
let oauthAuthInstance: ReturnType<typeof getAuth> | null = null;

const getOAuthAuth = () => {
  if (oauthAuthInstance) return oauthAuthInstance;

  const appName = 'oauth-helper';
  const existingApp = getApps().find(app => app.name === appName);
  const app = existingApp || initializeApp(apiFirebaseConfig, appName);
  oauthAuthInstance = getAuth(app);

  // Connect to emulator in development mode for OAuth to work
  if (isDevelopment) {
    try {
      connectAuthEmulator(oauthAuthInstance, 'http://localhost:9099', { disableWarnings: true });
    } catch (e) {
      // Already connected
    }
  }

  return oauthAuthInstance;
};

// Clean up oauth-helper session without affecting main app
// In development with singleProjectMode, signOut affects all apps sharing the emulator,
// so we skip it to preserve the main app's session
const cleanupOAuthSession = async (oauthAuth: ReturnType<typeof getAuth>) => {
  if (!isDevelopment) {
    await signOut(oauthAuth);
  }
  // In development, we just leave the oauth-helper session - it doesn't affect the main app's UI
};

export interface OAuthLink {
  id: string;
  provider: string;
  email: string;
  createdAt?: any;
}

export function useOAuth() {
  const { user } = useGraffiticodeAuth();

  // Sign in with Google (for users not logged in)
  // Uses a separate Firebase Auth instance to avoid polluting main auth state
  const signInWithGoogle = useCallback(async () => {
    const oauthAuth = getOAuthAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(oauthAuth, provider);
    const idToken = await result.user.getIdToken();

    // Clean up helper auth session
    await cleanupOAuthSession(oauthAuth);

    // Call backend auth to get custom token for linked Ethereum address
    const response = await fetch(`${authUrl}/authenticate/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to sign in with Google');
    }

    const data = await response.json();
    return { firebaseCustomToken: data.data.firebaseCustomToken };
  }, []);

  // Link Google account to existing Ethereum account (for logged-in users)
  // Uses a separate Firebase Auth instance to avoid changing the current session
  const linkGoogle = useCallback(async () => {
    if (!user) {
      throw new Error('Must be logged in to link Google account');
    }

    const oauthAuth = getOAuthAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(oauthAuth, provider);
    const idToken = await result.user.getIdToken();

    // Clean up helper auth session
    await cleanupOAuthSession(oauthAuth);

    const authToken = await user.getToken();
    const response = await fetch(`${authUrl}/oauth-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({ provider: 'google', idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to link Google account');
    }

    const data = await response.json();
    return { success: true, provider: 'google', email: data.data?.email };
  }, [user]);

  // Get linked OAuth accounts
  const getOAuthLinks = useCallback(async (): Promise<OAuthLink[]> => {
    if (!user) {
      throw new Error('Must be logged in to get OAuth links');
    }

    const authToken = await user.getToken();
    const response = await fetch(`${authUrl}/oauth-links`, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to get OAuth links');
    }

    const data = await response.json();
    return data.data?.links || [];
  }, [user]);

  // Unlink Google account
  const unlinkGoogle = useCallback(async () => {
    if (!user) {
      throw new Error('Must be logged in to unlink Google account');
    }

    const authToken = await user.getToken();
    const response = await fetch(`${authUrl}/oauth-links/google`, {
      method: 'DELETE',
      headers: {
        'Authorization': authToken,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to unlink Google account');
    }

    return { success: true };
  }, [user]);

  return { signInWithGoogle, linkGoogle, getOAuthLinks, unlinkGoogle };
}

export default useOAuth;
