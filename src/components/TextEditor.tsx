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

// Add a placeholder plugin with correct prosemirror decoration
const createPlaceholderPlugin = (placeholder) => {
  return new Plugin({
    props: {
      attributes: {
        class: 'prosemirror-editor',
      }
    }
  });
};

export const TextEditor = ({ state, placeholder = "", disabled = false }) => {
  const [ editorView, setEditorView ] = useState(null);
  const editorRef = useRef(null);
  const plugins = [
    history(),
    keymap({"Mod-z": undo, "Mod-y": redo}),
    keymap(baseKeymap),
  ];

  // Add placeholder plugin if placeholder is provided
  if (placeholder) {
    plugins.push(createPlaceholderPlugin(placeholder));
  }

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const enterKeyPlugin = new Plugin({
      props: {
        handleKeyDown(view, event) {
          if (disabled) return false;

          if (event.key === "Enter") {
            if (event.shiftKey) {
              const { state, dispatch } = view;
              dispatch(state.tr.split(state.selection.from));
            } else {
              const content = getEditorContent(view);
              if (!content || content.trim() === "") return true;

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
        if (disabled) return;

        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        // debouncedStateUpdate({
        //   state,
        //   editorState: editorState.toJSON()
        // });
      },
      // Add attributes for styling disabled state
      attributes: {
        class: disabled ? 'editor-disabled' : '',
      }
    });

    setEditorView(editorView);
    if (!disabled) {
      editorView.focus();
    }

    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, [disabled]);

  // Update editor when disabled prop changes
  useEffect(() => {
    if (editorView) {
      editorView.dom.classList.toggle('editor-disabled', disabled);
      if (disabled) {
        editorView.dom.setAttribute('contenteditable', 'false');
      } else {
        editorView.dom.setAttribute('contenteditable', 'true');
      }
    }
  }, [disabled, editorView]);

  const { editorState } = state.data;
  useEffect(() => {
    if (editorState && editorView) {
      const newEditorState = EditorState.fromJSON({
        schema,
        plugins,
      }, editorState);
      editorView.updateState(newEditorState);
    }
  }, [editorState]);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        className={`rounded p-2 bg-white text-sm font-sans min-h-[40px] ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {/* Show placeholder manually instead of using ProseMirror decorations */}
      {placeholder && (
        <div
          className="absolute top-[10px] left-[10px] text-gray-400 pointer-events-none"
          style={{ display: editorView && editorView.state.doc.textContent.length > 0 ? 'none' : 'block' }}
        >
          {placeholder}
        </div>
      )}
      <style jsx global>{`
        .editor-disabled {
          background-color: #f9f9f9;
        }
      `}</style>
    </div>
  );
};
