import React, { useState, useEffect, forwardRef } from 'react';
import useSWR from 'swr';
import { getData } from '../utils/swr/fetchers';
import { Form } from "@graffiticode/l0012";

const isNullOrEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

export const DataPanel = forwardRef(function DataPanel({
  id,
  user,
}, ref) {
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
    setData(data);
    setDoGetData(false);
  }

  return (
    isNullOrEmptyObject(data) &&
      <div /> ||
      <div ref={ref}>
        <Form
          state={{
            apply: () => {},
            data
          }}
        />
      </div>
  );
})
