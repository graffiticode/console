import { useEffect } from 'react';
import { getTitle } from '../lib/utils';
import Link from 'next/link';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Compiles() {
  useEffect(() => {
    document.title = getTitle();
  }, []);
  return (
    <div className="flex flex-col text-md leading-7 max-w-2xl font-light mx-auto py-6 sm:px-6 lg:px-8 gap-4">
      <p>
        Welcome to the { getTitle() } console.
      </p>
      <p>
        Graffiticode is a tool for programming web components and apis through
        task specific languages. It is first and foremost a collection of task
        specific languages with runtimes that are React components and GraphQL
        services.
      </p>
      <p>
        The components and apis are programmed with the&nbsp;
        <Link href="/tasks"><b>Tasks</b></Link>
        &nbsp;editor. Once programmed, the static state of the component or api
        is used to initialize them whereever they may be hosted.
      </p>
      <p>
        Get started by navigating to the&nbsp;
        <Link href="/languages"><b>Languages</b></Link>
        &nbsp;tab, selecting a language, and get programming.
      </p>
      <div className="bg-green-50 p-4 font-normal border border-1 rounded-lg grid grid-cols-12">
        <div className="col-span-1 mt-1 ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="col-span-11 pr-4 font-light">
          <span className="font-medium">What's missing? </span>
            There are of course many many more languages we could add to the current
            collection. What programmable components and apis would you like to see
            here?&nbsp;
            <a href="mailto: jeff@artcompiler.com?subject=Graffiticode language idea"><b>Send us a note!</b></a>
          </div>
        </div>
    </div>
  );
}
