import React, { useState, useEffect} from 'react';
import useSWR from 'swr';
//import { getData } from '../utils/swr/fetchers';
//import { Form } from "@grafticode/l0002";
import { TextEditor } from "./TextEditor";
import { createState } from "../lib/state";

const isNullOrEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

const getHelp = prompt => (
  prompt.indexOf("code:") >= 0 && {
    type: "code",
    text: prompt.slice(prompt.indexOf("code:") + "code:".length).trim()
  } || {
    text: prompt,
  }
);

export const HelpPanel = ({
  help,
  setHelp,
}) => {
  const [ data, setData ] = useState({});
//  const [ prompts, setPrompts ] = useState([]);
  // const [ doGetData, setDoGetData ] = useState(false);
  const [ doRecompile, setDoRecompile ] = useState(false);
  const [ state ] = useState(createState({}, (data, { type, args }) => {
    // console.log("HelpPanel state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "update":
      setHelp(help => [
        {
          user: args.content,
          help: getHelp(args.content),
        },
        ...help,
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

  return (
    <div>
      <TextEditor state={state} />
      {
        help.map((prompt, index) => (
          <div key={index} className="">
            <div className="text-left text-sm font-sans py-2 m-2">
              {
                prompt.help.type === "code" &&
                  <div className="font-mono text-xs p-2 border border-1">{prompt.help.text}</div> ||
                  <div className="text-sm">{prompt.help.text}</div>
              }
            </div>
            <p className="text-left text-sm font-sans rounded-lg p-4 m-2 mt-4 bg-gray-100">
              {prompt.user}
            </p>
          </div>
        ))
      }
    </div>
  );
}
