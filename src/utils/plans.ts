// UI-facing plan catalog. Values are derived from the single source of truth in
// src/lib/plans-config.ts — do not hardcode allowances/prices here.
import { PLANS, type PlanId as ConfigPlanId, type BillingInterval as ConfigBillingInterval, isUpgrade as configIsUpgrade, isDowngrade as configIsDowngrade } from '../lib/plans-config';

export type PlanId = ConfigPlanId;
export type BillingInterval = ConfigBillingInterval;

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  /** Items included per month (base fee bucket). */
  monthlyUnits: number;
  features: string[];
  cta: string;
  isFree?: boolean;
  // Non-self-serve plan: custom pricing, sold via "Contact Sales" rather than Stripe checkout.
  contactSales?: boolean;
  // Price text shown in place of a dollar amount for contactSales plans (e.g. "Custom").
  priceLabel?: string;
  // Where the Contact Sales CTA points (mailto: or URL).
  contactHref?: string;
}

const fmt = (n: number) => n.toLocaleString('en-US');
const rate = (id: PlanId) => {
  const r = PLANS[id].overageRatePerItem;
  // Always at least 2 decimals ($0.10, not $0.1); a 3rd only when it's significant ($0.025).
  return r == null ? '' : `$${r.toFixed(3).replace(/0$/, '')}`;
};

// Card copy mirrors the AGENT audience of the public pricing page
// (www/data/contract.ts → PRICING.plans + PRICING.audiences.agent), which is the
// same reader: someone driving the product through an agent, deciding which tier
// to be on. Keep the two in step — a customer who compares the marketing page
// with their billing page and finds different promises has found a bug.
//
// The framing that page settles on, and that these cards carry:
//   - every tier is a FLAT per-item rate with a monthly minimum, so the included
//     bucket costs the same per item as anything above it — no overage penalty;
//   - Bronze's included 50 need no card at all. A card (and a required spend
//     cap) buys ADDITIONAL items, nothing else;
//   - you move up a tier exactly when it lowers your per-item cost.
export const plans: Plan[] = [
  {
    id: 'demo',
    name: PLANS.demo.displayName,
    // Keep the word "free" here even though the plan is now named Bronze — it's
    // the zero-price signal that makes the tier convert. Only the plan NAME
    // moved; what you pay to start did not.
    description: 'The on-ramp — free to start, no credit card',
    monthlyPrice: PLANS.demo.basePriceMonthly,
    annualPrice: PLANS.demo.basePriceAnnual,
    monthlyUnits: PLANS.demo.includedItems,
    features: [
      `${fmt(PLANS.demo.includedItems)} items per month, free`,
      'No credit card for the included items',
      `Additional items at ${rate('demo')} each`,
      'A card and a monthly spend cap, only to go past the free items',
      'Community support',
    ],
    cta: 'Current Plan',
    isFree: true,
  },
  {
    id: 'pro',
    name: PLANS.pro.displayName,
    description: `Flat ${rate('pro')}/item with a $${fmt(PLANS.pro.basePriceMonthly)} monthly minimum`,
    monthlyPrice: PLANS.pro.basePriceMonthly,
    annualPrice: PLANS.pro.basePriceAnnual,
    monthlyUnits: PLANS.pro.includedItems,
    features: [
      `${fmt(PLANS.pro.includedItems)} items per month included`,
      `Additional items at ${rate('pro')} each — same rate, no overage penalty`,
      'Set an overage spend cap',
      'Email support',
      'Cancel anytime',
    ],
    cta: 'Choose Silver',
  },
  {
    id: 'teams',
    name: PLANS.teams.displayName,
    description: `Cheaper than ${PLANS.pro.displayName} above ~10,000 items/mo`,
    monthlyPrice: PLANS.teams.basePriceMonthly,
    annualPrice: PLANS.teams.basePriceAnnual,
    monthlyUnits: PLANS.teams.includedItems,
    features: [
      `${fmt(PLANS.teams.includedItems)} items per month included`,
      `Additional items at ${rate('teams')} each — same rate, no overage penalty`,
      'Set an overage spend cap',
      'Priority support',
      'Cancel anytime',
    ],
    cta: 'Choose Gold',
  },
  {
    id: 'platinum',
    name: PLANS.platinum.displayName,
    description: 'The partner engagement — our lowest per-item rate',
    monthlyPrice: PLANS.platinum.basePriceMonthly,
    annualPrice: PLANS.platinum.basePriceAnnual,
    monthlyUnits: PLANS.platinum.includedItems,
    features: [
      `${fmt(PLANS.platinum.includedItems)} items per month included`,
      `Additional items at ${rate('platinum')} each — our lowest rate`,
      // A public commitment, not a feature blurb: the pricing page states the
      // same terms (PRICING.languageService). Don't soften or add a turnaround
      // figure here that the marketing surface doesn't also promise.
      'Custom language development included — no separate build fee',
      'Pause or cancel any month',
      'Priority support',
    ],
    cta: 'Choose Platinum',
  },
];

// Starter is discontinued and no longer offered (removed from `plans` above), but its
// definition is retained so legacy/straggler subscribers and historical data still
// resolve via `planDetails`, `PLAN_TIER`, and the `PlanId` type.
const starterPlan: Plan = {
  id: 'starter',
  name: PLANS.starter.displayName,
  description: 'Discontinued',
  monthlyPrice: PLANS.starter.basePriceMonthly,
  annualPrice: PLANS.starter.basePriceAnnual,
  monthlyUnits: PLANS.starter.includedItems,
  features: [`${fmt(PLANS.starter.includedItems)} items per month`],
  cta: 'Get Started',
};

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return configIsUpgrade(from, to);
}

export function isDowngrade(from: PlanId, to: PlanId): boolean {
  return configIsDowngrade(from, to);
}

export interface ButtonLabelOpts {
  planId: PlanId;
  planName: string;
  planCta: string;
  isFree: boolean;
  isCurrentPlan: boolean;
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  isSameBillingInterval: boolean;
  isChangingBilling: boolean;
  pendingCancel: boolean;
  processing: boolean;
  currentUserPlan: PlanId;
  billingInterval: BillingInterval;
}

export function getButtonLabel(opts: ButtonLabelOpts): string {
  if (opts.processing) return 'Processing...';
  if (opts.isFree && opts.isCurrentPlan) return 'Current Plan';
  if (opts.isFree && opts.hasActiveSubscription) return `Downgrade to ${opts.planName}`;
  if (opts.cancelAtPeriodEnd && opts.isCurrentPlan) return 'Canceling at Period End';
  if (opts.isCurrentPlan && opts.isSameBillingInterval && !opts.isFree) {
    return opts.pendingCancel ? 'Confirm Cancel' : 'Cancel Plan';
  }
  if (opts.isChangingBilling) {
    return `Change to ${opts.billingInterval === 'annual' ? 'Annual' : 'Monthly'}`;
  }
  if (isUpgrade(opts.currentUserPlan, opts.planId)) return `Upgrade to ${opts.planName}`;
  if (isDowngrade(opts.currentUserPlan, opts.planId)) return `Downgrade to ${opts.planName}`;
  return opts.planCta;
}

export const planDetails: Record<PlanId, { name: string; monthlyUnits: number; price: { monthly: number; annual: number } }> =
  Object.fromEntries(
    [...plans, starterPlan].map(p => [p.id, { name: p.name, monthlyUnits: p.monthlyUnits, price: { monthly: p.monthlyPrice, annual: p.annualPrice } }])
  ) as Record<PlanId, { name: string; monthlyUnits: number; price: { monthly: number; annual: number } }>;
