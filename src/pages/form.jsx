import useSWR from "swr";
import { useRouter } from 'next/router';
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
import FormView from '../components/FormView';
import LanguageSelector from '../components/language-selector';
import MarkSelector, { marks } from '../components/mark-selector';
import useSwr from 'swr';
import { tasksSettings } from '../utils/swr/fetchers';
import useLocalStorage from '../hooks/use-local-storage';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import { getTitle } from '../lib/utils';

const parseQuery =
      query => ({
        lang: query.lang,
        id: query.id && query.id.split(/[ ]/g).join("+")
      });

export default function Form() {
  const router = useRouter();
  const { lang, id } = parseQuery(router.query);
  const [mark, setMark] = useLocalStorage("graffiticode:tasks:mark", marks[0]);
  if (id === undefined) {
    return <div />;
  }
  return (
    <>
      <Head>
        <title>{getTitle()}</title>
        <link rel="icon" type="image/png" href="favicon.png" />
        <meta
          name="description"
          content="A software studio"
        />
      </Head>
      <div className="min-h-full">
          <div className="min-w-full mx-auto py-6 sm:px-6 lg:px-8">
            <FormView lang={lang} id={id} className="w-full h-screen"/>
          </div>
      </div>
    </>
  )
}
