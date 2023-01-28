import useSWR from "swr";
import Image from 'next/image';
import { useEffect, Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Editor from './editor';
import { useSession, signIn, signOut } from "next-auth/react";
import SignIn from "./SignIn";
import { loadTasks } from '../utils/swr/fetchers';

import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid'

function getTitle(task) {
  return task.code?.split(`\n`)[0].split('|')[1] || undefined;
}

function getId(id) {
//  return id && id.slice(17) || undefined;
  return id;
}

function Tasks({ setOpen, setTask, lang, tasks }) {
  let key = 1;
  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
      {
        tasks.map((task) => {
          if (task === undefined) {
            return;
          }
          const { taskId, id, image, imageUrl } = task;
          const src = `/api/form/${lang}?id=${id}`;
          return (
            <>
              <li
            key={key++}
            className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-none bg-white text-center"
              >
              <button onClick={() => {
                setOpen(true);
                setTask(task);
              }}>
              <div className="flex flex-1 flex-col p-8 text-left place-content-left">
              <dl className="mt-1 flex flex-grow flex-col justify-left">
              <dt className="sr-only">Title</dt>
              <dd className="my-8 text-lg text-gray-700">{getTitle(task)}</dd>
              <dd className="text-xs font-mono text-gray-500">
              {getId(id)}
            </dd>
              </dl>
              </div>
              </button>
              </li>
              <li
            key={key++}
            className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-none bg-white text-center shadow"
              >
              <div className="flex flex-1 flex-col p-8 place-content-center">
              <iframe key={key++} src={src} width="100%" height="100%" />
              </div>
              </li>
              </>
          )
        })}
    </ul>
  );
}

export default function Gallery({ lang, mark }) {
  const [ open, setOpen ] = useState(false);
  const [ task, setTask ] = useState();
  const [ id, setId ] = useState();
  const [ newTask, setNewTask ] = useState();
  const { data: sessionData } = useSession();
  const { data, error, isLoading } =
    useSWR(
      sessionData ? { uid: sessionData.address, lang, mark: mark.id } : null,
      loadTasks
    );
  if (!sessionData) {
    return (
      <div className="justify-center w-full">
        <SignIn
          className="rounded-none border-2 px-3 py-2 text-center hover:border-gray-400 focus:outline-none"
          label={<span className="block font-medium">Sign in to continue</span>}
        />
      </div>
    );
  } else {
    const { address: uid } = sessionData;
    const tasksIds = Object.keys(data || {}).reverse();
    const tasks = tasksIds.map(taskId => {
      const task = data[taskId][0];
      task.taskId = taskId;
      return task;
    });
    if (newTask) {
      tasks.unshift(newTask);
    }
    if (tasks.length === 0) {
      tasks.unshift({
        lang,
        code: '',
      });
    }
    const src = `/api/form/${lang}?id=${id}`;
    return (
      <>
        <Tasks setOpen={setOpen} setTask={setTask} lang={lang} tasks={tasks} setNewTask={setNewTask} />
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
                                <span className="sr-only">Close panel</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 max-w-7xl sm:px-6 lg:px-8">
                            <Editor key={1} userId={uid} task={task} lang={lang} mark={mark} setOpen={setOpen} setId={setId} setNewTask={setNewTask} />
                            <iframe key={2} src={src} width="100%" height="100%" />
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
    )
  }
}
