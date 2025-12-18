import { useRouter } from "next/router";
import { WagmiProvider, createConfig } from 'wagmi'
import { mainnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { http } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GraffiticodeAuthProvider } from "../hooks/use-graffiticode-auth";
import "../styles/globals.css";
import "../styles/prosemirror.css";
import GraffiticodeFirebaseProvider from '../components/GraffiticodeFirebaseProvider';
import Layout from '../components/layout';
import { useState, useEffect, useRef } from "react";
import useLocalStorage from '../hooks/use-local-storage';
import { marks } from "../components/mark-selector";
import AuthWrapper from '../components/AuthWrapper';
import { selectLanguages } from '../components/language-selector';
import { getTitle } from '../lib/utils';

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
  const router = useRouter();
  const pathName = router.pathname.slice(1);
  const languageInitialized = useRef(false);

  // Get domain from query params or sessionStorage
  const queryDomain = router.query.domain;
  const queryDomainStr = Array.isArray(queryDomain) ? queryDomain[0] : queryDomain;
  const storedDomain = typeof window !== 'undefined' ? sessionStorage.getItem('graffiticode:domain') : null;
  const domain = queryDomainStr || storedDomain || getTitle();
  const domainLanguages = selectLanguages(domain);
  const defaultLanguage = domainLanguages.length > 0 ? domainLanguages[0] : {id: 2, name: "L0002"};

  const [language, setLanguage] = useLocalStorage("graffiticode:language", defaultLanguage);
  const [mark, setMark] = useLocalStorage("graffiticode:items:mark", marks[0]);

  // Set language to first in domain list on initial load or when domain changes
  useEffect(() => {
    if (!router.isReady) return;
    if (languageInitialized.current) return;

    if (domainLanguages.length > 0) {
      // Check if current language is in the domain's list
      const currentInDomain = domainLanguages.some(l => l.name === language.name);
      if (!currentInDomain) {
        setLanguage(domainLanguages[0]);
      }
    }
    languageInitialized.current = true;
  }, [router.isReady, domainLanguages, language.name, setLanguage]);

  return (
    (pathName === "form" || pathName === "editor") &&
    <div id="gc-root">
      <GraffiticodeFirebaseProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <GraffiticodeAuthProvider>
              <Component {...{...pageProps, language, setLanguage, mark, setMark}} />
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
              <Layout
                language={language}
                setLanguage={setLanguage}
                mark={mark}
                setMark={setMark}
              >
                <AuthWrapper>
                  <Component {...{...pageProps, language, setLanguage, mark}} />
                </AuthWrapper>
              </Layout>
            </GraffiticodeAuthProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </GraffiticodeFirebaseProvider>
    </div>
  );
}
