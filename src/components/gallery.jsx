// TODO save and load code + data tasks
// TODO refresh tasks nav when new task is saved

import useSWR from "swr";
import { Fragment, useCallback, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { loadTasks, getAccessToken } from '../utils/swr/fetchers';
import { isNonEmptyString } from "../utils";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import FormView from "./FormView.jsx";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function getTitle(task) {
  if (isNonEmptyString(task.src)) {
    const firstLineParts = task.src.split("\n")[0].split('|');
    if (firstLineParts.length > 1) {
      return firstLineParts[1];
    }
  }
  return "";
}

function getId({ taskId, dataId }) {
  return taskId + (dataId && `+${dataId}` || "");
}

const useTaskIdFormUrl = ({ lang, id }) => {
  const { user } = useGraffiticodeAuth();
  const { data: src } = useSWR({ lang, user, id }, async ({ lang, user, id }) => {
    if (!id) {
      return "";
    }
    const token = await user.getToken();
    const params = new URLSearchParams();
    if (token) {
      params.set("token", token);
    }
    return `/api/form/${id}?${params.toString()}`;
  });
  return src;
};

import { Disclosure } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

const sliceName = name => name.slice(17).slice(0,27);

function TasksNav({ setId, setTask, tasks }) {
  const [ items, setItems ] = useState([]);
  useEffect(() => {
    if (tasks.length) {
      tasks = tasks.sort((a, b) => {
        // Sort descending.
        const at = +a.created || 0;
        const bt = +b.created || 0;
        return bt - at;
      });
      const items = tasks.map((task, index) => {
        // Group by head.
        const [hd0, tl0] = task.id.split("+");
        console.log("TaskNav() hd0=" + hd0 + " tl0=" + tl0);
        let children;
        if (tl0 === undefined) {
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
        }
        if (tl0 === undefined) {
          return {
            id: task.id,
            name: sliceName(task.id),
            children,
            task,
          };
        } else {
          return undefined;
        }
      });
      const nestedItems = items.filter(item => item !== undefined);
      if (nestedItems.length) {
        nestedItems[0].current = true;
        setId(nestedItems[0].id);
        setItems(nestedItems);
      }
    }
  }, [tasks]);
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col p-8 text-left place-content-left">
        <h1>No tasks</h1>
      </div>
    );
  }
  return (
    <div className="w-64 flex shrink flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white pt-4">
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7 font-mono">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {items.map((item) => (
                <li key={item.name}>
                  {!item.children ? (
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
                  ) : (
                    <Disclosure as="div">
                      {({ open }) => (
                        <>
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
                          <Disclosure.Panel as="ul" className="mt-1 px-2">
                            {item.children.map((subItem) => (
                              <li key={subItem.name}>
                                <button
                                  as="a"
                                  onClick={() => {
                                    setTask(subItem.task);
                                    setId(subItem.task.id);
                                    items.forEach(subItem => subItem.current = false);
                                    subItem.current = true;
                                  }}
                                  className={classNames(
                                    subItem.current ? 'bg-gray-50' : 'hover:bg-gray-50',
                                    'font-normal block rounded-md py-0 pr-2 pl-8 text-xs leading-6 text-gray-700'
                                  )}
                                >
                                  {subItem.name}
                                </button>
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

export default function Gallery({ lang, mark }) {
  const [ hideEditor, setHideEditor ] = useState(false);
  const [ tasks, setTasks ] = useState([]);
  const [ task, setTask ] = useState({});
  const [ newTask, setNewTask ] = useState();
  const { user } = useGraffiticodeAuth();
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const [ id, setId ] = useState("");
  const handleCreateTask = useCallback(async (e) => {
    e.preventDefault();
    setHideEditor(false);
    setId("");
  });
  const { isValidating, isLoading, data: loadTasksData } =
    useSWR(
      user ? { user, lang, mark: mark.id } : null,
      loadTasks,
    );
  useEffect(() => {
    setTasks(loadTasksData || []);
  }, [loadTasksData]);

  useEffect(() => {
    if (newTask && !tasks.some(task => task.id === newTask.id)) {
      tasks.unshift(newTask);
      setTasks(tasks);
    }
  }, [newTask]);

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

  if (isLoading) {
    return (
      <div className="justify-center w-full">
        Loading...
      </div>
    );
  }

  const { uid } = user;

  const hideForm = id === "undefined";
  return (
    <div className="flex">
      <div className="colspan-1">
        <button
          className="rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={handleCreateTask}>
          Create New Task
        </button>
        <TasksNav setId={setId} setTask={setTask} tasks={tasks} />
      </div>
      <div className="flex flex-col grow mt-6 px-4 sm:px-6">
        <div className={classNames(
               hideEditor ? "lg:grid-cols-1" : "lg:grid-cols-1",
               "grid grid-cols-1 gap-4 sm:px-6 lg:px-8"
             )}>
          {
            !hideForm &&
              <FormView
                key="form"
                accessToken={accessToken}
                id={id}
                lang={lang}
              />
          }
          {
            !hideEditor &&
              <div className="">
                <Editor
                  id={id}
                  lang={lang}
                  mark={mark}
                  setId={setId}
                  setNewTask={setNewTask}
                  tasks={tasks}
                />
              </div>
          }
        </div>
      </div>
    </div>
  );
}
