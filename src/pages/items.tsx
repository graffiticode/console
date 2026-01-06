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
} from '@heroicons/react/24/outline'
import SignIn from '../components/SignIn'
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Gallery from '../components/gallery';
import useSwr from 'swr';
import useLocalStorage from '../hooks/use-local-storage';
import { getTitle } from '../lib/utils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const VALID_APPS = ['console', 'front', 'mcp'];

export default function Tasks({ language, mark }) {
  const router = useRouter();
  const appParam = router.query.app;
  const app = Array.isArray(appParam) ? appParam[0] : (appParam || 'console');

  // Validate app parameter - redirect if invalid
  useEffect(() => {
    if (appParam && !VALID_APPS.includes(app)) {
      const { app: _, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    }
  }, [appParam, app, router]);

  useEffect(() => {
    document.title = getTitle();
  }, []);
  const lang = language.name.slice(1);
  return (
    <div className="max-w-full mx-auto py-0 sm:px-6 lg:px-8">
      <Gallery lang={lang} mark={mark} app={app} />
    </div>
  )
}
