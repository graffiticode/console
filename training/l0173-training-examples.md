# Graffiticode Training Examples

*Downloaded on 2026-05-19T00:04:41.774Z*

## Language L0173

### Example 1

#### Prompt
"Step line chart: pricing tier changes at quarters Q1 (10), Q2 (15), Q3 (15), Q4 (20). Step start."

#### Chat Transcript

**User**: Step line chart: pricing tier changes at quarters Q1 (10), Q2 (15), Q3 (15), Q4 (20). Step start.

#### Code

```
line title "Pricing Tier by Quarter"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value
    name "Price" {}
  step start
  data [
    10
    15
    15
    20
  ] {}..
```

---

### Example 2

#### Prompt
"Bar chart of monthly revenue (in thousands) for the first six months, all positive, sized to 24-pixel bar width."

#### Chat Transcript

**User**: Bar chart of monthly revenue (in thousands) for the first six months, all positive, sized to 24-pixel bar width.

#### Code

```
bar name "Revenue"
  x-axis type category
    categories [
      "Jan"
      "Feb"
      "Mar"
      "Apr"
      "May"
      "Jun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  data [
    120
    200
    150
    80
    70
    110
  ] bar-width 24
  color "blue-500" {}..
```

---

### Example 3

#### Prompt
"Donut chart with inner radius 60%, showing operating system share: Windows 45, macOS 30, Linux 15, Other 10."

#### Chat Transcript

**User**: Donut chart with inner radius 60%, showing operating system share: Windows 45, macOS 30, Linux 15, Other 10.

#### Code

```
pie title "Operating System Share"
  inner-radius "60%"
  data [
    {
      name: "Windows"
      value: 45
    }
    {
      name: "macOS"
      value: 30
    }
    {
      name: "Linux"
      value: 15
    }
    {
      name: "Other"
      value: 10
    }
  ] {}..
```

---

### Example 4

#### Prompt
"Create a stacked bar chart with two series: paid visits [50, 70, 60] and organic visits [120, 140, 130] over weeks 1–3, both stacked under group "total"."

#### Chat Transcript

**User**: Create a stacked bar chart with two series: paid visits [50, 70, 60] and organic visits [120, 140, 130] over weeks 1–3, both stacked under group "total".

#### Code

```
chart title "Weekly performance"
  x-axis type category
    categories [
      "Week 1"
      "Week 2"
      "Week 3"
    ] {}
  y-axis type value {}
  series [
    bar name "Paid Visits"
      stack "total"
      data [
        50
        70
        60
      ] color "blue-500" {}
    bar name "Organic Visits"
      stack "total"
      data [
        120
        140
        130
      ] color "emerald-500" {}
  ] {}..
```

---

### Example 5

#### Prompt
"Create a bar chart of Q1–Q4 revenue with values 320, 450, 380, 510."

#### Chat Transcript

**User**: Create a bar chart of Q1–Q4 revenue with values 320, 450, 380, 510.

#### Code

```
bar name "Revenue"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value {}
  data [
    320
    450
    380
    510
  ] color "blue-500" {}..
```

---

### Example 6

#### Prompt
"Pie chart of expense categories totaling 100%: Rent 25, Salaries 50, Marketing 12, Tools 8, Other 5."

#### Chat Transcript

**User**: Pie chart of expense categories totaling 100%: Rent 25, Salaries 50, Marketing 12, Tools 8, Other 5.

#### Code

```
pie title "Expense Categories"
  data [
    {
      name: "Rent"
      value: 25
    }
    {
      name: "Salaries"
      value: 50
    }
    {
      name: "Marketing"
      value: 12
    }
    {
      name: "Tools"
      value: 8
    }
    {
      name: "Other"
      value: 5
    }
  ] {}..
```

---

### Example 7

#### Prompt
"Pie chart with three slices for stocks 60, bonds 30, cash 10."

#### Chat Transcript

**User**: Pie chart with three slices for stocks 60, bonds 30, cash 10.

#### Code

```
pie title "Portfolio Allocation"
  data [
    {
      name: "Stocks"
      value: 60
    }
    {
      name: "Bonds"
      value: 30
    }
    {
      name: "Cash"
      value: 10
    }
  ] {}..
```

---

### Example 8

#### Prompt
"Create a bar chart of expenses categorized as Rent 4500, Salaries 18000, Marketing 3200, Misc 800. Format the y-axis name as "USD"."

#### Chat Transcript

**User**: Create a bar chart of expenses categorized as Rent 4500, Salaries 18000, Marketing 3200, Misc 800. Format the y-axis name as "USD".

#### Code

