import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import GraphQLIde from '../components/graphiql';
import { getTitle } from '../lib/utils';

import {
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  Bars3Icon,
  UsersIcon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import SignIn from '../components/SignIn'

export function Logo(props) {
  return (
    <Image src='/logo.png' alt='Graffiticode logo' width='30' height='30' />
  );
}

const navigation = [
  { name: 'Languages', href: '/languages', current: false },
  { name: 'Items', href: '/items', current: false },
  { name: 'Tasks', href: '/tasks', current: false },
  { name: 'Explorer', href: '/explorer', current: true },
  { name: 'Settings', href: '/integrations', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Compiles() {
  const [userId, setUserId] = useState();
  useEffect(() => {
    document.title = getTitle();
  }, []);
  return (
    <div className="w-full h-screen">
      <GraphQLIde />
    </div>
  )
}
