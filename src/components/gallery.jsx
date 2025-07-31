import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import useSWR from "swr";
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'
import Editor from './editor';
import SignIn from "./SignIn";
import { getAccessToken, generateCode, loadItems, createItem, updateItem } from '../utils/swr/fetchers';
import { isNonEmptyString } from "../utils";
import useArtcompilerAuth from "../hooks/use-artcompiler-auth";
import FormView from "./FormView.jsx";
import { Disclosure } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import ItemsNav from "./ItemsNav.jsx";
import { PlusIcon } from '@heroicons/react/20/solid';

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

// TODO:
// [ ] build list of items for the current lang and mark
// [ ] select the current item
// [ ] pass items to ItemsNav
// [ ] pass task to Editor
// [ ] on setId, update the current item's taskId
// [ ] move new item button to Gallery

export default function Gallery({ lang, mark }) {
  const [ hideEditor, setHideEditor ] = useState(false);
  const [ formHeight, setFormHeight ] = useState(350);
  const [ editorHeight, setEditorHeight ] = useState(600);
  const [ id, _setId ] = useState("");
  const [ isCreatingItem, setIsCreatingItem ] = useState(false);
  const [ isItemsPanelCollapsed, setIsItemsPanelCollapsed ] = useState(
    localStorage.getItem('graffiticode:itemsPanelCollapsed') === 'true'
  );
  const [ items, setItems ] = useState([]);
  const [ selectedItemId, setSelectedItemId ] = useState("");
  const setId = id => _setId(id);
  const { user } = useArtcompilerAuth();
  const { data: accessToken } = useSWR(
    user && { user } || null,
    getAccessToken,
  );
  const editorRef = useRef();
  // Load items from the API only once on initialization
  const { data: loadedItems } = useSWR(
    user && lang ? `items-${lang}` : null,
    () => loadItems({ user, lang }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (loadedItems && loadedItems.length > 0) {
      console.log(
        "Gallery()",
        "loadedItems=" + JSON.stringify(loadedItems, null, 2),
      );
      setItems(loadedItems);
      // Try to restore the previously selected item from localStorage
      const savedItemId = localStorage.getItem(`graffiticode:selected:itemId`);
      if (savedItemId) {
        const matchingItem = loadedItems.find(item => item.id === savedItemId);
        if (matchingItem) {
          console.log(
            "Gallery()",
            "matchingItem=" + JSON.stringify(matchingItem, null, 2),
          );
          setSelectedItemId(matchingItem.id);
          setId(matchingItem.taskId);
          return;
        }
      }
      // Default to the first item if no saved selection
      if (loadedItems[0]) {
        console.log(
          "Gallery()",
          "loadedItems[0]=" + JSON.stringify(loadedItems[0], null, 2),
        );
        setSelectedItemId(loadedItems[0].id);
        setId(loadedItems[0].taskId);
      }
    } else {
      setItems([]);
      setSelectedItemId("");
    }
  }, [loadedItems]);

  const toggleItemsPanel = useCallback(() => {
    const newState = !isItemsPanelCollapsed;
    setIsItemsPanelCollapsed(newState);
    localStorage.setItem('graffiticode:itemsPanelCollapsed', newState.toString());
  }, [isItemsPanelCollapsed]);

  const handleCreateItem = async () => {
    if (isCreatingItem) return;
    setIsCreatingItem(true);
    try {
      const newItem = await createItem({ user, lang, name: "unnamed", taskId: null });
      if (newItem) {
        // Add the new item to the beginning of the list
        setItems(prevItems => [newItem, ...prevItems]);
        // Select the new item
        setSelectedItemId(newItem.id);
        setId(newItem.taskId);
        localStorage.setItem(`graffiticode:selected:itemId`, newItem.id);
      }
    } catch (error) {
      console.error("Failed to create item:", error);
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleUpdateItem = async ({ id, name, taskId }) => {
    // Update local state first
    setItems(prevItems => {
      const updated = prevItems.map(item =>
        item.id === id
          ? { ...item, ...(name !== undefined && { name }), ...(taskId !== undefined && { taskId }) }
          : item
      );
      return updated;
    });
    // Then update backend
    try {
      const result = await updateItem({ user, id, name, taskId });
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
      setId(item.taskId);
      localStorage.setItem(`graffiticode:selected:itemId`, item.id);
    }
  };

  // Update the selected item's taskId when the id changes
  useEffect(() => {
    if (selectedItemId && id && items.length > 0) {
      const currentItem = items.find(item => item.id === selectedItemId);
      if (currentItem && currentItem.taskId !== id) {
        handleUpdateItem({ id: selectedItemId, taskId: id });
      }
    }
  }, [id, selectedItemId, items]); // Depend on id, selectedItemId, and items


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

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      {/* Main content area */}
      <div className="flex grow">
        {/* ItemsNav panel with collapse functionality */}
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
                    id={id}
                    lang={lang}
                    mark={mark}
                    setId={setId}
                    height={editorHeight}
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