```
bar title "Expenses by Category"
  x-axis type category
    categories [
      "Rent"
      "Salaries"
      "Marketing"
      "Misc"
    ] {}
  y-axis type value
    name "USD" {}
  data [
    4500
    18000
    3200
    800
  ] color "blue-500" {}..
```

---

### Example 9

#### Prompt
"Pie chart titled "Revenue mix" with five product slices and a top-positioned legend."

#### Chat Transcript

**User**: Pie chart titled "Revenue mix" with five product slices and a top-positioned legend.

#### Code

```
pie title "Revenue mix"
  legend top
  data [
    {
      name: "Product A"
      value: 35
    }
    {
      name: "Product B"
      value: 25
    }
    {
      name: "Product C"
      value: 20
    }
    {
      name: "Product D"
      value: 12
    }
    {
      name: "Product E"
      value: 8
    }
  ] {
    v: 2
  }..
```

---

### Example 10

#### Prompt
"Two bar series side-by-side: 2024 vs 2025 revenue by quarter."

#### Chat Transcript

**User**: Two bar series side-by-side: 2024 vs 2025 revenue by quarter.

#### Code

```
chart title "2024 vs 2025 Revenue by Quarter"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value
    name "Revenue (USD)" {}
  series [
    bar name "2024"
      data [
        320
        450
        380
        510
      ] color "blue-500" {}
    bar name "2025"
      data [
        370
        490
        420
        560
      ] color "emerald-500" {}
  ] {}..
```

---

### Example 11

#### Prompt
"Compare two bar series side-by-side: Revenue [320, 450, 380, 510] and Costs [200, 280, 240, 320] over Q1–Q4. Use chart wrapper with series list."

#### Chat Transcript

**User**: Compare two bar series side-by-side: Revenue [320, 450, 380, 510] and Costs [200, 280, 240, 320] over Q1–Q4. Use chart wrapper with series list.

#### Code

```
chart title "Revenue vs Costs"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value {}
  series [
    bar name "Revenue"
      data [
        320
        450
        380
        510
      ] color "blue-500" {}
    bar name "Costs"
      data [
        200
        280
        240
        320
      ] color "rose-400" {}
  ] {}..
```

---

### Example 12

#### Prompt
"Rose chart (rose-type radius) showing monthly precipitation across 12 months."

#### Chat Transcript

**User**: Rose chart (rose-type radius) showing monthly precipitation across 12 months.

#### Code

```
pie title "Monthly Precipitation"
  rose-type radius
  data [
    {
      name: "Jan"
      value: 18
    }
    {
      name: "Feb"
      value: 22
    }
    {
      name: "Mar"
      value: 45
    }
    {
      name: "Apr"
      value: 68
    }
    {
      name: "May"
      value: 92
    }
    {
      name: "Jun"
      value: 110
    }
    {
      name: "Jul"
      value: 125
    }
    {
      name: "Aug"
      value: 118
    }
    {
      name: "Sep"
      value: 80
    }
    {
      name: "Oct"
      value: 55
    }
    {
      name: "Nov"
      value: 32
    }
    {
      name: "Dec"
      value: 20
    }
  ] legend bottom {}..
```

---

### Example 13

#### Prompt
"Smooth line chart of monthly revenue (in thousands) Jan–Jun: 320, 410, 380, 510, 470, 590. Title "Revenue"."

#### Chat Transcript

**User**: Smooth line chart of monthly revenue (in thousands) Jan–Jun: 320, 410, 380, 510, 470, 590. Title "Revenue".

#### Code

```
line name "Revenue"
  x-axis type category
    categories [
      "Jan"
      "Feb"
      "Mar"
      "Apr"
      "May"
      "Jun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  data [
    320
    410
    380
    510
    470
    590
  ] smooth true
  color "blue-500" {}..
```

---

### Example 14

#### Prompt
"Dual-axis chart: bars for Sales (USD) on left axis, line for Growth% on right axis."

#### Chat Transcript

**User**: Dual-axis chart: bars for Sales (USD) on left axis, line for Growth% on right axis.

#### Code

```
chart title "Weekly performance"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "Sales (USD)" {}
  y-axis-right type value
    name "Growth %" {}
  series [
    bar name "Sales"
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "blue-500" {}
    line name "Growth %"
      data [
        5
        12
        8
        -3
        -2
        7
        10
      ] color "emerald-500"
      axis right
      smooth true {}
  ] {}..
```

---

### Example 15

#### Prompt
"Stacked bar chart with three series: Free, Pro, Enterprise sign-ups by week."

#### Chat Transcript

