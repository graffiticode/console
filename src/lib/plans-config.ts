// Single source of truth for plan tiers and item-based pricing.
//
// Billing model: a flat base fee billed IN ADVANCE (on signup + each renewal)
// plus metered overage billed IN ARREARS on the next invoice. We meter one
// "item" per successfully created (compiled, valid) item; iteration, reads, and
// retrievals are free. Free is a hard cap (no overage); paid tiers meter overage
// via Stripe and may set an optional customer spend cap (see overage limit).
//
// Internal plan ids are kept stable for backward compat with existing Firestore
// subscription docs and Stripe mappings:
//   demo -> "Free", pro -> "Silver", teams -> "Gold", platinum -> "Platinum".
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
  /** When true, creation is blocked at includedItems (no overage path). */
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
    displayName: 'Free',
    basePriceMonthly: 0,
    basePriceAnnual: 0,
    includedItems: 50,
    overageRatePerItem: null,
    hardCap: true,
    tier: 0,
    stripe: {},
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

export function getPlan(id: string | undefined | null): PlanConfig {
  return PLANS[(id as PlanId)] ?? PLANS[DEFAULT_PLAN];
}

/** Items included in the base fee for a plan (0 for unknown). */
export function includedItemsFor(id: string | undefined | null): number {
  return getPlan(id).includedItems;
}

/** Per-item overage rate for a plan (null when no overage/hard cap). */
export function overageRateFor(id: string | undefined | null): number | null {
  return getPlan(id).overageRatePerItem;
}

export function isHardCapped(id: string | undefined | null): boolean {
  return getPlan(id).hardCap;
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
 * the plan has no overage rate (Free/contact-sales) or usd is not positive.
 */
export function overageDollarsToItems(id: string | undefined | null, usd: number): number | null {
  const rate = overageRateFor(id);
  if (!rate || !(usd > 0)) return null;
  return Math.floor(usd / rate);
}
