import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { BoltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface UsageData {
  currentPeriodUnits: number;
  compileUnits: number;
  codeGenerationUnits: number;
  allocatedUnits: number;
  overageUnits: number;
  lastResetDate: string;
  currentPeriodEnd: string;
}

interface BillingSettings {
  autoRecharge: boolean;
  autoRechargeLimit: number;
  overageBlocksUsedThisPeriod: number;
}

interface PricingInfo {
  plan: string;
  overageAvailable: boolean;
  currentOverageBalance: number;
  blockSize: number;
  pricePerBlock: number;
  pricePerUnit: number;
  minBlocks: number;
  description: string;
  suggestedBlocks: number[];
}

interface UsageMonitorProps {
  userId: string;
}

export default function UsageMonitor({ userId }: UsageMonitorProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [billing, setBilling] = useState<BillingSettings | null>(null);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState(1);

  useEffect(() => {
    fetchUsageData();
  }, [userId]);

  const fetchUsageData = async () => {
    try {
      const [usageResponse, billingResponse, pricingResponse] = await Promise.all([
        axios.get(`/api/payments/usage?userId=${userId}`),
        axios.get(`/api/payments/billing-settings?userId=${userId}`),
        axios.get(`/api/payments/purchase-overage?userId=${userId}`)
      ]);
      setUsage(usageResponse.data);
      setBilling(billingResponse.data);
      setPricing(pricingResponse.data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseOverage = async () => {
    setPurchasing(true);
    try {
      const result = await axios.post('/api/payments/purchase-overage', {
        userId,
        blocks: selectedBlocks
      });
      await fetchUsageData();
      const units = result.data.units || (selectedBlocks * (pricing?.blockSize || 1000));
      alert(`Successfully purchased ${units.toLocaleString()} additional compile units!`);
    } catch (error) {
      console.error('Error purchasing overage:', error);
      alert('Failed to purchase overage units. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleAutoRechargeToggle = async (enabled: boolean) => {
    try {
      await axios.post('/api/payments/update-billing-settings', {
        userId,
        autoRecharge: enabled,
        autoRechargeLimit: billing?.autoRechargeLimit || 3
      });
      setBilling(prev => prev ? { ...prev, autoRecharge: enabled } : null);
    } catch (error) {
      console.error('Error updating auto-recharge:', error);
      alert('Failed to update auto-recharge settings.');
    }
  };

  const handleLimitChange = async (limit: number) => {
    try {
      await axios.post('/api/payments/update-billing-settings', {
        userId,
        autoRecharge: billing?.autoRecharge || false,
        autoRechargeLimit: limit
      });
      setBilling(prev => prev ? { ...prev, autoRechargeLimit: limit } : null);
    } catch (error) {
      console.error('Error updating limit:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!usage || !billing) {
    return <div>Error loading usage data</div>;
  }

  const totalUnits = usage.allocatedUnits + usage.overageUnits;
  const remainingUnits = totalUnits - usage.currentPeriodUnits;
  const usagePercentage = (usage.currentPeriodUnits / totalUnits) * 100;
  const compilePercentage = (usage.compileUnits / totalUnits) * 100;
  const codeGenPercentage = (usage.codeGenerationUnits / totalUnits) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = remainingUnits <= 0;

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
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
              <span>{usage.currentPeriodUnits.toLocaleString()} ({usagePercentage.toFixed(1)}%) compile units used</span>
              <span className="font-medium">{remainingUnits.toLocaleString()} remaining</span>
            </div>
            <div className="w-full bg-gray-200 h-8 relative">
              {/* Compiles bar (bottom layer) */}
              <div
                className="h-8 bg-blue-500 absolute left-0 top-0 transition-all duration-300"
                style={{ width: `${Math.min(compilePercentage, 100)}%` }}
                title={`Compiles: ${usage.compileUnits.toLocaleString()} units`}
              />
              {/* Code generation bar (stacked on top) */}
              <div
                className={`h-8 absolute top-0 transition-all duration-300 ${
                  isAtLimit ? 'bg-red-600' : isNearLimit ? 'bg-yellow-500' : 'bg-purple-500'
                }`}
                style={{
                  left: `${Math.min(compilePercentage, 100)}%`,
                  width: `${Math.min(codeGenPercentage, 100 - compilePercentage)}%`
                }}
                title={`Code Generation: ${usage.codeGenerationUnits.toLocaleString()} units`}
              />
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500"></div>
                <span>Compiles: {usage.compileUnits.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 ${isAtLimit ? 'bg-red-600' : isNearLimit ? 'bg-yellow-500' : 'bg-purple-500'}`}></div>
                <span>Code Gen: {usage.codeGenerationUnits.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <dt className="text-sm font-medium text-gray-500">Allocated</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {usage.allocatedUnits.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Overage</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {usage.overageUnits.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Resets</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {new Date(usage.currentPeriodEnd).toLocaleDateString()}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Overage Settings */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Overage Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-recharge</p>
                <p className="text-sm text-gray-500">
                  Automatically purchase overage blocks when you run out of compile units
                </p>
              </div>
              <Switch
                checked={billing.autoRecharge}
                onChange={handleAutoRechargeToggle}
                className={`${
                  billing.autoRecharge ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    billing.autoRecharge ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            {billing.autoRecharge && pricing && (
              <div className="ml-4 pb-4 border-b">
                <label className="text-sm font-medium text-gray-700">
                  Monthly limit
                </label>
                <select
                  value={billing.autoRechargeLimit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value={1}>1 block ({(pricing.blockSize).toLocaleString()} units)</option>
                  <option value={3}>3 blocks ({(3 * pricing.blockSize).toLocaleString()} units)</option>
                  <option value={5}>5 blocks ({(5 * pricing.blockSize).toLocaleString()} units)</option>
                  <option value={10}>10 blocks ({(10 * pricing.blockSize).toLocaleString()} units)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {billing.overageBlocksUsedThisPeriod} of {billing.autoRechargeLimit} blocks used this month
                </p>
              </div>
            )}

            {pricing && pricing.overageAvailable && (
              <div className="pt-4">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Purchase Overage Blocks</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {pricing.description} • {pricing.blockSize.toLocaleString()} units per block
                  </p>

                  <div className="flex items-center space-x-4">
                    <select
                      value={selectedBlocks}
                      onChange={(e) => setSelectedBlocks(Number(e.target.value))}
                      className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      {pricing.suggestedBlocks?.map(blocks => (
                        <option key={blocks} value={blocks}>
                          {blocks} {blocks === 1 ? 'block' : 'blocks'}
                        </option>
                      )) || [1, 3, 5].map(blocks => (
                        <option key={blocks} value={blocks}>
                          {blocks} {blocks === 1 ? 'block' : 'blocks'}
                        </option>
                      ))}
                    </select>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {(selectedBlocks * pricing.blockSize).toLocaleString()} units
                      </p>
                      <p className="text-sm text-gray-500">
                        Total: ${(selectedBlocks * pricing.pricePerBlock).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={handlePurchaseOverage}
                      disabled={purchasing}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <BoltIcon className="w-4 h-4 mr-2" />
                      {purchasing ? 'Processing...' : 'Purchase'}
                    </button>
                  </div>

                  {pricing.currentOverageBalance > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Current overage balance: {pricing.currentOverageBalance.toLocaleString()} units
                    </p>
                  )}
                </div>
              </div>
            )}

            {pricing && !pricing.overageAvailable && (
              <div className="pt-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    {pricing.plan === 'free'
                      ? 'Upgrade to Pro or Max plan to purchase additional compile units'
                      : 'Overage purchases are not available for your plan'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}