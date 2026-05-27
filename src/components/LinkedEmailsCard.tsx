import { useCallback, useEffect, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import useGraffiticodeAuth from '@graffiticode/auth-react';
import { useLinkedEmails, type LinkedEmail } from '../hooks/use-linked-emails';
import AddEmailDialog from './AddEmailDialog';

export default function LinkedEmailsCard() {
  const { user } = useGraffiticodeAuth();
  const { listEmails, removeEmail } = useLinkedEmails();

  const [emails, setEmails] = useState<LinkedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listEmails();
      setEmails(rows);
    } catch (err: any) {
      setError(err?.message || 'Failed to load linked emails');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, listEmails]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setError(null);
    try {
      await removeEmail(id);
      setEmails((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to remove email');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdded = (email: string) => {
    setShowAdd(false);
    refresh();
    // Optimistic feedback — refresh fetches the new row from the server.
    setError(null);
    void email;
  };

  return (
    <div className="border rounded-none p-4">
      <h3 className="text-lg font-semibold mb-2">Linked Emails</h3>
      <p className="text-sm text-gray-600 mb-4">
        Emails linked to this account. Any of them can be used to sign in.
      </p>

      {error && (
        <div className="mb-4 rounded-none bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && emails.length === 0 ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : emails.length > 0 ? (
        <ul className="border border-gray-300 rounded-none mb-4 divide-y">
          {emails.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between px-3 py-3"
            >
              <span className="text-sm text-gray-900 break-all">{row.email}</span>
              <button
                type="button"
                onClick={() => handleRemove(row.id)}
                disabled={removingId === row.id}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                title="Remove email"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 mb-4">No emails linked yet.</p>
      )}

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="inline-flex items-center gap-2 rounded-none border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <PlusIcon className="h-4 w-4" />
        Add email
      </button>

      <AddEmailDialog
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={handleAdded}
      />
    </div>
  );
}
