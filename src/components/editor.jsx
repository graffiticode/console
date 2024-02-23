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

export default function Editor({
  id,
  lang,
  mark: initMark,
  setId,
  setNewTask,
  tasks,
}) {
  // Use task as initial code for the editor.
  // Use id as the initial taskId and dataId.
  // Update taskId from code editor.
  // Update dataId from property editor.
  // Use global schema from schema.json
  // Get values for props editor from compile.
  // Recompile with code or data changes.
  // Save task saves current id.
  const [ code, setCode ] = useState("");
  const [ view, setView ] = useState();
  const [ mark, setMark ] = useState(initMark);
  const [ isPublic, setIsPublic ] = useState(false);
  const { user } = useGraffiticodeAuth();
  const [ saving, setSaving ] = useState(false);
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ tab, setTab ] = useState("Code");
  const saveTask = buildSaveTask();
  const [ doCompile, setDoCompile ] = useState(false);
  const [ taskId, setTaskId ] = useState("");
  const [ dataId, setDataId ] = useState("");
  const [ props, setProps ] = useState({});
  useEffect(() => {
    if (id === "") {
      setCode("");  // New task.
    } else {
      const { taskId, dataId } = parseId(id);
      setTaskId(taskId);
      setDataId(dataId);
      const task = tasks.find(task => task.id === id);
      task && setCode(task.src);
    }
  }, [id]);
  useEffect(() => {
    setDoCompile(true);
    // state.apply({
    //   type: "dataChange",
    //   args: props,
    // });
  }, [JSON.stringify(props)]);
  const [ state ] = useState(createState({
    lang,
  }, (data, { type, args }) => {
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
  }

  // Compile task.

  const compileResp = useSWR(
    doCompile && user && {
      user,
      id: getId({taskId, dataId}),
      data: props,
    },
    compile
  );

  if (compileResp.data) {
    const { id, data } = compileResp.data;
    const { taskId, dataId } = parseId(id);
    setTaskId(taskId);
    setDataId(dataId);
    setId(getId({taskId, dataId}));
    state.apply({
      type: "compile",
      args: data,
    });
  }

  // Save task.
  
  const { isLoading, data } = useSWR(
    saving ? { user, lang, code, mark: mark.id, isPublic } : null,
    saveTask
  );

  useEffect(() => {
    // We have successfully saved a task so add it to the task list.
    setNewTask(data);
  }, [data?.id]);

  // if (isLoading) {
  //   return <div>Compiling...</div>
  // }

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
                setId={setId}
                setProps={setProps}
                user={user}
              /> ||
              <CodeMirror
                code={code}
                state={state}
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
