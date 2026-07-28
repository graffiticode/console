// HTML for the funnel report page (src/pages/api/r/[token].ts).
//
// Rendered as a self-contained string rather than a React page: _app.tsx wraps
// every route except form/editor in AuthWrapper, so a page under src/pages/
// would demand sign-in and defeat the whole point of a signed link you can open
// from a text message. An API route returning text/html bypasses _app entirely.
//
// Mobile-first — this is opened on a phone from an SMS — and styled inline so
// there is no stylesheet request and no dependency on the app's Tailwind build.

import type { Digest } from "./funnel-digest";

export interface DayPoint {
  /** PT calendar date, YYYY-MM-DD. */
  date: string;
  toolCalls: number;
  sessions: number;
  items: number;
  /**
   * False for days before session/item events existed. Those columns are
   * unknown, not zero, and must not render as a measurement.
   */
  instrumented: boolean;
}

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/**
 * Dates on both ends when the window crosses a PT day, otherwise only on the
 * start. A week-long window rendered with the end's time alone reads as a
 * one-hour window on the start date.
 */
function fmtRange(d: Digest): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const day = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(x);
  const endOpts = day(d.from) === day(d.to) ? { ...opts, month: undefined, day: undefined } : opts;
  return `${new Intl.DateTimeFormat("en-US", opts).format(d.from)} – ${new Intl.DateTimeFormat(
    "en-US",
    endOpts,
  ).format(d.to)} PT`;
}

function stat(label: string, value: number | string, hint?: string): string {
  return `<div class="stat"><div class="v">${esc(String(value))}</div><div class="l">${esc(
    label,
  )}</div>${hint ? `<div class="h">${esc(hint)}</div>` : ""}</div>`;
}

function rows(map: Record<string, number>): string {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<p class="none">none</p>`;
  const max = Math.max(...entries.map(([, v]) => v));
  return `<table>${entries
    .map(
      ([k, v]) =>
        `<tr><td class="k">${esc(k)}</td><td class="bar"><span style="width:${
          (v / max) * 100
        }%"></span></td><td class="n">${v}</td></tr>`,
    )
    .join("")}</table>`;
}

function section(title: string, body: string): string {
  return `<section><h2>${esc(title)}</h2>${body}</section>`;
}

/**
 * Language use: items that compiled, with attempts alongside.
 *
 * Bars are sized by attempts, not creations, so a language that was tried a lot
 * and produced nothing still shows up — that gap is the interesting case and
 * sizing by creations would render it as a sliver. A language with attempts but
 * zero creations is flagged.
 */
function languageRows(d: Digest): string {
  const keys = [
    ...new Set([...Object.keys(d.languages.attempted), ...Object.keys(d.languages.created)]),
  ];
  if (!keys.length) return `<p class="none">none</p>`;
  const val = (k: string) => Math.max(d.languages.attempted[k] ?? 0, d.languages.created[k] ?? 0);
  const max = Math.max(1, ...keys.map(val));
  return `<table>${keys
    .sort((a, b) => val(b) - val(a) || a.localeCompare(b))
    .map((k) => {
      const made = d.languages.created[k] ?? 0;
      const tried = d.languages.attempted[k] ?? 0;
      const stalled = tried > 0 && made === 0;
      return `<tr><td class="k">${esc(k)}</td><td class="bar"><span style="width:${
        (val(k) / max) * 100
      }%"${stalled ? ' class="stalled"' : ""}></span></td><td class="n">${made}</td><td class="n dim">${
        tried ? `/${tried}` : "&nbsp;"
      }</td></tr>`;
    })
    .join("")}</table><p class="none">made / attempted</p>`;
}

/** Inline bar chart. Avoids a chart library and the CSP/asset weight one costs. */
function sparkTable(series: DayPoint[]): string {
  if (!series.length) return `<p class="none">no data</p>`;
  const max = Math.max(1, ...series.map((p) => p.toolCalls));
  const anyPre = series.some((p) => !p.instrumented);
  const body = series
    .map(
      (p) =>
        `<tr><td class="k">${esc(p.date.slice(5))}</td><td class="bar"><span style="width:${
          (p.toolCalls / max) * 100
        }%"></span></td><td class="n">${p.toolCalls}</td>` +
        (p.instrumented
          ? `<td class="n dim">${p.sessions}s</td><td class="n dim">${p.items}i</td>`
          : `<td class="n dim">–</td><td class="n dim">–</td>`) +
        `</tr>`,
    )
    .join("");
  return (
    `<table class="trend">${body}</table>` +
    (anyPre ? `<p class="none">– sessions and items not yet instrumented on that day</p>` : "")
  );
}

