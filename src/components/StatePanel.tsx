import React, { useState, useEffect} from 'react';
import useSWR from 'swr';
import { getData } from '../utils/swr/fetchers';
import { Form } from "@graffiticode/l0002";

const isNullOrEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

export const StatePanel = ({ id, lang, height, user, setSaveDisabled }) => {
  const [ data, setData ] = useState({});
  const [ doGetData, setDoGetData ] = useState(false);

  useEffect(() => {
    setDoGetData(true);
  }, [id]);

  const getDataResp = useSWR(
    doGetData && { user, id } || null,
    getData
  );

  if (getDataResp.data) {
    const data = getDataResp.data;
    console.log("StatePanel() data=" + JSON.stringify(data, null, 2));
    setData(data);
    setDoGetData(false);
  }

  return (
    isNullOrEmptyObject(data) &&
      <div /> ||
      <Form
        state={{apply: () => {}, data}}
      />
  );
}
