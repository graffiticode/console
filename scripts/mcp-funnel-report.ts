#!/usr/bin/env node
/**
 * MCP funnel report — manually-run, no dashboards.
 *
 * Joins two data sources to render the agent-engagement funnel:
 *   A. Cloud Logging — structured events the MCP server emits (one JSON line per
 *      connect / tool call). See graffiticode-mcp-server/src/events.ts.
 *      Read via `gcloud logging read 'jsonPayload.ev=("mcp_connect" OR "mcp_tool")'`.
 *   B. Firestore (graffiticode-app) — the conversion tail: free-plan items,
 *      claimed items (claimedFrom), and paid subscriptions.
 *
 * Join key: the MCP event `session` is sha256(salt + ":" + sessionUuid) — the
 * same `sessionNamespace` the console stamps on items. Claimed items carry the
 * raw `claimedFrom` uuid, which we re-hash here to match.
 *
 * Usage:
 *   npx tsx scripts/mcp-funnel-report.ts [--period all|month|week|day]
 *                                        [--from YYYY-MM-DD] [--to YYYY-MM-DD]
 *                                        [--freshness 7d] [--output mcp-funnel.html]
 *
 * Requires in .env.local:
 *   GRAFFITICODE_APP_CREDENTIALS  — service-account key path (Firestore)
 *   FREE_PLAN_NAMESPACE_SALT      — to derive namespaces from claimedFrom
 * And: `gcloud auth login` (or ADC) with logging.read on graffiticode-app.
 */

import admin from 'firebase-admin';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// --- Load .env.local (same pattern as user-report.ts) -----------------------
const envPath = resolve(process.cwd(), '.env.local');
try {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {}

delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

const PROJECT = 'graffiticode-app';

if (process.env.GRAFFITICODE_APP_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;
} else {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS environment variable not set');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT,
});
const db = admin.firestore();

// --- args -------------------------------------------------------------------
function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  let period = 'week';
  let output = 'mcp-funnel.html';
  let freshness = '';
  let from = '';
  let to = '';
  let slowMs = 60000; // errors slower than this are flagged as likely timeouts
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--period' && args[i + 1]) { period = args[++i]; }
    else if (args[i] === '--output' && args[i + 1]) { output = args[++i]; }
    else if (args[i] === '--freshness' && args[i + 1]) { freshness = args[++i]; }
    else if (args[i] === '--from' && args[i + 1]) { from = args[++i]; }
    else if (args[i] === '--to' && args[i + 1]) { to = args[++i]; }
    else if (args[i] === '--slow-ms' && args[i + 1]) { slowMs = parseInt(args[++i], 10); }
  }
  if (!['all', 'month', 'week', 'day'].includes(period)) {
    console.error('Error: --period must be "all", "month", "week", or "day"');
    process.exit(1);
  }
  if (!Number.isFinite(slowMs) || slowMs <= 0) {
    console.error('Error: --slow-ms must be a positive number of milliseconds');
    process.exit(1);
  }
  return { period, output, freshness, from, to, slowMs };
}

function windowBounds(opts: { period: string; from: string; to: string }) {
  const end = opts.to ? new Date(opts.to + 'T23:59:59Z') : new Date();
  if (opts.from) return { start: new Date(opts.from + 'T00:00:00Z'), end };
  const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
  if (opts.period === 'all') return { start: null as Date | null, end };
  if (opts.period === 'day') return { start: today, end };
  if (opts.period === 'week') return { start: new Date(today.getTime() - 7 * 864e5), end };
  return { start: new Date(today.getTime() - 30 * 864e5), end }; // month
}

// gcloud --freshness only accepts a duration; derive one that covers the window.
function deriveFreshness(opts: { period: string; freshness: string; start: Date | null }): string {
  if (opts.freshness) return opts.freshness;
  if (opts.start) {
    const days = Math.ceil((Date.now() - opts.start.getTime()) / 864e5) + 1;
    return `${Math.min(days, 30)}d`;
  }
  return '30d'; // Cloud Logging default retention ~30d
}

function toMillis(v: any): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const t = Date.parse(v); return Number.isNaN(t) ? null : t; }
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v._seconds != null) return v._seconds * 1000;
  if (v.seconds != null) return v.seconds * 1000;
  return null;
}

