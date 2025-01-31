import React, { useState, useEffect} from 'react';
import useSWR from 'swr';
//import { getData } from '../utils/swr/fetchers';
//import { Form } from "@graffiticode/l0002";
import { TextEditor } from "./TextEditor";

const isNullOrEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

export const HelpPanel = ({
  id,
  user,
}) => {
  console.log(
    "HelpPanel",
    "id=" + JSON.stringify(id, null, 2)
  );
  const [ data, setData ] = useState({});
  // const [ doGetData, setDoGetData ] = useState(false);

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
    <TextEditor
      state={{
        apply: () => {},
        data
      }}
    />
  );
}
