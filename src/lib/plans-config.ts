// Single source of truth for plan tiers and item-based pricing.
//
// Billing model: a flat base fee billed IN ADVANCE (on signup + each renewal)
// plus metered overage billed IN ARREARS on the next invoice. We meter one
// "item" per successfully created (compiled, valid) item; iteration, reads, and
// retrievals are free. Paid tiers meter overage via Stripe and may set an
// optional customer spend cap (see overage limit).
//
// Bronze is a TWO-STATE tier — see payAsYouGoEnabled()/isHardCappedFor(). With
// no card on file it is hard-capped at its included items (the historical "Free"
// behavior); once the customer enrolls in pay-as-you-go (a $0-base subscription
// carrying the metered price) it meters overage like any paid tier.
//
// Internal plan ids are kept stable for backward compat with existing Firestore
// subscription docs and Stripe mappings:
//   demo -> "Bronze", pro -> "Silver", teams -> "Gold", platinum -> "Platinum".
// `starter` is discontinued but retained in the type/lookup for legacy data.

export type PlanId = 'demo' | 'starter' | 'pro' | 'teams' | 'platinum';
export type BillingInterval = 'monthly' | 'annual';

// Pinned Stripe API version — matches the version the installed stripe SDK
// (v22) generates against, which supports Billing Meters (usage-based metered
// prices). Centralized so every `new Stripe(...)` site moves in lockstep.
export const STRIPE_API_VERSION = '2026-06-24.dahlia' as const;

export interface PlanConfig {
  id: PlanId;
  /** Customer-facing name. */
  displayName: string;
  /** Flat base fee, billed in advance. */
  basePriceMonthly: number;
  basePriceAnnual: number;
  /** Items included in the base fee each billing period. */
  includedItems: number;
  /** Price per item beyond the included bucket (metered, in arrears). null = no overage. */
  overageRatePerItem: number | null;
  /**
   * When true, creation is blocked at includedItems UNLESS the account has
   * enrolled in pay-as-you-go. Prefer isHardCappedFor(plan, subscription) over
   * reading this directly — this flag alone cannot see the enrollment.
   */
  hardCap: boolean;
  /** Tier ranking for upgrade/downgrade comparisons. */
  tier: number;
  /** Non-self-serve (contact sales) tier. */
  contactSales?: boolean;
  /** Env var names for the Stripe price objects (resolved at call time). */
  stripe: {
    baseMonthlyPriceIdEnv?: string;
    baseAnnualPriceIdEnv?: string;
    /** Metered (usage-based) price for overage; absent for Free/contact-sales. */
    meterPriceIdEnv?: string;
    /** Stripe Billing Meter event name we report item usage against. */
    meterEventName?: string;
  };
}

// Ordered by tier. Numbers per the ArtCompiler price sheet.
export const PLANS: Record<PlanId, PlanConfig> = {
  demo: {
    id: 'demo',
    displayName: 'Bronze',
    basePriceMonthly: 0,
    basePriceAnnual: 0,
    includedItems: 50,
    // Deliberately dearer per item than Silver ($0.10): pay-as-you-go is the
    // bridge past the wall, not a way to live below a subscription forever.
    overageRatePerItem: 0.2,
    // True = hard-capped *until enrolled*; see isHardCappedFor.
    hardCap: true,
    tier: 0,
    stripe: {
      // $0/month recurring price. It exists solely so a Bronze subscription has
      // a base line item that priceIdToPlan can match — without it the webhook
      // cannot resolve the plan and refuses to sync.
      baseMonthlyPriceIdEnv: 'STRIPE_FREE_MONTHLY_PRICE_ID',
      // MUST be graduated: tier 1 = 0..includedItems at $0, tier 2 = $0.20.
      meterPriceIdEnv: 'STRIPE_FREE_METER_PRICE_ID',
      meterEventName: 'item_created',
    },
  },
  // Discontinued; retained so legacy subscribers/data still resolve.
  starter: {
    id: 'starter',
    displayName: 'Starter',
    basePriceMonthly: 10,
    basePriceAnnual: 100,
    includedItems: 500,
    overageRatePerItem: 0.1,
    hardCap: false,
    tier: 1,
    stripe: {
      baseMonthlyPriceIdEnv: 'STRIPE_STARTER_MONTHLY_PRICE_ID',
      baseAnnualPriceIdEnv: 'STRIPE_STARTER_ANNUAL_PRICE_ID',
    },
  },
  pro: {
    id: 'pro',
    displayName: 'Silver',
    basePriceMonthly: 100,
    basePriceAnnual: 1000,
    includedItems: 1000,
    overageRatePerItem: 0.1,
    hardCap: false,
    tier: 2,
    stripe: {
      baseMonthlyPriceIdEnv: 'STRIPE_PRO_MONTHLY_PRICE_ID',
      baseAnnualPriceIdEnv: 'STRIPE_PRO_ANNUAL_PRICE_ID',
      meterPriceIdEnv: 'STRIPE_PRO_METER_PRICE_ID',
      meterEventName: 'item_created',
    },
  },
  teams: {
    id: 'teams',
    displayName: 'Gold',
    basePriceMonthly: 1000,
    basePriceAnnual: 10000,
    includedItems: 20000,
    overageRatePerItem: 0.05,
    hardCap: false,
    tier: 3,
    stripe: {
      baseMonthlyPriceIdEnv: 'STRIPE_TEAMS_MONTHLY_PRICE_ID',
      baseAnnualPriceIdEnv: 'STRIPE_TEAMS_ANNUAL_PRICE_ID',
      meterPriceIdEnv: 'STRIPE_TEAMS_METER_PRICE_ID',
      meterEventName: 'item_created',
    },
  },
  platinum: {
    id: 'platinum',
    displayName: 'Platinum',
    basePriceMonthly: 10000,
    basePriceAnnual: 100000,
    includedItems: 400000,
    overageRatePerItem: 0.025,
    hardCap: false,
    tier: 4,
    stripe: {
      baseMonthlyPriceIdEnv: 'STRIPE_PLATINUM_MONTHLY_PRICE_ID',
      baseAnnualPriceIdEnv: 'STRIPE_PLATINUM_ANNUAL_PRICE_ID',
      meterPriceIdEnv: 'STRIPE_PLATINUM_METER_PRICE_ID',
      meterEventName: 'item_created',
    },
  },
};

