import { useState, useEffect } from 'react';
import InviteCodeDialog from './InviteCodeDialog';
import SignInAlert from './SignInAlert';
import useArtcompilerAuth from '../hooks/use-artcompiler-auth';

export default function AuthWrapper({ children }) {
  const { user, loading } = useArtcompilerAuth();
  const [showInviteCodeDialog, setShowInviteCodeDialog] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [checkingInviteCode, setCheckingInviteCode] = useState(false);
  const [showSignInAlert, setShowSignInAlert] = useState(false);

  useEffect(() => {
    if (user && !loading && !checkingInviteCode) {
      checkUserInviteCode();
    }
  }, [user, loading]);

  const checkUserInviteCode = async () => {
    setCheckingInviteCode(true);
    try {
      const token = await user.getToken();
      const response = await fetch('/api/user/' + user.uid, {
        headers: {
          'Authorization': token,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // Existing users are automatically approved, don't need invite code
        setHasInviteCode(true);
      } else if (response.status === 404) {
        // User doesn't exist yet, show invite code dialog
        setShowInviteCodeDialog(true);
      }
    } catch (error) {
      console.error('Error checking invite code:', error);
    } finally {
      setCheckingInviteCode(false);
    }
  };

  const handleInviteCodeSubmit = async (inviteCode) => {
    const token = await user.getToken();
    const response = await fetch('/api/invite-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({ inviteCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify invite code');
    }

    setHasInviteCode(true);
    setShowInviteCodeDialog(false);
  };

  const handleInviteCodeCancel = () => {
    setShowInviteCodeDialog(false);
    setShowSignInAlert(true);
  };

  if (loading || checkingInviteCode) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <>
        {children}
      </>
    );
  }

  if (showInviteCodeDialog) {
    return (
      <InviteCodeDialog
        open={showInviteCodeDialog}
        onClose={handleInviteCodeCancel}
        onSubmit={handleInviteCodeSubmit}
      />
    );
  }

  if (showSignInAlert) {
    return <SignInAlert />;
  }

  if (!hasInviteCode) {
    return null; // Prevent access until invite code is verified
  }

  return children;
}
