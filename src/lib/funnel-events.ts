// Structured funnel events emitted to stdout → Cloud Logging.
//
// One JSON line per lifecycle event. Read back with:
//   gcloud logging read 'jsonPayload.ev="item_created"' \
//     --project graffiticode-app --format json
// and aggregated hourly by src/lib/funnel-digest.ts (SMS) and out-of-band by
// scripts/mcp-funnel-report.ts (HTML).
//
// This is the console-side twin of graffiticode-mcp-server/src/events.ts and
// shares its schema and privacy contract:
//   - never log prompts, item source, or free-text descriptions — only lengths
//   - never log raw session uuids, bearer tokens, emails, or wallet addresses
//   - never log the client IP
//
// The `session` field is the join key across all three emitters (console,
// mcp-service, app.graffiticode.org). For free-plan traffic it is the
// `sessionNamespace` the console already stamps on items; for authenticated
// traffic it is a one-way hash of the uid. That keeps "how many distinct
// actors" answerable without any identifier leaving the process.

import crypto from "crypto";

/**
 * Headline events get their own line in the hourly SMS digest; context events
 * are folded into its trailing summary line. The split itself lives in
 * src/lib/funnel-digest.ts — this type only enumerates what may be emitted.
 */
export type FunnelEventName =
  // headline
  | "item_created"
  | "wall_hit"
  | "api_key_created"
  | "signup"
  | "plan_changed"
  // First card on file: a hard-capped tier enrolling in pay-as-you-go. Headline
  // because it is the conversion moment on the free tier — the plan id doesn't
  // move, so plan_changed can never report it.
  | "payg_enabled"
  | "overage_limit_raised"
  // context
  | "item_updated"
  | "item_generation_failed"
  | "checkout_started"
  | "free_plan_budget";

export type FunnelAuth = "freePlan" | "firebase";

export interface FunnelEventFields {
  auth?: FunnelAuth;
  /** sessionNamespace (free-plan) or sha256(uid) (authenticated). */
  session?: string;
  lang?: string;
  /** Source surface: "console" | "mcp" | "front". */
  app?: string;
  /** First billable item ever for this account. */
  first_for_account?: boolean;
  /** wall_hit: which limit was hit. */
  wall?: string;
  /** signup: whether the account was born from a claim link or on its own. */
  via?: "claim" | "direct";
  /** plan_changed: internal plan ids, e.g. "demo" → "pro". */
  from?: string;
  to?: string;
  reason?: string;
  err?: string;
  [key: string]: unknown;
}

/**
 * One-way hash of an authenticated uid. Firebase uids here are often wallet
 * addresses, which are publicly linkable, so they never reach the log.
 */
export function hashUid(uid: string): string {
  return crypto.createHash("sha256").update(uid).digest("hex");
}

/**
 * Build the `{ auth, session }` pair every event carries. Accepts whatever the
 * call site happens to have: an auth context with a uid, a free-plan session
 * namespace, or neither.
 */
export function actor(input: {
  uid?: string | null;
  sessionNamespace?: string | null;
  freePlan?: boolean;
}): { auth: FunnelAuth; session: string } | Record<string, never> {
  // Free-plan callers all share the trial account's uid, so the namespace is
  // the only field that distinguishes one anonymous session from another.
  if (input.freePlan && input.sessionNamespace) {
    return { auth: "freePlan", session: input.sessionNamespace };
  }
  if (input.uid) {
    return { auth: "firebase", session: hashUid(input.uid) };
  }
  if (input.sessionNamespace) {
    return { auth: "freePlan", session: input.sessionNamespace };
  }
  return {};
}

/**
 * Normalize a language to its canonical "L0166" form.
 *
 * Lives here, on the request path, so the workspace registry and the reports
 * bucket a language the same way. The MCP server strips the `L` prefix before
 * calling us, so without one shared normalizer the registry's `lang` and the
 * log-derived language tables disagree about the same call.
 *
 * Anything that isn't an L-number becomes "(invalid)" rather than passing
 * through. Clients do send junk: a real week had a call whose `language`
 * argument was "create a green bar chart using mock data", which a pass-through
 * turned into its own 40-character row in the language table.
 */
export function langKey(v: unknown): string | undefined {
  if (typeof v !== "string" || !v) return undefined;
  const t = v.trim();
  if (/^\d{2,6}$/.test(t)) return `L${t}`;
  if (/^L\d{2,6}$/i.test(t)) return t.toUpperCase();
  return "(invalid)";
}

/**
 * Report a subscription plan transition.
 *
 * Emit this at the point our OWN state changes — the `users/{uid}` plan write —
 * never per Stripe webhook type. A single upgrade delivers
 * checkout.session.completed + customer.subscription.created +
 * customer.subscription.updated + invoice.paid, and every one of them lands on
 * the same plan write. Guarding on `from !== to` collapses them to one event and
 * makes the in-app path (quick-subscribe) and the webhook path idempotent with
 * respect to each other, whichever runs first.
 *
 * The guard is skipped for explicit customer actions ("I want to cancel"), which
 * are real decisions even though the plan value hasn't moved yet.
 */
export function emitPlanChanged(input: {
  uid: string;
  from?: string | null;
  to?: string | null;
  reason: "subscription_sync" | "cancel_requested" | "resume_requested";
}): void {
  const from = input.from ?? undefined;
  const to = input.to ?? undefined;
  if (input.reason === "subscription_sync" && from === to) return;
  emitEvent("plan_changed", {
    ...actor({ uid: input.uid }),
    from,
    to,
    reason: input.reason,
  });
}

/**
 * Emit one event. Best-effort by contract: instrumentation must never break a
 * request, so every failure — including a serialization cycle — is swallowed.
 */
export function emitEvent(
  ev: FunnelEventName,
  fields: FunnelEventFields = {},
): void {
  try {
    const payload: Record<string, unknown> = {
      ev,
      t: new Date().toISOString(),
    };
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      payload[key] = typeof value === "string" ? value.slice(0, 200) : value;
    }
    console.log(JSON.stringify(payload));
  } catch {
    // ignore
  }
}
