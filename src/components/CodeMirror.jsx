import { useState } from 'react';
import { useSession } from "next-auth/react";
import { EditorView } from "@codemirror/view";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
import { useSelector, useDispatch } from 'react-redux'
import { compileTask } from '../utils/redux/actions'
import { ParseContext } from '@codemirror/language';
import { graffiticode } from "@graffiticode/lang-graffiticode";
const debouncedStartCompletion = debounce((userId, view, dispatch) => {
  console.log("debouncedStartCompletion() userId=" + userId);
  const lang = '114';
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    console.log("text=" + text);
    lines.push(text);
  }
  const code = lines.join("\n");
  const user = userId;
  dispatch(compileTask({ user, lang, code }));
}, 300);

function customCompletionDisplay(userId, dispatch) {
  console.log("[1] customCompeletionDisplay() userId=" + userId);
  return EditorView.updateListener.of(({ view, docChanged }) => {
    if (docChanged) {
      console.log("[2] customCompeletionDisplay() userId=" + userId);
      // when a completion is active each keystroke triggers the
      // completion source function, to avoid it we close any open
      // completion inmediatly.
      //closeCompletion(view);
      debouncedStartCompletion(userId, view, dispatch);
    }
  });
}

const CodeMirror = ({ userId }) => {
  console.log("CodeMirror() userId=" + userId);
  const dispatch = useDispatch();
  const extensions = [
    customCompletionDisplay(userId, dispatch),
  ];
  const { ref } = useCodeMirror(extensions);
  return <div id="editor" ref={ref}/>;
};

export default CodeMirror;
