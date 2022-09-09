import React, { useCallback, useEffect, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap} from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { defaultKeymap } from "@codemirror/commands";


export default function useCodeMirror(extensions) {
  const [element, setElement] = useState();
  const ref = useCallback((node) => {
    if (!node) return;
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) {
      return undefined;
    }

    const theme = EditorView.theme({
      "&": {height: "300px"},
      ".cm-scroller": {overflow: "auto"},
      "class": "mx-4",
    });

    const startState = EditorState.create({
      doc: "Hello World",
      extensions: [
        keymap.of(defaultKeymap),
        theme,
      ]
    });

    let view = new EditorView({
      state: startState,
      parent: element,
    });
    
    return () => view.destroy();    
  }, [element]);

  return { ref };
}

