import { useState, useEffect } from 'react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const tabs = [
  { name: 'Help', current: false },
  { name: 'Code', current: true },
  { name: 'Data', current: false },
];

export function Tabs({ tab: tabName, setTab, setSaving, setShowSaving, saveDisabled, setSaveDisabled }) {
  const handleClick = (name) => {
    tabs.find(t => t.current).current = false;
    tabs.find(t => t.name === name).current = true;
    setTab(name);

    // Enable the Save button when user clicks on the Help tab
    if (name === 'Help' && setSaveDisabled) {
      setSaveDisabled(false);
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
            <button
              className={
                classNames(
                  saveDisabled && "text-gray-400 font-medium" || "font-semibold text-gray-700",
                  "bg-white px-4"
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
          </nav>
        </div>
      </div>
    </div>
  )
}
