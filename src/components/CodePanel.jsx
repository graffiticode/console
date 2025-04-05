import { useState, useEffect } from "react";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { Decoration, ViewPlugin } from "@codemirror/view";
import { StateField, StateEffect, RangeSet } from "@codemirror/state";
import useCodeMirror from "../utils/cm/use-codemirror";
import { debounce } from "lodash";
import useGraffiticodeAuth from '../hooks/use-graffiticode-auth';

const getCode = view => {
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

const debouncedStartCompletion = debounce(({ view, setCode }) => {
  const doc = view.state.doc;
  const lines = [];
  for (const text of doc.iter()) {
    lines.push(text);
  }
  const user = 'public';
  const code = getCode(view);
  if (code !== '') {
    setCode(code);
  }
}, 300);

function customCompletionDisplay({ setCode }) {
  return EditorView.updateListener.of(({ view, docChanged, transactions }) => {
    if (docChanged) {
      // when a completion is active each keystroke triggers the
      // completion source function, to avoid it we close any open
      // completion inmediatly.
      //closeCompletion(view);
      debouncedStartCompletion({ view, setCode });
    }
  });
}

// Create custom effects to update error decorations and gutter markers
const addErrorMarksEffect = StateEffect.define();
const addGutterMarkersEffect = StateEffect.define();

// Custom gutter marker for errors
class ErrorMarker extends GutterMarker {
  constructor(message) {
    super();
    this.message = message;
  }

  // Define how the marker is displayed
  toDOM() {
    const marker = document.createElement("div");
    marker.className = "cm-gutter-error-marker";
    marker.setAttribute('data-error', this.message); // Use data attribute instead of title
    marker.textContent = "⚠️";
    return marker;
  }
}

// Create a state field to track error marks
const errorMarksField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    // Clear marks when document changes
    value = value.map(tr.changes);

    // Check for our custom effect
    for (const effect of tr.effects) {
      if (effect.is(addErrorMarksEffect)) {
        value = effect.value;
      }
    }

    return value;
  },
  provide: field => EditorView.decorations.from(field)
});

// Create a state field to track gutter markers
const gutterMarkersField = StateField.define({
  create() {
    return RangeSet.empty;
  },
  update(value, tr) {
    // Clear markers when document changes
    value = value.map(tr.changes);

    // Check for our custom effect
    for (const effect of tr.effects) {
      if (effect.is(addGutterMarkersEffect)) {
        value = effect.value;
      }
    }

    return value;
  }
});

// Define the error gutter
const errorGutter = gutter({
  class: "cm-error-gutter",
  markers: view => view.state.field(gutterMarkersField),
  initialSpacer: () => {
    const marker = document.createElement("div");
    marker.textContent = " ";
    return marker;
  }
});

