import { useState, useEffect } from 'react';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

export default function AuthWrapper({ children }) {
  const { user, loading } = useGraffiticodeAuth();
  const [isReady, setIsReady] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);

  useEffect(() => {
    if (user && !loading && !checkingUser) {
      ensureUserExists();
    } else if (!user && !loading) {
      setIsReady(true);
    }
  }, [user, loading]);

  const ensureUserExists = async () => {
    setCheckingUser(true);
    try {
      const token = await user.getToken();
      const response = await fetch('/api/user/' + user.uid, {
        headers: {
          'Authorization': token,
        },
      });

      if (response.ok) {
        // User exists
        setIsReady(true);
      } else if (response.status === 404) {
        // User doesn't exist yet, create them
        const createResponse = await fetch('/api/user/' + user.uid, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          body: JSON.stringify({
            uid: user.uid,
            created: new Date().toISOString(),
          }),
        });

        if (createResponse.ok) {
          setIsReady(true);
        } else {
          console.error('Failed to create user');
        }
      }
    } catch (error) {
      console.error('Error checking/creating user:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  if (loading || checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isReady) {
    return null;
  }

  return children;
}
