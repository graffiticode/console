---
name: funnel-instrumentation
description: Funnel event emission, the wall_hit taxonomy, and the hourly SMS digest / report page / CLI that share one aggregation path. Read before adding a lifecycle event, a new limit/wall, or touching funnel-digest, funnel-events, or scripts/funnel-report.
---

# Funnel events, walls, and the hourly digest

**The privacy contract is repeated in `CLAUDE.md` and is non-negotiable** — never log prompts, item source, or free text (only lengths); never log raw session uuids, tokens, emails, or wallet addresses; never log the client IP.

## Emission

One structured JSON line per lifecycle event to stdout → Cloud Logging via `emitEvent` (`src/lib/funnel-events.ts`), the console-side twin of `graffiticode-mcp-server/src/events.ts`, sharing its schema and privacy contract. The `session` field is the join key across all three emitters (console, mcp-service, app.graffiticode.org) — `sessionNamespace` for free-plan, `sha256(uid)` for authenticated — so "how many distinct actors" stays answerable with no identifier leaving the process.

## Wall taxonomy

A **`wall_hit`** is a request refused by a limit — the headline signal for "demand we turned away", rendered in the digest as `⛔ N walls — <breakdown by kind>`. Seven kinds:

| `wall` | Raised by | Meaning |
|---|---|---|
| `item_limit` | `buildMonthlyQuotaError` | Free-plan monthly budget spent |
| `daily_pace` | `buildDailyPaceError` | Free-plan derived daily allowance spent |
| `revision_limit` | `buildRevisionLimitError` | Item hit its revision cap |
| `language_scope` | `buildScopeError` | Language outside trial scope (carries `lang`) |
| `item_expired` | `buildItemExpiredError` | Free-plan item aged past its 48h TTL |
| `plan_item_limit` | `checkItemCreateAllowed` → `assertItemCreateAllowed` | Hard-capped plan spent its included items |
| `overage_cap` | same | Customer's own overage spend cap reached |

**Emission point differs by path, deliberately.** The five free-plan walls are emitted **inside the `FreePlanError` builders** in `free-plan-quota.ts`, because every builder is called directly inside a `throw` — the one choke point that can't drift as call sites move. The cost is that a builder has no auth context, so those walls are counted **by kind but not attributed to a session**; the digest only reports counts, so that's sufficient. The two paid walls are emitted at the gate in `resolvers.ts` instead, where `auth` *is* in scope, so they carry `session` and `lang`. When adding a free-plan limit, emit from the builder, not the call site — and note `assertItemCreateAllowed` skips its own emit on the free-plan branch precisely because `buildMonthlyQuotaError` already fired.

## Aggregation — three surfaces, ONE path

Events are aggregated hourly by `src/lib/funnel-digest.ts` and out-of-band by `scripts/mcp-funnel-report.ts` (HTML). Three surfaces share ONE aggregation path (`funnel-digest.ts`), so counting rules can't drift:

- an **hourly SMS** (Cloud Scheduler `2 8-20 * * *` PT → `src/pages/api/internal/funnel-digest.ts` → Twilio via `src/lib/alert-sms.ts`),
- a **report page** (`/r/<token>` → rewritten to `src/pages/api/r/[token].ts`; an API route, NOT a page, because `_app.tsx` wraps everything except form/editor in `AuthWrapper` and the signed link must open with no sign-in — token is an HMAC over the window + expiry, `src/lib/report-link.ts`),
- a **CLI** (`npx tsx scripts/funnel-report.ts --period day|hour|week|month`).

**Send policy: every firing sends**, activity or not — the schedule IS the policy, so a quiet hour reports "0 anon calls" and silence means the job is broken (this replaced an activity gate + once-a-day floor, which existed only to make silence readable).

**Anonymous vs signed-in** (`isAuthenticated`/`aggregateSplit` in `funnel-digest.ts`): the **SMS carries the anonymous segment only** — mixing our own console work into it made a busy afternoon of self-editing read as demand — while the report page renders both segments plus the split in "Today so far" and the 7-day trend (bar = total tool calls, solid fill = anon share). An event is authenticated iff `auth === "firebase"` or `authed === true` (artifact_view from app.graffiticode.org speaks the latter); everything unmarked (claim, claim_view) counts anonymous, so `anon + authed == total` exactly and no third bucket exists.

State: `alert-state/digest` (cursor), `alert-state/seen` (novelty), `funnel-daily/{date}` (cached completed days, `v`-stamped — a shape change invalidates rather than back-fills zeros). GCP REST is called directly with a metadata-server token (`src/lib/gcp-token.ts`) for the reason on `generation-queue.ts` — no `@google-cloud/*` SDKs.

## Four rules that keep getting re-learned

1. Emit at *our* state change, not the upstream trigger (`plan_changed` fires at the `users/{uid}` plan write, collapsing one upgrade's four Stripe webhooks into one event — never add per-webhook emitters).
2. Attribute from every event carrying the field, not just the "start" event (`mcp_session_started` fires once per session, so client attribution must also read `mcp_tool`).
3. Allowlist rather than infer (language "attempts" count `create_item`/`update_item` only — `get_language_info` also takes a `language` arg).
4. Novelty is only meaningful against persisted state (the report page and CLI aggregate with a throwaway `seen` set so they can't consume the SMS's flags, and therefore must not render novelty).
