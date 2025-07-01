import { useState, useEffect } from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const tabs = [
  { name: 'Help', current: false },
  { name: 'Code', current: true },
  { name: 'Data', current: false },
];

export function Tabs({ tab: tabName, setTab, setSaving, setShowSaving, saveDisabled, setSaveDisabled, onCopy, showCopyButton }) {
  const [copied, setCopied] = useState(false);

  const handleClick = (name) => {
    tabs.find(t => t.current).current = false;
    tabs.find(t => t.name === name).current = true;
    setTab(name);

    // Enable the Save button when user clicks on the Help tab
    if (name === 'Help' && setSaveDisabled) {
      setSaveDisabled(false);
    }
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="pt-4">
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-none py-2 pl-3 pr-10 text-base focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
        >
          {tabs.map((tab) => (
            tab.name === tabName && tab.current === true &&
              <option key={tab.name}>{tab.name} selected</option> ||
              <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="">
          <nav className="-mb-px flex justify-between space-x-4 border-b text-xs pb-1" aria-label="Tabs">
            <div className="">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                onClick={() => handleClick(tab.name)}
                className={classNames(
                  tab.name === tabName
                    ? 'border-gray-500 text-gray-700 font-semibold'
                    : 'border-transparent font-light text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b py-1 mb-0 mx-2 px-1'
                )}
                aria-current={tab.current ? 'page' : undefined}
              >
                {tab.name}
              </a>
            ))}
            </div>
            <div className="flex items-center space-x-1">
              {showCopyButton && (
                <button
                  className="bg-white px-3 py-1 text-xs font-semibold text-gray-700 rounded-none hover:bg-gray-50 transition-colors"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <span className="text-green-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </span>
                  ) : 'Copy All'}
                </button>
              )}
              <button
                className={
                  classNames(
                    saveDisabled && "text-gray-400 font-medium" || "font-semibold text-gray-700 hover:bg-gray-50",
                    "bg-white px-4 transition-colors"
                  )
                }
                onClick={() => {
                  setSaving(true);
                  setTimeout(() => setShowSaving(true), 100);
                  setTimeout(() => setShowSaving(false), 1500);
                }}
                disabled={saveDisabled}
              >
                Save
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
