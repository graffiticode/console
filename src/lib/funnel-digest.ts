// Hourly funnel digest: read the period's events out of Cloud Logging, roll
// them up, and render one SMS.
//
// A scheduled PULL rather than a push pipeline. Every service already writes its
// events to Cloud Logging as JSON lines (console via src/lib/funnel-events.ts,
// mcp-service via its own src/events.ts, app.graffiticode.org for artifact
// views), so reading them back on a timer needs no log sink, no Pub/Sub topic,
// and no per-event alerting state. Cloud Scheduler runs it at :02 past each hour
// from 8am to 8pm PT — see src/pages/api/internal/funnel-digest.ts.
//
// We call the Logging REST API directly (fetch + metadata-server token) rather
// than @google-cloud/logging, for the reason documented on generation-queue.ts:
// the SDKs load runtime config that Next standalone output-tracing doesn't
// bundle, which 500s the route.

import { getFirestore } from "../utils/db";
import { getAccessToken } from "./gcp-token";

const PROJECT =
  process.env.GENERATION_QUEUE_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  "graffiticode-app";

const TZ = "America/Los_Angeles";

/**
 * When true, a report covers everything since the last one actually sent, so the
 * 8am report carries the whole overnight rather than just 7-8am and nothing can
 * fall through the gap between schedules. Set false for strict 1-hour windows.
 */
const COVER_SINCE_LAST_REPORT = true;

/** Ingestion lag guard: never read closer to now than this. */
const INGEST_LAG_MS = 60_000;

/** Bound a runaway read. Exceeding this is reported, never silently dropped. */
const MAX_PAGES = 20;
const PAGE_SIZE = 1000;

const STATE_DOC = "alert-state/digest";
const SEEN_DOC = "alert-state/seen";

export interface LogEvent {
  ev: string;
  t?: string;
  session?: string;
  auth?: string;
  [key: string]: unknown;
}

// --- Cloud Logging ----------------------------------------------------------

/**
 * Fetch every `ev`-bearing log entry in [from, to). Returns the events plus
 * whether the page cap truncated the read.
 */
