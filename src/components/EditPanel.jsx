import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup } from '@headlessui/react'
import { Switch } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { createState } from "../lib/state";
import { getLanguageAsset } from "../lib/api";
import useSWR from 'swr';
import { compile, getData, postTask } from '../utils/swr/fetchers';
import { Form } from "@graffiticode/l0011";

const getId = ({ taskId, dataId }) => (
  taskId && dataId && `${taskId}+${dataId}` ||
    taskId ||
    ""
);

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

/*
  -- get task id for l0011 + schema
  -- use subject id as data id
  -- render the form view using task and data ids
  -- listen for data updates from form view
  -- 
 */

export const EditPanel = ({
  data,
  lang,
  setData,
  user,
}) => {
  const [ schema, setSchema ] = useState({});
  const [ taskId, setTaskId ] = useState();
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ state, setState ] = useState(createState({}, (data, { type, args }) => {
    // console.log("EditPanel() apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "init":
      return {
        ...args,
      };
    case "compile":
      return {
        ...data,
        ...args,
      };
    case "update":
      const updatedData = {
        ...data,
        ...args,
      };
      setData(updatedData);
      return updatedData;
    default:
      console.error(false, `EditPanel() unimplemented action type: ${type}`);
      return data;
    }
  }));

  useEffect(() => {
    state.apply({
      type: "update",
      args: data,
    });
  }, [JSON.stringify(data)]);

  useEffect(() => {
    (async () => {
      try {
        const schema = JSON.parse(await getLanguageAsset(`L${lang}`, "schema.json") || "{}");
        setSchema(schema);
        setDoPostTask(true);
        state.apply({
          type: "update",
          args: { schema },
        });
      } catch (x) {
        console.log(x.stack);
        console.error(`No schema available for L${lang}.`);
        setSchema(undefined);
      }
    })();
  }, []);

  // Get taskId from schema as L0011 code.
  const postTaskResp = useSWR(
    doPostTask && schema && { user, lang: "0011", code: `{schema: ${schema}}..` } || null,
    postTask
  );

  if (postTaskResp?.data) {
    const taskId = postTaskResp.data;
    setTaskId(taskId);
    setDoPostTask(false);
  }

  return (
    !schema &&
      <div className="px-2 text-sm">No schema available.</div> ||
      <Form state={state} />
  );
}
