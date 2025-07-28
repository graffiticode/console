import assert from "assert";
import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import useSWR from "swr";
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { loadTasks, getAccessToken, generateCode } from '../utils/swr/fetchers';
import { isNonEmptyString } from "../utils";
import useArtcompilerAuth from "../hooks/use-artcompiler-auth";
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
  const { user } = useArtcompilerAuth();
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
  const [ triggerSave, setTriggerSave ] = useState(false);
  const [ fileMenuOpen, setFileMenuOpen ] = useState(false);
  const [ isTasksPanelCollapsed, setIsTasksPanelCollapsed ] = useState(
    localStorage.getItem('graffiticode:tasksPanelCollapsed') === 'true'
  );

  // Wrapped setId to store the ID in localStorage when it changes
  const setId = (newId) => {
    _setId(newId);
    // Store the task ID in localStorage
    if (newId) {
      localStorage.setItem('graffiticode:selected:taskId', newId);
    }
  };
  const { user } = useArtcompilerAuth();
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const editorRef = useRef();

  const handleSave = useCallback(() => {
    setTriggerSave(true);
    setTimeout(() => setTriggerSave(false), 100);
  }, []);

  const toggleTasksPanel = useCallback(() => {
    const newState = !isTasksPanelCollapsed;
    setIsTasksPanelCollapsed(newState);
    localStorage.setItem('graffiticode:tasksPanelCollapsed', newState.toString());
  }, [isTasksPanelCollapsed]);

  const handleCreateTask = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setHideEditor(false);

    let template = '{}..'; // Default template
    let taskId = null;

    try {
      // Generate a minimal template using generateCode
      const prompt = "Create a minimal starting template";
      const result = await generateCode({
        user,
        prompt,
        language: lang
      });
      if (result) {
        if (result.code) {
          template = result.code;
        }
        if (result.taskId) {
          taskId = result.taskId;
        }
      }
    } catch (error) {
      console.error("Failed to generate template:", error);
      // Use default template on error
    }

    // Use the returned task ID or create a temporary one if posting failed
    const newTaskId = taskId || `temp-${Date.now()}`;
    const newTask = {
      id: newTaskId,
      name: "unnamed",
      src: template,
      help: [],
      mark: mark.id,
      isPublic: false,
      created: Date.now(),
      lang: lang,
    };

    // Add the new task to the beginning of the tasks list
    setTasks([newTask, ...tasks]);

    // Set the current ID to the new task ID
    setId(newTaskId);
  }, [tasks, mark, lang, user, setHideEditor, setTasks, setId]);

  const { isValidating, isLoading, data: loadTasksData } =
    useSWR(
      user ? { user, lang, mark: mark.id } : null,
      loadTasks,
    );

  useEffect(() => {
    if (!loadTasksData || loadTasksData.length === 0) {
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
    <div className="flex h-[calc(100vh-64px)] w-full">
      {/* Menu bar hidden - uncomment to restore
      <div className="bg-white py-1 flex-none">
        <div className="flex items-center space-x-1 pl-2">
          <div
            className="relative inline-block text-left"
            onMouseEnter={() => setFileMenuOpen(true)}
            onMouseLeave={() => setFileMenuOpen(false)}
          >
            <button
              className="px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-none"
            >
              File
            </button>
            <Transition
              show={fileMenuOpen}
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <div className="absolute left-0 mt-1 w-40 origin-top-left rounded-none bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleCreateTask();
                      setFileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    New
                  </button>
                  <button
                    onClick={() => {
                      handleSave();
                      setFileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Save
                  </button>
                </div>
              </div>
            </Transition>
          </div>
          <button
            className="px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-none"
            onClick={() => console.log('Edit menu')}
          >
            Edit
          </button>
          <button
            className="px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-none"
            onClick={() => console.log('View menu')}
          >
            View
          </button>
          <button
            className="px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-none"
            onClick={() => console.log('Tools menu')}
          >
            Tools
          </button>
        </div>
      </div>
      */}
      {/* Main content area */}
      <div className="flex grow">
        {/* TasksNav panel with collapse functionality */}
        <div className={classNames(
          "flex-none h-full transition-all duration-300",
          isTasksPanelCollapsed ? "w-10" : "w-[210px]"
        )}>
          <div className="sticky top-[64px] bg-white z-40 pb-2 flex items-center justify-between">
            {!isTasksPanelCollapsed && (
              <button
                className="text-xl rounded-none bg-white text-gray-400 hover:text-gray-500 focus:outline-none ml-2"
                title="New Task"
                onClick={handleCreateTask}>
                +
              </button>
            )}
            <button
              className="text-gray-400 hover:text-gray-500 focus:outline-none p-2"
              title={isTasksPanelCollapsed ? "Expand tasks panel" : "Collapse tasks panel"}
              onClick={toggleTasksPanel}>
              {isTasksPanelCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>
          {!isTasksPanelCollapsed && (
            <TasksNav user={user} setId={setId} tasks={tasks} />
          )}
        </div>
        <div className="flex flex-col grow px-2" style={{paddingTop: "5px"}}>
          <div className={classNames(
                 hideEditor ? "block" : "flex flex-col lg:flex-row",
                 "gap-4 items-start"
               )}>
            {
              !hideEditor &&
                <div
                  ref={editorRef}
                  className="relative ring-0 border border-gray-200 rounded-none mb-2 order-2 lg:order-1 resize-x"
                  style={{
                    height: "calc(100vh - 80px)",
                    width: "48%",
                    minWidth: "300px",
                    maxWidth: "70%"
                  }}
                >
                  <Editor
                    accessToken={accessToken}
                    id={id}  // Always pass the id, including temp- ids
                    lang={lang}
                    mark={mark}
                    setId={setId}
                    setNewTask={setNewTask}
                    tasks={tasks}
                    setShowSaving={setShowSaving}
                    height={editorHeight}
                    onCreateTask={handleCreateTask}
                    triggerSave={triggerSave}
                  />
                </div>
            }
            {
              <div
                className="relative ring-0 border border-gray-300 rounded-none resize-both order-1 lg:order-2"
                style={{
                  height: "calc(100vh - 80px)",
                  width: "48%",
                  minHeight: "200px",
                  maxHeight: "calc(100vh - 80px)",
                  minWidth: "300px",
                  maxWidth: "70%"
                }}
              >
                <FormView
                  key="form"
                  accessToken={accessToken}
                  id={id}
                  lang={lang}
                  height="100%"
                  className="h-full overflow-auto p-2"
                />
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
