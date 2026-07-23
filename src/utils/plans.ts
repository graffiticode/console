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
  return r == null ? '' : `$${r.toFixed(r < 0.1 ? 3 : 2).replace(/0+$/, '').replace(/\.$/, '')}`;
};

export const plans: Plan[] = [
  {
    id: 'demo',
    name: PLANS.demo.displayName,
    description: 'Free, no credit card required',
    monthlyPrice: PLANS.demo.basePriceMonthly,
    annualPrice: PLANS.demo.basePriceAnnual,
    monthlyUnits: PLANS.demo.includedItems,
    features: [
      `${fmt(PLANS.demo.includedItems)} items per month`,
      'No credit card required',
      'Community support',
      'Hard cap — upgrade to create more',
    ],
    cta: 'Current Plan',
    isFree: true,
  },
  {
    id: 'pro',
    name: PLANS.pro.displayName,
    description: 'For production agent surfaces',
    monthlyPrice: PLANS.pro.basePriceMonthly,
    annualPrice: PLANS.pro.basePriceAnnual,
    monthlyUnits: PLANS.pro.includedItems,
    features: [
      `${fmt(PLANS.pro.includedItems)} items per month included`,
      `Additional items at ${rate('pro')} each`,
      'Set an overage spend cap',
      'Email support',
      'Cancel anytime',
    ],
    cta: 'Choose Silver',
  },
  {
    id: 'teams',
    name: PLANS.teams.displayName,
    description: 'For higher-volume tenants',
    monthlyPrice: PLANS.teams.basePriceMonthly,
    annualPrice: PLANS.teams.basePriceAnnual,
    monthlyUnits: PLANS.teams.includedItems,
    features: [
      `${fmt(PLANS.teams.includedItems)} items per month included`,
      `Additional items at ${rate('teams')} each`,
      'Set an overage spend cap',
      'Priority support',
      'Cancel anytime',
    ],
    cta: 'Choose Gold',
  },
  {
    id: 'platinum',
    name: PLANS.platinum.displayName,
    description: 'For high-volume, done-for-you deployments',
    monthlyPrice: PLANS.platinum.basePriceMonthly,
    annualPrice: PLANS.platinum.basePriceAnnual,
    monthlyUnits: PLANS.platinum.includedItems,
    features: [
      `${fmt(PLANS.platinum.includedItems)} items per month included`,
      `Additional items at ${rate('platinum')} each`,
      'Custom language development',
      'Bring your own model key (BYOK)',
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
  if (opts.isFree && opts.hasActiveSubscription) return 'Downgrade to Free';
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
