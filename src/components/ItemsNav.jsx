import useSWR from "swr";
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState, useRef } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid';
import { PlusIcon } from '@heroicons/react/20/solid';
import { loadItems, createItem, updateItem } from '../utils/swr/fetchers';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function EllipsisMenu({ id, name, taskId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Position menu next to the button
  const positionMenu = () => {
    if (buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 280; // Fixed width of menu
      const menuHeight = menuRef.current.offsetHeight;

      // Check if there's enough space to the right
      const rightSpace = window.innerWidth - buttonRect.right;
      const leftSpace = buttonRect.left;

      let top = buttonRect.top;
      let left;

      // If menu would go below viewport bottom, position it above
      if (top + menuHeight > window.innerHeight) {
        top = Math.max(window.innerHeight - menuHeight - 10, 10);
      }

      // Determine horizontal position - prefer right side if there's space
      if (rightSpace >= menuWidth + 8) {
        // Position to the right of the button
        left = buttonRect.right + 8;
      } else if (leftSpace >= menuWidth + 8) {
        // Position to the left of the button
        left = buttonRect.left - menuWidth - 8;
      } else {
        // Not enough space on either side, center it
        left = Math.max(10, window.innerWidth / 2 - menuWidth / 2);
      }

      setMenuPosition({ top, left });
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      // Wait for menu to be rendered before positioning
      setTimeout(() => {
        positionMenu();
        // Re-check position after a short delay to account for content rendering
        setTimeout(positionMenu, 50);
      }, 0);
    }
  };

  // Reposition on window resize
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', positionMenu);
      return () => window.removeEventListener('resize', positionMenu);
    }
  }, [isOpen]);

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
          onClick={() => setIsOpen(false)}
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
              minHeight: '200px',
              overflow: 'auto'
            }}
          >
            <div className="p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Item Attributes</div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full rounded-none border border-gray-300 p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500"
                  placeholder={name}
                  onFocus={(e) => e.target.value = ''}
                  onBlur={(e) => onChange({id, name: e.target.value || name})}
                />
              </div>

              <div className="border-t border-gray-200 pt-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Task ID</label>
                <div
                  className="text-xs font-mono text-gray-600 hover:text-gray-900 cursor-pointer py-1.5 truncate"
                  onClick={(e) => {
                    navigator.clipboard.writeText(taskId);
                    const element = e.currentTarget;
                    element.innerHTML = `
                      <span class="text-green-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
                          <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                        </svg>
                        Copied!
                      </span>
                    `;
                    setTimeout(() => {
                      element.textContent = taskId;
                    }, 1000);
                  }}
                  title="Click to copy"
                >
                  {taskId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ItemsNav({ user, lang, setTaskId, currentTaskId, onCreateItem }) {
  const [ items, setItems ] = useState([]);
  const [ showId, setShowId ] = useState("");
  const [ selectedItemId, setSelectedItemId ] = useState("");
  const [ isCreatingItem, setIsCreatingItem ] = useState(false);
  // Load items from the API
  const { data: loadedItems, mutate: mutateItems } = useSWR(
    user && lang ? { user, lang } : null,
    loadItems
  );

  useEffect(() => {
    if (loadedItems && loadedItems.length > 0) {
      setItems(loadedItems);
      // Try to restore the previously selected item from localStorage
      const savedItemId = localStorage.getItem(`graffiticode:selected:itemId:${lang}`);
      if (savedItemId) {
        const matchingItem = loadedItems.find(item => item.id === savedItemId);
        if (matchingItem) {
          setSelectedItemId(matchingItem.id);
          setTaskId(matchingItem.taskId);
          return;
        }
      }
      // Default to the first item if no saved selection
      setSelectedItemId(loadedItems[0].id);
      setTaskId(loadedItems[0].taskId);
    } else {
      setItems([]);
      setSelectedItemId("");
    }
  }, [loadedItems, lang, setTaskId]);

  // Update item's taskId when currentTaskId changes
  useEffect(() => {
    if (selectedItemId && currentTaskId && items.length > 0) {
      const selectedItem = items.find(item => item.id === selectedItemId);
      if (selectedItem && selectedItem.taskId !== currentTaskId) {
        // Update the item with the new taskId
        updateItem({ user, id: selectedItemId, taskId: currentTaskId }).then(() => {
          mutateItems();
        });
      }
    }
  }, [currentTaskId, selectedItemId, items, user, mutateItems]);

  const handleCreateItem = async () => {
    if (isCreatingItem) return;
    setIsCreatingItem(true);
    try {
      const newItem = await createItem({ user, lang, name: "unnamed", taskId: null });
      if (newItem) {
        // Refresh the items list
        await mutateItems();
        // Select the new item
        setSelectedItemId(newItem.id);
        setTaskId(newItem.taskId);
        localStorage.setItem(`graffiticode:selected:itemId:${lang}`, newItem.id);
        // Call the parent's onCreateItem callback if provided
        if (onCreateItem) {
          onCreateItem(newItem);
        }
      }
    } catch (error) {
      console.error("Failed to create item:", error);
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleUpdateItem = async ({ id, name }) => {
    try {
      await updateItem({ user, id, name });
      await mutateItems();
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setTaskId(item.taskId);
    localStorage.setItem(`graffiticode:selected:itemId:${lang}`, item.id);
  };

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="w-64 flex flex-1 flex-col p-8 text-left place-content-left">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleCreateItem}
            disabled={isCreatingItem}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Create new item"
          >
            <PlusIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[210px] flex-none flex flex-col gap-y-2 overflow-visible bg-white pt-2 max-h-[calc(100vh-110px)] sticky top-[84px] z-40"
    >
      <div className="flex items-center justify-between px-2 pb-2">
        <button
          onClick={handleCreateItem}
          disabled={isCreatingItem}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 disabled:opacity-50"
          title="Create new item"
        >
          <PlusIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7 font-mono">
          <li className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <ul role="list" className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <div
                    className={classNames(
                      item.id === selectedItemId ? 'bg-gray-50' : 'hover:bg-gray-50',
                      "flex flex-row justify-between pr-2"
                    )}
                    onMouseOver={() => {
                      if (showId !== item.id) {
                        setShowId(item.id);
                      }
                    }}
                  >
                    <button
                      onClick={() => handleSelectItem(item)}
                      className={classNames(
                        item.id === selectedItemId ? 'bg-gray-50' : 'hover:bg-gray-50',
                        'block rounded-none py-1 pr-2 pl-4 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900 truncate max-w-[170px] text-left'
                      )}
                      title={item.name}
                    >
                      {item.name}
                    </button>
                    { item.id === showId &&
                      <EllipsisMenu
                        id={item.id}
                        name={item.name}
                        taskId={item.taskId}
                        onChange={handleUpdateItem}
                      /> || <div />
                    }
                  </div>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}
