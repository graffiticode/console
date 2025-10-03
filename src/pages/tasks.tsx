import Head from 'next/head';
import { useState, useEffect } from 'react';
import { getTitle } from '../lib/utils';
import TasksNav from '../components/TasksNav';
import SignIn from '../components/SignIn';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import useSWR from 'swr';
import { loadTasks, getAccessToken } from '../utils/swr/fetchers';
import FormView from '../components/FormView';
import { DataPanel } from '../components/DataPanel';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Tasks({ language, mark }) {
  const [taskId, setTaskId] = useState('');
  const [formHeight, setFormHeight] = useState(350);
  const [dataHeight, setDataHeight] = useState(350);
  const { user } = useGraffiticodeAuth();

  useEffect(() => {
    document.title = getTitle();
  }, []);

  const lang = language.name.slice(1);

  // Get access token
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );

  // Load tasks
  const { data: tasks, isLoading } = useSWR(
    user && lang && mark ? { user, lang, mark: mark.id } : null,
    loadTasks,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
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

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="flex">
        {/* Left sidebar with TasksNav */}
        <div className="flex-none">
          <TasksNav
            user={user}
            setId={setTaskId}
            tasks={tasks || []}
            currentId={taskId}
          />
        </div>

        {/* Right side with form and data panels stacked vertically */}
        <div className="flex flex-col grow mt-6 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:px-6 lg:px-8">
            {/* Form panel on top */}
            <div>
              <FormView
                id={taskId}
                lang={lang}
                height={formHeight}
                className="border border-gray-300 rounded-none overflow-auto p-2 resize"
              />
            </div>

            {/* Data panel on bottom */}
            <div>
              <div className="border border-gray-300 rounded-none overflow-auto p-2 resize" style={{height: dataHeight}}>
                <DataPanel
                  id={taskId}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
