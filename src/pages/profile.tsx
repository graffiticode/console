import { useState, useEffect } from 'react';
import Head from 'next/head';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { getTitle } from '../lib/utils';
import SignIn from '../components/SignIn';

interface UserData {
  uid?: string;
  name?: string;
  email?: string;
  created?: string;
  updated?: string;
  inviteCodeUsed?: string;
  inviteCodeTimestamp?: string;
  stripeCustomerId?: string;
  subscription?: {
    status?: string;
    plan?: string;
    units?: number;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  };
}

export default function Profile() {
  const { user, loading } = useGraffiticodeAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      fetchUserData();
    }
  }, [user, loading]);

  const fetchUserData = async () => {
    try {
      setLoadingData(true);
      const token = await user.getToken();
      const response = await fetch(`/api/user/${user.uid}`, {
        headers: {
          'Authorization': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else if (response.status === 404) {
        // User exists in Firebase Auth but not in Firestore yet
        setUserData({ uid: user.uid });
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile information');
    } finally {
      setLoadingData(false);
    }
  };

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
        <SignIn label="Sign in to continue" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - {getTitle()}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your personal information and account details.
            </p>
          </div>

          {loadingData ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <UserCircleIcon className="h-12 w-12 text-gray-400 mr-4" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {userData?.name || 'User'}
                    </h2>
                    <p className="text-sm text-gray-500">{userData?.email || 'No email on file'}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {user.uid}
                    </dd>
                  </div>

                  {userData?.name && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{userData.name}</dd>
                    </div>
                  )}

                  {userData?.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
                    </div>
                  )}

                  {userData?.created && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(userData.created).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                  )}

                  {userData?.updated && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(userData.updated).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                  )}

                  {userData?.inviteCodeUsed && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Invite Code Used</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        {userData.inviteCodeUsed}
                      </dd>
                    </div>
                  )}

                  {userData?.inviteCodeTimestamp && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Invited On</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(userData.inviteCodeTimestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                  )}

                  {userData?.subscription?.status && (
                    <>
                      <div className="sm:col-span-2 border-t pt-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Subscription</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                userData.subscription.status === 'active' || userData.subscription.status === 'trialing'
                                  ? 'bg-green-100 text-green-800'
                                  : userData.subscription.status === 'canceled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {userData.subscription.status === 'trialing' ? 'Active' : userData.subscription.status.charAt(0).toUpperCase() + userData.subscription.status.slice(1)}
                              </span>
                            </dd>
                          </div>

                          {userData.subscription.plan && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Plan</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {userData.subscription.plan === 'free' ? 'Starter' : userData.subscription.plan.charAt(0).toUpperCase() + userData.subscription.plan.slice(1)}
                              </dd>
                            </div>
                          )}

                          {userData.subscription.units !== undefined && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Units</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {userData.subscription.units.toLocaleString()}
                              </dd>
                            </div>
                          )}

                          {userData.subscription.currentPeriodEnd && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Current Period Ends</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(userData.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </dd>
                            </div>
                          )}

                          {userData.subscription.cancelAtPeriodEnd && (
                            <div className="sm:col-span-2">
                              <div className="rounded-md bg-yellow-50 p-4">
                                <p className="text-sm text-yellow-800">
                                  Your subscription will be canceled at the end of the current billing period.
                                </p>
                              </div>
                            </div>
                          )}
                        </dl>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
