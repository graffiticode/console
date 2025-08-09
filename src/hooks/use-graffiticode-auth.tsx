import { createContext, useCallback, useContext } from "react";
import useSWR from "swr";
import { useSignInWithEthereum } from "./use-ethereum";
import { useAuth, useUser } from "reactfire";
import { signInWithCustomToken, signOut } from "firebase/auth";

const GraffiticodeAuthContext = createContext({
  loading: true,
  user: null as any,
  signInWithEthereum: async (): Promise<any> => {},
  signOut: () => {}
});

export function GraffiticodeAuthProvider({ children }) {
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
