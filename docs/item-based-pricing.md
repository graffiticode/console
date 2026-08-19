# Item-Based Pricing

The console bills tenants per **successful item created per month** — a create request that returns a
compiled, valid artifact. Iteration (revisions), reads, and compiles are **free**. This replaced the
older compile-unit metering.

## Tiers

Single source of truth: **`src/lib/plans-config.ts`** (`PLANS`). Never hardcode allowances, rates, or
price-id mappings elsewhere — import from here. Internal plan ids are stable; only display names/numbers
changed (`starter` is retained but discontinued).

| Display | Internal id | Base $/mo (advance) | Included items/mo | Overage (arrears) |
|---|---|---:|---:|---:|
| Bronze | `demo` | $0 | 25 | $0.40 / item — **requires enrollment**, see below |
| Silver | `pro` | $100 | 500 | $0.20 / item |
| Gold | `teams` | $1,000 | 10,000 | $0.10 / item |
| Platinum | `platinum` | $10,000 | 200,000 | $0.05 / item |

Bronze was called "Free" until pay-as-you-go landed; the internal id stays `demo` (it is written into
every `users/{uid}.subscription.plan` doc and the `PlanId` union). Its overage rate is deliberately the
*highest* — pay-as-you-go is the bridge past the wall, not a cheaper substitute for a subscription.

## Bronze is two states

| State | Signal | Behavior |
|---|---|---|
| Unenrolled | no `subscription.stripeSubscriptionId` | hard cap at `includedItems` |
| Pay-as-you-go | active `demo` subscription | 25 free, then $0.40/item up to the customer's cap |

**We capture payment details at exactly two moments, never earlier:** when the customer hits the 25-item
wall, and when they set a spend cap (`POST /api/payments/overage-limit` answers **402
`requiresPaymentMethod`** for an unenrolled tier rather than storing a number it could not enforce).

Enrollment is a hosted Stripe Checkout in `mode: 'subscription'` carrying the **$0/mo base price + the
graduated metered price**; `payment_method_collection: 'always'` is what makes Stripe collect a card on a
$0 total. A monthly spend cap is **required** to enroll — a $0-base account with an uncapped card is how
a trial user gets a four-figure surprise — and rides on `subscription_data.metadata.overageLimitUsd` so an
abandoned Checkout leaves nothing behind.

Read the state with `payAsYouGoEnabled(subscription)` / `isHardCappedFor(plan, subscription)`
(`plans-config.ts`), never bare `isHardCapped(plan)` — that one can't see the enrollment and answers
"capped" for every Bronze account. That is the safe direction, which is why it still exists.

### First-period anchoring (do not remove)

Stripe stamps `current_period_start` at the moment of enrollment. The gate counts usage from
`currentPeriodStart`, so storing that verbatim would hide every item the customer already created this
month — a user enrolling at item 25 on the 20th would receive 25 fresh included items, free, and again
every month they re-enrolled. So:

- Checkout sets `subscription_data.billing_cycle_anchor_config = { day_of_month: 1 }`, making Stripe's own
  periods calendar-aligned from period 2 onward;
- the `customer.subscription.created` handler writes the **calendar-month start** as
  `subscription.currentPeriodStart` for the **first** period only.

From the first renewal the stored and Stripe periods agree and the special case stops applying.

## Billing model

Flat base billed **in advance** (on signup + each renewal) + **Stripe metered overage** billed in
**arrears** on the next invoice — one clean monthly invoice. E.g. Silver + 600 items → renewal invoice
`$100 base + 100 × $0.20 = $120`.

**The metered price MUST be tiered (graduated):** tier 1 = `0…includedItems` at $0 (covered by the base),
tier 2 = the per-item rate above it. We report **one meter event per item** and Stripe applies the tiers.
A *flat* metered price would bill every item (Silver 600 → $220, not $120). `setup-item-pricing.ts`
creates them tiered; don't change that.

## How metering works

