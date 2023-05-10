import { useEffect } from 'react';
import { EditorView } from "@codemirror/view";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
import useSWR from "swr";
import { postTask } from '../utils/swr/fetchers';
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

const getCode = view => {
  if (view === undefined) {
    return "";
  }
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    lines.push(text);
  }
  return lines.join("");
};

const debouncedStartCompletion = debounce(({ uid, view, lang, setCode }) => {
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    lines.push(text);
  }
  const user = 'public';
  const code = getCode(view);
  if (code !== '') {
    setCode(code);
  }
}, 300);

function customCompletionDisplay({ uid, lang, setCode }) {
  return EditorView.updateListener.of(({ view, docChanged, transactions }) => {
    if (docChanged) {
      // when a completion is active each keystroke triggers the
      // completion source function, to avoid it we close any open
      // completion inmediatly.
      //closeCompletion(view);
      debouncedStartCompletion({ uid, view, lang, setCode });
    }
  });
}

const CodeMirror = ({ setView, lang, code, setCode, setTaskId }) => {
  const { user } = useGraffiticodeAuth();
  const { data } = useSWR(code ? { user, lang, code } : null, postTask);
  const extensions = [
    customCompletionDisplay({ user, lang, setCode }),
  ];
  const { ref } = useCodeMirror(extensions, setView, code);
  useEffect(() => {
    if (data) {
      setTaskId(data);
    }
  }, [data]);
  return <div id="editor" ref={ref} />;
};

export default CodeMirror;
