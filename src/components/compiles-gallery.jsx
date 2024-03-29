import useSWR from "swr";
import { Fragment, useCallback, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { loadCompiles } from '../utils/swr/fetchers';
import { isNonEmptyString } from "../utils";
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";

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

const useTaskIdFormUrl = ({ id }) => {
  const { user } = useGraffiticodeAuth();
  const { data: src } = useSWR({ user, id }, async ({ user, id }) => {
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

function Task({ setOpen, setHideEditor, setTask, lang, task, dataId }) {
  const id = getId({ taskId: task.id, dataId });
  const src = useTaskIdFormUrl({ lang, id });
  return (
    <div>
      <li
        className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-none bg-white text-center"
      >
        <button onClick={() => {
                  setOpen(true);
                  setHideEditor(true);
                  setTask(task);
        }}>
          <div className="flex flex-1 flex-col p-8 text-left place-content-left">
            <dl className="mt-1 flex flex-grow flex-col justify-left">
              <dt className="sr-only">Title</dt>
              <dd className="text-xs font-mono text-gray-500">{id.split("+").join(" + ")}</dd>
              <dd className="mt-4 text-xl text-gray-700">{getTitle(task)}</dd>
            </dl>
          </div>
        </button>
      </li>
      <li
        className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-none bg-white text-center shadow"
      >
        <div className="flex flex-1 flex-col p-8 place-content-center">
          <iframe src={src} width="100%" height="100%" />
        </div>
      </li>
    </div>
  );
}

function Tasks({ setOpen, setHideEditor, setTask, lang, tasks }) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col p-8 text-left place-content-left">
        <h1>No Compiles</h1>
      </div>
    );
  }
  tasks = tasks.sort((a, b) => {
    // Sort descending.
    return +b.timestamp - +a.timestamp;
  });
  return (
    <ol role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
      {
        tasks.map((task, index) => {
          return <Task
            key={`compile-${index}`}
            setOpen={setOpen}
            setHideEditor={setHideEditor}
            setTask={setTask}
            lang={lang}
            task={task}
          />;
        })}
    </ol>
  );
}

export default function Gallery({ lang, mark }) {
  const [open, setOpen] = useState(false);
  const [hideEditor, setHideEditor] = useState(true);
  const [task, setTask] = useState();
  const [taskId, setTaskId] = useState();
  const [newTask, setNewTask] = useState();
  const [dataId, setDataId] = useState();
  const { user } = useGraffiticodeAuth();
  const id = task && task.id;
  const type = "*";  // { "*" | "persistent" | "ephemeral" }
  const { isLoading, data } =
    useSWR(
      user ? { user, type } : null,
      loadCompiles
    );
  const src = useTaskIdFormUrl({ lang, id });
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
  const tasks = data && data.slice(data.length - 10) || [];

  if (newTask && !tasks.some(task => task.id === newTask.id)) {
    tasks.unshift(newTask);
  }
  const hideForm = src === undefined;
  return (
    <>
      <Tasks setOpen={setOpen} setHideEditor={setHideEditor} setTask={setTask} lang={lang} tasks={tasks} setNewTask={setNewTask} />
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <div className="fixed inset-0" />
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-x-0 bottom-0 h-full flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-y-full"
                  enterTo="translate-y-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-y-0"
                  leaveTo="translate-y-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 border-2">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                              onClick={() => setOpen(false)}
                            >
                              <span className="sr-only">Hide editor panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <div className={classNames(
                               hideEditor ? "lg:grid-cols-1" : "lg:grid-cols-2",
                               "grid grid-cols-1 gap-4 sm:px-6 lg:px-8"
                             )}>
                          { !hideForm &&
                            <iframe
                              key={2}
                              src={src}
                              className="w-full h-screen"
                            />
                          }
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
