import { useState, useEffect } from "react";
import { EditorView } from "@codemirror/view";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
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

const debouncedStartCompletion = debounce(({ view, state }) => {
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    lines.push(text);
  }
  const user = 'public';
  const code = getCode(view);
  if (code !== '') {
    // setCode(code);
    state.apply({
      type: "codeChange",
      args: { code },
    });
  }
}, 300);

function customCompletionDisplay({ state }) {
  return EditorView.updateListener.of(({ view, docChanged, transactions }) => {
    if (docChanged) {
      // when a completion is active each keystroke triggers the
      // completion source function, to avoid it we close any open
      // completion inmediatly.
      //closeCompletion(view);
      debouncedStartCompletion({ view, state });
    }
  });
}

export const CodePanel = ({
  code,
  state,
}) => {
  const [ view, setView ] = useState();
  const extensions = [
    customCompletionDisplay({ state }),
  ];
  const { ref } = useCodeMirror(extensions, setView, code);
  useEffect(() => {
    if (view) {
      const editorValue = view.state.doc.toString();

      if (code !== editorValue) {
        view.dispatch({
          changes: {
            from: 0,
            to: editorValue.length,
            insert: code || "",
          },
        });
      }
    }
  }, [code, view]);
  return (
    <div
      id="editor"
      ref={ref}
    />
  );
};
