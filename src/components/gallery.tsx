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
  const [ editorHeight, setEditorHeight ] = useState(600);
  const [ taskId, setTaskId ] = useState("");
  const [ isCreatingItem, setIsCreatingItem ] = useState(false);
  const [ isItemsPanelCollapsed, setIsItemsPanelCollapsed ] = useState(
    typeof window !== 'undefined' && localStorage.getItem('graffiticode:itemsPanelCollapsed') === 'true'
  );
  const [ items, setItems ] = useState([]);
  const [ selectedItemId, setSelectedItemId ] = useState("");
  const [ editorCode, setEditorCode ] = useState("");
  const [ editorHelp, setEditorHelp ] = useState([]);
  const { user } = useGraffiticodeAuth();
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const editorRef = useRef<any>(null);

  // Detect if we're in editor mode
  const isEditorMode = useRef(false);
  const editorOrigin = useRef(null);

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
    if (isEditorMode.current && editorOrigin.current && window.opener && taskId) {
      // Fetch the compiled data for this taskId
      getData({ user, id: taskId }).then(compiledData => {
        window.opener.postMessage({
          type: 'data-updated',
          itemId: selectedItemId,
          data: compiledData
        }, editorOrigin.current);
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
      <div className="flex grow">
        {/* ItemsNav panel with collapse functionality */}
        {!hideItemsNav && (
        <div className={classNames(
          "flex-none h-full transition-all duration-300",
          isItemsPanelCollapsed ? "w-10" : "w-[210px]"
        )}>
          <div className="sticky top-[64px] bg-white z-40 pb-2">
            <div className="flex flex-col items-start">
              <button
                className="text-gray-400 hover:text-gray-500 focus:outline-none p-2"
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
              <button
                onClick={handleCreateItem}
                disabled={isCreatingItem}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 disabled:opacity-50 ml-2"
                title="Create new item"
              >
                <PlusIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
          {!isItemsPanelCollapsed && (
            <ItemsNav
              items={items}
              selectedItemId={selectedItemId}
              onSelectItem={handleSelectItem}
              onUpdateItem={handleUpdateItem}
            />
          )}
        </div>
        )}
        <div className="flex flex-col grow px-2" style={{paddingTop: "5px"}}>
          <div className={classNames(
                 hideEditor ? "block" : "flex flex-col lg:flex-row",
                 "gap-4 items-start"
               )}>
            <div
              ref={editorRef}
              className="relative ring-0 border border-gray-200 rounded-none mb-2 order-2 lg:order-1 resize-x"
              style={{
                height: "calc(100vh - 90px)",
                width: hideItemsNav ? "49%" : (isItemsPanelCollapsed ? "49%" : "48%"),
                minWidth: "300px",
                maxWidth: hideItemsNav ? "80%" : (isItemsPanelCollapsed ? "80%" : "70%")
              }}
            >
              <Editor
                accessToken={accessToken}
                taskId={taskId}
                lang={lang}
                mark={mark}
                setTaskId={setTaskId}
                height={editorHeight}
                onCodeChange={setEditorCode}
                onHelpChange={setEditorHelp}
                initialCode={editorCode}
                initialHelp={editorHelp}
              />
            </div>
            <div
              className="relative ring-0 border border-gray-300 rounded-none resize-both order-1 lg:order-2"
              style={{
                height: "calc(100vh - 90px)",
                width: hideItemsNav ? "49%" : (isItemsPanelCollapsed ? "49%" : "48%"),
                minHeight: "200px",
                maxHeight: "calc(100vh - 90px)",
                minWidth: "300px",
                maxWidth: hideItemsNav ? "80%" : (isItemsPanelCollapsed ? "80%" : "70%")
              }}
            >
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
  );
}
