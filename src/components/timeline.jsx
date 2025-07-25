import useSWR from "swr";
import { useState, useEffect } from 'react';
import { loadCompiles } from '../utils/swr/fetchers';
import { CheckIcon, HandThumbUpIcon, UserIcon } from '@heroicons/react/20/solid'
import useArtcompilerAuth from "../hooks/use-artcompiler-auth";
import SignIn from '../components/SignIn'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

async function handleClick({ user, id, lang }) {
  const access_token = await user.getToken();
  const [ protocol ] =
        document.location.host.indexOf("localhost") === 0 && ["http"] ||
        ["https"];
  const url = `/form?lang=${lang}&id=${id}`;
  window.open(url, '_blank').focus();
}

export default function Timeline({ lang }) {
  const { user } = useArtcompilerAuth();
  const type = "*";  // { "*" | "persistent" | "ephemeral" }
  const [compiles, setCompiles] = useState([]);
  const { isLoading, data } =
    useSWR(
      user ? { user, lang, type } : null,
      loadCompiles
    );

  useEffect(() => {
    const compiles = data && data.sort((a, b) => {
      // Sort descending.
      return +b.timestamp - +a.timestamp;
    }) || [];
    setCompiles(compiles);
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

  if (compiles.length === 0) {
    if (isLoading) {
      return (
        <div className="justify-center w-full">
          Loading...
        </div>
      );
    } else {
      return (
        <div className="flex flex-1 flex-col p-8 text-left place-content-left">
          <h1>No compiles</h1>
        </div>
      );
    }
  }

  return (
    <div className="flow-root">
      <ol role="list" className="-mb-8">
        {
          compiles.map((compile, eventIdx) => {
            return (
              <li key={compile.timestamp}>
                <div className="relative pb-4 text-xs font-mono text-gray-500 hover:text-black">
                  {false && eventIdx !== timeline.length - 1 ? (
                    <span className="absolute top-4 left-2 -ml-px h-full w-0.5 bg-green-500" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={classNames(
                          'bg-green-500',
                          'h-4 w-4 rounded-full flex items-center justify-center ring-8 ring-white'
                        )}
                      >
                        <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-0 font-medium">
                  <div>
                    <p className="">
                      <a href="#" onClick={() => handleClick({ user, id: compile.id, lang: compile.lang })} className="">
                        {compile.id}
                      </a>
                    </p>
                  </div>
                      <div className="whitespace-nowrap text-right">
                        <time dateTime={compile.timestamp}>{new Date(+compile.timestamp).toUTCString()}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })
        }
      </ol>
    </div>
  )
}