**User**: Stacked bar chart with three series: Free, Pro, Enterprise sign-ups by week.

#### Code

```
chart title "Weekly Sign-ups by Plan"
  x-axis type category
    categories [
      "Week 1"
      "Week 2"
      "Week 3"
      "Week 4"
      "Week 5"
      "Week 6"
      "Week 7"
      "Week 8"
    ] {}
  y-axis type value
    name "Sign-ups" {}
  series [
    bar name "Free"
      stack "total"
      data [
        320
        410
        390
        450
        480
        520
        500
        560
      ] color "sky-400" {}
    bar name "Pro"
      stack "total"
      data [
        80
        95
        110
        130
        120
        145
        160
        175
      ] color "blue-600" {}
    bar name "Enterprise"
      stack "total"
      data [
        12
        15
        18
        20
        22
        25
        28
        30
      ] color "indigo-700" {}
  ] {}..
```

---

### Example 16

#### Prompt
"Multi-series line chart with three lines: Actual, Budget, Forecast over months Jan–Dec."

#### Chat Transcript

**User**: Multi-series line chart with three lines: Actual, Budget, Forecast over months Jan–Dec.

#### Code

```
chart title "Actual vs Budget vs Forecast"
  x-axis type category
    categories [
      "Jan"
      "Feb"
      "Mar"
      "Apr"
      "May"
      "Jun"
      "Jul"
      "Aug"
      "Sep"
      "Oct"
      "Nov"
      "Dec"
    ] {}
  y-axis type value {}
  series [
    line name "Actual"
      data [
        210
        230
        220
        250
        270
        260
        280
        290
        275
        300
        310
        320
      ] color "blue-500" {}
    line name "Budget"
      data [
        200
        220
        240
        260
        260
        270
        280
        285
        290
        295
        305
        315
      ] color "emerald-500" {}
    line name "Forecast"
      data [
        210
        230
        220
        250
        270
        265
        275
        288
        280
        305
        312
        325
      ] color "amber-500"
      smooth true {}
  ] {}..
```

---

### Example 17

#### Prompt
"Bar + line combo where the line is bound to a right-side y-axis (different scale)."

#### Chat Transcript

**User**: Bar + line combo where the line is bound to a right-side y-axis (different scale).

#### Code

```
chart title "Weekly performance"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  y-axis-right type value
    name "Conversion Rate (%)" {}
  series [
    bar name "Revenue"
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "blue-500" {}
    line name "Conversion Rate"
      data [
        3.2
        4.1
        3.8
        2.9
        2.5
        3.6
        4.0
      ] axis right
      color "amber-400"
      smooth true {}
  ] {}..
```

---

### Example 18

#### Prompt
"Line chart of stock-style closing prices [120.5, 122.3, 121.8, 124.1, 125.0] for five days. Tooltip enabled."

#### Chat Transcript

**User**: Line chart of stock-style closing prices [120.5, 122.3, 121.8, 124.1, 125.0] for five days. Tooltip enabled.

#### Code

```
line title "Closing Prices"
  tooltip true
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
    ] {}
  y-axis type value
    name "Price (USD)" {}
  data [
    120.5
    122.3
    121.8
    124.1
    125.0
  ] {}..
```

---

### Example 19

#### Prompt
"Donut with inner-radius "70%" showing portfolio allocation in dark theme."

#### Chat Transcript

**User**: Donut with inner-radius "70%" showing portfolio allocation in dark theme.

#### Code

```
pie title "Portfolio Allocation"
  theme dark
  inner-radius "70%"
  outer-radius "80%"
  legend top
  data [
    {
      name: "Equities"
      value: 45
    }
    {
      name: "Bonds"
      value: 25
    }
    {
      name: "Real Estate"
      value: 15
    }
    {
      name: "Cash"
      value: 10
    }
    {
      name: "Commodities"
      value: 5
    }
  ] {
    v: 2
  }..
```

---

### Example 20

#### Prompt
"Line chart with axis labels: x-axis name "Day", y-axis name "Visitors", categories Mon–Sun."

#### Chat Transcript

**User**: Line chart with axis labels: x-axis name "Day", y-axis name "Visitors", categories Mon–Sun.

#### Code

```
chart title "Weekly performance"
  x-axis type category
    name "Day"
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "Visitors" {}
  series [
    line name "Visitors"
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "blue-500" {}
  ] {}..
```

---

### Example 21

#### Prompt
"Donut chart showing operating system share: Windows 45, macOS 30, Linux 15, Other 10."

#### Chat Transcript

**User**: Donut chart showing operating system share: Windows 45, macOS 30, Linux 15, Other 10.

