import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { EditorView } from "@codemirror/view";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
import { ParseContext } from '@codemirror/language';
import { graffiticode } from "@graffiticode/lang-graffiticode";
import useSWR from "swr";
import { postTask } from '../utils/swr/fetchers';

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

const debouncedStartCompletion = debounce(({uid, view, lang, setCode}) => {
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    lines.push(text);
  }
  const user = 'public';
  const code = lines.join("\n");
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
      debouncedStartCompletion({uid, view, lang, setCode});
    }
  });
}

const CodeMirror = ({ setView, lang, code, setCode, setId }) => {
  const { data: sessionData } = useSession();
  const uid = sessionData.address;
  const { data, error, isLoading } = useSWR({uid, lang, code}, postTask);
  if (data) {
    setId(data);
  }
  const extensions = [
    customCompletionDisplay({uid, lang, setCode}),
  ];
  const { ref } = useCodeMirror(extensions, setView, code);
  return <div id="editor" ref={ref}/>;
};

export default CodeMirror;
