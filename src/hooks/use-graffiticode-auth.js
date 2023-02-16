import { createContext, useCallback, useContext, useMemo } from "react";
import useSWR from "swr";
import { exchangeRefreshToken, verifyAccessToken } from "../lib/auth";
import { useSignInWithEthereum } from "./use-ethereum";
import useLocalStorage from "./use-local-storage";

const GraffiticodeAuthContext = createContext({ loading: true });

export function GraffiticodeAuthProvider({ children }) {
  const { signInWithEthereum: siwe } = useSignInWithEthereum();
  const [auth, setAuth] = useLocalStorage("graffiticode:auth", null);

  const { isLoading: loadingInitial } = useSWR(
    "graffiticode_auth_init",
    async () => {
      if (!auth) {
        return null;
      }
      const { uid, refreshToken } = auth;
      const accessToken = await exchangeRefreshToken({ refreshToken });
      return { uid, refreshToken, accessToken };
    }, {
    shouldRetryOnError: false,
    onError: () => {
      console.warn("Failed to init auth", err);
      setAuth(null)
    },
    onSuccess: (auth) => {
      console.log("Success", auth);
      setAuth(auth);
    },
  });

  const signInWithEthereum = useCallback(async () => {
    if (auth) {
      console.warn(`User ${auth.uid} is already signed in`);
      return auth;
    }
    const { uid, refreshToken, accessToken } = await siwe();
    setAuth({ uid, refreshToken, accessToken });

  }, [auth, siwe]);

  const signOut = useCallback(async () => {
    // TODO revoke refreshToken
    setAuth(null);
  }, [auth]);

  const getToken = useCallback(async () => {
    if (!auth) {
      throw new Error("auth/not-signed-in");
    }
    let { refreshToken, accessToken } = auth;
    try {
      await verifyAccessToken({ accessToken });
    } catch (err) {
      if (err.code !== "ERR_JWT_EXPIRED") {
        throw err;
      }
      accessToken = await exchangeRefreshToken({ refreshToken });
      setAuth(prev => ({ ...prev, accessToken }));
    }
    return accessToken;
  }, [auth]);

  let user = null;
  if (auth) {
    user = { uid: auth.uid, getToken };
  }

  const value = {
    loading: loadingInitial,
    user,
    signInWithEthereum,
    signOut,
  };

  return (
    <GraffiticodeAuthContext.Provider value={value}>
      {!loadingInitial && children}
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
