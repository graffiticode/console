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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Tasks() {
  const [language, setLanguage] = useLocalStorage("graffiticode:language", { id: 1, name: 'L1' });
  const [mark, setMark] = useLocalStorage("graffiticode:tasks:mark", marks[0]);
  useEffect(() => {
    document.title = "Tasks \\ Graffiticode";
  }, []);
  const lang = language.name.slice(1);
  //const resp = useSwr({uid, lang, mark: mark.id}, tasksSettings);
  //console.log("Tasks() resp=" + JSON.stringify(resp.data));
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <Gallery lang={lang} mark={mark} />
    </div>
  )
}
