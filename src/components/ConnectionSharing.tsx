import { useCallback, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { loadConnectionGrants, revokeConnectionGrant, shareConnection } from "../utils/swr/fetchers";

// What each sharing preset lets the other person do through the owner's
// connection. Opening the Author Site is never shareable.
export const PRESETS = [
  { key: "preview", label: "Can preview", detail: "Render and sign previews." },
  { key: "save", label: "Can save", detail: "Preview, and write items to your item bank." },
  { key: "publish", label: "Can publish", detail: "Save, and publish items that anyone can view through your connection." },
];

export const presetLabel = (key: string | null | undefined) => PRESETS.find(p => p.key === key)?.label || key || "";

interface Grant {
  grantId: string;
  recipient: string | null;
  pending: boolean;
  preset: string;
  expiresAt: string | null;
  createdAt: string;
}

const errorText = (err: any) =>
  String(err?.response?.errors?.[0]?.message || err?.message || err).replace(/^Connection request refused: /, "Refused: ");

// The owner's Share panel for one connection: add a person by email with a
// preset (and an optional end date), and see or remove who it is shared with.
// Removing takes effect at that person's next run or view.
export default function ConnectionSharing({ user, connectionId }: { user: any; connectionId: string }) {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [email, setEmail] = useState("");
  const [preset, setPreset] = useState("save");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setGrants(await loadConnectionGrants({ user, connectionId }));
    } catch (err) {
      setMessage(errorText(err));
      setGrants([]);
    }
  }, [user, connectionId]);

  useEffect(() => { refresh(); }, [refresh]);

  const share = async () => {
    setBusy(true);
    setMessage(null);
    try {
      // An end date means the end of that day, in the owner's time zone.
      const expiresAt = expires ? new Date(`${expires}T23:59:59`).toISOString() : null;
      await shareConnection({ user, connectionId, email: email.trim(), preset, expiresAt });
      setMessage(`Shared with ${email.trim()}. If they don't have an account yet, it applies when they sign in with this email.`);
      setEmail("");
      setExpires("");
      await refresh();
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (grantId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await revokeConnectionGrant({ user, connectionId, grantId });
      await refresh();
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const selected = PRESETS.find(p => p.key === preset);

  return (
    <div className="border border-gray-300 border-t-0 px-4 py-3 space-y-3 rounded-none">
      <div className="flex flex-wrap items-end gap-2">
        <label className="block text-sm flex-1 min-w-[12rem]">
          <span className="text-gray-700">Share with (email)</span>
          <input
            type="email"
            className="mt-1 block w-full border border-gray-300 rounded-none px-2 py-1 text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="alice@example.com" />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Access</span>
          <select
            className="mt-1 block border border-gray-300 rounded-none px-2 py-1 text-sm"
            value={preset}
            onChange={e => setPreset(e.target.value)}>
            {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Until (optional)</span>
          <input
            type="date"
            className="mt-1 block border border-gray-300 rounded-none px-2 py-1 text-sm"
            value={expires}
            onChange={e => setExpires(e.target.value)} />
        </label>
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white border border-gray-900 rounded-none text-sm hover:bg-gray-700 disabled:opacity-50"
          onClick={share}
          disabled={busy || !email.trim()}>
          Share
        </button>
      </div>
      <p className="text-xs text-gray-500">
        {selected?.detail} They never see your key or secret, and cannot share it onward. Opening the Author Site is never shared.
        {preset !== "preview" && " They can write any item into your item bank."}
      </p>
      {message && <p className="text-xs text-gray-700">{message}</p>}
      {grants === null ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : grants.length === 0 ? (
        <p className="text-xs text-gray-400">Not shared with anyone.</p>
      ) : (
        <ul className="space-y-1">
          {grants.map(g => (
            <li key={g.grantId} className="flex items-center justify-between text-sm">
              {/* Pending and claimed shares look the same, so the list never says
                  whether an email has an account. */}
              <span>
                <span className="font-mono">{g.recipient || "someone"}</span>
                <span className="text-gray-500"> · {presetLabel(g.preset)}</span>
                {g.expiresAt && <span className="text-gray-400"> · until {new Date(g.expiresAt).toLocaleDateString()}</span>}
              </span>
              <button type="button" title="Remove access" disabled={busy} onClick={() => remove(g.grantId)}>
                <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-red-700" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
