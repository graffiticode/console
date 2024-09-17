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

export const StatePanel = ({ id, lang, height, user, setSaveDisabled }) => {
  const [ taskId, setTaskId ] = useState("");
  const [ doPostTask, setDoPostTask ] = useState(true);

  const postTaskResp = useSWR(
    doPostTask && { user, lang: "0001", code: "data {}.." } || null,
    postTask
  );

  if (postTaskResp.data) {
    const taskId = postTaskResp.data;
    setTaskId(taskId);
    setDoPostTask(false);
  }

  return (
    !taskId &&
      <div /> ||
      <FormView
        height={height}
        key="props"
        lang="0001"
        id={getId({taskId, dataId: id})}
      />
  );
}
