import { stripHexPrefix } from "@ethereumjs/util";
import { useSession, signIn, signOut, } from "next-auth/react";
import { useCallback, } from "react";
import { useAccount, useConnect, useDisconnect, useNetwork, useSignMessage } from "wagmi";
import { InjectedConnector } from 'wagmi/connectors/injected'
import { getUserNonce } from "../lib/auth";

export default function SignInComponent({ label = "Sign in" }) {
  const { data: sessionData } = useSession();
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
      const nonce = await getUserNonce({ address: stripHexPrefix(address) });
      const signature = await signMessageAsync({ message: `Nonce: ${nonce}` });
      await signIn("credentials", {
        address,
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

  if (sessionData) {
    return <button onClick={handleSignOut}>{sessionData.user.name} (Sign out)</button>;
  } else {
    return <button onClick={handleSignIn}>{label}</button>;
  }
}
