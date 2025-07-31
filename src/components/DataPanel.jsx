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

  const { data: fetchedData } = useSWR(
    user && id ? [`getData-${id}`, { user, id }] : null,
    ([_, params]) => getData(params)
  );

  useEffect(() => {
    if (fetchedData) {
      console.log(
        "DataPanel()",
        "fetchedData=" + JSON.stringify(fetchedData, null, 2),
      );
      setData(fetchedData);
    }
  }, [fetchedData]);

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
