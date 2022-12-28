/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'



const CLEAR = "#FEFEFE";
const AMBER = "#E7B416";
const RED = "#D75A5A"; //"#CC3232";
const GREEN = "#2DC937";
const BLUE = "#5FCEFF"; //"#45C6FF"; //"#12B6FF"; //"#009ADE";
const PURPLE = "#C98ED0"; //"#C07CC9"; //"#AF58BA";
const GRAY = "#BEC9CF"; //"#A0B1BA";
const BLACK = "#000000"; //"#A0B1BA";

export const marks = [
  {id: 1, val: GREEN},
  {id: 2, val: AMBER},
  {id: 3, val: RED},
  {id: 4, val: BLUE},
  {id: 5, val: PURPLE},
  {id: 6, val: GRAY},
  {id: 7, val: BLACK},
];

export default function MarkSelector({mark, setMark, bgColor}) {
  const [selected, setSelected] = useState(marks[0])
  bgColor = "bg-white"
  return (
      <Listbox value={selected} onChange={setSelected}>
      <div className={"relative w-20 " + bgColor}>
          <Listbox.Button className="relative w-full cursor-default rounded-none py-2 pl-3 shadow-md ring-1 ring-gray-500 focus:outline-none focus-visible:border-gray-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-300 sm:text-sm">
            <span className="block truncate">
              <svg width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                <rect id="mark" width="100%" height="100%" fill={selected?.val}/>
              </svg>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="left-0 absolute mt-1 max-h-60 w-full overflow-auto rounded-none bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {marks.map((mark, index) => (
                <Listbox.Option
                  key={index}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-3 pr-4 ${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'
                    }`
                  }
                  value={mark}
                >
                  <span>
                    <svg width="24" height="22" xmlns="http://www.w3.org/2000/svg">
                      <rect id="mark-rect" width="100%" height="100%" fill={mark?.val}/>
                    </svg>
                  </span>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
        </Listbox>
  )
}
