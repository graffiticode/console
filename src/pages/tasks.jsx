import Head from 'next/head'
import Image from 'next/image';
import { Fragment, useState } from 'react'
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react'
import {
  CalendarIcon,
  CashIcon,
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
import Gallery from '../components/gallery';
import LanguageSelector from '../components/language-selector';
import MarkSelector, { marks } from '../components/mark-selector';
import useSwr from 'swr';
import { tasksSettings } from '../utils/swr/fetchers';
import useLocalStorage from '../hooks/use-local-storage';

export function Logo(props) {
  return (
    <Image src='/logo.png' alt='Artcompiler logo' width='30' height='30' />
  )
}

const navigation = [
  { name: 'Languages', href: '/languages', current: false },
  { name: 'Tasks', href: '/tasks', current: true },
  { name: 'Compiles', href: '/compiles', current: false },
//  { name: 'Explorer', href: '/explorer', current: false },
//  { name: 'Settings', href: '/settings', current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Tasks() {
  const [language, setLanguage] = useLocalStorage("graffiticode:language", { id: 1, name: 'L1' });
  const [mark, setMark] = useLocalStorage("graffiticode:tasks:mark", marks[0]);
  const lang = language.name.slice(1);
  //const resp = useSwr({uid, lang, mark: mark.id}, tasksSettings);
  //console.log("Tasks() resp=" + JSON.stringify(resp.data));
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
        <title>Tasks \ Graffiticode</title>
        <link rel="icon" type="image/png" href="favicon.png" />
        <meta
          name="description"
          content="A software studio"
        />
      </Head>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800">
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
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            target={item.target}
                            className={classNames(
                              item.current
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                              'px-3 py-2 rounded-none text-sm font-medium'
                            )}
                            aria-current={item.current ? 'page' : undefined}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="ml-10 flex-shrink-0 w-24 h-24 pt-7">
                      <LanguageSelector language={language} setLanguage={setLanguage} />
                    </div>
                    <div className="ml-4 flex-shrink-0 w-18 h-24 pt-7">
                      <MarkSelector mark={mark} setMark={setMark} />
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium ml-4 flex items-center md:ml-6 text-gray-400 hover:text-white">
                      <SignIn />
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
                  <div className="flex items-center px-5 text-gray-400 hover:text-white">
                    <SignIn />
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
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Gallery lang={lang} mark={mark} />
          </div>
        </main>
      </div>
    </>
  )
}
