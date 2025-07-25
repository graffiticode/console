import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import useArtcompilerAuth from "../hooks/use-artcompiler-auth";
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
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import SignIn from '../components/SignIn'
import { getTitle } from '../lib/utils';
import FormView from '../components/FormView';
import { DataPanel } from '../components/DataPanel';
import { loadCompiles, getAccessToken } from '../utils/swr/fetchers';
import useSWR from 'swr';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Helper to elide task IDs, showing only characters 18-25
const elideTaskId = (id) => {
  return id.length > 25 ? id.substring(17, 25) : id;
}

// Helper to elide compound IDs (with +), eliding each part separately
const elideCompoundId = (id) => {
  if (!id.includes('+')) {
    return elideTaskId(id);
  }

  const parts = id.split('+');
  const elided = parts.map(part => elideTaskId(part));
  return elided.join('+');
}

// Helper to create nested navigation structure
const getNestedCompiles = (compiles) => {
  const nestedCompiles = [];
  const taskIds = [];

  // First pass: identify unique task IDs (before the '+' if present)
  compiles.forEach(compile => {
    const [taskId, dataId] = compile.id.split('+');
    if (!taskIds.includes(taskId)) {
      taskIds.push(taskId);
    }
  });

  // Second pass: create nested structure
  taskIds.forEach(taskId => {
    const taskCompiles = compiles.filter(compile => {
      const [compileTaskId] = compile.id.split('+');
      return compileTaskId === taskId;
    });

    // Find the root compile (without data ID)
    const rootCompile = taskCompiles.find(compile => !compile.id.includes('+')) || taskCompiles[0];

    // Find children (compiles with data IDs)
    const children = taskCompiles.filter(compile => {
      const [compileTaskId, dataId] = compile.id.split('+');
      return dataId !== undefined;
    });

    nestedCompiles.push({
      ...rootCompile,
      taskId,
      children: children.length > 0 ? children : undefined,
      current: false,
    });
  });

  return nestedCompiles.sort((a, b) => +b.timestamp - +a.timestamp);
};

