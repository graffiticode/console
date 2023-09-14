import { useRouter } from "next/router";
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { GraffiticodeAuthProvider } from "../hooks/use-graffiticode-auth";
import "../styles/globals.css";
import "../styles/prosemirror.css";
import GraffiticodeFirebaseProvider from '../components/GraffiticodeFirebaseProvider';
import Layout from '../components/layout';
import { useState, useEffect } from "react";
import useLocalStorage from '../hooks/use-local-storage';
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
  const [language, setLanguage] = useLocalStorage("graffiticode:language", {id: 1, name: "L1"});
  const router = useRouter();
  const pathName = router.pathname.slice(1);
  return (
    pathName === "form" &&
    <div id="gc-root">
      <GraffiticodeFirebaseProvider>
        <WagmiConfig client={client}>
          <GraffiticodeAuthProvider>
            <Component {...pageProps} />
          </GraffiticodeAuthProvider>
        </WagmiConfig>
      </GraffiticodeFirebaseProvider>
    </div> ||
    <div id="gc-root">
      <GraffiticodeFirebaseProvider>
        <WagmiConfig client={client}>
          <GraffiticodeAuthProvider>
            <Layout pathName={pathName} language={language} setLanguage={setLanguage}>
              <Component {...{...pageProps, language, setLanguage}} />
            </Layout>
          </GraffiticodeAuthProvider>
        </WagmiConfig>
      </GraffiticodeFirebaseProvider>
    </div>
  );
}
