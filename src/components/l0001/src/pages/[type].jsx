import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { compile } from '../swr/fetchers';
import useSWR from 'swr';
import { Form } from "../components/form";
import { createState } from "../lib/state";

const View = ({ accessToken, id }) => {
  const [ recompile, setRecompile ] = useState(true);
  useEffect(() => {
    // If `id` changes, then recompile.
    setRecompile(true);
  }, [id]);

  const [ state ] = useState(createState({}, (data, { type, args }) => {
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
    recompile && accessToken && id && {
      accessToken,
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

  return (
    <Form state={state} />
  );
}

export default View;
