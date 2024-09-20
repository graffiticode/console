import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup } from '@headlessui/react'
import { Switch } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { createState } from "../lib/state";
import { getLanguageAsset } from "../lib/api";
import useSWR from 'swr';
import { compile, getData, postTask } from '../utils/swr/fetchers';
import { Form } from "@graffiticode/l0011";
//import { Form } from "./l0011";

const getId = ({ taskId, dataId }) => dataId && `${taskId}+${dataId}` || taskId;

const parseId = id => {
  if (id === undefined) {
    return {};
  }
  const parts = id.split("+");
  return {
    taskId: parts[0],
    dataId: parts.slice(1).join("+"),
  };
};

export const Properties = ({
  id,   // current state of the view
  lang,
  user,
  state: editorState,
}) => {
  const [ data, setData ] = useState({});
  const [ schema, setSchema ] = useState(null);
  const [ taskId, setTaskId ] = useState();
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ doRecompile, setDoRecompile ] = useState(false);
  const [ doGetData, setDoGetData ] = useState(false);
  const [ state ] = useState(createState({}, (data, { type, args }) => {
    // console.log("Properties() state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "compile":
      // we have new properties
      setDoRecompile(false);
      return {
        ...data,
        ...args,
      };
    case "change":
      // A setting has changed, so recompile to get a new id.
      setDoRecompile(true);
      editorState.apply({
        type: "dataChange",
        args,
      });
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  useEffect(() => {
    (async () => {
      try {
        const schema = await getLanguageAsset(`L${lang}`, "schema.json") || "{}";
        setSchema(JSON.parse(schema));
        setDoPostTask(true);
      } catch (x) {
        console.error(`No schema available for L${lang}.`);
        setSchema(null);
      }
    })();
  }, []);

  useEffect(() => {
    setDoGetData(true);
  }, [id]);

  const getDataResp = useSWR(
    doGetData && taskId && id && user && {
      id: `${taskId}+${id}`,
      user,
    },
    getData
  );
  
  if (getDataResp.data) {
    const data = getDataResp.data;
    setData(data);
    setDoGetData(false);
    state.apply({
      type: "compile",
      args: data,
    })
  }

  // Get taskId from schema as L0011 code.
  const postTaskResp = useSWR(
    doPostTask && schema && { user, lang: "0011", code: `{schema: ${JSON.stringify(schema)}}..` } || null,
    postTask
  );

  useEffect(() => {
    if (postTaskResp.data) {
      const taskId = postTaskResp.data;
      setTaskId(taskId);
      setDoPostTask(false);
    }
  }, [postTaskResp?.data]);

  const compileResp = useSWR(
    doRecompile && taskId && user && {
      id: taskId,
      data: state.data,
      user,
    },
    compile
  );

  if (compileResp.data) {
    state.apply({
      type: "compile",
      args: compileResp.data.data,
    });
    setDoRecompile(false);
  }

  return (
    !schema &&
      <div className="px-2 text-sm">No schema available.</div> ||
      <Form state={state} schema={schema} />
  );
}
