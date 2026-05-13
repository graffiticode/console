import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useLoginWithEmail,
  useWallets,
  usePrivy,
  useCreateWallet,
  getEmbeddedConnectedWallet,
  type ConnectedWallet,
  type User as PrivyUser,
} from '@privy-io/react-auth';
import { useAuth } from 'reactfire';
import { signInWithCustomToken } from 'firebase/auth';
import { stripHexPrefix } from '@ethereumjs/util';
import { client } from '../lib/auth';

const LOGIN_COMPLETE_TIMEOUT_MS = 30_000;
const CONNECTED_WALLET_TIMEOUT_MS = 20_000;
const POLL_MS = 150;

type LoginCompleteWaiter = {
  resolve: (user: PrivyUser) => void;
  reject: (err: Error) => void;
};

export function useEmailSignIn() {
  const auth = useAuth();
  const { logout, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { wallets } = useWallets();

  // The Privy `onComplete` callback fires AFTER the user is authenticated and
  // their embedded wallet has been created (when `embeddedWallets.createOnLogin`
  // is enabled). Awaiting it is more reliable than polling `useWallets()`.
  const loginCompleteWaiterRef = useRef<LoginCompleteWaiter | null>(null);
  const { sendCode: privySendCode, loginWithCode: privyLoginWithCode } = useLoginWithEmail({
    onComplete: (privyUser) => {
      loginCompleteWaiterRef.current?.resolve(privyUser);
      loginCompleteWaiterRef.current = null;
    },
    onError: (err) => {
      const msg = typeof err === 'string' ? err : 'Privy login failed';
      loginCompleteWaiterRef.current?.reject(new Error(msg));
      loginCompleteWaiterRef.current = null;
    },
  });

  // Keep refs to the latest wallets/user so the polling loop sees fresh values.
  const walletsRef = useRef(wallets);
  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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

  const armLoginCompleteWaiter = useCallback((): Promise<PrivyUser> => {
    return new Promise((resolve, reject) => {
      loginCompleteWaiterRef.current = { resolve, reject };
      setTimeout(() => {
        if (loginCompleteWaiterRef.current) {
          loginCompleteWaiterRef.current = null;
          reject(new Error('Timed out waiting for Privy login to complete.'));
        }
      }, LOGIN_COMPLETE_TIMEOUT_MS);
    });
  }, []);

  const waitForConnectedWallet = useCallback(async (address: string): Promise<ConnectedWallet | null> => {
    const target = address.toLowerCase();
    const start = Date.now();
    while (Date.now() - start < CONNECTED_WALLET_TIMEOUT_MS) {
      const list = walletsRef.current;
      const match = list.find(
        (w) => w.walletClientType === 'privy' && w.address.toLowerCase() === target,
      );
      if (match) return match;
      const fallback = getEmbeddedConnectedWallet(list);
      if (fallback) return fallback;
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    return null;
  }, []);

  const ensureEmbeddedWallet = useCallback(async (privyUser: PrivyUser): Promise<ConnectedWallet> => {
    let address = privyUser.wallet?.address ?? userRef.current?.wallet?.address;
    if (!address) {
      try {
        const created = await createWallet();
        address = created.address;
      } catch (err: any) {
        if (!/already.*wallet/i.test(err?.message || '')) {
          throw new Error(err?.message || 'Failed to create embedded wallet');
        }
        address = userRef.current?.wallet?.address;
      }
    }
    if (!address) {
      throw new Error('Embedded wallet address unavailable after login.');
    }
    const connected = await waitForConnectedWallet(address);
    if (!connected) {
      throw new Error('Embedded wallet did not connect. Please try again.');
    }
    return connected;
  }, [createWallet, waitForConnectedWallet]);

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
      // Register the onComplete waiter BEFORE login so we don't miss the callback.
      const loginCompletePromise = armLoginCompleteWaiter();
      await privyLoginWithCode({ code });
      const privyUser = await loginCompletePromise;

      const wallet = await ensureEmbeddedWallet(privyUser);

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
  }, [armLoginCompleteWaiter, privyLoginWithCode, ensureEmbeddedWallet, auth, pendingEmail, persistSignInEmail, logout]);

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
