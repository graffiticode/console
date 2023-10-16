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
      Welcome to the { getTitle() } console. Get started by navigating to&nbsp; 
      <a href="/languages"><b>Languages</b></a> tab, selecting a language, and creating
      a task.
    </div>
  );
}
