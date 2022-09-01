import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux'
import Script from 'next/script'
import * as d3 from 'd3';

function AreaChart() {
  const [props, setProps] = useState(areaChartData);
  console.log("AreaChart() props=" + JSON.stringify(props, null, 2));
  useEffect(() => {
    (async () => {
    const c3 = await import('c3');
    let cols = props.args.vals[0];
    let rows = props.args.vals;
    let vals = [];
    let colors = props.colors;
    let showXAxis = props.hideXAxis !== true;
    let showYAxis = props.hideYAxis !== true;
    let lineWidth = props.lineWidth;
    let dotRadius = props.dotRadius;
    let chartPadding = props.chartPadding;
    let [min, max] = getRange(rows.slice(1)); // Slice off labels.
    let pad = (max - min) / 4;
    rows = rebaseValues(pad - min, rows);  // val + pad - min
    let types = {}
    types[cols[cols.length - 1]] = "area";  // Use last column as values.
    let padding = {
      top: -5,
      right: -20,
      bottom: -7,
      left: -20,
    };
    if (chartPadding) {
      if (chartPadding instanceof Array) {
        padding = {
          top: padding.top + chartPadding[0],
          right: padding.right + chartPadding[1],
          bottom: padding.bottom + chartPadding[2],
          left: padding.left + chartPadding[3],
        }
      } // Otherwise, its undefine, scalar or object, which is fine.
    }
    var chart = c3.generate({
      bindto: "#chart",
      padding: padding,
      transition: {
        duration: 0
      },
      data: {
        rows: rows,
        types: types,
      },
      legend: {
        show: false,
      },
      axis: {
        x: {
          show: showXAxis,
          padding: {
            left: 1,
            right: 1,
          },
        },
        y: {
          show: showYAxis,
          padding: {
            left: 0,
            right: 0,
          }
        },
      },
      color: {
        pattern: colors,
      },
      size: {
        width: props.width,
        height: props.height,
      },
    });
    if (lineWidth) {
      d3.selectAll(".c3-line").style("stroke-width", lineWidth)
    }
    if (dotRadius) {
      d3.selectAll(".c3-circle").attr("r", dotRadius)
    }
    })();
  });
}

function TableChart() {
  const [props, setProps] = useState(initData);
  console.log("TableChart() props=" + JSON.stringify(props, null, 2));
  useEffect(() => {
    let data = props.args.vals.slice(1); // Slice off labels.
    let style = props.style;
    let padding = props.chartPadding || 0;
    let width = props.width - 2 * padding || "100%";
    let height = props.height - 2 * padding || "100%";
    // render the table
    tabulate(data, ["Reward", "Count"]);
    if (style) {
      // Apply global styles.
      Object.keys(style).forEach(selector => {
        let styles = style[selector];
        Object.keys(styles).forEach(style => {
          d3.selectAll(selector).style(style, styles[style]);
        });
      });
    }
    
    // The table generation function
    function tabulate(data, columns) {
      d3.select("#chart").html("");
      var table = d3.select("#chart").append("svg"),
          tbody = table.append("g").classed("y-values", true);
      table
        .attr("width", width + 2 * padding)
        .attr("height", height + 2 * padding);

      // create a row for each object in the data
      let count = data.length;
      let dy = height / count;
      let textSize = +style.tspan["font-size"] || 12;
      var rows = tbody.selectAll("text")
          .data(data)
          .enter()
          .append("text")
          .attr("x", padding)
          .attr("y", (d, i) => {
            return padding + (i + 1) * dy - (dy - textSize) / 2 - 2;
          });

      var lines = tbody.selectAll("line")
          .data(data.slice(1))
          .enter()
          .append("line")
          .attr("x1", padding)
          .attr("y1", (d, i) => {
            return padding + (i + 1) * dy;
          })
          .attr("x2", width + padding)
          .attr("y2", (d, i) => {
            return padding + (i + 1) * dy;
          });
      // create a cell in each row for each column
      var cells = rows.selectAll("tspan")
          .data(function(row) {
            return columns.map(function(column, i) {
              return {column: i, value: row[i]};
            });
          })
          .enter()
          .append("tspan")
          .attr("text-anchor", (d, i) => {
            return d.column === 0 ? "start" : "end"
          })
          .attr("x", (d, i) => {
            return d.column === 0 ? padding : padding + width;
          })
          .html(function(d) {
            let text;
            if (!d.value) {
              text = String(d.value);
            } else if (d.value.length > 34) {
              let words = d.value.split(" ");
              text = "";
              for (let i = 0; text.length < 36; i++) {
                if (i) {
                  text += " ";
                }
                text += words[i];
              }
              // Now slice off the last word.
              text = text.slice(0, text.lastIndexOf(" ")) + "\u2026";
            } else {
              text = d.value;
            }
            return text;
          });
      return table;
    }
  });
}

