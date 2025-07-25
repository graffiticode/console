import { createContext, useCallback, useContext } from "react";
import useSWR from "swr";
import { useSignInWithEthereum } from "./use-ethereum";
import { useAuth, useUser } from "reactfire";
import { signInWithCustomToken, signOut } from "firebase/auth";

const ArtcompilerAuthContext = createContext({ loading: true });

export function ArtcompilerAuthProvider({ children }) {
  const auth = useAuth();
  const { status: firebaseUserStatus, data: firebaseUser } = useUser();
  const { signInWithEthereum: siwe } = useSignInWithEthereum();

  const signInWithEthereum = useCallback(async () => {
    if (firebaseUser) {
      console.warn(`User ${firebaseUser.uid} is already signed in`);
      return auth;
    }
    const { firebaseCustomToken } = await siwe();
    await signInWithCustomToken(auth, firebaseCustomToken);

  }, [firebaseUser, siwe]);

  let user = null;
  if (firebaseUser) {
    user = {
      uid: firebaseUser.uid,
      getToken: () => firebaseUser.getIdToken(),
    };
  }

  const value = {
    loading: firebaseUserStatus === "loading",
    user,
    signInWithEthereum,
    signOut: () => signOut(auth),
  };

  return (
    <ArtcompilerAuthContext.Provider value={value}>
      {firebaseUserStatus !== "loading" && children}
    </ArtcompilerAuthContext.Provider>
  );
}

export default function useArtcompilerAuth() {
  return useContext(ArtcompilerAuthContext);
}

export function useToken() {
  const { user } = useArtcompilerAuth();
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
