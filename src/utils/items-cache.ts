// Tiny localStorage cache for the items nav list so it paints instantly on
// reload before the network fetch returns. Keyed by the SWR key; stores only
// the metadata array returned by loadItems (no code/source).

const PREFIX = "graffiticode:items:";
const VERSION = 1;

export function readItemsCache(key: string | null): any[] | undefined {
  if (!key || typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== VERSION || !Array.isArray(parsed.items)) return undefined;
    return parsed.items;
  } catch {
    return undefined;
  }
}

export function writeItemsCache(key: string | null, items: any[]): void {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ v: VERSION, items }));
  } catch {
    // ignore (quota / serialization failures are non-fatal)
  }
}
