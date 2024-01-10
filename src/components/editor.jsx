import { useState } from 'react'
import CodeMirror from './CodeMirror';
import { javascript } from "@codemirror/lang-javascript";
import MarkSelector from '../components/mark-selector';
import PublicToggle from '../components/public-toggle';
import useSWR from "swr";
import { buildSaveTask } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Editor({ task, lang, mark: markInit, setOpen, setTaskId, setNewTask, dataId, setDataId }) {
  const [mark, setMark] = useState(markInit);
  const [view, setView] = useState();
  const [isPublic, setIsPublic] = useState(task.isPublic);
  const { user } = useGraffiticodeAuth();
  const [code, setCode] = useState(task?.src || "");
  const [saving, setSaving] = useState(false);
  const saveTask = buildSaveTask();
  const { isLoading, data } = useSWR(
    saving ? { user, lang, code, mark: mark.id, isPublic } : null,
    saveTask
  );
  if (isLoading) {
    return <div>Compiling...</div>
  }
  if (data && dataId) {
    // id = taskId+dataId
    data.id = `${data.id}+${dataId}`;
  }
  setNewTask(data);
  return (
    <div className="flex items-start space-x-4">
      <div className="min-w-0 flex-1">
        <div className="ring-1 ring-gray-300 focus-within:border-none w-full">
          <CodeMirror
            setView={setView}
            extensions={[javascript({ jsx: true })]}
            lang={lang}
            code={code}
            setCode={setCode}
            setTaskId={setTaskId}
          />
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
                  setOpen(false);
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
