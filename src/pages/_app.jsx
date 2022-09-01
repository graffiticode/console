import { SessionProvider } from "next-auth/react"
import { Provider as ReduxProvider } from 'react-redux'
import { useStore } from '../utils/redux/store'
import '../styles/globals.css';
import './style.css';
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const store = useStore(pageProps.initialReduxState);
  return (
    <ReduxProvider store={store}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </ReduxProvider>
  )
}
