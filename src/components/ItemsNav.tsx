import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid';
import { PlusIcon, ShareIcon, UserIcon } from '@heroicons/react/20/solid';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import MarkSelector, { marks } from './mark-selector';
import PublicToggle from './public-toggle';
import ShareItemDialog from './ShareItemDialog';
import { createItem } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function EllipsisMenu({ itemId, name, taskId, mark, isPublic, sharedWith = [], lang, help, code, onChange, onRefresh, isOpen, onOpen, onClose, onArrowKey }) {
  const { user } = useGraffiticodeAuth();
  const [nameValue, setNameValue] = useState(name);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const nameInputRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: -9999, left: -9999 });

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
      onClose();
    } else {
      onOpen();
      // Wait for menu to be rendered before positioning
      setTimeout(() => {
        positionMenu();
        // Re-check position after a short delay to account for content rendering
        setTimeout(positionMenu, 50);
      }, 0);
    }
  };

  // Update nameValue when name prop changes
  useEffect(() => {
    setNameValue(name);
  }, [name]);

  // Handle copying the item
  const handleCopyItem = async (e) => {
    e.stopPropagation();
    if (!user || isCopying) return;

    setIsCopying(true);
    try {
      const newItem = await createItem({
        user,
        lang,
        name: `Copy of ${name}`,
        taskId,
        mark,
        help,
        code,
        isPublic: false, // Don't copy public status
        app: 'console'
      });

      if (newItem && newItem.id) {
        // Close the menu
        onClose();
        // Refresh the items list
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to copy item:', error);
    } finally {
      setIsCopying(false);
    }
  };

  // Position menu and focus input when opened
  useEffect(() => {
    if (!isOpen) {
      setMenuPosition({ top: -9999, left: -9999 });
      return;
    }
    if (isOpen) {
      // Position menu after render
      setTimeout(() => {
        positionMenu();
        setTimeout(positionMenu, 50);
      }, 0);
      window.addEventListener('resize', positionMenu);
      // Set focus on the name input field when menu opens and select all text
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 100);
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
              minHeight: '240px',
              overflow: 'auto'
            }}
          >
            <div className="p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Item Attributes</div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  className="w-full rounded-none border border-gray-300 p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-500"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      onArrowKey(e.key === 'ArrowUp' ? -1 : 1);
                    }
                  }}
                  onBlur={(e) => {
                    const newName = e.target.value.trim();
                    if (newName && newName !== name) {
                      onChange({itemId, name: newName});
                    } else if (!newName) {
                      // Set to "unnamed" if field is cleared
                      onChange({itemId, name: "unnamed"});
                      setNameValue("unnamed");
                    }
                  }}
                />
              </div>

              <div className="mb-4">
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

              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mark</label>
                  <MarkSelector
                    mark={marks[(mark || 1) - 1]}
                    setMark={newMark => onChange({itemId, mark: newMark.id})}
                    dropUp={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Public (Caution)</label>
                  <PublicToggle
                    isPublic={isPublic || false}
                    setIsPublic={isPublic => onChange({itemId, isPublic})}
                    title="This item's task will be visible to anyone with the task ID. This cannot be undone."
                  />
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <button
                  onClick={handleCopyItem}
                  disabled={isCopying}
                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  <span>{isCopying ? 'Copying...' : 'Make a copy'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareDialog(true);
                    onClose();
                  }}
                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-none"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  <span>Share with user</span>
                  {sharedWith.length > 0 && (
                    <span className="ml-auto text-xs text-gray-500">
                      ({sharedWith.length})
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareItemDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        itemId={itemId}
        itemName={name}
        sharedWith={sharedWith}
        onShareSuccess={onRefresh}
      />
    </div>
  )
}

