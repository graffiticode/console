import { useState, useEffect } from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const tabs = [
  { name: 'Code', current: false },
  { name: 'Data', current: true },
];

export function CompilerTabs({ tab: tabName, setTab }) {
  const handleClick = (name) => {
    tabs.find(t => t.current).current = false;
    tabs.find(t => t.name === name).current = true;
    setTab(name);
  };

  return (
    <div>
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
        <div className="pt-1">
          <nav className="-mb-px flex border-b text-xs" aria-label="Tabs">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                onClick={() => handleClick(tab.name)}
                className={classNames(
                  tab.name === tabName
                    ? 'border-gray-500 text-gray-700 font-semibold'
                    : 'border-transparent font-light text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b py-2 mb-0 mx-2 px-1 cursor-pointer'
                )}
                aria-current={tab.current ? 'page' : undefined}
              >
                {tab.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
