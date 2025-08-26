import React, { useState, useEffect } from 'react'
import { CodePanel } from './CodePanel';
import { DataPanel } from "./DataPanel";
import { PropPanel } from "./PropPanel";
import { HelpPanel } from "./HelpPanel";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { postTask, getData } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';
import { createState } from "../lib/state";
import { Tabs } from "./Tabs";
import { isNonNullNonEmptyObject } from "../utils";
import useLocalStorage from '../hooks/use-local-storage';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Compare two code strings ignoring whitespace changes and comments
// Newlines are not significant in Graffiticode
// Comments starting with | or / are ignored
function isCodeEquivalent(code1, code2) {
  // If both are the same reference or both are null/undefined
  if (code1 === code2) return true;

  // If one is null/undefined and the other isn't
  if (!code1 || !code2) return false;

  // Normalize by:
  // 1. Removing line comments (starting with | or /)
  // 2. Replacing all newlines with spaces (not significant in Graffiticode)
  // 3. Replacing multiple whitespaces with single space
  // 4. Trimming leading/trailing whitespace
  const normalize = (str) => {
    return str
      .split('\n')
      .map(line => {
        // Remove comments starting with | or /
        const trimmed = line.trim();
        if (trimmed.startsWith('|') || trimmed.startsWith('/')) {
          return ''; // Remove the entire comment line
        }
        return line;
      })
      .join(' ')
      .replace(/\s+/g, ' ')       // Replace multiple whitespaces with single space
      .trim();
  };

  return normalize(code1) === normalize(code2);
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
  const { user } = useGraffiticodeAuth();
  const [ isPostingTask, setIsPostingTask ] = useState(false);
  const dataPanelRef = React.useRef(null);
  const currentTaskIdRef = React.useRef(null);
  const codeRef = React.useRef(initialCode || "");

  // Function to check if new code is different from current code
  // Uses ref to avoid closure issues with stale state
  const isCodeNew = React.useCallback((newCode) => {
    return !isCodeEquivalent(newCode, codeRef.current);
  }, []);

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
        codeRef.current = initialCode;
      }
      if (initialHelp !== undefined) {
        setHelp(initialHelp);
      }
      currentTaskIdRef.current = taskId;
    }
  }, [taskId, initialCode, initialHelp]);

  useEffect(() => {
    // Update code when initialCode changes
    if (initialCode !== undefined) {
      setCode(initialCode);
      codeRef.current = initialCode;
    }
  }, [initialCode]);

  // Keep codeRef in sync with code state
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

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

  return (
    <div className="flex items-start h-full">
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
          className="flex-1 overflow-auto"
          style={{
            height: height === "100%" ? undefined : (height || "calc(100vh - 120px)") // Use flexbox when 100%
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
                    language={lang}
                    code={code}
                    setCode={(newCode) => {
                      if (isCodeNew(newCode)) {
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
                      if (isCodeNew(newCode)) {
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
