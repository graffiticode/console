import React, { useState, useEffect } from 'react'
import { CodePanel } from './CodePanel';
import { DataPanel } from "./DataPanel";
import { PropPanel } from "./PropPanel";
import { HelpPanel } from "./HelpPanel";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { postTask, getData } from '../utils/swr/fetchers';
import useArtcompilerAuth from '../hooks/use-artcompiler-auth';
import { createState } from "../lib/state";
import { Tabs } from "./Tabs";
import { isNonNullNonEmptyObject } from "../utils";
import useLocalStorage from '../hooks/use-local-storage';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

/*
  The job of the Editor is to provide code and props editors and to compile the
  edited code and props to get an id for the current state of the view.
 */

export default function Editor({
  accessToken,
  taskId,
  setTaskId,
  lang,
  mark: initMark,
  height,
  onCodeChange,
  onHelpChange,
  initialCode,
  initialHelp,
}) {
  const [ code, setCode ] = useState(initialCode || "");
  const [ help, setHelp ] = useState(initialHelp || []);
  const [ data, setData ] = useState({});
  const [ props, setProps ] = useState({});
  const [ dataCode, setDataCode ] = useState("");
  const [ view, setView ] = useState();
  const [ mark, setMark ] = useState(initMark);
  const [ isPublic, setIsPublic ] = useState(false);
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ isUserEdit, setIsUserEdit ] = useState(false);
  const [ tab, setTab ] = useLocalStorage("graffiticode:editor:tab", "Make");
  const { user } = useArtcompilerAuth();
  const [ isPostingTask, setIsPostingTask ] = useState(false);
  const dataPanelRef = React.useRef(null);
  const currentTaskIdRef = React.useRef(null);

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


  useEffect(() => {
    // When taskId changes, update the editor with the new initial values
    if (taskId !== currentTaskIdRef.current) {
      setIsUserEdit(false);
      setDoPostTask(false);
      setIsPostingTask(false);
      if (initialCode !== undefined) {
        setCode(initialCode);
      }
      if (initialHelp !== undefined) {
        setHelp(initialHelp);
      }
      currentTaskIdRef.current = taskId;
    }
  }, [taskId, initialCode, initialHelp]);

  useEffect(() => {
    // Only post task if code changes due to user editing
    if (code && isUserEdit && !isPostingTask) {
      setDoPostTask(true);
      setIsUserEdit(false); // Reset flag after posting
      setIsPostingTask(true); // Prevent duplicate posts
    }
  }, [code, isUserEdit, isPostingTask]);

  // Notify parent of code changes
  useEffect(() => {
    if (onCodeChange && code !== undefined) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  // Notify parent of help changes
  useEffect(() => {
    if (onHelpChange && help !== undefined) {
      onHelpChange(help);
    }
  }, [help, onHelpChange]);

  const postTaskResp = useSWR(
    doPostTask && { user, lang, code } || null,
    postTask
  );

  useEffect(() => {
    if (postTaskResp.data && isPostingTask) {
      const taskId = postTaskResp.data;
      setDoPostTask(false);
      setIsPostingTask(false); // Reset the flag
      setTaskId(taskId);
    }
  }, [postTaskResp.data, isPostingTask, user, lang, code, help, mark.id, isPublic]);

  // Removed SWR-based save task - now saving directly after post completes

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
                    id={taskId}
                    user={user}
                  />
                );
              } else if (tab === "Make") {
                return (
                  <HelpPanel
                    help={help}
                    setHelp={setHelp}
                    accessToken={accessToken}
                    language={lang}
                    code={code}
                    setCode={(newCode) => {
                      if (newCode !== code) {
                        setIsUserEdit(true);
                        setCode(newCode);
                      }
                    }}
                  />
                );
              } else {
                return (
                  <CodePanel
                    code={code}
                    setCode={(newCode) => {
                      if (newCode !== code) {
                        setIsUserEdit(true);
                        setCode(newCode);
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
