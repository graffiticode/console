import React, { useState, useEffect, useRef } from 'react'; React;
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

import { Plugin } from 'prosemirror-state';
import ReactDOM from 'react-dom';
import { MenuView } from './MenuView';
import { debounce } from "lodash";

// const menuPlugin = new Plugin({
//   view(editorView) {
//     let menuDiv = document.createElement('div');
//     editorView.dom.parentNode.insertBefore(menuDiv, editorView.dom);
//     const update = () => {
//       ReactDOM.render(
//         <MenuView className="" editorView={editorView} />,
//         menuDiv
//       );
//     };
//     update();
//     return {
//       update,
//       destroy() {
//         ReactDOM.unmountComponentAtNode(menuDiv);
//         menuDiv.remove();
//       }
//     };
//   }
// });

const debouncedStateUpdate = debounce(({ state, editorState }) => {
  state.apply({
    type: "update",
    args: {editorState},
  });
}, 1000);

export const TextEditor = ({ state }) => {
  console.log(
    "TextEditor",
    "state=" + JSON.stringify(state, null, 2)
  );
  const [ editorView, setEditorView ] = useState(null);
  const editorRef = useRef(null);
  const plugins = [
    history(),
    keymap({"Mod-z": undo, "Mod-y": redo}),
    keymap(baseKeymap),
  ];
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const editorView = new EditorView(editorRef.current, {
      state: EditorState.create({
        schema,
        plugins,
      }),
      dispatchTransaction(transaction) {
        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        debouncedStateUpdate({
          state,
          editorState: editorState.toJSON()
        });
      }
    });
    setEditorView(editorView);
    editorView.focus();
    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, []);
  const { editorState } = state.data;
  useEffect(() => {
    if (editorState) {
      const newEditorState = EditorState.fromJSON({
        schema,
        plugins,
      }, editorState);
      editorView.updateState(newEditorState);
    }
  }, [editorState]);
  return (
    <div
      ref={editorRef}
      className="border border-gray-300 p-2 bg-white text-sm font-sans"
    >
      <p>
        <i>This is where you will ask for help from a Graffiticode language
        assistant. This feature is currently under construction.</i>
      </p>
    </div>
  );
};
