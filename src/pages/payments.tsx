import { useState } from 'react';
import Head from 'next/head';
import { Tab } from '@headlessui/react';
import {
  CreditCardIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { getTitle } from '../lib/utils';
import SignIn from '../components/SignIn';
import SubscriptionCard from '../components/payments/SubscriptionCard';
import UsageMonitor from '../components/payments/UsageMonitor';
import PricingPlans from '../components/payments/PricingPlans';
import BillingHistory from '../components/payments/BillingHistory';
import PaymentMethods from '../components/payments/PaymentMethods';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  { name: 'Subscription', icon: CurrencyDollarIcon },
  { name: 'Usage', icon: ChartBarIcon },
  { name: 'Billing History', icon: DocumentTextIcon },
  { name: 'Payment Methods', icon: CreditCardIcon },
];

export default function Payments() {
  const { user, loading } = useGraffiticodeAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <SignIn
          label="Sign in to continue"
        />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Payments - {getTitle()}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your subscription, monitor usage, and update payment methods.
            </p>
          </div>

          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
                    )
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </div>
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="mt-6">
              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                <div className="space-y-6">
                  <SubscriptionCard userId={user.uid} />
                  <div className="border-t pt-6">
                    <PricingPlans userId={user.uid} />
                  </div>
                </div>
              </Tab.Panel>

              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                <UsageMonitor userId={user.uid} />
              </Tab.Panel>

              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                <BillingHistory userId={user.uid} />
              </Tab.Panel>

              <Tab.Panel className="rounded-xl bg-white p-6 shadow">
                <PaymentMethods userId={user.uid} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </>
  );
}