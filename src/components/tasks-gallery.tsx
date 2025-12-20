import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import useSWR from "swr";
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import SignIn from "./SignIn";
import { getAccessToken, loadCompiles, getData } from '../utils/swr/fetchers';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import FormView from "./FormView";
import { DataPanel } from "./DataPanel";
import { ReadOnlyCodePanel } from "./ReadOnlyCodePanel";
import { CompilerTabs } from "./CompilerTabs";
import { useRouter } from 'next/router';

// Helper to elide task IDs, showing only characters 18-25
const elideTaskId = (id) => {
  return id.length > 25 ? id.substring(17, 25) : id;
};

// Helper to elide compound IDs (with +), eliding each part separately
const elideCompoundId = (id) => {
  if (!id.includes('+')) {
    return elideTaskId(id);
  }

  const parts = id.split('+');
  const elided = parts.map(part => elideTaskId(part));
  return elided.join('+');
};



function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function TasksGallery({ lang }) {
  const router = useRouter();
  const [ hideEditor, setHideEditor ] = useState(false);
  const [ formHeight, setFormHeight ] = useState(350);
  const [ dataHeight, setDataHeight ] = useState(350);
  const [ selectedTaskId, setSelectedTaskId ] = useState("");
  const [ isTasksPanelCollapsed, setIsTasksPanelCollapsed ] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:compiles:tasksPanelCollapsed') === 'true'
  );
  const [ isDataPanelCollapsed, setIsDataPanelCollapsed ] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:compiles:dataPanelCollapsed') === 'true'
  );
  const [ isFormPanelCollapsed, setIsFormPanelCollapsed ] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:compiles:formPanelCollapsed') === 'true'
  );
  const [ dataPanelWidth, setDataPanelWidth ] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('graffiticode:compiles:dataPanelWidth') : null;
    return saved ? parseFloat(saved) : 400;
  }); // Pixel width for data panel
  const [ previewPanelHeight, setPreviewPanelHeight ] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('graffiticode:compiles:previewPanelHeight') : null;
    return saved ? parseFloat(saved) : 50;
  }); // Percentage height for mobile
  const [ tab, setTab ] = useState("Code"); // State for the active tab
  const [ currentCode, setCurrentCode ] = useState("");
  const [ currentData, setCurrentData ] = useState({});
  const { user } = useGraffiticodeAuth();
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<any>(null);
  const dataPanelRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const [ compiles, setCompiles ] = useState([]);
  const [ taskIds, setTaskIds ] = useState([]);
  const [ showId, setShowId ] = useState("");
  const taskItemsRef = useRef({});
  const tasksListRef = useRef(null);

  // Load compiles from the API
  const type = "*";  // { "*" | "persistent" | "ephemeral" }
  const { data: compilesData, isLoading: isLoadingCompiles, error } = useSWR(
    user ? { user, lang, type } : null,
    loadCompiles
  );



  useEffect(() => {
    const compilesArray = compilesData && compilesData.sort((a, b) => {
      // Sort descending.
      return +b.timestamp - +a.timestamp;
    }) || [];

    setCompiles(compilesArray);

    // Extract unique task IDs from compiles
    const uniqueTaskIds = [];
    const taskIdSet = new Set();

    compilesArray.forEach(compile => {
      if (!taskIdSet.has(compile.id)) {
        taskIdSet.add(compile.id);
        uniqueTaskIds.push({
          id: compile.id,
          timestamp: compile.timestamp,
          current: false
        });
      }
    });

    // Sort by timestamp descending
    uniqueTaskIds.sort((a, b) => +b.timestamp - +a.timestamp);
    setTaskIds(uniqueTaskIds);

    // Try to restore the selected task ID from URL query or localStorage
    let taskIdFound = false;
    if (uniqueTaskIds.length > 0) {
      try {
        // First check URL query parameter
        const queryTaskId = router.query.taskId as string;
        // Then check localStorage for saved taskId from Items view
        const savedTaskId = typeof window !== 'undefined' ? localStorage.getItem('graffiticode:selected:taskId') : null;

        const taskIdToSelect = queryTaskId || savedTaskId;

        if (taskIdToSelect) {
          // Find matching task ID (handle both full ID and partial matches)
          const matchingTask = uniqueTaskIds.find(task =>
            task.id === taskIdToSelect || task.id.startsWith(taskIdToSelect)
          );
          if (matchingTask) {
            setSelectedTaskId(matchingTask.id);
            matchingTask.current = true;
            taskIdFound = true;

            // Scroll the selected task into view in the middle of the viewport
            setTimeout(() => {
              if (taskItemsRef.current[matchingTask.id] && tasksListRef.current) {
                const taskElement = taskItemsRef.current[matchingTask.id];
                const listContainer = tasksListRef.current;

                // Get the container's visible height
                const containerHeight = listContainer.clientHeight;

                // Get the task element's position and height
                const taskTop = taskElement.offsetTop;
                const taskHeight = taskElement.offsetHeight;

                // Calculate scroll position to center the task
                // Task center position - half of container height
                const scrollTop = taskTop + (taskHeight / 2) - (containerHeight / 2);

                // Set the scroll position (constrained to valid range)
                listContainer.scrollTop = Math.max(0, scrollTop);
              }
            }, 100); // Small delay to ensure DOM is updated
          }
        }
      } catch (e) {
        console.error("Error restoring task selection:", e);
      }

      // Set the first task as selected by default if no matching task was found
      if (!taskIdFound && uniqueTaskIds.length > 0) {
        setSelectedTaskId(uniqueTaskIds[0].id);
        uniqueTaskIds[0].current = true;
      }
    }

    setTaskIds([...uniqueTaskIds]); // Force update with current flags
  }, [compilesData, router.query.taskId]);

  const toggleTasksPanel = useCallback(() => {
    const newState = !isTasksPanelCollapsed;
    setIsTasksPanelCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:compiles:tasksPanelCollapsed', newState.toString());
    }
  }, [isTasksPanelCollapsed]);

  const toggleDataPanel = useCallback(() => {
    const newState = !isDataPanelCollapsed;
    setIsDataPanelCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:compiles:dataPanelCollapsed', newState.toString());
    }
  }, [isDataPanelCollapsed]);

  const toggleFormPanel = useCallback(() => {
    const newState = !isFormPanelCollapsed;
    setIsFormPanelCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:compiles:formPanelCollapsed', newState.toString());
    }
  }, [isFormPanelCollapsed]);

  const handleCopy = useCallback(async () => {
    try {
      const content = tab === "Code" ? currentCode : JSON.stringify(currentData, null, 2);
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [tab, currentCode, currentData]);

  const handleSelectTask = (taskId) => {
  setSelectedTaskId(taskId);
  // Mark the selected item as current
  taskIds.forEach(task => task.current = false);
  const selectedTask = taskIds.find(task => task.id === taskId);
  if (selectedTask) {
  selectedTask.current = true;
  }
  setTaskIds([...taskIds]);

  if (typeof window !== 'undefined') {
  localStorage.setItem('graffiticode:selected:taskId', taskId);
  }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <SignIn
          label="Sign in to continue"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      {/* Main content area */}
      <div className="flex grow w-full overflow-hidden">
        {/* Tasks panel with collapse functionality */}
        <>
        <div className={classNames(
          "flex-none transition-all duration-300 border border-gray-200 rounded-none mr-1",
          isTasksPanelCollapsed ? "w-10" : "w-[210px]",
          isTasksPanelCollapsed ? "h-10" : "h-[calc(100vh-90px)]"
        )}>
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <span className={classNames(
              "text-sm font-medium text-gray-700",
              isTasksPanelCollapsed && "hidden"
            )}>Tasks</span>
            <button
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
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
            <div className="h-[calc(100%-42px)] overflow-auto" ref={tasksListRef}>
              {isLoadingCompiles ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-gray-500">Loading tasks...</div>
                </div>
              ) : taskIds.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-gray-500">No tasks found</div>
                </div>
              ) : (
                <nav className="flex flex-1 flex-col p-2">
                  <ul role="list" className="space-y-1 font-mono pr-1">
                    {taskIds.map((task) => (
                      <li key={task.id} ref={el => { taskItemsRef.current[task.id] = el; }}>
                        <div
                          className={classNames(
                            task.current ? 'bg-gray-100' : 'hover:bg-gray-100',
                            "flex flex-row justify-between pr-2"
                          )}
                          onMouseOver={() => {
                            if (showId !== task.id) {
                              setShowId(task.id);
                            }
                          }}
                        >
                          <button
                            onClick={() => handleSelectTask(task.id)}
                            className={classNames(
                              task.current ? 'bg-gray-100' : 'hover:bg-gray-100',
                              'block rounded-none py-0 pr-2 pl-4 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900 w-full text-left truncate'
                            )}
                          >
                            {elideCompoundId(task.id)}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
        {/* Spacer between Tasks and data panels */}
        <div className="w-1 ml-1" />
        </>
        <div className="flex flex-col grow">
          <div
               ref={containerRef}
               className={classNames(
               hideEditor ? "block" : "flex flex-col lg:flex-row",
               "gap-4 lg:gap-0",
               "w-full",
               "h-[calc(100vh-90px)]"
               )}>
            <div className="relative flex">
              <div
                ref={dataPanelRef}
                className={classNames(
                  "relative ring-0 border border-gray-200 rounded-none",
                  "order-2 lg:order-1",
                  isDataPanelCollapsed ? "h-10" : "lg:h-full",
                  !isDataPanelCollapsed && "lg:min-h-[300px]",
                  !isDataPanelCollapsed && !isFormPanelCollapsed && "overflow-auto"
                )}
                style={{
                  width: isDataPanelCollapsed
                    ? '40px'
                    : isFormPanelCollapsed
                      ? '100%'
                      : `${dataPanelWidth}px`
                }}
              >
                <div className="flex justify-between items-center p-2 border-b border-gray-200">
                  <span className={classNames(
                    "text-sm font-medium text-gray-700",
                    isDataPanelCollapsed && "hidden"
                  )}>Compile</span>
                  <button
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    title={isDataPanelCollapsed ? "Expand data panel" : "Collapse data panel"}
                    onClick={toggleDataPanel}>
                    {isDataPanelCollapsed ? (
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
                <div className={classNames(
                  "border-b border-gray-200",
                  isDataPanelCollapsed && "hidden"
                )}>
                  <CompilerTabs tab={tab} setTab={setTab} onCopy={handleCopy} />
                </div>
                <div
                  ref={dataRef}
                  className={classNames(
                    isDataPanelCollapsed && "hidden",
                    "overflow-hidden"
                  )}
                  style={{ height: 'calc(100% - 84px)' }}
                >
                  <div className="h-full overflow-auto p-2">
                    {tab === "Data" ? (
                      <DataPanel
                        id={selectedTaskId}
                        user={user}
                        onDataChange={setCurrentData}
                      />
                    ) : (
                      <ReadOnlyCodePanel
                        id={selectedTaskId}
                        user={user}
                        onCodeChange={setCurrentCode}
                      />
                    )}
                  </div>
                </div>
              </div>
              {/* Vertical resize bar between data and preview panels (desktop) */}
              {!isDataPanelCollapsed && !isFormPanelCollapsed && (
                <div
                  className="hidden lg:block w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize transition-colors lg:order-2 mx-1"
                  onPointerDown={(e) => {
                  e.preventDefault();
                  let isDragging = false;
                  let holdTimeout = null;

                  // Capture the pointer to ensure we get all events
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);

                  const handlePointerMove = (moveEvent) => {
                  // Only act after hold timeout
                  if (!isDragging || !containerRef.current) return;

                  const rect = containerRef.current.getBoundingClientRect();
                  const x = moveEvent.clientX - rect.left;
                  const containerWidth = rect.width;

                  // Calculate new width in pixels for data panel
                  const minDataWidth = 200;
                  const minPreviewWidth = 200;
                  const maxDataWidth = Math.min(containerWidth - minPreviewWidth, window.innerWidth * 0.7);

                  const newDataWidth = Math.max(minDataWidth, Math.min(maxDataWidth, x));

                  setDataPanelWidth(newDataWidth);

                  if (typeof window !== 'undefined') {
                  localStorage.setItem('graffiticode:compiles:dataPanelWidth', newDataWidth.toString());
                  }
                  };

                  const handlePointerUp = () => {
                  if (holdTimeout) {
                      clearTimeout(holdTimeout);
                      holdTimeout = null;
                    }
                  isDragging = false;
                  target.releasePointerCapture(e.pointerId);
                  target.removeEventListener('pointermove', handlePointerMove);
                  target.removeEventListener('pointerup', handlePointerUp);
                  target.removeEventListener('pointercancel', handlePointerUp);
                  };

                  // Attach listeners to the target element
                  target.addEventListener('pointermove', handlePointerMove);
                  target.addEventListener('pointerup', handlePointerUp);
                  target.addEventListener('pointercancel', handlePointerUp);

                  // Start drag after holding for 200ms
                    holdTimeout = setTimeout(() => {
                      isDragging = true;
                    }, 200);
                  }}
                  title="Drag to resize horizontally"
                />
              )}
            </div>
            {/* Spacer to maintain gap when drag bar is hidden */}
            {(isDataPanelCollapsed || isFormPanelCollapsed) && (
              <div className="hidden lg:block w-1 lg:order-2 mx-1" />
            )}
            <div
              ref={previewPanelRef}
              className={classNames(
                "relative ring-0 border border-gray-300 rounded-none",
                "order-1 lg:order-3",
                isFormPanelCollapsed ? "h-10" : "lg:h-full",
                !isFormPanelCollapsed && "lg:min-h-[200px]",
                !isFormPanelCollapsed && "overflow-hidden",
                !isFormPanelCollapsed && !isDataPanelCollapsed && "lg:resize-none",
                "flex flex-col"
              )}
              style={{
                width: isFormPanelCollapsed
                  ? '40px'
                  : isDataPanelCollapsed
                    ? 'calc(100% - 56px)'
                    : `calc(100% - ${Math.min(dataPanelWidth, window.innerWidth - 400) + (isFormPanelCollapsed ? 0 : 4)}px)`,
                maxWidth: !isFormPanelCollapsed ? 'calc(100vw - 280px)' : undefined
              }}
            >
              <div className="flex justify-between items-center p-2 border-b border-gray-200">
                <span className={classNames(
                  "text-sm font-medium text-gray-700",
                  isFormPanelCollapsed && "hidden"
                )}>Preview</span>
                <button
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  title={isFormPanelCollapsed ? "Expand preview panel" : "Collapse preview panel"}
                  onClick={toggleFormPanel}>
                  {isFormPanelCollapsed ? (
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
              <div className={classNames(
                isFormPanelCollapsed && "hidden",
                "h-[calc(100%-42px)]",
                "overflow-auto",
                "flex-1"
              )}>
                <FormView
                  key="form"
                  id={selectedTaskId}
                  lang={lang}
                  height="100%"
                  className="h-full w-full p-2"
                  setData={() => {}}
                  setId={() => {}}
                  setNewTask={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
