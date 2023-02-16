import { stripHexPrefix } from "@ethereumjs/util";
import { useCallback } from "react";
import useSWR from "swr";
import { useAccount, useConnect, useNetwork, useSignMessage } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import useLocalStorage from "./use-local-storage";
import { authenticateWithEthereum, exchangeRefreshToken, getEthereumNonce, verifyAccessToken } from "../lib/auth";

const AUTH_KEY = "graffiticode-auth";

export function useSignInWithEthereum() {
  const { signMessageAsync } = useSignMessage();
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect({
    connector: new InjectedConnector(),
  });

  const getAddress = useCallback(async () => {
    if (isConnected) {
      return address;
    } else {
      const { account } = await connectAsync({ chainId: chain?.id });
      return account;
    }
  }, [isConnected, address, connectAsync, chain]);

  const signInWithEthereum = useCallback(async () => {
    const address = stripHexPrefix(await getAddress());
    const nonce = await getEthereumNonce({ address: stripHexPrefix(address) });
    const signature = stripHexPrefix(await signMessageAsync({ message: `Nonce: ${nonce}` }));
    const { refreshToken, accessToken } = await authenticateWithEthereum({ address, nonce, signature });
    return { uid: address, refreshToken, accessToken };
  }, [getAddress, signMessageAsync]);

  return { signInWithEthereum };
}

const tokensFetcher = async ({ auth }) => {
  console.log("Fetching tokens");
  let { refreshToken, accessToken } = auth;
  try {
    await verifyAccessToken({ accessToken });
  } catch (err) {
    if (err.code !== "ERR_JWT_EXPIRED") {
      throw err;
    }
    accessToken = await exchangeRefreshToken({ refreshToken });
  }
  return { refreshToken, accessToken };
};

export function useAuth() {
  const [auth, setAuth] = useLocalStorage(AUTH_KEY, null);

  useSWR({ auth }, tokensFetcher);

  const { signInWithEthereum: siwe } = useSignInWithEthereum();
  const signInWithEthereum = useCallback(async () => {
    if (auth) {
      console.warn("Already signed in");
      return;
    }
    const { uid, refreshToken, accessToken } = await siwe();
    setAuth({ uid, refreshToken, accessToken });
    return { uid, refreshToken, accessToken };
  }, [auth, siwe]);


  return {
    loading: true,
    signInWithEthereum,
  };
}
