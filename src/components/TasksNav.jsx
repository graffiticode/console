import useSWR from "swr";
import { Disclosure, Menu, Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useEffect, useState, useRef } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid';
import { postTaskUpdates } from '../utils/swr/fetchers';
import MarkSelector, { marks } from './mark-selector.jsx';
import PublicToggle from "./public-toggle.jsx";

const sliceName = name => name.slice(17).slice(0,27);

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function NameText({ id, name, setName }) {
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
        onBlur={() => setName(currentValue || formatTaskId(id))}
      />
    </div>
  )
}

function EllipsisMenu({ id, name, mark, isPublic, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Position menu next to the button
  const positionMenu = () => {
    if (buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 280; // Fixed width of menu
      const menuHeight = menuRef.current.offsetHeight;

      // Check if there's enough space to the right
      const rightSpace = window.innerWidth - buttonRect.right;
      const leftSpace = buttonRect.left;

      let top = buttonRect.top;
      let left;

      // If menu would go below viewport bottom, position it above
      if (top + menuHeight > window.innerHeight) {
        top = Math.max(window.innerHeight - menuHeight - 10, 10);
      }

      // Determine horizontal position - prefer right side if there's space
      if (rightSpace >= menuWidth + 8) {
        // Position to the right of the button
        left = buttonRect.right + 8;
      } else if (leftSpace >= menuWidth + 8) {
        // Position to the left of the button
        left = buttonRect.left - menuWidth - 8;
      } else {
        // Not enough space on either side, center it
        left = Math.max(10, window.innerWidth / 2 - menuWidth / 2);
      }

      setMenuPosition({ top, left });
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      // Wait for menu to be rendered before positioning
      setTimeout(() => {
        positionMenu();
        // Re-check position after a short delay to account for content rendering
        setTimeout(positionMenu, 50);
      }, 0);
    }
  };

  // Reposition on window resize
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', positionMenu);
      return () => window.removeEventListener('resize', positionMenu);
    }
  }, [isOpen]);

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <button
        ref={buttonRef}
        className="flex items-center mt-1 text-gray-400 hover:text-gray-600"
        onClick={handleClick}
        aria-label="Open menu"
      >
        <EllipsisVerticalIcon className="h-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={menuRef}
            className="fixed bg-white shadow-lg ring-1 ring-gray-200 z-50 rounded-none"
            onClick={e => e.stopPropagation()}
            style={{
              width: '280px',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              maxHeight: 'calc(100vh - 40px)',
              overflow: 'auto'
            }}
          >
            <div className="p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Task Attributes</div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Name:</label>
                <input
                  type="text"
                  className="w-full rounded-none border border-gray-300 p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500"
                  defaultValue={name}
                  onBlur={(e) => onChange({id, name: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Mark:</label>
                <div className="flex">
                  <MarkSelector
                    mark={marks[mark - 1]}
                    setMark={mark => onChange({id, mark})}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Public:</label>
                <PublicToggle
                  isPublic={isPublic}
                  setIsPublic={isPublic => onChange({id, isPublic})}
                />
              </div>

              <div className="border-t border-gray-200 pt-2">
                <div
                  className="text-xs font-mono text-gray-600 hover:text-gray-900 cursor-pointer py-1.5 truncate"
                  onClick={(e) => {
                    navigator.clipboard.writeText(id);
                    const element = e.currentTarget;
                    element.innerHTML = `
                      <span class="text-green-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
                          <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                        </svg>
                        Copied!
                      </span>
                    `;
                    setTimeout(() => {
                      element.textContent = id;
                    }, 1000);
                  }}
                  title="Click to copy task ID"
                >
                  {id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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

export default function TasksNav({ user, setId, tasks, currentId }) {
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
      // Check if we have a stored taskId that matches or partially matches any of our tasks
      let foundMatch = false;

      // Try to get the selected task ID from localStorage
      const savedTaskId = localStorage.getItem('graffiticode:selected:taskId');

      if (savedTaskId) {
        // Get the base task ID (before the '+' if present)
        const [baseTaskId] = savedTaskId.split('+');

        // First, try to find an exact match
        nestedItems.forEach(item => {
          // Initialize all items as not current
          item.current = false;

          // Check for exact match
          if (item.id === savedTaskId || item.id === baseTaskId) {
            item.current = true;
            foundMatch = true;
            setId(item.id);
          }

          // If this item has children, check them too
          if (item.children) {
            item.children.forEach(childItem => {
              // Check if any child matches the saved ID
              const childFullId = item.id + "+" + childItem.id;
              if (childFullId === savedTaskId) {
                item.current = true; // Parent is considered current when child is selected
                foundMatch = true;
                setId(childFullId);
              }
            });
          }
        });

        // If no exact match, try to find a task with the same base ID
        if (!foundMatch) {
          nestedItems.forEach(item => {
            const [itemBaseId] = item.id.split('+');
            if (itemBaseId === baseTaskId) {
              item.current = true;
              foundMatch = true;
              setId(item.id);
            }
          });
        }
      }

      // If no match was found, default to the first item
      if (!foundMatch) {
        nestedItems[0].current = true;
        console.log("HELP_DEBUG [TasksNav] - Setting initial task id:", nestedItems[0].id);
        setId(nestedItems[0].id);
      }

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
      className="w-[210px] flex-none flex flex-col gap-y-2 overflow-visible bg-white pt-2 max-h-[calc(100vh-110px)] sticky top-[84px]"
    >
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7 font-mono">
          <li className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <ul role="list" className="space-y-1">
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
                          'block rounded-none py-0 pr-2 pl-10 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900 truncate max-w-[170px] text-left'
                        )}
                        title={item.name}
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
                                'flex items-center w-full text-xs text-left rounded-none px-2 gap-x-3 leading-6 font-bold text-gray-700'
                              )}
                              title={item.name}
                            >
                              <ChevronRightIcon
                                className={classNames(
                                  open ? 'rotate-90 text-gray-500' : 'text-gray-400',
                                  'h-5 w-5 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              <span className="truncate max-w-[130px]">{item.name}</span>
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
                                      'font-normal block rounded-none py-0 pr-2 pl-8 text-xs leading-6 text-gray-700 truncate max-w-[150px] text-left'
                                    )}
                                    title={subItem.name}
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
