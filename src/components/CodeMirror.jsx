import { EditorView} from "@codemirror/view";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
import { useSelector, useDispatch } from 'react-redux'
import { compileHello } from '../utils/redux/actions'

const debouncedStartCompletion = debounce((view, dispatch) => {
  dispatch(compileHello(view.state.doc));
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
  return <div ref={ref}/>;
};

export default CodeMirror;
