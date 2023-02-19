import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { GraffiticodeAuthProvider } from "../hooks/use-graffiticode-auth";
import "../styles/globals.css";

const { provider, webSocketProvider } = configureChains(
  [mainnet],
  [publicProvider()],
)

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
})

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <WagmiConfig client={client}>
      <GraffiticodeAuthProvider>
        <Component {...pageProps} />
      </GraffiticodeAuthProvider>
    </WagmiConfig>
  );
}