export const DEFAULT_PLAN: PlanId = 'demo';

/**
 * Anonymous free-plan (MCP trial) limits.
 *
 * Deliberately NOT a PLANS entry: a trial is not a PlanId, has no Stripe
 * mapping, and adding one would pollute getPlan()'s fallback, the tier
 * comparisons and priceIdToPlan.
 *
 * Note what is absent — the trial's ITEM budget. That comes from the trial
 * account's own subscription (it is a real account; see checkItemCreateAllowed),
 * so moving that account between tiers moves the monthly cap, and the derived
 * daily pace with it, without a code or env change.
 */
const DEFAULT_TRIAL_ITEM_REVISIONS = 5;

/**
 * Revisions allowed per trial item, counted on successful content change (a
 * failed generation must not burn one of only five). Resolved at call time so
 * it can be tuned by env without a deploy.
 */
export function trialItemRevisionLimit(): number {
  const raw = process.env.FREE_PLAN_ITEM_REVISION_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRIAL_ITEM_REVISIONS;
}

export function getPlan(id: string | undefined | null): PlanConfig {
  return PLANS[(id as PlanId)] ?? PLANS[DEFAULT_PLAN];
}

/** Items included in the base fee for a plan (0 for unknown). */
export function includedItemsFor(id: string | undefined | null): number {
  return getPlan(id).includedItems;
}

export interface PreservedAllocation {
  preservedAllocation?: number | null;
  preservedUntil?: string | Date | null;
}

/**
 * Items included for a subscription, honoring a downgrade's preserved
 * allocation. The preserved bucket exists so a downgraded customer keeps what
 * they already paid for until the period ends — so it may only ever RAISE the
 * allowance. A stale or smaller value (e.g. a legacy compile-unit figure left
 * on the doc, or an expired grace window) must never cap a plan below its own
 * included items.
 */
export function effectiveIncludedItems(
  id: string | undefined | null,
  subscription: PreservedAllocation | undefined | null,
  now: Date = new Date(),
  baseIncluded?: number,
): number {
  const included = baseIncluded ?? includedItemsFor(id);
  const preserved = subscription?.preservedAllocation;
  const until = subscription?.preservedUntil;
  if (typeof preserved === 'number' && until && new Date(until) > now) {
    return Math.max(included, preserved);
  }
  return included;
}

/** Whether a preserved allocation is both unexpired and actually raising the allowance. */
export function preservedAllocationApplies(
  id: string | undefined | null,
  subscription: PreservedAllocation | undefined | null,
  now: Date = new Date(),
  baseIncluded?: number,
): boolean {
  const included = baseIncluded ?? includedItemsFor(id);
  return effectiveIncludedItems(id, subscription, now, included) > included;
}