- **Count:** `recordBillableItem()` in `src/pages/api/resolvers.ts` fires **once per distinct item** at
  its first successful compile — from `createItem` success and from `updateItem`'s no-taskId→first-taskId
  transition (async console/MCP creates whose artifact the worker fills in). Idempotent via a `billed`
  flag on the item doc (Firestore transaction).
- **Excluded:** revisions (taskId→taskId) and share/claim copies (`source ∈ {claim,share}` or
  `sharedFrom`/`claimedFrom`).
- **Anonymous free-plan (MCP trial) items are COUNTED but never INVOICED.** They resolve under the
  shared trial uid and flow through the `billed` transaction, the `usage` record and the
  `currentMonthTotal` increment — which is exactly what makes the trial account's own plan allowance
  serve as the trial's monthly budget — then return **before** the Stripe meter report. The account
  carries `overageLimitItems: 0`, so `checkItemCreateAllowed`'s paid-tier branch becomes a hard cap at
  its included items, and it can never accrue billable overage.
  See `docs/free-plan-attested-sessions.md` and `free-plan-quota.ts`.
- **Effects:** writes a `usage` record `{type:'item_created', units:1}`, increments
  `usage/{uid}.currentMonthTotal`, and (metered tiers only) reports a Stripe meter event via
  `src/lib/item-metering.ts` (event name `item_created`, `value:1`, idempotency key `itemId__taskId`).
  `reportItemUsage` re-checks enrollment itself: a Bronze user who opens Checkout and abandons it still
  gets a `stripeCustomerId`, so the customer-id check alone would meter them.
- **Free records:** `logCompile` and the generation token meter now write `units:0` (kept for cost
  telemetry). **The gate and usage endpoint sum only `type==='item_created'` records** — otherwise
  lingering pre-migration compile-unit records would inflate item counts.

## Gating + overage spend cap

- `checkItemCreateAllowed()` (`src/lib/usage-service.ts`) runs at **item creation** entry (`createItem` /
  `startCodeGeneration`), not inside `generateCode` — editing an existing item is free.
- Hard-capped (Bronze, unenrolled) = **hard block** at `includedItems`, wall `plan_item_limit`. Metered
  (paid, or Bronze enrolled) = allowed up to the customer cap `subscription.overageLimitItems`, else
  unlimited (overage bills in arrears), wall `overage_cap`. No new wall kind was added.
- The cap is set in **dollars** via `POST /api/payments/overage-limit` (stored as items using the tier
  rate) and enforced by us, so Stripe never bills past it. A plan change **recomputes
  `overageLimitItems` from `overageLimitUsd`** at the new rate (`quick-subscribe.ts`) — carrying the item
  count across would silently move the dollar ceiling the customer agreed to. UI: the spend-cap control in
  `components/payments/UsageMonitor.tsx`.

## Stripe integration

- **SDK is v22**; `apiVersion` is centralized as `STRIPE_API_VERSION` in `plans-config.ts`. `new Stripe()`
  sites must use it. `current_period_start/end` live on subscription **items** now — read them via
  `src/lib/stripe-helpers.ts` (`subscriptionPeriod`/`subscriptionPeriodEnd`/`subscriptionPeriodStart`).
- Paid subscriptions carry **two line items**: the flat base price + the metered overage price. Code that
  changes plans must swap the base and keep the metered aligned — see `splitItems`/`buildUpdateItems` in
  `payments/quick-subscribe.ts`.
