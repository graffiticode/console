import { useState, useEffect } from 'react';
import axios from 'axios';
import { plans, PlanId, BillingInterval, isUpgrade } from '@/utils/plans';
import PlanCard from './PlanCard';

interface PricingPlansProps {
  userId: string;
  onSubscriptionChange?: () => void;
}

interface SubscriptionState {
  hasActiveSubscription: boolean;
  currentUserPlan: PlanId;
  currentBillingInterval: BillingInterval;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  hasPaymentMethod: boolean;
}

const defaultSubState: SubscriptionState = {
  hasActiveSubscription: false,
  currentUserPlan: 'demo',
  currentBillingInterval: 'monthly',
  renewalDate: null,
  cancelAtPeriodEnd: false,
  hasPaymentMethod: false,
};

export default function PricingPlans({ userId, onSubscriptionChange }: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [highlightedPlan, setHighlightedPlan] = useState<string>('pro');
  const [pendingCancelPlan, setPendingCancelPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubscriptionState>(defaultSubState);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const [subscriptionResponse, methodsResponse] = await Promise.all([
        axios.get(`/api/payments/subscription?userId=${userId}`),
        axios.get(`/api/payments/methods?userId=${userId}`)
      ]);

      const subscription = subscriptionResponse.data;
      const plan: PlanId = subscription.plan || 'demo';
      const effectiveInterval: BillingInterval = subscription.scheduledInterval || subscription.interval || 'monthly';
      const methods = methodsResponse.data.paymentMethods || [];

      setSub({
        hasActiveSubscription: subscription.hasActiveSubscription || false,
        currentUserPlan: plan,
        currentBillingInterval: effectiveInterval,
        renewalDate: subscription.currentBillingPeriod?.end || null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        hasPaymentMethod: methods.length > 0,
      });

      // Annual billing is hidden from the page for now; always present monthly.
      setBillingInterval('monthly');
      setHighlightedPlan(
        subscription.hasActiveSubscription && plan !== 'demo' ? plan : 'pro'
      );
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = async (planId: string) => {
    if (pendingCancelPlan !== planId) {
      setPendingCancelPlan(planId);
      return;
    }

    setProcessing(true);
    setSelectedPlan(planId);

    try {
      const response = await axios.post('/api/payments/cancel-subscription', {
        userId,
        immediately: false
      });

      if (response.data.success) {
        setPendingCancelPlan(null);
        await fetchUserData();
        onSubscriptionChange?.();
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to cancel subscription. Please try again.';
      alert(errorMessage);
      setPendingCancelPlan(null);
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const cancelToDemo = async () => {
    setProcessing(true);
    setSelectedPlan('demo');
    try {
      const response = await axios.post('/api/payments/cancel-subscription', {
        userId,
        immediately: true
      });
      if (response.data.success) {
        await fetchUserData();
        onSubscriptionChange?.();
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const quickSubscribe = async (planId: string, wouldBeUpgrade: boolean) => {
    if (wouldBeUpgrade) {
      const isPlanUpgrade = isUpgrade(sub.currentUserPlan, planId as PlanId);
      const targetName = plans.find((p) => p.id === planId)?.name || planId;
      let message: string;
      if (sub.currentUserPlan === 'starter' && isPlanUpgrade) {
        // Starter migration: switch now, no immediate charge, billed at renewal.
        message = `Upgrade to ${targetName}? Your plan changes immediately at no extra charge now — you'll be billed the ${targetName} price at your next renewal.`;
      } else if (isPlanUpgrade) {
        message = `Upgrade to ${targetName}? You'll receive credit for the unused portion of your current plan and be charged immediately.`;
      } else {
        message = `Switch to annual billing? You'll receive credit for the unused portion of your current plan and be charged immediately.`;
      }
      if (!confirm(message)) {
        setProcessing(false);
        setSelectedPlan(null);
        return true; // handled
      }
    }

    try {
      const quickResponse = await axios.post('/api/payments/quick-subscribe', {
        userId,
        planId,
        interval: billingInterval
      });

      if (quickResponse.data.success) {
        await fetchUserData();
        setProcessing(false);
        setSelectedPlan(null);
        onSubscriptionChange?.();
        return true;
      }
      // requiresAction — fall through
      return false;
    } catch (quickError: any) {
      if (quickError.response?.data?.requiresCheckout) {
        console.log('Quick subscribe not available, using checkout...');
        return false;
      }
      throw quickError;
    }
  };

  const handleError = (error: any) => {
    console.error('Error creating subscription:', error);
    console.error('Error details:', error.response?.data);

    if (error.response?.data?.requiresPaymentMethod) {
      alert(error.response.data.message || 'To change your plan or billing interval, please add a payment method in the Payment Methods tab first.');
    } else if (error.response?.data?.error) {
      alert(error.response.data.error + (error.response.data.details ? '\n\n' + error.response.data.details : ''));
    } else if (error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert('Failed to process your request. Please try again.');
    }

    setProcessing(false);
    setSelectedPlan(null);
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'demo' && !sub.hasActiveSubscription) return;
    if (planId === 'demo' && sub.hasActiveSubscription) {
      await cancelToDemo();
      return;
    }

    setSelectedPlan(planId);
    setProcessing(true);

    const isChangingInterval = sub.hasActiveSubscription && planId === sub.currentUserPlan && billingInterval !== sub.currentBillingInterval;
    const wouldBeUpgrade = sub.currentUserPlan === 'demo' ||
      isUpgrade(sub.currentUserPlan, planId as PlanId) ||
      (isChangingInterval && sub.currentBillingInterval === 'monthly' && billingInterval === 'annual');

    try {
      if (sub.hasActiveSubscription && sub.currentUserPlan !== 'demo') {
        console.log('Attempting quick subscribe:', { isChangingInterval, wouldBeUpgrade, planId, interval: billingInterval });
        const handled = await quickSubscribe(planId, wouldBeUpgrade);
        if (handled) return;
      }

      console.log('Falling back to Stripe Checkout:', { userId, planId, interval: billingInterval });
      const response = await axios.post('/api/payments/create-checkout-session', {
        userId,
        planId,
        interval: billingInterval
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingInterval={billingInterval}
            currentUserPlan={sub.currentUserPlan}
            currentBillingInterval={sub.currentBillingInterval}
            hasActiveSubscription={sub.hasActiveSubscription}
            cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
            renewalDate={sub.renewalDate}
            highlightedPlan={highlightedPlan}
            pendingCancelPlan={pendingCancelPlan}
            processing={processing}
            selectedPlan={selectedPlan}
            onHighlight={setHighlightedPlan}
            onResetPendingCancel={() => setPendingCancelPlan(null)}
            onCancelClick={handleCancelClick}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>
    </div>
  );
}
