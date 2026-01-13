import { useState, useEffect } from 'react';
import { TrashIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { useOAuth, OAuthLink } from '../hooks/use-oauth';
import { client } from '../lib/auth';
import axios from 'axios';
import APIKeysCard from './APIKeysCard';

interface FrontSettings {
  authSecret: string;
  emails: string[];
  hasAuthSecret?: boolean;
  apiKeyId?: string;
  apiKeyToken?: string;
}

interface IntegrationsSettings {
  front?: FrontSettings;
}

export default function IntegrationsCard() {
  const { user } = useGraffiticodeAuth();
  const { linkGoogle, getOAuthLinks, unlinkGoogle } = useOAuth();
  const [settings, setSettings] = useState<IntegrationsSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth integrations state
  const [oauthLinks, setOauthLinks] = useState<OAuthLink[]>([]);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Front integration state
  const [authSecret, setAuthSecret] = useState('');
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [apiKeyId, setApiKeyId] = useState('');
  const [apiKeyToken, setApiKeyToken] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchSettings();
      fetchOAuthLinks();
    }
  }, [user?.uid]);

  const fetchSettings = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/integrations?userId=${user.uid}`);
      const data = response.data;
      setSettings(data);
      if (data.front) {
        setAuthSecret(data.front.authSecret || '');
        setApiKeyId(data.front.apiKeyId || '');
        setApiKeyToken(data.front.apiKeyToken || '');
        setEmails(data.front.emails || []);
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Include any pending email from the input field
      let emailsToSave = [...emails];
      const pendingEmail = newEmail.trim().toLowerCase();
      if (pendingEmail && !emailsToSave.includes(pendingEmail)) {
        emailsToSave.push(pendingEmail);
        setEmails(emailsToSave);
        setNewEmail('');
      }

      // Create an API key if one doesn't exist or if we're missing the token
      let currentApiKeyId = apiKeyId || settings.front?.apiKeyId;
      let currentApiKeyToken = apiKeyToken;
      if (!currentApiKeyId || !currentApiKeyToken) {
        const userToken = await user.getToken();
        const newApiKey = await client.apiKeys.create(userToken);
        currentApiKeyId = newApiKey.id;
        currentApiKeyToken = newApiKey.token;
        setApiKeyId(currentApiKeyId);
        setApiKeyToken(currentApiKeyToken);
      }

      const frontSettings: FrontSettings = {
        authSecret: authSecret,
        emails: emailsToSave,
        apiKeyId: currentApiKeyId,
        apiKeyToken: currentApiKeyToken,
      };

      await axios.post(`/api/integrations?userId=${user?.uid}`, {
        front: frontSettings,
      });

      setIsEditingSecret(false);
      await fetchSettings();
    } catch (err) {
      console.error('Error saving integrations:', err);
      setError('Failed to save integration settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    handleDelete();
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setConfirmDelete(false);
      setError(null);

      // Try to delete the API key if it exists (don't fail if it's already gone)
      if (settings.front?.apiKeyId) {
        try {
          const userToken = await user.getToken();
          await client.apiKeys.remove({ token: userToken, id: settings.front.apiKeyId });
        } catch (apiKeyErr) {
          console.warn('Could not delete API key (may already be deleted):', apiKeyErr);
        }
      }

      // Delete the integration settings
      await axios.delete(`/api/integrations?userId=${user?.uid}`);

      // Reset local state
      setSettings({});
      setAuthSecret('');
      setApiKeyId('');
      setApiKeyToken('');
      setEmails([]);
      setIsEditingSecret(false);
    } catch (err: any) {
      console.error('Error deleting integration:', err);
      console.error('Error details:', err?.response?.data || err?.message || err);
      setError(`Failed to delete integration: ${err?.response?.data?.error || err?.message || 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (trimmed) {
      setEmails(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(prev => prev.filter(e => e !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-4">
        <span className="rounded-lg bg-red-100 px-4 py-3 text-base text-red-700" role="alert">
          {error}
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white p-2">
      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* API Keys Section */}
      <div className="border rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-4">API Keys</h3>
        <APIKeysCard />
      </div>

      {/* OAuth Section */}
      <div className="border rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-4">OAuth</h3>
        <p className="text-sm text-gray-600 mb-4">
          Link your Google account to enable sign-in with Google.
        </p>

        {/* List of linked providers */}
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

        {/* Add Google button (only show if not already linked) */}
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

      {/* Front Section */}
      <div className="border rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-4">Front</h3>

        {/* Auth Secret */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auth Secret
          </label>
          {!isEditingSecret && settings.front?.hasAuthSecret ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-600 bg-gray-100 px-3 py-2 rounded flex-1">
                {authSecret}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthSecret('');
                  setIsEditingSecret(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
          ) : (
            <input
              type="password"
              value={authSecret}
              onChange={(e) => setAuthSecret(e.target.value)}
              placeholder="Enter auth secret"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Email Addresses */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Addresses
          </label>

          {/* Email List */}
          {emails.length > 0 && (
            <ul className="border border-gray-300 rounded mb-2 divide-y">
              {emails.map((email) => (
                <li key={email} className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono text-sm">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add Email Input */}
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="user@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddEmail}
              disabled={!newEmail.trim()}
              className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          {settings.front?.apiKeyId ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting || saving}
              className={`inline-flex items-center px-4 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                confirmDelete ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : confirmDelete ? (
                'Click again to confirm'
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete Integration
                </>
              )}
            </button>
          ) : (
            <div></div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
