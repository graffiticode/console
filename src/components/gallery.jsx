import useSWR from "swr";
import { Fragment, useCallback, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { loadTasks } from '../utils/swr/fetchers';
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

const FormIFrame =
      ({key, src, className}) => (
        <iframe
          key={key}
          className={className}
          src={src}
          width="100%"
          height="100%"
        />);

const ReactForm = ({ src }) => {
  let Form;
  useEffect(() => {
    if (src) {
      (async () => {
        Form = await import(src);
      })();
    }
  }, []);        
  return Form || <div />;
}

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
                  setHideEditor(false);
                  setTask(task);
        }}>
          <div className="flex flex-1 flex-col p-8 text-left place-content-left">
            <dl className="mt-1 flex flex-grow flex-col justify-left">
              <dt className="sr-only">Title</dt>
              <dd className="text-xs font-mono text-gray-500">{id}</dd>
              <dd className="mt-4 text-xl text-gray-700">{getTitle(task)}</dd>
            </dl>
          </div>
        </button>
      </li>
      <li
        className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-none bg-white text-center shadow"
      >
        <div className="flex flex-1 flex-col p-8 place-content-center">
          <FormIFrame
            src={src}
          />
        </div>
      </li>
    </div>
  );
}

function Tasks({ setOpen, setHideEditor, setTask, lang, tasks }) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col p-8 text-left place-content-left">
        <h1>No tasks</h1>
      </div>
    );
  }
  tasks = tasks.sort((a, b) => {
    // Sort descending.
    const at = +a.created || 0;
    const bt = +b.created || 0;
    return bt - at;
  });
  return (
    <ol role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
      {
        tasks.map((task, index) => {
          return <Task
            key={`task-${index}`}
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
  const [hideEditor, setHideEditor] = useState(false);
  const [task, setTask] = useState();
  const [taskId, setTaskId] = useState();
  const [newTask, setNewTask] = useState();
  const [dataId, setDataId] = useState();
  const { user } = useGraffiticodeAuth();
  const id = getId({ taskId, dataId });
  const src = useTaskIdFormUrl({ lang, id });
  const { isValidating, isLoading, data } =
    useSWR(
      !open && user ? { user, lang, mark: mark.id } : null,
      loadTasks,
    );
  const handleCreateTask = useCallback(async (e) => {
    e.preventDefault();
    setTask({ lang, src: `| L${lang}`, ephemeral: true });
    setOpen(true);
    setHideEditor(false);
  });

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
  const tasks = data || [];

  if (newTask && !tasks.some(task => task.id === newTask.id)) {
    tasks.unshift(newTask);
  }
  const hideForm = id === "undefined";
  return (
    <>
      <button
        className="rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
        onClick={handleCreateTask}>
        Create New Task
      </button>
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
                          { !hideEditor &&
                            <div className="">
                              <div className="w-full h-7 place-items-end">
                                <button
                                  type="button"
                                  title="Hide editor"
                                  className="rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                  onClick={() => setHideEditor(true)}
                                >
                                  <span className="sr-only">Hide editor panel</span>
                                  <ChevronDoubleLeftIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                              </div>
                              
                              <Editor
                                key={1}
                              userId={uid}
                              task={task}
                              lang={lang}
                              mark={mark}
                              setOpen={setOpen}
                              setTaskId={setTaskId}
                              setNewTask={setNewTask}
                              dataId={dataId}
                                setDataId={setDataId} />
                              </div>
                          }
                          { !hideForm &&
                            <FormIFrame
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
