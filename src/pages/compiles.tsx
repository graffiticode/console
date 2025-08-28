import Head from 'next/head';
import { useEffect } from 'react';
import { getTitle } from '../lib/utils';
import CompilesGallery from '../components/compiles-gallery';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Compiles({ language }) {
  useEffect(() => {
    document.title = getTitle();
  }, []);

  const lang = language.name.slice(1);
  return (
    <div className="max-w-full mx-auto py-0 sm:px-6 lg:px-8">
      <CompilesGallery lang={lang} />
    </div>
  );
}
