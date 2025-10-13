import { useState, useEffect } from 'react';
import { CreditCardIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51LhI57LUz4JwpsJ6p6lzznvkbFNQj8k9LnAYckCJZ4Tv9AZzYHxKafXTKsTS12F8vUpKyELdBvXtvgSmNOzdqug200VALmBhSl');

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodsProps {
  userId: string;
}

function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payments`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setError(error.message || 'An error occurred');
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Add Payment Method'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentMethods({ userId }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, [userId]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`/api/payments/methods?userId=${userId}`);
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Mock data for development
      setPaymentMethods([
        {
          id: 'pm_1',
          brand: 'Visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          isDefault: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      const response = await axios.post('/api/payments/setup-intent', { userId });
      setClientSecret(response.data.clientSecret);
      setShowAddForm(true);
    } catch (error) {
      console.error('Error creating setup intent:', error);
      alert('Failed to initialize payment method setup.');
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      await axios.delete(`/api/payments/methods/${methodId}`, { data: { userId } });
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error removing payment method:', error);
      alert('Failed to remove payment method.');
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await axios.post('/api/payments/methods/set-default', { userId, methodId });
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      alert('Failed to set default payment method.');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Payment Methods
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your payment methods for subscriptions and overage charges.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={handleAddPaymentMethod}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Payment Method
          </button>
        )}
      </div>

      {/* Add Payment Method Form */}
      {showAddForm && clientSecret && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Payment Method</h4>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <AddPaymentMethodForm
              onSuccess={() => {
                setShowAddForm(false);
                fetchPaymentMethods();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </Elements>
        </div>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a payment method.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white shadow rounded-lg p-6 ${
                method.isDefault ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCardIcon className="h-8 w-8 text-gray-400 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {method.brand} ending in {method.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                    {method.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    onClick={() => handleRemovePaymentMethod(method.id)}
                    className="text-sm text-red-600 hover:text-red-500 inline-flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Your payment information is securely stored with Stripe. We never store your full card details on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}