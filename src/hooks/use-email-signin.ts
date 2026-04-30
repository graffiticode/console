import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useLoginWithEmail,
  useWallets,
  usePrivy,
  useCreateWallet,
  getEmbeddedConnectedWallet,
} from '@privy-io/react-auth';
import { useAuth } from 'reactfire';
import { signInWithCustomToken } from 'firebase/auth';
import { stripHexPrefix } from '@ethereumjs/util';
import { client } from '../lib/auth';

const EMBEDDED_WALLET_AUTO_CREATE_WAIT_MS = 5_000;
const EMBEDDED_WALLET_AFTER_CREATE_WAIT_MS = 15_000;
const EMBEDDED_WALLET_POLL_MS = 150;

export function useEmailSignIn() {
  const auth = useAuth();
  const { logout } = usePrivy();
  const { sendCode: privySendCode, loginWithCode: privyLoginWithCode } = useLoginWithEmail();
  const { createWallet } = useCreateWallet();
  const { wallets } = useWallets();

  // Keep a ref to the latest wallets so the polling loop sees fresh values.
  const walletsRef = useRef(wallets);
  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const sendCode = useCallback(async (email: string) => {
    setSending(true);
    setEmailError(null);
    try {
      await privySendCode({ email });
      setPendingEmail(email);
    } catch (err: any) {
      const msg = err?.message || 'Failed to send code';
      setEmailError(msg);
      throw err;
    } finally {
      setSending(false);
    }
  }, [privySendCode]);

  const pollForEmbeddedWallet = useCallback(async (timeoutMs: number) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const wallet = getEmbeddedConnectedWallet(walletsRef.current);
      if (wallet) return wallet;
      await new Promise((r) => setTimeout(r, EMBEDDED_WALLET_POLL_MS));
    }
    return null;
  }, []);

  const ensureEmbeddedWallet = useCallback(async () => {
    // Privy is configured to auto-create an embedded wallet on first login. Give
    // that path a brief window before falling back to an explicit create call,
    // which is needed when the user already has a Privy account but no wallet.
    let wallet = await pollForEmbeddedWallet(EMBEDDED_WALLET_AUTO_CREATE_WAIT_MS);
    if (wallet) return wallet;
    try {
      await createWallet();
    } catch (err: any) {
      // If a wallet already exists for this user, createWallet rejects — fall
      // through to polling, which will pick up the existing wallet once Privy's
      // wallet state surfaces it.
      if (!/already.*wallet/i.test(err?.message || '')) {
        console.warn('createWallet error (continuing to poll):', err);
      }
    }
    wallet = await pollForEmbeddedWallet(EMBEDDED_WALLET_AFTER_CREATE_WAIT_MS);
    return wallet;
  }, [pollForEmbeddedWallet, createWallet]);

  const persistSignInEmail = useCallback(async (uid: string, idToken: string, email: string) => {
    try {
      const getResp = await fetch(`/api/user/${uid}`, {
        headers: { Authorization: idToken },
      });
      let alreadySet = false;
      if (getResp.ok) {
        const userData = await getResp.json();
        alreadySet = !!userData?.signInEmail;
      }
      if (alreadySet) return;
      await fetch(`/api/user/${uid}`, {
        method: 'PUT',
        headers: {
          Authorization: idToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signInEmail: email,
          signInEmailVerifiedAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Non-fatal — user is still signed in. Surface in console for debugging.
      console.error('Failed to persist signInEmail:', err);
    }
  }, []);

  const verifyAndSignIn = useCallback(async (code: string) => {
    setVerifying(true);
    setCodeError(null);
    try {
      await privyLoginWithCode({ code });

      const wallet = await ensureEmbeddedWallet();
      if (!wallet) {
        throw new Error('Wallet did not initialize. Please try again.');
      }

      const accountAddress = wallet.address;
      const address = stripHexPrefix(accountAddress);
      const nonce = await client.ethereum.getNonce({ address });
      const sigRaw = await wallet.sign(`Nonce: ${nonce}`);
      const signature = stripHexPrefix(sigRaw);
      const { firebaseCustomToken } = await client.ethereum.authenticate({
        address,
        nonce,
        signature,
      });
      const credential = await signInWithCustomToken(auth, firebaseCustomToken);
      const uid = credential.user.uid;
      const idToken = await credential.user.getIdToken();

      if (pendingEmail) {
        await persistSignInEmail(uid, idToken, pendingEmail);
      }

      // Privy session is no longer needed once Firebase auth has taken over.
      try {
        await logout();
      } catch {
        // ignore
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to verify code';
      setCodeError(msg);
      throw err;
    } finally {
      setVerifying(false);
    }
  }, [privyLoginWithCode, ensureEmbeddedWallet, auth, pendingEmail, persistSignInEmail, logout]);

  const reset = useCallback(() => {
    setPendingEmail(null);
    setEmailError(null);
    setCodeError(null);
    setSending(false);
    setVerifying(false);
  }, []);

  return {
    sendCode,
    verifyAndSignIn,
    reset,
    pendingEmail,
    sending,
    verifying,
    emailError,
    codeError,
  };
}
