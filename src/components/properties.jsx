import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup } from '@headlessui/react'
import { Switch } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { createState } from "../lib/state";
import { getLanguageAsset } from "../lib/api";
import useSWR from 'swr';
import { compile, postTask } from '../utils/swr/fetchers';
import FormView from "./FormView.jsx";

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

export const Properties = ({ id, lang, height, setId: setOuterId, user, setSaveDisabled }) => {
  const [ schema, setSchema ] = useState({});
  const [ taskId, setTaskId ] = useState();
  const [ outerTaskId, setOuterTaskId ] = useState();
  const [ dataId, setDataId ] = useState(id);
  const [ doPostTask, setDoPostTask ] = useState(false);

  const setId = newDataId => {
    // Only set outer id if this change is from the props editor.
    const newId = getId({taskId: outerTaskId, dataId: newDataId.split("+").slice(1)});
    setOuterId(newId);
    setSaveDisabled(false);
  };

  useEffect(() => {
    const { taskId, dataId } = parseId(id);
    if (id) {
      setOuterTaskId(taskId);
    }
    if (taskId !== outerTaskId) {
      setDataId(dataId || taskId);
    }
  }, [id]);

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
      !taskId &&
      <div /> ||
      <FormView
        height={height}
        key="props"
        lang="0011"
        id={getId({taskId, dataId})}
        setId={setId}
      />
  );
}
