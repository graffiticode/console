import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface UsageData {
  currentPeriodUnits: number;
  compileUnits: number;
  codeGenerationUnits: number;
  allocatedUnits: number;
  overageUnits: number;
  lastResetDate: string;
  currentPeriodEnd: string;
  autoOverageEnabled: boolean;
  autoOverageAvailable: boolean;
  autoOverageAmountUsd: number | null;
  autoOverageUnits: number | null;
}

interface UsageMonitorProps {
  userId: string;
}

export default function UsageMonitor({ userId }: UsageMonitorProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    fetchUsageData();
  }, [userId]);

  const fetchUsageData = async () => {
    try {
      const usageResponse = await axios.get(`/api/payments/usage?userId=${userId}`);
      setUsage(usageResponse.data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoOverage = async () => {
    if (!usage || savingToggle) return;
    const next = !usage.autoOverageEnabled;
    setSavingToggle(true);
    setUsage({ ...usage, autoOverageEnabled: next }); // optimistic
    try {
      await axios.post('/api/payments/auto-overage', { userId, enabled: next });
    } catch (error) {
      console.error('Error updating auto-overage:', error);
      setUsage({ ...usage, autoOverageEnabled: !next }); // revert
      alert('Failed to update automatic overage setting. Please try again.');
    } finally {
      setSavingToggle(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-none"></div>
        <div className="h-48 bg-gray-200 rounded-none"></div>
      </div>
    );
  }

  if (!usage) {
    return <div>Error loading usage data</div>;
  }

  const totalUnits = usage.allocatedUnits + usage.overageUnits;

  // The actual total usage should be the sum of compile + codeGen
  // If currentPeriodUnits doesn't match, we'll use the sum instead
  const actualUsageTotal = usage.compileUnits + usage.codeGenerationUnits;
  const displayTotal = actualUsageTotal > 0 ? actualUsageTotal : usage.currentPeriodUnits;

  const remainingUnits = totalUnits - displayTotal;
  const usagePercentage = totalUnits > 0 ? (displayTotal / totalUnits) * 100 : 0;

  // Calculate percentages of each type relative to total allocation
  const compilePercentage = totalUnits > 0 ? (usage.compileUnits / totalUnits) * 100 : 0;
  const codeGenPercentage = totalUnits > 0 ? (usage.codeGenerationUnits / totalUnits) * 100 : 0;

  // Check if there's unaccounted usage (shouldn't happen if data is consistent)
  const otherUsage = Math.max(0, usage.currentPeriodUnits - actualUsageTotal);
  const otherPercentage = totalUnits > 0 ? (otherUsage / totalUnits) * 100 : 0;

  const isNearLimit = usagePercentage > 80;
  const isAtLimit = remainingUnits <= 0;

  // Show alert when no plan is selected
  if (usage.allocatedUnits === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-none p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">No plan selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="bg-white overflow-hidden shadow rounded-none">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Current Period Usage
            </h3>
            {isNearLimit && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {isAtLimit ? 'Limit Reached' : 'Near Limit'}
              </span>
            )}
          </div>

          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{displayTotal.toLocaleString()} ({usagePercentage.toFixed(1)}%) compile units used</span>
              <span className="font-medium">{remainingUnits.toLocaleString()} remaining</span>
            </div>
            <div className="w-full bg-gray-200 h-8 relative overflow-hidden">
              {/* Compiles bar (first segment) */}
              <div
                className="h-8 bg-gray-400 absolute left-0 top-0 transition-all duration-300"
                style={{ width: `${Math.min(compilePercentage, 100)}%` }}
                title={`Compiles: ${usage.compileUnits.toLocaleString()} units (${compilePercentage.toFixed(1)}%)`}
              />
              {/* Code generation bar (second segment) */}
              <div
                className={`h-8 absolute top-0 transition-all duration-300 ${
                  isAtLimit ? 'bg-red-600' : isNearLimit ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
                style={{
                  left: `${Math.min(compilePercentage, 100)}%`,
                  width: `${Math.min(codeGenPercentage, Math.max(0, 100 - compilePercentage))}%`
                }}
                title={`Code Generation: ${usage.codeGenerationUnits.toLocaleString()} units (${codeGenPercentage.toFixed(1)}%)`}
              />
              {/* Other usage bar (third segment, if any) */}
              {otherUsage > 0 && (
                <div
                  className="h-8 bg-gray-500 absolute top-0 transition-all duration-300"
                  style={{
                    left: `${Math.min(compilePercentage + codeGenPercentage, 100)}%`,
                    width: `${Math.min(otherPercentage, Math.max(0, 100 - compilePercentage - codeGenPercentage))}%`
                  }}
                  title={`Other: ${otherUsage.toLocaleString()} units (${otherPercentage.toFixed(1)}%)`}
                />
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-400"></div>
                <span>Compiles: {usage.compileUnits.toLocaleString()} ({compilePercentage.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 ${isAtLimit ? 'bg-red-600' : isNearLimit ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
                <span>Code Gen: {usage.codeGenerationUnits.toLocaleString()} ({codeGenPercentage.toFixed(1)}%)</span>
              </div>
              {otherUsage > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500"></div>
                  <span>Other: {otherUsage.toLocaleString()} ({otherPercentage.toFixed(1)}%)</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Usage Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated
                </dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">
                    {usage.allocatedUnits.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    included compiles
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overage
                </dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">
                    {usage.overageUnits.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    overage compiles
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resets
                </dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">
                    {usage.currentPeriodEnd && new Date(usage.currentPeriodEnd).getFullYear() < 2099 ?
                      new Date(usage.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) :
                      'N/A'
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {usage.currentPeriodEnd && new Date(usage.currentPeriodEnd).getFullYear() < 2099 ? 'date account resets' : 'no reset date'}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automatic Overage */}
      <div className="bg-white overflow-hidden shadow rounded-none">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Automatic Overage
          </h3>

          {usage.autoOverageAvailable ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Charge automatically when I run out of units
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  When your included units are used up, we&apos;ll automatically add{' '}
                  {usage.autoOverageUnits?.toLocaleString()} compile units for $
                  {usage.autoOverageAmountUsd} so your work never stops. Billed each time a
                  top-up is needed.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={usage.autoOverageEnabled}
                onClick={handleToggleAutoOverage}
                disabled={savingToggle}
                className={`${
                  usage.autoOverageEnabled ? 'bg-gray-700' : 'bg-gray-300'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50`}
              >
                <span
                  className={`${
                    usage.autoOverageEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-none p-4">
              <p className="text-sm text-gray-600">
                Automatic overage is not available for your plan.{' '}
                <Link href="/billing" className="text-gray-600 hover:text-gray-800 font-medium">
                  Upgrade to get more compiles.
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