#### Code

```
pie title "Operating System Market Share"
  inner-radius "60%"
  outer-radius "80%"
  data [
    {
      name: "Windows"
      value: 45
    }
    {
      name: "macOS"
      value: 30
    }
    {
      name: "Linux"
      value: 15
    }
    {
      name: "Other"
      value: 10
    }
  ] {}..
```

---

### Example 22

#### Prompt
"Rose chart with rose-type area for budget allocation by department."

#### Chat Transcript

**User**: Rose chart with rose-type area for budget allocation by department.

#### Code

```
pie title "Budget Allocation by Department"
  rose-type area
  data [
    {
      name: "Engineering"
      value: 35
    }
    {
      name: "Marketing"
      value: 20
    }
    {
      name: "Sales"
      value: 18
    }
    {
      name: "Operations"
      value: 12
    }
    {
      name: "HR"
      value: 8
    }
    {
      name: "Finance"
      value: 7
    }
  ] {}..
```

---

### Example 23

#### Prompt
"Combo chart with bars for Revenue and a line for Forecast on the same axes over Q1–Q4."

#### Chat Transcript

**User**: Combo chart with bars for Revenue and a line for Forecast on the same axes over Q1–Q4.

#### Code

```
chart title "Revenue vs Forecast"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  series [
    bar name "Revenue"
      data [
        320
        450
        380
        510
      ] color "blue-500" {}
    line name "Forecast"
      data [
        310
        460
        400
        500
      ] color "amber-500"
      smooth true {}
  ] {}..
```

---

### Example 24

#### Prompt
"Pie chart with legend on the right side, showing browser share."

#### Chat Transcript

**User**: Pie chart with legend on the right side, showing browser share.

#### Code

```
pie title "Browser Market Share"
  legend right
  data [
    {
      name: "Chrome"
      value: 65
    }
    {
      name: "Safari"
      value: 19
    }
    {
      name: "Firefox"
      value: 4
    }
    {
      name: "Edge"
      value: 4
    }
    {
      name: "Other"
      value: 8
    }
  ] {}..
```

---

### Example 25

#### Prompt
"Line chart with legend at the top: Revenue series [320, 450, 380, 510], color sky-500."

#### Chat Transcript

**User**: Line chart with legend at the top: Revenue series [320, 450, 380, 510], color sky-500.

#### Code

```
chart title "Weekly performance"
  legend top
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  series [
    line name "Revenue"
      data [
        320
        450
        380
        510
      ] color "sky-500" {}
  ] {
    v: 1
  }..
```

---

### Example 26

#### Prompt
"Donut with inner-radius "55%" and outer radius "85%" for survey results."

#### Chat Transcript

**User**: Donut with inner-radius "55%" and outer radius "85%" for survey results.

#### Code

```
pie title "Survey Results"
  inner-radius "55%"
  outer-radius "85%"
  data [
    {
      name: "Strongly Agree"
      value: 35
    }
    {
      name: "Agree"
      value: 28
    }
    {
      name: "Neutral"
      value: 18
    }
    {
      name: "Disagree"
      value: 12
    }
    {
      name: "Strongly Disagree"
      value: 7
    }
  ] {}..
```

---

### Example 27

#### Prompt
"Chart wrapper with title, subtitle, and series list of two bars and one line."

#### Chat Transcript

**User**: Chart wrapper with title, subtitle, and series list of two bars and one line.

#### Code

```
chart title "Weekly performance"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  series [
    bar name "Revenue"
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "blue-500" {}
    bar name "Expenses"
      data [
        80
        140
        100
        60
        50
        90
        95
      ] color "rose-400" {}
    line name "Profit"
      data [
        40
        60
        50
        20
        20
        20
        35
      ] color "emerald-500" {}
  ] {}..
```

---

### Example 28

#### Prompt
"Create a horizontal-feeling bar chart of top five products by units sold: A 540, B 410, C 380, D 290, E 220. Use color emerald-500."

#### Chat Transcript

**User**: Create a horizontal-feeling bar chart of top five products by units sold: A 540, B 410, C 380, D 290, E 220. Use color emerald-500.

#### Code

```
bar name "Top 5 Products by Units Sold"
  data [
    540
    410
    380
    290
    220
  ] color "emerald-500"
  x-axis type value {}
  y-axis type category
    categories [
      "A"
      "B"
      "C"
      "D"
      "E"
    ] {} {}..
```

---

### Example 29

#### Prompt
"Combo chart titled "Q4 Performance" with dual y-axis named "USD" and "% growth", legend at the top."

#### Chat Transcript

