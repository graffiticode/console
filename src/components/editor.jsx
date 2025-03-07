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
  const [ doPostTaskUpdates, setDoPostTaskUpdates ] = useState(false);
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
      // New task.
      setCode("");
      setHelp([]);
      setData({});
      setDoPostTask(true);
    } else {
      const task = tasks.find(task => task.id === taskId);
      // console.log(
      //   "Editor()",
      //   "task=" + JSON.stringify(task, null, 2),
      // );
      task && setCode(task.src);
      task && setHelp(typeof task.help === "string" && JSON.parse(task.help) || task.help || []);
    }
  }, [taskId]);

  useEffect(() => {
    // console.log(
    //   "Editor()",
    //   "id=" + id,
    // );
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

  const postTaskResp = useSWR(
    doPostTask && { user, lang, code, help } || null,
    postTask
  );

  if (postTaskResp.data) {
    const taskId = postTaskResp.data;
    setDoPostTask(false);
    setTaskId(taskId);
    setId(taskId);
  }

  useEffect(() => {
    if (help?.length > 0) {
      setDoPostTaskUpdates(true);
      // FIXME avoid mutation.
      // console.log(
      //   "Editor",
      //   "id=" + id,
      //   "help=" + JSON.stringify(help, null, 2),
      // );
      const task = tasks.find(task => task.id === id);
      task?.help && (task.help = help);
    }
  }, [help]);

  const postTaskUpdatesResp = useSWR(
    doPostTaskUpdates && id && {
      user,
      tasks: [{
        id,
        help,
      }],
    } || null,
    postTaskUpdates
  );

  if (postTaskUpdatesResp.data) {
    setDoPostTaskUpdates(false);
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
    // console.log(
    //   "Editor()",
    //   "dataId=" + dataId,
    // );
    setDoPostDataTask(false);
    setId(getId({taskId, dataId}));
  }

  // Save task.

  const task = { id, lang, code, help, mark: mark.id, isPublic };
  const saveTaskResp = useSWR(
    saving && { user, ...task } || null,
    saveTask
  );

  if (saveTaskResp.data?.id) {
    const data = saveTaskResp.data;
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
        />
        <div
          style={{height}}
        >
          {
            tab === "Data" &&
              // <PropPanel
              //   data={data}
              //   lang={lang}
              //   setData={setProps}
              //   user={user}
              // /> ||
              <DataPanel
                id={id}
                user={user}
              /> ||
            tab === "Help" &&
              <HelpPanel
                help={help}
                setHelp={setHelp}
              /> ||
              <CodePanel
                code={code}
                setCode={setCode}
              />
          }
        </div>
      </div>
    </div>
  )
}
