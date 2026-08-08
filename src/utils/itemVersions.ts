// Merge an item's chat transcript with its recorded version history.
//
// The help array is the conversation record: after a generation, the resulting
// taskId is grafted onto the user's prompt bubble, so a prompt doubles as the
// handle for the version it produced. Anything that mints a taskId WITHOUT a
// prompt — a direct code edit, an MCP edit, a claimed/shared item's v1 — has no
// bubble and was invisible in the items view.
//
// users/{uid}/versions is the server's complete record of every content state
// (see recordVersion() in src/pages/api/resolvers.ts). Joining the two on taskId
// gives one timeline: matched versions keep rendering as their prompt bubble,
// unmatched ones become their own rows. Nothing is written back into help —
// that array is also the LLM's conversation context.

import { isNonNullObject } from './index';

// The eight VersionSource values (src/pages/api/resolvers.ts). The server clamps
// `source` to this set and defaults nulls to "unknown", so the fallbacks below
// are belt-and-braces.
// "unknown" is what a plain create records — a new item, a copied item, the
// /editor page's create — since defaultVersionSource() only ever recognizes mcp.
// So it reads as "New".
export const VERSION_SOURCE_LABELS = {
  'chat': 'Chat',
  'generation-job': 'Generated',
  'editor': 'Edit',
  'mcp': 'Agent',
  'claim': 'Claimed',
  'share': 'Shared',
  'backfill': 'History',
  'unknown': 'New',
};

export const versionSourceLabel = (source) => VERSION_SOURCE_LABELS[source] || 'New';

// Help entries carry an ISO timestamp, version records an epoch-ms number as a
// string, and the oldest help entries an epoch-ms string. Normalize all three.
export const toEpochMs = (ts) => {
  if (ts === null || ts === undefined) return null;
  if (typeof ts === 'number') return Number.isFinite(ts) ? ts : null;
  const s = String(ts).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? parsed : null;
};

const isRenderableHelpEntry = (msg) => (
  isNonNullObject(msg) && (msg.type === 'user' || msg.role === 'system')
);

const kindRank = (row) => (row.kind === 'help' ? 0 : 1);

/**
 * Build the newest-first row list the Help panel renders.
 *
 * @param help      parsed help array (chat transcript)
 * @param versions  taskVersions rows for this item, newest-first
 * @param itemId    the open item; versions for any other item are dropped
 * @param collapseWindowMs  fold runs of consecutive hand edits closer together
 *                          than this into one row. 0 (default) disables it.
 */
export const buildTranscriptRows = ({ help, versions, itemId, collapseWindowMs = 0 }: {
  help?: any[];
  versions?: any[];
  itemId?: string;
  collapseWindowMs?: number;
}) => {
  const helpEntries = Array.isArray(help) ? help : [];
  const versionRows = Array.isArray(versions) ? versions : [];

  // 1. Help rows, carrying the array index so the renderer keeps its existing
  // index-based delete/pending logic without an O(n^2) indexOf per message.
  const rows = [];
  let lastTs = null;
  helpEntries.forEach((message, index) => {
    if (!isRenderableHelpEntry(message)) return;
    let ts = toEpochMs(message.timestamp);
    let tsInferred = false;
    if (ts === null) {
      // Old entries predate timestamps. Anchor them to their chronological
      // neighbour so they stay in place instead of sinking to the bottom.
      ts = lastTs ?? 0;
      tsInferred = true;
    } else {
      lastTs = ts;
    }
    rows.push({ kind: 'help', index, message, taskId: message.taskId || null, ts, tsInferred });
  });

  // 2. Index versions by taskId. On a duplicate, keep the OLDEST: reverting
  // re-derives the same content-addressed taskId and recordVersion preserves the
  // original createdAt, so the earlier row is the canonical one.
  const versionsByTaskId = new Map();
  for (const version of versionRows) {
    if (!isNonNullObject(version) || !version.taskId) continue;
    if (itemId && version.itemId !== itemId) continue;
    const existing = versionsByTaskId.get(version.taskId);
    if (!existing || (toEpochMs(version.createdAt) ?? 0) < (toEpochMs(existing.createdAt) ?? 0)) {
      versionsByTaskId.set(version.taskId, version);
    }
  }

  // 3. Join. Exact full-chain equality only — `head+A` and `head+B` are
  // genuinely different versions, so no head-segment fallback.
  const matched = new Set();
  for (const row of rows) {
    if (!row.taskId) continue;
    const version = versionsByTaskId.get(row.taskId);
    if (version) {
      row.version = version;
      matched.add(row.taskId);
    }
  }

  // 4. Every version with no bubble of its own becomes a row.
  for (const [taskId, version] of versionsByTaskId) {
    if (matched.has(taskId)) continue;
    rows.push({
      kind: 'version',
      version,
      taskId,
      ts: toEpochMs(version.createdAt) ?? 0,
      // The Firestore doc id ({itemId}__{taskId}) — stable and unique.
      key: version.id || `${version.itemId}__${taskId}`,
    });
  }

  // 5. Newest first. Fully deterministic: never rely on sort stability.
  rows.sort((a, b) => (
    (b.ts - a.ts) ||
    (kindRank(a) - kindRank(b)) ||
    ((b.index ?? -1) - (a.index ?? -1)) ||
    String(a.key ?? a.index).localeCompare(String(b.key ?? b.index))
  ));

  const collapsed = collapseWindowMs > 0 ? collapseEditRuns(rows, collapseWindowMs) : rows;
  return { rows: collapsed, versionCount: versionsByTaskId.size };
};

// Every debounced keystroke burst can mint a version. Folding adjacent hand
// edits keeps the transcript readable when someone types through the editor.
function collapseEditRuns(rows, windowMs) {
  const out = [];
  for (const row of rows) {
    const prev = out[out.length - 1];
    const isEdit = row.kind === 'version' && row.version?.source === 'editor';
    const prevIsEdit = prev && prev.kind === 'version' && prev.version?.source === 'editor';
    if (isEdit && prevIsEdit && Math.abs(prev.ts - row.ts) <= windowMs) {
      // Keep the newest of the run (it is the current content) and count the rest.
      prev.collapsedCount = (prev.collapsedCount || 1) + 1;
      continue;
    }
    out.push(row);
  }
  return out;
}
