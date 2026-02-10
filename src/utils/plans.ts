export type PlanId = 'demo' | 'starter' | 'pro' | 'teams';
export type BillingInterval = 'monthly' | 'annual';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyUnits: number;
  features: string[];
  cta: string;
  isFree?: boolean;
}

export const plans: Plan[] = [
  {
    id: 'demo',
    name: 'Demo',
    description: 'Try Graffiticode for free',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyUnits: 100,
    features: [
      '100 compile units per month',
      'No credit card required',
      'Community support',
      'Email support',
      'Upgrade anytime'
    ],
    cta: 'Current Plan',
    isFree: true
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for getting started',
    monthlyPrice: 10,
    annualPrice: 100,
    monthlyUnits: 2000,
    features: [
      '2,000 compile units per month',
      'Additional compiles at $0.005 each',
      'Community support',
      'Email support',
      'Cancel anytime'
    ],
    cta: 'Get Started'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Great for serious creators',
    monthlyPrice: 100,
    annualPrice: 1000,
    monthlyUnits: 100000,
    features: [
      '100,000 compile units per month',
      'Additional compiles at $0.001 each',
      'Community support',
      'Email support',
      'Cancel anytime'
    ],
    cta: 'Go Pro'
  },
  {
    id: 'teams',
    name: 'Team',
    description: 'For teams and high volume',
    monthlyPrice: 1000,
    annualPrice: 10000,
    monthlyUnits: 2000000,
    features: [
      '2,000,000 compile units per month',
      'Additional compiles at $0.0005 each',
      'Up to 10 accounts included',
      'Priority email support',
      'Language development services',
      'Cancel anytime'
    ],
    cta: 'Go Team'
  }
];

const PLAN_TIER: Record<PlanId, number> = { demo: 0, starter: 1, pro: 2, teams: 3 };

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return PLAN_TIER[to] > PLAN_TIER[from];
}

export function isDowngrade(from: PlanId, to: PlanId): boolean {
  return PLAN_TIER[to] < PLAN_TIER[from];
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
  if (opts.isFree && opts.hasActiveSubscription) return 'Downgrade to Demo';
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
    plans.map(p => [p.id, { name: p.name, monthlyUnits: p.monthlyUnits, price: { monthly: p.monthlyPrice, annual: p.annualPrice } }])
  ) as Record<PlanId, { name: string; monthlyUnits: number; price: { monthly: number; annual: number } }>;
