import { useState, useEffect } from 'react';
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

const debouncedStartCompletion = debounce((view, dispatch, lang) => {
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    lines.push(text);
  }
  const user = 'public';
  const code = lines.join("\n");
  if (code !== '') {
    dispatch(compileTask({ user, lang, code }));
  }
}, 300);

function customCompletionDisplay(dispatch, lang) {
  return EditorView.updateListener.of(({ view, docChanged, transactions }) => {
    if (docChanged) {
      // when a completion is active each keystroke triggers the
      // completion source function, to avoid it we close any open
      // completion inmediatly.
      //closeCompletion(view);
      debouncedStartCompletion(view, dispatch, lang);
    }
  });
}

const CodeMirror = ({ setView, lang, code }) => {
  const userId = useSelector(state => state.userId);
//  const lang = useSelector(state => state.lang);
  const dispatch = useDispatch();
  const user = 'public';
  useEffect(() => {
    if (code !== '') {
      dispatch(compileTask({ user, lang, code }));
    }
  }, [code]);
  const extensions = [
    customCompletionDisplay(dispatch, lang),
  ];
  const { ref } = useCodeMirror(extensions, setView, code);
  return <div id="editor" ref={ref}/>;
};

export default CodeMirror;
