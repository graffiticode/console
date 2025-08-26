import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import useSWR from "swr";
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { getAccessToken, generateCode, loadItems, createItem, updateItem, getData } from '../utils/swr/fetchers';
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

export default function Gallery({ lang, mark, hideItemsNav = false }) {
  const [ hideEditor, setHideEditor ] = useState(false);
  const [ formHeight, setFormHeight ] = useState(350);
  const [ taskId, setTaskId ] = useState("");
  const [ isCreatingItem, setIsCreatingItem ] = useState(false);
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
        // Restore saved sizes for the new viewport
        if (newViewport === 'desktop') {
          const saved = localStorage.getItem('graffiticode:editorPanelWidth');
          if (saved) setEditorPanelWidth(parseFloat(saved));
        } else {
          const saved = localStorage.getItem('graffiticode:previewPanelHeight');
          if (saved) setPreviewPanelHeight(parseFloat(saved));
        }
      }
    };

    window.addEventListener('resize', handleViewportChange);
    return () => window.removeEventListener('resize', handleViewportChange);
  }, [currentViewport]);

  // Handle panel resize
  useEffect(() => {
    const handleResize = () => {
      if (!editorPanelRef.current || !previewPanelRef.current || !containerRef.current) return;
      if (isEditorPanelCollapsed || isFormPanelCollapsed) return;

      const isDesktop = window.innerWidth >= 1024;

      if (isDesktop) {
        // Desktop: track horizontal resize of editor panel
        const containerWidth = containerRef.current.offsetWidth;
        const editorWidth = editorPanelRef.current.offsetWidth;
        const editorWidthPercent = (editorWidth / containerWidth) * 100;

        // Only update if the width has changed significantly (more than 1%)
        if (Math.abs(editorWidthPercent - editorPanelWidth) > 1) {
          setEditorPanelWidth(editorWidthPercent);
          localStorage.setItem('graffiticode:editorPanelWidth', editorWidthPercent.toString());
        }
      } else {
        // Mobile: track vertical resize of preview panel
        const containerHeight = containerRef.current.offsetHeight;
        const previewHeight = previewPanelRef.current.offsetHeight;
        const previewHeightPercent = (previewHeight / containerHeight) * 100;

        // Only update if the height has changed significantly (more than 1%)
        if (Math.abs(previewHeightPercent - previewPanelHeight) > 1) {
          setPreviewPanelHeight(previewHeightPercent);
          localStorage.setItem('graffiticode:previewPanelHeight', previewHeightPercent.toString());
        }
      }
    };

    // Create ResizeObserver to watch for panel resize
    const resizeObserver = new ResizeObserver(handleResize);

    if (window.innerWidth >= 1024 && editorPanelRef.current) {
      resizeObserver.observe(editorPanelRef.current);
    } else if (window.innerWidth < 1024 && previewPanelRef.current) {
      resizeObserver.observe(previewPanelRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [editorPanelWidth, previewPanelHeight, isEditorPanelCollapsed, isFormPanelCollapsed]);

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
  const { data: loadedItems } = useSWR(
    user && lang && mark ? `items-${lang}-${mark.id}` : null,
    () => loadItems({ user, lang, mark: mark.id }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (loadedItems && loadedItems.length > 0) {
      setItems(loadedItems);
      // Try to restore the previously selected item from localStorage
      const savedItemId = typeof window !== 'undefined' ? localStorage.getItem(`graffiticode:selected:itemId`) : null;
      if (savedItemId) {
        const matchingItem = loadedItems.find(item => item.id === savedItemId);
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
    } else {
      setItems([]);
      setSelectedItemId("");
    }
  }, [loadedItems]);

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
    // Check if we're changing the mark
    const currentItem = items.find(item => item.id === itemId);
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

  // Update the selected item's state when editor changes
  useEffect(() => {
    if (selectedItemId && items.length > 0) {
      const selectedItem = items.find(item => item.id === selectedItemId);
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
      }
    }
  }, [taskId, editorCode, editorHelp, selectedItemId]);

  // Send compiled data updates to editor when taskId changes
  useEffect(() => {
    console.log('Data update effect - isEditorMode:', isEditorMode.current, 'editorOrigin:', editorOrigin.current, 'hasOpener:', !!window.opener, 'taskId:', taskId);
    if (isEditorMode.current && editorOrigin.current && window.opener && taskId) {
      console.log('Sending data-updated message for taskId:', taskId, 'selectedItemId:', selectedItemId);
      // Fetch the compiled data for this taskId
      getData({ user, id: taskId }).then(compiledData => {
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
  }, [taskId, selectedItemId, user]);

  if (!user) {
    return (
      <div className="justify-center w-full">
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
        <div className={classNames(
          "flex-none transition-all duration-300 border border-gray-200 rounded-none mr-4",
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
              <ItemsNav
                items={items}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
                onUpdateItem={handleUpdateItem}
              />
            </div>
          )}
        </div>
        )}
        <div className="flex flex-col grow">
          <div
               ref={containerRef}
               className={classNames(
                 hideEditor ? "block" : "flex flex-col lg:flex-row",
                 "gap-4",
                 "w-full",
                 "h-[calc(100vh-90px)]"
               )}>
            <div
              ref={editorPanelRef}
              className={classNames(
                "relative ring-0 border border-gray-200 rounded-none",
                "order-2 lg:order-1",
                isEditorPanelCollapsed ? "h-10" : "lg:h-full",
                !isEditorPanelCollapsed && "lg:min-h-[300px]",
                !isEditorPanelCollapsed && !isFormPanelCollapsed && "lg:resize-x overflow-auto"
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
                maxWidth: !isEditorPanelCollapsed && !isFormPanelCollapsed && window.innerWidth >= 1024 ? '80%' : undefined
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
                height="100%"
                onCodeChange={setEditorCode}
                onHelpChange={setEditorHelp}
                initialCode={editorCode}
                initialHelp={editorHelp}
              />
              </div>
            </div>
            <div
              ref={previewPanelRef}
              className={classNames(
                "relative ring-0 border border-gray-300 rounded-none",
                "order-1 lg:order-2",
                isFormPanelCollapsed ? "h-10" : "lg:h-full",
                !isFormPanelCollapsed && "lg:min-h-[200px]",
                !isFormPanelCollapsed && "overflow-auto",
                !isFormPanelCollapsed && !isEditorPanelCollapsed && "resize-y lg:resize-none"
              )}
              style={{
                width: isFormPanelCollapsed ? '40px' :
                       isEditorPanelCollapsed ? 'calc(100% - 56px)' :
                       window.innerWidth >= 1024 ? `calc(${100 - editorPanelWidth}% - 16px)` : '100%',
                height: isFormPanelCollapsed ? '40px' :
                        window.innerWidth < 1024 && isEditorPanelCollapsed ? 'calc(100% - 56px)' :
                        window.innerWidth < 1024 && !isEditorPanelCollapsed ? `${previewPanelHeight}%` : undefined,
                minWidth: !isFormPanelCollapsed && window.innerWidth >= 1024 ? '200px' : undefined,
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
                "h-[calc(100%-42px)]"
              )}>
              <FormView
                key="form"
                id={taskId}
                lang={lang}
                height="100%"
                className="h-full overflow-auto p-2"
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
