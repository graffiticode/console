import { useEffect, useState } from 'react';
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import SignIn from '../components/SignIn';
import APIKeysCard from '../components/APIKeysCard';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { useOAuth, OAuthLink } from '../hooks/use-oauth';
import { getTitle } from '../lib/utils';

function OAuthCard() {
  const { user } = useGraffiticodeAuth();
  const { linkGoogle, getOAuthLinks, unlinkGoogle } = useOAuth();
  const [oauthLinks, setOauthLinks] = useState<OAuthLink[]>([]);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchOAuthLinks();
    }
  }, [user?.uid]);

  const fetchOAuthLinks = async () => {
    if (!user?.uid) return;
    try {
      const links = await getOAuthLinks();
      setOauthLinks(links);
    } catch (err) {
      console.error('Error fetching OAuth links:', err);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      setOauthLoading(true);
      setError(null);
      await linkGoogle();
      await fetchOAuthLinks();
    } catch (err: any) {
      console.error('Error linking Google:', err);
      setError(err.message || 'Failed to link Google account');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      setOauthLoading(true);
      setError(null);
      await unlinkGoogle();
      await fetchOAuthLinks();
    } catch (err: any) {
      console.error('Error unlinking Google:', err);
      setError(err.message || 'Failed to unlink Google account');
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">OAuth</h3>
      <p className="text-sm text-gray-600 mb-4">
        Link your Google account to enable sign-in with Google.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {oauthLinks.length > 0 && (
        <ul className="border border-gray-300 rounded mb-4 divide-y">
          {oauthLinks.map((link) => (
            <li key={link.provider} className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-3">
                {link.provider === 'google' && (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <div>
                  <span className="font-medium capitalize">{link.provider}</span>
                  {link.email && (
                    <span className="text-sm text-gray-500 ml-2">{link.email}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleUnlinkGoogle}
                disabled={oauthLoading}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!oauthLinks.some(link => link.provider === 'google') && (
        <button
          type="button"
          onClick={handleLinkGoogle}
          disabled={oauthLoading}
          className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {oauthLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
              Linking...
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Google
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function Settings() {
  const { user } = useGraffiticodeAuth();

  useEffect(() => {
    document.title = getTitle();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <SignIn label="Sign in to continue" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="relative pt-10">
        <div className="border lg:grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
          <aside className="py-6 lg:col-span-3">
            <span className="mx-5 text-xl font-bold">Settings</span>
          </aside>
          <div className="lg:col-span-9 p-4 space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">API Keys</h3>
              <APIKeysCard />
            </div>
            <OAuthCard />
          </div>
        </div>
      </div>
    </div>
  );
}