const ItemsNav = forwardRef(function ItemsNav({ items, selectedItemId, onSelectItem, onUpdateItem, onRefresh, onReorderItems, panelWidth = 210 }: any, ref) {
  const [ showId, setShowId ] = useState("");
  const [ openMenuId, setOpenMenuId ] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const listRef = useRef<HTMLUListElement>(null);

  // Focus the list when items load
  useEffect(() => {
    if (items.length > 0 && listRef.current) {
      listRef.current.focus();
    }
  }, [items.length > 0]);

  const navigateItems = (direction: number) => {
    if (!openMenuId) return;
    const currentIndex = items.findIndex(i => i.id === openMenuId);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < items.length) {
      const nextItem = items[nextIndex];
      setOpenMenuId(nextItem.id);
      setShowId(nextItem.id);
      onSelectItem(nextItem.id);
    }
  };

  useImperativeHandle(ref, () => ({
    get hasOpenMenu() { return !!openMenuId; },
    navigate: navigateItems,
  }));
  const dragItemRef = useRef<string | null>(null);
  const dragOverItemRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    dragItemRef.current = itemId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-gc-item-reorder', itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItemRef.current !== itemId) {
      dragOverItemRef.current = itemId;
      setDragOverId(itemId);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromId = dragItemRef.current;
    const toId = dragOverItemRef.current;
    if (fromId && toId && fromId !== toId && onReorderItems) {
      const fromIndex = items.findIndex(i => i.id === fromId);
      const toIndex = items.findIndex(i => i.id === toId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const reordered = [...items];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        onReorderItems(reordered);
      }
    }
    dragItemRef.current = null;
    dragOverItemRef.current = null;
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragItemRef.current = null;
    dragOverItemRef.current = null;
    setDragOverId(null);
  };

  return (
    <div className="w-full flex flex-col gap-y-1 bg-gray-100 pt-1 pr-2">
      <nav className="flex flex-1 flex-col">
        {items.length === 0 ? (
          <p className="text-xs text-gray-500 text-left pl-4 py-0 leading-6">No items found</p>
        ) : (
          <ul
            ref={listRef}
            role="list"
            className="space-y-1 font-mono focus:outline-none"
            tabIndex={0}
            onKeyDown={(e) => {
              if (openMenuId) return;
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                const currentIndex = items.findIndex(i => i.id === selectedItemId);
                const nextIndex = currentIndex + (e.key === 'ArrowUp' ? -1 : 1);
                if (nextIndex >= 0 && nextIndex < items.length) {
                  const nextItem = items[nextIndex];
                  onSelectItem(nextItem.id);
                  setShowId(nextItem.id);
                  itemRefs.current[nextItem.id]?.scrollIntoView({ block: 'nearest' });
                }
              }
            }}
          >
            {items.map((item) => (
              <li
                key={item.id}
                ref={(el) => { itemRefs.current[item.id] = el; }}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={dragOverId === item.id && dragItemRef.current !== item.id ? 'border-t-2 border-blue-400' : ''}
              >
                <div
                  className={classNames(
                    item.id === selectedItemId ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200',
                    'flex flex-row justify-between pr-2'
                  )}
                  onMouseOver={() => {
                    if (showId !== item.id) {
                      setShowId(item.id);
                    }
                  }}
                >
                  <button
                    onClick={() => onSelectItem(item.id)}
                    className="flex items-center rounded-none py-0 pr-2 pl-4 font-bold leading-6 font-mono text-xs text-gray-700 hover:text-gray-900 truncate text-left focus:outline-none"
                    style={{ maxWidth: panelWidth - 40 }}
                    title={item.name}
                  >
                    <span className="truncate">{item.name}</span>
                    {/* Show icon if item was shared with the user */}
                    {item.sharedFrom && (
                      <UserIcon className="h-3 w-3 ml-1 text-gray-400 flex-shrink-0" title={`From ${item.sharedFrom}`} />
                    )}
                  </button>
                  { item.id === showId &&
                    <EllipsisMenu
                      itemId={item.id}
                      name={item.name}
                      taskId={item.taskId}
                      mark={item.mark}
                      isPublic={item.isPublic}
                      sharedWith={item.sharedWith}
                      lang={item.lang}
                      help={item.help}
                      code={item.code}
                      onChange={onUpdateItem}
                      onRefresh={onRefresh}
                      isOpen={openMenuId === item.id}
                      onOpen={() => setOpenMenuId(item.id)}
                      onClose={() => setOpenMenuId(null)}
                      onArrowKey={navigateItems}
                    /> || <div />
                  }
                </div>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  )
});

export default ItemsNav;