**User**: Combo chart titled "Q4 Performance" with dual y-axis named "USD" and "% growth", legend at the top.

#### Code

```
chart title "Q4 Performance"
  legend top
  x-axis type category
    categories [
      "Oct"
      "Nov"
      "Dec"
    ] {}
  y-axis type value
    name "USD" {}
  y-axis-right type value
    name "% growth" {}
  series [
    bar name "Revenue"
      data [
        320
        450
        510
      ] color "blue-500" {}
    line name "Growth"
      axis right
      data [
        12
        18
        24
      ] color "emerald-500"
      smooth true {}
  ] {}..
```

---

### Example 30

#### Prompt
"Multi-series line: cost vs price over months Jan–Jun. Cost [200, 210, 220, 230, 240, 250], Price [320, 330, 325, 340, 360, 380]."

#### Chat Transcript

**User**: Multi-series line: cost vs price over months Jan–Jun. Cost [200, 210, 220, 230, 240, 250], Price [320, 330, 325, 340, 360, 380].

#### Code

```
chart title "Cost vs Price (Jan–Jun)"
  x-axis type category
    categories [
      "Jan"
      "Feb"
      "Mar"
      "Apr"
      "May"
      "Jun"
    ] {}
  y-axis type value
    name "USD" {}
  series [
    line name "Cost"
      data [
        200
        210
        220
        230
        240
        250
      ] color "rose-400" {}
    line name "Price"
      data [
        320
        330
        325
        340
        360
        380
      ] color "blue-500" {}
  ] {}..
```

---

### Example 31

#### Prompt
"Nightingale rose chart (rose-type radius) for weekday visits: Mon 120, Tue 200, Wed 150, Thu 80, Fri 70, Sat 110, Sun 130."

#### Chat Transcript

**User**: Nightingale rose chart (rose-type radius) for weekday visits: Mon 120, Tue 200, Wed 150, Thu 80, Fri 70, Sat 110, Sun 130.

#### Code

```
pie title "Weekday Visits"
  rose-type radius
  data [
    {
      name: "Mon"
      value: 120
    }
    {
      name: "Tue"
      value: 200
    }
    {
      name: "Wed"
      value: 150
    }
    {
      name: "Thu"
      value: 80
    }
    {
      name: "Fri"
      value: 70
    }
    {
      name: "Sat"
      value: 110
    }
    {
      name: "Sun"
      value: 130
    }
  ] {}..
```

---

### Example 32

#### Prompt
"Create a bar chart where each bar's color is amber-500 and the legend is shown at the bottom."

#### Chat Transcript

**User**: Create a bar chart where each bar's color is amber-500 and the legend is shown at the bottom.

#### Code

```
chart title "Weekly performance"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  legend bottom
  series [
    bar name "Revenue"
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "amber-500" {}
  ] {}..
```

---

### Example 33

#### Prompt
"Donut chart with caption-style label (use label-show true) for each slice."

#### Chat Transcript

**User**: Donut chart with caption-style label (use label-show true) for each slice.

#### Code

```
pie title "Weekly Performance"
  inner-radius "60%"
  outer-radius "80%"
  label-show true
  data [
    {
      name: "Mon"
      value: 120
    }
    {
      name: "Tue"
      value: 200
    }
    {
      name: "Wed"
      value: 150
    }
    {
      name: "Thu"
      value: 80
    }
    {
      name: "Fri"
      value: 70
    }
    {
      name: "Sat"
      value: 110
    }
    {
      name: "Sun"
      value: 130
    }
  ] {}..
```

---

### Example 34

#### Prompt
"Bar chart with data labels visible above each bar: [10, 20, 30, 40], categories ["A","B","C","D"]."

#### Chat Transcript

**User**: Bar chart with data labels visible above each bar: [10, 20, 30, 40], categories ["A","B","C","D"].

#### Code

```
bar title "Bar Chart"
  x-axis type category
    categories [
      "A"
      "B"
      "C"
      "D"
    ] {}
  y-axis type value {}
  label-show true
  label-position top
  data [
    10
    20
    30
    40
  ] {}..
```

---

### Example 35

#### Prompt
"Pie chart with start-angle 90 degrees so the largest slice begins at the top."

#### Chat Transcript

**User**: Pie chart with start-angle 90 degrees so the largest slice begins at the top.

#### Code

```
pie title "Weekly performance"
  start-angle 90
  data [
    {
      name: "Mon"
      value: 120
    }
    {
      name: "Tue"
      value: 200
    }
    {
      name: "Wed"
      value: 150
    }
    {
      name: "Thu"
      value: 80
    }
    {
      name: "Fri"
      value: 70
    }
    {
      name: "Sat"
      value: 110
    }
    {
      name: "Sun"
      value: 130
    }
  ] {}..
```

