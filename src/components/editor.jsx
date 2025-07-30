import React, { useState, useEffect } from 'react'
import { CodePanel } from './CodePanel';
import { DataPanel } from "./DataPanel";
import { PropPanel } from "./PropPanel";
import { HelpPanel } from "./HelpPanel";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { saveTask, postTask, getData, getTask } from '../utils/swr/fetchers';
import useArtcompilerAuth from '../hooks/use-artcompiler-auth';
import { createState } from "../lib/state";
import { Tabs } from "./Tabs";
import { isNonNullNonEmptyObject } from "../utils";
import useLocalStorage from '../hooks/use-local-storage';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const getId = ({ taskId, dataId }) => {
  if (!taskId && !dataId) return "";
  if (taskId && dataId) return `${taskId}+${dataId}`;
  return String(taskId || dataId || "");
};

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
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ doSaveTask, setDoSaveTask ] = useState(false);
//  const [ doPostDataTask, setDoPostDataTask ] = useState(false);
//  const [ doGetData, setDoGetData ] = useState(false);
  const [ tab, setTab ] = useLocalStorage("graffiticode:editor:tab", "Help");
  const { user } = useArtcompilerAuth();
  const ids = parseId(id);
  const [ taskId, setTaskId ] = useState(ids.taskId);
  const [ hasInitialized, setHasInitialized ] = useState(false);
  const dataPanelRef = React.useRef(null);

  const handleCopy = () => {
    if (dataPanelRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(dataPanelRef.current);
      selection.removeAllRanges();
      selection.addRange(range);

      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }

      selection.removeAllRanges();
    }
  };

  // Load task data when taskId changes
  const { data: taskData } = useSWR(
    taskId && user ? { user, id: taskId } : null,
    getTask
  );

  useEffect(() => {
    // if (taskId === "" && hasInitialized) {
    //   // Only create new task if we've already initialized (user action)
    //   setCode("{}..");
    //   setHelp([]);
    //   setData({});
    //   setDoPostTask(true);
    // } else
    if (taskData) {
      console.log(
        "Editor()",
        "taskData=" + JSON.stringify(taskData, null, 2),
      );
      if (taskData.src) {
        setCode(taskData.src);
        setHelp(taskData.help && (
          typeof taskData.help === "string" && JSON.parse(taskData.help) ||
            taskData.help ||
            []
        ));
        setHasInitialized(true);
      }
    }
  }, [taskId, taskData, hasInitialized]);

  useEffect(() => {
    const { taskId } = parseId(id);
    setTaskId(taskId);
//    setDoGetData(true);
  }, [id]);

  // const getDataResp = useSWR(
  //   doGetData && {
  //     user,
  //     id,
  //   } || null,
  //   getData
  // );

  // if (getDataResp.data) {
  //   const data = getDataResp.data;
  //   setDoGetData(false);
  //   setData(data);
  // }

  useEffect(() => {
    if (code && hasInitialized) {
      setDoPostTask(true);
    }
  }, [code, hasInitialized]);

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
    setDoSaveTask(true);
  }

  // Save task.
  const saveTaskResp = useSWR(
    doSaveTask && {
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

  if (saveTaskResp.data) {
    setDoSaveTask(false);
  }

   // useEffect(() => {
  //   if (isNonNullNonEmptyObject(props)) {
  //     setDoPostDataTask(true);
  //   }
  // }, [JSON.stringify(props)]);

  // const postDataTaskResp = useSWR(
  //   doPostDataTask && {
  //     user,
  //     lang: "0001",
  //     code: `${JSON.stringify(props)}..`
  //   } || null,
  //   postTask
  // );

  // if (postDataTaskResp.data) {
  //   const dataId = postDataTaskResp.data;
  //   setDoPostDataTask(false);
  //   setId(getId({taskId, dataId}));
  // }


  return (
    <div className="flex items-start space-x-4 h-full min-h-[calc(100vh-120px)]">
      <div className="min-w-0 flex-1 relative flex flex-col h-full">
        {/* Sticky tabs container */}
        <div
          className="sticky top-0 bg-white z-30 flex-none"
        >
          <Tabs
            tab={tab}
            setTab={setTab}
            onCopy={handleCopy}
            showCopyButton={tab === "Data"}
          />
        </div>

        {/* Content container with scrolling */}
        <div
          className="flex-grow overflow-auto"
          style={{
            height: "calc(100vh - 120px)" // Full viewport height minus tabs and navbar
          }}
        >
          {
            (() => {
              if (tab === "Data") {
                return (
                  <DataPanel
                    ref={dataPanelRef}
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
                    setCode={(newCode) => {
                      setCode(newCode);
                      // Mark as initialized when user edits
                      if (!hasInitialized) {
                        setHasInitialized(true);
                      }
                    }}
                  />
                );
              } else {
                return (
                  <CodePanel
                    code={code}
                    setCode={(newCode) => {
                      setCode(newCode);
                      // Mark as initialized when user edits
                      if (!hasInitialized) {
                        setHasInitialized(true);
                      }
                    }}
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
