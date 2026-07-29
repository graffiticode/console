#!/usr/bin/env node

// What does it cost us in AI spend to produce one item?
//
//   npx tsx scripts/cost-per-item.ts --period week
//
// Numerator comes from the providers, not from our own telemetry. The Firestore
// `ai_generation` usage records omit cache tokens entirely and never saw an
// OpenAI embedding, so anything derived from them understates the bill by an
// amount nobody can quantify. The Anthropic Admin API reports the full cache
// breakdown per model, and OpenAI's costs endpoint reports actual dollars.
//
// The cost is therefore scoped by API KEY, not by item: it is a true blended
// all-in average, and it cannot be broken down per language or per item. It
// includes every Claude call on the console's key — scope-gate routing, judge,
// spec generation — which is the intent.
//
// Requires: ANTHROPIC_ADMIN_KEY, ANTHROPIC_API_KEY, GRAFFITICODE_APP_CREDENTIALS.
// Optional: OPENAI_ADMIN_KEY (an `sk-admin-…` org key; a project key is rejected
// by the costs endpoint). Without it, OpenAI spend is excluded and said so.

import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { usdCostFromReport } from '../src/lib/model-pricing';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {}

// Force connection to production Firestore (bypass emulator)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!process.env.GRAFFITICODE_APP_CREDENTIALS) {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS environment variable not set');
  process.exit(1);
}
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'graffiticode-app',
});
const db = admin.firestore();

const ANTHROPIC_ADMIN_KEY = process.env.ANTHROPIC_ADMIN_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Prefer a dedicated admin key; fall back to the project key so the failure is
// a legible 401 rather than a silent omission.
const OPENAI_KEY = process.env.OPENAI_ADMIN_KEY || process.env.OPENAI_API_KEY;
const OPENAI_KEY_IS_ADMIN = Boolean(process.env.OPENAI_ADMIN_KEY);

// ---------------------------------------------------------------- args

type Period = 'day' | 'week' | 'month';
const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 };

const USAGE = `
Average AI cost to produce one item, for a period.

  npx tsx scripts/cost-per-item.ts [options]

  --period day|week|month   Window ending now, UTC-aligned (default: week)
  --from YYYY-MM-DD         Explicit window start (overrides --period)
  --to YYYY-MM-DD           Explicit window end, inclusive
  --key <name|id>           Anthropic API key to scope spend to; repeatable.
                            Defaults to ANTHROPIC_CONSOLE_KEY_IDS, else the key
                            matching ANTHROPIC_API_KEY.
  --exclude-trial           Divide by paid items only, not free-plan trial items
  --all-keys                Use ORG-WIDE Anthropic spend instead of specific keys
  --check                   Also fetch what Anthropic actually billed the org and
                            show what share of it the selected keys account for
  --per-item                Per-item cost distribution from ai_generation records
                            (mean/median/p90). Only sees generations recorded
                            after per-item attribution shipped.
  --output <file.html>      Also write an HTML report (open it in a browser)
  --json                    Emit JSON to stdout (progress goes to stderr)
  --help, -h                Show this

Anthropic's usage report lags by hours, so today's spend is usually absent while
today's items are already counted. The script warns when the window runs past the
last reported bucket; for a settled number, end the window at yesterday.

Env: ANTHROPIC_ADMIN_KEY, ANTHROPIC_API_KEY, GRAFFITICODE_APP_CREDENTIALS.
     ANTHROPIC_CONSOLE_KEY_IDS optional, comma-separated key ids or names.
     OPENAI_ADMIN_KEY optional; without it OpenAI spend is excluded and reported as such.
`.trim();

interface Opts {
  period: Period;
  from?: string;
  to?: string;
  keys: string[];
  excludeTrial: boolean;
  allKeys: boolean;
  check: boolean;
  perItem: boolean;
  output?: string;
  json: boolean;
}

