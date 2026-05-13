import { stripHexPrefix } from "@ethereumjs/util";
import { useCallback } from "react";
import { useAccount, useConnect, useSignMessage, useChainId, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { client } from "../lib/auth";

async function checkUserExists(address: string): Promise<boolean> {
  const res = await fetch(`/api/user-exists?address=${encodeURIComponent(address)}`);
  if (!res.ok) {
    // Treat lookup failure as "exists" to fail open — avoids blocking real users
    // behind a transient backend hiccup. Net effect: new users may bypass the
    // confirm dialog occasionally, never the reverse.
    console.warn('[user-exists] check failed, assuming user exists', res.status);
    return true;
  }
  const body = await res.json();
  return !!body.exists;
}

export function useSignInWithEthereum() {
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { isConnected } = useAccount();
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

  // Connects the wallet and reports whether the resulting address already has a
  // Graffiticode account. Caller is responsible for prompting the user to
  // confirm new-account creation before calling signInForAddress.
  const connectAndCheck = useCallback(async (selectedWallet?: any) => {
    const accountAddress = await getAddress(selectedWallet);
    const address = stripHexPrefix(accountAddress).toLowerCase();
    const exists = await checkUserExists(address);
    return { accountAddress, address, exists };
  }, [getAddress]);

  // Performs the SIWE handshake against a known address (typically returned
  // from connectAndCheck) and returns the auth context. Splitting this off
  // lets the caller insert a confirm-create-account step in between.
  const signInForAddress = useCallback(
    async (address: string, accountAddress: string) => {
      const nonce = await client.ethereum.getNonce({ address });
      const signature = stripHexPrefix(await signMessageAsync({
        account: accountAddress as `0x${string}`,
        message: `Nonce: ${nonce}`
      }));
      const authContext = await client.ethereum.authenticate({ address, nonce, signature });
      return { ...authContext, uid: address };
    },
    [signMessageAsync],
  );

  const signInWithEthereum = useCallback(async (selectedWallet?: any) => {
    const { accountAddress, address } = await connectAndCheck(selectedWallet);
    return signInForAddress(address, accountAddress);
  }, [connectAndCheck, signInForAddress]);

  return { signInWithEthereum, connectAndCheck, signInForAddress };
}
