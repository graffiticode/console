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

/** The hour (PT) whose report always sends, even when the period was empty. */
const HEARTBEAT_HOUR = 8;

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

/** True when nothing worth reporting happened. */
export function isEmpty(d: Digest): boolean {
  return (
    d.sessions.total === 0 &&
    d.items.ok === 0 &&
    d.items.failed === 0 &&
    Object.keys(d.walls).length === 0 &&
    d.claims.count === 0 &&
    d.signups.direct === 0 &&
    d.signups.viaClaim === 0 &&
    d.plans.length === 0 &&
    d.overageRaised === 0 &&
    d.apiKeys === 0 &&
    d.context.edits === 0 &&
    d.context.views === 0 &&
    d.context.toolCalls === 0
  );
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

export function ptHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hour12: false }).format(date),
  );
}

function plural(n: number): string {
  return n === 1 ? "" : "s";
}

/** "claude-ai 2, cursor 1" — highest first, tail collapsed so the SMS stays short. */
function breakdown(map: Record<string, number>, limit = 3): string {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const head = entries.slice(0, limit).map(([k, v]) => `${k} ${v}`);
  const rest = entries.slice(limit).reduce((sum, [, v]) => sum + v, 0);
  if (rest > 0) head.push(`+${rest} other`);
  return head.join(", ");
}

export function formatDigest(d: Digest): string {
  const lines: string[] = [`GC ${ptTime(d.from)}–${ptTime(d.to)} PT`];

  if (d.sessions.total > 0) {
    let line = `▶ ${d.sessions.total} session${plural(d.sessions.total)}`;
    const parts = breakdown(d.sessions.byClient);
    if (parts) line += ` — ${parts}`;
    if (d.sessions.newClientKinds.length) line += ` ⚑new ${d.sessions.newClientKinds.join("/")}`;
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

interface DigestState {
  cursor?: string;
  lastSentAt?: string;
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

/** The 8am PT report always sends, so silence there means the job is broken. */
export function isHeartbeatRun(now = new Date()): boolean {
  return ptHour(now) === HEARTBEAT_HOUR;
}
