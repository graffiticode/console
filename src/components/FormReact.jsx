import { useState, useEffect } from 'react';
import useSWR from 'swr';
//import { Form } from "@graffiticode/l0002";
import { Form } from "../dist/index.js";
//import { Button } from "../../../l0002/packages/rollup-react-library-starter/dist/cjs/bundle.js";
//import { Button } from "../../../l0002/packages/parcel/dist/index.js";
import { createState } from "../lib/state";
import { compile } from '../utils/swr/fetchers';

function isNonNullNonEmptyObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null &&
      Object.keys(obj).length > 0
  );
}

export const FormReact = ({
  lang,
  id,
  setId,
  data,
  className,
  height,
  user,
}) => {
  console.log("FormReact() id=" + id);
  return <Form label="foo" />;
  const [ recompile, setRecompile ] = useState(true);
  useEffect(() => {
    // If `id` changes, then recompile.
    if (id) {
      setRecompile(true);
    }
  }, [id]);

  const [ state ] = useState(createState({}, (data, { type, args }) => {
    console.log("FormReact() type=" + type + " args=" + JSON.stringify(args));
    switch (type) {
    case "compiled":
      return {
        ...data,
        ...args,
      };
    case "change":
      setRecompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  const resp = useSWR(
    recompile && user && id && {
      user,
      id,
      data: state.data,
    },
    compile
  );

  if (resp.data) {
    state.apply({
      type: "compiled",
      args: resp.data,
    });
    setRecompile(false);
  }

  console.log("FormReact() state=" + JSON.stringify(state, null, 2));
  return (
    isNonNullNonEmptyObject(state.data) &&
      <Form state={state} /> ||
      <div />
  );
}
