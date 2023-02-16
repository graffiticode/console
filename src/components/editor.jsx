import { useState } from 'react'
import CodeMirror from './CodeMirror';
import { javascript } from "@codemirror/lang-javascript";
import MarkSelector from '../components/mark-selector';
import useSWR from "swr";
import { buildSaveTask } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

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

export default function Editor({ task, lang, mark: markInit, setOpen, setId, setNewTask }) {
  const [mark, setMark] = useState(markInit);
  const [view, setView] = useState();
  const { user } = useGraffiticodeAuth();
  const [code, setCode] = useState(task?.src || "");
  const [saving, setSaving] = useState(false);
  const saveTask = buildSaveTask({ setNewTask });
  useSWR(saving ? { user, lang, code, mark: mark.id } : null, saveTask);
  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
        <div className="ring-1 ring-gray-300 focus-within:border-none">
          <CodeMirror
            setView={setView}
            extensions={[javascript({ jsx: true })]}
            lang={lang}
            code={code}
            setCode={setCode}
            setId={setId}
          />
        </div>
        <div className="flex justify-between pt-2 bg-white ring-1 ring-gray-400 ring-1 mt-2 p-2">
          <div className="flex-shrink-0 w-18 h-8">
            <MarkSelector mark={mark} setMark={setMark} />
          </div>
          <div className="flex-shrink-0">
            <button
              className="inline-flex items-center rounded-none bg-white ring-1 ring-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:ring-2 focus:outline-none"
              onClick={() => {
                setSaving(true);
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
