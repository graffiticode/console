import React, { useState, useEffect} from 'react';
import useSWR from 'swr';
//import { getData } from '../utils/swr/fetchers';
//import { Form } from "@grafticode/l0002";
import { TextEditor } from "./TextEditor";
import { createState } from "../lib/state";

const isNullOrEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

export const HelpPanel = ({
  id,
  user,
}) => {
  const [ data, setData ] = useState({});
  const [ prompts, setPrompts ] = useState([]);
  // const [ doGetData, setDoGetData ] = useState(false);
  const [ doRecompile, setDoRecompile ] = useState(false);
  const [ state ] = useState(createState({}, (data, { type, args }) => {
    // console.log("HelpPanel state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    // case "init":
    //   setDoRecompile(true);
    //   return {
    //     ...args,
    //   };
    // case "compile":
    //   return {
    //     ...data,
    //     ...args,
    //   };
    case "update":
      setPrompts(prompts => [
        {user: args.content, help: "helpful response to \"" + args.content + "\""},
        ...prompts,
      ]);
      setData("Generated response here>")
      setDoRecompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  // const compileResp = useSWR(
  //   doRecompile && accessToken && id && {
  //     accessToken,
  //     id,
  //     data: state.data,
  //   },
  //   compile
  // );

  // if (compileResp.data) {
  //   state.apply({
  //     type: "compile",
  //     args: compileResp.data,
  //   });
  //   setDoRecompile(false);
  // }

  // useEffect(() => {
  //   setDoGetData(true);
  // }, [id]);

  // const getDataResp = useSWR(
  //   doGetData && { user, id } || null,
  //   getData
  // );

  // if (getDataResp.data) {
  //   const data = getDataResp.data;
  //   setData(data);
  //   setDoGetData(false);
  // }

  console.log(
    "HelpPanel",
    "prompts=" + JSON.stringify(prompts, null, 2),
  );
  return (
    <div>
      <TextEditor state={state} />
      {
        prompts.map(prompt => (
          <div className="">
            <p className="text-left text-sm font-sans rounded-lg p-4 m-2 mt-4 bg-gray-100">
            {prompt.user}
            </p>
            <p className="text-left text-sm font-sans p-2 pl-0 m-2">
            {prompt.help}
            </p>
          </div>
        ))
      }
    </div>
  );
}
