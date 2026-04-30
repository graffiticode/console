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
import { apps, findAppById } from "../components/app-selector";
import AuthWrapper from '../components/AuthWrapper';
import { selectLanguages, findLanguageByNumber } from '../components/language-selector';
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
  const rawDomain = queryDomainStr || storedDomain || getTitle();
  const domain = rawDomain.toLowerCase() === 'graffiticode' ? undefined : rawDomain;
  const domainLanguages = selectLanguages(domain);
  const defaultLanguage = domainLanguages.length > 0 ? domainLanguages[0] : {id: 2, name: "L0002"};

  const [language, setLanguage] = useLocalStorage("graffiticode:language", defaultLanguage);
  const [mark, setMark] = useLocalStorage("graffiticode:items:mark", marks[0]);
  const [app, setApp] = useLocalStorage("graffiticode:items:app", apps[0]);

  // Set language/mark from query params or domain defaults on initial load
  useEffect(() => {
    if (!router.isReady) return;
    if (languageInitialized.current) return;

    // Apply ?lang= query param (e.g. ?lang=0166)
    const queryLang = router.query.lang;
    const langStr = Array.isArray(queryLang) ? queryLang[0] : queryLang;
    if (langStr) {
      const found = findLanguageByNumber(langStr);
      if (found) {
        setLanguage(found);
      }
    } else if (domainLanguages.length > 0) {
      const currentInDomain = domainLanguages.some(l => l.name === language.name);
      if (!currentInDomain) {
        setLanguage(domainLanguages[0]);
      }
    }

    // Apply ?mark= query param (e.g. ?mark=1)
    const queryMark = router.query.mark;
    const markStr = Array.isArray(queryMark) ? queryMark[0] : queryMark;
    if (markStr) {
      const markId = parseInt(markStr, 10);
      const found = marks.find(m => m.id === markId);
      if (found) {
        setMark(found);
      }
    }

    // Apply ?app= query param (e.g. ?app=mcp)
    const queryApp = router.query.app;
    const appStr = Array.isArray(queryApp) ? queryApp[0] : queryApp;
    if (appStr) {
      const found = findAppById(appStr);
      if (found) {
        setApp(found);
      }
    }

    languageInitialized.current = true;
  }, [router.isReady, domainLanguages, language.name, setLanguage, setMark, setApp]);

  return (
    (pathName === "form" || pathName === "editor") &&
    <div id="gc-root">
      <GraffiticodeFirebaseProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <GraffiticodeAuthProvider>
              <Component {...{...pageProps, language, setLanguage, mark, setMark, app, setApp}} />
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
                app={app}
                setApp={setApp}
              >
                <AuthWrapper>
                  <Component {...{...pageProps, language, setLanguage, mark, app, setApp}} />
                </AuthWrapper>
              </Layout>
            </GraffiticodeAuthProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </GraffiticodeFirebaseProvider>
    </div>
  );
}
