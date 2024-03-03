import { Fragment, useEffect, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid';
import MarkSelector from './mark-selector.jsx';
const sliceName = name => name.slice(17).slice(0,27);

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

//import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
//import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'

function EllipsisMenu() {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center mt-1 text-gray-400 hover:text-gray-600">
          <span className="sr-only">Open options</span>
          <EllipsisVerticalIcon className="h-4" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm'
                  )}
                >
                  Rename
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-xs'
                  )}
                >
                  <MarkSelector mark={{id: 1, color: '#2DC937'}} setMark={() => {}} />
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

const scrubTitle = title => title.indexOf("|") >= 0 && title.slice(title.indexOf("|") + 1).trim();
const getTitleFromTask = task => scrubTitle(task.src.split("\n").slice(0, 1).join());

const getNestedItems = ({ setId, tasks }) => {
  const ids = [];
  const items = tasks.map((task, index) => {
    // Group by head.
    const [hd0, tl0] = task.id.split("+");
    let children;
    if (ids.find(id => id === hd0) === undefined) {
      ids.push(hd0);
      // Only compute kids for root tasks.
      tasks.forEach(task => {
        const [hd1, tl1] = task.id.split("+");
        if (hd0 === hd1 && tl1 !== undefined) {
          if (children === undefined) {
            children = [];
          }
          children.push({
            id: tl1,
            name: sliceName(tl1),
            task,
          });
        };
      });
      return {
        id: hd0,
        name: task && getTitleFromTask(task) || "untitled",
        task: {
          ...task,
          id: hd0,
        },
        children,
      };
    } else {
      // Not a root so return undefined to be filtered out.
      return undefined;
    }
  });
  const nestedItems = items.filter(item => item !== undefined);
  return nestedItems;
}

export default function TasksNav({ setId, setTask, tasks }) {
  const [ items, setItems ] = useState([]);
  useEffect(() => {
    if (tasks.length) {
      tasks = tasks.sort((a, b) => {
        // Sort descending.
        const at = +a.created || 0;
        const bt = +b.created || 0;
        return bt - at;
      });
    }
    const nestedItems = getNestedItems({setId, setItems, tasks});
    if (nestedItems.length) {
      nestedItems[0].current = true;
      setId(nestedItems[0].id);
      setItems(nestedItems);
    }
  }, [tasks]);
  
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="w-64 flex flex-1 flex-col p-8 text-left place-content-left">
        <h1>No tasks</h1>
      </div>
    );
  }
  return (
    <div className="w-64 flex shrink flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white pt-4 h-full">
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7 font-mono">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {items.map((item) => (
                <li key={item.name}>
                  {!item.children ? (
                    <div className={classNames(
                           item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                           "flex flex-row justify-between pr-2"
                         )}
                    >
                      <button
                        onClick={() => {
                          setTask(item.task);
                          setId(item.task.id);
                          items.forEach(item => item.current = false);
                          item.current = true;
                        }}
                        className={classNames(
                          item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                          'block rounded-md py-0 pr-2 pl-10 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900'
                        )}
                      >
                        {item.name}
                      </button>
                      <EllipsisMenu />
                      </div>
                  ) : (
                    <Disclosure as="div">
                      {({ open }) => (
                        <>
                          <div className={classNames(
                                 item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                 "flex flex-row justify-between pr-2"
                               )}
                          >
                            <Disclosure.Button
                              onClick={() => {
                                setTask(item.task);
                                setId(item.task.id);
                                items.forEach(item => item.current = false);
                                item.current = true;
                              }}
                              className={classNames(
                                item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                'flex items-center w-full text-xs text-left rounded-md px-2 gap-x-3 text-sm leading-6 font-bold text-gray-700'
                              )}
                            >
                              <ChevronRightIcon
                                className={classNames(
                                  open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                  'h-5 w-5 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Disclosure.Button>
                            <EllipsisMenu />
                          </div>
                          <Disclosure.Panel as="ul" className="mt-1 px-2">
                            {item.children.map((subItem) => (
                              <li key={subItem.name}>
                                <div className={classNames(
                                       item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                       "flex flex-row justify-between"
                                     )}
                                >
                                  <button
                                    onClick={() => {
                                      setTask(subItem.task);
                                      setId(subItem.task.id);
                                      items.forEach(item => item.current = false);
                                      item.children.forEach(subItem => subItem.current = false);
                                      subItem.current = true;
                                    }}
                                    className={classNames(
                                      subItem.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                      'font-normal block rounded-md py-0 pr-2 pl-8 text-xs leading-6 text-gray-700'
                                    )}
                                  >
                                    {subItem.name}
                                  </button>
                                  <EllipsisMenu />
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
  )
}
