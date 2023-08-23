import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as d3 from 'd3';
import useSWR from 'swr';
import { compile } from '../utils/swr/fetchers';
import { useD3 } from '../utils/hooks/use-d3';
import { EditableTable, StaticTable } from '../components/table-editor.tsx';

function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}

const editIcon =
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>


const plusIcon =
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M12 5.25a.75.75 0 01.75.75v5.25H18a.75.75 0 010 1.5h-5.25V18a.75.75 0 01-1.5 0v-5.25H6a.75.75 0 010-1.5h5.25V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>

const tabs = [
  { name: 'Shipping', href: '#', current: false },
  { name: 'Items', href: '#', current: true },
  { name: 'Playground', href: '#', current: false },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Tabs({ currentTab, setTab }) {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-1 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          defaultValue={tabs[currentTab].name}
          onChange={(e) => {
            setTab(tabs.findIndex(tab => tab.name === e.target.value || 0));
          }}
        >
          {tabs.map(tab => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab, index) => (
              <a
                key={index}
                href={tab.href}
                className={classNames(
                  currentTab === index
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium'
                )}
                aria-current={tab.current ? 'page' : undefined}
                onClick={() => setTab(index)}
              >
                {tab.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
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

function Table({ table_name, row_name, desc, cols, rows }) {
  return (
    <div className="pt-10">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          { /*<h1 className="text-base font-semibold leading-6 text-gray-900">
            {table_name}
            </h1> */
          }
          <p className="mt-2 text-sm text-gray-700">
            { desc }
          </p>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  {
                    cols.map((col, index) => (
                      <th key={index} scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-0">
                        {col}
                      </th>
                    ))
                  }
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {
                  rows.map((row, index) => (
                    <tr key={index}>
                      {
                        cols.map((col, index) => (
                          <td key={index} className="whitespace-nowrap py-2 pl-4 pr-3 text-xs font-medium text-gray-900 sm:pl-0">
                            {row[col]}
                          </td>
                        ))
                      }
                      <td className="relative pl-0 pr-4">
                        <a href="#" className="text-gray-600 hover:text-gray-900">
                          <svg width="16" height="18">
                            {editIcon}
                          </svg>
                          <span className="sr-only">Edit {row_name}</span>
                        </a>
                      </td>
                    </tr>
                  ))
                }
                <tr className="mt-4 sm:mt-0 w-full">
                  <td className="py-4 pl-0">
                    <button type="button" title={`Add ${row_name}`}>
                      { plusIcon }
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

import sampleData from "./sampleData.json";

const toNumber = s => s === "number" ? s : Number.parseFloat(s);

function DollarInput({ name, label, data, setState }) {
  const value = data[name];
  return (
    <div className="mx-1">
      <label htmlFor="text" className="block text-xs font-medium leading-6 text-gray-400">
        { label }
      </label>
      <div className="mt-1 flex flex-row">
        <span
          className="block w-auto rounded-md px-2 py-1 mr-2 text-gray-400 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 hover:ring-gray-600 sm:text-sm sm:leading-6"
            > $
          <input
            type="text"
            name={name}
            id={name}
            defaultValue={value}
            className="my-0 py-0 w-auto border-none focus:ring-0 outline-none focus:outline-none px-0.5 mr-2 text-gray-900 placeholder:text-gray-400 sm:text-sm sm:leading-6"
            onBlur={() => {
              setState({
                ...data,
                [name]: document.getElementById(name).value,
              })
            }}
          />
        </span>
      </div>
    </div>
  )
}

const getYAxisValue = (d, n) => {
  let v;
  switch (n) {
  case "Net Profit":
    v = d.profit;
    break;
  case "Net Margin":
  default:
    v = d.margin;
    v = v === null ? Number.NaN : v * 100;
    break;
  }
  return v === null && Number.NaN || v;
}

const LineChart = ({ data, yAxisName }) => {
  const ref = useD3(
    (svg) => {
      // Specify the chart’s dimensions.
      const width = 928;
      const height = 400;
      const marginTop = 20;
      const marginRight = 20;
      const marginBottom = 30;
      const marginLeft = 30;

      // Create the positional scales.
      const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.quantity))
            .range([marginLeft, width - marginRight]);

      const y = d3.scaleLinear()
            .domain([d3.min(data, d => getYAxisValue(d, yAxisName)), d3.max(data, d => getYAxisValue(d, yAxisName))]).nice()
            .range([height - marginBottom, marginTop]);

      // Create the SVG container.
      svg
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; overflow: visible; font: 18px sans-serif;");

      // Add the horizontal axis.
      svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .attr("style", "font: 18px sans-serif; color: #aaa")
        .call(d3.axisBottom(x).ticks(width / 100).tickSizeOuter(0));

      // Add the vertical axis.
      svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .attr("style", "font: 18px sans-serif; color: #aaa")
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
              .attr("x2", width - marginLeft - marginRight)
              .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
              .attr("x", -marginLeft)
              .attr("y", -10)
              .attr("fill", "currentColor")
              .attr("text-anchor", "start")
              .attr("style", "font: 18px sans-serif")
              .text(`↑ ${yAxisName} ${yAxisName === "Net Margin" && "(%)" || "($)"}`));


      // Compute the points in pixel space as [x, y, z], where z is the name of the series.
      const points = data.map((d) => {
        return [
          x(d.quantity),
          y(getYAxisValue(d, yAxisName)),
          d.item,
          getYAxisValue(d, yAxisName),
        ]
      });

      // Group the points by series.
      const groups = d3.rollup(points, v => Object.assign(v, {z: v[0][2]}), d => d[2]);

      // Draw the lines.
      const line = d3.line();
      const path = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .selectAll("path")
            .data(groups.values())
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("d", line);

      // Add an invisible layer for the interactive tip.
      const dot = svg.append("g")
            .attr("display", "none");

      dot.append("circle")
        .attr("r", 2.5);

      dot.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -8);

      svg
        .on("pointerenter", pointerentered)
        .on("pointermove", pointermoved)
        .on("pointerleave", pointerleft)
        .on("touchstart", event => event.preventDefault());

      // When the pointer moves, find the closest point, update the interactive tip, and highlight
      // the corresponding line. Note: we don't actually use Voronoi here, since an exhaustive search
      // is fast enough.
      function pointermoved(event) {
        const [xm, ym] = d3.pointer(event);
        const i = d3.leastIndex(points, ([x, y]) => Math.hypot(x - xm, y - ym));
        const [x, y, k, v] = points[i];
        path.style("stroke", ({z}) => z === k ? null : "#ddd").filter(({z}) => z === k).raise();
        dot.attr("transform", `translate(${x},${y})`);
        dot.select("text").text(`${k}: ${yAxisName === "Net Profit" && "$" || ""}${v.toFixed(2)}${yAxisName === "Net Margin" && "%" || ""}`);
        svg.property("value", data[i]).dispatch("input", {bubbles: true});
      }

      function pointerentered() {
        path.style("mix-blend-mode", null).style("stroke", "#ddd");
        dot.attr("display", null);
      }

      function pointerleft() {
        path.style("mix-blend-mode", "multiply").style("stroke", null);
        dot.attr("display", "none");
        svg.node().value = null;
        svg.dispatch("input", {bubbles: true});
      }

    },
    [data.length]
  );

  return (
    <svg
      ref={ref}
      className="mt-10"
      style={{
        height: 500,
        width: "100%",
        marginRight: "0px",
        marginLeft: "0px",
      }}
    >
      <g className="plot-area" />
      <g className="x-axis" />
      <g className="y-axis" />
    </svg>
  );
}

function ChartDropdown({ data, setState }) {
  return (
    <div>
      <select
        id="net"
        name="net"
        className="mt-2 block w-36 rounded-md border-0 py-1.5 pl-2 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
        value={data.yAxisName || "Net Margin"}
        onChange={(e) => setState(s => ({ ...data, yAxisName: e.target.value }))}
      >
        <option>Net Margin</option>
        <option>Net Profit</option>
      </select>
    </div>
  )
}

// {rows: data.profits, cols: ["item", "profit", "margin", "shipping"] }

function makeProfitsTable({ data }) {
  const rows = [];
  data.profits && data.profits.forEach(row => {
    if (row.quantity === 1) {
      rows.push({
        "QTY": "1",
        "PROFIT": row.profit && `$${row.profit.toFixed(2)}` || "",
        "MARGIN": row.margin && `${(row.margin * 100).toFixed(2)}%` || "",
        "SHIPPING": row.shipping,
        styles: {
          PROFIT: row.profit < 0 && "text-red-500" || "",
          MARGIN: row.margin < 0 && "text-red-500" || row.margin < 0.5 && "text-yellow-500" || "",
          SHIPPING: row.shipping === "Free" && "bg-green-100" || "",
        },
      });
    }
  });
  const profits = {
    cols: [
      "QTY",
      "PROFIT",
      "MARGIN",
      "SHIPPING",
    ],
    rows,
  };
  return { profits };
}

const PlaygroundForm = ({ setState, isLoading, data }) => {
  const { items, prices, profits, yAxisName = "Net Margin" } = data;
  if (profits === undefined) {
    return <div />;
  }
  return (
    <div key={ticket++}>
      <div className="grid grid-cols-3 ml-10">
        <div className="col-span-2 px-10 py-4 mb-4 mr-2 border border-1 rounded-md">
          <LineChart data={profits} yAxisName={yAxisName}/>
          <ChartDropdown data={data} setState={setState}/>
        </div>
        <div className="col-span-1 px-2 pl-4 pt-4 mb-4 ml-2 mr-10 border border-1 rounded-md">
          {/*
             <div className="mx-1 block text-xs font-medium leading-6 text-gray-400">
            Combined Net Margin
          </div>
          <div className="pb-4 text-3xl mx-1">
            120%
            </div>
           */}
          <DollarInput
            name="shippingFee"
            label="Flat rate shipping price"
            placeholder="12.95"
            data={data}
            setState={setState}
          />
          <div className="m-4" />
          <DollarInput
            name="shippingBreak"
            label="Free shipping on orders over"
            placeholder="30.00"
            data={data}
            setState={setState}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 my-0 divide-x-2">
        <div className="col-span-1 ml-10 pr-4">
          <StaticTable name="items" data={data} cols={["Item", "Desc"]} setState={setState} />
        </div>
        <div className="col-span-1 rounded-md rounded-md">
          <EditableTable name="prices" data={data} setState={setState} />
        </div>
        <div className="col-span-1 mr-10 rounded-md pl-4">
          <div className="grid grid-cols-6">
            <div className="col-span-1">
              <StaticTable
                name="profits"
                data={makeProfitsTable({ data })}
                cols={["QTY"]}
                setState={setState}
              />
            </div>
            <div className="col-span-5">
              <StaticTable
                name="profits"
                data={makeProfitsTable({ data })}
                cols={["PROFIT", "MARGIN", "SHIPPING"]}
                setState={setState}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ItemsForm = ({ setState, isLoading, data }) => {
  const { items } = data;
  if (items === undefined) {
    return <div />;
  }
  const { table_name, row_name, desc, cols, rows } = items;
  return (
    <div key={ticket++} className="">
      <div className="grid grid-cols-2 my-0 divide-x-2">
        <div className="col-span-1 ml-10 rounded-md">
          <EditableTable name="items" data={data} setState={setState} />
        </div>
        <div className="col-span-1 mr-10 rounded-md">
          <EditableTable name="prices" data={data} setState={setState} />
        </div>
      </div>
    </div>
  );
}

const ShippingForm = ({ setState, isLoading, data }) => {
  const { shipping } = data;
  if (shipping === undefined) {
    return <div />;
  }
  const { table_name, row_name, desc, cols, rows } = shipping;
  return (
    <div key={ticket++} className="w-96">
      <EditableTable name="shipping" data={data} setState={setState} />
    </div>
  );
}

const DefaultForm = () => {
  const router = useRouter();
  const { id, url, access_token } = router.query;
  return Form({ id, url, access_token });
}

export const Form = ({ id, url, user, access_token }) => {
  const router = useRouter();
  const [ tab, setTab] = useState(2);
  const [ state, setState] = useState({});
  const [ lastId, setLastId ] = useState(id);
  const resp = useSWR(
    (access_token || user) && id && url && {
      access_token,
      user,
      url,
      id,
      data: state,
    },
    compile
  );

  const isLoading = resp.isLoading;
  // If isLoading, then 'state' is still current.
  const data = {
    ...state,
    ...resp.data?.data,
  };

  if (data.error) {
    // TODO verify that this works.
    return <div />;
  }

  if (!isLoading && resp.data?.id && resp.data.id !== lastId) {
    router.push(router.pathname + "?id=" + resp.data.id, null, { shallow: true });
    setLastId(resp.data.id);
  }

  let elts;
  switch (tab) {
  case 0:
    elts = ShippingForm({ setState, isLoading, data });
    break;
  case 1:
    elts = ItemsForm({ setState, isLoading, data });
    break;
  case 2:
  default:
    elts = PlaygroundForm({ setState, isLoading, data });
    break;
  }
  return (
    <div id="graffiti" className="flex flex-col sm:px-6 lg:px-8">
      <Tabs currentTab={tab} setTab={setTab} />
      <div className="pt-10">
        { elts }
      </div>
    </div>
  );
}

export default DefaultForm;
