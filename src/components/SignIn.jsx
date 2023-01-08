"use client";

import { useSession, signIn, signOut, } from "next-auth/react";
import { useCallback, } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useConnect, useDisconnect, useNetwork, useSignMessage } from "wagmi";
import { InjectedConnector } from 'wagmi/connectors/injected'
import { getUserNonce } from "../lib/auth";

export default function SignIn() {
  const { data: session } = useSession();

  const { signMessageAsync } = useSignMessage();
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  const getAddress = useCallback(async () => {
    if (isConnected) {
      return address;
    } else {
      const { account } = await connectAsync({ chainId: chain?.id });
      return account;
    }
  }, [isConnected, address, connectAsync, chain]);

  const handleSignIn = useCallback(async (e) => {
    e.preventDefault();
    try {
      const address = await getAddress();
      const nonce = await getUserNonce({ address });
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to Graffiticode.",
        uri: window.location.origin,
        version: "1",
        chainId: chain?.id,
        nonce,
      });
      const signature = await signMessageAsync({ message: message.prepareMessage() });
      signIn("credentials", {
        message: JSON.stringify(message),
        signature,
        redirect: false,
        callbackUrl: "/protected",
      });
    } catch (error) {
      console.error(error);
    }
  }, [getAddress, signMessageAsync]);

  const handleSignOut = useCallback((e) => {
    e.preventDefault();
    signOut({ redirect: "/" });
    disconnect();
  }, [disconnect]);

  if (session) {
    return <button onClick={handleSignOut}>{session.user.name} (Sign out)</button>;
  } else {
    return <button onClick={handleSignIn}>Sign in</button>;
  }
}
