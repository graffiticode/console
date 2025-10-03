import { useState, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { getUsers } from '../utils/swr/fetchers';

interface User {
  id: string;
  email?: string;
  name?: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface UserSearchComboboxProps {
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  placeholder?: string;
  currentUserId?: string;
}

export default function UserSearchCombobox({
  selectedUser,
  onSelectUser,
  placeholder = "Search by user ID...",
  currentUserId
}: UserSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load all users once on mount
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Filter users based on query (client-side search)
  // Always show all users when no query, filter when typing
  // Exclude current user from the list
  const filteredUsers = users.filter((user) => {
    // Exclude current user
    if (user.id === currentUserId) return false;

    if (query === '') return true; // Show all users when no query

    const searchQuery = query.toLowerCase();
    const userId = user.id.toLowerCase();
    const userEmail = (user.email || '').toLowerCase();
    const userName = (user.name || '').toLowerCase();

    return userId.includes(searchQuery) ||
           userEmail.includes(searchQuery) ||
           userName.includes(searchQuery);
  });

  const displayValue = (user: User | null) => {
    if (!user) return '';
    // Show ID and email if available
    if (user.email) {
      return `${user.id} (${user.email})`;
    }
    return user.id;
  };

  return (
    <Combobox as="div" value={selectedUser} onChange={(user) => {
      onSelectUser(user);
      setIsOpen(false);
    }}>
      <div className="relative" ref={containerRef}>
        <Combobox.Input
          className="w-full rounded-none border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          displayValue={displayValue}
          placeholder={placeholder}
        />
        <Combobox.Button
          className="absolute inset-y-0 right-0 flex items-center rounded-none px-2 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        {isOpen && (
          <Combobox.Options static className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-none bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {loading ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              {query !== '' ? 'No users found.' : 'No users available.'}
            </div>
          ) : (
            <>
              {query === '' && (
                <div className="relative cursor-default select-none py-1 px-4 text-xs text-gray-500 border-b">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} available
                </div>
              )}
              {filteredUsers.map((user) => (
                <Combobox.Option
                  key={user.id}
                  value={user}
                  onClick={() => {
                    setTimeout(() => setIsOpen(false), 0);
                  }}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-8 pr-4',
                      active ? 'bg-gray-600 text-white' : 'text-gray-900'
                    )
                  }
                >
                {({ active, selected }) => (
                  <>
                    <div className="flex flex-col">
                      <span className={classNames('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                        {user.id}
                      </span>
                      {user.email && (
                        <span className={classNames('block truncate text-xs', active ? 'text-gray-200' : 'text-gray-500')}>
                          {user.email}
                        </span>
                      )}
                    </div>
                    {selected && (
                      <span
                        className={classNames(
                          'absolute inset-y-0 left-0 flex items-center pl-1.5',
                          active ? 'text-white' : 'text-gray-600'
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
            </>
          )}
        </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}