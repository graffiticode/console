import useSWR from "swr";
import { Disclosure, Menu, Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid';
import { updateTask } from '../utils/swr/fetchers';
import MarkSelector from './mark-selector.jsx';
const sliceName = name => name.slice(17).slice(0,27);

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function NameText({ name, setName }) {
  const [ currentValue, setCurrentValue ] = useState(name);
  return (
    <div>
      <input
        type="text"
        name="text"
        id="text"
        className="block w-full rounded-none border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-inset focus:ring-gray-600 text-xs sm:leading-6 px-3 focus:outline-none"
        defaultValue={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={() => setName(currentValue)}
      />
    </div>
  )
}

function EllipsisMenu({ id, name, mark, onChange }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          className="flex items-center mt-1 text-gray-400 hover:text-gray-600"
        >
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-none bg-white focus:outline-none">
          <div className="p-2">
            <Menu.Item>
              {({ active }) => (
                <NameText
                  name={name}
                  setName={name => onChange({id, name})} />
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <div className="pt-2">
                  <MarkSelector
                    mark={{id: 1, color: '#2DC937'}}
                    setMark={mark => onChange({id, mark})}
                  />
                </div>
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
        name: task && getTitleFromTask(task) || sliceName(hd0),
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

export default function TasksNav({ user, setId, setTask, tasks }) {
  const [ items, setItems ] = useState([]);
  const [ showId, setShowId ] = useState("");
  const [ taskMetadata, setTaskMetadata ] = useState({});
  const [ updatingTask, setUpdatingTask ] = useState(false);
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
  
  const { isLoading, data } = useSWR(
    updatingTask && {
      user,
      id: taskMetadata.id,
      name: taskMetadata.name,
      mark: taskMetadata.mark?.id
    } || null,
    updateTask
  );

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="w-64 flex flex-1 flex-col p-8 text-left place-content-left">
        <h1>No tasks</h1>
      </div>
    );
  }
  const onChange = data => (
    console.log("onChange data=" + JSON.stringify(data, null, 2)),
    setUpdatingTask(true),
    setTaskMetadata(data)
  );
  
  return (
    <div
      className="w-64 flex shrink flex-col gap-y-5 overflow-y-auto bg-white pt-4 h-full"
    >
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7 font-mono">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  {!item.children ? (
                    <div
                      className={classNames(
                        item.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                        "flex flex-row justify-between pr-2"
                      )}
                      onMouseOver={() => {
                        if (showId !== item.task.id) {
                          setShowId(item.task.id);
                        }
                      }}
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
                          'block rounded-none py-0 pr-2 pl-10 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900'
                        )}
                      >
                        {item.name}
                      </button>
                      { item.task.id === showId &&
                        <EllipsisMenu
                          id={item.task.id}
                          name={item.name}
                          onChange={onChange}
                        /> || <div />
                      }
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
                              onMouseOver={() => {
                                if (showId !== item.task.id) {
                                  setShowId(item.task.id);
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
                              {item.name}
                              </Disclosure.Button>
                            { showId === item.task.id &&
                              <EllipsisMenu
                                id={item.task.id}
                                name={item.name}
                                onChange={onChange}
                              /> || <div />
                            }
                              </div>
                              <Disclosure.Panel as="ul" className="mt-1 px-2">
                                {item.children.map((subItem) => (
                              <li key={subItem.id}>
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
                                    onMouseOver={() => {
                                      if (showId !== subItem.task.id) {
                                        setShowId(subItem.task.id);
                                      }
                                    }}
                                    className={classNames(
                                      subItem.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                      'font-normal block rounded-none py-0 pr-2 pl-8 text-xs leading-6 text-gray-700'
                                    )}
                                  >
                                    {subItem.name}
                                  </button>
                                  { subItem.task.id === showId &&
                                    <EllipsisMenu
                                      id={subItem.task.id}
                                      name={subItem.name}
                                      onChange={onChange}
                                    /> || <div /> }
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