function deriveSessionNamespace(uuid: string): string {
  const salt = process.env.FREE_PLAN_NAMESPACE_SALT || '';
  return crypto.createHash('sha256').update(`${salt}:${uuid}`).digest('hex');
}

// `help` is the conversation log — one entry per user turn. It is persisted as
// a JSON *string* (not an array), so parse before counting. The first turn is
// the create; length > 1 means the user came back and revised → iterated.
function helpLen(h: any): number {
  if (Array.isArray(h)) return h.length;
  if (typeof h === 'string') {
    try { const p = JSON.parse(h); return Array.isArray(p) ? p.length : 0; } catch { return 0; }
  }
  return 0;
}

function inWindow(ms: number | null, start: Date | null, end: Date): boolean {
  if (ms == null) return false;
  if (start && ms < start.getTime()) return false;
  return ms <= end.getTime();
}

function pct(n: number, d: number): string {
  if (!d) return '—';
  return ((n / d) * 100).toFixed(1) + '%';
}

const READ_TOOLS = new Set(['list_languages', 'get_language_info', 'get_item']);

// --- A. Cloud Logging events ------------------------------------------------
interface McpEvent {
  ev: 'mcp_connect' | 'mcp_tool';
  t: string;
  auth: string;
  session: string;
  tool?: string;
  outcome?: string;
  lang?: string;
  desc_len?: number;
  ms?: number;
}

function fetchEvents(freshness: string): McpEvent[] {
  const filter = 'jsonPayload.ev=("mcp_connect" OR "mcp_tool")';
  let raw: string;
  try {
    raw = execFileSync('gcloud', [
      'logging', 'read', filter,
      '--project', PROJECT,
      '--format', 'json',
      '--freshness', freshness,
      '--limit', '50000',
    ], { encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 });
  } catch (err: any) {
    console.warn('WARN: gcloud logging read failed — funnel top (connect/browse/success) will be empty.');
    console.warn('      ' + (err?.shortMessage || err?.message || String(err)).split('\n')[0]);
    return [];
  }
  let entries: any[];
  try { entries = JSON.parse(raw); } catch { return []; }
  return entries
    .map((e) => e.jsonPayload as McpEvent)
    .filter((p) => p && (p.ev === 'mcp_connect' || p.ev === 'mcp_tool'));
}

interface SlowError {
  tool: string;
  ms: number;
  t: string;
  session: string;
  lang?: string;
}

interface LogStats {
  connects: number;
  distinctSessions: number;
  browseCalls: number;
  createCalls: number;
  updateCalls: number;
  sessionsWithCreate: number;
  firstTrySuccess: number;
  toolTotal: number;
  toolOk: number;
  toolGenFailed: number;
  toolError: number;
  slowMs: number;            // threshold used
  slowErrors: number;        // errors with ms >= slowMs (likely timeouts)
  maxErrorMs: number;        // slowest error seen (0 if none)
  slowErrorSamples: SlowError[];
  langCounts: Record<string, number>;
}

