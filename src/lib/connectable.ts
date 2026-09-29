// Languages with protected functions in the policy registry
// (graffiticode packages/common/src/protected-registry.js), and the backend
// each one's connection is for. Only these items write through a connection.
// Shared by the browser and the server, so it imports nothing.
export const CONNECTABLE_LANGS: Record<string, string> = {
  "0176": "learnosity",
};

// "L176", "176" and "0176" all name the same language.
export const normalizeLang = (lang: unknown) =>
  String(lang ?? "").replace(/^L/i, "").padStart(4, "0");

export const isConnectableLang = (lang: unknown) =>
  Object.prototype.hasOwnProperty.call(CONNECTABLE_LANGS, normalizeLang(lang));

export const backendForLang = (lang: unknown): string | null =>
  isConnectableLang(lang) ? CONNECTABLE_LANGS[normalizeLang(lang)] : null;

// The connection to view a version through: only one it was actually written
// through. A view through a connection reads the stored result and never runs
// the program, so asking for a version that has none (saved before saves wrote,
// a failed write, an unsaved edit) is an error. Those preview normally instead.
export const viewConnectionId = (
  item: { connectionId?: string | null; lastWrite?: { taskId?: string; connectionId?: string | null; status?: string } | null } | null | undefined,
  taskId: string | null | undefined,
): string | null => {
  const connectionId = item?.connectionId ?? null;
  const write = item?.lastWrite;
  return connectionId && taskId && write?.status === "ok" && write.taskId === taskId && write.connectionId === connectionId
    ? connectionId
    : null;
};
