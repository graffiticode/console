import { useState, useEffect } from 'react'
import { CodePanel } from './CodePanel';
import { DataPanel } from "./DataPanel";
import { PropPanel } from "./PropPanel";
import { HelpPanel } from "./HelpPanel";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { buildSaveTask, postTask, getData } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { createState } from "../lib/state";
import { Tabs } from "./Tabs";
import { isNonNullNonEmptyObject } from "../utils";
import { postTaskUpdates } from '../utils/swr/fetchers';
import useLocalStorage from '../hooks/use-local-storage';

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
    dataId: parts.length > 1 && parts.slice(1).join("+"),
  };
};

/*
  The job of the Editor is to provide code and props editors and to compile the
  edited code and props to get an id for the current state of the view.
 */


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
  const [ help, setHelp ] = useState([]);
  const [ data, setData ] = useState({});
  const [ props, setProps ] = useState({});
  const [ dataCode, setDataCode ] = useState("");
  const [ view, setView ] = useState();
  const [ mark, setMark ] = useState(initMark);
  const [ isPublic, setIsPublic ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ doPostTask, setDoPostTask ] = useState(false);
  // No longer using postTaskUpdates for help changes
  const [ doPostDataTask, setDoPostDataTask ] = useState(false);
  const [ doGetData, setDoGetData ] = useState(false);
  const [ tab, setTab ] = useLocalStorage("graffiticode:editor:tab", "Help");
  const [ saveDisabled, setSaveDisabled ] = useState(true);
  const { user } = useGraffiticodeAuth();
  const saveTask = buildSaveTask();
  const ids = parseId(id);
  const [ taskId, setTaskId ] = useState(ids.taskId);

  useEffect(() => {
    if (taskId === "") {
      setCode("");
      setHelp([]);
      setData({});
      setDoPostTask(true);
    } else {
      const task = tasks.find(task => task.id === taskId);
      if (task) {
        setCode(task.src);
        setHelp(task.help && (
          typeof task.help === "string" && JSON.parse(task.help) ||
            task.help ||
            []
        ))
      }
    }
  }, [taskId, tasks]);

  useEffect(() => {
    const { taskId } = parseId(id);
    if (taskId) {
      setTaskId(taskId);
    }
    setDoGetData(true);
  }, [id]);

  const getDataResp = useSWR(
    doGetData && {
      user,
      id,
    } || null,
    getData
  );

  if (getDataResp.data) {
    const data = getDataResp.data;
    setDoGetData(false);
    setData(data);
  }

  useEffect(() => {
    if (code) {
      setDoPostTask(true);
      setSaveDisabled(false);
    }
  }, [code]);

  // Enable save button when help changes
  useEffect(() => {
    if (help && help.length > 0) {
      setSaveDisabled(false);
    }
  }, [help]);

  // This is the critical fix - when a user clicks on a task in the list,
  // we need to force the task ID to update and help to be reloaded
  useEffect(() => {
    if (id && id !== getId({taskId})) {
      const { taskId: newTaskId } = parseId(id);
      if (newTaskId) {
        setTaskId(newTaskId);
      }
    }
  }, [id, taskId]);

  const postTaskResp = useSWR(
    doPostTask && { user, lang, code } || null,
    postTask
  );

  if (postTaskResp.data) {
    const taskId = postTaskResp.data;
    setDoPostTask(false);
    setTaskId(taskId);
    setId(taskId);
  }

  useEffect(() => {
    if (isNonNullNonEmptyObject(props)) {
      setDoPostDataTask(true);
      setSaveDisabled(false);
    }
  }, [JSON.stringify(props)]);

  const postDataTaskResp = useSWR(
    doPostDataTask && {
      user,
      lang: "0001",
      code: `${JSON.stringify(props)}..`
    } || null,
    postTask
  );

  if (postDataTaskResp.data) {
    const dataId = postDataTaskResp.data;
    setDoPostDataTask(false);
    setId(getId({taskId, dataId}));
  }

  // Save task.
  const saveTaskResp = useSWR(
    saving && {
      user,
      id,
      lang,
      code,
      help, //: JSON.stringify(help), // Explicitly stringify help here for saving
      mark: mark.id,
      isPublic
    } || null,
    saveTask
  );

  if (saveTaskResp.data?.id) {
    const data = saveTaskResp.data;
    if (data?.id) {
      // We have successfully saved a task so add it to the task list.
      setNewTask({
        ...data,
        id,
        lang,
        code,
        help,
        mark: mark.id,
        isPublic,
        created: Date.now(),
      });
    }
    setSaving(false);
    setSaveDisabled(true);
  }

  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
        <Tabs
          tab={tab}
          setTab={setTab}
          setSaving={setSaving}
          setShowSaving={setShowSaving}
          saveDisabled={saveDisabled}
          setSaveDisabled={setSaveDisabled}
        />
        <div
          style={{height}}
        >
          {
            (() => {
              if (tab === "Data") {
                return (
                  <DataPanel
                    id={id}
                    user={user}
                  />
                );
              } else if (tab === "Help") {
                return (
                  <HelpPanel
                    help={help}
                    setHelp={setHelp}
                    accessToken={accessToken}
                    language={lang}
                    code={code}
                    setCode={setCode}
                  />
                );
              } else {
                return (
                  <CodePanel
                    code={code}
                    setCode={setCode}
                    compiledData={data}
                  />
                );
              }
            })()
          }
        </div>
      </div>
    </div>
  )
}