function summarizeEvents(events: McpEvent[], start: Date | null, end: Date, slowMs: number): LogStats {
  const inWin = events.filter((e) => inWindow(toMillis(e.t), start, end));
  const sessions = new Set<string>();
  const firstCreateBySession: Record<string, McpEvent> = {};
  const langCounts: Record<string, number> = {};
  let connects = 0, browseCalls = 0, createCalls = 0, updateCalls = 0;
  let toolTotal = 0, toolOk = 0, toolGenFailed = 0, toolError = 0;
  let slowErrors = 0, maxErrorMs = 0;
  const slowErrorSamples: SlowError[] = [];

  for (const e of inWin) {
    if (e.session) sessions.add(e.session);
    if (e.ev === 'mcp_connect') { connects++; continue; }
    // mcp_tool
    toolTotal++;
    if (e.outcome === 'ok') toolOk++;
    else if (e.outcome === 'generation_failed') toolGenFailed++;
    else if (e.outcome === 'error') {
      toolError++;
      const ms = typeof e.ms === 'number' ? e.ms : 0;
      if (ms > maxErrorMs) maxErrorMs = ms;
      // A slow error is almost always an upstream timeout, not a validation
      // failure (cap/short-input errors return in 1-5s before any model call).
      if (ms >= slowMs) {
        slowErrors++;
        slowErrorSamples.push({ tool: e.tool ?? '?', ms, t: e.t, session: e.session, lang: e.lang });
      }
    }
    if (e.tool && READ_TOOLS.has(e.tool)) browseCalls++;
    if (e.tool === 'create_item') {
      createCalls++;
      const prev = firstCreateBySession[e.session];
      if (!prev || toMillis(e.t)! < toMillis(prev.t)!) firstCreateBySession[e.session] = e;
    }
    if (e.tool === 'update_item') updateCalls++;
    if (e.lang) langCounts[e.lang] = (langCounts[e.lang] || 0) + 1;
  }

  const createSessions = Object.values(firstCreateBySession);
  const firstTrySuccess = createSessions.filter((e) => e.outcome === 'ok').length;
  slowErrorSamples.sort((a, b) => b.ms - a.ms);

  return {
    connects,
    distinctSessions: sessions.size,
    browseCalls,
    createCalls,
    updateCalls,
    sessionsWithCreate: createSessions.length,
    firstTrySuccess,
    toolTotal,
    toolOk,
    toolGenFailed,
    toolError,
    slowMs,
    slowErrors,
    maxErrorMs,
    slowErrorSamples,
    langCounts,
  };
}

// --- B. Firestore conversion tail -------------------------------------------
interface FsStats {
  freePlanSessions: number;    // distinct namespaces among free-plan items
  freePlanItems: number;
  iteratedItems: number;
  anonSessions: number;        // distinct anon namespaces ever seen (free-plan ∪ claimed)
  claimedSessions: number;     // distinct namespaces with a claimed item
  accounts: number;            // distinct owner uids of claimed items
  paidGlobal: number;          // all users on a paid plan
  paidFromClaim: number;       // claimed-account owners on a paid plan
  spendUsd: number;
  claimedNamespaces: Set<string>;
}

async function fetchFirestore(start: Date | null, end: Date): Promise<FsStats> {
  // Free-plan items (one Firestore account, namespaced per session); filter window client-side.
  const freeSnap = await db.collectionGroup('items').where('freePlan', '==', true).get();
  let freePlanItems = 0, iteratedItems = 0;
  const freePlanSessionSet = new Set<string>();
  freeSnap.forEach((doc) => {
    const d = doc.data();
    const created = toMillis(d.created);
    if (!inWindow(created, start, end)) return;
    freePlanItems++;
    if (typeof d.sessionNamespace === 'string') freePlanSessionSet.add(d.sessionNamespace);
    if (helpLen(d.help) > 1) iteratedItems++;
  });

  // Claimed items → sessions + accounts.
  const claimSnap = await db.collectionGroup('items').where('claimedFrom', '!=', null).get();
  const claimedNamespaces = new Set<string>();
  const accountUids = new Set<string>();
  claimSnap.forEach((doc) => {
    const d = doc.data();
    const claimedAt = toMillis(d.updated) ?? toMillis(d.created);
    if (!inWindow(claimedAt, start, end)) return;
    if (typeof d.claimedFrom === 'string') claimedNamespaces.add(deriveSessionNamespace(d.claimedFrom));
    const ownerUid = doc.ref.parent.parent?.id;
    if (ownerUid) accountUids.add(ownerUid);
  });

  // Paid users.
  const paidSnap = await db.collection('users').where('subscription.status', '==', 'active').get();
  let paidGlobal = 0;
  const paidUids = new Set<string>();
  paidSnap.forEach((doc) => {
    const plan = doc.data()?.subscription?.plan;
    if (plan && plan !== 'demo') { paidGlobal++; paidUids.add(doc.id); }
  });
  const paidFromClaim = [...accountUids].filter((uid) => paidUids.has(uid)).length;

  // Free-plan spend over the window's UTC days.
  let spendUsd = 0;
  const dayStart = start ?? new Date(Date.now() - 30 * 864e5);
  for (let t = dayStart.getTime(); t <= end.getTime(); t += 864e5) {
    const day = new Date(t);
    const key = `spend-${day.getUTCFullYear()}${String(day.getUTCMonth() + 1).padStart(2, '0')}${String(day.getUTCDate()).padStart(2, '0')}`;
    const snap = await db.collection('free-plan-state').doc(key).get();
    if (snap.exists) { const usd = Number(snap.data()?.usd); if (Number.isFinite(usd)) spendUsd += usd; }
  }

  // Claimed sessions left the free-plan pool, so union both for the true
  // "distinct anonymous sessions ever seen" denominator.
  const anonSessions = new Set([...freePlanSessionSet, ...claimedNamespaces]).size;

  return {
    freePlanSessions: freePlanSessionSet.size,
    freePlanItems,
    iteratedItems,
    anonSessions,
    claimedSessions: claimedNamespaces.size,
    accounts: accountUids.size,
    paidGlobal,
    paidFromClaim,
    spendUsd,
    claimedNamespaces,
  };
}

