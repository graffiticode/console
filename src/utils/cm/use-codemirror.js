// https://www.codiga.io/blog/implement-codemirror-6-in-react/
// https://app.codiga.io/hub/snippet/8008/useCodeMirror
import React, { useCallback, useEffect, useState } from "react";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { EditorView, keymap} from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { defaultKeymap } from "@codemirror/commands";
import { indentWithTab } from "@codemirror/commands"

export default function useCodeMirror(extensions, setView, doc) {
  const [element, setElement] = useState();
  const ref = useCallback((node) => {
    if (!node) return;
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) {
      return undefined;
    }
    const startState = EditorState.create({
      doc: doc || '',
      extensions: [
        ...extensions,
        keymap.of(defaultKeymap),
        javascript(),
        keymap.of([indentWithTab]),
        basicSetup,
      ]
    });

    let view = new EditorView({
      state: startState,
      parent: element,
    });

    setView(view);
    
    return () => view.destroy();    
  }, [element]);

  return { ref };
}


