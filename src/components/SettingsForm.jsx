/*
  This example requires Tailwind CSS v2.0+ 
  
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  ```
*/
import { Fragment, useState } from 'react'
import { Disclosure, Menu, Switch, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import {
  Bars3Icon,
  BellIcon,
  CogIcon,
  CreditCardIcon,
  KeyIcon,
  SquaresPlusIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import BillingCard from './BillingCard';
import APIKeysCard from './APIKeysCard';
import { useSession, signIn, signOut } from "next-auth/react";
import SignInAlert from "./SignInAlert";
const user = {
  name: 'Debbie Lewis',
  handle: 'deblewis',
  email: 'debbielewis@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=320&h=320&q=80',
}
const navigation = [
  { name: 'Dashboard', href: '#', current: true },
  { name: 'Jobs', href: '#', current: false },
  { name: 'Applicants', href: '#', current: false },
  { name: 'Company', href: '#', current: false },
]
const subNavigation = [
//  { name: 'Profile', href: '#', icon: UserCircleIcon, current: true },
//  { name: 'Account', href: '#', icon: CogIcon, current: false },
//  { name: 'Password', href: '#', icon: KeyIcon, current: false },
//  { name: 'Notifications', href: '#', icon: BellIcon, current: false },
  { name: 'Billing', href: '#', icon: CreditCardIcon, current: false },
  { name: 'API Keys', href: '#', icon: SquaresPlusIcon, current: false },
]
const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Example() {
  const [availableToHire, setAvailableToHire] = useState(true)
  const [privateAccount, setPrivateAccount] = useState(false)
  const [allowCommenting, setAllowCommenting] = useState(true)
  const [allowMentions, setAllowMentions] = useState(true)
  let current = 'billing';
  const { data: session } = useSession();
  if (!session) {
    return (
      <div className="justify-center w-full">
        <SignInAlert />
      </div>
    );
  } else {
  return (
    <div> 
     <Disclosure as="div" className="relative overflow-hidden bg-sky-700">
        {({ open }) => (
          <>
            <div
              aria-hidden="true"
              className={classNames(
                open ? 'bottom-0' : 'inset-y-0',
                'absolute inset-x-0 left-1/2 w-full -translate-x-1/2 transform overflow-hidden lg:inset-y-0'
              )}
            >
              <div className="absolute inset-0 flex">
                <div className="h-full w-1/2" style={{ backgroundColor: '#000' }} />
                <div className="h-full w-1/2" style={{ backgroundColor: '#000' }} />
              </div>
            </div>
            <header className="relative py-5">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
              </div>
            </header>
          </>
        )}
      </Disclosure>
      <div className="relative pt-10">
        <div className="border lg:grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
          <aside className="py-6 lg:col-span-3">
            <span className="mx-5">Billing information</span>
          </aside>
          <div className="lg:col-span-9">
            <BillingCard />
          </div>
        </div>
      </div>
      <div className="relative pt-10">
        <div className="border lg:grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x">
          <aside className="py-6 lg:col-span-3">
            <span className="mx-5">API Keys</span>
          </aside>
          <div className="lg:col-span-9">
            <APIKeysCard />
          </div>
      </div>
    </div>
    </div>
  )
  }
}
