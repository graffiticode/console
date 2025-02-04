import React, { useState, useEffect, useRef } from 'react'; React;
import { Schema } from "prosemirror-model";
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
//import { schema } from 'prosemirror-schema-basic';
import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

import { Plugin } from 'prosemirror-state';
import ReactDOM from 'react-dom';
import { MenuView } from './MenuView';
import { debounce } from "lodash";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "text*", group: "block", parseDOM: [{ tag: "p" }], toDOM() { return ["p", 0]; } },
    text: {}
  }
});

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

const getEditorContent = (view) => {
  if (!view) return;
  const { state: { doc } } = view;
  return doc.textBetween(0, doc.content.size, "\n", "");
};

const clearEditor = (view) => {
  if (!view) return;
  const { state, dispatch } = view;
  const tr = state.tr.replaceWith(0, state.doc.content.size);
  dispatch(tr);
};

export const TextEditor = ({ state }) => {
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
    const enterKeyPlugin = new Plugin({
      props: {
        handleKeyDown(view, event) {
          if (event.key === "Enter") {
            if (event.shiftKey) {
              const { state, dispatch } = view;
              dispatch(state.tr.split(state.selection.from));
            } else {
              const content = getEditorContent(view);
              clearEditor(view);
              state.apply({
                type: "update",
                args: {content},
              });
            }
            event.preventDefault();
            return true;
          }
          return false;
        }
      }
    });
    const editorView = new EditorView(editorRef.current, {
      state: EditorState.create({
        schema,
        plugins: [
          enterKeyPlugin,
          ...plugins,
        ],
      }),
      dispatchTransaction(transaction) {
        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        // debouncedStateUpdate({
        //   state,
        //   editorState: editorState.toJSON()
        // });
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
      className="rounded-lg border border-gray-300 m-2 bg-white text-sm font-sans"
    >
    </div>
  );
};
