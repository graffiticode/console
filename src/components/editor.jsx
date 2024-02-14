import { useState, useEffect } from 'react'
import CodeMirror from './CodeMirror';
import { Properties } from "./properties";
import { javascript } from "@codemirror/lang-javascript";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { buildSaveTask, postTask } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const tabs = [
  { name: 'Properties', current: true },
  { name: 'Code', current: false },
//  { name: 'Data', current: false },
]

function Tabs({ setTab }) {
  const handleClick = (name) => {
    tabs.find(tab => tab.current).current = false;
    tabs.find(tab => tab.name === name).current = true;
    setTab(name);
  };
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          defaultValue={tabs.find((tab) => tab.current).name}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                onClick={() => handleClick(tab.name)}
                className={classNames(
                  tab.current
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b-2 py-1 mb-0 px-1 text-sm font-medium'
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

export default function Editor({
  id,
  lang,
  mark: markInit,
  setNewTask,
  setOpen,
  setId,
  task,
}) {
  const [ mark, setMark ] = useState(markInit);
  const [ view, setView ] = useState();
  const [ isPublic, setIsPublic ] = useState(task?.isPublic);
  const { user } = useGraffiticodeAuth();
  const [ code, setCode ] = useState(task?.src || "");
  const [ saving, setSaving ] = useState(false);
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ tab, setTab ] = useState("Properties");
  const saveTask = buildSaveTask();
  useEffect(() => {
    if (task) {
      setCode(task.src);
    }
  }, [task?.src]);

  const { isLoading, data } = useSWR(
    saving ? { user, lang, code, mark: mark.id, isPublic } : null,
    saveTask
  );

  useEffect(() => {
    // We have successfully saved a task so addit to the task list.
    setNewTask(data);
  }, [data?.id]);

  // useEffect(() => {
  //   setDoPostTask(true);
  // }, [code]);

  // const { data: postTaskId } = useSWR(
  //   doPostTask && code ? { user, lang, code } : null,
  //   postTask
  // );

  // if (postTaskId) {
  //   taskId = postTaskId;
  // }

  // useEffect(() => {
  //   setDoPostTask(false);
  //   if (postTaskId) {
  //     setId(postTaskId);
  //   }
  // }, [postTaskId]);

  if (isLoading) {
    return <div>Compiling...</div>
  }

  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
        <Tabs setTab={setTab} />
        <div className="ring-1 ring-gray-300 focus-within:border-none w-full">
          {
            tab === "Properties" &&
              <Properties
                lang={lang}
                id={id}
                setCode={setCode}
                user={user}
              /> ||
              <CodeMirror
                code={code}
                extensions={[javascript({ jsx: true })]}
                lang={lang}
                setCode={setCode}
                setId={setId}
                setView={setView}
                user={user}
              />
          }
        </div>
        <div className="flex justify-between pt-2 bg-white ring-1 ring-gray-400 ring-1 mt-2 p-2">
          <div className="flex-shrink-0 w-18 h-8">
            <MarkSelector mark={mark} setMark={setMark} />
          </div>
          <div className="flex">
            <div className="flex-shrink-0 w-18 h-8 pr-5">
              <PublicToggle isPublic={isPublic} setIsPublic={setIsPublic} />
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
    </div>
  )
}