export async function fetchEvents(
  from: Date,
  to: Date,
): Promise<{ events: LogEvent[]; truncated: boolean }> {
  const token = await getAccessToken();
  const filter = [
    `timestamp >= "${from.toISOString()}"`,
    `timestamp < "${to.toISOString()}"`,
    `jsonPayload.ev:*`,
  ].join(" AND ");

  const events: LogEvent[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const res = await fetch("https://logging.googleapis.com/v2/entries:list", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resourceNames: [`projects/${PROJECT}`],
        filter,
        orderBy: "timestamp asc",
        pageSize: PAGE_SIZE,
        ...(pageToken ? { pageToken } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`logging entries:list failed: ${res.status} ${text.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      entries?: Array<{ jsonPayload?: LogEvent }>;
      nextPageToken?: string;
    };
    for (const entry of json.entries ?? []) {
      if (entry.jsonPayload?.ev) events.push(entry.jsonPayload);
    }
    pageToken = json.nextPageToken;
    pages++;
  } while (pageToken && pages < MAX_PAGES);

  return { events, truncated: !!pageToken };
}

// --- Aggregation ------------------------------------------------------------

export interface Digest {
  from: Date;
  to: Date;
  truncated: boolean;
  sessions: {
    total: number;
    byClient: Record<string, number>;
    newClientKinds: string[];
    newGeos: string[];
  };
  items: { ok: number; failed: number; byApp: Record<string, number>; firstForAccount: number };
  /**
   * Language use. `created` counts items that actually compiled; `attempted`
   * counts tool calls naming that language. The gap between them is the
   * language's failure rate — which is why they're kept apart rather than
   * summed. Keys are normalized to "L0166" form; events carry both spellings
   * (item docs store "0166", MCP tool args pass "L0166").
   */
  languages: { created: Record<string, number>; attempted: Record<string, number> };
  walls: Record<string, number>;
  claims: { count: number; transferred: number };
  signups: { direct: number; viaClaim: number };
  plans: Array<{ from?: string; to?: string; reason?: string }>;
  overageRaised: number;
  apiKeys: number;
  context: {
    edits: number;
    views: number;
    toolCalls: number;
    connectsWithoutUse: number;
    claimViews: number;
    checkoutAbandoned: number;
    genFailures: number;
    budgetThreshold?: number;
  };
}

function bump(map: Record<string, number>, key: string | undefined, by = 1): void {
  if (!key) return;
  map[key] = (map[key] ?? 0) + by;
}

/** "0166" and "L0166" are the same language; item docs use one, MCP args the other. */
function langKey(v: unknown): string | undefined {
  if (typeof v !== "string" || !v) return undefined;
  const t = v.trim();
  return /^\d+$/.test(t) ? `L${t}` : t.toUpperCase();
}

/**
 * Roll events into the digest shape.
 *
 * `seen` carries the client kinds and countries observed in every prior period,
 * so novelty is a diff computed here rather than something each emitter has to
 * track. It is mutated with anything new, and the caller persists it.
 */
export function aggregate(
  events: LogEvent[],
  window: { from: Date; to: Date; truncated: boolean },
  seen: { clientKinds: Set<string>; geos: Set<string> },
): Digest {
  const d: Digest = {
    from: window.from,
    to: window.to,
    truncated: window.truncated,
    sessions: { total: 0, byClient: {}, newClientKinds: [], newGeos: [] },
    items: { ok: 0, failed: 0, byApp: {}, firstForAccount: 0 },
    languages: { created: {}, attempted: {} },
    walls: {},
    claims: { count: 0, transferred: 0 },
    signups: { direct: 0, viaClaim: 0 },
    plans: [],
    overageRaised: 0,
    apiKeys: 0,
    context: {
      edits: 0,
      views: 0,
      toolCalls: 0,
      connectsWithoutUse: 0,
      claimViews: 0,
      checkoutAbandoned: 0,
      genFailures: 0,
    },
  };

  // Session-level joins: a connect that never produced a tool call is a probe,
  // and a checkout that never produced a plan change was abandoned.
  const connected = new Set<string>();
  const used = new Set<string>();
  const checkoutStarted = new Set<string>();
  const planChanged = new Set<string>();
  // session id -> the client kind / geo it presented, deduped.
  const started = new Map<string, { kind: string; geo?: string }>();

  for (const e of events) {
    const session = typeof e.session === "string" ? e.session : undefined;
    switch (e.ev) {
      case "mcp_connect":
        if (session) connected.add(session);
        break;

      case "mcp_tool":
        d.context.toolCalls++;
        if (session) used.add(session);
        // Only authoring tools carry a language; reads (get_item, render_item,
        // list_languages) don't, so this counts attempts to BUILD something.
        bump(d.languages.attempted, langKey(e.lang));
        if (e.outcome === "generation_failed") d.context.genFailures++;
        break;

      case "mcp_session_started": {
        // Collected, not counted. The event fires once per server instance, and
        // one transport session can outlive or re-create that instance (Cloud
        // Run scaling, a host that re-binds mid-conversation). Deduping by
        // session id downstream makes the count right either way, where
        // incrementing here would report the same person twice.
        started.set(session ?? `anon:${started.size}`, {
          kind: typeof e.client_kind === "string" ? e.client_kind : "unknown",
          geo: typeof e.geo_country === "string" ? e.geo_country : undefined,
        });
        if (session) used.add(session);
        break;
      }

      case "item_created":
        d.items.ok++;
        bump(d.items.byApp, typeof e.app === "string" ? e.app : "console");
        bump(d.languages.created, langKey(e.lang));
        if (e.first_for_account) d.items.firstForAccount++;
        break;

      case "item_updated":
        d.context.edits++;
        break;

      case "item_generation_failed":
        d.items.failed++;
        break;

      case "wall_hit":
        bump(d.walls, typeof e.wall === "string" ? e.wall : "unknown");
        break;

      case "claim":
        if (e.outcome === "ok") {
          d.claims.count++;
          d.claims.transferred += Number(e.transferred) || 0;
        }
        break;

      case "claim_view":
        d.context.claimViews++;
        break;

      case "artifact_view":
        d.context.views++;
        break;

      case "signup":
        if (e.via === "claim") d.signups.viaClaim++;
        else d.signups.direct++;
        break;

      case "plan_changed":
        d.plans.push({
          from: typeof e.from === "string" ? e.from : undefined,
          to: typeof e.to === "string" ? e.to : undefined,
          reason: typeof e.reason === "string" ? e.reason : undefined,
        });
        if (session) planChanged.add(session);
        break;

      case "checkout_started":
        if (session) checkoutStarted.add(session);
        break;

      case "overage_limit_raised":
        d.overageRaised++;
        break;

      case "api_key_created":
        d.apiKeys++;
        break;

      case "free_plan_budget":
        d.context.budgetThreshold = Number(e.threshold) || undefined;
        break;
    }
  }

  // One session = one distinct id that actually used a tool, however many
  // start events it produced. Novelty is diffed here, after the dedupe, so a
  // repeated start event can't announce the same client kind twice.
  d.sessions.total = started.size;
  for (const { kind, geo } of started.values()) {
    bump(d.sessions.byClient, kind);
    if (kind !== "unknown" && !seen.clientKinds.has(kind)) {
      seen.clientKinds.add(kind);
      d.sessions.newClientKinds.push(kind);
    }
    if (geo && !seen.geos.has(geo)) {
      seen.geos.add(geo);
      d.sessions.newGeos.push(geo);
    }
  }

  for (const s of connected) if (!used.has(s)) d.context.connectsWithoutUse++;
  for (const s of checkoutStarted) if (!planChanged.has(s)) d.context.checkoutAbandoned++;

  return d;
}

/** Calendar date in PT, e.g. "2026-07-27". The unit "first of the day" counts in. */
export function ptDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Send when there was tool activity, or when nothing has been sent yet today.
 *
 * Tool calls are the liveness signal: a period with none is one where no agent
 * did anything, whatever else the counters say. The once-a-day floor means
 * silence is unambiguous — exactly one message arrives on a dead day, so no
 * message at all means the job itself is broken.
 *
 * Keyed on the last sent PT date rather than a fixed hour, so a run that fails
 * or a schedule that shifts can't skip the day's only report.
 */
export function shouldSend(d: Digest, state: DigestState, now = new Date()): boolean {
  if (d.context.toolCalls > 0) return true;
  return state.lastSentDate !== ptDate(now);
}

// --- Formatting -------------------------------------------------------------

function ptTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function plural(n: number): string {
  return n === 1 ? "" : "s";
}

/**
 * "claude-ai 2, cursor 1" — highest first, tail collapsed so the SMS stays short.
 *
 * Only for breakdowns where a long tail is noise (walls, surfaces). NEVER for
 * client kinds: which agents showed up is the point, and collapsing the 4th into
 * "+1 other" hides exactly the arrival worth knowing about. Use clientList().
 */
function breakdown(map: Record<string, number>, limit = 3): string {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const head = entries.slice(0, limit).map(([k, v]) => `${k} ${v}`);
  const rest = entries.slice(limit).reduce((sum, [, v]) => sum + v, 0);
  if (rest > 0) head.push(`+${rest} other`);
  return head.join(", ");
}

/**
 * Every client kind that showed up, named, never truncated, with ⚑ on the ones
 * seen for the first time.
 *
 * Client names are raw MCP `clientInfo.name` values on purpose — no normalizing
 * families together. "claude-code" and "claude-ai" are different surfaces, and
 * "codex-mcp-client" vs "openai-mcp (Codex)" is a real version difference worth
 * seeing rather than smoothing away.
 */
function clientList(d: Digest): string {
  const isNew = new Set(d.sessions.newClientKinds);
  return Object.entries(d.sessions.byClient)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k, v]) => `${isNew.has(k) ? "⚑" : ""}${k} ${v}`)
    .join(" · ");
}

/**
 * The SMS body: a headline you can read on a lock screen, plus a link to the
 * full report.
 *
 * Deliberately much shorter than formatDigest(). Everything that used to be
 * crammed into the text now lives on the report page, which has room for the
 * breakdowns and doesn't pay per character. What stays is the shape of the
 * hour — enough to decide whether to tap.
 */
export function formatSms(d: Digest, url?: string): string {
  const head: string[] = [`${d.context.toolCalls} tool call${plural(d.context.toolCalls)}`];
  if (d.sessions.total) head.push(`${d.sessions.total} session${plural(d.sessions.total)}`);
  if (d.items.ok) head.push(`${d.items.ok} item${plural(d.items.ok)}`);

  const lines = [`GC ${ptTime(d.from)}–${ptTime(d.to)} PT`, head.join(" · ")];

  // Every client that showed up, in full. Which agents are reaching us is the
  // headline question this whole thing exists to answer, so it is never elided
  // even when that costs a segment.
  const clients = clientList(d);
  if (clients) lines.push(`▶ ${clients}`);

  // Money and conversion are the two things worth surfacing before the tap.
  const flags: string[] = [];
  if (d.claims.count) flags.push(`★ ${d.claims.count} claim${plural(d.claims.count)}`);
  if (d.signups.direct) flags.push(`★ ${d.signups.direct} signup${plural(d.signups.direct)}`);
  if (d.plans.length) flags.push(`$ ${d.plans.length} plan change${plural(d.plans.length)}`);
  if (flags.length) lines.push(flags.join(" · "));

  if (d.context.toolCalls === 0 && !flags.length && !clients) lines.push("quiet");
  if (url) lines.push(url);

  return lines.join("\n");
}

export function formatDigest(d: Digest): string {
  const lines: string[] = [`GC ${ptTime(d.from)}–${ptTime(d.to)} PT`];

  if (d.sessions.total > 0) {
    let line = `▶ ${d.sessions.total} session${plural(d.sessions.total)}`;
    const parts = clientList(d);
    if (parts) line += ` — ${parts}`;
    if (d.sessions.newGeos.length) line += ` ⚑geo ${d.sessions.newGeos.join("/")}`;
    lines.push(line);
  }

  if (d.items.ok > 0 || d.items.failed > 0) {
    let line = `✎ ${d.items.ok} item${plural(d.items.ok)}`;
    if (d.items.failed > 0) line += `, ${d.items.failed} failed`;
    const parts = breakdown(d.items.byApp);
    if (parts) line += ` — ${parts}`;
    if (d.items.firstForAccount > 0) line += ` ⚑${d.items.firstForAccount} first-ever`;
    lines.push(line);
  }

  const wallTotal = Object.values(d.walls).reduce((a, b) => a + b, 0);
  if (wallTotal > 0) {
    lines.push(`⛔ ${wallTotal} wall${plural(wallTotal)} — ${breakdown(d.walls)}`);
  }

  const conversion: string[] = [];
  if (d.claims.count > 0) {
    conversion.push(
      `${d.claims.count} claim${plural(d.claims.count)}` +
        (d.claims.transferred ? ` (+${d.claims.transferred} items)` : ""),
    );
  }
  if (d.signups.direct > 0) conversion.push(`${d.signups.direct} signup direct`);
  if (d.apiKeys > 0) conversion.push(`${d.apiKeys} api key${plural(d.apiKeys)}`);
  if (conversion.length) lines.push(`★ ${conversion.join(" · ")}`);

  const revenue: string[] = [];
  for (const p of d.plans.slice(0, 4)) {
    const move = p.reason === "cancel_requested"
      ? `cancel req ${p.from ?? "?"}`
      : p.reason === "resume_requested"
        ? `resume ${p.from ?? "?"}`
        : `${p.from ?? "?"}→${p.to ?? "?"}`;
    revenue.push(move);
  }
  if (d.plans.length > 4) revenue.push(`+${d.plans.length - 4} more`);
  if (d.overageRaised > 0) revenue.push(`${d.overageRaised} cap raised`);
  if (revenue.length) lines.push(`$ ${revenue.join(" · ")}`);

  const ctx: string[] = [];
  // Shown alongside the session count on purpose: it's the denominator. If
  // calls only ever equal sessions, hosts are re-binding per call and the ▶
  // number is transports, not people — visible here rather than buried.
  if (d.context.toolCalls) ctx.push(`${d.context.toolCalls} tool call${plural(d.context.toolCalls)}`);
  if (d.context.edits) ctx.push(`${d.context.edits} edit${plural(d.context.edits)}`);
  if (d.context.views) ctx.push(`${d.context.views} view${plural(d.context.views)}`);
  if (d.context.connectsWithoutUse) {
    ctx.push(`${d.context.connectsWithoutUse} connect${plural(d.context.connectsWithoutUse)} w/o use`);
  }
  // A claim-driven signup is the same happening the ★ line already reports, so
  // it's noted here rather than counted twice — but never dropped silently.
  if (d.signups.viaClaim) ctx.push(`${d.signups.viaClaim} signup via claim`);
  if (d.context.claimViews && !d.claims.count) ctx.push(`${d.context.claimViews} claim views, 0 claimed`);
  if (d.context.checkoutAbandoned) ctx.push(`${d.context.checkoutAbandoned} checkout abandoned`);
  if (d.context.genFailures) ctx.push(`${d.context.genFailures} gen fail${plural(d.context.genFailures)}`);
  if (d.context.budgetThreshold) ctx.push(`trial budget ${d.context.budgetThreshold}%`);
  if (ctx.length) lines.push(`· ${ctx.join(", ")}`);

  if (lines.length === 1) lines.push("· quiet — no activity");
  // Never let a cap read as "that was everything".
  if (d.truncated) lines.push(`⚠ read capped at ${MAX_PAGES * PAGE_SIZE} events — counts are floors`);

  return lines.join("\n");
}

// --- Cursor + novelty state -------------------------------------------------

export interface DigestState {
  cursor?: string;
  lastSentAt?: string;
  /** PT calendar date of the last send, for the once-a-day floor. */
  lastSentDate?: string;
}

export async function readState(): Promise<DigestState> {
  const snap = await getFirestore().doc(STATE_DOC).get();
  return snap.exists ? (snap.data() as DigestState) : {};
}

export async function writeState(state: DigestState): Promise<void> {
  await getFirestore().doc(STATE_DOC).set(state, { merge: true });
}

export async function readSeen(): Promise<{ clientKinds: Set<string>; geos: Set<string> }> {
  const snap = await getFirestore().doc(SEEN_DOC).get();
  const data = snap.exists ? snap.data() : {};
  return {
    clientKinds: new Set<string>(data?.clientKinds ?? []),
    geos: new Set<string>(data?.geos ?? []),
  };
}

/**
 * Cached per-day rollup for the report page's 7-day trend.
 *
 * A completed PT day can never change, so re-querying six of them on every page
 * load is pure waste — that was most of the report's 7s render. Only today is
 * live. Counts only; the full aggregate is never stored.
 */
export interface DayRollup {
  toolCalls: number;
  sessions: number;
  items: number;
}

export async function readDayCache(date: string): Promise<DayRollup | null> {
  const snap = await getFirestore().collection("funnel-daily").doc(date).get();
  if (!snap.exists) return null;
  const d = snap.data() || {};
  if (typeof d.toolCalls !== "number") return null;
  return { toolCalls: d.toolCalls, sessions: d.sessions ?? 0, items: d.items ?? 0 };
}

export async function writeDayCache(date: string, roll: DayRollup): Promise<void> {
  await getFirestore()
    .collection("funnel-daily")
    .doc(date)
    .set({ ...roll, cachedAt: new Date().toISOString() }, { merge: true });
}

export async function writeSeen(seen: {
  clientKinds: Set<string>;
  geos: Set<string>;
}): Promise<void> {
  await getFirestore().doc(SEEN_DOC).set(
    { clientKinds: [...seen.clientKinds], geos: [...seen.geos] },
    { merge: true },
  );
}

/**
 * The window to report on.
 *
 * Starts at the last report's end so nothing is missed across a skipped or
 * failed run, and ends short of now so Cloud Logging ingestion lag can't clip
 * the tail. A missing cursor (first ever run) falls back to one hour.
 */
export function resolveWindow(state: DigestState, now = new Date()): { from: Date; to: Date } {
  const to = new Date(now.getTime() - INGEST_LAG_MS);
  const hourAgo = new Date(to.getTime() - 3_600_000);
  if (!COVER_SINCE_LAST_REPORT || !state.cursor) return { from: hourAgo, to };
  const cursor = new Date(state.cursor);
  return { from: Number.isNaN(cursor.getTime()) ? hourAgo : cursor, to };
}
