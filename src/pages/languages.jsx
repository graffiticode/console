import Head from 'next/head';
import Image from 'next/image';
import useSWR from "swr";
import { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import Gallery from '../components/gallery';
import Timeline from '../components/timeline';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import { selectLanguages } from "../components/language-selector";
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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { countTasks } from '../utils/swr/fetchers';

const GREEN = "#2DC937";

const languages = selectLanguages();

import useLocalStorage from '../hooks/use-local-storage';

function LanguageList({ language, setLanguage }) {
  const { user } = useGraffiticodeAuth();
  const { isValidating, isLoading, data } =
    useSWR(
      user ? { user, langs: languages, mark: 1 } : null,
      countTasks,
    );

  useEffect(() => {
    document.title = getTitle();
  }, []);

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
        {languages.map((language) => (
          <Link
            key={language.name}
            href="/tasks"
            onClick={() => setLanguage({ name: language.name })}
          >
          <li className="col-span-1 flex rounded-none shadow-sm">
            <div
              className={classNames(
                "bg-gray-800",
                'flex w-16 flex-shrink-0 items-center justify-center rounded-none text-sm font-medium text-white'
              )}
            >
              {language.name}
            </div>
            <div className="flex flex-1 items-center justify-between truncate rounded-none border-b border-r border-t border-gray-200 bg-white">
              <div className="flex-1 truncate px-4 py-2 text-sm">
                {language.desc}
                   <p className="text-gray-500">{data && data[language.name] || "0"} Tasks</p>
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


export default function Languages(props) {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <LanguageList {...props} />
    </div>
  )
}
