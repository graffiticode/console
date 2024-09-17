// TODO On save, replace expectedValue with responseValue and clear responseValue.
// TODO Use full formId+dataId from proerties to make a new id.
import { useState, useEffect } from 'react'
import CodeMirror from './CodeMirror';
import { Properties } from "./properties";
import { StatePanel } from "./state-panel";
import { javascript } from "@codemirror/lang-javascript";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { buildSaveTask, postTask } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { createState } from "../lib/state";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const tabs = [
  { name: 'Code', current: true },
  { name: 'Inits', current: false },
  { name: 'Data', current: false },
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

const getId = ({ taskId, dataId }) => (
  taskId && dataId && `${taskId}+${dataId}` || taskId || dataId
);

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

export default function Editor({
  accessToken,
  id,
  lang,
  mark: initMark,
  setId,
  setNewTask,
  tasks,
  setShowSaving,
  height,
}) {
  const [ code, setCode ] = useState("");
  const [ dataCode, setDataCode ] = useState("");
  const [ view, setView ] = useState();
  const [ mark, setMark ] = useState(initMark);
  const [ isPublic, setIsPublic ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ doPostDataTask, setDoPostDataTask ] = useState(false);
  const [ tab, setTab ] = useState("Code");
  const [ saveDisabled, setSaveDisabled ] = useState(true);
  const { user } = useGraffiticodeAuth();
  const saveTask = buildSaveTask();
  useEffect(() => {
    if (id === "") {
      setCode("");  // New task.
      setDataCode("");  // New task.
    } else {
      const { taskId, dataId } = parseId(id);
      const task = tasks.find(task => task.id === taskId);
      task && setCode(task.src);
      state.apply({
        type: "compile",
        args: {taskId, dataId},
      });
    }
  }, [id]);

  const [ state ] = useState(createState({
    lang,
  }, (data, { type, args }) => {
    // console.log("Editor() state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "compile":
      setId(getId({
        ...data,
        ...args,
      }));
      return {
        ...data,
        ...args,
      };
    case "dataChange":
      setDoPostDataTask(true);
      setSaveDisabled(false);
      setDataCode(`${JSON.stringify(args)}..`);
      return {
        ...data,
      };
    case "codeChange":
      if (code != args.code) {
        setCode(args.code);
        setDoPostTask(true);
        setSaveDisabled(false);
      }
      return {
        ...data,
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
    const taskId = postTaskResp.data;
    setDoPostTask(false);
    state.apply({
      type: "compile",
      args: {
        taskId,
      },
    });
  }

  const postDataTaskResp = useSWR(
    doPostDataTask && { user, lang: "0001", code: dataCode } || null,
    postTask
  );

  if (postDataTaskResp.data) {
    const dataId = postDataTaskResp.data;
    const { taskId } = state.data;
    setDoPostDataTask(false);
    state.apply({
      type: "compile",
      args: {
        dataId,
      },
    });
  }

  // Save task.

  const task = { id, lang, code, mark: mark.id, isPublic };
    const { isLoading, data } = useSWR(
    saving && { user, ...task } || null,
    saveTask
  );

  useEffect(() => {
    if (data?.id) {
      // We have successfully saved a task so add it to the task list.
      setNewTask({
        ...data,
        ...task,
        created: Date.now(),
      });
    }
    setSaving(false);
    setSaveDisabled(true);
  }, [data?.id]);

  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
        <Tabs
          tab={tab}
          setTab={setTab}
          setSaving={setSaving}
          setShowSaving={setShowSaving}
          saveDisabled={saveDisabled}
        />
        <div
          style={{height}}
        >
          {
            tab === "Inits" &&
              <Properties
                state={state}
                height={height}
                id={id}
                lang={lang}
                user={user}
                setSaveDisabled={setSaveDisabled}
              /> ||
              tab === "Data" &&
              <StatePanel
                height={height}
                id={id}
                lang={lang}
                user={user}
                setSaveDisabled={setSaveDisabled}
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
