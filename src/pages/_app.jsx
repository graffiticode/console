import { useRouter } from "next/router";
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { ArtcompilerAuthProvider } from "../hooks/use-artcompiler-auth";
import "../styles/globals.css";
import "../styles/prosemirror.css";
import ArtcompilerFirebaseProvider from '../components/ArtcompilerFirebaseProvider';
import Layout from '../components/layout';
import { useState, useEffect } from "react";
import useLocalStorage from '../hooks/use-local-storage';
import { marks } from "../components/mark-selector";
import AuthWrapper from '../components/AuthWrapper';
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
  const [language, setLanguage] = useLocalStorage("artcompiler:language", {id: 1, name: "L0001"});
  const [mark, setMark] = useLocalStorage("artcompiler:items:mark", marks[0]);
  const router = useRouter();
  const pathName = router.pathname.slice(1);
  return (
    pathName === "form" &&
    <div id="gc-root">
      <ArtcompilerFirebaseProvider>
        <WagmiConfig client={client}>
          <ArtcompilerAuthProvider>
            <Component {...pageProps} />
          </ArtcompilerAuthProvider>
        </WagmiConfig>
      </ArtcompilerFirebaseProvider>
    </div> ||
    <div id="gc-root">
      <ArtcompilerFirebaseProvider>
        <WagmiConfig client={client}>
          <ArtcompilerAuthProvider>
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
          </ArtcompilerAuthProvider>
        </WagmiConfig>
      </ArtcompilerFirebaseProvider>
    </div>
  );
}
