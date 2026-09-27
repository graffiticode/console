import { useEffect, useState } from 'react';
import { loadConnections, runItem, setItemConnection } from '../utils/swr/fetchers';

// Languages with protected functions in the policy registry
// (graffiticode packages/common/src/protected-registry.js). Only these items
// can run through a connection.
const CONNECTABLE_LANGS = new Set(['0176']);

export const isConnectableLang = lang =>
  CONNECTABLE_LANGS.has(String(lang ?? '').replace(/^L/i, '').padStart(4, '0'));

const newRunKey = () =>
  `run-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

// Chooses the connection an item runs through, and runs it. Running is the one
// explicit action that executes the program's protected calls (its item-bank
// saves included) and stores the result views show. Each run has its own
// idempotency key; "Retry" reuses it so a lost response never repeats a write.
export default function ItemConnection({ user, itemId, taskId, connectionId, publicationId, onChanged }) {
  const [connections, setConnections] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastKey, setLastKey] = useState(null);

  useEffect(() => {
    let live = true;
    loadConnections({ user })
      .then(list => live && setConnections((list || []).filter(c => c.status === 'active')))
      .catch(() => live && setConnections([]));
    return () => { live = false; };
  }, [user]);

  const choose = async value => {
    setBusy(true);
    setMessage(null);
    try {
      await setItemConnection({ user, id: itemId, connectionId: value || null });
      setLastKey(null);
      onChanged?.();
    } catch (err) {
      setMessage(String(err?.response?.errors?.[0]?.message || err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const run = async key => {
    setBusy(true);
    setMessage(null);
    setLastKey(key);
    try {
      const resp = await runItem({ user, taskId, connectionId, idempotencyKey: key });
      const errors = resp?.data?.errors || [];
      setMessage(errors.length ? errors.map(e => e.message ?? e).join('; ') : 'Run complete.');
    } catch (err) {
      setMessage(`Run failed: ${String(err?.message || err)}. Retry repeats this run without repeating its writes.`);
    } finally {
      setBusy(false);
    }
  };

  const labelFor = c => c.label || `${c.backend} ${c.connectionId.slice(-6)}`;

  return (
    <div className="mt-4">
      <label className="block text-xs font-semibold text-gray-600 mb-1">Connection</label>
      <select
        className="w-full text-xs border border-gray-300 rounded-none px-2 py-1 disabled:opacity-50"
        value={connectionId || ''}
        disabled={busy || connections === null || Boolean(publicationId)}
        title={publicationId ? 'Unpublish this item to change its connection.' : undefined}
        onChange={e => choose(e.target.value)}
      >
        <option value="">None (preview only)</option>
        {(connections || []).map(c => (
          <option key={c.connectionId} value={c.connectionId}>{labelFor(c)}</option>
        ))}
        {connectionId && connections && !connections.some(c => c.connectionId === connectionId) && (
          <option value={connectionId}>Unavailable connection</option>
        )}
      </select>
      {connectionId && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => run(newRunKey())}
            disabled={busy || !taskId}
            className="px-3 py-1 text-xs text-white bg-gray-700 hover:bg-gray-900 rounded-none disabled:opacity-50"
            title="Runs the program through this connection, including any item-bank saves."
          >
            {busy ? 'Running…' : 'Run'}
          </button>
          {lastKey && message?.startsWith('Run failed') && (
            <button
              onClick={() => run(lastKey)}
              disabled={busy}
              className="px-3 py-1 text-xs text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-none disabled:opacity-50"
            >
              Retry
            </button>
          )}
        </div>
      )}
      {publicationId && <div className="text-xs text-gray-500 mt-1">Published through this connection.</div>}
      {message && <div className="text-xs text-gray-600 mt-1 break-words">{message}</div>}
    </div>
  );
}
