#!/usr/bin/env node

// What would it cost to produce one item at today's prices?
//
//   npx tsx scripts/cost-per-item.ts --period week
//
// Cost is OUR recorded token counts priced with MODEL_RATES — never what a
// provider billed. The question is forward-looking: the same tokens, on the
// same models, at the `--as-of` rate card (today by default), because rates
// move on their own and the decision this informs is whether the current
// per-item rates are profitable. What we were billed historically answers a
// different question and is deliberately absent.
//
// Every `ai_generation` doc in the window is priced and divided by the items
// created in it, so numerator and denominator come from the SAME population.
// An earlier version took the numerator from one API key's provider-reported
// spend and the denominator from all items; that mismatch reported cost per
// item as $0.0632 and then $0.1950 when the defensible figure was $0.0503.
//
// Consequently this script calls NO provider API and needs no admin keys.
// Nothing here checks whether our token counts are COMPLETE — that is a
// separate measurement audit against the provider's metered totals, designed
// under "Known follow-ups" in docs/item-based-pricing.md.
//
// Requires: GRAFFITICODE_APP_CREDENTIALS.

import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { estimateUsdCost, usdCostFromReport } from '../src/lib/model-pricing';
import { PLANS, type PlanId } from '../src/lib/plans-config';

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

// ---------------------------------------------------------------- args

type Period = 'day' | 'week' | 'month';
const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 };

const USAGE = `
Average AI cost to produce one item, for a period.

  npx tsx scripts/cost-per-item.ts [options]

  --period day|week|month   Window ending now, UTC-aligned (default: week)
  --from YYYY-MM-DD         Explicit window start (overrides --period)
  --to YYYY-MM-DD           Explicit window end, inclusive
  --exclude-trial           Divide by paid items only, not free-plan trial items
  --per-item                Also show the per-item cost distribution
                            (mean/median/p90). Only sees generations recorded
                            after per-item attribution shipped.
  --lang <id>               Restrict to a language (0176, L0176 and 176 all work);
                            repeatable, so --lang 0158 --lang 0176 pools a family.
                            Both the cost and the item count are narrowed to it,
                            so cost per item stays a like-for-like ratio.
  --as-of YYYY-MM-DD        Price the SAME tokens on the SAME models at this
                            date's rate card (default: today). Rates move on
                            their own — intro pricing expires, list prices fall —
                            so this asks "are these prices profitable against
                            today's costs", holding usage constant. It is not
                            what we were billed.
  --by-lang                 Average item cost broken down by language. Implies
                            --per-item, since it reads the per-item attribution.
  --output <file.html>      Also write an HTML report (open it in a browser)
  --json                    Emit JSON to stdout (progress goes to stderr)
  --help, -h                Show this

Cost is our own recorded tokens priced with MODEL_RATES; no provider API is
called. Records written before per-item attribution shipped carry no tokens and
are excluded — the script says how many it skipped.

Env: GRAFFITICODE_APP_CREDENTIALS.
`.trim();

interface Opts {
  period: Period;
  from?: string;
  to?: string;
  excludeTrial: boolean;
  perItem: boolean;
  langs: string[];
  output?: string;
  json: boolean;
  /**
   * Rate card to price with. The report answers "what would these same tokens,
   * on these same models, cost at this date's prices" — a forward-looking
   * pricing question, not an accounting one. Defaults to today.
   */
  asOf: Date;
  byLang: boolean;
}

/** Records store a bare 4-digit id ("0176"); accept the L-prefixed and unpadded forms too. */
function normalizeLang(raw: string): string {
  const digits = String(raw).trim().replace(/^L/i, '');
  return /^\d+$/.test(digits) ? digits.padStart(4, '0') : digits;
}

