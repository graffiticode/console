import { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
  type: 'subscription' | 'overage';
}

interface BillingHistoryProps {
  userId: string;
}

export default function BillingHistory({ userId }: BillingHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'subscription' | 'overage'>('all');

  useEffect(() => {
    fetchInvoices();
  }, [userId]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`/api/payments/invoices?userId=${userId}`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Mock data for development
      setInvoices([
        {
          id: 'inv_1',
          date: '2024-01-01',
          amount: 50,
          status: 'paid',
          description: 'Pro Plan - Monthly',
          invoiceUrl: '#',
          type: 'subscription'
        },
        {
          id: 'inv_2',
          date: '2024-01-15',
          amount: 150,
          status: 'paid',
          description: 'Overage - 10,000 compile units',
          invoiceUrl: '#',
          type: 'overage'
        },
        {
          id: 'inv_3',
          date: '2024-02-01',
          amount: 50,
          status: 'paid',
          description: 'Pro Plan - Monthly',
          invoiceUrl: '#',
          type: 'subscription'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceUrl?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else {
      try {
        const response = await axios.get(`/api/payments/invoice-pdf?invoiceId=${invoiceId}`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${invoiceId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error('Error downloading invoice:', error);
        alert('Failed to download invoice.');
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(invoice => invoice.type === filter);

  return (
    <div>
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['all', 'subscription', 'overage'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`${
                  filter === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab === 'all' ? 'All Transactions' : `${tab} Charges`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No billing history to display.</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.type === 'subscription'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {invoice.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center text-sm ${
                      invoice.status === 'paid'
                        ? 'text-green-600'
                        : invoice.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {invoice.status === 'paid' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                      {invoice.status === 'failed' && <XCircleIcon className="w-4 h-4 mr-1" />}
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${invoice.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceUrl)}
                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Spent (This Month)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${filteredInvoices
                .filter(inv => {
                  const invoiceDate = new Date(inv.date);
                  const now = new Date();
                  return invoiceDate.getMonth() === now.getMonth() &&
                         invoiceDate.getFullYear() === now.getFullYear() &&
                         inv.status === 'paid';
                })
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Overage Charges (This Month)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${filteredInvoices
                .filter(inv => {
                  const invoiceDate = new Date(inv.date);
                  const now = new Date();
                  return invoiceDate.getMonth() === now.getMonth() &&
                         invoiceDate.getFullYear() === now.getFullYear() &&
                         inv.type === 'overage' &&
                         inv.status === 'paid';
                })
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total All Time
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${filteredInvoices
                .filter(inv => inv.status === 'paid')
                .reduce((sum, inv) => sum + inv.amount, 0)
                .toFixed(2)}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}