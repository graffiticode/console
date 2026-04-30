import { useCallback } from 'react';
import useGraffiticodeAuth from './use-graffiticode-auth';

const authUrl = process.env.NEXT_PUBLIC_GC_AUTH_URL || "https://auth.graffiticode.org";

export type OAuthProvider = 'google';

export interface OAuthLink {
  id: string;
  provider: string;
  email: string;
  createdAt?: any;
}

export function useOAuth() {
  const { user } = useGraffiticodeAuth();

  // Link an email address for Google sign-in (authentication deferred to login time)
  const linkEmail = useCallback(async (email: string) => {
    if (!user) {
      throw new Error('Must be logged in to link email');
    }

    const authToken = await user.getToken();
    const response = await fetch(`${authUrl}/oauth-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({ provider: 'google', email }),
    });

    const body = await response.json();
    if (!response.ok) {
      return { success: false, error: body.error?.message || body.message || 'Failed to link email' };
    }

    return { success: true, provider: 'google', email: body.data?.email || email };
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
      const body = await response.json();
      throw new Error(body.error?.message || body.message || 'Failed to get OAuth links');
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
      const body = await response.json();
      throw new Error(body.error?.message || body.message || 'Failed to unlink Google account');
    }

    return { success: true };
  }, [user]);

  return { linkEmail, getOAuthLinks, unlinkGoogle };
}

export default useOAuth;
