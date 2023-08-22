import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { GraffiticodeAuthProvider } from "../hooks/use-graffiticode-auth";
import "../styles/globals.css";
import GraffiticodeFirebaseProvider from '../components/GraffiticodeFirebaseProvider';

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
  console.log("App()");
  return (
    <GraffiticodeFirebaseProvider>
      <WagmiConfig client={client}>
        <GraffiticodeAuthProvider>
          <Component {...pageProps} />
        </GraffiticodeAuthProvider>
      </WagmiConfig>
    </GraffiticodeFirebaseProvider>
  );
}