- `priceIdToPlan()` maps a **base** price id → plan (metered prices don't map). It's env-driven, so it only
  recognizes the price ids configured in the running environment.
- The **prepaid overage subsystem is gone** (no `overageUnits`, auto top-up, or block purchase).

### Webhooks

`src/pages/api/webhooks/stripe.ts` handles `customer.subscription.*`, `checkout.session.completed`,
`invoice.paid`, etc. Checkout-created subscriptions get their `subscription.plan` written **by the
webhook** (not the endpoint), so a broken webhook silently leaves paid subs at `demo` (and the gate reads
`subscription.plan`). The `STRIPE_WEBHOOK_SECRET` on the service **must match the live endpoint's signing
secret** or every event fails signature verification. `subscription.deleted` only resets to Free when the
customer has no *other* active/trialing sub (guards against out-of-order cancel-old + create-new).

## Env vars

Base + metered price ids per paid tier, resolved by `plans-config.ts`:
`STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`, `STRIPE_PRO_METER_PRICE_ID`, and the
`STRIPE_TEAMS_*` / `STRIPE_PLATINUM_*` equivalents; plus `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (build-time). In prod these are env vars on the `console` Cloud Run
service (graffiticode-app).

## Operational scripts

```bash
# Provision Stripe (meter + tiered prices + Platinum base). Idempotent. Run in TEST first, then live.
STRIPE_SECRET_KEY=sk_... npx tsx scripts/setup-item-pricing.ts [--dry-run]

# End-to-end invoice proof via a Stripe test clock (creates a sub, reports usage, advances a cycle).
set -a; . ./.env.local; set +a
npx tsx scripts/verify-item-invoice.ts --plan pro --items 600      # expect $120

# Cutover: zero every account's usage counter + resync subscription.units to item allowances.
# Runs against prod Firestore — unset FIRESTORE_EMULATOR_HOST.
env -u FIRESTORE_EMULATOR_HOST npx tsx scripts/reset-and-migrate-tiers.ts [--apply]

# Re-derive Firestore subscription from live Stripe (needs the live price-id env vars set so
# priceIdToPlan matches live subs).
npx tsx scripts/reconcile-subscriptions.ts [--apply]

# After a RATE change: re-derive every customer's spend cap (overageLimitItems) from the
# dollars they agreed to (overageLimitUsd) at the new rate. Nothing else does this — a plan
# change recomputes it, a rate change under a plan they never left does not.
npx tsx scripts/recompute-overage-caps.ts [--apply] [--uid <uid>] [--allow-zero]
  [--previous-rates demo=0.2,pro=0.1,teams=0.05,platinum=0.025]
```

Notes / gotchas:
- Updating Cloud Run env with `--no-traffic` **pins** traffic to the current revision; a later deploy
  won't serve until `gcloud run services update-traffic console --to-latest`.
- Existing subscribers on *legacy* base prices become unrecognized once env flips to the new price ids
  (`priceIdToPlan` → unknown → `demo`); prefer cancel + re-subscribe over in-place migration.

## Known follow-ups

- 3DS/SCA: `invoice.payment_intent` is cast-to-`any` in `quick-subscribe` (removed from the v22 Invoice
  type) — validate the confirmation flow with an SCA test card.
- `scripts/revenue-vs-cost.ts` predates item pricing; its revenue figures need reworking.
- **Token-count audit (`scripts/audit-token-counts.ts`) — designed, not built.** `cost-per-item.ts` now
  prices our *own* recorded tokens with `MODEL_RATES` and calls no provider API, so nothing checks
  whether those counts are **complete**. A separate, occasional audit should answer only that: sum our
  `ai_generation` tokens by model for a window, fetch Anthropic's `usage_report/messages` **org-wide**
  (empty `api_key_ids[]`), and print a per-model table of ours vs theirs for input, output, cache read
  and cache write — **token counts, not dollars** — with one dollar-weighted total as a summary.

  Org-wide is the load-bearing detail. Our telemetry records every call we make, from a laptop and from
  Cloud Run alike, so the only like-for-like counterpart is the whole org. Scoping to one key is what
  made the old `recorded vs provider` line read 175.7% and sent us chasing a stream double-counting bug
  that did not exist — the gap was a dev key ($63.33) sitting outside the deployed key ($25.74).

  Reading it: near parity means instrumentation captures everything; materially low means some call
  path is not wired to `recordTokenUsage`; materially high means double counting. Anthropic only —
  OpenAI's usage endpoint needs an `sk-admin-…` org key we do not have, and the script should say so
  rather than imply that third of our calls was checked. Run it on a window ending at a settled UTC
  day; the usage report lags hours, so including today always looks like over-counting.
