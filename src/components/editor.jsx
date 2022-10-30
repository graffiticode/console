/*
  This example requires Tailwind CSS v2.0+ 
  
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
import { Fragment, useState, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CalendarIcon, PaperClipIcon, TagIcon, UserCircleIcon } from '@heroicons/react/24/solid'

import CodeMirror, { getCode } from './CodeMirror';
import { javascript } from "@codemirror/lang-javascript";
import { saveTask } from '../utils/redux/actions'
import { useDispatch } from 'react-redux'

const assignees = [
  { name: 'Unassigned', value: null },
  {
    name: 'Wade Cooper',
    value: 'wade-cooper',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  // More items...
]
const labels = [
  { name: 'Unlabelled', value: null },
  { name: 'Engineering', value: 'engineering' },
  // More items...
]
const dueDates = [
  { name: 'No due date', value: null },
  { name: 'Today', value: 'today' },
  // More items...
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

import { FaceSmileIcon as FaceSmileIconOutline } from '@heroicons/react/24/outline'
import {
  FaceFrownIcon,
  FaceSmileIcon as FaceSmileIconMini,
  FireIcon,
  HandThumbUpIcon,
  HeartIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
const moods = [
  { name: 'Excited', value: 'excited', icon: FireIcon, iconColor: 'text-white', bgColor: 'bg-red-500' },
  { name: 'Loved', value: 'loved', icon: HeartIcon, iconColor: 'text-white', bgColor: 'bg-pink-400' },
  { name: 'Happy', value: 'happy', icon: FaceSmileIconMini, iconColor: 'text-white', bgColor: 'bg-green-400' },
  { name: 'Sad', value: 'sad', icon: FaceFrownIcon, iconColor: 'text-white', bgColor: 'bg-yellow-400' },
  { name: 'Thumbsy', value: 'thumbsy', icon: HandThumbUpIcon, iconColor: 'text-white', bgColor: 'bg-blue-500' },
  { name: 'I feel nothing', value: null, icon: XMarkIcon, iconColor: 'text-gray-400', bgColor: 'bg-transparent' },
]

export default function Editor({ userId, task, setOpen }) {
  console.log("Editor() userId=" + userId);
  const [selected, setSelected] = useState(moods[5]);
  const [view, setView] = useState();
  const dispatch = useDispatch();
  const user = userId;
  const lang = '114';
  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
          <div className="border-b border-gray-400 focus-within:border-none">
            <CodeMirror
              userId={userId}
              setView={setView}
              extensions={[javascript({ jsx: true })]}
              code={task && task.code || ".."}
            />
          </div>
          <div className="flex justify-between pt-2">
            <div className="flex items-center space-x-5">
            </div>
            <div className="flex-shrink-0">
              <button
                className="inline-flex items-center rounded-none border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none"
                onClick={() => {
                  const code = getCode(view);
                  dispatch(saveTask({user, lang, code}));
                  setOpen(false);
                }}
              >
                Create Task
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}
