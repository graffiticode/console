import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup } from '@headlessui/react'
import { Switch } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { createState } from "../lib/state";
import { getLanguageAsset } from "../lib/api";
import useSWR from 'swr';
import { compile, getData, postTask } from '../utils/swr/fetchers';
import FormView from "./FormView.jsx";

const getId = ({ taskId, dataId }) =>
      taskId && dataId && `${taskId}+${dataId}` ||
      taskId ||
      "";

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
  accessToken,
  id,   // current state of the view
  lang,
  height,
  user,
  setSaveDisabled,
  setData,
}) => {
  const [ schema, setSchema ] = useState({});
  const [ taskId, setTaskId ] = useState();
  const [ doPostTask, setDoPostTask ] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const schema = await getLanguageAsset(`L${lang}`, "schema.json") || "{}";
        setSchema(schema);
        setDoPostTask(true);
      } catch (x) {
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

  useEffect(() => {
    if (postTaskResp.data) {
      const taskId = postTaskResp.data;
      setTaskId(taskId);
      setDoPostTask(false);
    }
  }, [postTaskResp?.data]);

  return (
    !schema &&
      <div className="px-2 text-sm">No schema available.</div> ||
      <FormView
        key="form"
        accessToken={accessToken}
        id={getId({taskId: taskId, dataId: id})}
        lang={lang}
        setData={setData}
        className="border border-gray-300 rounded-none overflow-auto p-2 resize"
      />
  );
}