---

### Example 36

#### Prompt
"Bar + line dual-axis: Revenue bars on left in blue-500, Conversion line on right in amber-500, with legend top."

#### Chat Transcript

**User**: Bar + line dual-axis: Revenue bars on left in blue-500, Conversion line on right in amber-500, with legend top.

#### Code

```
chart title "Weekly performance"
  legend top
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  y-axis-right type value
    name "Conversion (%)" {}
  series [
    bar name "Revenue"
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "blue-500" {}
    line name "Conversion"
      data [
        12
        18
        15
        9
        8
        14
        16
      ] color "amber-500"
      axis right {}
  ] {}..
```

---

### Example 37

#### Prompt
"Bar chart showing quarterly net new customers: Q1 120, Q2 165, Q3 140, Q4 210. Title "New Customers", color rose-500."

#### Chat Transcript

**User**: Bar chart showing quarterly net new customers: Q1 120, Q2 165, Q3 140, Q4 210. Title "New Customers", color rose-500.

#### Code

```
bar title "New Customers"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value {}
  data [
    120
    165
    140
    210
  ] color "rose-500" {}..
```

---

### Example 38

#### Prompt
"Make a bar chart of website visits per day for a week, smoothed style isn't applicable — use vertical bars in indigo-600."

#### Chat Transcript

**User**: Make a bar chart of website visits per day for a week, smoothed style isn't applicable — use vertical bars in indigo-600.

#### Code

```
bar name "Website Visits"
  data [
    1200
    1850
    1600
    2100
    1950
    900
    750
  ] color "indigo-600"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "Visits" {}
  title "Website Visits Per Day" {}..
```

---

### Example 39

#### Prompt
"Two-series line chart: Predicted vs Actual sales over the year. Use color blue-500 for Predicted and amber-500 for Actual."

#### Chat Transcript

**User**: Two-series line chart: Predicted vs Actual sales over the year. Use color blue-500 for Predicted and amber-500 for Actual.

#### Code

```
chart title "Sales: Predicted vs Actual"
  x-axis type category
    categories [
      "Jan"
      "Feb"
      "Mar"
      "Apr"
      "May"
      "Jun"
      "Jul"
      "Aug"
      "Sep"
      "Oct"
      "Nov"
      "Dec"
    ] {}
  y-axis type value
    name "Sales" {}
  series [
    line name "Predicted"
      data [
        150
        180
        170
        200
        220
        260
        240
        230
        210
        250
        270
        300
      ] color "blue-500" {}
    line name "Actual"
      data [
        140
        175
        185
        195
        210
        250
        255
        220
        225
        245
        260
        310
      ] color "amber-500" {}
  ] {}..
```

---

### Example 40

#### Prompt
"Bar chart with dark theme: weekday active users [1200, 1340, 1500, 1450, 1700]."

#### Chat Transcript

**User**: Bar chart with dark theme: weekday active users [1200, 1340, 1500, 1450, 1700].

#### Code

```
chart title "Weekday Active Users"
  theme dark
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
    ] {}
  y-axis type value
    name "Active Users" {}
  series [
    bar name "Active Users"
      data [
        1200
        1340
        1500
        1450
        1700
      ] color "indigo-400" {}
  ] {}..
```

---

### Example 41

#### Prompt
"Step line chart with step middle for usage tiers across weeks 1–8."

#### Chat Transcript

**User**: Step line chart with step middle for usage tiers across weeks 1–8.

#### Code

```
chart title "Usage Tiers by Week"
  x-axis type category
    categories [
      "Week 1"
      "Week 2"
      "Week 3"
      "Week 4"
      "Week 5"
      "Week 6"
      "Week 7"
      "Week 8"
    ] {}
  y-axis type value
    name "Usage" {}
  series [
    line name "Basic"
      step middle
      data [
        10
        10
        20
        20
        30
        30
        40
        40
      ] color "sky-400" {}
    line name "Standard"
      step middle
      data [
        30
        30
        50
        50
        60
        70
        70
        80
      ] color "violet-500" {}
    line name "Premium"
      step middle
      data [
        60
        60
        80
        90
        90
        110
        120
        130
      ] color "amber-500" {}
  ] {}..
```

---

### Example 42

#### Prompt
"Create a line chart of daily visits for the past week: 1200, 1340, 1500, 1450, 1700, 1850, 1900."

#### Chat Transcript

**User**: Create a line chart of daily visits for the past week: 1200, 1340, 1500, 1450, 1700, 1850, 1900.

