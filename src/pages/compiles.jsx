import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
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
import { getTitle } from '../lib/utils';
import FormView from '../components/FormView';
import { DataPanel } from '../components/DataPanel';
import { loadCompiles, getAccessToken } from '../utils/swr/fetchers';
import useSWR from 'swr';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Compiles({ language }) {
  const [userId, setUserId] = useState();
  const [id, setId] = useState('');
  const [formHeight, setFormHeight] = useState(280);
  const [dataHeight, setDataHeight] = useState(280);
  const [compiles, setCompiles] = useState([]);
  
  useEffect(() => {
    document.title = getTitle();
  }, []);
  
  const lang = language.name.slice(1);
  const { user } = useGraffiticodeAuth();
  const { isValidating, isLoading, data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const type = "*";  // { "*" | "persistent" | "ephemeral" }
  const { isLoading: isLoadingCompiles, data } =
    useSWR(
      user ? { user, lang, type } : null,
      loadCompiles
    );

  useEffect(() => {
    const compilesData = data && data.sort((a, b) => {
      // Sort descending.
      return +b.timestamp - +a.timestamp;
    }) || [];
    setCompiles(compilesData);
    
    // Set the first compile as selected by default if there are any
    if (compilesData.length > 0 && !id) {
      setId(compilesData[0].id);
    }
  }, [data]);

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

  if (isLoadingCompiles) {
    return (
      <div className="justify-center w-full">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex">
        {/* Left sidebar with compiles list */}
        <div className="colspan-1">
          <div className="overflow-y-auto max-h-screen px-2">
            <ul role="list" className="divide-y divide-gray-200">
              {compiles.map((compile) => (
                <li 
                  key={compile.id} 
                  className={classNames(
                    "py-2 cursor-pointer text-xs font-mono",
                    id === compile.id ? "text-gray-700 font-semibold" : "text-gray-500 hover:text-gray-700"
                  )}
                  onClick={() => setId(compile.id)}
                >
                  {compile.id}
                  <div className="text-xs text-gray-400">
                    {new Date(+compile.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right side with form and data panels stacked vertically */}
        <div className="flex flex-col grow mt-6 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:px-6 lg:px-8">
            {/* Form panel on top */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Form</div>
              <FormView
                accessToken={accessToken}
                id={id}
                lang={lang}
                height={formHeight}
                className="border border-gray-300 rounded-none overflow-auto p-2 resize"
                style={{height: formHeight}}
              />
            </div>

            {/* Data panel on bottom */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Data</div>
              <div className="border border-gray-300 rounded-none overflow-auto p-2 resize" style={{height: dataHeight}}>
                <DataPanel
                  id={id}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}