import { useState, useEffect } from 'react';
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
    monthlyUnits: 1000,
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
    monthlyUnits: 50000,
    features: [
      '50,000 compile units/month',
      'Additional compiles at $0.001 each',
      'Access to all languages',
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
    monthlyUnits: 1000000,
    features: [
      '1,000,000 compile units/month',
      'Additional compiles at $0.0005 each',
      'Access to all languages',
      'Priority support',
      'Private and public tasks',
      'Advanced IDE features',
      'API access',
      'Automatic overage protection',
      'Team collaboration features'
    ],
    cta: 'Go Max'
  }
];

export default function PricingPlans({ userId }: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [highlightedPlan, setHighlightedPlan] = useState<string>('pro');
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [currentUserPlan, setCurrentUserPlan] = useState<string>('free');
  const [currentBillingInterval, setCurrentBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check user's subscription status and payment methods
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Check current subscription
      const [subscriptionResponse, methodsResponse] = await Promise.all([
        axios.get(`/api/payments/subscription?userId=${userId}`),
        axios.get(`/api/payments/methods?userId=${userId}`)
      ]);

      // Set current plan
      const subscription = subscriptionResponse.data;
      if (subscription.plan) {
        setCurrentUserPlan(subscription.plan === 'teams' ? 'teams' : subscription.plan);
        // If user has a paid plan, highlight it
        if (subscription.plan !== 'free') {
          setHighlightedPlan(subscription.plan === 'teams' ? 'teams' : subscription.plan);
        }
      }

      // Set current billing interval
      // If there's a scheduled interval change, that becomes the "current" selection
      const effectiveInterval = subscription.scheduledInterval || subscription.interval;

      if (effectiveInterval) {
        setCurrentBillingInterval(effectiveInterval);
        setBillingInterval(effectiveInterval);
      }

      // Set renewal date
      if (subscription.currentBillingPeriod?.end) {
        setRenewalDate(subscription.currentBillingPeriod.end);
      }

      // Check payment methods - any payment method is sufficient for interval changes
      const methods = methodsResponse.data.paymentMethods || [];
      setHasPaymentMethod(methods.length > 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;

    setSelectedPlan(planId);
    setProcessing(true);

    // Check if this is an interval change on current plan
    const isChangingInterval = planId === currentUserPlan && billingInterval !== currentBillingInterval;

    // Check if this is an upgrade (Pro -> Max or Monthly -> Annual)
    const isUpgrade =
      (currentUserPlan === 'pro' && planId === 'teams') ||
      (currentBillingInterval === 'monthly' && billingInterval === 'annual');

    try {
      // For plan/interval changes, always try quick subscribe first
      if (isChangingInterval || currentUserPlan !== 'free') {
        console.log('Attempting quick subscribe:', { isChangingInterval, isUpgrade, planId, interval: billingInterval });

        // Show confirmation for upgrades only
        if (isUpgrade) {
          const upgradeType = currentUserPlan === 'pro' && planId === 'teams'
            ? 'Max plan'
            : 'annual billing';

          if (!confirm(`Upgrade to ${upgradeType}? You'll receive credit for the unused portion of your current plan and be charged immediately.`)) {
            setProcessing(false);
            setSelectedPlan(null);
            return;
          }
        }

        try {
          const quickResponse = await axios.post('/api/payments/quick-subscribe', {
            userId,
            planId,
            interval: billingInterval
          });

          if (quickResponse.data.success) {
            // Refresh the data to show the new plan
            await fetchUserData();
            setProcessing(false);
            setSelectedPlan(null);
            return;
          } else if (quickResponse.data.requiresAction) {
            // Handle 3D Secure or other authentication
            // Fall through to regular checkout
          }
        } catch (quickError: any) {
          if (quickError.response?.data?.requiresCheckout) {
            // Fall through to regular checkout
            console.log('Quick subscribe not available, using checkout...');
          } else {
            throw quickError;
          }
        }
      }

      // Fall back to regular Stripe Checkout for NEW subscriptions
      console.log('Falling back to Stripe Checkout:', { userId, planId, interval: billingInterval });
      const response = await axios.post('/api/payments/create-checkout-session', {
        userId,
        planId,
        interval: billingInterval
      });

      // Redirect to Stripe Checkout
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      console.error('Error details:', error.response?.data);

      // Handle specific error cases
      if (error.response?.data?.requiresPaymentMethod) {
        alert(error.response.data.message || 'To change your plan or billing interval, please add a payment method in the Payment Methods tab first.');
      } else if (error.response?.data?.error) {
        // Show the specific error from the API
        alert(error.response.data.error + (error.response.data.details ? '\n\n' + error.response.data.details : ''));
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to process your request. Please try again.');
      }

      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
          const units = billingInterval === 'annual' ? plan.monthlyUnits * 12 : plan.monthlyUnits;
          const isCurrentPlan = plan.id === currentUserPlan;
          const isSameBillingInterval = billingInterval === currentBillingInterval;
          const isChangingBilling = isCurrentPlan && !isSameBillingInterval;

          // Check if this plan selection would be an upgrade or downgrade
          const wouldBeUpgrade =
            (currentUserPlan === 'pro' && plan.id === 'teams') ||
            (isCurrentPlan && currentBillingInterval === 'monthly' && billingInterval === 'annual');

          const wouldBeDowngrade =
            (currentUserPlan === 'teams' && plan.id === 'pro') ||
            (currentUserPlan === 'teams' && plan.id === 'free') ||
            (currentUserPlan === 'pro' && plan.id === 'free') ||
            (isCurrentPlan && currentBillingInterval === 'annual' && billingInterval === 'monthly');

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
                    {isChangingBilling
                      ? `Change to ${billingInterval === 'annual' ? 'Annual' : 'Monthly'}`
                      : isCurrentPlan
                      ? 'Current Plan'
                      : wouldBeDowngrade
                      ? 'Downgrade'
                      : 'Upgrade Now'}
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
                  {units.toLocaleString()} compile units
                </p>
                <p className="text-xs text-gray-500">
                  {billingInterval === 'annual' ? 'per year' : 'per month'}
                </p>
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
                disabled={plan.disabled || processing || (isCurrentPlan && isSameBillingInterval)}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  plan.id === highlightedPlan
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
                } ${
                  (plan.disabled || processing || (isCurrentPlan && isSameBillingInterval)) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing && selectedPlan === plan.id
                  ? 'Processing...'
                  : isChangingBilling
                  ? `Change to ${billingInterval === 'annual' ? 'Annual' : 'Monthly'}`
                  : isCurrentPlan && isSameBillingInterval
                  ? 'Current Plan'
                  : plan.cta}
              </button>

              {isChangingBilling && renewalDate && !wouldBeUpgrade && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  The new interval will be applied when the subscription is renewed on{' '}
                  {new Date(renewalDate).toLocaleDateString()}
                </p>
              )}

              {wouldBeUpgrade && (
                <p className="mt-2 text-xs text-green-600 text-center font-medium">
                  Upgrade applies immediately with credit for unused time
                </p>
              )}

              {wouldBeDowngrade && renewalDate && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Downgrade will take effect on {new Date(renewalDate).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}