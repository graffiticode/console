import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import useSWR from "swr";
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import SignIn from "./SignIn";
import { getAccessToken, loadCompiles, getData, getTaskLangs } from '../utils/swr/fetchers';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import TasksHeaderMenu, {
  TasksDateFilter,
  TasksLangFilter,
  DEFAULT_TASKS_DATE_FILTER,
  DEFAULT_TASKS_LANG_FILTER,
  matchesLangPattern,
} from './tasks-header-menu';
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

function formatTimestamp(ts) {
  if (!ts) return null;
  const n = typeof ts === 'number' ? ts : Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  try {
    return new Date(n).toLocaleString();
  } catch {
    return null;
  }
}

function TaskMenu({ task, user, isOpen, onOpen, onClose }) {
  const [taskIdCopied, setTaskIdCopied] = useState(false);
  const [taskIdFocused, setTaskIdFocused] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const taskIdRef = useRef<HTMLTextAreaElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: -9999, left: -9999 });

  const fitTaskIdHeight = () => {
    const el = taskIdRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  };
  const isCompound = typeof task.id === 'string' && task.id.includes('+');
  const { data: taskInfo } = useSWR(
    isOpen && isCompound && user ? [`taskLangs-${task.id}`, { user, id: task.id }] : null,
    ([_, params]) => getTaskLangs(params),
  );

  const positionMenu = () => {
    if (buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 280;
      const menuHeight = menuRef.current.offsetHeight;

      const rightSpace = window.innerWidth - buttonRect.right;
      const leftSpace = buttonRect.left;

      let top = buttonRect.top;
      let left;

      if (top + menuHeight > window.innerHeight) {
        top = Math.max(window.innerHeight - menuHeight - 10, 10);
      }

      if (rightSpace >= menuWidth + 8) {
        left = buttonRect.right + 8;
      } else if (leftSpace >= menuWidth + 8) {
        left = buttonRect.left - menuWidth - 8;
      } else {
        left = Math.max(10, window.innerWidth / 2 - menuWidth / 2);
      }

      setMenuPosition({ top, left });
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      onClose();
    } else {
      onOpen();
      setTimeout(() => {
        positionMenu();
        setTimeout(positionMenu, 50);
      }, 0);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition({ top: -9999, left: -9999 });
      return;
    }
    setTimeout(() => {
      positionMenu();
      setTimeout(positionMenu, 50);
    }, 0);
    window.addEventListener('resize', positionMenu);
    return () => window.removeEventListener('resize', positionMenu);
  }, [isOpen]);

  const lastCompile = formatTimestamp(task.timestamp);
  const langDisplay = (() => {
    const fetched = taskInfo && Array.isArray(taskInfo.langs) ? taskInfo.langs : null;
    if (fetched && fetched.length > 0) return fetched.join('+');
    if (isCompound) return `${task.lang || '—'}+…`;
    return task.lang || '—';
  })();

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <button
        ref={buttonRef}
        className="flex items-center mt-1 text-gray-400 hover:text-gray-600"
        onClick={handleClick}
        aria-label="Open menu"
      >
        <EllipsisVerticalIcon className="h-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => onClose()}
        >
          <div
            ref={menuRef}
            className="fixed bg-white shadow-lg ring-1 ring-gray-200 z-50 rounded-none"
            onClick={e => e.stopPropagation()}
            style={{
              width: '280px',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              maxHeight: 'calc(100vh - 40px)',
              overflow: 'auto'
            }}
          >
            <div className="p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Task Attributes</div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Task ID</label>
                <div className="flex items-start gap-1">
                  <textarea
                    ref={taskIdRef}
                    rows={1}
                    spellCheck={false}
                    readOnly
                    wrap="soft"
                    className={classNames(
                      "flex-1 min-w-0 text-xs font-mono text-gray-600 py-1.5 px-2 ring-1 ring-gray-300 rounded-none focus:outline-none focus:ring-gray-500 resize-none leading-5",
                      taskIdFocused ? "break-all" : "whitespace-nowrap overflow-hidden"
                    )}
                    value={taskIdFocused ? task.id : elideCompoundId(task.id)}
                    onFocus={(e) => {
                      setTaskIdFocused(true);
                      setTimeout(() => {
                        e.target.select();
                        fitTaskIdHeight();
                      }, 0);
                    }}
                    onBlur={() => {
                      setTaskIdFocused(false);
                      const el = taskIdRef.current;
                      if (el) el.style.height = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(task.id);
                      setTaskIdCopied(true);
                      setTimeout(() => setTaskIdCopied(false), 1000);
                    }}
                    className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-900 ring-1 ring-gray-300 hover:ring-gray-500 rounded-none"
                    title="Copy task id"
                    aria-label="Copy task id"
                  >
                    {taskIdCopied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-1">
                {lastCompile && (
                  <div className="flex gap-3 text-xs text-gray-600 py-0.5">
                    <span className="font-semibold w-20 flex-shrink-0">Compiled</span>
                    <span className="font-mono">{lastCompile}</span>
                  </div>
                )}
                <div className="flex gap-3 text-xs text-gray-600 py-0.5">
                  <span className="font-semibold w-20 flex-shrink-0">Status</span>
                  <span className="font-mono">{task.status || '—'}</span>
                </div>
                <div className="flex gap-3 text-xs text-gray-600 py-0.5">
                  <span className="font-semibold w-20 flex-shrink-0">Lang</span>
                  <span className="font-mono">{langDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
  const [ openMenuId, setOpenMenuId ] = useState<string | null>(null);
  const [ tasksPanelWidth, setTasksPanelWidth ] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('graffiticode:compiles:tasksPanelWidth') : null;
    return saved ? parseInt(saved) : 210;
  });
  const [ dateFilter, setDateFilter ] = useState<TasksDateFilter>(() => {
    if (typeof window === 'undefined') return DEFAULT_TASKS_DATE_FILTER;
    try {
      const saved = localStorage.getItem('graffiticode:compiles:dateFilter');
      if (!saved) return DEFAULT_TASKS_DATE_FILTER;
      const parsed = JSON.parse(saved);
      const from = typeof parsed?.from === 'number' && Number.isFinite(parsed.from) ? parsed.from : null;
      const to = typeof parsed?.to === 'number' && Number.isFinite(parsed.to) ? parsed.to : null;
      return { from, to };
    } catch {
      return DEFAULT_TASKS_DATE_FILTER;
    }
  });
  const [ langFilter, setLangFilter ] = useState<TasksLangFilter>(() => {
    if (typeof window === 'undefined') return DEFAULT_TASKS_LANG_FILTER;
    const saved = localStorage.getItem('graffiticode:compiles:langFilter');
    return saved ? { sequence: saved } : DEFAULT_TASKS_LANG_FILTER;
  });
  const [ taskLangsMap, setTaskLangsMap ] = useState<Record<string, string[]>>({});
  const taskItemsRef = useRef({});
  const tasksListRef = useRef(null);
  const tasksUlRef = useRef<HTMLUListElement>(null);

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
          status: compile.status,
          lang: compile.lang,
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

  // Auto-focus the tasks list for arrow key navigation
  useEffect(() => {
    if (taskIds.length > 0 && tasksUlRef.current) {
      tasksUlRef.current.focus();
    }
  }, [taskIds.length > 0]);

  // Persist filter state
  const updateDateFilter = useCallback((next: TasksDateFilter) => {
    setDateFilter(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:compiles:dateFilter', JSON.stringify(next));
    }
  }, []);

  const updateLangFilter = useCallback((next: TasksLangFilter) => {
    setLangFilter(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:compiles:langFilter', next.sequence);
    }
  }, []);

  // Eagerly fetch lang sequences for compound tasks so the lang filter
  // can match against the full chain. Single-segment tasks already have
  // their lang on the compile record.
  useEffect(() => {
    if (!user || !taskIds.length) return;
    const compoundIds = taskIds
      .map(t => t.id)
      .filter(id => typeof id === 'string' && id.includes('+') && !taskLangsMap[id]);
    if (!compoundIds.length) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        compoundIds.map(id =>
          getTaskLangs({ user, id })
            .then(r => ({ id, langs: r && Array.isArray(r.langs) ? r.langs : null }))
            .catch(() => ({ id, langs: null }))
        )
      );
      if (cancelled) return;
      setTaskLangsMap(prev => {
        const next = { ...prev };
        for (const { id, langs } of results) {
          if (langs) next[id] = langs;
        }
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [user, taskIds]);

  // Compute the filtered task list for display + navigation.
  const langPattern = (langFilter.sequence || '').trim();
  const filteredTaskIds = taskIds.filter((task) => {
    const ts = +task.timestamp || 0;
    if (dateFilter.from !== null && ts < dateFilter.from) return false;
    if (dateFilter.to !== null && ts > dateFilter.to) return false;
    if (!langPattern) return true;
    const isCompound = typeof task.id === 'string' && task.id.includes('+');
    const langs: string[] | null = isCompound
      ? (taskLangsMap[task.id] || null)
      : (task.lang ? [task.lang] : null);
    if (langs === null) {
      // Langs for this compound task haven't loaded yet — keep it visible
      // so we don't drop matching tasks while fetches are in flight.
      return true;
    }
    return matchesLangPattern(langs, langPattern);
  });

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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <SignIn
          label="Sign in to continue"
        />
        <p className="mt-4 text-sm text-gray-600 text-center max-w-sm">
          New here? Create a free account by signing in with an Ethereum wallet. No blockchain fees required.
        </p>
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
          "flex-none border border-gray-200 rounded-none",
          isTasksPanelCollapsed ? "h-10" : "h-[calc(100vh-90px)]"
        )}
          style={{ width: isTasksPanelCollapsed ? 40 : tasksPanelWidth }}
        >
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <div className={classNames(
              "flex items-center gap-2",
              isTasksPanelCollapsed && "hidden"
            )}>
              <span className="text-sm font-medium text-gray-700">Tasks</span>
              <TasksHeaderMenu
                dateFilter={dateFilter}
                setDateFilter={updateDateFilter}
                langFilter={langFilter}
                setLangFilter={updateLangFilter}
              />
            </div>
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
              ) : filteredTaskIds.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-gray-500">
                    {taskIds.length === 0 ? 'No tasks found' : 'No tasks match filters'}
                  </div>
                </div>
              ) : (
                <nav className="flex flex-1 flex-col bg-gray-100 pt-1 pr-2">
                  <ul
                    ref={tasksUlRef}
                    role="list"
                    className="space-y-1 font-mono focus:outline-none"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (filteredTaskIds.length === 0) return;
                        const currentIndex = filteredTaskIds.findIndex(t => t.id === selectedTaskId);
                        const nextIndex = currentIndex < 0
                          ? 0
                          : (currentIndex + (e.key === 'ArrowUp' ? -1 : 1) + filteredTaskIds.length) % filteredTaskIds.length;
                        const nextTask = filteredTaskIds[nextIndex];
                        handleSelectTask(nextTask.id);
                        taskItemsRef.current[nextTask.id]?.scrollIntoView({ block: 'nearest' });
                      }
                    }}
                  >
                    {filteredTaskIds.map((task) => (
                      <li key={task.id} ref={el => { taskItemsRef.current[task.id] = el; }}>
                        <div
                          className={classNames(
                            task.current ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200',
                            "flex flex-row justify-between pr-2"
                          )}
                          onMouseOver={() => {
                            if (showId !== task.id) {
                              setShowId(task.id);
                            }
                          }}
                        >
                          <button
                            onClick={() => { handleSelectTask(task.id); tasksUlRef.current?.focus(); }}
                            className="flex items-center rounded-none py-0 pr-2 pl-4 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900 flex-1 min-w-0 text-left truncate focus:outline-none"
                          >
                            {elideCompoundId(task.id)}
                          </button>
                          {(task.id === showId || openMenuId === task.id) && (
                            <TaskMenu
                              task={task}
                              user={user}
                              isOpen={openMenuId === task.id}
                              onOpen={() => setOpenMenuId(task.id)}
                              onClose={() => setOpenMenuId(null)}
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
        {/* Resize bar for Tasks panel */}
        {!isTasksPanelCollapsed ? (
          <div
            className="flex-none w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize transition-colors relative mx-px"
            onPointerDown={(e) => {
              e.preventDefault();
              let isDragging = false;
              let holdTimeout = null;

              const target = e.currentTarget;
              target.setPointerCapture(e.pointerId);

              const startX = e.clientX;
              const startWidth = tasksPanelWidth;

              const handlePointerMove = (moveEvent) => {
                if (!isDragging) return;

                const delta = moveEvent.clientX - startX;
                const newWidth = Math.max(120, Math.min(400, startWidth + delta));

                setTasksPanelWidth(newWidth);

                if (typeof window !== 'undefined') {
                  localStorage.setItem('graffiticode:compiles:tasksPanelWidth', newWidth.toString());
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

              target.addEventListener('pointermove', handlePointerMove);
              target.addEventListener('pointerup', handlePointerUp);
              target.addEventListener('pointercancel', handlePointerUp);

              holdTimeout = setTimeout(() => {
                isDragging = true;
              }, 200);
            }}
            title="Drag to resize horizontally"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="h-16 w-1 bg-gray-400 rounded-full opacity-50"></div>
            </div>
          </div>
        ) : (
          <div className="flex-none w-1 mx-px" />
        )}
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
                  <div className="h-full overflow-auto">
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
                  className="h-full w-full"
                  setData={() => {}}
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
