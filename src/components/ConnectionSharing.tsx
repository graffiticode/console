import { useCallback, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import UserSearchCombobox from "./UserSearchCombobox";
import {
  loadConnectionFunctions,
  loadConnectionGrants,
  revokeConnectionGrant,
  setOwnerPermissions,
  shareConnection,
  updateConnectionGrant,
  type AccountMatch,
} from "../utils/swr/fetchers";

// Plain descriptions of protected functions, for the share form; anything
// unlisted shows its name.
const FUNCTION_LABELS: Record<string, string> = {
  "preview-itembank": "Render items (previews)",
  "save-to-itembank": "Write items to your item bank",
  "author-itembank": "Open items in the Author Site",
};
// Short column headings in the access table.
const COLUMN_LABELS: Record<string, string> = {
  "preview-itembank": "Preview",
  "save-to-itembank": "Save",
  "author-itembank": "Author",
};

interface Permission { lang: string; fn: string }
interface Shareable extends Permission { kind: string }
// A protected function on the connection's backend (policy registry).
interface Fn extends Shareable { implicit: boolean; delegable: boolean }

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

const looksLikeEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

// Who a new share goes to: an account picked from the lookup, or (when an
// email finds no account) the email itself, pending until they link it.
type Recipient = { kind: "account"; match: AccountMatch } | { kind: "email"; email: string };

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

const blank: Access = { permissions: [], expires: "" };
const accessOf = (g: Grant): Access => ({ permissions: g.permissions, expires: toDate(g.expiresAt) });
const samePermissions = (a: Permission[], b: Permission[]) =>
  a.length === b.length && a.every(p => b.some(q => same(p, q)));
const sameAccess = (a: Access, b: Access) => a.expires === b.expires && samePermissions(a.permissions, b.permissions);
// Columns: by language, the implicit function (rendering) first, then the
// ones that can be shared, then the owner's alone.
const columnOrder = (a: Fn, b: Fn) =>
  a.lang.localeCompare(b.lang) ||
  Number(b.implicit) - Number(a.implicit) ||
  Number(b.delegable) - Number(a.delegable) ||
  a.fn.localeCompare(b.fn);

// Who may use one owned connection, and for what: a table beneath its row
// with one column per protected function its languages register for the
// connection's backend (grouped by language) and one row per account. The
// owner's row comes first and covers every function, Author included;
// "Everything" (no list) is how every connection starts. Each sharee's row
// covers only the functions that can be shared. A language's implicit
// function (rendering) comes with any other function checked in it, and can
// be checked alone for previews only. Rows edit in place with Save/Cancel;
// changes take effect at that account's next run or view. The find-and-share
// form (`showForm`, toggled by the row's Share button) adds a row.
export default function ConnectionSharing({ user, connectionId, ownerPermissions, showForm, editable = true, onOwnerChanged }: {
  user: any;
  connectionId: string;
  // What the owner allows themselves; null is everything.
  ownerPermissions: Permission[] | null;
  showForm: boolean;
  editable?: boolean;
  // After the owner's own access changes (current-connection candidates follow it).
  onOwnerChanged?: () => Promise<unknown> | void;
}) {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [fns, setFns] = useState<Fn[] | null>(null);
  // The typed text and its settled matches (null: not searched yet), for the
  // share-by-email fallback when a complete email finds no account.
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<AccountMatch[] | null>(null);
  // Bumped after a share to clear the typeahead.
  const [searchKey, setSearchKey] = useState(0);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [access, setAccess] = useState<Access>(blank);
  // Unsaved edits: the owner's list (undefined: unchanged; null: everything),
  // and each sharee's access by grant.
  const [ownerDraft, setOwnerDraft] = useState<Permission[] | null | undefined>(undefined);
  const [drafts, setDrafts] = useState<Record<string, Access>>({});
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
    loadConnectionFunctions({ user, connectionId })
      .then((list: Fn[]) => setFns([...list].sort(columnOrder)))
      .catch(() => setFns([]));
  }, [user, connectionId]);
  const columns = fns || [];
  const shareable = columns.filter(f => f.delegable);
  const langs = [...new Set(columns.map(f => f.lang))];

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

  const onResults = useCallback((q: string, found: AccountMatch[] | null) => {
    setQuery(q);
    setMatches(found);
    // A share-by-email choice belongs to the text it was made for.
    setRecipient(r => (r?.kind === "email" && r.email !== q ? null : r));
  }, []);

  const share = async () => {
    if (!recipient) return;
    const ok = await run(
      () => shareConnection({
        user,
        connectionId,
        ...(recipient.kind === "account" ? { accountId: recipient.match.accountId } : { email: recipient.email }),
        ...accessVars(access),
      }),
      recipient.kind === "account"
        ? `Shared with ${recipient.match.name} (${recipient.match.shortId}).`
        : `Shared with ${recipient.email}. It applies when they link this email to their account.`);
    if (ok) {
      setQuery("");
      setMatches(null);
      setRecipient(null);
      setAccess(blank);
      setSearchKey(k => k + 1);
    }
  };

  const saveGrant = async (g: Grant) => {
    const draft = drafts[g.grantId];
    if (!draft) return;
    if (await run(() => updateConnectionGrant({ user, connectionId, grantId: g.grantId, ...accessVars(draft) }))) {
      setDrafts(({ [g.grantId]: _saved, ...rest }) => rest);
    }
  };
  const saveOwner = async () => {
    if (ownerDraft === undefined) return;
    const ok = await run(async () => {
      await setOwnerPermissions({ user, connectionId, permissions: ownerDraft });
      await onOwnerChanged?.();
    });
    if (ok) setOwnerDraft(undefined);
  };

  const incomplete = (a: Access) => a.permissions.length === 0;

  // One cell: checked when the list names the function, or (for rendering)
  // when it names anything else in that language, which brings it along.
  const cell = (list: Permission[] | null, f: Fn, onToggle: ((p: Permission) => void) | null) => {
    const everything = list === null;
    const named = everything || list.some(p => same(p, f));
    const implied = !named && f.implicit && list.some(p => p.lang === f.lang);
    return (
      <td key={`${f.lang}:${f.fn}`} className="px-2 py-1 text-center">
        <input
          type="checkbox"
          aria-label={`${langLabel(f.lang)} ${f.fn}`}
          title={implied ? `Comes with any other ${langLabel(f.lang)} access` : `${langLabel(f.lang)} ${f.fn}`}
          checked={named || implied}
          disabled={busy || !onToggle || everything || implied}
          onChange={() => onToggle?.(f)} />
      </td>
    );
  };
  const notShareable = (f: Fn) => (
    <td key={`${f.lang}:${f.fn}`} className="px-2 py-1 text-center text-gray-300" title="Only you can use this; it is never shared">—</td>
  );
  const toggled = (list: Permission[], p: Permission) =>
    list.some(q => same(p, q)) ? list.filter(q => !same(p, q)) : [...list, { lang: p.lang, fn: p.fn }];
  const rowButtons = (dirty: boolean, onSave: () => void, onCancel: () => void, saveDisabled = false) => dirty && (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="px-2 py-0.5 bg-gray-900 text-white border border-gray-900 rounded-none text-xs hover:bg-gray-700 disabled:opacity-50"
        onClick={onSave}
        disabled={busy || saveDisabled}>
        Save
      </button>
      <button type="button" className="text-xs text-gray-600 underline" onClick={onCancel}>Cancel</button>
    </span>
  );

  const ownerList = ownerDraft === undefined ? ownerPermissions : ownerDraft;
  const ownerDirty = ownerDraft !== undefined &&
    !(ownerDraft === null ? ownerPermissions === null : ownerPermissions !== null && samePermissions(ownerDraft, ownerPermissions));
  const ownerRow = (
    <tr className="border-t border-gray-200">
      <th scope="row" className="px-2 py-1 text-left font-normal">
        <span className="font-medium">You</span>
        <label className="ml-3 inline-flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={ownerList === null}
            disabled={busy || !editable}
            onChange={e => setOwnerDraft(e.target.checked ? null : columns.map(f => ({ lang: f.lang, fn: f.fn })))} />
          Everything
        </label>
      </th>
      {columns.map(f => cell(ownerList, f, editable ? p => setOwnerDraft(toggled(ownerList || [], p)) : null))}
      <td className="px-2 py-1 text-gray-400">—</td>
      <td className="px-2 py-1">
        {rowButtons(ownerDirty, saveOwner, () => setOwnerDraft(undefined))}
      </td>
    </tr>
  );

  const shareeRow = (g: Grant) => {
    const draft = drafts[g.grantId] || accessOf(g);
    const dirty = !sameAccess(draft, accessOf(g));
    const edit = (a: Access) => setDrafts(d => ({ ...d, [g.grantId]: a }));
    const cancel = () => setDrafts(({ [g.grantId]: _dropped, ...rest }) => rest);
    return (
      <tr key={g.grantId} className="border-t border-gray-200">
        {/* Pending and claimed shares look the same here. */}
        <th scope="row" className="px-2 py-1 text-left font-mono font-normal">{g.recipient || "someone"}</th>
        {columns.map(f => (f.delegable
          ? cell(draft.permissions, f, editable ? p => edit({ ...draft, permissions: toggled(draft.permissions, p) }) : null)
          : notShareable(f)))}
        <td className="px-2 py-1">
          {editable ? (
            <input
              type="date"
              aria-label="Until"
              className="border border-gray-300 rounded-none px-1 py-0.5 text-xs"
              value={draft.expires}
              onChange={e => edit({ ...draft, expires: e.target.value })} />
          ) : g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : <span className="text-gray-400">—</span>}
        </td>
        <td className="px-2 py-1">
          <span className="flex items-center gap-2">
            {rowButtons(dirty, () => saveGrant(g), cancel, incomplete(draft))}
            {editable && (
              <button type="button" title="Remove access" disabled={busy} onClick={() => run(() => revokeConnectionGrant({ user, connectionId, grantId: g.grantId }))}>
                <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-red-700" />
              </button>
            )}
          </span>
        </td>
      </tr>
    );
  };

  const table = fns === null ? (
    <p className="text-xs text-gray-400">Loading access…</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr className="text-xs text-gray-600">
            <th />
            {langs.map(lang => (
              <th key={lang} colSpan={columns.filter(f => f.lang === lang).length} className="px-2 font-semibold">{langLabel(lang)}</th>
            ))}
            <th />
            <th />
          </tr>
          <tr className="text-xs text-gray-500">
            <th className="px-2 text-left font-normal">Account</th>
            {columns.map(f => (
              <th key={`${f.lang}:${f.fn}`} className="px-2 font-normal" title={FUNCTION_LABELS[f.fn] || f.fn}>
                {COLUMN_LABELS[f.fn] || f.fn}
              </th>
            ))}
            <th className="px-2 text-left font-normal">Until</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ownerRow}
          {(grants || []).map(shareeRow)}
        </tbody>
      </table>
      {grants === null && <p className="text-xs text-gray-400 mt-1">Loading sharees…</p>}
      {ownerList !== null && ownerList.length === 0 && (
        <p className="text-xs text-gray-700 mt-1">With nothing checked, you can&apos;t use this connection yourself. People you share it with still can.</p>
      )}
    </div>
  );

  // Finding an account and sharing with it, beneath the table.
  const findAndShare = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="block text-sm flex-1 min-w-[12rem]">
          <span className="text-gray-700">Find an account (name, email or account ID)</span>
          <div className="mt-1">
            <UserSearchCombobox
              key={searchKey}
              selectedUser={recipient?.kind === "account" ? recipient.match : null}
              onSelectUser={m => setRecipient(m ? { kind: "account", match: m } : null)}
              onResults={onResults}
              placeholder="Start typing a name, email or account ID" />
          </div>
        </div>
        <DateField value={access.expires} onChange={expires => setAccess({ ...access, expires })} />
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white border border-gray-900 rounded-none text-sm hover:bg-gray-700 disabled:opacity-50"
          onClick={share}
          disabled={busy || !recipient || incomplete(access)}>
          Share
        </button>
        {recipient?.kind === "account" && (
          <p className="basis-full text-sm">
            Sharing with <span className="font-medium">{recipient.match.name}</span>{" "}
            <span className="font-mono text-xs text-gray-500">{recipient.match.shortId}</span>
          </p>
        )}
        {recipient?.kind !== "account" && matches?.length === 0 && looksLikeEmail(query) && (
          <label className="basis-full flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recipient?.kind === "email"}
              onChange={e => setRecipient(e.target.checked ? { kind: "email", email: query } : null)} />
            <span>No account has linked this email. Share with this email anyway — it applies when they link it.</span>
          </label>
        )}
        <FunctionPicker access={access} onChange={setAccess} shareable={shareable} />
      </div>
      <p className="text-xs text-gray-500">
        Any function checked also lets them render items in that language. They never see your key or secret, cannot share it onward, and cannot publish. Opening the Author Site is never shared.
        {writes(access, shareable) && " Writing lets them write any item into your item bank."}
      </p>
    </div>
  );

  return (
    <div className="border border-gray-300 border-t-0 px-4 py-2 space-y-3 rounded-none">
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Access</p>
        {table}
      </div>
      {showForm && editable && findAndShare}
      {message && <p className="text-xs text-gray-700">{message}</p>}
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
