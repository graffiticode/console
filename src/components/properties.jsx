import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup } from '@headlessui/react'
import { Switch } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { createState } from "../lib/state";
import { getLanguageAsset } from "../lib/api";
import useSWR from 'swr';
import { compile, getData, postTask } from '../utils/swr/fetchers';
//import FormView from "./FormView.jsx";
import { Form } from "@graffiticode/l0011";

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

// TODO getData(id) => props; postTask(props) => propId; id=taskId+propId
// L0011 compile just merges schema (code) with props (data)

export const Properties = ({
  id,   // current state of the view
  lang,
  height,
  setId: setOuterId,
  user,
  setSaveDisabled,
  state: editorState,
}) => {
  console.log("Properties() id=" + id + " user=" + JSON.stringify(user));
  const [ schema, setSchema ] = useState({});
  const [ taskId, setTaskId ] = useState();
  // const [ outerTaskId, setOuterTaskId ] = useState();
  // const [ dataId, setDataId ] = useState(id);
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ doRecompile, setDoRecompile ] = useState(false);
  const [ doGetData, setDoGetData ] = useState(false);
  //const { taskId, dataId } = editorState.data;

  const [ state ] = useState(createState({}, (data, { type, args }) => {
    console.log("Properties() state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
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
        type: "change",
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
        console.log("Properties() schema=" + schema);
        console.log("Properties() state=" + JSON.stringify(state, null, 2));
        setSchema(schema);
        setDoPostTask(true);
      } catch (x) {
        console.error(`No schema available for L${lang}.`);
        setSchema(undefined);
      }
    })();
  }, []);

  useEffect(() => {
    // const { taskId, dataId } = parseId(id);
    // console.log("Properties() taskId=" + taskId + " dataId=" + dataId);
    // if (id) {
    //   setOuterTaskId(taskId);
    // }
    // if (taskId !== outerTaskId) {
    //   setDataId(dataId || taskId);
    // }
    setDoGetData(true);
  }, [id]);

  console.log("Properties() id=" + id + " taskId=" + taskId);
  const getDataResp = useSWR(
    doGetData && taskId && id && user && {
      id: `${taskId}+${id}`,
      user,
    },
    getData
  );
  
  console.log("Properties() getDataResp=" + JSON.stringify(getDataResp, null, 2));
  
  if (getDataResp.data) {
    setDoGetData(false);
    state.apply({
      type: "compile",
      args: getDataResp.data,
    })
  }

  // const setId = newDataId => {
  //   // Only set outer id if this change is from the props editor.
  //   const newId = getId({taskId: outerTaskId, dataId: newDataId.split("+").slice(1)});
  //   setOuterId(newId);
  //   setSaveDisabled(false);
  // };

  // Get taskId from schema as L0011 code.
  const postTaskResp = useSWR(
    doPostTask && schema && { user, lang: "0011", code: `{schema: ${schema}}..` } || null,
    postTask
  );

  useEffect(() => {
    if (postTaskResp.data) {
      const taskId = postTaskResp.data;
      console.log("Properties() taskId=" + taskId);
      setTaskId(taskId);
      setDoPostTask(false);
//      setDoRecompile(true);
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
      <Form state={state} />
  );
}