export default function Form() {
  const [data, setData] = useState(areaChartData);
  //const data = useSelector((state) => state.data);
  var elts = render(data);
  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js" />
      <div>
        <div id="chart" className="L104">
          {elts}
        </div>
      </div>
    </>
  );
}

const getRange = (vals, grouped, min, max) => {
  // min and max are seed values is given.
  // Assert all vals are numbers.
  vals.forEach(val => {
    if (val instanceof Array) {
      let [tmin, tmax] = getRange(val);
      if (grouped) {
        // Stacked so just add them together.
        tmin = tmax = tmin + tmax;
      }
      if (!isNaN(tmin) && min === undefined || tmin < min) {
        min = tmin;
      }
      if (!isNaN(tmax) && max === undefined || tmax > max) {
        max = tmax;
      }
    } else {
      val = +val;
      if (!isNaN(val) && min === undefined || val < min) {
        min = val;
      }
      if (!isNaN(val) && max === undefined || val > max) {
        max = val;
      }
    }
  });
  return [min, max];
};

const rebaseValues = (offset, vals) => {
  let rebasedVals = [];
  vals.forEach(val => {
    if (val instanceof Array) {
      rebasedVals.push(rebaseValues(offset, val));
    } else if (!isNaN(+val)) {
      rebasedVals.push(+val + offset);
    } else {
      rebasedVals.push(val);  // Not a number so return as is.
    }
  });
  return rebasedVals;
};


