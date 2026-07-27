// Hourly funnel digest job. Invoked by Cloud Scheduler at :02 past each hour
// from 8am to 8pm PT:
//
//   gcloud scheduler jobs create http funnel-digest \
//     --schedule="2 8-20 * * *" --time-zone="America/Los_Angeles" \
//     --uri="https://console.graffiticode.org/api/internal/funnel-digest" \
//     --http-method=POST \
//     --headers="X-Internal-Job-Secret=<INTERNAL_JOB_SECRET>"
//
// Auth reuses the INTERNAL_JOB_SECRET shared header that /api/generate-job
// already validates, rather than adding a second scheme for one more job.
//
// GET with ?dry=1 renders a window without sending or advancing the cursor —
// the dev loop for the formatter. Accepts &from=<iso>&to=<iso> to replay any
// historical window.

import type { NextApiRequest, NextApiResponse } from "next";
import {
  aggregate,
  fetchEvents,
  formatDigest,
  formatSms,
  ptDate,
  readSeen,
  readState,
  resolveWindow,
  shouldSend,
  writeSeen,
  writeState,
} from "../../../lib/funnel-digest";
import { sendSms } from "../../../lib/alert-sms";
import { reportUrl } from "../../../lib/report-link";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dry = req.query.dry === "1";

  if (!dry) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const secret = process.env.INTERNAL_JOB_SECRET || "";
    if (!secret || req.headers["x-internal-job-secret"] !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const now = new Date();
    const state = await readState();
    const replay =
      dry && typeof req.query.from === "string" && typeof req.query.to === "string";
    const window = replay
      ? { from: new Date(String(req.query.from)), to: new Date(String(req.query.to)) }
      : resolveWindow(state, now);

    const { events, truncated } = await fetchEvents(window.from, window.to);
    const seen = await readSeen();
    const digest = aggregate(events, { ...window, truncated }, seen);
    const url = reportUrl(window.from, window.to, now);
    const message = formatSms(digest, url);

    if (dry) {
      return res.status(200).json({
        window: { from: window.from.toISOString(), to: window.to.toISOString() },
        events: events.length,
        wouldSend: shouldSend(digest, state, now),
        message,
        url,
        // The long form is no longer sent, but it stays the readable summary for
        // eyeballing a window from the terminal.
        detail: formatDigest(digest),
        digest: { ...digest, from: undefined, to: undefined },
      });
    }

    // Tool calls are the liveness signal; a period with none sends nothing
    // unless it's the day's first report, so silence stays unambiguous.
    const send = shouldSend(digest, state, now);
    const result = send ? await sendSms(message) : { sent: false, reason: "no_activity" };

    // Advance the cursor whether or not an SMS went out — the window WAS
    // reported on, and replaying it would double-count. A send failure is
    // visible in the logs and in the next day's floor.
    await writeState({
      cursor: window.to.toISOString(),
      ...(result.sent ? { lastSentAt: now.toISOString(), lastSentDate: ptDate(now) } : {}),
    });
    // Novelty is one-way: once a client kind or country has been announced it
    // must never be announced again, even if this run's SMS failed.
    await writeSeen(seen);

    console.log(
      JSON.stringify({
        ev: "funnel_digest",
        t: now.toISOString(),
        events: events.length,
        sent: result.sent,
        reason: result.reason,
        truncated,
      }),
    );

    return res.status(200).json({ ok: true, events: events.length, ...result });
  } catch (err: any) {
    console.error("[funnel-digest] failed", err);
    // 500 lets Cloud Scheduler retry. The cursor is untouched on this path, so a
    // retry covers the same window rather than skipping it.
    return res.status(500).json({ error: "digest_failed", details: String(err?.message ?? err) });
  }
}
