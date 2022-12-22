import Image from 'next/image';
/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Editor from './editor';
import { useSelector } from 'react-redux'
import { useSession, signIn, signOut } from "next-auth/react";
import SignInAlert from "./SignInAlert";

import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid'

function getTitle(task) {
  return task.code.split(`\n`)[0].split('|')[1] || "Untitled";
}

function Tasks({setOpen, setTask, lang}) {
  let tasks = useSelector(state => state.tasks);
  const tasksIds = Object.keys(tasks).reverse();
  // if (tasksIds.length === 0) {
  //   return <div />;
  // }
  tasks = tasksIds.map(taskId => {
    const task = tasks[taskId][0];
    if (task.lang === lang) {
      task.taskId = taskId;
      return task;
    } else {
      return null;
    }
  });
  tasks = tasks.filter(task => task !== null);
  if (tasks.length === 0) {
    tasks.push({lang, code: ''});
  }
  return (
    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {tasks.map((task) => {
        if (task === undefined) {
          return;
        }
        const { taskId, id, image, imageUrl } = task;
        const src =
          image && `data:image/png;base64, ${image}` ||
          imageUrl ||
          `https://cdn.acx.ac/${id}.png`;
        return (
          <li
              key={taskId}
              className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-none bg-white text-center shadow"
            >
            <button onClick={() => {
              setOpen(true);
              setTask(task);
            }}>
            <div className="flex flex-1 flex-col p-8">
              <img src={src} alt="thumbnail" />
              <dl className="mt-1 flex flex-grow flex-col justify-between">
                <dt className="sr-only">Title</dt>
                <dd className="text-sm text-gray-700">{getTitle(task)}</dd>
              </dl>
              <h3 className="mt-6 text-xs font-light text-gray-500">
                {`${id}`}
              </h3>
            </div>
            </button>
          </li>
        )
      })}
    </ul>
  );
}

export default function Gallery({lang}) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState();
  const userId = useSelector(state => state.userId);
  const id = useSelector(state => state.id);
  const { data: session } = useSession();
  if (!session) {
    return (
      <div className="justify-center w-full">
        <SignInAlert />
      </div>
    );
  } else {
    const src = `/api/form/${lang}?id=${id}`;
    return (
    <>
      <Tasks setOpen={setOpen} setTask={setTask} lang={lang}/>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <div className="fixed inset-0" />
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-x-0 bottom-0 h-5/6 flex max-w-full">
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
                        <div className="h-72 grid grid-cols-1 gap-4 lg:grid-cols-2 max-w-7xl mx-auto sm:px-6 lg:px-8">
                          <Editor key="1" userId={userId} task={task} setOpen={setOpen}/>
                          <iframe key="2" src={src} height="100%"/>
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
