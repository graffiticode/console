import { stripHexPrefix } from "@ethereumjs/util";
import { useCallback } from "react";
import { useAccount, useConnect, useSignMessage, useChainId, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { client } from "../lib/auth";

export function useSignInWithEthereum() {
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();

  const getAddress = useCallback(async (selectedWallet?: any) => {
    // Always disconnect first to allow wallet selection
    if (isConnected) {
      disconnect();
    }

    // If a specific wallet was selected, set it as the active provider
    if (selectedWallet?.provider) {
      (window as any).ethereum = selectedWallet.provider;
    }

    const eth = (window as any).ethereum;
    if (eth) {
      try {
        // Request permissions to trigger account selection
        await eth.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        console.log("Permission request failed, continuing with normal flow");
      }
    }

    const result = await connectAsync({
      connector: injected(),
      chainId: chainId
    });
    return result.accounts[0];
  }, [isConnected, connectAsync, chainId, disconnect]);

  const signInWithEthereum = useCallback(async (selectedWallet?: any) => {
    const accountAddress = await getAddress(selectedWallet);
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
