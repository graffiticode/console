import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useCallback } from "react";
import useGraffiticodeAuth from "@graffiticode/auth-react";
import { getSecrets, setSecret, deleteSecret } from "../utils/swr/fetchers";

interface SecretInfo {
  name: string;
  masked: string;
  updatedAt: string;
}

export default function SecretsCard() {
  const { user } = useGraffiticodeAuth();
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getSecrets({ user });
      setSecrets(list || []);
      setStatus("ready");
    } catch (err) {
      console.error("getSecrets failed:", err);
      setStatus("error");
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      setError("Name must contain only lowercase letters, digits and hyphens.");
      return;
    }
    if (!value) {
      setError("Value is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setSecret({ user, name: trimmed, value });
      setName("");
      setValue("");
      setAdding(false);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || err?.message || "Failed to save secret.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (secretName: string) => async () => {
    try {
      await deleteSecret({ user, name: secretName });
      await refresh();
    } catch (err) {
      console.error("deleteSecret failed:", err);
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
        Named secrets you can reference from code with <code>get-val-private &quot;name&quot;</code>.
        Values are encrypted and never shown again after saving.
      </p>
      <ul className="space-y-2 mb-2">
        {secrets.map(secret => (
          <li key={secret.name} className="flex items-center justify-between border border-gray-300 px-4 py-1 rounded-none">
            <div className="flex flex-col">
              <span className="font-mono">{secret.name}</span>
              <small className="mb-1 text-sm text-neutral-500 font-light">{secret.masked}</small>
            </div>
            <button
              type="button"
              className="inline-block rounded-none"
              onClick={handleDelete(secret.name)}
              title="Delete secret">
              <TrashIcon className="h-5 w-5 text-red-500 hover:text-red-700" />
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="border border-gray-300 p-3 space-y-2">
          <input
            type="text"
            placeholder="name (e.g. learnosity-secret)"
            className="w-full border border-gray-300 px-2 py-1 rounded-none text-sm font-mono"
            value={name}
            onChange={e => setName(e.target.value)} />
          <input
            type="password"
            placeholder="value"
            className="w-full border border-gray-300 px-2 py-1 rounded-none text-sm font-mono"
            value={value}
            onChange={e => setValue(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 bg-gray-900 text-white border border-gray-900 rounded-none text-sm hover:bg-gray-700 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-none text-sm text-gray-700 hover:bg-gray-200"
              onClick={() => { setAdding(false); setName(""); setValue(""); setError(null); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-none text-sm text-gray-700 hover:bg-gray-200"
            onClick={() => setAdding(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add secret
          </button>
        </div>
      )}
    </div>
  );
}
