import React, { useState, useEffect } from 'react';
import { schema as baseSchema } from "prosemirror-schema-basic"
import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema, DOMParser } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { addListNodes } from "prosemirror-schema-list"
import {undo, redo, history} from "prosemirror-history"
//import { MenuItem, Dropdown } from 'prosemirror-menu';
import { exampleSetup, buildMenuItems } from 'prosemirror-example-setup';

import {
  NodeViewComponentProps,
  ProseMirror,
  useEditorEffect,
  useEditorState,
  useNodeViews,
  useEditorEventCallback,
  useEditorEventListener,
  ReactNodeViewConstructor,
} from "@nytimes/react-prosemirror";

import {
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  addRowAfter,
  addRowBefore,
  deleteRow,
  mergeCells,
  splitCell,
  setCellAttr,
  toggleHeaderRow,
  toggleHeaderColumn,
  toggleHeaderCell,
  goToNextCell,
  deleteTable,
} from 'prosemirror-tables';

import {
  tableEditing,
  columnResizing,
  tableNodes,
  fixTables
} from 'prosemirror-tables';

const nodes = {
  doc: { content: "block" },
  paragraph: { group: "block", content: "inline*" },
  text: { group: "inline" },
};

const schema = new Schema({
  nodes: (new Schema({nodes})).spec.nodes.append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'block+',
      cellAttributes: {
        background: {
          default: null,
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `background-color: ${value};`;
          },
        },
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

let initialEditorState = EditorState.create({
  schema,
  plugins: [
    keymap(baseKeymap),
    columnResizing(),
    tableEditing(),
    keymap({
      Tab: goToNextCell(1),
      'Shift-Tab': goToNextCell(-1),
    }),
  ],
});

const fix = fixTables(initialEditorState);
if (fix) initialEditorState = initialEditorState.apply(fix.setMeta('addToHistory', false));

function dataFromContent(ctx, content) {
  let data
  content.forEach((child, offset, index) => {
    const { type, content, text } = child;
    switch(type.name) {
    case "table":
      data = dataFromContent(ctx, content);
      break;
    case "table_row":
      if (index === 0) {
        data = { cols: [].concat(dataFromContent(ctx, content)), ...data };
        ctx = Object.assign(ctx, data);
      } else {
        data.rows = (data.rows || []).concat(dataFromContent(ctx, content));
      }
      break;
    case "table_header":
      if (index === 0) {
        data = [];
      }
      data.push(dataFromContent(ctx, content));
      break;
    case "table_cell":
      data = data || {};
      data[ctx.cols[index]] = dataFromContent(ctx, content);
      break;
    case "paragraph":
      data = dataFromContent(ctx, content);
      break;
    case "text":
      data = text;
      break;
    default:
      break;
    }
  });
  return data;             
}

function TableEditor({ reactNodeViews, name, data, setState }) {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [ mount, setMount ] = useState<HTMLDivElement | null>(null);
  const [ editorState, setEditorState ] = useState(initialEditorState);
  return (
    <div>
      <ProseMirror
        mount={mount}
        defaultState={initialEditorState}
        dispatchTransaction={
          (tr) => {
            setEditorState((s) => {
              return s.apply(tr);
            });
            if (mount) {
              const doc = DOMParser.fromSchema(schema).parse(mount);
              setState({
                ...data,
                [name]: dataFromContent({}, doc.content),
              });
            }
          }
        }
        nodeViews={nodeViews}
        >
        <div ref={setMount} />
        { renderNodeViews() }
      </ProseMirror>
      </div>
  );
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const buildTable = ({ name, data, cols }) => {
  return function Table() {
    const { table_name, row_name, desc, rows = [] } = data[name];
    cols = cols || data[name].cols;
    useEditorEventListener("blur", (view, event) => {
      let tr = view.state.tr
      view.dispatch(tr);
    });
    if (data === undefined || data[name] === undefined) {
      return <div />;
    }
    return (
      <div className="">
        <div className="flow-root">
          <div className="my-0">
            <div className="inline-block min-w-full py-0 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {
                      cols.map((col, index) => (
                        <th key={index} scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-0">
                          {col.toUpperCase()}
                        </th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {
                    rows.map((row, index) => (
                      <tr key={index}>
                        {
                          cols.map((col, index) => (
                            <td key={index}
                                className={classNames(
                                  row.styles && row.styles[col] || "",
                                  "whitespace-nowrap text-xs font-medium text-gray-900 sm:pl-0")}
                            >
                              {row[col]}
                            </td>
                          ))
                        }
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const buildStaticTable = ({ name, data, cols }) => {
  return function Table() {
    const { table_name, row_name, desc, rows = [] } = data[name];
    cols = cols || data[name].cols;
    if (data === undefined || data[name] === undefined) {
      return <div />;
    }
    return (
      <div className="">
        <div className="flow-root">
          <div className="my-0">
            <div className="inline-block min-w-full py-0 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {
                      cols.map((col, index) => (
                        <th key={index} scope="col" className="pb-1 pt-5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-2">
                          {col.toUpperCase()}
                        </th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {
                    rows.map((row, index) => (
                      <tr key={index} className="mx-2 px-2">
                        {
                          cols.map((col, index) => (
                            <td key={index}
                                className={classNames(
                                  row.styles && row.styles[col] || "",
                                  "whitespace-nowrap ml-0 my-0 py-0 pl-0 pr-3 text-xs font-medium text-gray-900 sm:pl-0"
                                )}
                            >
                              {
                                col === "QTY" &&
                                  <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    max="10"
                                    defaultValue="1"
                                    className="ring-inset hover:ring-2 ring-gray-400 text-xs py-2 my-0 border-0 outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400"
                                  />
                                  || <div className="whitespace-nowrap ml-0 my-2 py-0 pl-0 pr-3 text-xs font-medium text-gray-900 sm:pl-2">
                                       {row[col]}
                                     </div>
                              }
                            </td>
                          ))
                        }
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export function EditableTable({ name, data, setState, cols }) {
  const [ showEditor, setShowEditor ] = useState(false);
  const [ rectNodeViews, setReactNodeViews ] = useState();
  const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
    paragraph: () => ({
      component: buildTable({ name, data, cols }),
      dom: document.createElement("div"),
      contentDOM: document.createElement("div"),
    }),
  };
  useEffect(() => {
    // To avoid SSR of the editor.
    setShowEditor(true);
  }, []);
  return (
    showEditor &&
      <TableEditor
        reactNodeViews={reactNodeViews}
        name={name}
        data={data}
        setState={setState}
      /> || <div />
  );
}

export function StaticTable({ name, data, setState, cols }) {
  return buildStaticTable({ name, data, cols })();
}
