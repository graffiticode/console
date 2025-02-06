import useSWR from "swr";
import { Disclosure, Menu, Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid';
import { postTaskUpdates } from '../utils/swr/fetchers';
import MarkSelector, { marks } from './mark-selector.jsx';
import PublicToggle from "./public-toggle.jsx";

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
        defaultValue={currentValue !== "unnamed" && currentValue || ""}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={() => setName(currentValue || "unnamed")}
      />
    </div>
  )
}

function EllipsisMenu({ id, name, mark, isPublic, onChange }) {
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
                    mark={marks[mark - 1]}
                    setMark={mark => onChange({id, mark})}
                  />
                </div>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <div className="pt-2">
                  <PublicToggle
                    isPublic={isPublic}
                    setIsPublic={isPublic => onChange({id, isPublic})}
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
      let rootName;
      // We have a new hd that is a root id.
      ids.push(hd0);
      // Only compute kids for root tasks.
      tasks.forEach(task => {
        const [hd1, tl1] = task.id.split("+");
        if (hd0 === hd1) {
          if (tl1 !== undefined) {
            if (children === undefined) {
              children = [];
            }
            children.push({
              ...task,
              id: task.id,
              name: task.name || "unnamed",
            });
          } else {
            rootName = task.name || "unnamed";
          }
        }
      });
      return {
        ...task,
        id: hd0,
        name: rootName,
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

export default function TasksNav({ user, setId, tasks }) {
  const [ items, setItems ] = useState([]);
  const [ showId, setShowId ] = useState("");
  const [ updatedTasks, setUpdatedTasks ] = useState([]);
  const [ updatingTasks, setUpdatingTasks ] = useState(false);
  useEffect(() => {
    if (tasks.length) {
      tasks = tasks.sort((a, b) => {
        // Sort descending.
        const at = +a.created || 0;
        const bt = +b.created || 0;
        return bt - at;
      });
    }
    const nestedItems = getNestedItems({setId, tasks});
    if (nestedItems.length) {
      nestedItems[0].current = true;
      setId(nestedItems[0].id);
      setItems(nestedItems);
    }
  }, [tasks.length]);

  const { isLoading, data } = useSWR(
    updatingTasks && {
      user,
      tasks: updatedTasks,
    } || null,
    postTaskUpdates
  );

  if (!Array.isArray(tasks) || tasks.length === 0 ||
      !Array.isArray(items) || items.length === 0) {
    return (
      <div className="w-64 flex flex-1 flex-col p-8 text-left place-content-left">
        <h1>No tasks</h1>
      </div>
    );
  }

  const updateTasks = ({ id, name, mark, isPublic }) => {
    // Gather tasks to update. Update the items to reflect those changes. Set
    // the updated tasks for posting.
    const [hd, tl] = id.split("+");
    const rootIndex = items.findIndex(item => (
      item.id === hd
    ));
    const rootItem = items[rootIndex];
    const updatedTasks = [];
    console.log("[1] updateTasks() isPublic=" + isPublic + " tasks=" + JSON.stringify(tasks, null, 2));
    if (tl === undefined) {
      // Got a root id.
      if (mark !== undefined && mark.id !== rootItem.mark) {
        // Updating mark. Do the kids too.
        const taskIndex = tasks.findIndex(task => task.id === rootItem.id);
        rootItem.children && rootItem.children.forEach(child => {
          const { id } = tasks.find(task => task.id === child.id);
          updatedTasks.push({id, name, mark: mark.id, isPublic});
          const taskIndex = tasks.findIndex(task => task.id === child.id);
        });
        updatedTasks.push({ id, mark: mark.id, isPublic });
        delete items[rootIndex];
        setItems(items.filter(item => item !== undefined));
      }
      if (name !== undefined) {
        updatedTasks.push({ id, name, isPublic });
        items[rootIndex].name = name;
      }
      if (isPublic !== undefined) {
        updatedTasks.push({ id, name, isPublic });
        items[rootIndex].isPublic = isPublic;
      }
    } else {
      const children = rootItem.children;
      const childIndex = children.findIndex(child => child.id === id);
      const childItem = children[childIndex];
      if (mark !== undefined && mark.id !== childItem.mark) {
        updatedTasks.push({ id, mark: mark.id, isPublic });
        delete children[childIndex];
        rootItem.children = children.filter(child => child !== undefined);
        const taskIndex = tasks.findIndex(task => task.id === id);
        // delete tasks[taskIndex];
        // tasks = tasks.filter(task => task !== undefined);
      }
      if (name !== undefined) {
        updatedTasks.push({id, name, isPublic});
        children[childIndex].name = name;
      }
      if (isPublic !== undefined) {
        updatedTasks.push({id, name, isPublic});
        children[childIndex].isPublic = isPublic;
      }
    }
    setUpdatingTasks(true);
    setUpdatedTasks(updatedTasks);
    console.log(
      "[2] updateTasks()",
      "tasks=" + JSON.stringify(tasks, null, 2)
    );
  };

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
                        if (showId !== item.id) {
                          setShowId(item.id);
                        }
                      }}
                    >
                      <button
                        onClick={() => {
                          setId(item.id);
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
                      { item.id === showId &&
                        <EllipsisMenu
                          id={item.id}
                          name={item.name}
                          mark={item.mark}
                          isPublic={item.isPublic}
                          onChange={updateTasks}
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
                                setId(item.id);
                                items.forEach(item => item.current = false);
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
                              {item.name}
                            </Disclosure.Button>
                            { showId === item.id &&
                              <EllipsisMenu
                                id={item.id}
                                name={item.name}
                                mark={item.mark}
                                onChange={updateTasks}
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
                                      setId(subItem.id);
                                      items.forEach(item => item.current = false);
                                      item.children.forEach(subItem => subItem.current = false);
                                      subItem.current = true;
                                    }}
                                    onMouseOver={() => {
                                      if (showId !== subItem.id) {
                                        setShowId(subItem.id);
                                      }
                                    }}
                                    className={classNames(
                                      subItem.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                      'font-normal block rounded-none py-0 pr-2 pl-8 text-xs leading-6 text-gray-700'
                                    )}
                                  >
                                    {subItem.name}
                                  </button>
                                  { subItem.id === showId &&
                                    <EllipsisMenu
                                      id={subItem.id}
                                      name={subItem.name}
                                      mark={subItem.mark}
                                      onChange={updateTasks}
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
