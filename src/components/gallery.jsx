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
  const [ formHeight, setFormHeight ] = useState(350);
  const [ editorHeight, setEditorHeight ] = useState(600);
  const [ id, _setId ] = useState("");

  // Wrapped setId to store the ID in localStorage when it changes
  const setId = (newId) => {
    _setId(newId);
    // Store the task ID in localStorage
    if (newId) {
      localStorage.setItem('graffiticode:selected:taskId', newId);
    }
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

    // Create a temporary new task with a temporary ID
    const tempId = `temp-${Date.now()}`;
    const tempTask = {
      id: tempId,
      name: "unnamed",
      src: "{}..",
      help: [],
      mark: mark.id,
      isPublic: false,
      created: Date.now(),
      lang: lang,
    };

    // Add the temporary task to the beginning of the tasks list
    setTasks([tempTask, ...tasks]);

    // Set the current ID to the temporary ID
    setId(tempId);
  }, [tasks, mark, lang, setHideEditor, setTasks, setId]);

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

      // Try to restore the previously selected task ID from localStorage
      try {
        const savedTaskId = localStorage.getItem('graffiticode:selected:taskId');
        if (savedTaskId) {
          // Check if this task or a related task exists in our current tasks list
          const taskIdBase = savedTaskId.split('+')[0]; // Get the base task ID without data ID
          const matchingTask = processedTasks.find(task =>
            task.id === savedTaskId || task.id === taskIdBase ||
            (task.id.startsWith(taskIdBase) && task.id.includes('+'))
          );

          if (matchingTask) {
            setId(matchingTask.id);
            return; // We found a match, no need to default to first item
          }
        }
      } catch (e) {
        console.error("Error restoring task selection:", e);
      }
    } else {
      setTasks([]);
    }
  }, [loadTasksData]);

  useEffect(() => {
    // If this is indeed a new task, then add it to the list. Otherwise, nothing
    // to see here.
    if (newTask) {
      // Check if we're replacing a temporary task
      const tempTaskIndex = tasks.findIndex(task => task.id.startsWith('temp-'));

      if (tempTaskIndex >= 0) {
        // Replace the temporary task with the new saved task
        const updatedTasks = [...tasks];
        updatedTasks[tempTaskIndex] = newTask;
        setTasks(updatedTasks);
      } else if (!tasks.some(task => task.id === newTask.id)) {
        // Create a new array with the new task at the beginning
        setTasks([newTask, ...tasks]);
      }
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
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-none w-[210px] h-full">
        <div className="sticky top-[64px] bg-white z-40 pb-2">
          <button
            className="text-xl rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
            title="New Task"
            onClick={handleCreateTask}>
            +
          </button>
        </div>
        <TasksNav user={user} setId={setId} tasks={tasks} />
      </div>
      <div className="flex flex-col grow pt-2 px-2 sm:px-4">
        <div className={classNames(
               hideEditor ? "lg:grid-cols-1" : "lg:grid-cols-1",
               "grid grid-cols-1 gap-4 sm:px-6 lg:px-8"
             )}>
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
          {
            !hideEditor &&
              <div
                ref={editorRef}
                className={classNames(
                  showSaving &&
                    "ring-8" ||
                    "ring-0",
                  "w-full transition-shadow duration-1000 ring-green-100 border border-gray-200 rounded-none overflow-hidden mb-2 resize-x"
                )}
                style={{
                  height: "calc(100vh - 80px)",
                  resize: "horizontal"
                }}
              >
                <Editor
                  accessToken={accessToken}
                  id={id.startsWith('temp-') ? '' : id}
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
        </div>
      </div>
    </div>
  );
}
