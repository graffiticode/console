import { createContext, useCallback, useContext } from "react";
import useSWR from "swr";
import { useSignInWithEthereum } from "./use-ethereum";
import { useAuth, useUser } from "reactfire";
import { signInWithCustomToken, signOut } from "firebase/auth";

type PendingEthereumSignup = {
  needsSignupConfirm: true;
  address: string;
  accountAddress: string;
};

const GraffiticodeAuthContext = createContext({
  loading: true,
  user: null as any,
  signInWithEthereum: async (selectedWallet?: any): Promise<any> => {},
  // Connects a wallet and signs in iff the address already has an account.
  // For unknown addresses, returns { needsSignupConfirm, address } so the
  // caller can prompt before creating a new account.
  beginEthereumSignIn: async (
    _selectedWallet?: any,
  ): Promise<PendingEthereumSignup | undefined> => undefined,
  // Completes sign-in after the user has confirmed they want to create a new
  // account for the address returned by beginEthereumSignIn.
  confirmEthereumSignIn: async (_pending: PendingEthereumSignup): Promise<void> => {},
  signOut: () => {}
});

export function GraffiticodeAuthProvider({ children }) {
  const auth = useAuth();
  const { status: firebaseUserStatus, data: firebaseUser } = useUser();
  const {
    signInWithEthereum: siwe,
    connectAndCheck,
    signInForAddress,
  } = useSignInWithEthereum();

  const signInWithEthereum = useCallback(async (selectedWallet?: any) => {
    if (firebaseUser) {
      console.warn(`User ${firebaseUser.uid} is already signed in`);
      return auth;
    }
    const { firebaseCustomToken } = await siwe(selectedWallet);
    await signInWithCustomToken(auth, firebaseCustomToken);

  }, [firebaseUser, siwe]);

  const beginEthereumSignIn = useCallback(async (selectedWallet?: any): Promise<PendingEthereumSignup | undefined> => {
    if (firebaseUser) {
      console.warn(`User ${firebaseUser.uid} is already signed in`);
      return undefined;
    }
    const { accountAddress, address, exists } = await connectAndCheck(selectedWallet);
    if (exists) {
      const { firebaseCustomToken } = await signInForAddress(address, accountAddress);
      await signInWithCustomToken(auth, firebaseCustomToken);
      return undefined;
    }
    return { needsSignupConfirm: true, address, accountAddress };
  }, [firebaseUser, auth, connectAndCheck, signInForAddress]);

  const confirmEthereumSignIn = useCallback(async (pending: PendingEthereumSignup) => {
    const { firebaseCustomToken } = await signInForAddress(pending.address, pending.accountAddress);
    await signInWithCustomToken(auth, firebaseCustomToken);
  }, [auth, signInForAddress]);

  let user = null;
  if (firebaseUser) {
    user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      getToken: () => firebaseUser.getIdToken(),
    };
  }

  const handleSignOut = useCallback(async () => {
    // Clear localStorage to avoid cross-user contamination
    if (typeof window !== 'undefined') {
      localStorage.removeItem('graffiticode:selected:itemId');
      localStorage.removeItem('graffiticode:selected:taskId');
      localStorage.removeItem('graffiticode:language');
    }
    await signOut(auth);
    // Navigate to home to avoid stale Firestore listeners
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [auth]);

  const value = {
    loading: firebaseUserStatus === "loading",
    user,
    signInWithEthereum,
    beginEthereumSignIn,
    confirmEthereumSignIn,
    signOut: handleSignOut,
  };

  return (
    <GraffiticodeAuthContext.Provider value={value}>
      {firebaseUserStatus !== "loading" && children}
    </GraffiticodeAuthContext.Provider>
  );
}

export default function useGraffiticodeAuth() {
  return useContext(GraffiticodeAuthContext);
}

export function useToken() {
  const { user } = useGraffiticodeAuth();
  return useSWR(
    { user },
    async ({ user }) => {
      const token = await user.getToken();
      return token;
    },
    {
      refreshInterval: 3 * 60 * 1000,
    }
  );
}
