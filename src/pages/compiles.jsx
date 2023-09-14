import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import Gallery from '../components/gallery';
import Timeline from '../components/timeline';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import LanguageSelector from '../components/language-selector';
import useLocalStorage from '../hooks/use-local-storage';
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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Compiles({ language }) {
  const [userId, setUserId] = useState();
  useEffect(() => {
    document.title = "Compiles \\ Graffiticode";
  }, []);
  const lang = language.name.slice(1);
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Replace with your content */}
      <Timeline lang={lang} />
    </div>
  )
}
