import { EditorView } from "@codemirror/view";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
import { useSelector, useDispatch } from 'react-redux'
import { compileTask } from '../utils/redux/actions'
import { ParseContext } from '@codemirror/language';
import { graffiticode } from "@graffiticode/lang-graffiticode";
const debouncedStartCompletion = debounce((view, dispatch) => {
  const lang = '104';
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    console.log("text=" + text);
    lines.push(text);
  }
  const code = lines.join("\n");

  dispatch(compileTask({ lang, code }));
}, 300);

function customCompletionDisplay(dispatch) {
  return EditorView.updateListener.of(({ view, docChanged }) => {
    if (docChanged) {
      // when a completion is active each keystroke triggers the
      // completion source function, to avoid it we close any open
      // completion inmediatly.
      //closeCompletion(view);
      debouncedStartCompletion(view, dispatch);
    }
  });
}

const CodeMirror = () => {
  const dispatch = useDispatch();
  const extensions = [
    customCompletionDisplay(dispatch),
  ];
  const { ref } = useCodeMirror(extensions);
  return <div id="editor" ref={ref}/>;
};

export default CodeMirror;
