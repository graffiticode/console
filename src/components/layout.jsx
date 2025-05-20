import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, Fragment, useRef } from 'react';
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import Gallery from '../components/gallery';
import Timeline from '../components/timeline';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import LanguageSelector from '../components/language-selector';
import MarkSelector from '../components/mark-selector';
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
import { getTitle } from '../lib/utils';

export function Logo(props) {
  return (
    <Image src='/logo.png' alt='Artcompiler logo' width='30' height='30' />
  );
}

const navigation = [
  { name: 'Languages', href: '/languages', current: false },
  { name: 'Tasks', href: '/tasks', current: false },
  { name: 'Compiles', href: '/compiles', current: false },
  { name: 'Settings', href: '/settings', current: false },
  { name: 'Docs', href: '/docs', current: false },
//  { name: 'Explorer', href: '/explorer', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout({ children, pathName, language, setLanguage, mark, setMark }) {
  const [userId, setUserId] = useState();
  const lang = language.name.slice(1);
  useEffect(() => {
    document.title = getTitle();
  }, []);
  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-100">
        <body class="h-full">
        ```
      */}
      <Head>
        <link rel="icon" type="image/png" href="favicon.png" />
        <meta
          name="description"
          content="A software studio"
        />
      </Head>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800 sticky top-0 z-50 shadow-lg">
          {({ open }) => (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Link
                        href="/"
                        className='px-3 py-2 rounded-none text-sm font-medium'
                      >
                        <Logo />
                      </Link>
                    </div>
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {
                          navigation.map((item) => {
                            const currentName = item.name.toLowerCase();
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                target={item.target}
                                className={classNames(
                                  currentName === pathName
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                  'px-3 py-2 rounded-none text-sm font-medium'
                                )}
                                aria-current={item.current ? 'page' : undefined}
                              >
                              {item.name}
                              </Link>
                            );
                          })
                        }
                      </div>
                    </div>
                    <div className="ml-10 flex-shrink-0 w-24 h-24 pt-7">
                      <LanguageSelector domain={getTitle()} language={language} setLanguage={setLanguage} />
                    </div>
                    <div className="ml-4 flex-shrink-0 w-24 h-24 pt-7">
                      <MarkSelector domain={getTitle()} mark={mark} setMark={setMark} />
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium ml-4 flex items-center md:ml-6 space-x-8">
                      <a
                        href="https://forum.graffiticode.org/"
                        className="text-sky-300 hover:text-sky-400"
                      >
                        Community
                      </a>
                      <div className="text-gray-400 hover:text-white">
                        <SignIn userId={userId} setUserId={setUserId}/>
                      </div>
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-none text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                        'block px-3 py-2 rounded-none text-base font-medium'
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                <div className="pt-4 pb-3 border-t border-gray-700">
                  <div className="flex items-center px-5">
                    <a
                      href="https://forum.graffiticode.com/"
                      className="text-sky-300 hover:text-sky-400 text-sm mr-8"
                    >
                      Community
                    </a>
                    <div className="text-gray-400 hover:text-white">
                      <SignIn />
                    </div>
                    <button
                      type="button"
                      className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-none text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
        <main className="pt-2">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            { children }
          </div>
        </main>
      </div>
    </>
  )
}
