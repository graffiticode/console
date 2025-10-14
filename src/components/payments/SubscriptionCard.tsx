import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface SubscriptionData {
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none';
  plan: 'free' | 'pro' | 'max';
  interval: 'monthly' | 'annual' | null;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
}

interface SubscriptionCardProps {
  userId: string;
}

const planDetails = {
  free: { name: 'Free', units: 1000, price: 0 },
  pro: { name: 'Pro', units: 50000, price: { monthly: 50, annual: 500 } },
  max: { name: 'Max', units: 1000000, price: { monthly: 500, annual: 5000 } },
};

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
      // Default to free tier if no subscription found
      setSubscription({
        status: 'none',
        plan: 'free',
        interval: null
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
      await axios.post('/api/payments/resume-subscription', { userId });
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
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!subscription) {
    return <div>Error loading subscription data</div>;
  }

  const plan = planDetails[subscription.plan] || planDetails.free;
  const currentPrice = subscription.interval && subscription.plan !== 'free' && plan.price && typeof plan.price === 'object'
    ? plan.price[subscription.interval]
    : 0;

  const StatusIcon = subscription.status === 'active'
    ? CheckCircleIcon
    : subscription.status === 'past_due'
    ? ClockIcon
    : XCircleIcon;

  const statusColor = subscription.status === 'active'
    ? 'text-green-600 bg-green-100'
    : subscription.status === 'past_due'
    ? 'text-yellow-600 bg-yellow-100'
    : 'text-gray-600 bg-gray-100';

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Current Subscription
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {subscription.status === 'none' ? 'Free Tier' : subscription.status}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Plan</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              {plan.name}
            </dd>
            <dd className="mt-1 text-sm text-gray-600">
              {plan.units.toLocaleString()} compile units per month
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Billing</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              ${currentPrice}
              {subscription.interval && (
                <span className="text-sm text-gray-500 ml-1">
                  / {subscription.interval === 'monthly' ? 'month' : 'year'}
                </span>
              )}
            </dd>
            {subscription.currentPeriodEnd && (
              <dd className="mt-1 text-sm text-gray-600">
                {subscription.cancelAtPeriodEnd
                  ? 'Cancels on '
                  : 'Renews on '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </dd>
            )}
          </div>
        </div>

        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <div className="mt-6">
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {cancelling ? 'Processing...' : 'Cancel Subscription'}
            </button>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              Your subscription will be cancelled at the end of the current billing period.
            </p>
            <button
              onClick={handleResumeSubscription}
              disabled={cancelling}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {cancelling ? 'Processing...' : 'Resume Subscription'}
            </button>
          </div>
        )}

        {subscription.status === 'past_due' && (
          <div className="mt-6 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-800">
              Your subscription is past due. Please update your payment method to continue using the service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}