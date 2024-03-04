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
import { Disclosure } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import TasksNav from "./TasksNav.jsx";

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

const sliceName = name => name.slice(17).slice(0,27);

const getNestedItems = ({ setId, setItems, tasks }) => {
  const items = tasks.map((task, index) => {
    // Group by head.
    const [hd0, tl0] = task.id.split("+");
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
  return nestedItems;
}

export default function Gallery({ lang, mark }) {
  const [ hideEditor, setHideEditor ] = useState(false);
  const [ tasks, setTasks ] = useState([]);
  const [ task, setTask ] = useState({});
  const [ newTask, setNewTask ] = useState();
  const [ showSaving, setShowSaving ] = useState(false);
  const [ formHeight, setFormHeight ] = useState(640);
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
    setShowSaving(false);
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

  const hideForm = id === "undefined";
  return (
    <div className="flex">
      <div className="colspan-1">
        <button
          className="text-xl rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
          title="New Task"
          onClick={handleCreateTask}>
          +
        </button>
        <TasksNav user={user} setId={setId} setTask={setTask} tasks={tasks} />
      </div>
      <div className="flex flex-col grow mt-6 px-4 sm:px-6">
        <div className={classNames(
               hideEditor ? "lg:grid-cols-1" : "lg:grid-cols-1",
               "grid grid-cols-1 gap-4 sm:px-6 lg:px-8"
             )}>
          {
            !hideEditor &&
              <div
                className={classNames(
                  showSaving &&
                    "ring-8" ||
                    "ring-0",
                  "w-full transition-shadow duration-1000 ring-green-100 border border-gray-200 rounded-md overflow-auto resize-y h-48"
                )}
              >
                <Editor
                  id={id}
                  lang={lang}
                  mark={mark}
                  setId={setId}
                  setNewTask={setNewTask}
                  tasks={tasks}
                  setShowSaving={setShowSaving}
                  style={{height: formHeight}}
                  height={formHeight}
                  setHeight={setFormHeight}
                />
              </div>
          }
          {
            !hideForm &&
              <FormView
                key="form"
                accessToken={accessToken}
                id={id}
                lang={lang}
                height={formHeight}
                className="border border-gray-300 rounded-md overflow-auto p-2 resize-y"
                style={{height: formHeight}}
                setHeight={setFormHeight}
              />
          }
        </div>
      </div>
    </div>
  );
}
