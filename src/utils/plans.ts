export type PlanId = 'demo' | 'starter' | 'pro' | 'teams' | 'enterprise';
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
  // Non-self-serve plan: custom pricing, sold via "Contact Sales" rather than Stripe checkout.
  contactSales?: boolean;
  // Price text shown in place of a dollar amount for contactSales plans (e.g. "Custom").
  priceLabel?: string;
  // Where the Contact Sales CTA points (mailto: or URL).
  contactHref?: string;
}

export const plans: Plan[] = [
  {
    id: 'demo',
    name: 'Free',
    description: 'Everyone plays',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyUnits: 250,
    features: [
      '250 compile units per month',
      'No credit card required',
      'Community support',
      'Email support',
      'Upgrade anytime'
    ],
    cta: 'Current Plan',
    isFree: true
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Serious making',
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
    description: 'Secure collaboration',
    monthlyPrice: 1000,
    annualPrice: 10000,
    monthlyUnits: 2000000,
    features: [
      '2,000,000 compile units per month',
      'Additional compiles at $0.0005 each',
      'Up to 10 accounts included',
      'Priority support',
      'Language development services',
      'Cancel anytime'
    ],
    cta: 'Go Team'
  },
  {
    id: 'enterprise',
    name: 'Custom',
    description: 'Agent accessibility',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyUnits: 0,
    features: [
      'A managed, agent-driveable interface to your product',
      'Custom language development & evolution',
      'Micro-agent training, evaluation & benchmarking',
      'Hosted infrastructure & managed MCP endpoints',
      'Monitoring & dedicated support',
      'Bring your own model keys — never pay for tokens'
    ],
    cta: 'Contact Sales',
    contactSales: true,
    priceLabel: "Let's talk",
    contactHref: 'mailto:jeff@graffiticode.com?subject=Graffiticode%20Built%20for%20You%20inquiry'
  }
];

// Starter is discontinued and no longer offered (removed from `plans` above), but its
// definition is retained so legacy/straggler subscribers and historical data still
// resolve via `planDetails`, `PLAN_TIER`, and the `PlanId` type.
const starterPlan: Plan = {
  id: 'starter',
  name: 'Starter',
  description: 'Perfect for getting started',
  monthlyPrice: 10,
  annualPrice: 100,
  monthlyUnits: 5000,
  features: [
    '5,000 compile units per month',
    'Additional compiles at $0.002 each',
    'Community support',
    'Email support',
    'Cancel anytime'
  ],
  cta: 'Get Started'
};

const PLAN_TIER: Record<PlanId, number> = { demo: 0, starter: 1, pro: 2, teams: 3, enterprise: 4 };

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