// Deliberately no "first seen" section. The page aggregates with an empty
// `seen` set so a page load can't consume the next SMS's ⚑new flags, which
// means every client kind and country in the window looks novel here. Rendering
// that would state something false. Novelty belongs to the SMS, which holds the
// real prior state.
function digestBlock(d: Digest): string {
  const conv: string[] = [];
  if (d.claims.count) conv.push(`${d.claims.count} claim (+${d.claims.transferred} items)`);
  if (d.signups.direct) conv.push(`${d.signups.direct} signup direct`);
  if (d.signups.viaClaim) conv.push(`${d.signups.viaClaim} signup via claim`);
  if (d.apiKeys) conv.push(`${d.apiKeys} api key`);
  const plans = d.plans
    .map((p) =>
      p.reason === "cancel_requested"
        ? `cancel requested (${p.from ?? "?"})`
        : p.reason === "resume_requested"
          ? `resumed (${p.from ?? "?"})`
          : `${p.from ?? "?"} → ${p.to ?? "?"}`,
    )
    .join(", ");

  return `
  <div class="stats">
    ${stat("tool calls", d.context.toolCalls)}
    ${stat("sessions", d.sessions.total, `${d.context.connectsWithoutUse} probes filtered`)}
    ${stat("items", d.items.ok, d.items.failed ? `${d.items.failed} failed` : undefined)}
    ${stat("edits", d.context.edits)}
    ${stat("views", d.context.views)}
    ${stat("walls", Object.values(d.walls).reduce((a, b) => a + b, 0))}
  </div>
  ${section("By client", rows(d.sessions.byClient))}
  ${section("By language", languageRows(d))}
  ${section("Items by surface", rows(d.items.byApp))}
  ${section("Walls hit", rows(d.walls))}
  ${section(
    "Conversion",
    conv.length ? `<p class="big">${esc(conv.join(" · "))}</p>` : `<p class="none">none</p>`,
  )}
  ${section("Plan changes", plans ? `<p class="big">${esc(plans)}</p>` : `<p class="none">none</p>`)}
  ${d.truncated ? `<p class="warn">Read capped — counts are floors, not totals.</p>` : ""}`;
}

export function renderReport(input: {
  window: Digest;
  today: Digest;
  series: DayPoint[];
  generatedAt: Date;
}): string {
  const { window, today, series, generatedAt } = input;
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Graffiticode usage — ${esc(fmtRange(window))}</title>
<style>
  :root { color-scheme: light dark; --fg:#111; --dim:#666; --line:#e5e5e5; --bg:#fff; --accent:#2563eb; }
  @media (prefers-color-scheme: dark) {
    :root { --fg:#e8e8e8; --dim:#999; --line:#2a2a2a; --bg:#141414; --accent:#60a5fa; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:16px 14px 48px; background:var(--bg); color:var(--fg);
         font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         max-width:720px; margin-inline:auto; }
  h1 { font-size:17px; margin:0 0 2px; font-weight:600; }
  .sub { color:var(--dim); font-size:13px; margin:0 0 18px; }
  h2 { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--dim);
       margin:22px 0 8px; font-weight:600; }
  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line);
           border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  .stat { background:var(--bg); padding:12px 10px; }
  .stat .v { font-size:24px; font-weight:650; line-height:1.1; }
  .stat .l { font-size:11px; color:var(--dim); text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
  .stat .h { font-size:11px; color:var(--dim); margin-top:3px; }
  table { width:100%; border-collapse:collapse; }
  td { padding:5px 0; font-size:14px; vertical-align:middle; }
  td.k { white-space:nowrap; padding-right:10px; max-width:44%; overflow:hidden; text-overflow:ellipsis; }
  td.n { text-align:right; width:38px; font-variant-numeric:tabular-nums; }
  td.n.dim { color:var(--dim); font-size:12px; width:34px; }
  td.bar { width:100%; }
  td.bar span { display:block; height:7px; border-radius:4px; background:var(--accent); min-width:3px; }
  td.bar span.stalled { background:#dc2626; }
  .none { color:var(--dim); font-size:14px; margin:4px 0; }
  .big { font-size:15px; margin:4px 0; }
  .warn { margin-top:16px; padding:9px 11px; border-radius:6px; font-size:13px;
          background:rgba(220,38,38,.1); color:#dc2626; }
  .tabs { display:flex; gap:6px; margin:20px 0 4px; }
  .tabs a { flex:1; text-align:center; padding:8px; font-size:13px; border:1px solid var(--line);
            border-radius:6px; text-decoration:none; color:var(--fg); }
  hr { border:0; border-top:1px solid var(--line); margin:26px 0 0; }
  footer { color:var(--dim); font-size:12px; margin-top:22px; }
</style>
</head><body>
<h1>Graffiticode usage</h1>
<p class="sub">${esc(fmtRange(window))}</p>
${digestBlock(window)}
<hr>
<h1 style="margin-top:26px">Today so far</h1>
<p class="sub">since 00:00 PT</p>
<div class="stats">
  ${stat("tool calls", today.context.toolCalls)}
  ${stat("sessions", today.sessions.total)}
  ${stat("items", today.items.ok)}
  ${stat("claims", today.claims.count)}
  ${stat("signups", today.signups.direct + today.signups.viaClaim)}
  ${stat("walls", Object.values(today.walls).reduce((a, b) => a + b, 0))}
</div>
<hr>
<h1 style="margin-top:26px">Last 7 days</h1>
<p class="sub">tool calls · sessions · items, by PT day</p>
${sparkTable(series)}
<footer>Generated ${esc(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(generatedAt),
  )} PT · link expires 30 days after issue</footer>
</body></html>`;
}

export function renderInvalid(): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Link not valid</title>
<style>
 :root { color-scheme: light dark; }
 body { margin:0; display:grid; place-items:center; min-height:100vh; padding:24px;
        font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; text-align:center; }
 p { color:#666; max-width:32ch; }
</style></head>
<body><div><h1>Link not valid</h1>
<p>This report link has expired or is not recognized. Report links are good for 30 days.</p>
</div></body></html>`;
}
