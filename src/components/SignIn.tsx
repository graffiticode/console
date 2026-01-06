import { useState, Fragment, useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import useSWR from "swr";
import {
  ChevronDownIcon,
  CreditCardIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import WalletSelectionDialog from "./WalletSelectionDialog";

interface SignInComponentProps {
  label?: string | React.ReactNode;
  className?: string;
}

interface Wallet {
  name: string;
  provider: any;
}

const fetchUserData = async ({ user }) => {
  const token = await user.getToken();
  const response = await fetch(`/api/user/${user.uid}`, {
    headers: { 'Authorization': token },
  });
  if (response.ok) {
    return response.json();
  }
  return null;
};

export default function SignInComponent({ label = "Sign in", className }: SignInComponentProps) {
  const { loading, user, signInWithEthereum, signOut } = useGraffiticodeAuth();
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  // Fetch user profile data from Firestore
  const { data: userData } = useSWR(
    user ? `user-profile-${user.uid}` : null,
    () => fetchUserData({ user }),
    { revalidateOnFocus: false }
  );

  const handleSignInClick = () => {
    // Always show wallet selection dialog
    setShowWalletDialog(true);
  };

  const handleSignIn = async (wallet: Wallet | null) => {
    try {
      await signInWithEthereum(wallet);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWalletSelect = (wallet: Wallet) => {
    handleSignIn(wallet);
  };

  // Get display name for the user menu button
  const getUserDisplayName = () => {
    // Check Firestore profile data first
    if (userData?.profileImageUrl) {
      return (
        <img
          src={userData.profileImageUrl}
          alt="Profile"
          className="h-6 w-6 rounded-full object-cover"
        />
      );
    }
    // Fall back to Firebase Auth photoURL
    if (user.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt="Profile"
          className="h-6 w-6 rounded-full object-cover"
        />
      );
    }
    // Check Firestore name
    if (userData?.name) {
      return userData.name;
    }
    // Fall back to Firebase Auth displayName
    if (user.displayName) {
      return user.displayName;
    }
    // Fall back to truncated UID
    return `${user.uid.slice(0, 7)}...${user.uid.slice(33)}`;
  };

  if (user) {
    return (
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className={`inline-flex justify-center items-center w-full ${className}`}>
            {getUserDisplayName()}
            <ChevronDownIcon className="ml-2 -mr-1 h-4 w-4" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1">
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                Account
              </div>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/profile"
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex items-center px-4 py-2 text-sm mt-1`}
                  >
                    <UserCircleIcon
                      className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                    Profile
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/payments"
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex items-center px-4 py-2 text-sm`}
                  >
                    <CreditCardIcon
                      className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                    Payments & Billing
                  </Link>
                )}
              </Menu.Item>
              <div className="border-t border-gray-200 my-1"></div>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={signOut}
                    disabled={loading}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex items-center w-full text-left px-4 py-2 text-sm`}
                  >
                    <ArrowRightOnRectangleIcon
                      className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  } else {
    return (
      <>
        <button
          className={className}
          disabled={loading}
          onClick={handleSignInClick}
        >
          {label}
        </button>

        <WalletSelectionDialog
          isOpen={showWalletDialog}
          onClose={() => setShowWalletDialog(false)}
          onSelectWallet={handleWalletSelect}
        />
      </>
    );
  }
}
