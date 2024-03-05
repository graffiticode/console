import { useState, useEffect } from 'react'
import CodeMirror from './CodeMirror';
import { Properties } from "./properties";
import { javascript } from "@codemirror/lang-javascript";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { buildSaveTask, compile, postTask } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { createState } from "../lib/state";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const tabs = [
  { name: 'Code', current: true },
  { name: 'Properties', current: false },
]

function Tabs({ setTab, setSaving, setShowSaving, saveDisabled }) {
  const handleClick = (name) => {
    tabs.find(tab => tab.current).current = false;
    tabs.find(tab => tab.name === name).current = true;
    setTab(name);
  };
  return (
    <div className="pt-4">
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-none py-2 pl-3 pr-10 text-base focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
          defaultValue={tabs.find((tab) => tab.current).name}
        >
          {tabs.map((tab) => (
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
                  tab.current
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

const getId = ({ taskId, dataId }) => dataId && `${taskId}+${dataId}` || taskId;
const parseId = id => {
  if (id === undefined) {
    return {};
  }
  const parts = id.split("+");
  return {
    taskId: parts[0],
    dataId: parts.slice(1).join("+"),
  };
};

const Toolbar = ({ setSaving, mark, setMark, isPublic, setIsPublic, saveDisabled }) =>
<div className="flex justify-end bg-white ring-gray-400 px-1 py-2">
  <div className="flex-shrink-0">
    <button
      className="inline-flex items-center rounded-none bg-white ring-1 ring-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:ring-2 focus:outline-none"
      onClick={() => {
        setSaving(true);
      }}
      disabled={saveDisabled}
      >
      Save
    </button>
  </div>
</div>

export default function Editor({
  id,
  lang,
  mark: initMark,
  setId,
  setNewTask,
  tasks,
  setShowSaving,
  setHeight,
}) {
  const [ code, setCode ] = useState("");
  const [ view, setView ] = useState();
  const [ mark, setMark ] = useState(initMark);
  const [ isPublic, setIsPublic ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ tab, setTab ] = useState("Code");
  const [ doCompile, setDoCompile ] = useState(false);
  const [ taskId, setTaskId ] = useState("");
  const [ dataId, setDataId ] = useState("");
  const [ saveDisabled, setSaveDisabled ] = useState(true);
  const { user } = useGraffiticodeAuth();
  const saveTask = buildSaveTask();

  console.log("Editor() code=" + code);

  useEffect(() => {
    if (id === "") {
      setCode("");  // New task.
    } else {
      const { taskId, dataId } = parseId(id);
      const task = tasks.find(task => task.id === id);
      task && setCode(task.src);
    }
  }, [id]);

  const [ state ] = useState(createState({
    lang,
  }, (data, { type, args }) => {
    console.log("Editor() state.apply() type=" + type);
    switch (type) {
    case "compile":
      setDoCompile(false);
      return {
        ...data,
        ...args,
      };
    case "codeChange":
      if (code != args.code) {
        setCode(args.code);
        setDoPostTask(true);
      }
      return {
        ...data,
        ...args,
      };
    case "dataChange":
      setDoCompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  // Post task.

  const postTaskResp = useSWR(
    doPostTask && { user, lang, code } || null,
    postTask
  );

  if (postTaskResp.data) {
    const id = postTaskResp.data;
    setDoPostTask(false);
    setTaskId(id);
    setDataId("");
    setId(getId({taskId: id, dataId: ""}));
    setSaveDisabled(false);
  }

  // Save task.

  const { isLoading, data } = useSWR(
    saving && { user, id, lang, code, mark: mark.id, isPublic } || null,
    saveTask
  );

  useEffect(() => {
    // We have successfully saved a task so add it to the task list.
    setNewTask(data);
    setSaving(false);
    setSaveDisabled(true);
  }, [data?.id]);

  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
        <Tabs
          setTab={setTab}
          setSaving={setSaving}
          setShowSaving={setShowSaving}
          saveDisabled={saveDisabled}
        />
        <div className="">
          {
            tab === "Properties" &&
              <Properties
                id={id}
                lang={lang}
                setId={setId}
                user={user}
                setHeight={setHeight}
              /> ||
              <CodeMirror
                code={code}
                state={state}
              />
          }
        </div>
      </div>
    </div>
  )
}
