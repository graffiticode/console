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
import { useState } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Combobox } from '@headlessui/react'

/*
function updateMarkAndLabel() {
  let state = +localStorage.getItem("markItem");
  let color;
  switch (state) {
  default:
    color = CLEAR;
    break;
  case 0:
    color = AMBER;
    break;
  case -1:
    color = RED;
    break;
  case 1:
    color = GREEN;
    break;
  case 2:
    color = BLUE;
    break;
  case 3:
    color = PURPLE;
    break;
  case 4:
    color = GREY;
    break;
  }
  let label = localStorage.getItem("labelItem");
  d3.select("#mark-circle").attr("fill", color);
  d3.select("#label-txt").node().value = label !== 'undefined' && label !== 'null' && label || '';
}
window.gcexports.updateMarkAndLabel = updateMarkAndLabel;
window.handleMark = (e) => {
  let mark = +localStorage.getItem("markItem");
  switch (mark) {
  case -1:  // red -> grey
    mark = 4;
    break;
  case 0:   // yellow -> red
    mark = -1;
    break;
  case 1:   // green -> blue
    mark = 2;
    break;
  case 2:   // blue -> purple
    mark = 3;
    break;
  case 3:   // purple -> yellow
    mark = 0; 
    break;
  case 4:   // grey -> clear
    mark = null;
    break;
  default:  // clear -> green
    mark = 1;
    break;
  }
  localStorage.setItem("markItem", mark);
  updateMarkAndLabel();
  putStat({mark: mark});
}
*/

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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MarkSelector({mark, setMark}) {
  const [query, setQuery] = useState('')
  const filteredMarks =
    query === ''
      ? marks
      : marks.filter((mark) => {
          return mark.val.toLowerCase().includes(query.toLowerCase())
        })

  return (
    <Combobox as="div" value={mark} onChange={setMark}>
      <Combobox.Label className="block text-sm font-medium text-gray-700">Assigned to</Combobox.Label>
      <div className="relative mt-1">
        <Combobox.Input
          className="w-full rounded-none border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:text-sm"
    onChange={(event) => setQuery(event.target.value)} />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-none px-2 focus:outline-none">
                      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <rect id="mark-circle" width="100%" height="100%" r="9" fill={mark.val}/>
                      </svg>
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        {filteredMarks.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-none bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredMarks.map((mark) => (
              <Combobox.Option
                key={mark.id}
                value={mark}
                className={({ active }) =>
                  classNames(
                    'relative cursor-default select-none py-2 pl-8 pr-4',
                    active ? 'bg-gray-600 text-white' : 'text-gray-900'
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span className={classNames('block truncate', selected && 'font-semibold')}>
                      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <rect id="mark-circle" width="100%" height="100%" r="9" fill={mark.val}/>
                      </svg>
                    </span>

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
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  )
}
