import React, { useState, useEffect, useRef } from 'react'; React;
import { Schema } from "prosemirror-model";
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
//import { schema } from 'prosemirror-schema-basic';
import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import ReactDOM from 'react-dom';
// import { MenuView } from './MenuView';
import { debounce } from "lodash";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "text*", group: "block", parseDOM: [{ tag: "p" }], toDOM() { return ["p", 0]; } },
    code_block: {
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
      toDOM() { return ["pre", ["code", 0]] }
    },
    text: {}
  },
  marks: {
    code: {
      parseDOM: [{ tag: "code" }],
      toDOM() { return ["code", 0] }
    }
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

  // Create a string builder
  let content = "";

  // Process nodes to handle code blocks specially
  doc.forEach((node, offset, index) => {
    if (node.type.name === 'code_block') {
      // For code blocks, add triple backticks
      content += '```\n' + node.textContent + '\n```';
    } else {
      // For other blocks, just add the text
      content += node.textContent;
    }

    // Add newlines between blocks
    if (index < doc.childCount - 1) {
      content += '\n';
    }
  });

  return content;
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
        class: 'prosemirror-editor'
      }
    }
  });
};

export const TextEditor = ({ state, placeholder = "", disabled = false, onSubmit = null }) => {
  const [ editorView, setEditorView ] = useState(null);
  const [ hasFocus, setHasFocus ] = useState(false);
  const [ hasContent, setHasContent ] = useState(false);
  const editorRef = useRef(null);
  // Function to toggle a code block
  const toggleCodeBlock = (state, dispatch) => {
    const { selection } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);

    if (!range) return false;

    const nodeType = schema.nodes.code_block;
    const node = nodeType.create();

    if ($from.parent.type === schema.nodes.code_block) {
      // If already in a code block, convert to paragraph
      if (dispatch) {
        const tr = state.tr.setBlockType(range.start, range.end, schema.nodes.paragraph);
        dispatch(tr);
      }
      return true;
    } else {
      // If not in a code block, convert to code block
      if (dispatch) {
        const tr = state.tr.setBlockType(range.start, range.end, nodeType);
        dispatch(tr);
      }
      return true;
    }
  };

  // Handle triple backtick input
  const handleBacktickInput = (view, from, to, text) => {
    if (text === '`' && view.state.doc.textBetween(from - 2, from) === '``') {
      // When triple backtick is typed, replace with a code block
      const tr = view.state.tr.delete(from - 2, from + 1);
      tr.setBlockType(from - 2, from - 2, schema.nodes.code_block);
      view.dispatch(tr);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    // Handle Enter key to submit (Shift+Enter for new line)
    const handleEnterKey = (state, dispatch, view) => {
      // Only submit on plain Enter, not Shift+Enter
      if (onSubmit && !disabled) {
        const content = getEditorContent({ state });
        if (content && content.trim()) {
          onSubmit(content);
          // Clear the editor after submission
          if (dispatch) {
            const tr = state.tr.replaceWith(0, state.doc.content.size, schema.nodes.paragraph.create());
            dispatch(tr);
          }
          return true;
        }
      }
      return false;
    };

    const customKeymap = {
      "Mod-z": undo,
      "Mod-y": redo,
      "Mod-`": toggleCodeBlock
    };

    // Only add Enter handler if onSubmit is provided
    if (onSubmit) {
      customKeymap["Enter"] = handleEnterKey;
      // Allow Shift+Enter for new lines
      customKeymap["Shift-Enter"] = () => false; // Let default behavior handle it
    }

    // Build plugins dynamically based on props
    const dynamicPlugins = [
      history(),
      keymap(customKeymap),
      keymap(baseKeymap),
      new Plugin({
        props: {
          handleTextInput: handleBacktickInput
        }
      })
    ];

    if (placeholder) {
      dynamicPlugins.push(createPlaceholderPlugin(placeholder));
    }

    const editorView = new EditorView(editorRef.current, {
      state: EditorState.create({
        schema,
        plugins: dynamicPlugins,
      }),
      dispatchTransaction(transaction) {
        if (disabled) return;

        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        // Update hasContent state when document changes
        setHasContent(editorState.doc.textContent.length > 0);
        // debouncedStateUpdate({
        //   state,
        //   editorState: editorState.toJSON()
        // });
      },
      // Add attributes for styling disabled state and placeholder
      attributes: {
        class: disabled ? 'editor-disabled' : '',
        'data-placeholder': placeholder
      },
      handleDOMEvents: {
        focus: () => {
          setHasFocus(true);
          return false;
        },
        blur: () => {
          setHasFocus(false);
          return false;
        }
      }
    });

    setEditorView(editorView);

    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, [disabled, onSubmit, placeholder]);

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
      // Rebuild plugins for state update
      const handleEnterKey = (state, dispatch, view) => {
        if (onSubmit && !disabled) {
          const content = getEditorContent({ state });
          if (content && content.trim()) {
            onSubmit(content);
            if (dispatch) {
              const tr = state.tr.replaceWith(0, state.doc.content.size, schema.nodes.paragraph.create());
              dispatch(tr);
            }
            return true;
          }
        }
        return false;
      };

      const customKeymap = {
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-`": toggleCodeBlock
      };

      if (onSubmit) {
        customKeymap["Enter"] = handleEnterKey;
        customKeymap["Shift-Enter"] = () => false;
      }

      const plugins = [
        history(),
        keymap(customKeymap),
        keymap(baseKeymap),
        new Plugin({
          props: {
            handleTextInput: handleBacktickInput
          }
        })
      ];

      if (placeholder) {
        plugins.push(createPlaceholderPlugin(placeholder));
      }

      const newEditorState = EditorState.fromJSON({
        schema,
        plugins,
      }, editorState);
      editorView.updateState(newEditorState);
      // Update hasContent when editor state changes from props
      setHasContent(newEditorState.doc.textContent.length > 0);
    }
  }, [editorState, editorView, onSubmit, disabled, placeholder]);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        className={`rounded p-1 bg-white text-sm font-sans min-h-[32px] ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {/* Show placeholder manually instead of using ProseMirror decorations */}
      {placeholder && !hasFocus && !hasContent && (
        <div
          className="absolute top-[8px] left-[8px] text-gray-400 pointer-events-none"
        >
          {placeholder}
        </div>
      )}
      <style jsx global>{`
        .editor-disabled {
          background-color: #f9f9f9;
        }
        
        /* Style for code blocks */
        .ProseMirror pre {
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          font-family: monospace;
          margin: 4px 0;
        }
        
        /* Syntax highlighting for the triple backticks */
        .ProseMirror-triplequote {
          color: #888;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};
