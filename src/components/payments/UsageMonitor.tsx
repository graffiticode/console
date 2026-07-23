import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface UsageData {
  plan: string;
  itemsUsed: number;
  includedItems: number;
  overageItems: number;
  overageRatePerItem: number | null;
  overageCostUsd: number;
  hardCap: boolean;
  overageLimitItems: number | null;
  overageLimitUsd: number | null;
  lastResetDate: string;
  currentPeriodEnd: string;
}

interface UsageMonitorProps {
  userId: string;
}

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function UsageMonitor({ userId }: UsageMonitorProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCap, setSavingCap] = useState(false);
  const [capInput, setCapInput] = useState('');

  useEffect(() => {
    fetchUsageData();
  }, [userId]);

  const fetchUsageData = async () => {
    try {
      const usageResponse = await axios.get(`/api/payments/usage?userId=${userId}`);
      setUsage(usageResponse.data);
      setCapInput(
        typeof usageResponse.data?.overageLimitUsd === 'number'
          ? String(usageResponse.data.overageLimitUsd)
          : ''
      );
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCap = async (limitUsd: number | null) => {
    if (savingCap) return;
    setSavingCap(true);
    try {
      await axios.post('/api/payments/overage-limit', { userId, limitUsd });
      await fetchUsageData();
    } catch (error) {
      console.error('Error setting overage limit:', error);
      alert('Failed to update overage limit. Please try again.');
    } finally {
      setSavingCap(false);
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

  // The bar fills against the included bucket; overage extends past 100%.
  const included = usage.includedItems;
  const used = usage.itemsUsed;
  const includedUsed = Math.min(used, included);
  const includedPct = included > 0 ? (includedUsed / included) * 100 : (used > 0 ? 100 : 0);
  const overagePct = included > 0 ? Math.min((usage.overageItems / included) * 100, 100) : 0;

  const remainingIncluded = Math.max(0, included - used);
  const isAtIncludedLimit = used >= included;

  // Customer overage cap remaining (paid tiers with a cap set).
  const capItems = usage.overageLimitItems;
  const capRemaining = capItems === null ? null : Math.max(0, included + capItems - used);
  const atCap = capItems !== null && used >= included + capItems;

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="bg-white overflow-hidden shadow rounded-none">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Current Period Usage
            </h3>
            {(isAtIncludedLimit || atCap) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {usage.hardCap ? 'Limit Reached' : atCap ? 'Spend Cap Reached' : 'Into Overage'}
              </span>
            )}
          </div>

          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{used.toLocaleString()} items used</span>
              <span className="font-medium">
                {usage.hardCap
                  ? `${remainingIncluded.toLocaleString()} of ${included.toLocaleString()} remaining`
                  : `${included.toLocaleString()} included`}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-8 relative overflow-hidden">
              {/* Included usage */}
              <div
                className={`h-8 absolute left-0 top-0 transition-all duration-300 ${
                  isAtIncludedLimit ? 'bg-gray-600' : 'bg-gray-500'
                }`}
                style={{ width: `${Math.min(includedPct, 100)}%` }}
                title={`Included: ${includedUsed.toLocaleString()} / ${included.toLocaleString()}`}
              />
              {/* Overage usage (past the included bucket) */}
              {usage.overageItems > 0 && (
                <div
                  className={`h-8 absolute top-0 transition-all duration-300 ${atCap ? 'bg-red-600' : 'bg-yellow-500'}`}
                  style={{ left: `${Math.min(includedPct, 100) - overagePct}%`, width: `${overagePct}%` }}
                  title={`Overage: ${usage.overageItems.toLocaleString()} items`}
                />
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Usage Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Included</dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">{included.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">items / month</div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overage</dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">{usage.overageItems.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {usage.overageRatePerItem
                      ? `items · ${money(usage.overageCostUsd)} so far`
                      : 'items'}
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resets</dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">
                    {usage.currentPeriodEnd && new Date(usage.currentPeriodEnd).getFullYear() < 2099 ?
                      new Date(usage.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      }) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {usage.currentPeriodEnd && new Date(usage.currentPeriodEnd).getFullYear() < 2099 ? 'billing period resets' : 'no reset date'}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overage spend cap */}
      <div className="bg-white overflow-hidden shadow rounded-none">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Overage Spend Cap
          </h3>

          {usage.hardCap ? (
            <div className="bg-gray-50 border border-gray-200 rounded-none p-4">
              <p className="text-sm text-gray-600">
                The Free plan is capped at {included.toLocaleString()} items per month with no
                overage.{' '}
                <Link href="/billing" className="text-gray-600 hover:text-gray-800 font-medium">
                  Upgrade to create more.
                </Link>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Additional items beyond your included {included.toLocaleString()} are billed at{' '}
                {usage.overageRatePerItem ? money(usage.overageRatePerItem) : '—'} each on your next
                invoice. Set a monthly cap to stop new items once you hit a dollar amount of overage.
                {capItems !== null && (
                  <> Current cap: <span className="font-medium">{money(usage.overageLimitUsd ?? 0)}</span>
                    {' '}(~{capItems.toLocaleString()} items
                    {capRemaining !== null && `, ${capRemaining.toLocaleString()} of budget remaining`}).</>
                )}
                {capItems === null && <> No cap set — overage is unlimited.</>}
              </p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={capInput}
                    onChange={(e) => setCapInput(e.target.value)}
                    placeholder="No cap"
                    className="pl-6 pr-3 py-2 w-40 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={savingCap}
                  onClick={() => saveCap(capInput === '' ? null : Number(capInput))}
                  className="inline-flex justify-center rounded-none bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {savingCap ? 'Saving…' : 'Save cap'}
                </button>
                {capItems !== null && (
                  <button
                    type="button"
                    disabled={savingCap}
                    onClick={() => { setCapInput(''); saveCap(null); }}
                    className="inline-flex justify-center rounded-none bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Remove cap
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
