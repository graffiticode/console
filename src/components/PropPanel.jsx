import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup } from '@headlessui/react'
import { Switch } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { createState } from "../lib/state";
import { getLanguageAsset } from "../lib/api";
import useSWR from 'swr';
import { getData, postTask } from '../utils/swr/fetchers';
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

export const PropPanel = ({
  data,
  lang,
  setData,
  user,
}) => {
  const [ schema, setSchema ] = useState({});
  const [ taskId, setTaskId ] = useState();
  const [ doPostTask, setDoPostTask ] = useState(false);
  const [ state ] = useState(createState({}, (data, { type, args }) => {
    // console.log("PropPanel() apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "update":
      const updatedData = {
        ...data,
        ...args,
      };
      setData(updatedData);
      return updatedData;
    default:
      console.error(false, `PropPanel() unimplemented action type: ${type}`);
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
