import { useState, useEffect } from 'react'
import { CodePanel } from './CodePanel';
import { EditPanel } from "./EditPanel";
import { DataPanel } from "./DataPanel";
import { javascript } from "@codemirror/lang-javascript";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { buildSaveTask, postTask } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { createState } from "../lib/state";
import { Tabs } from "./Tabs";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const getId = ({ taskId, dataId }) => (
  taskId && dataId && `${taskId}+${dataId}` || taskId || dataId
);

const parseId = id => {
  if (!id) {
    return {taskId: ""};
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
  const { taskId, dataId } = parseId(id);
  useEffect(() => {
    if (taskId === "") {
      // New task.
      setCode("");
      setDataCode("");
    } else {
      const task = tasks.find(task => task.id === taskId);
      task && setCode(task.src);
      state.apply({
        type: "compile",
        args: {taskId, dataId},
      });
    }
    setTab("Code");
  }, [taskId]);

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
        dataId: "",
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
            tab === "Edit" &&
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
