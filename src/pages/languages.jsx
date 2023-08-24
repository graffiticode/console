import Head from 'next/head';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import Gallery from '../components/gallery';
import Timeline from '../components/timeline';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

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

export function Logo(props) {
  return (
    <Image src='/logo.png' alt='Artcompiler logo' width='30' height='30' />
  );
}

const navigation = [
  { name: 'Languages', href: '/languages', current: true },
  { name: 'Tasks', href: '/tasks', current: false },
  { name: 'Compiles', href: '/compiles', current: false },
//  { name: 'Explorer', href: '/explorer', current: false },
//  { name: 'Settings', href: '/settings', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'

const GREEN = "#2DC937";

const projects = [
  { name: 'Base language', initials: 'L1', href: '#', tasks: 16, bgColor: 'bg-gray-800' },
  // { name: 'SVG scrapers', initials: 'L146', href: '#', tasks: 12, bgColor: 'bg-gray-800' },
  { name: 'Chart renderers', initials: 'L147', href: '#', tasks: 16, bgColor: 'bg-gray-800' },
  { name: 'Essay scorers', initials: 'L149', href: '#', tasks: 8, bgColor: 'bg-gray-800' },
  { name: 'Shipping calculators', initials: 'L150', href: '#', tasks: 8, bgColor: 'bg-gray-800' },
]

import useLocalStorage from '../hooks/use-local-storage';
function LanguageList() {
  const { user } = useGraffiticodeAuth();
  const [language, setLanguage] = useLocalStorage("graffiticode:tasks:language", { id: 1, name: 'L1' });

  if (!user) {
    return (
      <div className="justify-center w-full">
        <SignIn
          className="rounded-none border-2 px-3 py-2 text-center hover:border-gray-400 focus:outline-none"
          label={<span className="block font-medium">Sign in to continue</span>}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500">Pinned Languages</h2>
      <ul role="list" className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {projects.map((project) => (
          <Link
            key={project.name}            
            href="/tasks"
            onClick={() => setLanguage({ name: project.initials })}
          >
          <li className="col-span-1 flex rounded-none shadow-sm">
            <div
              className={classNames(
                project.bgColor,
                'flex w-16 flex-shrink-0 items-center justify-center rounded-none text-sm font-medium text-white'
              )}
            >
              {project.initials}
            </div>
            <div className="flex flex-1 items-center justify-between truncate rounded-none border-b border-r border-t border-gray-200 bg-white">
              <div className="flex-1 truncate px-4 py-2 text-sm">
                  {project.name}
                <p className="text-gray-500">{project.tasks} Tasks</p>
              </div>
              <div className="flex-shrink-0 pr-2">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-none bg-transparent bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Open options</span>
                  <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
            </Link>
        ))}
      </ul>
    </div>
  )
}


export default function Languages() {
  const [userId, setUserId] = useState();
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
        <title>Languages \ Graffiticode</title>
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
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium ml-4 flex items-center md:ml-6 text-gray-400 hover:text-white">
                      <SignIn userId={userId} setUserId={setUserId}/>
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
            <LanguageList />
          </div>
        </main>
      </div>
    </>
  )
}