#### Code

```
chart title "Daily Visits"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "Visits" {}
  series [
    line name "Daily Visits"
      data [
        1200
        1340
        1500
        1450
        1700
        1850
        1900
      ] color "blue-500" {}
  ] {}..
```

---

### Example 43

#### Prompt
"Create a pie chart of market share: A 40, B 35, C 25."

#### Chat Transcript

**User**: Create a pie chart of market share: A 40, B 35, C 25.

#### Code

```
pie title "Market Share"
  data [
    {
      name: "A"
      value: 40
    }
    {
      name: "B"
      value: 35
    }
    {
      name: "C"
      value: 25
    }
  ] {}..
```

---

### Example 44

#### Prompt
"Connect-nulls line chart for sparse data: [10, null, null, 25, 30, null, 50] across seven points. (Pass connect-nulls true once supported; for v1, fill the nulls in.)"

#### Chat Transcript

**User**: Connect-nulls line chart for sparse data: [10, null, null, 25, 30, null, 50] across seven points. (Pass connect-nulls true once supported; for v1, fill the nulls in.)

#### Code

```
chart title "Sparse Data – Connect Nulls"
  x-axis type category
    categories [
      "P1"
      "P2"
      "P3"
      "P4"
      "P5"
      "P6"
      "P7"
    ] {}
  y-axis type value {}
  series [
    line name "Value"
      smooth false
      data [
        10
        17
        21
        25
        30
        40
        50
      ] color "blue-500" {}
  ] {}..
```

---

### Example 45

#### Prompt
"Line chart with diamond symbols at each data point, size 10. Data [50, 80, 65, 90, 110]."

#### Chat Transcript

**User**: Line chart with diamond symbols at each data point, size 10. Data [50, 80, 65, 90, 110].

#### Code

```
chart title "Weekly performance"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  series [
    line name "Performance"
      data [
        50
        80
        65
        90
        110
      ] symbol diamond
      symbol-size 10
      color "blue-500" {}
  ] {}..
```

---

### Example 46

#### Prompt
"Create a bar chart titled "Sales" with values [320, 450, 380, 510] for quarters Q1 through Q4, colored blue-500."

#### Chat Transcript

**User**: Create a bar chart titled "Sales" with values [320, 450, 380, 510] for quarters Q1 through Q4, colored blue-500.

#### Code

```
bar title "Sales"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value {}
  data [
    320
    450
    380
    510
  ] color "blue-500" {}..
```

---

### Example 47

#### Prompt
"Bar chart with category labels rotated 45 degrees: categories ["very long label one", "very long label two"], data [100, 200]. Use rotate 45 inside the x-axis chain."

#### Chat Transcript

**User**: Bar chart with category labels rotated 45 degrees: categories ["very long label one", "very long label two"], data [100, 200]. Use rotate 45 inside the x-axis chain.

#### Code

```
chart title "Weekly performance"
  x-axis type category
    rotate 45
    categories [
      "very long label one"
      "very long label two"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  series [
    bar name "Revenue"
      data [
        100
        200
      ] color "blue-500" {}
  ] {
    v: 1
  }..
```

---

### Example 48

#### Prompt
"Donut chart for vote distribution: Option A 42, Option B 31, Option C 27."

#### Chat Transcript

**User**: Donut chart for vote distribution: Option A 42, Option B 31, Option C 27.

#### Code

```
pie title "Vote Distribution"
  inner-radius "60%"
  outer-radius "80%"
  data [
    {
      name: "Option A"
      value: 42
    }
    {
      name: "Option B"
      value: 31
    }
    {
      name: "Option C"
      value: 27
    }
  ] color [
  "blue-500"
  "emerald-500"
  "amber-400"
] label-show true
  legend true {}..
```

---

### Example 49

#### Prompt
"Line chart with area-style under the curve, blue-500 color, for engagement rate Mon–Sun: 0.12, 0.18, 0.22, 0.20, 0.25, 0.28, 0.30."

#### Chat Transcript

**User**: Line chart with area-style under the curve, blue-500 color, for engagement rate Mon–Sun: 0.12, 0.18, 0.22, 0.20, 0.25, 0.28, 0.30.

#### Code

```
chart title "Weekly Engagement Rate"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "Engagement Rate" {}
  series [
    line name "Engagement Rate"
      smooth true
      area-style true
      data [
        0.12
        0.18
        0.22
        0.20
        0.25
        0.28
        0.30
      ] color "blue-500" {}
  ] {}..
```

---

### Example 50

