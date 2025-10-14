import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface PricingPlansProps {
  userId: string;
}

const plans = [
  {
    id: 'free',
    name: 'Demo',
    description: 'Perfect for trying out Graffiticode',
    monthlyPrice: 0,
    annualPrice: 0,
    units: 1000,
    features: [
      '1,000 compile units/month',
      'Limited language access',
      'Community support',
      'Public tasks only',
      'Basic IDE features'
    ],
    cta: 'Current Plan',
    disabled: true
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Great for serious creators',
    monthlyPrice: 50,
    annualPrice: 500,
    units: 50000,
    features: [
      '50,000 compile units/month',
      'Access to all languages',
      'Additional compiles at $0.001 each',
      'Email support',
      'Private and public tasks',
      'Advanced IDE features',
      'API access',
      'Automatic overage protection'
    ],
    cta: 'Go Pro'
  },
  {
    id: 'teams',
    name: 'Max',
    description: 'For teams and high volume API calls',
    monthlyPrice: 500,
    annualPrice: 5000,
    units: 1000000,
    features: [
      '1,000,000 compile units/month',
      'Access to all languages',
      'Additional compiles at $0.0002 each',
      'Priority support',
      'Private and public tasks',
      'Team collaboration features',
      'Advanced IDE features',
      'API access',
      'Automatic overage protection'
    ],
    cta: 'Go Max'
  }
];

export default function PricingPlans({ userId }: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [highlightedPlan, setHighlightedPlan] = useState<string>('pro');

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;

    setSelectedPlan(planId);
    setProcessing(true);

    try {
      const response = await axios.post('/api/payments/create-checkout-session', {
        userId,
        planId,
        interval: billingInterval
      });

      // Redirect to Stripe Checkout
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="relative flex bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            className={`${
              billingInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            } relative rounded-md py-2 px-6 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 transition-all`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly billing
          </button>
          <button
            type="button"
            className={`${
              billingInterval === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            } relative rounded-md py-2 px-6 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 transition-all ml-0.5`}
            onClick={() => setBillingInterval('annual')}
          >
            Annual billing
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
          const isCurrentPlan = plan.id === 'free'; // This should be dynamic based on user's actual plan

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg shadow-md bg-white p-6 ${
                plan.id === highlightedPlan ? 'ring-2 ring-indigo-500' : ''
              } cursor-pointer`}
              onClick={() => setHighlightedPlan(plan.id)}
            >
              {plan.id === highlightedPlan && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Downgrade Now' : 'Upgrade Now'}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${price.toLocaleString()}</span>
                {plan.id !== 'free' && (
                  <span className="text-gray-500 ml-1">
                    /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-900">
                  {plan.units.toLocaleString()} compile units
                </p>
                <p className="text-xs text-gray-500">per month</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={plan.disabled || processing || isCurrentPlan}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  plan.id === highlightedPlan
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
                } ${
                  (plan.disabled || processing || isCurrentPlan) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing && selectedPlan === plan.id
                  ? 'Processing...'
                  : isCurrentPlan
                  ? 'Current Plan'
                  : plan.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}