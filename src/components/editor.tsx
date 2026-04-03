import React, { useState, useEffect } from 'react'
import { CodePanel } from './CodePanel';
import { DataPanel } from "./DataPanel";
import { HelpPanel } from "./HelpPanel";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import { parse, postTask } from '../utils/swr/fetchers';
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
  onLoadTaskFromHelp,
  lang,
  mark: initMark,
  height,
  onCodeChange,
  onHelpChange,
  onCompileError,
  onError,
  initialCode,
  initialHelp,
  itemId,
}) {
  const [ code, setCode ] = useState(initialCode || "");
  const [ help, setHelp ] = useState(initialHelp || []);
  const [ data, setData ] = useState({});
  const [ props, setProps ] = useState({});
  const [ dataCode, setDataCode ] = useState("");
  const [ view, setView ] = useState();
  const [ mark, setMark ] = useState(initMark);
  const [ isPublic, setIsPublic ] = useState(false);
  const [ isUserEdit, setIsUserEdit ] = useState(false);
  const [ compileErrors, setCompileErrors ] = useState<Array<{message: string, from: number, to: number}> | null>(null);
  const [ tab, setTab ] = useLocalStorage("graffiticode:editor:tab", "Help");
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

  // Parse and post task when code changes due to user editing (debounced)
  useEffect(() => {
    if (!code || !isUserEdit || isPostingTask || !user) return;

    const timer = setTimeout(() => {
      setIsUserEdit(false);
      setIsPostingTask(true);

      (async () => {
        try {
          const result = await parse({ user, lang, src: code, itemId });
          if (result.errors) {
            setCompileErrors(result.errors);
            setIsPostingTask(false);
            return;
          }
          setCompileErrors(null);
          const newTaskId = await postTask({ user, lang, code: result.code, item: itemId });
          setTaskId(newTaskId);
        } catch (err) {
          console.error("Parse/postTask error:", err);
        } finally {
          setIsPostingTask(false);
        }
      })();
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, isUserEdit, isPostingTask, user, lang]);

  // Notify parent of code changes (only from user edits, not parent-driven updates)
  useEffect(() => {
    if (onCodeChange && code !== undefined && code !== initialCode) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  // Notify parent of help changes (only from user edits, not parent-driven updates)
  useEffect(() => {
    if (onHelpChange && help !== undefined && help !== initialHelp) {
      onHelpChange(help);
    }
  }, [help, onHelpChange]);

  // Notify parent of compile/parse errors
  useEffect(() => {
    if (onCompileError) {
      onCompileError(compileErrors);
    }
  }, [compileErrors, onCompileError]);

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
          <div style={{ display: tab === "Help" ? undefined : "none" }}>
            <HelpPanel
              help={help}
              setHelp={setHelp}
              language={lang}
              code={code}
              itemId={itemId}
              setCode={(newCode) => {
                if (isCodeNew(newCode)) {
                  setIsUserEdit(true);
                  setCode(newCode);
                }
              }}
              setTaskId={setTaskId}
              onLoadTaskFromHelp={onLoadTaskFromHelp}
              onError={onError}
              taskId={taskId}
            />
          </div>
          <div style={{ display: tab === "Data" ? undefined : "none" }}>
            <DataPanel
              ref={dataPanelRef}
              id={taskId}
              user={user}
              onDataChange={(fetchedData) => {
                const errors = fetchedData?.errors;
                if (Array.isArray(errors) && errors.length > 0) {
                  setCompileErrors(errors.map(e => ({
                    message: typeof e === 'string' ? e : (e.message || JSON.stringify(e)),
                    from: e.from ?? -1,
                    to: e.to ?? -1,
                  })));
                } else if (fetchedData?.usageLimitReached) {
                  setCompileErrors([{
                    message: 'Usage limit reached. Please upgrade your account or add overage units in Settings to continue.',
                    from: -1,
                    to: -1,
                  }]);
                } else {
                  setCompileErrors(null);
                }
              }}
            />
          </div>
          {tab === "Code" && (
            <CodePanel
              code={code}
              setCode={(newCode) => {
                if (isCodeNew(newCode)) {
                  setIsUserEdit(true);
                  setCode(newCode);
                }
              }}
              compiledData={compileErrors ? { errors: compileErrors } : data}
            />
          )}
        </div>
      </div>
    </div>
  )
}
