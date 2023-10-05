
import Head from 'next/head'
import Image from 'next/image';
import { Fragment, useState } from 'react'
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react'
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
} from '@heroicons/react/24/outline';
import SignIn from '../components/SignIn';
import SettingsForm from '../components/SettingsForm';
import { getTitle } from '../lib/utils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

import { useEffect } from 'react';
import Link from 'next/link';
import Gallery from '../components/gallery';

export default function Settings(props) {
  useEffect(() => {
    document.title = `Settings \\ ${getTitle()}`;
  }, []);
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <SettingsForm />
    </div>
  )
}