// --- HTML -------------------------------------------------------------------
function card(label: string, value: string, sub = ''): string {
  return `<div class="card"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
}

function funnelRow(stage: string, count: number | string, conv: string, note = ''): string {
  return `<tr><td>${stage}</td><td class="num">${count}</td><td class="num">${conv}</td><td class="note">${note}</td></tr>`;
}

function generateHtml(data: {
  periodLabel: string;
  freshness: string;
  log: LogStats;
  fs: FsStats;
}): string {
  const now = new Date().toISOString();
  const { log, fs } = data;

  const northAccount = pct(fs.accounts, fs.anonSessions);
  const northFirstTry = pct(log.firstTrySuccess, log.sessionsWithCreate);
  const overallSuccess = pct(log.toolOk, log.toolTotal);
  const callsPerSession = log.distinctSessions
    ? (log.toolTotal / log.distinctSessions).toFixed(1) : '—';
  const costPerAccount = fs.accounts ? `$${(fs.spendUsd / fs.accounts).toFixed(3)}` : '—';

  const langRows = Object.entries(log.langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, n]) => `<tr><td>${lang}</td><td class="num">${n}</td></tr>`)
    .join('\n') || '<tr><td colspan="2" class="note">no language activity in window</td></tr>';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MCP Funnel Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; color:#1e293b; padding:24px; max-width:1000px; margin:0 auto; }
  h1 { font-size:1.5rem; margin-bottom:4px; }
  h2 { font-size:1.1rem; margin:28px 0 12px; }
  .subtitle { color:#64748b; font-size:.875rem; margin-bottom:24px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-bottom:8px; }
  .card { background:#fff; border-radius:8px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,.1); }
  .card.north { border-left:4px solid #6366f1; }
  .card .label { font-size:.7rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
  .card .value { font-size:1.6rem; font-weight:600; margin-top:4px; }
  .card .sub { font-size:.72rem; color:#94a3b8; margin-top:2px; }
  table { width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.1); font-size:.85rem; }
  th,td { padding:9px 12px; text-align:left; border-bottom:1px solid #e2e8f0; }
  th { background:#f1f5f9; font-weight:600; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:#475569; }
  td.num,th.num { text-align:right; font-variant-numeric:tabular-nums; }
  td.note { color:#94a3b8; font-size:.78rem; }
  .banner { background:#fffbeb; border:1px solid #fde68a; color:#92400e; padding:10px 14px; border-radius:8px; font-size:.8rem; margin-bottom:20px; }
</style></head><body>
<h1>MCP Funnel Report</h1>
<p class="subtitle">Period: ${data.periodLabel} · logs freshness: ${data.freshness} · generated ${now}</p>

<div class="banner">
  <b>Two views, two sources, two time-coverages.</b> The <b>Engagement</b> table is the live MCP
  event stream (Cloud Logging) and only covers traffic <b>since the instrumented server deployed</b>.
  The <b>Items &amp; conversion</b> table is Firestore state and includes <b>historical</b> items
  that predate instrumentation. So the two tables won't reconcile yet — that's expected during the
  fill-in window, not a bug. North-star ratios are computed within whichever source has the data.
</div>

<h2>North-star metrics</h2>
<div class="cards">
  ${card('① Anon → Account', northAccount, `${fs.accounts} accounts / ${fs.anonSessions} anon sessions (Firestore)`)}
  ${card('② First-try success', northFirstTry, `${log.firstTrySuccess} ok / ${log.sessionsWithCreate} first creates (logs)`)}
</div>
<div class="cards" style="margin-top:16px;">
  ${card('Overall tool success', overallSuccess, `${log.toolOk}/${log.toolTotal} calls (logs)`)}
  ${card('Calls / session', callsPerSession, 'engagement depth (logs)')}
  ${card('Free-plan spend', `$${fs.spendUsd.toFixed(2)}`, costPerAccount + ' / account')}
  ${card('Paid (from claim)', `${fs.paidFromClaim}`, `${fs.paidGlobal} paid overall`)}
</div>

<h2>Engagement — MCP event logs <span style="font-weight:400;color:#94a3b8;font-size:.8rem;">(since instrumentation deployed)</span></h2>
<table>
  <thead><tr><th>Stage</th><th class="num">Count</th><th class="num">Conv. from prev</th><th>Note</th></tr></thead>
  <tbody>
    ${funnelRow('Connected (sessions)', log.distinctSessions, '—', 'mcp_connect events')}
    ${funnelRow('Browsed (read-route calls)', log.browseCalls, '—', 'list_languages · get_language_info · get_item')}
    ${funnelRow('Create calls', log.createCalls, pct(log.sessionsWithCreate, log.distinctSessions) + ' of sessions', `${log.sessionsWithCreate} sessions created an item`)}
    ${funnelRow('Update calls (iterate)', log.updateCalls, pct(log.updateCalls, log.createCalls) + ' of creates', 'create → revisit')}
  </tbody>
</table>

<h2>Items &amp; conversion — Firestore <span style="font-weight:400;color:#94a3b8;font-size:.8rem;">(includes pre-instrumentation history)</span></h2>
<table>
  <thead><tr><th>Stage</th><th class="num">Count</th><th class="num">Conv. from prev</th><th>Note</th></tr></thead>
  <tbody>
    ${funnelRow('Anonymous sessions', fs.anonSessions, '—', 'distinct namespaces, free-plan ∪ claimed')}
    ${funnelRow('Free-plan items created', fs.freePlanItems, pct(fs.freePlanItems, fs.anonSessions) + ' items/session', `${fs.freePlanSessions} sessions still hold free-plan items`)}
    ${funnelRow('Iterated (≥2 turns)', fs.iteratedItems, pct(fs.iteratedItems, fs.freePlanItems) + ' of items', 'help has more than the create turn')}
    ${funnelRow('Claimed', fs.claimedSessions, pct(fs.claimedSessions, fs.anonSessions) + ' of anon sessions', 'distinct claimed namespaces')}
    ${funnelRow('Account created', fs.accounts, pct(fs.accounts, fs.claimedSessions) + ' of claims', 'distinct owner uids')}
    ${funnelRow('Paid', fs.paidFromClaim, pct(fs.paidFromClaim, fs.accounts) + ' of accounts', 'paid plan & active')}
  </tbody>
</table>

<h2>Tool-call outcomes</h2>
<table>
  <thead><tr><th>Outcome</th><th class="num">Count</th><th class="num">Share</th><th>Note</th></tr></thead>
  <tbody>
    <tr><td>ok</td><td class="num">${log.toolOk}</td><td class="num">${pct(log.toolOk, log.toolTotal)}</td><td class="note"></td></tr>
    <tr><td>generation_failed</td><td class="num">${log.toolGenFailed}</td><td class="num">${pct(log.toolGenFailed, log.toolTotal)}</td><td class="note">backend rejected (e.g. free-plan cap, invalid input) — fast</td></tr>
    <tr><td>error</td><td class="num">${log.toolError}</td><td class="num">${pct(log.toolError, log.toolTotal)}</td><td class="note">${log.slowErrors} slow (&ge;${(log.slowMs / 1000).toFixed(0)}s) → likely timeouts${log.maxErrorMs ? `; slowest ${(log.maxErrorMs / 1000).toFixed(0)}s` : ''}</td></tr>
  </tbody>
</table>

<h2>Likely timeouts <span style="font-weight:400;color:#94a3b8;font-size:.8rem;">(error outcomes ≥ ${(log.slowMs / 1000).toFixed(0)}s — full-sheet regen / upstream timeout, not a validation reject)</span></h2>
${log.slowErrorSamples.length ? `<table>
  <thead><tr><th>Time (UTC)</th><th>Tool</th><th>Lang</th><th class="num">Latency</th><th>Session</th></tr></thead>
  <tbody>
    ${log.slowErrorSamples.slice(0, 30).map((s) => `<tr><td>${s.t.slice(0, 19).replace('T', ' ')}</td><td>${s.tool}</td><td>${s.lang ?? ''}</td><td class="num">${(s.ms / 1000).toFixed(1)}s</td><td class="note">${s.session.slice(0, 12)}…</td></tr>`).join('\n    ')}
  </tbody>
</table>
${log.slowErrors > 30 ? `<p class="note">… and ${log.slowErrors - 30} more.</p>` : ''}` : `<p class="note">None in window. (Adjust the threshold with <code>--slow-ms</code>; default 60000.)</p>`}

<h2>Language distribution (interest signal)</h2>
<table>
  <thead><tr><th>Language</th><th class="num">Calls</th></tr></thead>
  <tbody>${langRows}</tbody>
</table>
</body></html>`;
}

