import { useState } from 'react';
import { useSession } from "next-auth/react";
import { EditorView } from "@codemirror/view";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
import { useSelector, useDispatch } from 'react-redux'
import { compileTask } from '../utils/redux/actions'
import { ParseContext } from '@codemirror/language';
import { graffiticode } from "@graffiticode/lang-graffiticode";

export const getCode = view => {
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

const debouncedStartCompletion = debounce((view, dispatch) => {
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    lines.push(text);
  }
  const user = 'public';
  const lang = '114';
  const code = lines.join("\n");
  if (code !== '') {
    dispatch(compileTask({ user, lang, code }));
  }
}, 300);

function customCompletionDisplay(dispatch) {
  return EditorView.updateListener.of(({ view, docChanged, transactions }) => {
    if (docChanged) {
      // when a completion is active each keystroke triggers the
      // completion source function, to avoid it we close any open
      // completion inmediatly.
      //closeCompletion(view);
      debouncedStartCompletion(view, dispatch);
    }
  });
}

const CodeMirror = ({ setView, code }) => {
  const userId = useSelector(state => state.userId);
  const dispatch = useDispatch();
  const extensions = [
    customCompletionDisplay(dispatch),
  ];
  const { ref } = useCodeMirror(extensions, setView, code);
  const user = 'public';
  const lang = '114';
  if (code !== '') {
    dispatch(compileTask({ user, lang, code }));
  }
  return <div id="editor" ref={ref}/>;
};

export default CodeMirror;
