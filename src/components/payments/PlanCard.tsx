import { CheckIcon } from '@heroicons/react/24/outline';
import { Plan, PlanId, BillingInterval, isUpgrade, isDowngrade, getButtonLabel } from '@/utils/plans';

interface PlanCardProps {
  plan: Plan;
  billingInterval: BillingInterval;
  currentUserPlan: PlanId;
  currentBillingInterval: BillingInterval;
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  renewalDate: string | null;
  highlightedPlan: string;
  pendingCancelPlan: string | null;
  processing: boolean;
  selectedPlan: string | null;
  onHighlight: (planId: string) => void;
  onResetPendingCancel: () => void;
  onCancelClick: (planId: string) => void;
  onSubscribe: (planId: string) => void;
}

export default function PlanCard({
  plan, billingInterval, currentUserPlan, currentBillingInterval,
  hasActiveSubscription, cancelAtPeriodEnd, renewalDate,
  highlightedPlan, pendingCancelPlan, processing, selectedPlan,
  onHighlight, onResetPendingCancel, onCancelClick, onSubscribe,
}: PlanCardProps) {
  const price = billingInterval === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const isFree = !!plan.isFree;
  const isCurrentPlan = isFree
    ? !hasActiveSubscription && currentUserPlan === 'demo'
    : hasActiveSubscription && plan.id === currentUserPlan;
  const isSameBillingInterval = billingInterval === currentBillingInterval;
  const isChangingBilling = isCurrentPlan && !isSameBillingInterval && !isFree;

  const wouldBeUpgrade = !isFree && (
    isUpgrade(currentUserPlan, plan.id) ||
    (isCurrentPlan && currentBillingInterval === 'monthly' && billingInterval === 'annual')
  );

  const wouldBeDowngrade = !isFree && hasActiveSubscription && (
    isDowngrade(currentUserPlan, plan.id) ||
    (isCurrentPlan && currentBillingInterval === 'annual' && billingInterval === 'monthly')
  );

  const isHighlighted = plan.id === highlightedPlan;
  const isPendingCancel = pendingCancelPlan === plan.id;

  const badgeLabel = isFree && isCurrentPlan
    ? 'Current Plan'
    : !hasActiveSubscription
    ? 'Select Plan'
    : isChangingBilling
    ? `Change to ${billingInterval === 'annual' ? 'Annual' : 'Monthly'}`
    : isCurrentPlan
    ? 'Current Plan'
    : wouldBeDowngrade
    ? 'Downgrade'
    : 'Upgrade Now';

  const buttonLabel = getButtonLabel({
    planId: plan.id,
    planName: plan.name,
    planCta: plan.cta,
    isFree,
    isCurrentPlan,
    hasActiveSubscription,
    cancelAtPeriodEnd,
    isSameBillingInterval,
    isChangingBilling,
    pendingCancel: isPendingCancel,
    processing: processing && selectedPlan === plan.id,
    currentUserPlan,
    billingInterval,
  });

  return (
    <div
      className={`relative rounded-none shadow-md bg-white p-6 ${
        isHighlighted ? 'ring-2 ring-gray-500' : ''
      } cursor-pointer`}
      onClick={() => {
        onHighlight(plan.id);
        if (pendingCancelPlan && pendingCancelPlan !== plan.id) {
          onResetPendingCancel();
        }
      }}
    >
      {isHighlighted && !(isFree && !isCurrentPlan) && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {badgeLabel}
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
      </div>

      <div className="mb-6">
        {isFree ? (
          <span className="text-4xl font-bold text-gray-900">Free</span>
        ) : (
          <>
            <span className="text-4xl font-bold text-gray-900">${price.toLocaleString()}</span>
            <span className="text-gray-500 ml-1">
              /{billingInterval === 'monthly' ? 'mo' : 'yr'}
            </span>
          </>
        )}
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
        onClick={() => {
          if (isFree && isCurrentPlan) return;
          if (isCurrentPlan && isSameBillingInterval && !cancelAtPeriodEnd && !isFree) {
            onCancelClick(plan.id);
          } else {
            onSubscribe(plan.id);
          }
        }}
        disabled={processing || cancelAtPeriodEnd || (isFree && !hasActiveSubscription)}
        className={`w-full py-2 px-4 rounded-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isPendingCancel
            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            : isFree && isCurrentPlan
            ? 'bg-gray-200 text-gray-600 cursor-default'
            : isHighlighted
            ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
            : 'bg-gray-50 text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
        } ${
          (processing || cancelAtPeriodEnd) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {buttonLabel}
      </button>

      {isChangingBilling && !wouldBeUpgrade && !wouldBeDowngrade && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Billing change applies immediately current credits retained
        </p>
      )}

      {wouldBeUpgrade && (
        <p className="mt-2 text-xs text-green-600 text-center font-medium">
          Upgrade applies immediately with credit for unused time
        </p>
      )}

      {wouldBeDowngrade && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Downgrades apply immediately current credits retained
        </p>
      )}

      {isPendingCancel && (
        <p className="mt-2 text-xs text-red-600 text-center font-medium">
          Click again to confirm. Cancels at end of billing period. Overage credits remain.
        </p>
      )}

      {cancelAtPeriodEnd && isCurrentPlan && renewalDate && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Ends {new Date(renewalDate).toLocaleDateString()}. Overage credits remain until used.
        </p>
      )}
    </div>
  );
}
