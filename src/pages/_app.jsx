import { useRouter } from "next/router";
import { WagmiProvider, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { http } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GraffiticodeAuthProvider } from "../hooks/use-graffiticode-auth";
import "../styles/globals.css";
import "../styles/prosemirror.css";
import GraffiticodeFirebaseProvider from '../components/GraffiticodeFirebaseProvider';
import Layout from '../components/layout';
import { useState, useEffect } from "react";
import useLocalStorage from '../hooks/use-local-storage';
import { marks } from "../components/mark-selector";
import AuthWrapper from '../components/AuthWrapper';

const queryClient = new QueryClient()

const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
  },
})

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [language, setLanguage] = useLocalStorage("graffiticode:language", {id: 1, name: "L0001"});
  const [mark, setMark] = useLocalStorage("graffiticode:items:mark", marks[0]);
  const router = useRouter();
  const pathName = router.pathname.slice(1);
  return (
    pathName === "form" &&
    <div id="gc-root">
      <GraffiticodeFirebaseProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <GraffiticodeAuthProvider>
              <Component {...pageProps} />
            </GraffiticodeAuthProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </GraffiticodeFirebaseProvider>
    </div> ||
    <div id="gc-root">
      <GraffiticodeFirebaseProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <GraffiticodeAuthProvider>
              <AuthWrapper>
                <Layout
                  pathName={pathName}
                  language={language}
                setLanguage={setLanguage}
                mark={mark}
                setMark={setMark}
              >
                <Component {...{...pageProps, language, setLanguage, mark}} />
              </Layout>
            </AuthWrapper>
          </GraffiticodeAuthProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </GraffiticodeFirebaseProvider>
    </div>
  );
}
