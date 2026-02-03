import Head from 'next/head';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { getPageTitle } from '../lib/utils';
import SignIn from '../components/SignIn';
import UsageMonitor from '../components/payments/UsageMonitor';

export default function Usage() {
  const { user, loading } = useGraffiticodeAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <SignIn label="Sign in to continue" />
        <p className="mt-4 text-sm text-gray-600 text-center max-w-sm">
          New here? Create a free account by signing in with an Ethereum wallet. No blockchain fees required.
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{getPageTitle('Usage')}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Usage</h1>
            <p className="mt-2 text-sm text-gray-600">
              Monitor your compile and code generation usage.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <UsageMonitor userId={user.uid} />
          </div>
        </div>
      </div>
    </>
  );
}