/** Per-item overage rate for a plan (null when no overage/hard cap). */
export function overageRateFor(id: string | undefined | null): number | null {
  return getPlan(id).overageRatePerItem;
}

/**
 * Whether a plan is hard-capped *as a plan shape*, ignoring enrollment.
 *
 * Almost every caller wants isHardCappedFor() instead — this one cannot see
 * that a Bronze account has enrolled in pay-as-you-go, so it answers `true` for
 * every Bronze account. That is the safe direction (block rather than hand out
 * uncapped billable items), which is why the enrollment-blind version is kept.
 */
export function isHardCapped(id: string | undefined | null): boolean {
  return getPlan(id).hardCap;
}

/** Shape of the cached `users/{uid}.subscription` map that gating reads. */
export interface SubscriptionState extends PreservedAllocation {
  plan?: string | null;
  status?: string | null;
  stripeSubscriptionId?: string | null;
  overageLimitItems?: number | null;
  overageLimitUsd?: number | null;
}

/**
 * Whether an account has enrolled in pay-as-you-go on a hard-capped tier.
 *
 * Enrollment means a live Stripe subscription carrying the tier's $0 base price
 * and its metered price — which the customer can only obtain by completing
 * Checkout, i.e. by putting a card on file. That is the whole point: we ask for
 * payment details at the wall, never at signup, so the presence of the
 * subscription IS the signal that we are allowed to bill for overage.
 *
 * A cancelled or past_due subscription is not enrollment; those accounts fall
 * back to the hard cap on their next create, with no code path of their own.
 */
export function payAsYouGoEnabled(subscription: SubscriptionState | undefined | null): boolean {
  if (!subscription) return false;
  if (!getPlan(subscription.plan).hardCap) return false;
  if (!subscription.stripeSubscriptionId) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Whether creation must be blocked at the included bucket for THIS account.
 *
 * Answers the question isHardCapped() can't: a Bronze account that has enrolled
 * in pay-as-you-go is no longer capped at 50, it is capped by its own spend cap
 * (enforced by the same overage path every paid tier uses).
 */
export function isHardCappedFor(
  id: string | undefined | null,
  subscription: SubscriptionState | undefined | null,
): boolean {
  // No rate means there is nothing to bill overage against (contact-sales
  // tiers). Enrollment cannot unlock what has no price.
  if (getPlan(id).overageRatePerItem == null) return true;
  return getPlan(id).hardCap && !payAsYouGoEnabled(subscription);
}

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return PLANS[to].tier > PLANS[from].tier;
}

export function isDowngrade(from: PlanId, to: PlanId): boolean {
  return PLANS[to].tier < PLANS[from].tier;
}

/** Resolve a Stripe base price id (from env) for a plan + interval. */
export function stripeBasePriceId(id: PlanId, interval: BillingInterval): string | undefined {
  const env = interval === 'annual' ? PLANS[id].stripe.baseAnnualPriceIdEnv : PLANS[id].stripe.baseMonthlyPriceIdEnv;
  return env ? process.env[env] : undefined;
}

/** Resolve the Stripe metered (overage) price id (from env) for a plan. */
export function stripeMeterPriceId(id: PlanId): string | undefined {
  const env = PLANS[id].stripe.meterPriceIdEnv;
  return env ? process.env[env] : undefined;
}

/** Stripe Billing Meter event name a plan reports item usage against. */
export function stripeMeterEventName(id: PlanId): string | undefined {
  return PLANS[id].stripe.meterEventName;
}

/**
 * Map a Stripe base price id back to our internal plan id. Replaces the
 * PLAN_MAPPING objects that were duplicated across the codebase.
 */
export function priceIdToPlan(priceId: string | undefined | null): PlanId | undefined {
  if (!priceId) return undefined;
  for (const plan of Object.values(PLANS)) {
    if (plan.stripe.baseMonthlyPriceIdEnv && process.env[plan.stripe.baseMonthlyPriceIdEnv] === priceId) return plan.id;
    if (plan.stripe.baseAnnualPriceIdEnv && process.env[plan.stripe.baseAnnualPriceIdEnv] === priceId) return plan.id;
  }
  return undefined;
}

/**
 * Convert a customer's dollar overage budget into a number of items, using the
 * plan's per-item rate. Used by the customer-set spend cap. Returns null when
 * the plan has no overage rate (contact-sales) or usd is not positive.
 */
export function overageDollarsToItems(id: string | undefined | null, usd: number): number | null {
  const rate = overageRateFor(id);
  if (!rate || !(usd > 0)) return null;
  return Math.floor(usd / rate);
}
