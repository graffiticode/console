import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import useSWR from "swr";
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { getAccessToken, generateCode, loadItems, createItem, updateItem, getData, getItem, compile } from '../utils/swr/fetchers';
import useGraffiticodeAuth from "../hooks/use-graffiticode-auth";
import FormView from "./FormView";
import { Disclosure } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import ItemsNav from "./ItemsNav";
import { PlusIcon } from '@heroicons/react/20/solid';

const parseId = id => {
  if (!id) {
    return {taskId: ""};
  }
  const parts = id.split("+");
  return {
    taskId: parts[0],
    dataId: parts.length > 1 && parts.slice(1).join("+"),
  };
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
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

export default function Gallery({ lang, mark, hideItemsNav = false, itemId: initialItemId = null }) {
  const [ hideEditor, setHideEditor ] = useState(false);
  const [ formHeight, setFormHeight ] = useState(350);
  const [ taskId, setTaskId ] = useState("");
  const [ isCreatingItem, setIsCreatingItem ] = useState(false);

  // Save the current taskId to localStorage when it changes so it can be used in Tasks view
  useEffect(() => {
    if (taskId && typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:selected:taskId', taskId);
    }
  }, [taskId]);
  const [ isItemsPanelCollapsed, setIsItemsPanelCollapsed ] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:itemsPanelCollapsed') === 'true'
  );
  const [ isEditorPanelCollapsed, setIsEditorPanelCollapsed ] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:editorPanelCollapsed') === 'true'
  );
  const [ isFormPanelCollapsed, setIsFormPanelCollapsed ] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:formPanelCollapsed') === 'true'
  );
  const [ items, setItems ] = useState([]);
  const [ selectedItemId, setSelectedItemId ] = useState("");
  const [ editorCode, setEditorCode ] = useState("");
  const [ editorHelp, setEditorHelp ] = useState([]);
  const [ formData, setFormData ] = useState({});
  const [ editorPanelWidth, setEditorPanelWidth ] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('graffiticode:editorPanelWidth') : null;
    return saved ? parseFloat(saved) : 50;
  }); // Percentage width for desktop
  const [ previewPanelHeight, setPreviewPanelHeight ] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('graffiticode:previewPanelHeight') : null;
    return saved ? parseFloat(saved) : 50;
  }); // Percentage height for mobile
  const { user } = useGraffiticodeAuth();
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const editorRef = useRef<any>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect if we're in editor mode
  const isEditorMode = useRef(false);
  const editorOrigin = useRef(null);

  // Track current viewport type to detect changes
  const [ currentViewport, setCurrentViewport ] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'desktop' : 'mobile'
  );

  // Handle viewport changes
  useEffect(() => {
    const handleViewportChange = () => {
      const newViewport = window.innerWidth >= 1024 ? 'desktop' : 'mobile';
      if (newViewport !== currentViewport) {
        setCurrentViewport(newViewport);
        // Only restore saved sizes for the new viewport if panels are at default sizes
        // This prevents resizing when taskId changes or other state updates occur
        if (newViewport === 'desktop') {
          // Only restore if editor panel is at default 50% width
          if (editorPanelWidth === 50) {
            const saved = localStorage.getItem('graffiticode:editorPanelWidth');
            if (saved) setEditorPanelWidth(parseFloat(saved));
          }
        } else {
          // Only restore if preview panel is at default 50% height
          if (previewPanelHeight === 50) {
            const saved = localStorage.getItem('graffiticode:previewPanelHeight');
            if (saved) setPreviewPanelHeight(parseFloat(saved));
          }
        }
      }
    };

    window.addEventListener('resize', handleViewportChange);
    return () => window.removeEventListener('resize', handleViewportChange);
  }, [currentViewport, editorPanelWidth, previewPanelHeight]);

  useEffect(() => {
    // Check if we were opened from editor (has opener and sessionStorage flag)
    if (typeof window !== 'undefined' && window.opener) {
      const editorData = sessionStorage.getItem('graffiticode:editor');
      if (editorData) {
        try {
          const data = JSON.parse(editorData);
          isEditorMode.current = true;
          editorOrigin.current = data.origin;
        } catch (e) {
          console.error('Failed to parse editor data:', e);
        }
      }

      // Also check URL parameters for editor mode
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('editorMode') === 'true' && urlParams.get('editorOrigin')) {
        isEditorMode.current = true;
        editorOrigin.current = urlParams.get('editorOrigin');
        console.log('Editor mode enabled via URL parameters, origin:', editorOrigin.current);
      }
    }
  }, []);
  // Load items from the API only once on initialization
  const { data: loadedItems, mutate, isLoading: isLoadingItems } = useSWR(
    user && lang && mark && !hideItemsNav ? `items-${user.uid}-${lang}-${mark.id}` : null,
    () => loadItems({ user, lang, mark: mark.id }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Load a single item directly when initialItemId is provided (e.g., from URL)
  const { data: directItem, isLoading: isLoadingDirectItem } = useSWR(
    user && initialItemId ? `item-${user.uid}-${initialItemId}` : null,
    () => getItem({ user, id: initialItemId }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Clear items and selected item when user changes to prevent stale state
  useEffect(() => {
    if (user?.uid) {
      setItems([]);
      setSelectedItemId(null);
      setTaskId(null);
      setEditorCode("");
      setEditorHelp([]);
    }
  }, [user?.uid]);

  // Handle directly loaded item (from URL initialItemId)
  useEffect(() => {
    if (directItem && initialItemId) {
      // Set this item as selected and load its content
      setItems([directItem]);
      setSelectedItemId(directItem.id);
      setTaskId(directItem.taskId);
      setEditorCode(directItem.code || "");
      setEditorHelp(typeof directItem.help === "string" ? JSON.parse(directItem.help || "[]") : (directItem.help || []));
    }
  }, [directItem, initialItemId]);

  useEffect(() => {
    // Skip if we already loaded a direct item
    if (directItem && initialItemId) return;

    if (loadedItems && loadedItems.length > 0) {
      setItems(loadedItems);
      // Priority: 1) initialItemId prop, 2) localStorage, 3) first item
      const targetItemId = initialItemId ||
        (typeof window !== 'undefined' ? localStorage.getItem(`graffiticode:selected:itemId`) : null);
      if (targetItemId) {
        const matchingItem = loadedItems.find(item => item.id === targetItemId);
        if (matchingItem) {
          setSelectedItemId(matchingItem.id);
          setTaskId(matchingItem.taskId);
          setEditorCode(matchingItem.code || "");
          setEditorHelp(typeof matchingItem.help === "string" ? JSON.parse(matchingItem.help || "[]") : (matchingItem.help || []));
          return;
        }
      }
      // Default to the first item if no saved selection
      if (loadedItems[0]) {
        setSelectedItemId(loadedItems[0].id);
        setTaskId(loadedItems[0].taskId);
        setEditorCode(loadedItems[0].code || "");
        setEditorHelp(typeof loadedItems[0].help === "string" ? JSON.parse(loadedItems[0].help || "[]") : (loadedItems[0].help || []));
      }
    } else if (!initialItemId) {
      setItems([]);
      setSelectedItemId("");
    }
  }, [loadedItems, initialItemId, directItem]);

  const toggleItemsPanel = useCallback(() => {
    const newState = !isItemsPanelCollapsed;
    setIsItemsPanelCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:itemsPanelCollapsed', newState.toString());
    }
  }, [isItemsPanelCollapsed]);

  const toggleEditorPanel = useCallback(() => {
    const newState = !isEditorPanelCollapsed;
    setIsEditorPanelCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:editorPanelCollapsed', newState.toString());
    }
  }, [isEditorPanelCollapsed]);

  const toggleFormPanel = useCallback(() => {
    const newState = !isFormPanelCollapsed;
    setIsFormPanelCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('graffiticode:formPanelCollapsed', newState.toString());
    }
  }, [isFormPanelCollapsed]);

  const handleCreateItem = async () => {
    if (isCreatingItem) return;
    setIsCreatingItem(true);
    try {
      const newItem = await createItem({
        user,
        lang,
        name: "unnamed",
        taskId: null,
        mark: mark?.id || 1,
        help: "[]",
        code: "",
        isPublic: false
      });
      if (newItem) {
        setItems(prevItems => [newItem, ...prevItems]);
        setSelectedItemId(newItem.id);
        setTaskId(newItem.taskId);
        setEditorCode(newItem.code || "");
        setEditorHelp(typeof newItem.help === "string" ? JSON.parse(newItem.help || "[]") : (newItem.help || []));
        if (typeof window !== 'undefined') {
          localStorage.setItem(`graffiticode:selected:itemId`, newItem.id);
        }
      }
    } catch (error) {
      console.error("Failed to create item:", error);
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleUpdateItem = async ({ itemId, name, taskId, mark: newMark, code, help, isPublic }) => {
    // Prevent updates with stale item IDs - check both items array and ensure we have a valid user
    const currentItem = items.find(item => item.id === itemId);
    if (!itemId || !currentItem || !user?.uid) {
      return;
    }

    // Additional check: ensure the current items were loaded for the current user context
    // by checking that we have items loaded and they are for the current language/mark
    if (items.length === 0) {
      return;
    }

    // Check if we're changing the mark
    const isMarkChanging = newMark !== undefined && currentItem && currentItem.mark !== newMark;
    const currentFilterMark = mark?.id;

    // Then update backend
    try {
      const result = await updateItem({ user, id: itemId, name, taskId, mark: newMark, code, help, isPublic });

      // If mark changed and this is the selected item, we need to reload the task data
      if (isMarkChanging && selectedItemId === itemId && result && result.taskId) {
        // Update the taskId which will trigger the editor to reload
        setTaskId(result.taskId);
        // Update editor content with the new task's code and help
        if (result.code !== undefined) {
          setEditorCode(result.code);
        }
        if (result.help !== undefined) {
          setEditorHelp(typeof result.help === "string" ? JSON.parse(result.help || "[]") : (result.help || []));
        }
      }

      // Update local state after successful backend update
      setItems(prevItems => {
        // If mark is changing and we're filtering by mark, remove the item
        if (isMarkChanging && currentFilterMark && newMark !== currentFilterMark) {
          return prevItems.filter(item => item.id !== itemId);
        }
        // Otherwise, update the item in place with the result from backend
        const updated = prevItems.map(item =>
          item.id === itemId
            ? {
                ...item,
                ...result,  // Use the full result from backend
              }
            : item
        );
        return updated;
      });

      // If we removed the current selected item, select the first item
      if (isMarkChanging && currentFilterMark && newMark !== currentFilterMark && selectedItemId === itemId) {
        const remainingItems = items.filter(item => item.id !== itemId);
        if (remainingItems.length > 0) {
          setSelectedItemId(remainingItems[0].id);
          setTaskId(remainingItems[0].taskId);
          setEditorCode(remainingItems[0].code || "");
          setEditorHelp(typeof remainingItems[0].help === "string" ? JSON.parse(remainingItems[0].help || "[]") : (remainingItems[0].help || []));
        } else {
          setSelectedItemId("");
          setTaskId("");
          setEditorCode("");
          setEditorHelp([]);
        }
      }
    } catch (error) {
      console.error("Failed to update item:", error);
      // Optionally revert local state on error
      // setItems(prevItems);
    }
  };

  const handleSelectItem = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItemId(item.id);
      setTaskId(item.taskId);
      setEditorCode(item.code || "");
      setEditorHelp(typeof item.help === "string" ? JSON.parse(item.help || "[]") : (item.help || []));
      if (typeof window !== 'undefined') {
        localStorage.setItem(`graffiticode:selected:itemId`, item.id);
      }
    }
  };

  // Handle loading a task from help panel (when user clicks a previous request)
  const handleLoadTaskFromHelp = async (taskIdToLoad) => {
    if (!taskIdToLoad || !user) return;

    try {
      // Import getTask from fetchers
      const { getTask } = await import('../utils/swr/fetchers');

      // Load the task data
      const taskData = await getTask({ user, id: taskIdToLoad });

      if (taskData) {
        // Update the taskId which updates the preview
        setTaskId(taskIdToLoad);

        // Update the code and help panels
        if (taskData.code !== undefined) {
          setEditorCode(taskData.code);
        }

        // Parse help if it's a string
        if (taskData.help !== undefined) {
          const helpData = typeof taskData.help === "string" ?
            JSON.parse(taskData.help || "[]") :
            (taskData.help || []);
          setEditorHelp(helpData);
        }
      }
    } catch (error) {
      console.error('Failed to load task from help panel:', error);
    }
  };

  // Update the selected item's state when editor changes
  useEffect(() => {
    // Only proceed if we have a valid selectedItemId and loaded items for current user
    if (selectedItemId && items.length > 0 && user?.uid) {
      const selectedItem = items.find(item => item.id === selectedItemId);
      // Double-check the item exists and hasn't been loaded from a different user
      if (selectedItem) {
        // Check if any values have changed
        const hasChanges =
          (taskId && selectedItem.taskId !== taskId) ||
          (editorCode !== undefined && selectedItem.code !== editorCode) ||
          (editorHelp !== undefined && JSON.stringify(selectedItem.help) !== JSON.stringify(editorHelp));
        if (hasChanges) {
          handleUpdateItem({
            itemId: selectedItemId,
            name: selectedItem.name,
            taskId: taskId || selectedItem.taskId,
            mark: selectedItem.mark,
            code: editorCode,
            help: JSON.stringify(editorHelp),
            isPublic: selectedItem.isPublic
          });
        }
      } else {
        // Selected item doesn't exist in current items - clear it
        setSelectedItemId(null);
      }
    }
  }, [taskId, editorCode, editorHelp, selectedItemId, user?.uid]);

  // Send compiled data updates to editor when taskId changes
  useEffect(() => {
    console.log('Data update effect - isEditorMode:', isEditorMode.current, 'editorOrigin:', editorOrigin.current, 'hasOpener:', !!window.opener, 'taskId:', taskId);
    if (isEditorMode.current && editorOrigin.current && window.opener && taskId) {
      console.log('Sending data-updated message for taskId:', taskId, 'selectedItemId:', selectedItemId);
      // Fetch the compiled data for this taskId
      compile({ user, id: taskId, data: formData }).then(compiledData => {
        const message = {
          type: 'data-updated',
          itemId: selectedItemId,
          data: compiledData
        };
        console.log('Posting data-updated message:', message, 'to origin:', editorOrigin.current);
        window.opener.postMessage(message, editorOrigin.current);
      }).catch(err => {
        console.error('Failed to fetch compiled data:', err);
      });
    }
  }, [taskId, selectedItemId, user, formData]);

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
        {/* ItemsNav panel with collapse functionality */}
        {!hideItemsNav && (
        <>
        <div className={classNames(
          "flex-none transition-all duration-300 border border-gray-200 rounded-none mr-1",
          isItemsPanelCollapsed ? "w-10" : "w-[210px]",
          isItemsPanelCollapsed ? "h-10" : "h-[calc(100vh-90px)]"
        )}>
          <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <span className={classNames(
              "text-sm font-medium text-gray-700",
              isItemsPanelCollapsed && "hidden"
            )}>Items</span>
            <button
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              title={isItemsPanelCollapsed ? "Expand items panel" : "Collapse items panel"}
              onClick={toggleItemsPanel}>
              {isItemsPanelCollapsed ? (
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
          {!isItemsPanelCollapsed && (
            <div className="mt-2">
              <button
                onClick={handleCreateItem}
                disabled={isCreatingItem}
                className="flex items-center justify-start w-full py-1 px-3 hover:bg-green-50 disabled:opacity-50 transition-colors leading-6"
                title="Create new item"
              >
                <PlusIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
          {!isItemsPanelCollapsed && (
            <div className="h-[calc(100%-84px)] overflow-auto">
              {isLoadingItems ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <ItemsNav
                  items={items}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onUpdateItem={handleUpdateItem}
                  onRefresh={() => mutate()}
                />
              )}
            </div>
          )}
        </div>
        {/* Spacer between ItemsNav and editor panels */}
        <div className="w-1 ml-1" />
        </>
        )}
        <div className="flex flex-col grow overflow-hidden">
          <div
               ref={containerRef}
               className={classNames(
               hideEditor ? "block" : "flex flex-col lg:flex-row",
               "gap-4 lg:gap-0",
               "w-full",
               "h-[calc(100vh-90px)]",
               "overflow-hidden"
               )}>
            <div
              ref={editorPanelRef}
              className={classNames(
                "relative ring-0 border border-gray-200 rounded-none",
                "order-2 lg:order-1",
                isEditorPanelCollapsed ? "h-10" : "lg:h-full",
                !isEditorPanelCollapsed && "lg:min-h-[300px]",
                !isEditorPanelCollapsed && !isFormPanelCollapsed && "overflow-auto"
              )}
              style={{
                width: isEditorPanelCollapsed ? '40px' :
                       isFormPanelCollapsed ? 'calc(100% - 16px)' :
                       window.innerWidth >= 1024 ? `${editorPanelWidth}%` : '100%',
                height: isEditorPanelCollapsed ? '40px' :
                        window.innerWidth < 1024 && isFormPanelCollapsed ? 'calc(100% - 56px)' :
                        window.innerWidth < 1024 && !isFormPanelCollapsed ? `calc(${100 - previewPanelHeight}% - 16px)` : undefined,
                minHeight: !isEditorPanelCollapsed && window.innerWidth < 1024 && !isFormPanelCollapsed ? '100px' : undefined,
                minWidth: !isEditorPanelCollapsed && !isFormPanelCollapsed && window.innerWidth >= 1024 ? '200px' : undefined,
                maxWidth: !isEditorPanelCollapsed && !isFormPanelCollapsed && window.innerWidth >= 1024 ?
                  `calc(80% - ${!hideItemsNav ? (isItemsPanelCollapsed ? 25 : 110) : 0}px)` : undefined
              }}
            >
              <div className="flex justify-between items-center p-2 border-b border-gray-200">
                <span className={classNames(
                  "text-sm font-medium text-gray-700",
                  isEditorPanelCollapsed && "hidden"
                )}>Editor</span>
                <button
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  title={isEditorPanelCollapsed ? "Expand editor panel" : "Collapse editor panel"}
                  onClick={toggleEditorPanel}>
                  {isEditorPanelCollapsed ? (
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
              <div
                ref={editorRef}
                className={classNames(
                  isEditorPanelCollapsed && "hidden",
                  "overflow-hidden"
                )}
                style={{ height: 'calc(100% - 42px)' }}
              >
              <Editor
                accessToken={accessToken}
                taskId={taskId}
                lang={lang}
                mark={mark}
                setTaskId={setTaskId}
                onLoadTaskFromHelp={handleLoadTaskFromHelp}
                height="100%"
                onCodeChange={setEditorCode}
                onHelpChange={setEditorHelp}
                initialCode={editorCode}
                initialHelp={editorHelp}
              />
              </div>
            </div>
            {/* Vertical resize bar between editor and preview (desktop) */}
            {!isEditorPanelCollapsed && !isFormPanelCollapsed && (
              <div
                className="hidden lg:block w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize transition-colors relative lg:order-2 mx-1"
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

                // Calculate new width percentage for editor
                const minEditorWidth = 200;
                const minPreviewWidth = 200;
                const maxEditorX = containerWidth - minPreviewWidth;

                const newEditorX = Math.max(minEditorWidth, Math.min(maxEditorX, x));
                const editorWidthPercent = Math.min(80, Math.max(20, (newEditorX / containerWidth) * 100));

                setEditorPanelWidth(editorWidthPercent);

                if (typeof window !== 'undefined') {
                  localStorage.setItem('graffiticode:editorPanelWidth', editorWidthPercent.toString());
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
              >
                <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
                  <div className="h-16 w-1 bg-gray-400 rounded-full opacity-50"></div>
                </div>
              </div>
            )}
            {/* Spacer to maintain gap when drag bar is hidden */}
            {(isEditorPanelCollapsed || isFormPanelCollapsed) && (
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
                !isFormPanelCollapsed && !isEditorPanelCollapsed && "lg:resize-none",
                "flex flex-col"
              )}
              style={{
                width: isFormPanelCollapsed ? '40px' :
                       isEditorPanelCollapsed ? 'calc(100% - 56px)' :
                       window.innerWidth >= 1024 ? `calc(${100 - editorPanelWidth}% - 16px)` : '100%',
                height: isFormPanelCollapsed ? '40px' :
                        window.innerWidth < 1024 && isEditorPanelCollapsed ? 'calc(100% - 56px)' :
                        window.innerWidth < 1024 && !isEditorPanelCollapsed ? `${previewPanelHeight}%` : undefined,
                minWidth: !isFormPanelCollapsed && window.innerWidth >= 1024 ? '200px' : undefined,
                maxWidth: !isFormPanelCollapsed && window.innerWidth >= 1024 ?
                  `calc(100vw - ${!hideItemsNav ? (isItemsPanelCollapsed ? 50 : 220) : 0}px - 280px)` : undefined,
                minHeight: !isFormPanelCollapsed && window.innerWidth < 1024 && !isEditorPanelCollapsed ? '100px' : undefined,
                maxHeight: !isFormPanelCollapsed && window.innerWidth < 1024 && !isEditorPanelCollapsed ? 'calc(100% - 116px)' : undefined
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
                id={taskId}
                lang={lang}
                height="100%"
                className="h-full w-full p-2"
                setData={setFormData}
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
