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

export const Properties = ({ id, setId, lang, user, setProps }) => {
  const [ doCompile, setDoCompile ] = useState(false);
  const [ schema, setSchema ] = useState({});
  const [ taskId, setTaskId ] = useState("");
  const [ dataId ] = useState(id);
  const [ doPostTask, setDoPostTask ] = useState(false);

  const setDataId = dataId => {
    setId(`${id.split("+")[0]}+${dataId.split("+").slice(1)}`);
  };

  useEffect(() => {
    (async () => {
      try {
        const schema = await getLanguageAsset(`L${lang}`, "schema.json") || "{}";
        setSchema(schema);
        setDoPostTask(true);
      } catch (x) {
        console.error(`No schema available for L${lang}.`);
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

  useEffect(() => {
    if (taskId) {
      setDoCompile(true);
    }
  }, [taskId]);

  // Get data for id = taskId+dataId

  // const compileResp = useSWR(
  //   doCompile && user && id && {
  //     user,
  //     id,
  //     data: {}, // The id represents the `code+data`.
  //   },
  //   compile
  // );

  // useEffect(() => {
  //   setDoCompile(false);
  //   setProps(compileResp?.data);
  // }, [compileResp?.data]);

  return (
    <FormView key="props" lang="0011" id={`${taskId}+${dataId}`} setId={setDataId} />
  );
}