function parseArgs(argv: string[]): Opts {
  const args = argv.slice(2);
  const opts: Opts = {
    period: 'week',
    keys: (process.env.ANTHROPIC_CONSOLE_KEY_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
    excludeTrial: false,
    allKeys: false,
    check: false,
    perItem: false,
    json: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--period' && args[i + 1]) { opts.period = args[++i] as Period; }
    else if (a === '--from' && args[i + 1]) { opts.from = args[++i]; }
    else if (a === '--to' && args[i + 1]) { opts.to = args[++i]; }
    else if (a === '--key' && args[i + 1]) { opts.keys.push(args[++i]); }
    else if (a === '--exclude-trial') { opts.excludeTrial = true; }
    else if (a === '--all-keys') { opts.allKeys = true; }
    else if (a === '--check') { opts.check = true; }
    else if (a === '--per-item') { opts.perItem = true; }
    else if (a === '--output' && args[i + 1]) { opts.output = args[++i]; }
    else if (a === '--json') { opts.json = true; }
    else if (a === '--help' || a === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  if (!opts.from && !['day', 'week', 'month'].includes(opts.period)) {
    console.error('Error: --period must be "day", "week", or "month"');
    process.exit(1);
  }
  return opts;
}

/**
 * One window, used verbatim for all three queries. The Anthropic 1d bucket
 * snaps to UTC midnight, so the item count has to use the identical UTC
 * instants or the ratio compares different periods.
 */
function resolveWindow(opts: Opts): { start: Date; end: Date } {
  const now = new Date();
  const utcMidnight = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');

  const end = opts.to
    ? new Date(new Date(opts.to + 'T00:00:00Z').getTime() + 86_400_000) // --to is inclusive
    : now;
  const start = opts.from
    ? new Date(opts.from + 'T00:00:00Z')
    : new Date(utcMidnight.getTime() - (PERIOD_DAYS[opts.period] - 1) * 86_400_000);

  if (!(start < end)) {
    console.error('Error: --from must be before --to');
    process.exit(1);
  }
  return { start, end };
}

// ---------------------------------------------------------------- anthropic

async function anthropicFetch(url: string): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const resp = await fetch(url, {
      headers: { 'anthropic-version': '2023-06-01', 'x-api-key': ANTHROPIC_ADMIN_KEY! },
    });
    if (resp.status === 429) {
      const wait = (attempt + 1) * 15;
      console.error(`  rate limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    if (!resp.ok) throw new Error(`Anthropic API error (${resp.status}): ${await resp.text()}`);
    return await resp.json();
  }
  throw new Error('Anthropic API failed after 3 retries');
}

interface OrgKey { id: string; name: string; hint: string; }

async function listApiKeys(): Promise<OrgKey[]> {
  const out: OrgKey[] = [];
  let afterId: string | undefined;
  do {
    const params = new URLSearchParams({ limit: '100' });
    if (afterId) params.set('after_id', afterId);
    const data = await anthropicFetch(`https://api.anthropic.com/v1/organizations/api_keys?${params}`);
    for (const k of data.data || []) {
      out.push({ id: k.id, name: k.name || '', hint: k.partial_key_hint || '' });
    }
    afterId = data.has_more ? data.last_id : undefined;
  } while (afterId);
  return out;
}

/**
 * Which API keys count as "the console".
 *
 * Hint-matching ANTHROPIC_API_KEY is only a fallback, not the answer: .env.local
 * holds whichever key this machine develops against, which is not necessarily
 * the one the deployed service uses. Getting that wrong doesn't fail loudly — it
 * quietly reports a fraction of the real spend. Name the keys explicitly via
 * --key or ANTHROPIC_CONSOLE_KEY_IDS whenever production and local differ.
 */
function selectKeys(all: OrgKey[], wanted: string[]): OrgKey[] {
  if (wanted.length > 0) {
    return wanted.map(w => {
      const norm = w.trim().toLowerCase();
      const hit = all.find(k => k.id === w || k.name.toLowerCase() === norm);
      if (!hit) {
        throw new Error(
          `No org API key matches ${JSON.stringify(w)}. Available:\n` +
          all.map(k => `  ${k.id}  ${JSON.stringify(k.name)}`).join('\n'),
        );
      }
      return hit;
    });
  }

  // Fallback: match ANTHROPIC_API_KEY against `partial_key_hint`
  // ("sk-ant-api03-mR3...sQAA") — prefix before "...", suffix after.
  const hit = all.find(k => {
    const dot = k.hint.indexOf('...');
    if (dot === -1) return false;
    return ANTHROPIC_API_KEY!.startsWith(k.hint.slice(0, dot)) &&
           ANTHROPIC_API_KEY!.endsWith(k.hint.slice(dot + 3));
  });
  if (!hit) {
    throw new Error(
      'Could not match ANTHROPIC_API_KEY to an org API key, so spend cannot be scoped.\n' +
      'Pass --key <name|id> (repeatable), or --all-keys for org-wide spend. Available:\n' +
      all.map(k => `  ${k.id}  ${JSON.stringify(k.name)}`).join('\n'),
    );
  }
  return [hit];
}

interface ModelTokens {
  uncachedInput: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
  output: number;
  webSearches: number;
}

const emptyTokens = (): ModelTokens => ({
  uncachedInput: 0, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0, output: 0, webSearches: 0,
});

async function fetchAnthropicUsage(
  start: Date, end: Date, apiKeyIds: string[],
): Promise<{
  byModel: Record<string, ModelTokens>;
  daily: Record<string, Record<string, ModelTokens>>;
  reportedThrough: Date | null;
}> {
  const byModel: Record<string, ModelTokens> = {};
  const daily: Record<string, Record<string, ModelTokens>> = {};
  let reportedThrough: Date | null = null;
  let page: string | undefined;

  do {
    const params = new URLSearchParams({
      starting_at: start.toISOString(),
      ending_at: end.toISOString(),
      bucket_width: '1d',
      'group_by[]': 'model',
      limit: '31', // max for 1d buckets; default is 7, which would silently truncate
    });
    for (const id of apiKeyIds) params.append('api_key_ids[]', id);
    if (page) params.set('page', page);

    const report = await anthropicFetch(
      `https://api.anthropic.com/v1/organizations/usage_report/messages?${params}`,
    );

    for (const bucket of report.data || []) {
      // Track how far the report actually reaches. Buckets are returned even
      // when empty, so this is the report's own coverage, not ours.
      const bucketEnd = new Date(bucket.ending_at);
      if (!reportedThrough || bucketEnd > reportedThrough) reportedThrough = bucketEnd;

      const day = String(bucket.starting_at).split('T')[0];
      const dayModels = (daily[day] ??= {});

      for (const r of bucket.results || []) {
        const model = r.model || 'unknown';
        for (const t of [(byModel[model] ??= emptyTokens()), (dayModels[model] ??= emptyTokens())]) {
          t.uncachedInput += r.uncached_input_tokens || 0;
          t.cacheWrite5m += r.cache_creation?.ephemeral_5m_input_tokens || 0;
          t.cacheWrite1h += r.cache_creation?.ephemeral_1h_input_tokens || 0;
          t.cacheRead += r.cache_read_input_tokens || 0;
          t.output += r.output_tokens || 0;
          t.webSearches += r.server_tool_use?.web_search_requests || 0;
        }
      }
    }
    page = report.has_more ? report.next_page : undefined;
  } while (page);

  return { byModel, daily, reportedThrough };
}

/**
 * What Anthropic actually billed the org over the window, in USD.
 *
 * A cross-check on two things at once: that our per-token math (including the
 * cache tiers) is right, and that we picked the right API key. cost_report
 * can't be filtered by key, so it's necessarily org-wide — our scoped figure
 * must come in at or under it, and the share tells you how much of the bill the
 * selected keys actually account for. A share near zero means the wrong key.
 *
 * `amount` is a decimal string in the currency's LOWEST unit — cents for USD,
 * so "366.00043" is $3.66, not $366.
 */
async function fetchAnthropicBilled(start: Date, end: Date): Promise<number> {
  let cents = 0;
  let page: string | undefined;
  do {
    const params = new URLSearchParams({
      starting_at: start.toISOString(),
      ending_at: end.toISOString(),
      bucket_width: '1d',
      limit: '31',
    });
    if (page) params.set('page', page);
    const report = await anthropicFetch(
      `https://api.anthropic.com/v1/organizations/cost_report?${params}`,
    );
    for (const bucket of report.data || []) {
      for (const r of bucket.results || []) {
        const amt = Number(r.amount);
        if (Number.isFinite(amt)) cents += amt;
      }
    }
    page = report.has_more ? report.next_page : undefined;
  } while (page);
  return cents / 100;
}

// ---------------------------------------------------------------- openai

interface OpenAiCost { embeddings: number; other: number; daily: Record<string, number>; }

async function fetchOpenAiCost(start: Date, end: Date): Promise<OpenAiCost | null> {
  if (!OPENAI_KEY) return null;

  const result: OpenAiCost = { embeddings: 0, other: 0, daily: {} };
  let page: string | undefined;

  do {
    const params = new URLSearchParams({
      start_time: String(Math.floor(start.getTime() / 1000)),
      end_time: String(Math.ceil(end.getTime() / 1000)),
      bucket_width: '1d',
      'group_by[]': 'line_item',
      limit: '180', // max; default is 7, which would silently truncate
    });
    if (page) params.set('page', page);

    const resp = await fetch(`https://api.openai.com/v1/organization/costs?${params}`, {
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    });

    if (resp.status === 401 || resp.status === 403) {
      throw new Error(
        `OpenAI costs endpoint rejected the key (${resp.status}). It requires an ` +
        `organization admin key ("sk-admin-…"), created at platform.openai.com > ` +
        `Organization > Admin keys. ` +
        (OPENAI_KEY_IS_ADMIN
          ? 'OPENAI_ADMIN_KEY is set but was not accepted.'
          : 'Set OPENAI_ADMIN_KEY in .env.local; OPENAI_API_KEY is a project key and will not work here.'),
      );
    }
    if (!resp.ok) throw new Error(`OpenAI API error (${resp.status}): ${await resp.text()}`);

    const data = await resp.json();
    for (const bucket of data.data || []) {
      // Buckets are unix seconds here, unlike Anthropic's RFC 3339.
      const day = new Date((Number(bucket.start_time) || 0) * 1000).toISOString().split('T')[0];
      for (const r of bucket.results || []) {
        // `amount` is documented as {value, currency}; tolerate a bare number.
        const amount = typeof r.amount === 'number' ? r.amount : Number(r.amount?.value ?? 0);
        if (!Number.isFinite(amount)) continue;
        const lineItem = String(r.line_item ?? '');
        if (/embed/i.test(lineItem)) {
          result.embeddings += amount;
          result.daily[day] = (result.daily[day] || 0) + amount;
        } else {
          result.other += amount;
        }
      }
    }
    page = data.has_more ? data.next_page : undefined;
  } while (page);

  return result;
}

// ---------------------------------------------------------------- firestore

function toMillis(v: any): number {
  if (!v) return 0;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  if (typeof v._seconds === 'number') return v._seconds * 1000;
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (typeof v === 'string') return new Date(v).getTime();
  return 0;
}

/**
 * Items created in the window.
 *
 * The `type` filter is load-bearing beyond selecting the right event: the
 * `usage` collection also holds per-uid counter docs (`usage/{uid}`, carrying
 * `currentMonthTotal` and no `type` field), which an unfiltered scan picks up.
 * The date is filtered in JS to avoid needing a (type, createdAt) composite
 * index — the established convention in these scripts.
 */
async function countItems(start: Date, end: Date): Promise<{ total: number; byDay: Record<string, number> }> {
  const snap = await db.collection('usage')
    .where('type', '==', 'item_created')
    .select('createdAt')
    .get();

  let total = 0;
  const byDay: Record<string, number> = {};
  for (const doc of snap.docs) {
    const ms = toMillis(doc.data().createdAt);
    if (ms < start.getTime() || ms >= end.getTime()) continue;
    total++;
    const day = new Date(ms).toISOString().split('T')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  }
  return { total, byDay };
}

/**
 * Free-plan trial items in the window, from the per-UTC-day counters that
 * `recordTrialItem` maintains. Trial items are also written as `item_created`
 * under the shared trial uid, so this is the subset — not an addition.
 */
async function countTrialItems(start: Date, end: Date): Promise<{ total: number; byDay: Record<string, number> }> {
  const refs: FirebaseFirestore.DocumentReference[] = [];
  const days: string[] = [];
  for (let d = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
       d < end.getTime();
       d += 86_400_000) {
    const day = new Date(d);
    const iso = day.toISOString().split('T')[0];
    days.push(iso);
    refs.push(db.collection('free-plan-state').doc(`items-${iso.replace(/-/g, '')}`));
  }
  if (refs.length === 0) return { total: 0, byDay: {} };

  const snaps = await db.getAll(...refs);
  let total = 0;
  const byDay: Record<string, number> = {};
  snaps.forEach((s, i) => {
    const n = Number(s.data()?.count);
    if (!Number.isFinite(n) || n === 0) return;
    total += n;
    byDay[days[i]] = n;
  });
  return { total, byDay };
}

// ------------------------------------------------------- per-item attribution

interface GenRecord {
  userId: string;
  itemId: string | null;
  taskId: string | null;
  usd: number;
  lang: string | null;
  model: string | null;
  instrumented: boolean;
}

interface PerItem {
  records: number;
  instrumented: number;
  attributedCost: number;
  unattributedCost: number;
  unattributedRecords: number;
  byItem: Map<string, { usd: number; gens: number; lang: string | null }>;
}

/**
 * Cost per individual item, from the `ai_generation` usage records.
 *
 * This is the attributable view, and it only sees generations recorded after
 * per-item attribution shipped — earlier records carry `cost.total: 0` and no
 * task id, so they're counted as `legacy` rather than silently priced at zero.
 *
 * Resolution is two-step because a fresh create generates *before* its item
 * exists: use `itemId` when the record has one (an edit), otherwise map
 * `generatedTaskId` through `users/{uid}/versions`, which stores both.
 */
async function fetchPerItem(start: Date, end: Date): Promise<PerItem> {
  const snap = await db.collection('usage')
    .where('type', '==', 'ai_generation')
    .select('createdAt', 'userId', 'itemId', 'generatedTaskId', 'cost', 'lang', 'model')
    .get();

  const records: GenRecord[] = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const ms = toMillis(d.createdAt);
    if (ms < start.getTime() || ms >= end.getTime()) continue;
    const usd = Number(d.cost?.usd ?? d.cost?.total ?? 0);
    records.push({
      userId: String(d.userId || ''),
      itemId: d.itemId ?? null,
      taskId: d.generatedTaskId ?? null,
      usd: Number.isFinite(usd) ? usd : 0,
      lang: d.lang ?? null,
      model: d.model ?? null,
      // A record predating attribution has neither a priced cost nor a task id.
      instrumented: usd > 0 || Boolean(d.generatedTaskId) || Boolean(d.itemId),
    });
  }

  // taskId -> itemId, per user. Fetched per-user rather than as a collection
  // group query so it needs no extra composite index; the user count in a
  // reporting window is small.
  const uids = Array.from(new Set(records.filter(r => !r.itemId && r.taskId).map(r => r.userId)));
  const taskToItem = new Map<string, string>();
  await Promise.all(uids.map(async uid => {
    if (!uid) return;
    const vs = await db.collection(`users/${uid}/versions`).select('itemId', 'taskId').get();
    for (const v of vs.docs) {
      const { itemId, taskId } = v.data();
      if (itemId && taskId) taskToItem.set(`${uid}:${taskId}`, itemId);
    }
  }));

  const out: PerItem = {
    records: records.length,
    instrumented: records.filter(r => r.instrumented).length,
    attributedCost: 0,
    unattributedCost: 0,
    unattributedRecords: 0,
    byItem: new Map(),
  };

  for (const r of records) {
    if (!r.instrumented) continue;
    const itemId = r.itemId ?? (r.taskId ? taskToItem.get(`${r.userId}:${r.taskId}`) : undefined);
    if (!itemId) {
      // A generation that never became an item: it failed, or the item was
      // created outside the window. Real spend, deliberately not divided away.
      out.unattributedCost += r.usd;
      out.unattributedRecords++;
      continue;
    }
    out.attributedCost += r.usd;
    const cur = out.byItem.get(itemId) ?? { usd: 0, gens: 0, lang: r.lang };
    cur.usd += r.usd;
    cur.gens++;
    out.byItem.set(itemId, cur);
  }

  return out;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// ---------------------------------------------------------------- html

const esc = (s: string) => s.replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

interface DayRow {
  day: string;
  items: number;
  trial: number;
  anthropic: number;
  openai: number;
}

interface HtmlInput {
  start: Date;
  end: Date;
  keyLabel: string;
  totalItems: number;
  trialItems: number;
  paidItems: number;
  denominator: number;
  excludeTrial: boolean;
  tokens: ModelTokens;
  costByModel: Record<string, number>;
  anthropicCost: number;
  billedOrgWide: number | null;
  openai: OpenAiCost | null;
  openaiError: string | null;
  rows: DayRow[];
  warnings: string[];
}

function generateHtml(d: HtmlInput): string {
  const totalCost = d.anthropicCost + (d.openai?.embeddings ?? 0);
  const perItem = d.denominator > 0 ? totalCost / d.denominator : null;
  const share = d.billedOrgWide && d.billedOrgWide > 0
    ? (d.anthropicCost / d.billedOrgWide) * 100 : null;

  // Bars are scaled to the largest value in their own column, so each column
  // reads as a shape rather than being flattened by an unrelated maximum.
  const maxCost = Math.max(...d.rows.map(r => r.anthropic + r.openai), 0.000001);
  const maxItems = Math.max(...d.rows.map(r => r.items), 1);
  const maxPer = Math.max(...d.rows.map(r => (r.items > 0 ? (r.anthropic + r.openai) / r.items : 0)), 0.000001);

  const card = (label: string, value: string, note = '') =>
    `<div class="card"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>${
      note ? `<div class="note">${esc(note)}</div>` : ''}</div>`;

  const dayRows = d.rows.map(r => {
    const cost = r.anthropic + r.openai;
    const per = r.items > 0 ? cost / r.items : null;
    return `<tr>
      <td class="mono">${esc(r.day)}</td>
      <td class="num">${r.items.toLocaleString()}${r.trial ? ` <span class="dim">(${r.trial} trial)</span>` : ''}
        <span class="bar"><span style="width:${(r.items / maxItems) * 100}%"></span></span></td>
      <td class="num">$${cost.toFixed(4)}
        <span class="bar"><span style="width:${(cost / maxCost) * 100}%"></span></span></td>
      <td class="num">${per === null ? '<span class="dim">—</span>' : `$${per.toFixed(4)}`}
        <span class="bar"><span style="width:${per === null ? 0 : (per / maxPer) * 100}%"></span></span></td>
    </tr>`;
  }).join('\n');

  const modelRows = Object.entries(d.costByModel)
    .sort((a, b) => b[1] - a[1])
    .map(([model, cost]) => `<tr>
      <td class="mono">${esc(model)}</td>
      <td class="num">$${cost.toFixed(4)}</td>
      <td class="num">${d.anthropicCost > 0 ? ((cost / d.anthropicCost) * 100).toFixed(1) : '0.0'}%
        <span class="bar"><span style="width:${d.anthropicCost > 0 ? (cost / d.anthropicCost) * 100 : 0}%"></span></span></td>
    </tr>`).join('\n');

  const tokenRows = ([
    ['Uncached input', d.tokens.uncachedInput],
    ['Cache write (5m)', d.tokens.cacheWrite5m],
    ['Cache write (1h)', d.tokens.cacheWrite1h],
    ['Cache read', d.tokens.cacheRead],
    ['Output', d.tokens.output],
  ] as [string, number][]).map(([label, n]) =>
    `<tr><td>${esc(label)}</td><td class="num">${n.toLocaleString()}</td></tr>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cost per item — ${esc(d.start.toISOString().split('T')[0])} to ${esc(d.end.toISOString().split('T')[0])}</title>
<style>
  :root { color-scheme: light dark;
    --bg:#f8fafc; --fg:#1e293b; --dim:#64748b; --line:#e2e8f0; --panel:#fff; --accent:#2563eb; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0f172a; --fg:#e2e8f0; --dim:#94a3b8; --line:#1e293b; --panel:#1e293b; --accent:#60a5fa; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:32px 20px; background:var(--bg); color:var(--fg);
    font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  main { max-width: 940px; margin: 0 auto; }
  h1 { font-size:20px; margin:0 0 4px; }
  h2 { font-size:15px; margin:32px 0 10px; font-weight:600; }
  .sub { color:var(--dim); margin-bottom:24px; font-size:13px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:14px 16px; }
  .card .label { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  .card .value { font-size:24px; font-weight:600; margin-top:4px; }
  .card .note { color:var(--dim); font-size:12px; margin-top:2px; }
  table { width:100%; border-collapse:collapse; background:var(--panel);
    border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  th { text-align:left; font-size:12px; color:var(--dim); font-weight:600;
    padding:9px 12px; border-bottom:1px solid var(--line); text-transform:uppercase; letter-spacing:.04em; }
  td { padding:9px 12px; border-bottom:1px solid var(--line); vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  .num { text-align:right; white-space:nowrap; }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; }
  .dim { color:var(--dim); }
  .bar { display:block; height:3px; background:var(--line); border-radius:2px; margin-top:5px; }
  .bar > span { display:block; height:100%; background:var(--accent); border-radius:2px; }
  .warn { background:var(--panel); border:1px solid var(--accent); border-left-width:3px;
    border-radius:6px; padding:11px 14px; margin-bottom:12px; font-size:13px; }
  .scroll { overflow-x:auto; }
  footer { color:var(--dim); font-size:12px; margin-top:32px; line-height:1.7; }
</style></head><body><main>

<h1>Cost per item</h1>
<div class="sub">${esc(d.start.toISOString())} → ${esc(d.end.toISOString())} (UTC) · ${esc(d.keyLabel)}</div>

${d.warnings.map(w => `<div class="warn"><strong>Warning:</strong> ${esc(w)}</div>`).join('\n')}

<div class="cards">
  ${card('Cost per item', perItem === null ? '—' : `$${perItem.toFixed(4)}`,
    d.excludeTrial ? 'paid items only' : 'all items incl. trial')}
  ${card('Total AI cost', `$${totalCost.toFixed(2)}`, d.openai ? 'Anthropic + OpenAI' : 'Anthropic only')}
  ${card('Items created', d.totalItems.toLocaleString(), `${d.paidItems} paid · ${d.trialItems} trial`)}
  ${card('Share of org bill', share === null ? '—' : `${share.toFixed(1)}%`,
    d.billedOrgWide === null ? 'run with --check' : `org billed $${d.billedOrgWide.toFixed(2)}`)}
</div>

<h2>By day</h2>
<div class="scroll"><table>
  <tr><th>Day</th><th class="num">Items</th><th class="num">AI cost</th><th class="num">Cost / item</th></tr>
  ${dayRows || '<tr><td colspan="4" class="dim">No data in this window.</td></tr>'}
</table></div>

<h2>By model</h2>
<div class="scroll"><table>
  <tr><th>Model</th><th class="num">Cost</th><th class="num">Share</th></tr>
  ${modelRows || '<tr><td colspan="3" class="dim">No Anthropic usage in this window.</td></tr>'}
</table></div>

<h2>Tokens</h2>
<div class="scroll"><table>
  <tr><th>Class</th><th class="num">Tokens</th></tr>
  ${tokenRows}
</table></div>

<footer>
  Cost is read from the provider APIs, not from our own telemetry &mdash; the Firestore
  <code>ai_generation</code> records omit cache tokens entirely and never saw an embedding.
  Spend is scoped by <em>API key</em>, not by item, so this is a blended all-in average
  across every Claude call on the selected key (scope-gate routing, judge, spec generation
  included); it cannot be split per language or per item.
  ${d.openai ? '' : `OpenAI spend excluded &mdash; ${esc(d.openaiError ?? 'no admin key set')}.`}
  <br>Generated ${esc(new Date().toISOString())} by <code>scripts/cost-per-item.ts</code>.
</footer>

</main></body></html>`;
}

// ---------------------------------------------------------------- main

const usd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;
const num = (n: number) => n.toLocaleString();
const pad = (label: string) => label.padEnd(23);

async function main() {
  const opts = parseArgs(process.argv);
  const { start, end } = resolveWindow(opts);

  if (!ANTHROPIC_ADMIN_KEY) throw new Error('ANTHROPIC_ADMIN_KEY not set');
  if (!ANTHROPIC_API_KEY && !opts.allKeys) {
    throw new Error('ANTHROPIC_API_KEY not set (needed to scope usage to the console key; pass --all-keys to skip)');
  }

  console.error(`Window: ${start.toISOString()} → ${end.toISOString()}`);

  // Resolve which keys count as the console. Deliberately no silent fall-back
  // to org-wide usage: that would swap console spend for everything the org
  // spends and inflate cost-per-item with no visible signal.
  let keys: OrgKey[] = [];
  if (!opts.allKeys) {
    console.error('Resolving Anthropic API key(s)...');
    keys = selectKeys(await listApiKeys(), opts.keys);
    for (const k of keys) console.error(`  key: ${k.name} (${k.id})`);
  } else {
    console.error('WARNING: --all-keys — using ORG-WIDE Anthropic spend, not just the console.');
  }

  console.error('Fetching Anthropic usage...');
  const { byModel, daily, reportedThrough } = await fetchAnthropicUsage(start, end, keys.map(k => k.id));

  let billedOrgWide: number | null = null;
  if (opts.check) {
    console.error('Fetching org-wide billed cost...');
    billedOrgWide = await fetchAnthropicBilled(start, end);
  }

  console.error('Fetching OpenAI costs...');
  let openai: OpenAiCost | null = null;
  let openaiError: string | null = null;
  try {
    openai = await fetchOpenAiCost(start, end);
  } catch (err: any) {
    openaiError = err.message;
  }

  let perItem: PerItem | null = null;
  if (opts.perItem) {
    console.error('Attributing cost per item...');
    perItem = await fetchPerItem(start, end);
  }

  console.error('Counting items...');
  const [items, trial] = await Promise.all([
    countItems(start, end),
    countTrialItems(start, end),
  ]);
  const totalItems = items.total;
  const trialItems = trial.total;

  // Price each model at its own rate against the same window, so an intro rate
  // that expires mid-window is applied as of the window's end.
  const costByModel: Record<string, number> = {};
  const totals = emptyTokens();
  for (const [model, t] of Object.entries(byModel)) {
    costByModel[model] = usdCostFromReport(t, model, end);
    totals.uncachedInput += t.uncachedInput;
    totals.cacheWrite5m += t.cacheWrite5m;
    totals.cacheWrite1h += t.cacheWrite1h;
    totals.cacheRead += t.cacheRead;
    totals.output += t.output;
    totals.webSearches += t.webSearches;
  }

  const anthropicCost = Object.values(costByModel).reduce((a, b) => a + b, 0);
  const openaiCost = openai ? openai.embeddings : 0;
  const totalCost = anthropicCost + openaiCost;

  const paidItems = Math.max(0, totalItems - trialItems);
  const denominator = opts.excludeTrial ? paidItems : totalItems;

  // Two ways this report can read plausibly but be wrong; both are silent
  // unless called out, and both produce an understated cost per item.
  const warnings: string[] = [];
  if (!reportedThrough) {
    warnings.push(
      `Anthropic returned no usage buckets at all for this window. The usage report ` +
      `lags by hours, so a window covering only today is normally empty — end the ` +
      `window at yesterday for a settled figure.`,
    );
  } else if (end.getTime() - reportedThrough.getTime() > 3_600_000) {
    warnings.push(
      `Anthropic usage is only reported through ${reportedThrough.toISOString()}, ` +
      `but the window runs to ${end.toISOString()}. The report lags by hours, so ` +
      `recent spend is missing while recent items are already counted — this ` +
      `understates cost per item. End the window at yesterday for a settled figure.`,
    );
  }
  if (anthropicCost === 0 && totalItems > 0) {
    warnings.push(
      `${totalItems} item(s) were created but the selected key(s) show no Anthropic ` +
      `spend. Either the window is entirely inside the reporting lag, or the ` +
      `deployed service uses a different API key than the one selected — check ` +
      `--key / ANTHROPIC_CONSOLE_KEY_IDS against --all-keys.`,
    );
  }

  // Per-day series for the HTML view. Built from the union of every day that
  // has either spend or items, so a day with one and not the other still shows.
  const dayKeys = Array.from(new Set([
    ...Object.keys(daily),
    ...Object.keys(items.byDay),
    ...Object.keys(openai?.daily ?? {}),
  ])).sort();
  const rows: DayRow[] = dayKeys.map(day => ({
    day,
    items: items.byDay[day] || 0,
    trial: trial.byDay[day] || 0,
    anthropic: Object.entries(daily[day] || {})
      .reduce((sum, [model, t]) => sum + usdCostFromReport(t, model, end), 0),
    openai: openai?.daily[day] || 0,
  }));

  if (opts.output) {
    const html = generateHtml({
      start, end,
      keyLabel: opts.allKeys ? 'all keys (org-wide)' : keys.map(k => k.name).join(', '),
      totalItems, trialItems, paidItems, denominator, excludeTrial: opts.excludeTrial,
      tokens: totals, costByModel, anthropicCost, billedOrgWide, openai, openaiError,
      rows, warnings,
    });
    writeFileSync(opts.output, html, 'utf-8');
    console.error(`Wrote ${opts.output}`);
  }

  if (opts.json) {
    console.log(JSON.stringify({
      window: { start: start.toISOString(), end: end.toISOString() },
      daily: rows,
      reportedThrough: reportedThrough?.toISOString() ?? null,
      warnings,
      apiKeys: opts.allKeys ? 'all' : keys.map(k => ({ id: k.id, name: k.name })),
      items: { total: totalItems, trial: trialItems, paid: paidItems, denominator },
      tokens: totals,
      cost: {
        anthropic: anthropicCost,
        anthropicByModel: costByModel,
        anthropicBilledOrgWide: billedOrgWide,
        openaiEmbeddings: openai?.embeddings ?? null,
        openaiOther: openai?.other ?? null,
        openaiError,
        total: totalCost,
      },
      perItem: perItem ? (() => {
        const costs = Array.from(perItem.byItem.values()).map(v => v.usd).sort((a, b) => a - b);
        return {
          records: perItem.records,
          legacyRecords: perItem.records - perItem.instrumented,
          itemsWithCost: costs.length,
          attributedCost: perItem.attributedCost,
          unattributedCost: perItem.unattributedCost,
          unattributedRecords: perItem.unattributedRecords,
          mean: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null,
          median: costs.length ? quantile(costs, 0.5) : null,
          p90: costs.length ? quantile(costs, 0.9) : null,
          min: costs.length ? costs[0] : null,
          max: costs.length ? costs[costs.length - 1] : null,
        };
      })() : null,
      costPerItem: denominator > 0 ? {
        total: totalCost / denominator,
        anthropic: anthropicCost / denominator,
        openai: openaiCost / denominator,
      } : null,
    }, null, 2));
    process.exit(0);
  }

  const label = `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
  console.log(`\n=== Cost per item — ${label} (UTC) ===`);
  console.log(`${pad('Items created')}: ${num(totalItems)}`);
  console.log(`${pad('  paid accounts')}: ${num(paidItems)}`);
  console.log(`${pad('  free-plan trial')}: ${num(trialItems)}`);

  const keyLabel = opts.allKeys
    ? 'ALL KEYS — org-wide'
    : `key${keys.length > 1 ? 's' : ''}: ${keys.map(k => k.name).join(', ')}`;
  console.log(`\nAnthropic (${keyLabel})`);
  console.log(`${pad('  uncached input')}: ${num(totals.uncachedInput)} tok`);
  console.log(`${pad('  cache write 5m/1h')}: ${num(totals.cacheWrite5m)} / ${num(totals.cacheWrite1h)} tok`);
  console.log(`${pad('  cache read')}: ${num(totals.cacheRead)} tok`);
  console.log(`${pad('  output')}: ${num(totals.output)} tok`);
  if (totals.webSearches > 0) {
    console.log(`${pad('  web searches')}: ${num(totals.webSearches)} (not priced here)`);
  }
  console.log(`${pad('  cost')}: ${usd(anthropicCost)}`);
  if (billedOrgWide !== null) {
    const share = billedOrgWide > 0 ? ((anthropicCost / billedOrgWide) * 100).toFixed(1) : '—';
    console.log(`${pad('  org-wide billed')}: ${usd(billedOrgWide)}  (selected keys = ${share}% of the bill)`);
  }

  if (openai) {
    console.log(`${pad('OpenAI (embeddings)')}: ${usd(openai.embeddings)}`);
    if (openai.other > 0) {
      console.log(`${pad('OpenAI (other)')}: ${usd(openai.other)}  (excluded from cost per item)`);
    }
  } else {
    console.log(`${pad('OpenAI')}: excluded — ${openaiError ?? 'no key set'}`);
  }

  console.log(`${' '.repeat(25)}--------`);
  console.log(`${pad('Total AI cost')}: ${usd(totalCost)}${openai ? '' : ' (Anthropic only)'}`);

  if (denominator > 0) {
    console.log(`\n${pad('Cost per item')}: ${usd(totalCost / denominator)}${opts.excludeTrial ? '  (paid items only)' : ''}`);
    console.log(`${pad('  Anthropic')}: ${usd(anthropicCost / denominator)}`);
    if (openai) console.log(`${pad('  OpenAI')}: ${usd(openaiCost / denominator)}`);
  } else {
    console.log(`\nNo items created in this window — cost per item undefined.`);
  }

  const ranked = Object.entries(costByModel).sort((a, b) => b[1] - a[1]);
  if (ranked.length > 0 && anthropicCost > 0) {
    console.log(`\nBy model`);
    const w = Math.max(...ranked.map(([m]) => m.length));
    for (const [model, cost] of ranked) {
      const share = ((cost / anthropicCost) * 100).toFixed(1).padStart(5);
      console.log(`  ${model.padEnd(w)}: ${usd(cost).padStart(9)}  (${share}%)`);
    }
  }

  if (perItem) {
    const costs = Array.from(perItem.byItem.values()).map(v => v.usd).sort((a, b) => a - b);
    const gens = Array.from(perItem.byItem.values()).reduce((s, v) => s + v.gens, 0);
    const legacy = perItem.records - perItem.instrumented;

    console.log(`\nPer-item attribution`);
    console.log(`${pad('  generation records')}: ${num(perItem.records)}${
      legacy > 0 ? ` (${num(legacy)} legacy — pre-attribution, no cost recorded)` : ''}`);
    console.log(`${pad('  items with cost')}: ${num(costs.length)} · ${usd(perItem.attributedCost)} attributed`);
    if (perItem.unattributedRecords > 0) {
      console.log(`${pad('  unattributed')}: ${num(perItem.unattributedRecords)} gen(s) · ${usd(perItem.unattributedCost)}` +
        `  (never became an item — failed, or created outside the window)`);
    }
    // Per-item costs are counted client-side off the SSE stream, whereas the
    // headline figure comes from the provider's own usage report. They measure
    // the same spend two different ways, so their ratio is a live check on the
    // instrumentation: far from 100% means the stream accounting is off (double
    // counting message_start and message_delta, or missing the fix passes) —
    // not that the provider is wrong.
    const recorded = perItem.attributedCost + perItem.unattributedCost;
    if (recorded > 0 && anthropicCost > 0) {
      const ratio = (recorded / anthropicCost) * 100;
      const flag = ratio > 115 || ratio < 60 ? '  <-- CHECK: stream accounting may be off' : '';
      console.log(`${pad('  recorded vs provider')}: ${usd(recorded)} vs ${usd(anthropicCost)} = ${ratio.toFixed(1)}%${flag}`);
    }

    if (costs.length > 0) {
      const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
      console.log(`${pad('  mean')}: ${usd(mean)}`);
      console.log(`${pad('  median')}: ${usd(quantile(costs, 0.5))}`);
      console.log(`${pad('  p90')}: ${usd(quantile(costs, 0.9))}`);
      console.log(`${pad('  min / max')}: ${usd(costs[0])} / ${usd(costs[costs.length - 1])}`);
      console.log(`${pad('  generations per item')}: ${(gens / costs.length).toFixed(2)}`);
    } else {
      console.log(`  No attributed items yet. Per-item attribution only sees generations`);
      console.log(`  recorded after it shipped — run some generations, then re-run this.`);
    }
  }

  for (const w of warnings) console.log(`\nWARNING: ${w}`);

  console.log('');
  // Firestore keeps a handle open; exit rather than hang.
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