export default function Compiles({ language }) {
  const [userId, setUserId] = useState();
  const [id, _setId] = useState('');

  // Wrapped setId to store in localStorage when it changes
  const setId = (newId) => {
    _setId(newId);
    // Store the task ID in localStorage
    if (newId) {
      localStorage.setItem('artcompiler:selected:taskId', newId);
    }
  };
  const [formHeight, setFormHeight] = useState(350);
  const [dataHeight, setDataHeight] = useState(350);
  const [compiles, setCompiles] = useState([]);
  const [nestedCompiles, setNestedCompiles] = useState([]);
  const [showId, setShowId] = useState("");

  useEffect(() => {
    document.title = getTitle();
  }, []);

  const lang = language.name.slice(1);
  const { user } = useArtcompilerAuth();
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

    // Create nested structure for the navigation
    const nested = getNestedCompiles(compilesData);
    setNestedCompiles(nested);

    // Try to restore the previously selected task ID from localStorage
    let taskIdFound = false;
    if (compilesData.length > 0) {
      try {
        const savedTaskId = localStorage.getItem('artcompiler:selected:taskId');
        if (savedTaskId && nested.length > 0) {
          // Get just the base task ID (before the '+' if present)
          const [baseTaskId] = savedTaskId.split('+');

          // First try to find an exact match
          for (let i = 0; i < nested.length; i++) {
            const item = nested[i];
            item.current = false; // Reset all items initially

            // Check if this item matches the saved ID
            if (item.id === savedTaskId || item.taskId === baseTaskId) {
              setId(item.id);
              item.current = true;
              taskIdFound = true;
              break;
            }

            // If this item has children, check them too
            if (item.children) {
              for (let j = 0; j < item.children.length; j++) {
                const child = item.children[j];
                if (child.id === savedTaskId) {
                  setId(child.id);
                  item.current = true;
                  taskIdFound = true;
                  break;
                }
              }
              if (taskIdFound) break;
            }
          }

          // If no exact match, try to find a compile with the same base task ID
          if (!taskIdFound) {
            for (let i = 0; i < nested.length; i++) {
              const item = nested[i];
              const [itemTaskId] = item.id.split('+');

              if (itemTaskId === baseTaskId) {
                setId(item.id);
                item.current = true;
                taskIdFound = true;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error("Error restoring task selection:", e);
      }

      // Set the first compile as selected by default if no matching task was found
      if (!taskIdFound) {
        setId(compilesData[0].id);
        if (nested.length > 0) {
          nested[0].current = true;
        }
      }
    }

    setNestedCompiles([...nested]); // Force update of nested compiles with current flags
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
        {/* Left sidebar with nested compiles list */}
        <div className="colspan-1">
          <div className="w-64 flex shrink flex-col overflow-y-auto bg-white pt-4 max-h-screen">
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7 font-mono">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {nestedCompiles.map((item) => (
                      <li key={item.taskId}>
                        {!item.children ? (
                          <div
                            className={classNames(
                              item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                              "flex flex-row justify-between pr-2"
                            )}
                            onMouseOver={() => {
                              if (showId !== item.id) {
                                setShowId(item.id);
                              }
                            }}
                          >
                            <button
                              onClick={() => {
                                setId(item.id);
                                nestedCompiles.forEach(c => c.current = false);
                                item.current = true;
                              }}
                              className={classNames(
                                item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                'block rounded-none py-1 pr-2 pl-2 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900'
                              )}
                            >
                              {elideCompoundId(item.id)}
                            </button>
                          </div>
                        ) : (
                          <Disclosure as="div" defaultOpen={false}>
                            {({ open }) => (
                              <>
                                <div className={classNames(
                                       item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                       "flex flex-row justify-between pr-2"
                                     )}
                                >
                                  <Disclosure.Button
                                    onClick={() => {
                                      setId(item.id);
                                      nestedCompiles.forEach(c => c.current = false);
                                      item.current = true;
                                    }}
                                    onMouseOver={() => {
                                      if (showId !== item.id) {
                                        setShowId(item.id);
                                      }
                                    }}
                                    className={classNames(
                                      item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                      'flex items-center w-full text-xs text-left rounded-none px-2 gap-x-3 text-sm leading-6 font-bold text-gray-700'
                                    )}
                                  >
                                    <ChevronRightIcon
                                      className={classNames(
                                        open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                        'h-5 w-5 shrink-0'
                                      )}
                                      aria-hidden="true"
                                    />
                                    <div>
                                      {elideTaskId(item.taskId)}
                                    </div>
                                  </Disclosure.Button>
                                </div>
                                <Disclosure.Panel as="ul" className="mt-1 px-2">
                                  {item.children.map((subItem) => (
                                    <li key={subItem.id}>
                                      <div className={classNames(
                                             id === subItem.id ? 'bg-gray-50' : 'hover:bg-gray-50',
                                             "flex flex-row justify-between"
                                           )}
                                      >
                                        <button
                                          onClick={() => {
                                            setId(subItem.id);
                                            nestedCompiles.forEach(c => c.current = false);
                                            item.current = true;
                                          }}
                                          onMouseOver={() => {
                                            if (showId !== subItem.id) {
                                              setShowId(subItem.id);
                                            }
                                          }}
                                          className={classNames(
                                            id === subItem.id ? 'bg-gray-50' : 'hover:bg-gray-50',
                                            'font-normal block rounded-none py-1 pr-2 pl-8 text-xs leading-6 text-gray-700'
                                          )}
                                        >
                                          {elideCompoundId(subItem.id)}
                                        </button>
                                      </div>
                                    </li>
                                  ))}
                                </Disclosure.Panel>
                              </>
                            )}
                          </Disclosure>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Right side with form and data panels stacked vertically */}
        <div className="flex flex-col grow mt-6 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:px-6 lg:px-8">
            {/* Form panel on top */}
            <div>
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
