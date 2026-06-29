import { TrashIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useCallback } from "react";
import useGraffiticodeAuth from "@graffiticode/auth-react";
import { getCredentials, setCredential, deleteCredential } from "../utils/swr/fetchers";
import {
  CREDENTIAL_BACKENDS,
  CUSTOM_BACKEND_KEY,
  getCredentialBackend,
  varName,
} from "../lib/credential-backends";

// One stored variable (a single credential field).
interface CredVar {
  name: string;
  backend: string | null;
  isPublic: boolean;
  value: string | null; // present for public vars
  masked: string;        // present for private vars
  updatedAt: string;
}

export default function CredentialsCard() {
  const { user } = useGraffiticodeAuth();
  const [vars, setVars] = useState<CredVar[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Form state. `editBackend` non-null means editing that backend's group.
  const [open, setOpen] = useState(false);
  const [editBackend, setEditBackend] = useState<string | null>(null);
  const [backend, setBackend] = useState<string>(CREDENTIAL_BACKENDS[0]?.key || CUSTOM_BACKEND_KEY);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState("");
  const [customIsPublic, setCustomIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getCredentials({ user });
      setVars(list || []);
      setStatus("ready");
    } catch (err) {
      console.error("getCredentials failed:", err);
      setStatus("error");
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Group stored vars: known backends collapse into one row each; everything
  // else (custom / unrecognized) is its own row.
  const knownGroups: { key: string; vars: Record<string, CredVar> }[] = [];
  const customVars: CredVar[] = [];
  for (const v of vars) {
    const def = getCredentialBackend(v.backend);
    if (def) {
      let g = knownGroups.find(x => x.key === def.key);
      if (!g) { g = { key: def.key, vars: {} }; knownGroups.push(g); }
      g.vars[v.name] = v;
    } else {
      customVars.push(v);
    }
  }

  const isCustom = backend === CUSTOM_BACKEND_KEY;
  const def = getCredentialBackend(backend);

  const resetForm = () => {
    setOpen(false);
    setEditBackend(null);
    setBackend(CREDENTIAL_BACKENDS[0]?.key || CUSTOM_BACKEND_KEY);
    setFieldValues({});
    setCustomName("");
    setCustomIsPublic(false);
    setError(null);
  };

  const startAdd = () => { resetForm(); setOpen(true); };

  const startEditGroup = (key: string) => () => {
    const d = getCredentialBackend(key);
    if (!d) return;
    const g = knownGroups.find(x => x.key === key);
    // Prefill public field values (we have them in clear); private left blank.
    const fv: Record<string, string> = {};
    for (const f of d.fields) {
      const v = g?.vars[varName(key, f.name)];
      if (f.visibility === "public" && v?.value) fv[f.name] = v.value;
    }
    setError(null);
    setBackend(key);
    setEditBackend(key);
    setFieldValues(fv);
    setOpen(true);
  };

  const startEditCustom = (v: CredVar) => () => {
    setError(null);
    setBackend(CUSTOM_BACKEND_KEY);
    setEditBackend(CUSTOM_BACKEND_KEY);
    setCustomName(v.name);
    setCustomIsPublic(v.isPublic);
    setFieldValues(v.isPublic && v.value ? { __custom: v.value } : {});
    setOpen(true);
  };

  const handleSaveKnown = async () => {
    if (!def) return;
    const entered = def.fields.filter(f => (fieldValues[f.name] || "").trim() !== "");
    if (!editBackend && entered.length === 0) {
      setError("Enter at least one value.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      for (const f of entered) {
        await setCredential({
          user,
          name: varName(def.key, f.name),
          value: fieldValues[f.name].trim(),
          backend: def.key,
        });
      }
      resetForm();
      await refresh();
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || err?.message || "Failed to save credential.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustom = async () => {
    const name = customName.trim();
    if (!/^[a-z0-9-]+$/.test(name)) {
      setError("Name must contain only lowercase letters, digits and hyphens.");
      return;
    }
    const value = (fieldValues.__custom || "").trim();
    if (!value && !editBackend) {
      setError("A value is required.");
      return;
    }
    if (!value) { resetForm(); return; } // edit with no new value: nothing to write
    setSaving(true);
    setError(null);
    try {
      await setCredential({ user, name, value, backend: CUSTOM_BACKEND_KEY, isPublic: customIsPublic });
      resetForm();
      await refresh();
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || err?.message || "Failed to save credential.");
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = (key: string) => async () => {
    const g = knownGroups.find(x => x.key === key);
    if (!g) return;
    try {
      for (const name of Object.keys(g.vars)) await deleteCredential({ user, name });
      await refresh();
    } catch (err) {
      console.error("deleteCredential failed:", err);
    }
  };

  const deleteVar = (name: string) => async () => {
    try {
      await deleteCredential({ user, name });
      await refresh();
    } catch (err) {
      console.error("deleteCredential failed:", err);
    }
  };

  if (!user) return null;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden grid grid-col-1">
      <p className="text-sm text-gray-500 mb-3">
        Connect a backend your items compile against. Pick a service and enter its credentials.
        Each field is referenced from code as <code>get-val-public</code>/<code>get-val-private &quot;&lt;backend&gt;-&lt;field&gt;&quot;</code>
        {" "}(e.g. <code>learnosity-key</code>, <code>learnosity-secret</code>). Public ids are stored in clear;
        secrets are encrypted and never shown again after saving.
      </p>

      <ul className="space-y-2 mb-2">
        {knownGroups.map(g => {
          const d = getCredentialBackend(g.key)!;
          return (
            <li key={g.key} className="flex items-center justify-between border border-gray-300 px-4 py-1 rounded-none">
              <div className="flex flex-col">
                <span className="font-mono">{d.label}</span>
                <small className="text-sm text-neutral-500 font-light space-x-3">
                  {d.fields.map(f => {
                    const v = g.vars[varName(g.key, f.name)];
                    if (!v) return null;
                    const shown = f.visibility === "public" ? v.value : v.masked;
                    return <span key={f.name}>{f.label}: <span className="font-mono">{shown}</span></span>;
                  })}
                </small>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={startEditGroup(g.key)} title="Edit credential">
                  <PencilIcon className="h-5 w-5 text-gray-500 hover:text-gray-800" />
                </button>
                <button type="button" onClick={deleteGroup(g.key)} title="Delete credential">
                  <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-700" />
                </button>
              </div>
            </li>
          );
        })}
        {customVars.map(v => (
          <li key={v.name} className="flex items-center justify-between border border-gray-300 px-4 py-1 rounded-none">
            <div className="flex flex-col">
              <span className="font-mono">{v.name}</span>
              <small className="text-sm text-neutral-500 font-light">
                {v.isPublic ? <span className="font-mono">{v.value}</span> : <span className="font-mono">{v.masked}</span>}
              </small>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={startEditCustom(v)} title="Edit credential">
                <PencilIcon className="h-5 w-5 text-gray-500 hover:text-gray-800" />
              </button>
              <button type="button" onClick={deleteVar(v.name)} title="Delete credential">
                <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-700" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {open ? (
        <div className="border border-gray-300 p-3 space-y-2">
          <select
            className="w-full border border-gray-300 px-2 py-1 rounded-none text-sm"
            value={backend}
            disabled={!!editBackend}
            onChange={e => { setBackend(e.target.value); setFieldValues({}); }}>
            {CREDENTIAL_BACKENDS.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            <option value={CUSTOM_BACKEND_KEY}>Custom</option>
          </select>

          {isCustom ? (
            <>
              <input
                type="text"
                placeholder="name (e.g. my-backend-token)"
                className="w-full border border-gray-300 px-2 py-1 rounded-none text-sm font-mono"
                value={customName}
                disabled={!!editBackend}
                onChange={e => setCustomName(e.target.value)} />
              <select
                className="w-full border border-gray-300 px-2 py-1 rounded-none text-sm"
                value={customIsPublic ? "public" : "private"}
                onChange={e => setCustomIsPublic(e.target.value === "public")}>
                <option value="private">Secret (encrypted)</option>
                <option value="public">Public id (stored in clear)</option>
              </select>
              <input
                type={customIsPublic ? "text" : "password"}
                placeholder={editBackend ? "value (leave blank to keep current)" : "value"}
                className="w-full border border-gray-300 px-2 py-1 rounded-none text-sm font-mono"
                value={fieldValues.__custom || ""}
                onChange={e => setFieldValues({ __custom: e.target.value })} />
            </>
          ) : (
            def?.fields.map(f => (
              <input
                key={f.name}
                type={f.visibility === "public" ? "text" : "password"}
                placeholder={editBackend && f.visibility === "private" ? `${f.label} (leave blank to keep current)` : f.label}
                className="w-full border border-gray-300 px-2 py-1 rounded-none text-sm font-mono"
                value={fieldValues[f.name] || ""}
                onChange={e => setFieldValues({ ...fieldValues, [f.name]: e.target.value })} />
            ))
          )}

          {!isCustom && def?.docsUrl && (
            <a href={def.docsUrl} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:underline">
              {def.label} credential docs
            </a>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 bg-gray-900 text-white border border-gray-900 rounded-none text-sm hover:bg-gray-700 disabled:opacity-50"
              onClick={isCustom ? handleSaveCustom : handleSaveKnown}
              disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-none text-sm text-gray-700 hover:bg-gray-200"
              onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-none text-sm text-gray-700 hover:bg-gray-200"
            onClick={startAdd}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add credential
          </button>
        </div>
      )}
    </div>
  );
}
