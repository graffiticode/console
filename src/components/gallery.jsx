import assert from "assert";
import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import useSWR from "swr";
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
  const [ newTask, setNewTask ] = useState(null);
  const [ showSaving, setShowSaving ] = useState(false);
  const [ formHeight, setFormHeight ] = useState(480);
  const [ editorHeight, setEditorHeight ] = useState(360);
  const [ id, _setId ] = useState("");
  // Wrapped setId with debug logging
  const setId = (newId) => {
    _setId(newId);
  };
  const { user } = useGraffiticodeAuth();
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const editorRef = useRef();

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
    if (loadTasksData === undefined || loadTasksData.length === 0) {
      setId("");
    }
    if (loadTasksData && loadTasksData.length > 0) {
      const processedTasks = loadTasksData.map(task => {
        if (task.help) {
          assert(!task.help || typeof task.help === "string", typeof task.help);
          task.help = task.help && JSON.parse(task.help) || [];
        }
        return task;
      });
      setTasks(processedTasks);
    } else {
      setTasks([]);
    }
  }, [loadTasksData]);

  useEffect(() => {
    // If this is indeed a new task, then add it to the list. Otherwise, nothing
    // to see here.
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

  return (
    <div className="flex">
      <div className="colspan-1">
        <button
          className="text-xl rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
          title="New Task"
          onClick={handleCreateTask}>
          +
        </button>
        <TasksNav user={user} setId={setId} tasks={tasks} />
      </div>
      <div className="flex flex-col grow mt-6 px-4 sm:px-6">
        <div className={classNames(
               hideEditor ? "lg:grid-cols-1" : "lg:grid-cols-1",
               "grid grid-cols-1 gap-4 sm:px-6 lg:px-8"
             )}>
          {
            !hideEditor &&
              <div
                ref={editorRef}
                className={classNames(
                  showSaving &&
                    "ring-8" ||
                    "ring-0",
                  "w-full transition-shadow duration-1000 ring-green-100 border border-gray-200 rounded-none overflow-auto resize-y"
                )}
                style={{height: editorHeight}}
              >
                <Editor
                  accessToken={accessToken}
                  id={id}
                  lang={lang}
                  mark={mark}
                  setId={setId}
                  setNewTask={setNewTask}
                  tasks={tasks}
                  setShowSaving={setShowSaving}
                  height={editorHeight}
                />
              </div>
          }
          {
            <FormView
              key="form"
              accessToken={accessToken}
              id={id}
              lang={lang}
              height={formHeight}
              className="border border-gray-300 rounded-none overflow-auto p-2 resize"
              style={{height: formHeight}}
            />
          }
        </div>
      </div>
    </div>
  );
}
