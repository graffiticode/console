import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { useEmailSignIn } from '../hooks/use-email-signin';
import AuthMethodDialog from '../components/AuthMethodDialog';
import WalletSelectionDialog from '../components/WalletSelectionDialog';
import { getPageTitle } from '../lib/utils';

interface Wallet {
  name: string;
  provider: any;
}

export default function Claim() {
  const router = useRouter();
  const { user, loading, signInWithEthereum } = useGraffiticodeAuth();
  const {
    sendCode,
    verifyAndSignIn,
    sending: emailSending,
    verifying: codeVerifying,
    emailError,
    codeError,
  } = useEmailSignIn();

  const tokenParam = router.query.token;
  const token = typeof tokenParam === 'string' ? tokenParam : null;

  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const claimedOnce = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (!user || !token) return;
    if (claimedOnce.current) return;
    claimedOnce.current = true;
    setClaiming(true);
    setClaimError(null);
    (async () => {
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
              claimFreePlanSession(token: $token) { transferred sessionNamespace }
            }`,
            variables: { token },
          }),
        });
        const json = await resp.json();
        if (json.errors?.length) {
          throw new Error(json.errors[0].message);
        }
        router.replace('/items');
      } catch (err: any) {
        setClaimError(err?.message || 'Failed to claim items');
        claimedOnce.current = false;
      } finally {
        setClaiming(false);
      }
    })();
  }, [router, user, token]);

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

  if (!router.isReady || loading) {
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
                onClick={() => {
                  claimedOnce.current = false;
                  setClaimError(null);
                  router.replace(router.asPath);
                }}
              >
                Try again
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>{getPageTitle('Claim')}</title></Head>
      <AuthMethodDialog
        isOpen={true}
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
