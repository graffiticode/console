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
| Free | `demo` | $0 | 50 — hard cap | none |
| Silver | `pro` | $100 | 1,000 | $0.10 / item |
| Gold | `teams` | $1,000 | 20,000 | $0.05 / item |
| Platinum | `platinum` | $10,000 | 400,000 | $0.025 / item |

## Billing model

Flat base billed **in advance** (on signup + each renewal) + **Stripe metered overage** billed in
**arrears** on the next invoice — one clean monthly invoice. E.g. Silver + 1,100 items → renewal invoice
`$100 base + 100 × $0.10 = $110`.

**The metered price MUST be tiered (graduated):** tier 1 = `0…includedItems` at $0 (covered by the base),
tier 2 = the per-item rate above it. We report **one meter event per item** and Stripe applies the tiers.
A *flat* metered price would bill every item (Silver 1,100 → $210, not $110). `setup-item-pricing.ts`
creates them tiered; don't change that.

## How metering works

- **Count:** `recordBillableItem()` in `src/pages/api/resolvers.ts` fires **once per distinct item** at
  its first successful compile — from `createItem` success and from `updateItem`'s no-taskId→first-taskId
  transition (async console/MCP creates whose artifact the worker fills in). Idempotent via a `billed`
  flag on the item doc (Firestore transaction).
- **Excluded:** revisions (taskId→taskId), share/claim copies (`source ∈ {claim,share}` or
  `sharedFrom`/`claimedFrom`), and anonymous free-plan (MCP trial) sessions (`auth.freePlan`) — trial
  items resolve under the shared trial uid and must not bill it.
- **Effects:** writes a `usage` record `{type:'item_created', units:1}`, increments
  `usage/{uid}.currentMonthTotal`, and (paid tiers only) reports a Stripe meter event via
  `src/lib/item-metering.ts` (event name `item_created`, `value:1`, idempotency key `itemId__taskId`).
- **Free records:** `logCompile` and the generation token meter now write `units:0` (kept for cost
  telemetry). **The gate and usage endpoint sum only `type==='item_created'` records** — otherwise
  lingering pre-migration compile-unit records would inflate item counts.

## Gating + overage spend cap

- `checkItemCreateAllowed()` (`src/lib/usage-service.ts`) runs at **item creation** entry (`createItem` /
  `startCodeGeneration`), not inside `generateCode` — editing an existing item is free.
- Free = **hard block** at `includedItems`. Paid = allowed up to an optional customer cap
  `subscription.overageLimitItems`, else unlimited (overage bills in arrears).
- The cap is set in **dollars** via `POST /api/payments/overage-limit` (stored as items using the tier
  rate) and enforced by us, so Stripe never bills past it. UI: the spend-cap control in
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
npx tsx scripts/verify-item-invoice.ts --plan pro --items 1100     # expect $110

# Cutover: zero every account's usage counter + resync subscription.units to item allowances.
# Runs against prod Firestore — unset FIRESTORE_EMULATOR_HOST.
env -u FIRESTORE_EMULATOR_HOST npx tsx scripts/reset-and-migrate-tiers.ts [--apply]

# Re-derive Firestore subscription from live Stripe (needs the live price-id env vars set so
# priceIdToPlan matches live subs).
npx tsx scripts/reconcile-subscriptions.ts [--apply]
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
