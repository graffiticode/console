import useSWR from "swr";
import { loadCompiles } from '../utils/swr/fetchers';
import { CheckIcon, HandThumbUpIcon, UserIcon } from '@heroicons/react/20/solid'
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";


function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Timeline() {
  const { user } = useGraffiticodeAuth();
  const type = "*";  // { "*" | "persistent" | "ephemeral" }
  const { isLoading, data } =
    useSWR(
      user ? { user, type } : null,
      loadCompiles
    );
  const compiles = data && data.sort((a, b) => {
    // Sort descending.
    return +b.timestamp - +a.timestamp;
  }) || [];

  if (isLoading) {
    return (
      <div className="justify-center w-full">
        Loading...
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ol role="list" className="-mb-8">
        {compiles.map((compile, eventIdx) => (
          <li key={compile.timestamp}>
            <div className="relative pb-4">
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
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-0 font-medium text-xs text-mono text-gray-500 hover:text-black">
                  <div>
                    <p className="">
                      <a href={compile.id} className="">
                        {compile.id.split("+").join(" + ")}
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
        ))}
      </ol>
    </div>
  )
}
