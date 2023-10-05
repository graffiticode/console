import { useEffect } from 'react';
import { getTitle } from '../lib/utils';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Compiles() {
  useEffect(() => {
    document.title = getTitle();
  }, []);
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      This is the home screen. This is where we help the developer get
      oriented. There should be guides and links to various documents
      as well as quick start tutorials.
    </div>
  );
}
