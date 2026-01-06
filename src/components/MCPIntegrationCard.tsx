import { useState, useEffect } from 'react';
import { TrashIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { getIdToken } from "firebase/auth";
import { collection, orderBy, query, where } from "firebase/firestore";
import { useFirestore, useFirestoreCollectionData, useUser } from "reactfire";
import moment from "moment";
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { client } from '../lib/auth';
import axios from 'axios';
import { useCopyToClipboard } from 'react-use';

interface MCPApiKey {
  id: string;
  createdAt: { toDate: () => Date };
}

interface NewApiKey {
  id: string;
  token: string;
}

function MCPApiKeyListItem({
  firebaseUser,
  apiKey,
  onDelete
}: {
  firebaseUser: any;
  apiKey: MCPApiKey;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    try {
      setDeleting(true);
      const token = await getIdToken(firebaseUser);
      await client.apiKeys.remove({ token, id: apiKey.id });
      onDelete();
    } catch (err) {
      console.error('Error deleting API key:', err);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <li className="flex items-center justify-between px-3 py-2">
      <div className="flex flex-col">
        <span className="font-mono text-sm">{apiKey.id}</span>
        <small className="text-xs text-gray-500">
          Created {moment(apiKey.createdAt.toDate()).format("MMM D, YYYY h:mm a")}
        </small>
      </div>
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={deleting}
        className={`p-1 rounded ${
          confirmDelete
            ? 'bg-red-100 text-red-700'
            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
        } disabled:opacity-50`}
        title={confirmDelete ? "Click again to confirm" : "Delete API key"}
      >
        {deleting ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
        ) : (
          <TrashIcon className="h-5 w-5" />
        )}
      </button>
    </li>
  );
}

function NewApiKeyModal({
  apiKey,
  onClose
}: {
  apiKey: NewApiKey | null;
  onClose: () => void;
}) {
  const [, copyToClipboard] = useCopyToClipboard();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  if (!apiKey) return null;

  const mcpConfig = `{
  "mcpServers": {
    "graffiticode": {
      "url": "https://mcp.graffiticode.org/sse",
      "headers": {
        "Authorization": "Bearer ${apiKey.token}"
      }
    }
  }
}`;

  const handleCopyId = () => {
    copyToClipboard(apiKey.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyToken = () => {
    copyToClipboard(apiKey.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyConfig = () => {
    copyToClipboard(mcpConfig);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-center">New API Key Created</h3>

        <div className="space-y-3 mb-4">
          <div className="flex items-center border border-gray-300 rounded px-3 py-2">
            <span className="font-semibold text-sm w-16">ID</span>
            <span className="flex-1 font-mono text-sm text-gray-600 truncate">{apiKey.id}</span>
            <button
              onClick={handleCopyId}
              className="ml-2 text-blue-500 hover:text-blue-700"
              title="Copy ID"
            >
              <ClipboardIcon className="h-5 w-5" />
            </button>
            {copiedId && <span className="ml-1 text-xs text-green-600">Copied!</span>}
          </div>

          <div className="flex items-center border border-gray-300 rounded px-3 py-2">
            <span className="font-semibold text-sm w-16">Secret</span>
            <span className="flex-1 font-mono text-sm text-gray-600 truncate">{apiKey.token}</span>
            <button
              onClick={handleCopyToken}
              className="ml-2 text-blue-500 hover:text-blue-700"
              title="Copy Secret"
            >
              <ClipboardIcon className="h-5 w-5" />
            </button>
            {copiedToken && <span className="ml-1 text-xs text-green-600">Copied!</span>}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          The key&apos;s secret will only be shown this once. Copy it to a safe place.
        </p>

        <div className="bg-gray-50 rounded p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">MCP Client Configuration:</p>
            <button
              onClick={handleCopyConfig}
              className="flex items-center text-xs text-blue-500 hover:text-blue-700"
              title="Copy configuration"
            >
              <ClipboardIcon className="h-4 w-4 mr-1" />
              {copiedConfig ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs text-gray-600 overflow-x-auto">{mcpConfig}</pre>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MCPIntegrationCard() {
  const { user } = useGraffiticodeAuth();
  const { data: firebaseUser } = useUser();
  const firestore = useFirestore();
  const [newApiKey, setNewApiKey] = useState<NewApiKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [protectedKeyIds, setProtectedKeyIds] = useState<Set<string>>(new Set());
  const [mcpKeyIds, setMcpKeyIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Query all API keys for this user
  const apiKeysQuery = user?.uid
    ? query(
        collection(firestore, "api-keys"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      )
    : null;
  const { status, data: apiKeys } = useFirestoreCollectionData(apiKeysQuery, { idField: "id" });

  // Fetch integration settings to get protected API key IDs and MCP key IDs
  useEffect(() => {
    if (user?.uid) {
      axios.get(`/api/integrations?userId=${user.uid}`)
        .then(response => {
          const protectedIds = new Set<string>();
          const mcpIds = new Set<string>();

          // Front integration API key is protected
          if (response.data?.front?.apiKeyId) {
            protectedIds.add(response.data.front.apiKeyId);
          }

          // MCP integration API keys
          if (response.data?.mcp?.apiKeyIds) {
            response.data.mcp.apiKeyIds.forEach((id: string) => mcpIds.add(id));
          }

          setProtectedKeyIds(protectedIds);
          setMcpKeyIds(mcpIds);
        })
        .catch(err => console.error('Error fetching integrations:', err));
    }
  }, [user?.uid, refreshKey]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const userToken = await getIdToken(firebaseUser);
      const apiKey = await client.apiKeys.create(userToken);

      // Save the new API key ID to MCP integration settings
      const newMcpKeyIds = [...Array.from(mcpKeyIds), apiKey.id];
      await axios.post(`/api/integrations?userId=${user?.uid}`, {
        mcp: { apiKeyIds: newMcpKeyIds }
      });

      setNewApiKey(apiKey);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error creating API key:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    try {
      // Remove from MCP settings
      const newMcpKeyIds = Array.from(mcpKeyIds).filter(id => id !== keyId);
      await axios.post(`/api/integrations?userId=${user?.uid}`, {
        mcp: { apiKeyIds: newMcpKeyIds }
      });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error updating MCP settings:', err);
    }
  };

  const handleCloseModal = () => {
    setNewApiKey(null);
  };

  if (!user?.uid || status === "loading") {
    return (
      <div className="border rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-4">MCP Integration</h3>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // Filter to show only MCP API keys
  const mcpApiKeys = (apiKeys || []).filter(
    (key: any) => mcpKeyIds.has(key.id)
  ) as MCPApiKey[];

  return (
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">MCP Integration</h3>
      <p className="text-sm text-gray-600 mb-4">
        Use the Model Context Protocol (MCP) to integrate Graffiticode with AI assistants like Claude.
      </p>

      {/* API Keys List */}
      {mcpApiKeys.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Keys
          </label>
          <ul className="border border-gray-300 rounded divide-y">
            {mcpApiKeys.map((apiKey) => (
              <MCPApiKeyListItem
                key={apiKey.id}
                firebaseUser={firebaseUser}
                apiKey={apiKey}
                onDelete={() => handleDelete(apiKey.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Create Button */}
      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating...
          </>
        ) : (
          'Create API Key'
        )}
      </button>

      {/* New API Key Modal */}
      <NewApiKeyModal apiKey={newApiKey} onClose={handleCloseModal} />
    </div>
  );
}
