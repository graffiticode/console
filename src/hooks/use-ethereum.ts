import { stripHexPrefix } from "@ethereumjs/util";
import { useCallback } from "react";
import { useAccount, useConnect, useSignMessage, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";
import { client } from "../lib/auth";

export function useSignInWithEthereum() {
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();

  const getAddress = useCallback(async () => {
    if (isConnected) {
      return address;
    } else {
      const result = await connectAsync({
        connector: injected(),
        chainId: chainId
      });
      return result.accounts[0];
    }
  }, [isConnected, address, connectAsync, chainId]);

  const signInWithEthereum = useCallback(async () => {
    const accountAddress = await getAddress();
    const address = stripHexPrefix(accountAddress);
    const nonce = await client.ethereum.getNonce({ address: stripHexPrefix(address) });
    const signature = stripHexPrefix(await signMessageAsync({
      account: accountAddress as `0x${string}`,
      message: `Nonce: ${nonce}`
    }));
    const authContext = await client.ethereum.authenticate({ address, nonce, signature });
    return { ...authContext, uid: address };
  }, [getAddress, signMessageAsync]);

  return { signInWithEthereum };
}
