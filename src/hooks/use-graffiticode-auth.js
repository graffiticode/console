import { createContext, useCallback, useContext } from "react";
import useSWR from "swr";
import { client } from "../lib/auth";
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
      const { uid, refresh_token } = auth;
      const access_token = await client.exchangeRefreshToken(refresh_token);
      return { uid, refresh_token, access_token };
    }, {
    shouldRetryOnError: false,
    onError: (err) => {
      console.warn("Failed to init auth", err);
      setAuth(null)
    },
    onSuccess: (auth) => setAuth(auth),
  });

  const signInWithEthereum = useCallback(async () => {
    if (auth) {
      console.warn(`User ${auth.uid} is already signed in`);
      return auth;
    }
    const { uid, refresh_token, access_token } = await siwe();
    setAuth({ uid, refresh_token, access_token });

  }, [auth, siwe]);

  const signOut = useCallback(async () => {
    if (auth) {
      client.revokeRefreshToken(auth.refresh_token);
      setAuth(null);
    }
  }, [auth]);

  const getToken = useCallback(async () => {
    if (!auth) {
      throw new Error("auth/not-signed-in");
    }
    let { refresh_token, access_token } = auth;
    try {
      await client.verifyAccessToken(access_token);
    } catch (err) {
      if (err.code !== "ERR_JWT_EXPIRED") {
        throw err;
      }
      access_token = await client.exchangeRefreshToken(refresh_token);
      setAuth(prev => ({ ...prev, access_token }));
    }
    return access_token;
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