function parseArgs(argv: string[]): Opts {
  const args = argv.slice(2);
  const opts: Opts = {
    period: 'week',
    excludeTrial: false,
    perItem: false,
    langs: [],
    json: false,
    asOf: new Date(),
    byLang: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--period' && args[i + 1]) { opts.period = args[++i] as Period; }
    else if (a === '--from' && args[i + 1]) { opts.from = args[++i]; }
    else if (a === '--to' && args[i + 1]) { opts.to = args[++i]; }
    else if (a === '--exclude-trial') { opts.excludeTrial = true; }
    else if (a === '--per-item') { opts.perItem = true; }
    else if (a === '--lang' && args[i + 1]) { opts.langs.push(normalizeLang(args[++i])); }
    else if (a === '--output' && args[i + 1]) { opts.output = args[++i]; }
    else if (a === '--json') { opts.json = true; }
    else if (a === '--by-lang') { opts.byLang = true; opts.perItem = true; }
    else if (a === '--as-of' && args[i + 1]) {
      const raw = args[++i];
      const d = new Date(`${raw}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) {
        console.error(`Error: --as-of must be YYYY-MM-DD (got "${raw}")`);
        process.exit(1);
      }
      opts.asOf = d;
    }
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
  // Provider spend can't be split by language, so a language scope is only
  // answerable from the attributed records.
  if (opts.langs.length > 0) opts.perItem = true;
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

// ---------------------------------------------------------------- firestore

function toMillis(v: any): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
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
async function countItems(
  start: Date, end: Date, langs: string[] = [],
): Promise<{ total: number; byDay: Record<string, number> }> {
  const snap = await db.collection('usage')
    .where('type', '==', 'item_created')
    .select('createdAt', 'lang')
    .get();

  let total = 0;
  const byDay: Record<string, number> = {};
  for (const doc of snap.docs) {
    const d = doc.data();
    if (langs.length > 0 && !langs.includes(normalizeLang(String(d.lang ?? '')))) continue;
    const ms = toMillis(d.createdAt);
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
  provider: 'anthropic' | 'openai';
  day: string;
  tokens: TokenTotals;
  instrumented: boolean;
}

/** Our own record shape — not the provider's. Cache is split two ways, not by TTL. */
interface TokenTotals {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
}

const emptyTokens = (): TokenTotals => ({ input: 0, output: 0, cacheCreation: 0, cacheRead: 0 });

const addTokens = (into: TokenTotals, t: TokenTotals) => {
  into.input += t.input;
  into.output += t.output;
  into.cacheCreation += t.cacheCreation;
  into.cacheRead += t.cacheRead;
};

interface LangCost { lang: string; items: number; usd: number; }

/**
 * Average item cost per language, dearest first. Attributed items only — a
 * generation that never became an item has no language to charge it to.
 * Shared by the text and HTML views so the two cannot drift apart.
 */
function costByLang(byItem: PerItem['byItem']): LangCost[] {
  const acc = new Map<string, { items: number; usd: number }>();
  for (const v of byItem.values()) {
    const key = v.lang ? `L${normalizeLang(String(v.lang))}` : '(unrecorded)';
    const e = acc.get(key) ?? { items: 0, usd: 0 };
    e.items++; e.usd += v.usd;
    acc.set(key, e);
  }
  return [...acc.entries()]
    .map(([lang, e]) => ({ lang, ...e }))
    .sort((a, b) => b.usd / b.items - a.usd / a.items);
}

interface PerItem {
  records: number;
  instrumented: number;
  attributedCost: number;
  unattributedCost: number;
  unattributedRecords: number;
  byItem: Map<string, { usd: number; gens: number; lang: string | null }>;
  /** Everything below is the window total, attributed or not — the headline's numerator. */
  costByModel: Record<string, number>;
  costByProvider: { anthropic: number; openai: number };
  tokens: TokenTotals;
  byDay: Record<string, { anthropic: number; openai: number }>;
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
async function fetchPerItem(start: Date, end: Date, asOf: Date, langs: string[] = []): Promise<PerItem> {
  const snap = await db.collection('usage')
    .where('type', '==', 'ai_generation')
    .select('createdAt', 'userId', 'itemId', 'generatedTaskId', 'cost', 'lang', 'model', 'tokens', 'provider')
    .get();

  const records: GenRecord[] = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    if (langs.length > 0 && !langs.includes(normalizeLang(String(d.lang ?? '')))) continue;
    const ms = toMillis(d.createdAt);
    if (ms < start.getTime() || ms >= end.getTime()) continue;
    // The frozen figure is kept only to detect legacy records; the cost this
    // report divides is the SAME tokens on the SAME model re-priced at `asOf`.
    const frozen = Number(d.cost?.usd ?? d.cost?.total ?? 0);
    const t = (d.tokens ?? {}) as any;
    const provider = d.provider ?? (/^(gpt|o\d)/.test(String(d.model ?? '')) ? 'openai' : 'anthropic');
    const usd = estimateUsdCost({
      inputTokens: Number(t.input ?? 0),
      outputTokens: Number(t.output ?? 0),
      cacheCreationInputTokens: Number(t.cacheCreation ?? 0),
      cacheReadInputTokens: Number(t.cacheRead ?? 0),
    }, d.model, asOf, provider);
    records.push({
      userId: String(d.userId || ''),
      itemId: d.itemId ?? null,
      taskId: d.generatedTaskId ?? null,
      usd: Number.isFinite(usd) ? usd : 0,
      lang: d.lang ?? null,
      model: d.model ?? null,
      provider,
      day: new Date(ms).toISOString().slice(0, 10),
      tokens: {
        input: Number(t.input ?? 0),
        output: Number(t.output ?? 0),
        cacheCreation: Number(t.cacheCreation ?? 0),
        cacheRead: Number(t.cacheRead ?? 0),
      },
      // A record is instrumented if it has a priced cost (legacy pre-refactor docs)
      // OR it carries the new token-usage shape (stage + tokens from the refactor).
      // Legacy docs carry cost.total, new docs carry stage.
      instrumented: frozen > 0 || Boolean(d.stage) || (d.tokens?.total ?? 0) > 0,
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
    costByModel: {},
    costByProvider: { anthropic: 0, openai: 0 },
    tokens: emptyTokens(),
    byDay: {},
  };

  for (const r of records) {
    if (!r.instrumented) continue;

    // Window totals first: these count every instrumented record, whether or not
    // it resolves to an item, so the headline's numerator and denominator come
    // from one population.
    const model = r.model ?? '(unrecorded)';
    out.costByModel[model] = (out.costByModel[model] ?? 0) + r.usd;
    out.costByProvider[r.provider] += r.usd;
    addTokens(out.tokens, r.tokens);
    const day = (out.byDay[r.day] ??= { anthropic: 0, openai: 0 });
    day[r.provider] += r.usd;

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
  asOf: Date;
  totalItems: number;
  trialItems: number;
  paidItems: number;
  denominator: number;
  excludeTrial: boolean;
  tokens: TokenTotals;
  costByModel: Record<string, number>;
  costByProvider: { anthropic: number; openai: number };
  totalCost: number;
  rows: DayRow[];
  langRows: LangCost[];
  warnings: string[];
}

function generateHtml(d: HtmlInput): string {
  const totalCost = d.totalCost;
  const perItem = d.denominator > 0 ? totalCost / d.denominator : null;

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
      <td class="num">${totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : '0.0'}%
        <span class="bar"><span style="width:${totalCost > 0 ? (cost / totalCost) * 100 : 0}%"></span></span></td>
    </tr>`).join('\n');

  // Same columns, same order, same bar treatment as the By day table, so the
  // two read as one view sliced two ways. Each bar scales to its own column's
  // maximum.
  const maxLangItems = Math.max(...d.langRows.map(l => l.items), 1);
  const maxLangCost = Math.max(...d.langRows.map(l => l.usd), 0.000001);
  const maxLangPer = Math.max(...d.langRows.map(l => l.usd / l.items), 0.000001);
  const langRows = d.langRows.map(l => {
    const per = l.usd / l.items;
    return `<tr>
      <td class="mono">${esc(l.lang)}</td>
      <td class="num">${l.items.toLocaleString()}
        <span class="bar"><span style="width:${(l.items / maxLangItems) * 100}%"></span></span></td>
      <td class="num">$${l.usd.toFixed(4)}
        <span class="bar"><span style="width:${(l.usd / maxLangCost) * 100}%"></span></span></td>
      <td class="num">$${per.toFixed(4)}
        <span class="bar"><span style="width:${(per / maxLangPer) * 100}%"></span></span></td>
    </tr>`;
  }).join('\n');

  const tokenRows = ([
    ['Input', d.tokens.input],
    ['Cache write', d.tokens.cacheCreation],
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
<div class="sub">${esc(d.start.toISOString())} → ${esc(d.end.toISOString())} (UTC) · priced at the ${esc(d.asOf.toISOString().split('T')[0])} rate card</div>

${d.warnings.map(w => `<div class="warn"><strong>Warning:</strong> ${esc(w)}</div>`).join('\n')}

<div class="cards">
  ${card('Cost per item', perItem === null ? '—' : `$${perItem.toFixed(4)}`,
    d.excludeTrial ? 'paid items only' : 'all items incl. trial')}
  ${card('Total AI cost', `$${totalCost.toFixed(2)}`,
    `Anthropic $${d.costByProvider.anthropic.toFixed(2)} · OpenAI $${d.costByProvider.openai.toFixed(2)}`)}
  ${card('Items created', d.totalItems.toLocaleString(), `${d.paidItems} paid · ${d.trialItems} trial`)}
</div>

<h2>By day</h2>
<div class="scroll"><table>
  <tr><th>Day</th><th class="num">Items</th><th class="num">AI cost</th><th class="num">Cost / item</th></tr>
  ${dayRows || '<tr><td colspan="4" class="dim">No data in this window.</td></tr>'}
</table></div>

<h2>By language</h2>
<div class="sub">Attributed items only — a generation that never became an item has no language to charge it to.</div>
<div class="scroll"><table>
  <tr><th>Language</th><th class="num">Items</th><th class="num">AI cost</th><th class="num">Cost / item</th></tr>
  ${langRows || '<tr><td colspan="4" class="dim">No attributed items in this window.</td></tr>'}
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
  Cost is <em>our</em> recorded token counts priced with <code>MODEL_RATES</code> &mdash; not what a
  provider billed. It covers every recorded stage (scope-gate routing, composition, spec generation,
  generation, repair, judge) and can be split per language, per item and per stage.
  Nothing here checks whether those counts are <em>complete</em>; that is a separate audit against the
  provider's metered totals.
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

  console.error(`Window: ${start.toISOString()} → ${end.toISOString()}`);
  console.error(`Rate card: ${opts.asOf.toISOString().split('T')[0]}`);

  // One scan over our own ai_generation records supplies everything: the window
  // total, the per-model and per-provider split, and the per-item attribution.
  console.error('Reading token usage...');
  const perItem = await fetchPerItem(start, end, opts.asOf, opts.langs);

  console.error('Counting items...');
  const [items, trial] = await Promise.all([
    countItems(start, end, opts.langs),
    // The trial counter is a per-day tally with no language dimension, so it
    // can't be narrowed. Zeroed under --lang rather than reported as a subset
    // of a different population.
    opts.langs.length > 0
      ? Promise.resolve({ total: 0, byDay: {} as Record<string, number> })
      : countTrialItems(start, end),
  ]);
  const totalItems = items.total;
  const trialItems = trial.total;

  // Every record we priced, attributed to an item or not. Both halves are real
  // spend, so the headline divides the whole window's cost by the whole window's
  // items rather than silently dropping the unattributed part.
  const { costByModel, costByProvider, tokens: totals } = perItem;
  const totalCost = perItem.attributedCost + perItem.unattributedCost;
  const paidItems = Math.max(0, totalItems - trialItems);
  const denominator = opts.excludeTrial ? paidItems : totalItems;
  const langRows = costByLang(perItem.byItem);

  // The one way this can read plausibly but be wrong: records that predate the
  // token-usage refactor carry no tokens, so they price at nothing. Excluding
  // them is right — they cannot be priced — but it must not be silent.
  const warnings: string[] = [];
  const legacy = perItem.records - perItem.instrumented;
  if (legacy > 0) {
    warnings.push(
      `${legacy} of ${perItem.records} ai_generation record(s) in this window predate the ` +
      `token-usage refactor: they carry no token counts and are excluded from the total, ` +
      `so cost per item is understated for windows reaching back before it shipped.`,
    );
  }
  if (totalCost === 0 && totalItems > 0) {
    warnings.push(
      `${totalItems} item(s) were created but no token usage was recorded for them. ` +
      `Either the generations happened outside this window, or recordTokenUsage is ` +
      `not firing — check that the deployed revision carries the token-usage layer.`,
    );
  }

  // Per-day series for the HTML view. Built from the union of every day that
  // has either spend or items, so a day with one and not the other still shows.
  const dayKeys = Array.from(new Set([
    ...Object.keys(perItem.byDay),
    ...Object.keys(items.byDay),
  ])).sort();
  const rows: DayRow[] = dayKeys.map(day => ({
    day,
    items: items.byDay[day] || 0,
    trial: trial.byDay[day] || 0,
    anthropic: perItem.byDay[day]?.anthropic ?? 0,
    openai: perItem.byDay[day]?.openai ?? 0,
  }));

  if (opts.output) {
    const html = generateHtml({
      start, end,
      asOf: opts.asOf,
      totalItems, trialItems, paidItems, denominator, excludeTrial: opts.excludeTrial,
      tokens: totals, costByModel, costByProvider, totalCost,
      rows, langRows, warnings,
    });
    writeFileSync(opts.output, html, 'utf-8');
    console.error(`Wrote ${opts.output}`);
  }

  if (opts.json) {
    console.log(JSON.stringify({
      window: { start: start.toISOString(), end: end.toISOString() },
      daily: rows,
      asOf: opts.asOf.toISOString(),
      warnings,
      langs: opts.langs.length > 0 ? opts.langs : null,
      items: { total: totalItems, trial: trialItems, paid: paidItems, denominator },
      tokens: totals,
      cost: {
        byModel: costByModel,
        byProvider: costByProvider,
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
        anthropic: costByProvider.anthropic / denominator,
        openai: costByProvider.openai / denominator,
      } : null,
    }, null, 2));
    process.exit(0);
  }

  const label = `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
  const langLabel = opts.langs.length > 0 ? ` · lang ${opts.langs.join('+')}` : '';
  console.log(`\n=== Cost per item — ${label} (UTC)${langLabel} ===`);
  console.log(`${pad('Items created')}: ${num(totalItems)}`);
  console.log(`${pad('  paid accounts')}: ${num(paidItems)}`);
  console.log(`${pad('  free-plan trial')}: ${num(trialItems)}`);

  console.log(`\nTokens recorded (ours, priced at the ${opts.asOf.toISOString().split('T')[0]} rate card)`);
  console.log(`${pad('  input')}: ${num(totals.input)} tok`);
  console.log(`${pad('  cache write / read')}: ${num(totals.cacheCreation)} / ${num(totals.cacheRead)} tok`);
  console.log(`${pad('  output')}: ${num(totals.output)} tok`);
  console.log(`${pad('  generations')}: ${num(perItem.instrumented)}`);
  console.log(`${pad('  Anthropic')}: ${usd(costByProvider.anthropic)}`);
  console.log(`${pad('  OpenAI')}: ${usd(costByProvider.openai)}`);
  console.log(`${' '.repeat(25)}--------`);
  console.log(`${pad('Total AI cost')}: ${usd(totalCost)}`);

  if (denominator > 0) {
    console.log(`\n${pad('Cost per item')}: ${usd(totalCost / denominator)}${opts.excludeTrial ? '  (paid items only)' : ''}`);
    console.log(`${pad('  Anthropic')}: ${usd(costByProvider.anthropic / denominator)}`);
    console.log(`${pad('  OpenAI')}: ${usd(costByProvider.openai / denominator)}`);
  } else {
    console.log(`\nNo items created in this window — cost per item undefined.`);
  }

  const ranked = Object.entries(costByModel).sort((a, b) => b[1] - a[1]);
  if (ranked.length > 0 && totalCost > 0) {
    console.log(`\nBy model`);
    const w = Math.max(...ranked.map(([m]) => m.length));
    for (const [model, cost] of ranked) {
      const share = ((cost / totalCost) * 100).toFixed(1).padStart(5);
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

  if (opts.byLang) {
    console.log(`\nAverage item cost by language (attributed items only)`);
    console.log(`  ${'lang'.padEnd(14)}${'items'.padStart(7)}${'AI cost'.padStart(11)}${'cost/item'.padStart(11)}`);
    for (const e of langRows) {
      console.log(`  ${e.lang.padEnd(14)}${String(e.items).padStart(7)}${usd(e.usd).padStart(11)}${usd(e.usd / e.items).padStart(11)}`);
    }
  }

  // Are the current prices profitable against this cost? The rates come from
  // plans-config, so the table cannot drift from what customers are billed.
  if (opts.langs.length === 0 && denominator > 0) {
    const cpi = totalCost / denominator;
    console.log(`\nMargin at ${usd(cpi)}/item (rate card ${opts.asOf.toISOString().split('T')[0]})`);
    console.log(`  ${'plan'.padEnd(12)}${'$/item'.padStart(9)}${'margin'.padStart(10)}${'profit/item'.padStart(13)}`);
    for (const id of ['demo', 'pro', 'teams', 'platinum'] as PlanId[]) {
      const rate = PLANS[id].overageRatePerItem;
      if (rate == null) continue;
      const margin = ((rate - cpi) / rate) * 100;
      console.log(`  ${PLANS[id].displayName.padEnd(12)}${usd(rate).padStart(9)}${(margin.toFixed(1) + '%').padStart(10)}${usd(rate - cpi).padStart(13)}`);
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
