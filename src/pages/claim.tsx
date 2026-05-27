import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from 'reactfire';
import { signOut } from 'firebase/auth';
import useGraffiticodeAuth from '@graffiticode/auth-react';
import { useEmailSignIn } from '@graffiticode/auth-react';
import AuthMethodDialog from '../components/AuthMethodDialog';
import WalletSelectionDialog from '../components/WalletSelectionDialog';
import { getPageTitle } from '../lib/utils';

interface Wallet {
  name: string;
  provider: any;
}

// Persisted so the token survives the sign-in remount: the auth provider
// unmounts the whole tree while Firebase status is "loading" during
// signInWithCustomToken, after which router.query.token can momentarily be
// empty. The stashed copy lets the claim proceed regardless.
const CLAIM_TOKEN_KEY = 'graffiticode:claim-token';

export default function Claim() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading, signInWithEthereum } = useGraffiticodeAuth();
  // /claim is the explicit "convert trial to account" surface, so unmatched
  // emails should create new accounts without prompting.
  const {
    sendCode,
    verifyAndSignIn,
    sending: emailSending,
    verifying: codeVerifying,
    emailError,
    codeError,
  } = useEmailSignIn({ allowSignup: true });

  const [token, setToken] = useState<string | null>(null);
  // False until the resolving effect has checked both the URL and the stash —
  // gates rendering so the "Invalid claim link" branch can't flash before the
  // stashed token is read on a sign-in remount.
  const [tokenChecked, setTokenChecked] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimEmpty, setClaimEmpty] = useState(false);
  // Guards against double-submits within a mount (the success path also clears
  // the stashed token, so a remount can't re-run the non-idempotent copy).
  const claimingRef = useRef(false);

  // Resolve the claim token once the router is ready and persist it. Prefer the
  // URL param; fall back to the stashed copy after a sign-in remount.
  useEffect(() => {
    if (!router.isReady) return;
    const fromQuery = typeof router.query.token === 'string' ? router.query.token : null;
    if (fromQuery) {
      sessionStorage.setItem(CLAIM_TOKEN_KEY, fromQuery);
      setToken(fromQuery);
    } else {
      setToken(sessionStorage.getItem(CLAIM_TOKEN_KEY));
    }
    setTokenChecked(true);
  }, [router.isReady, router.query.token]);

  // The copy is an explicit user action (Save button) on a stable, signed-in
  // page — not a passive effect racing the sign-in remount.
  const runClaim = async () => {
    if (!user || !token || claimingRef.current) return;
    claimingRef.current = true;
    setClaiming(true);
    setClaimError(null);
    setClaimEmpty(false);
    try {
      const idToken = await user.getToken();
      const resp = await fetch('/api', {
        method: 'POST',
        headers: {
          Authorization: idToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation ClaimFreePlanSession($token: String!) {
            claimFreePlanSession(token: $token) {
              transferred
              sessionNamespace
              items { id lang }
            }
          }`,
          variables: { token },
        }),
      });
      const json = await resp.json();
      if (json.errors?.length) {
        throw new Error(json.errors[0].message);
      }
      const result = json.data?.claimFreePlanSession;
      const items: { id: string; lang: string }[] = Array.isArray(result?.items) ? result.items : [];
      if (items.length === 0) {
        sessionStorage.removeItem(CLAIM_TOKEN_KEY);
        setClaimEmpty(true);
        return;
      }
      // Clear before navigating so a remount or re-visit can't re-run the copy.
      sessionStorage.removeItem(CLAIM_TOKEN_KEY);
      router.replace(`/items/${items[0].id}`);
    } catch (err: any) {
      // Leave the token in place so "Try again" can retry.
      setClaimError(err?.message || 'Failed to claim items');
    } finally {
      claimingRef.current = false;
      setClaiming(false);
    }
  };

  const handleSelectEthereum = () => {
    setShowWalletDialog(true);
  };

  const handleWalletSelect = async (wallet: Wallet) => {
    try {
      await signInWithEthereum(wallet);
      setShowWalletDialog(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Sign out WITHOUT the global redirect: useGraffiticodeAuth().signOut sends
  // the user to '/', which would drop the claim context. Signing out in place
  // keeps us on /claim and re-shows the sign-in dialog; the stashed token
  // survives the switch so the user can claim into the new account.
  const handleSwitchAccount = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('graffiticode:selected:itemId');
      localStorage.removeItem('graffiticode:selected:taskId');
      localStorage.removeItem('graffiticode:language');
    }
    setClaimError(null);
    setClaimEmpty(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  if (!router.isReady || loading || !tokenChecked) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <>
        <Head><title>{getPageTitle('Claim')}</title></Head>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] px-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid claim link</h1>
          <p className="text-sm text-gray-600 text-center max-w-sm">
            This claim link is missing or malformed. Ask your assistant to send a new one.
          </p>
        </div>
      </>
    );
  }

  if (user) {
    const account = user.email || user.uid;
    return (
      <>
        <Head><title>{getPageTitle('Claim')}</title></Head>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] px-4">
          {claiming && (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-sm text-gray-600">Saving your items...</p>
            </>
          )}

          {!claiming && claimError && (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Couldn&rsquo;t save your items</h1>
              <p className="text-sm text-red-700 text-center max-w-sm mb-4">{claimError}</p>
              <button
                type="button"
                className="rounded-none border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={runClaim}
              >
                Try again
              </button>
            </>
          )}

          {!claiming && !claimError && claimEmpty && (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Nothing to claim</h1>
              <p className="text-sm text-gray-600 text-center max-w-sm mb-4">
                This trial session has expired or never contained any items.
              </p>
              <button
                type="button"
                className="rounded-none border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => router.replace('/items')}
              >
                Go to items
              </button>
            </>
          )}

          {!claiming && !claimError && !claimEmpty && (
            <div className="w-full max-w-sm flex flex-col items-center text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Save your items</h1>
              <p className="text-sm text-gray-600 mb-1">Save these items to this account?</p>
              <p className="text-sm font-medium text-gray-900 mb-5 break-all">{account}</p>
              <button
                type="button"
                className="w-full rounded-none border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 mb-3"
                onClick={runClaim}
              >
                Save to this account
              </button>
              <button
                type="button"
                className="w-full rounded-none border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={handleSwitchAccount}
              >
                Use a different account
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>{getPageTitle('Claim')}</title></Head>
      {/* Only one Headless UI Dialog may be open at a time: two open at the same
          z-index make the underlying one fire onClose (which here navigates to
          '/'). Closing the auth dialog when the wallet picker opens avoids that
          and lets the wallet picker show. Mirrors SignIn.tsx's handleSelectEthereum. */}
      <AuthMethodDialog
        isOpen={!showWalletDialog}
        onClose={() => router.push('/')}
        onSelectEthereum={handleSelectEthereum}
        onSubmitEmail={sendCode}
        onSubmitCode={verifyAndSignIn}
        emailSending={emailSending}
        emailError={emailError}
        codeVerifying={codeVerifying}
        codeError={codeError}
        variant="claim"
      />
      <WalletSelectionDialog
        isOpen={showWalletDialog}
        onClose={() => setShowWalletDialog(false)}
        onSelectWallet={handleWalletSelect}
      />
    </>
  );
}