// Create a decoration for an error
const createErrorMark = (from, to, message) => {
  // Ensure message is a string and escape any quotes
  const safeMessage = typeof message === 'string'
    ? message.replace(/"/g, '&quot;')
    : String(message).replace(/"/g, '&quot;');

  return Decoration.mark({
    attributes: {
      class: "cm-error-highlight",
      'data-error': safeMessage // Use data attribute for custom popup
    },
    inclusiveStart: true,
    inclusiveEnd: true
  }).range(from, to);
};

export const CodePanel = ({
  code,
  setCode,
  compiledData
}) => {
  const [ view, setView ] = useState();

  const extensions = [
    customCompletionDisplay({ setCode }),
    errorMarksField,
    gutterMarkersField,
    errorGutter
  ];

  const { ref } = useCodeMirror(extensions, setView, code);

  // Update editor content when code changes
  useEffect(() => {
    if (view) {
      const editorValue = view.state.doc.toString();

      if (code !== editorValue) {
        view.dispatch({
          changes: {
            from: 0,
            to: editorValue.length,
            insert: code || "",
          },
        });
      }
    }
  }, [code, view]);

  // Update error marks when compiledData changes
  useEffect(() => {
    if (!view) return;

    try {
      // Check if we have valid error data
      if (compiledData &&
          compiledData.errors &&
          Array.isArray(compiledData.errors) &&
          compiledData.errors.length > 0) {

        // Create decoration sets for errors and gutter markers
        let errorDecorations = [];

        // Track which lines already have gutter markers to avoid duplicates
        const markedLines = new Set();
        let gutterMarkers = [];

        // First, sort errors by line to group them
        const sortedErrors = [...compiledData.errors].filter(Boolean).sort((a, b) => {
          const fromA = parseInt(a.from, 10) || 0;
          const fromB = parseInt(b.from, 10) || 0;
          return fromA - fromB;
        });

        // Group errors by line
        const errorsByLine = {};

        sortedErrors.forEach((error, idx) => {
          if (!error) return;

          // Use the from/to properties directly from the error object
          let from = parseInt(error.from, 10);
          from = isNaN(from) ? 0 : from;

          let to = parseInt(error.to, 10);
          to = isNaN(to) ? from + 1 : to;

          // Ensure the range is valid - to must be greater than from
          if (to <= from) {
            to = from + 1;
          }

          // Ensure positions are within document bounds
          const docLength = view.state.doc.length;
          if (from >= docLength) from = Math.max(0, docLength - 1);
          if (to > docLength) to = docLength;

          // Format the error message
          const errorMessage = typeof error.message === 'string' ? error.message :
                             (error.message ? JSON.stringify(error.message) : "Unknown error");
          // 1. Create a decoration for this error (inline highlighting)
          errorDecorations.push(createErrorMark(from, to, errorMessage));

          // 2. Group errors by line for gutter markers
          const line = view.state.doc.lineAt(from);
          const lineNumber = line.number;

          if (!errorsByLine[lineNumber]) {
            errorsByLine[lineNumber] = [];
          }
          errorsByLine[lineNumber].push(errorMessage);
        });

        // Create one gutter marker per line with errors
        Object.entries(errorsByLine).forEach(([lineNumber, messages]) => {
          const linePos = view.state.doc.line(parseInt(lineNumber, 10)).from;

          // If multiple errors on this line, combine them into a single message
          let combinedMessage;
          if (messages.length === 1) {
            combinedMessage = messages[0];
          } else {
            combinedMessage = messages.map((msg, i) => `${i+1}. ${msg}`).join('\n\n');
          }

          // Add a gutter marker for this line
          gutterMarkers.push(new ErrorMarker(combinedMessage).range(linePos));

        });

        // Apply error decorations and gutter markers
        view.dispatch({
          effects: [
            addErrorMarksEffect.of(Decoration.set(errorDecorations)),
            addGutterMarkersEffect.of(RangeSet.of(gutterMarkers, true))
          ]
        });
      } else {
        // Clear error marks and gutter markers if no errors
        view.dispatch({
          effects: [
            addErrorMarksEffect.of(Decoration.none),
            addGutterMarkersEffect.of(RangeSet.empty)
          ]
        });
      }
    } catch (err) {
      console.error("Error setting error marks:", err);
      // Clear error marks and gutter markers on error
      view.dispatch({
        effects: [
          addErrorMarksEffect.of(Decoration.none),
          addGutterMarkersEffect.of(RangeSet.empty)
        ]
      });
    }
  }, [compiledData, view]);

  return (
    <>
      <style jsx global>{`
        /* Inline error highlighting */
        .cm-error-highlight {
          background-color: rgba(255, 0, 0, 0.2);
          text-decoration: wavy underline red;
          cursor: text; /* Use normal text/edit cursor */
          position: relative;
        }
        /* Error popup styling - positioned for maximum visibility */
        .cm-error-highlight {
          position: relative; /* Ensure relative positioning for absolute children */
        }
        .cm-error-highlight:hover::after {
          content: attr(data-error);
          position: absolute;
          left: 0;
          /* Position popup below the error text */
          top: 100%;
          transform: translateY(5px); /* Add a small offset */
          background-color: #f44336;
          color: white;
          padding: 10px 15px;
          border-radius: 6px;
          white-space: pre-wrap;
          max-width: 600px;
          min-width: 300px;
          z-index: 1000;
          font-family: sans-serif;
          font-size: 14px;
          line-height: 1.5;
          text-align: left;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        }
        /* Gutter error markers */
        .cm-error-gutter {
          width: 20px;
          text-align: center;
        }
        .cm-gutter-error-marker {
          color: #f44336;
          cursor: pointer;
        }
        .cm-gutter-error-marker {
          position: relative; /* Ensure relative positioning for absolute children */
        }
        .cm-gutter-error-marker:hover::after {
          content: attr(data-error);
          position: absolute;
          left: 100%; /* Position to the right of the marker */
          top: 50%;   /* Vertically center */
          transform: translateY(-50%); /* Precise vertical centering */
          background-color: #f44336;
          color: white;
          padding: 10px 15px;
          border-radius: 6px;
          white-space: pre-wrap;
          max-width: 600px;
          min-width: 300px;
          z-index: 1000;
          font-family: sans-serif;
          font-size: 14px;
          line-height: 1.5;
          text-align: left;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          margin-left: 5px; /* Add a small gap */
        }
      `}</style>
      <div
        id="editor"
        ref={ref}
      />
    </>
  );
};