// --- main -------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv);
  const { start, end } = windowBounds(opts);
  const freshness = deriveFreshness({ period: opts.period, freshness: opts.freshness, start });
  const periodLabel = start
    ? `${start.toISOString().split('T')[0]} → ${end.toISOString().split('T')[0]}`
    : `all time → ${end.toISOString().split('T')[0]}`;

  if (!process.env.FREE_PLAN_NAMESPACE_SALT) {
    console.warn('WARN: FREE_PLAN_NAMESPACE_SALT not set — claimed-namespace join key will not match logged sessions.');
  }

  console.log(`Reading MCP events (gcloud logging, freshness=${freshness})...`);
  const events = fetchEvents(freshness);
  const log = summarizeEvents(events, start, end, opts.slowMs);

  console.log('Reading Firestore conversion tail...');
  const fs = await fetchFirestore(start, end);

  const html = generateHtml({ periodLabel, freshness, log, fs });
  writeFileSync(opts.output, html);

  // Terminal summary (handy even though the artifact is HTML). Two sources kept
  // visually separate — they cover different time windows during fill-in.
  console.log('\n=== MCP Funnel — ' + periodLabel + ' ===');
  console.log('-- Engagement (event logs, since deploy) --');
  console.log(`Sessions connected     : ${log.distinctSessions}`);
  console.log(`Browse (read) calls    : ${log.browseCalls}`);
  console.log(`Create / update calls  : ${log.createCalls} / ${log.updateCalls}`);
  console.log(`North#2 first-try succ : ${pct(log.firstTrySuccess, log.sessionsWithCreate)} (${log.firstTrySuccess}/${log.sessionsWithCreate})`);
  console.log(`Overall tool success   : ${pct(log.toolOk, log.toolTotal)} (${log.toolOk}/${log.toolTotal})`);
  console.log(`Errors / slow (timeouts): ${log.toolError} / ${log.slowErrors} (≥${(log.slowMs / 1000).toFixed(0)}s${log.maxErrorMs ? `, slowest ${(log.maxErrorMs / 1000).toFixed(0)}s` : ''})`);
  console.log('-- Items & conversion (Firestore, incl. history) --');
  console.log(`Anon sessions          : ${fs.anonSessions}`);
  console.log(`Free-plan items / iter : ${fs.freePlanItems} / ${fs.iteratedItems}`);
  console.log(`Claimed → accounts     : ${fs.claimedSessions} → ${fs.accounts}`);
  console.log(`North#1 anon→account   : ${pct(fs.accounts, fs.anonSessions)} (${fs.accounts}/${fs.anonSessions})`);
  console.log(`Paid (from claim/all)  : ${fs.paidFromClaim} / ${fs.paidGlobal}`);
  console.log(`Free-plan spend        : $${fs.spendUsd.toFixed(2)}`);
  console.log(`\nWrote ${opts.output}`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
