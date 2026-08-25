import { useState, useEffect } from 'react';
import useGraffiticodeAuth from '@graffiticode/auth-react';
import { paymentsGet } from '../../utils/payments-client';

interface UsageCycle {
  id: string;
  start: string;
  end: string;
  planName: string | null;
  dataAvailable: boolean;
  itemsUsed: number | null;
  sponsoredItems: number | null;
  includedItems: number | null;
  overageItems: number | null;
  amountUsd: number;
  invoiceUrl: string | null;
  isCurrent: boolean;
}

// Duplicated per-file, matching the convention in UsageMonitor/BillingHistory —
// this app has no shared formatting module.
const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DASH = '—';

const day = (iso: string, withYear: boolean) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
  });

/** "Jul 23 – Aug 23, 2026", dropping the repeated year from the left side. */
const range = (start: string, end: string) => {
  const sameYear = new Date(start).getFullYear() === new Date(end).getFullYear();
  return `${day(start, !sameYear)} – ${day(end, true)}`;
};

export default function UsageHistory() {
  const { user } = useGraffiticodeAuth();
  const [cycles, setCycles] = useState<UsageCycle[]>([]);
  const [meta, setMeta] = useState<{ hasStripeCustomer: boolean; stripeAvailable: boolean; itemDataStart: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await paymentsGet(user, 'usage-history');
      setCycles(response.data.cycles || []);
      setMeta({
        hasStripeCustomer: response.data.hasStripeCustomer,
        stripeAvailable: response.data.stripeAvailable,
        itemDataStart: response.data.itemDataStart,
      });
    } catch (error) {
      // Match BillingHistory: swallow and show the empty state rather than
      // introducing a new failure UI in the billing tab.
      console.error('Error fetching usage history:', error);
      setCycles([]);
    } finally {
      setLoading(false);
    }
  };

  const cutover = meta?.itemDataStart
    ? new Date(meta.itemDataStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const anySponsored = cycles.some(c => (c.sponsoredItems ?? 0) > 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded-none"></div>
        <div className="h-20 bg-gray-200 rounded-none"></div>
        <div className="h-20 bg-gray-200 rounded-none"></div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-none">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Usage History</h3>

        {cycles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {!meta?.hasStripeCustomer
                ? 'Your usage history will appear here after your first billing cycle.'
                : !meta?.stripeAvailable
                  ? 'Usage history is temporarily unavailable.'
                  : 'No closed billing cycles yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Used</th>
                    {anySponsored && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsored</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cycles.map(c => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {range(c.start, c.end)}
                        {c.isCurrent && <span className="ml-2 text-xs text-gray-500">(current)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.planName ?? DASH}</td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        title={c.dataAvailable ? undefined : `Item counts began ${cutover ?? 'later'}`}
                      >
                        {c.dataAvailable
                          ? `${(c.itemsUsed ?? 0).toLocaleString()} / ${(c.includedItems ?? 0).toLocaleString()}`
                          : DASH}
                      </td>
                      {anySponsored && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-700">
                          {c.sponsoredItems ? c.sponsoredItems.toLocaleString() : DASH}
                        </td>
                      )}
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${c.overageItems ? 'text-amber-700' : 'text-gray-900'}`}>
                        {c.dataAvailable ? (c.overageItems ?? 0).toLocaleString() : DASH}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{money(c.amountUsd)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {c.invoiceUrl ? (
                          <a href={c.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">{DASH}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Your current period is shown above and is billed on your next invoice.
              {cutover && ` Item counts begin ${cutover}; earlier periods show ${DASH}.`}
              {anySponsored && ' Sponsored items are free and don’t count toward your plan allowance.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
