import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as d3 from 'd3';
import bent from "bent";

const getJSON = bent("json");

function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}

function renderAttr(attr) {
  Object.keys(attr).forEach(key => {
    if (key.indexOf('on') === 0) {
      attr[key] = new Function('e', attr[key]);
    }
  });
  return attr;
}

let ticket = 1;

function renderJSON(data, depth = 0) {
  const x = depth * 15;
  if (Array.isArray(data)) {
    const elts = data.map(dat => {
      const val = renderJSON(dat, depth + 1);
      return <tspan key={ticket++} x={x + 15} dy="1rem">{val}</tspan>
    });
    return (
      <>
        <tspan key={ticket++} x={x} dy="1rem">[</tspan>
        {elts}
        <tspan key={ticket++} x={x} dy="1rem">]</tspan>
      </>
    );
  } else if (isNonNullObject(data)) {
    const keys = Object.keys(data);
    const elts = keys.map(key => {
      const val = renderJSON(data[key], depth + 1);
      return <tspan key={ticket++} x={x + 15} dy="1rem">{key}: {val}</tspan>
    });
    return (
      <>
        <tspan key={ticket++} x={x} dy="1rem">{"{"}</tspan>
        {elts}
        <tspan key={ticket++} x={x} dy="1rem">{"}"}</tspan>
      </>
    );
  } else {
    return data;
  }
}

function render(data) {
  const elts = renderJSON(data);
  return <text key={ticket++} x="5" y="15" fontFamily="monospace">{elts}</text>;
}

const DefaultForm = () => {
  const router = useRouter();
  const { id, url, access_token } = router.query;
  return Form({ id, url, access_token });
}

export const Form = ({ id, url, user, access_token }) => {
  console.log("Form() url=" + url);
  const [elts, setElts] = useState([]);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const router = useRouter();
  let { data } = router.query;

  useEffect(() => {
    const bBox = d3.select("svg").node()?.getBBox();
    const width = Math.trunc(bBox?.width);
    const height = Math.trunc(bBox?.height);
    if (width !== 0 && height !== 0) {
      setWidth(2 * width);
      setHeight(2 * height);
    }
  });
  useEffect(() => {
    d3.select("svg").html("");
    (async () => {
      if (url) {
        const resp = await getJSON(url);
        data = resp.data;
      }
      if (data === undefined) {
        return;
      }
      try {
        setElts(render(data));
      } catch (x) {
        // Bad data.
        console.log("Bad data in query: " + x);
      }
    })();
  }, [url, data]);
  return (
    <div key={ticket++} id="graffiti" style={{ backgroundColor: "aliceblue" }}>
      <svg key={ticket++} x="10" width={width + 5} height={height + 15}>
        {elts}
      </svg>
    </div>
  );
}

export default DefaultForm;
