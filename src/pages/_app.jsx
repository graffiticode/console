import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { useStore } from "../utils/redux/store";
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
  const store = useStore(pageProps.initialReduxState);
  return (
    <WagmiConfig client={client}>
      <ReduxProvider store={store}>
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </ReduxProvider>
    </WagmiConfig>
  );
}