function render(nodes) {
  let elts = [];
  if (!(nodes instanceof Array)) {
    // HACK not all arguments are arrays. Not sure they should be.
    nodes = [nodes];
  }
  nodes.forEach(function (n, i) {
    let args = [];
    if (n.args) {
      args = render(n.args);
    }
    switch (n.type) {
    case "container":
      elts.push(
        <div className="container" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "container-fluid":
      elts.push(
        <div className="container-fluid" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "table":
      elts.push(
        <table key={i} style={n.style} {...n.attrs}>
          {args}
        </table>
      );
      break;
    case "thead":
      elts.push(
        <thead key={i} style={n.style} {...n.attrs}>
          {args}
        </thead>
      );
      break;
    case "tbody":
      elts.push(
        <tbody className="container" key={i} style={n.style} {...n.attrs}>
          {args}
        </tbody>
      );
      break;
    case "tr":
      elts.push(
        <tr key={i} style={n.style} {...n.attrs}>
          {args}
        </tr>
      );
      break;
    case "th":
      elts.push(
        <th key={i} style={n.style} {...n.attrs}>
          {args}
        </th>
      );
      break;
    case "td":
      elts.push(
        <td key={i} style={n.style} {...n.attrs}>
          {args}
        </td>
      );
      break;
    case "row":
    case "col":
    case "col-sm":
    case "col-sm-4":
      elts.push(
        <div className={n.type} key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "col-sm":
      elts.push(
        <div className="col-sm" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "table-chart":
      elts.push(
        <TableChart key={i} style={n.style} {...n}/>
      );
      break;
    case "bar-chart":
      elts.push(
        <BarChart key={i} style={n.style} {...n}/>
      );
      break;
    case "timeseries-chart":
      elts.push(
        <TimeseriesChart key={i} style={n.style} {...n}/>
      );
      break;
    case "area-chart":
      elts.push(
        <AreaChart key={i} style={n.style} {...n}/>
      );
      break;
    case "twoColumns":
      elts.push(
        <div className="two columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "threeColumns":
      elts.push(
        <div className="three columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "fourColumns":
      elts.push(
        <div className="four columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "fiveColumns":
      elts.push(
        <div className="five columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "sixColumns":
      elts.push(
        <div className="six columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "sevenColumns":
      elts.push(
        <div className="seven columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "eightColumns":
      elts.push(
        <div className="eight columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "nineColumns":
      elts.push(
        <div className="nine columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "tenColumns":
      elts.push(
        <div className="ten columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "elevenColumns":
      elts.push(
        <div className="eleven columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "twelveColumns":
      elts.push(
        <div className="twelve columns" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "oneThirdColumn":
      elts.push(
        <div className="one-third column" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "twoThirdsColumn":
      elts.push(
        <div className="two-thirds column" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "oneHalfColumn":
      elts.push(
        <div className="one-half column" key={i} style={n.style} {...n.attrs}>
          {args}
        </div>
      );
      break;
    case "h1":
      elts.push(
        <h1 key={i} style={n.style} {...n.attrs}>
          {args}
        </h1>
      );
      break;
    case "h2":
      elts.push(
        <h2 key={i} style={n.style} {...n.attrs}>
          {args}
        </h2>
      );
      break;
    case "h3":
      elts.push(
        <h3 key={i} style={n.style} {...n.attrs}>
          {args}
        </h3>
      );
      break;
    case "h4":
      elts.push(
        <h4 key={i} style={n.style} {...n.attrs}>
          {args}
        </h4>
      );
      break;
    case "h5":
      elts.push(
        <h5 key={i} style={n.style} {...n.attrs}>
          {args}
        </h5>
      );
      break;
    case "h6":
      elts.push(
        <h6 key={i} style={n.style} {...n.attrs}>
          {args}
        </h6>
      );
      break;
    case "br":
      elts.push(
        <br key={i} />
      );
      break;
    case "code":
      n.style.fontSize = n.style && n.style.fontSize ? n.style.fontSize : "90%";
      elts.push(
        <pre key={i} style={n.style} {...n.attrs}><code>
            {args}
        </code></pre>
      );
      break;
    case "cspan":
      elts.push(
        <code key={i} style={n.style} {...n.attrs}>
          {args}
        </code>
      );
      break;
    case "textarea":
      elts.push(
        <textarea className="u-full-width" key={i} rows="1" onChange={handleTextChange} style={n.style} {...n.attrs}>
        </textarea>
      );
      break;
    case "button":
      elts.push(
        <a className="button" key={i} style={n.style} {...n.attrs}>
          {args}
        </a>
      );
      break;
    case "ul":
      elts.push(
        <ul key={i} style={n.style} {...n.attrs}>
          {args}
        </ul>
      );
      break;
    case "ol":
      elts.push(
        <ol key={i} style={n.style} {...n.attrs}>
          {args}
        </ol>
      );
      break;
    case "li":
      elts.push(
        <li key={i} style={n.style} {...n.attrs}>
          {args}
        </li>
      );
      break;
    case "img":
      elts.push(
        <img key={i} style={n.style} {...n.attrs}/>
      );
      break;
    case "a":
      elts.push(
        <a key={i} style={n.style} {...n.attrs}>
          {args}
        </a>
      );
      break;
    case "title":
      document.title = n.value;
      break;
    case "graffito":
      // elts.push(
      //   <div key={i} style={{"position": "relative"}}>
      //     <iframe style={n.style} {...n.attrs}/>
      //     <a href={n.attrs.src} target="L116-CHILD" style={{
      //       "position": "absolute",
      //       "top": 0,
      //       "left": 0,
      //       "display": "inline-block",
      //       "width": "100%",
      //       "height": "100%",
      //       "zIndex": 5}}></a>
      //   </div>
      // );
      // elts.push(
      //   <div key={i} style={{"position": "relative"}}>
      //     <iframe style={n.style} {...n.attrs}/>
      //   </div>
      // );
      let src = n.attrs.src;
      let width = n.attrs.width;
      let height = n.style.height;
      elts.push(
        <HTMLView key={i} width={width} style={n.style} src={src} />
      );
      break;
    case "str":
      elts.push(<span className="u-full-width" key={i} style={n.style}>{""+n.value}</span>);
      break;
    default:
      break;
    }
  });
  return elts;
}

const initData = {
  "type": "table-chart",
  "args": {
    "vals": [
      [
        "Description",
        "Count"
      ],
      [
        "Buy any coffee beverage and get one free!",
        "362"
      ],
      [
        "Free 12 oz Coffee beverage",
        "309"
      ],
      [
        "Free 8 oz Coffee beverage",
        "186"
      ],
      [
        "Free 16 oz Coffee beverage",
        "132"
      ],
      [
        "Buy any coffee beverage and get one for 50 off!",
        "55"
      ]
    ]
  },
  "chartPadding": 10,
  "height": 148,
  "width": 265,
  "style": {
    "tspan": {
      "font-size": 12,
      "fill": "#595959"
    },
    "line": {
      "stroke": "#DEDEDE"
    }
  }
};

const areaChartData = {
  "type": "area-chart",
  "args": {
    "vals": [
      [
        "Point_Issue_Date",
        "Points_Issued"
      ],
      [
        "2019-07-21",
        1
      ],
      [
        "2019-07-22",
        449
      ],
      [
        "2019-07-23",
        491
      ],
      [
        "2019-07-24",
        198
      ],
      [
        "2019-07-25",
        623
      ],
      [
        "2019-07-26",
        422
      ],
      [
        "2019-07-27",
        628
      ]
    ]
  },
  "hideXAxis": true,
  "hideYAxis": true,
  "hideLegend": true,
  "dotRadius": 1.5,
  "lineWidth": 1,
  "colors": [
    "#13ce66  "
  ],
  "height": 30,
  "width": 144
};