#### Prompt
"Smooth line in emerald-500 color showing recovery curve [10, 25, 40, 60, 78, 92] over six weeks. Title "Recovery"."

#### Chat Transcript

**User**: Smooth line in emerald-500 color showing recovery curve [10, 25, 40, 60, 78, 92] over six weeks. Title "Recovery".

#### Code

```
line title "Recovery"
  smooth true
  x-axis type category
    categories [
      "Week 1"
      "Week 2"
      "Week 3"
      "Week 4"
      "Week 5"
      "Week 6"
    ] {}
  y-axis type value {}
  data [
    10
    25
    40
    60
    78
    92
  ] color "emerald-500" {}..
```

---

### Example 51

#### Prompt
"Create a bar chart of weekly sign-ups: Mon 120, Tue 200, Wed 150, Thu 80, Fri 70, Sat 110, Sun 130."

#### Chat Transcript

**User**: Create a bar chart of weekly sign-ups: Mon 120, Tue 200, Wed 150, Thu 80, Fri 70, Sat 110, Sun 130.

#### Code

```
bar name "Weekly Sign-ups"
  data [
    120
    200
    150
    80
    70
    110
    130
  ] color "blue-500"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "Sign-ups" {}
  title "Weekly Sign-ups" {}..
```

---

### Example 52

#### Prompt
"Multi-series line chart with Revenue [320, 450, 380, 510] and Forecast [310, 460, 400, 500] over Q1–Q4. Forecast is amber-500 and smoothed."

#### Chat Transcript

**User**: Multi-series line chart with Revenue [320, 450, 380, 510] and Forecast [310, 460, 400, 500] over Q1–Q4. Forecast is amber-500 and smoothed.

#### Code

```
chart title "Revenue vs Forecast"
  x-axis type category
    categories [
      "Q1"
      "Q2"
      "Q3"
      "Q4"
    ] {}
  y-axis type value {}
  series [
    line name "Revenue"
      data [
        320
        450
        380
        510
      ] {}
    line name "Forecast"
      data [
        310
        460
        400
        500
      ] color "amber-500"
      smooth true {}
  ] {}..
```

---

### Example 53

#### Prompt
"Pie chart of customer segments: Enterprise 50, SMB 35, Individual 15. Each slice gets a distinct Tailwind color."

#### Chat Transcript

**User**: Pie chart of customer segments: Enterprise 50, SMB 35, Individual 15. Each slice gets a distinct Tailwind color.

#### Code

```
pie title "Customer Segments"
  data [
    {
      name: "Enterprise"
      value: 50
    }
    {
      name: "SMB"
      value: 35
    }
    {
      name: "Individual"
      value: 15
    }
  ] color [
  "blue-600"
  "emerald-500"
  "amber-400"
] legend true {
  v: 4
}..
```

---

### Example 54

#### Prompt
"Line chart with smooth=true for Predicted and step start for Actual."

#### Chat Transcript

**User**: Line chart with smooth=true for Predicted and step start for Actual.

#### Code

```
chart title "Weekly performance"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value
    name "USD (thousands)" {}
  series [
    line name "Predicted"
      smooth true
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "blue-500" {}
    line name "Actual"
      step start
      data [
        120
        200
        150
        80
        70
        110
        130
      ] color "amber-500" {}
  ] {}..
```

---

### Example 55

#### Prompt
"Line chart titled "Visitors per Day" with symbol circle, no smoothing. Data [1000, 1200, 1100, 1300, 1500, 1700, 1600]."

#### Chat Transcript

**User**: Line chart titled "Visitors per Day" with symbol circle, no smoothing. Data [1000, 1200, 1100, 1300, 1500, 1700, 1600].

#### Code

```
line title "Visitors per Day"
  x-axis type category
    categories [
      "Mon"
      "Tue"
      "Wed"
      "Thu"
      "Fri"
      "Sat"
      "Sun"
    ] {}
  y-axis type value {}
  series [
    line name "Visitors"
      symbol circle
      data [
        1000
        1200
        1100
        1300
        1500
        1700
        1600
      ] {}
  ] {}..
```

---

### Example 56

#### Prompt
"Bar chart with the title "Active Users" and subtitle "by region": Americas 1200, EMEA 980, APAC 1450."

#### Chat Transcript

**User**: Bar chart with the title "Active Users" and subtitle "by region": Americas 1200, EMEA 980, APAC 1450.

#### Code

```
bar title "Active Users"
  subtitle "by region"
  x-axis type category
    categories [
      "Americas"
      "EMEA"
      "APAC"
    ] {}
  y-axis type value {}
  data [
    1200
    980
    1450
  ] {}..
```



