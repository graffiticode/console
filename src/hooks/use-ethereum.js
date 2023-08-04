import { stripHexPrefix } from "@ethereumjs/util";
import { useCallback } from "react";
import { useAccount, useConnect, useNetwork, useSignMessage } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { client } from "../lib/auth";

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
    const nonce = await client.ethereum.getNonce({ address: stripHexPrefix(address) });
    const signature = stripHexPrefix(await signMessageAsync({ message: `Nonce: ${nonce}` }));
    const authContext = await client.ethereum.authenticate({ address, nonce, signature });
    return { ...authContext, uid: address };
  }, [getAddress, signMessageAsync]);

  return { signInWithEthereum };
}
