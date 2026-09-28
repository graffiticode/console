import { useCallback, useEffect, useState } from "react";
import { PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  loadConnectionGrants,
  loadShareableFunctions,
  revokeConnectionGrant,
  shareConnection,
  updateConnectionGrant,
} from "../utils/swr/fetchers";

// Plain descriptions of shareable functions; anything unlisted shows its name.
const FUNCTION_LABELS: Record<string, string> = {
  "save-to-itembank": "Write items to your item bank",
};

interface Permission { lang: string; fn: string }
interface Shareable extends Permission { kind: string }

interface Grant {
  grantId: string;
  recipient: string | null;
  pending: boolean;
  permissions: Permission[];
  expiresAt: string | null;
  createdAt: string;
}

interface Access {
  permissions: Permission[];
  expires: string; // yyyy-mm-dd, or "" for no end
}

const same = (a: Permission, b: Permission) => a.lang === b.lang && a.fn === b.fn;
const langLabel = (lang: string) => `L${lang}`;
const toDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// An end date means the end of that day, in the owner's time zone.
const fromDate = (date: string) => (date ? new Date(`${date}T23:59:59`).toISOString() : null);
const accessVars = (a: Access) => ({ permissions: a.permissions, expiresAt: fromDate(a.expires) });

const errorText = (err: any) =>
  String(err?.response?.errors?.[0]?.message || err?.message || err).replace(/^Connection request refused: /, "Refused: ");

// Chooses the exact functions a grant allows, grouped by language.
function FunctionPicker({ access, onChange, shareable }: { access: Access; onChange: (a: Access) => void; shareable: Shareable[] }) {
  const toggle = (p: Permission) => onChange({
    ...access,
    permissions: access.permissions.some(q => same(p, q))
      ? access.permissions.filter(q => !same(p, q))
      : [...access.permissions, { lang: p.lang, fn: p.fn }],
  });
  const langs = [...new Set(shareable.map(s => s.lang))];
  return (
    <div className="basis-full space-y-2">
      {langs.map(lang => (
        <fieldset key={lang} className="text-sm">
          <legend className="text-xs font-semibold text-gray-600">{langLabel(lang)}</legend>
          {shareable.filter(s => s.lang === lang).map(s => (
            <label key={s.fn} className="flex items-center gap-2">
              <input type="checkbox" checked={access.permissions.some(q => same(s, q))} onChange={() => toggle(s)} />
              <span>{FUNCTION_LABELS[s.fn] || s.fn}</span>
              <span className="font-mono text-xs text-gray-400">{s.fn}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

const writes = (access: Access, shareable: Shareable[]) =>
  access.permissions.some(p => shareable.find(s => same(s, p))?.kind === "write");

const summary = (g: Grant) => g.permissions.map(p => `${langLabel(p.lang)} ${p.fn}`).join(", ");

const blank: Access = { permissions: [], expires: "" };
const accessOf = (g: Grant): Access => ({ permissions: g.permissions, expires: toDate(g.expiresAt) });

// The owner's Share panel for one connection: add a person by email with
// the exact functions they may use and an optional end date, and see,
// change or remove who it is shared with. Changes take effect at that person's
// next run or view.
export default function ConnectionSharing({ user, connectionId }: { user: any; connectionId: string }) {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [shareable, setShareable] = useState<Shareable[]>([]);
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access>(blank);
  // The grant being edited, and its draft access.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Access>(blank);
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
  useEffect(() => {
    loadShareableFunctions({ user, connectionId }).then(setShareable).catch(() => setShareable([]));
  }, [user, connectionId]);

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      if (done) setMessage(done);
      await refresh();
      return true;
    } catch (err) {
      setMessage(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const to = email.trim();
    const ok = await run(
      () => shareConnection({ user, connectionId, email: to, ...accessVars(access) }),
      `Shared with ${to}. If they don't have an account yet, it applies when they sign in with this email.`);
    if (ok) {
      setEmail("");
      setAccess(blank);
    }
  };

  const save = async (grantId: string) => {
    if (await run(() => updateConnectionGrant({ user, connectionId, grantId, ...accessVars(draft) }))) setEditing(null);
  };

  const incomplete = (a: Access) => a.permissions.length === 0;

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
        <DateField value={access.expires} onChange={expires => setAccess({ ...access, expires })} />
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white border border-gray-900 rounded-none text-sm hover:bg-gray-700 disabled:opacity-50"
          onClick={share}
          disabled={busy || !email.trim() || incomplete(access)}>
          Share
        </button>
        <FunctionPicker access={access} onChange={setAccess} shareable={shareable} />
      </div>
      <p className="text-xs text-gray-500">
        They can render items through this connection plus use the functions checked. They never see your key or secret, cannot share it onward, and cannot publish. Opening the Author Site is never shared.
        {writes(access, shareable) && " Writing lets them write any item into your item bank."}
      </p>
      {message && <p className="text-xs text-gray-700">{message}</p>}
      {grants === null ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : grants.length === 0 ? (
        <p className="text-xs text-gray-400">Not shared with anyone.</p>
      ) : (
        <ul className="space-y-1">
          {grants.map(g => (
            <li key={g.grantId} className="text-sm">
              <div className="flex items-center justify-between">
                {/* Pending and claimed shares look the same, so the list never says
                    whether an email has an account. */}
                <span>
                  <span className="font-mono">{g.recipient || "someone"}</span>
                  <span className="text-gray-500"> · {summary(g)}</span>
                  {g.expiresAt && <span className="text-gray-400"> · until {new Date(g.expiresAt).toLocaleDateString()}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Change access"
                    disabled={busy}
                    onClick={() => { setEditing(editing === g.grantId ? null : g.grantId); setDraft(accessOf(g)); }}>
                    <PencilIcon className="h-4 w-4 text-gray-500 hover:text-gray-800" />
                  </button>
                  <button type="button" title="Remove access" disabled={busy} onClick={() => run(() => revokeConnectionGrant({ user, connectionId, grantId: g.grantId }))}>
                    <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-red-700" />
                  </button>
                </span>
              </div>
              {editing === g.grantId && (
                <div className="flex flex-wrap items-end gap-2 border-l-2 border-gray-200 pl-3 my-2">
                  <FunctionPicker access={draft} onChange={setDraft} shareable={shareable} />
                  <DateField value={draft.expires} onChange={expires => setDraft({ ...draft, expires })} />
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white border border-gray-900 rounded-none text-sm hover:bg-gray-700 disabled:opacity-50"
                    onClick={() => save(g.grantId)}
                    disabled={busy || incomplete(draft)}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-none text-sm text-gray-700 hover:bg-gray-200"
                    onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">Until (optional)</span>
      <input
        type="date"
        className="mt-1 block border border-gray-300 rounded-none px-2 py-1 text-sm"
        value={value}
        onChange={e => onChange(e.target.value)} />
    </label>
  );
}
