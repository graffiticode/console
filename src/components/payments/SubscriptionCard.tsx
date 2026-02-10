import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { planDetails } from '@/utils/plans';

interface SubscriptionData {
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  plan: 'demo' | 'starter' | 'pro' | 'teams';
  interval: 'monthly' | 'annual' | null;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
  nextBillingDate?: string;
  currentBillingPeriod?: {
    start: string;
    end: string;
  };
}

interface SubscriptionCardProps {
  userId: string;
}

export default function SubscriptionCard({ userId }: SubscriptionCardProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`/api/payments/subscription?userId=${userId}`);
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Default to demo tier if no subscription found
      setSubscription({
        status: 'none',
        plan: 'demo',
        interval: 'monthly'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await axios.post('/api/payments/cancel-subscription', { userId });
      await fetchSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleResumeSubscription = async () => {
    setCancelling(true);
    try {
      const response = await axios.post('/api/payments/resume-subscription', { userId });

      // If payment method required, redirect to checkout
      if (response.data.requiresPaymentMethod && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
        return;
      }

      await fetchSubscription();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('Failed to resume subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-none"></div>
      </div>
    );
  }

  if (!subscription) {
    return <div>Error loading subscription data</div>;
  }

  const plan = planDetails[subscription.plan] || planDetails.demo;
  const currentPrice = subscription.interval && plan.price && typeof plan.price === 'object'
    ? plan.price[subscription.interval]
    : plan.price && typeof plan.price === 'number' ? plan.price : 0;

  // Units are always monthly (reset monthly even for annual plans)
  const displayUnits = plan.monthlyUnits;

  const StatusIcon = (subscription.status === 'active' || subscription.status === 'trialing')
    ? CheckCircleIcon
    : subscription.status === 'past_due'
    ? ClockIcon
    : XCircleIcon;

  const statusColor = (subscription.status === 'active' || subscription.status === 'trialing')
    ? 'text-green-600 bg-green-100'
    : subscription.status === 'past_due'
    ? 'text-yellow-600 bg-yellow-100'
    : 'text-gray-600 bg-gray-100';

  const getStatusLabel = () => {
    if (subscription.status === 'none') return 'Free Tier';
    if (subscription.plan === 'demo') return 'Free Tier';
    if (subscription.status === 'active' || subscription.status === 'trialing') return 'Active';
    if (subscription.status === 'past_due') return 'Past Due';
    if (subscription.status === 'canceled') return 'Canceled';
    return subscription.status;
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-none">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Current Subscription
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {getStatusLabel()}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Plan</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              {plan.name}
            </dd>
            <dd className="mt-1 text-sm text-gray-600">
              {displayUnits.toLocaleString()} compile units per month
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Billing</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              {currentPrice === 0 ? (
                'Free'
              ) : (
                <>
                  ${currentPrice}
                  <span className="text-sm text-gray-500 ml-1">
                    / {subscription.interval === 'annual' ? 'year' : 'month'}
                  </span>
                </>
              )}
            </dd>
            <dd className="mt-1 text-sm text-gray-600">
              {currentPrice === 0 ? 'No payment required' : subscription.interval ? `Billed ${subscription.interval === 'monthly' ? 'monthly' : 'annually'}` : 'Billed monthly'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Renewal Date</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              {subscription.nextBillingDate || subscription.currentPeriodEnd ? (
                new Date(subscription.nextBillingDate || subscription.currentPeriodEnd!).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              ) : (
                '—'
              )}
            </dd>
            {subscription.nextBillingDate || subscription.currentPeriodEnd ? (
              <dd className="mt-1 text-sm text-gray-600">
                {subscription.cancelAtPeriodEnd
                  ? 'Subscription ends'
                  : subscription.plan === 'demo'
                  ? 'Usage resets'
                  : subscription.status === 'trialing'
                  ? 'First payment due'
                  : 'Next payment due'}
              </dd>
            ) : (
              <dd className="mt-1 text-sm text-gray-600">No renewal date set</dd>
            )}
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-none">
            <p className="text-sm text-yellow-800">
              Your subscription will be cancelled at the end of the current billing period.
            </p>
            <button
              onClick={handleResumeSubscription}
              disabled={cancelling}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-none text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {cancelling ? 'Processing...' : 'Resume Subscription'}
            </button>
          </div>
        )}

        {subscription.status === 'past_due' && (
          <div className="mt-6 p-4 bg-red-50 rounded-none">
            <p className="text-sm text-red-800">
              Your subscription is past due. Please update your payment method to continue using the service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}