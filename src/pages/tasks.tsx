import Head from 'next/head';
import { useEffect } from 'react';
import { getTitle } from '../lib/utils';
import TasksGallery from '../components/tasks-gallery';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Tasks({ language }) {
  useEffect(() => {
    document.title = getTitle();
  }, []);

  const lang = language.name.slice(1);
  return (
    <div className="max-w-full mx-auto py-0 sm:px-6 lg:px-8">
      <TasksGallery lang={lang} />
    </div>
  );
}
