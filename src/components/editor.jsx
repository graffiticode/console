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
import { useDispatch, useSelector } from 'react-redux'
import MarkSelector, { marks } from '../components/mark-selector';

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

export default function Editor({ userId, task, mark: markInit, setOpen }) {
  const [mark, setMark] = useState(markInit);
  const [view, setView] = useState();
  const dispatch = useDispatch();
  const uid = userId;
  const { lang, code } = task || {lang: '0', code: ''};
  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
          <div className="ring-1 ring-gray-300 focus-within:border-none">
            <CodeMirror
              userId={userId}
              setView={setView}
              extensions={[javascript({ jsx: true })]}
              lang={lang}
              code={code}
            />
          </div>
          <div className="flex justify-between pt-2 bg-white ring-1 ring-gray-400 ring-1 mt-2 p-2">
            <div className="flex-shrink-0 w-18 h-8">
              <MarkSelector mark={mark} setMark={setMark}/>
            </div>
            <div className="flex-shrink-0">
              <button
    className="inline-flex items-center rounded-none bg-white ring-1 ring-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:ring-2 focus:outline-none"
                onClick={() => {
                  const code = getCode(view);
                  dispatch(saveTask({uid, lang, code, mark: mark.id}));
                  setOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}
