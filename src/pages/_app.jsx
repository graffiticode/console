import { useRouter } from "next/router";
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { GraffiticodeAuthProvider } from "../hooks/use-graffiticode-auth";
import "../styles/globals.css";
import "../styles/prosemirror.css";
import GraffiticodeFirebaseProvider from '../components/GraffiticodeFirebaseProvider';
import Layout from '../components/layout';

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
  const router = useRouter();
  const pathName = router.pathname.slice(1);
  console.log("App() pathName=" + pathName);
  return (
    <GraffiticodeFirebaseProvider>
      <WagmiConfig client={client}>
        <GraffiticodeAuthProvider>
          <Layout pathName={pathName}>
            <Component {...pageProps} />
          </Layout>
        </GraffiticodeAuthProvider>
      </WagmiConfig>
    </GraffiticodeFirebaseProvider>
  );
}
