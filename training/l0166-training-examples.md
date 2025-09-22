# Graffiticode Training Examples

*Downloaded on 2025-09-22T23:44:52.258Z*

## Language L0166

### Example 1

#### Prompt
"make a simple income statement assessment

Use these changed properties to update the code for column B:
```json
{
    "format": "($#,##0)"
}
```

Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: make a simple income statement assessment

**User**: Use these changed properties to update the code for column B:
```json
{
    "format": "($#,##0)"
}
```

Note: Only the properties shown above have changed and need to be updated.

#### Code

```
title "Income Statement Assessment"
instructions `
- Calculate the missing values in the income statement
- Fill in Net Sales, Gross Profit, Operating Income, and Net Income
`
columns [
  column A width 200 align "left" {}
  column B width 120 align "right" format "($#,##0)" {}
]
cells [
  cell A1 text "INCOME STATEMENT" font-weight "bold" {}
  cell B1 text "Amount ($)" font-weight "bold" {}

  cell A2 text "Revenue" font-weight "bold" {}
  cell B2 text "50000" {}

  cell A3 text "Sales Returns" {}
  cell B3 text "2000" {}

  cell A4 text "Net Sales" font-weight "bold" {}
  cell B4 text "" assess [method "value" expected "48000"] {}

  cell A5 text "Cost of Goods Sold" {}
  cell B5 text "30000" {}

  cell A6 text "Gross Profit" font-weight "bold" {}
  cell B6 text "" assess [method "value" expected "18000"] {}

  cell A7 text "Operating Expenses:" font-weight "bold" {}

  cell A8 text "  Salaries" {}
  cell B8 text "8000" {}

  cell A9 text "  Rent" {}
  cell B9 text "3000" {}

  cell A10 text "  Utilities" {}
  cell B10 text "1000" {}

  cell A11 text "Total Operating Expenses" {}
  cell B11 text "12000" {}

  cell A12 text "Operating Income" font-weight "bold" {}
  cell B12 text "" assess [method "value" expected "6000"] {}

  cell A13 text "Interest Expense" {}
  cell B13 text "500" {}

  cell A14 text "Income Before Tax" {}
  cell B14 text "5500" {}

  cell A15 text "Income Tax (20%)" {}
  cell B15 text "1100" {}

  cell A16 text "Net Income" font-weight "bold" {}
  cell B16 text "" assess [method "value" expected "4400"] {}
]
{
  v: "0.0.1"
}..
```

---

### Example 2

#### Prompt
"make column a bold"

#### Chat Transcript

**User**: make column a bold

#### Code

```
columns [
  column A width 100 align "center" font-weight "bold" {}
]
rows [
  row 1 background-color "#eee" {}
]
cells [
  cell A1 text "A1" {}
  cell A2 text "A2" {}
]
{
  v: "0.0.1"
}..
```

---

### Example 3

#### Prompt
"make a table with a single cell with an assessment

Use these changed properties to update the code for cell A1:
```json
{
    "text": "100",
    "assess": {
        "expected": "100"
    }
}
```

Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: make a table with a single cell with an assessment

**Assistant**: ```graffiticode
This code appears to be setting up a simple assessment cell where a value of "10" is expected to be entered and evaluated.
```

**User**: Use these changed properties to update the code for cell A1:
```json
{
    "text": "100",
    "assess": {
        "expected": "100"
    }
}
```

Note: Only the properties shown above have changed and need to be updated.

#### Code

```
columns [
  column "A" width 50 {}
]
cells [
  cell A1 text "10" assess [method "value" expected "10"] {}
]
{
  v: "0.0.3"
}..
```

---

### Example 4

#### Prompt
"make row 1 bold"

#### Chat Transcript

**User**: make row 1 bold

#### Code

```
columns [
  column A width 100 align "center" {}
  column B width 100 align "center" {}
]
cells [
  cell A1 text "A1" {fontWeight: "bold"}
  cell B1 text "B1" {fontWeight: "bold"}
]
{
  v: "0.0.1"
}..
```

---

### Example 5

#### Prompt
"format column A using ($#,##0)"

#### Chat Transcript

**User**: format column A using ($#,##0)

#### Code

```
columns [
  column A width 100 align "center" format "($#,##0)" {}
]
rows [
  row 1 background-color "#eee" {}
]
cells [
  cell A1 text "10000" {}
  cell A2 text "-10000" {}
]
{
  v: "0.0.1"
}..
```

---

### Example 6

#### Prompt
"make a single cell table"

#### Chat Transcript

**User**: make a single cell table

**Assistant**: ```graffiticode
This code appears to create a simple spreadsheet-like grid with a single cell labeled "A1" that has a width of 100 units.
```

#### Code

```
columns [
  column A width 100 {}
]
cells [
  cell A1 text "A1" {}
]
{
  v: "0.0.1"
}..
```

---

### Example 7

#### Prompt
"make a spreadsheet that allows me to track my stocks. see the sheet with a few dummy examples

compute the total value in column e

format dollar values using ($#,##0.00)

format share quantity with #,###

left justify column a

Add a row for nvidia"

#### Chat Transcript

**User**: make a spreadsheet that allows me to track my stocks. see the sheet with a few dummy examples

**Assistant**: ```graffiticode
This code creates a stock portfolio spreadsheet that tracks different stocks, showing their purchase and current prices, calculates total value and gains/losses, and provides a summary of the overall portfolio performance.
```

**User**: compute the total value in column e

**Assistant**: ```graffiticode
This code creates a stock portfolio spreadsheet that tracks different stocks, showing their purchase and current prices, calculates total value and gains/losses, and provides a summary of the overall portfolio performance.
```

**User**: format dollar values using ($#,##0.00)

**Assistant**: ```graffiticode
This code creates a stock portfolio spreadsheet that tracks different stocks, showing how many shares you own, their purchase and current prices, total value, and calculates your overall gain or loss for each stock and the entire portfolio.
```

**User**: format share quantity with #,###

**Assistant**: ```graffiticode
This code creates a simple stock portfolio spreadsheet that tracks different stocks, showing the number of shares owned, purchase price, current price, total value, and calculates the gain or loss for each stock, with a summary of total portfolio value at the bottom.
```

**User**: left justify column a

**Assistant**: ```graffiticode
This code creates a stock portfolio spreadsheet that tracks different stocks, showing the number of shares owned, purchase and current prices, total value, and calculates the overall gain or loss for each stock and the entire portfolio.
```

**User**: Add a row for nvidia

**Assistant**: ```graffiticode
This code creates a stock portfolio spreadsheet that tracks different stocks, showing the number of shares owned, purchase price, current price, total value, and calculates the overall gain or loss for each stock and the entire portfolio.
```

#### Code

```
columns [
  column A width 120 align "left" {}
  column B width 100 {}
  column C width 100 {}
  column D width 100 {}
  column E width 100 {}
  column F width 120 {}
]
cells [
  cell A1 text "Stock Symbol" {fontWeight: "bold"}
  cell B1 text "Shares" {fontWeight: "bold"}
  cell C1 text "Purchase Price" {fontWeight: "bold"}
  cell D1 text "Current Price" {fontWeight: "bold"}
  cell E1 text "Total Value" {fontWeight: "bold"}
  cell F1 text "Gain/Loss" {fontWeight: "bold"}

  cell A2 text "AAPL" {}
  cell B2 text "100" {format: "#,##0"}
  cell C2 text "150.00" {format: "$#,##0.00"}
  cell D2 text "175.50" {format: "$#,##0.00"}
  cell E2 text "=B2*D2" {format: "$#,##0.00"}
  cell F2 text "=E2-B2*C2" {format: "$#,##0.00"}

  cell A3 text "GOOGL" {}
  cell B3 text "50" {format: "#,##0"}
  cell C3 text "2800.00" {format: "$#,##0.00"}
  cell D3 text "2950.00" {format: "$#,##0.00"}
  cell E3 text "=B3*D3" {format: "$#,##0.00"}
  cell F3 text "=E3-B3*C3" {format: "$#,##0.00"}

  cell A4 text "MSFT" {}
  cell B4 text "75" {format: "#,##0"}
  cell C4 text "300.00" {format: "$#,##0.00"}
  cell D4 text "380.00" {format: "$#,##0.00"}
  cell E4 text "=B4*D4" {format: "$#,##0.00"}
  cell F4 text "=E4-B4*C4" {format: "$#,##0.00"}

  cell A5 text "TSLA" {}
  cell B5 text "25" {format: "#,##0"}
  cell C5 text "800.00" {format: "$#,##0.00"}
  cell D5 text "650.00" {format: "$#,##0.00"}
  cell E5 text "=B5*D5" {format: "$#,##0.00"}
  cell F5 text "=E5-B5*C5" {format: "$#,##0.00"}

  cell A6 text "NVDA" {}
  cell B6 text "40" {format: "#,##0"}
  cell C6 text "500.00" {format: "$#,##0.00"}
  cell D6 text "900.00" {format: "$#,##0.00"}
  cell E6 text "=B6*D6" {format: "$#,##0.00"}
  cell F6 text "=E6-B6*C6" {format: "$#,##0.00"}

  cell A8 text "Total" {fontWeight: "bold"}
  cell E8 text "=SUM(E2:E6)" {fontWeight: "bold", format: "$#,##0.00"}
  cell F8 text "=SUM(F2:F6)" {fontWeight: "bold", format: "$#,##0.00"}
]
{
  v: "0.0.1"
}..
```

---

### Example 8

#### Prompt
"Make a home budget assessment using the following data:

| CATEGORY | AMOUNT | DETAILS |
| --- | --- | --- |
| Income | 4000 | Total monthly income |
| Rent |  | 35% of your total income |
| Utilities | 200 | Fixed expense |
| Food |  | 15% of your total income |
| Transportation |  | 10% of your total income |
| Entertainment | 150 | Fixed expense |
| Savings |  | 20% of your total income |
| Miscellaneous |  | Remaining income after all other expenses |

Use these changed properties to update the code for column A:
```json
{
    "align": "left"
}
```

Note: Only the properties shown above have changed and need to be updated.

Use these changed properties to update the code for column C:
```json
{
    "align": "left"
}
```

Note: Only the properties shown above have changed and need to be updated.

Use these changed properties to update the code for column B:
```json
{
    "format": "($#,##0)"
}
```

Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: Make a home budget assessment using the following data:

| CATEGORY | AMOUNT | DETAILS |
| --- | --- | --- |
| Income | 4000 | Total monthly income |
| Rent |  | 35% of your total income |
| Utilities | 200 | Fixed expense |
| Food |  | 15% of your total income |
| Transportation |  | 10% of your total income |
| Entertainment | 150 | Fixed expense |
| Savings |  | 20% of your total income |
| Miscellaneous |  | Remaining income after all other expenses |

**User**: Use these changed properties to update the code for column A:
```json
{
    "align": "left"
}
```

Note: Only the properties shown above have changed and need to be updated.

**User**: Use these changed properties to update the code for column C:
```json
{
    "align": "left"
}
```

Note: Only the properties shown above have changed and need to be updated.

**User**: Use these changed properties to update the code for column B:
```json
{
    "format": "($#,##0)"
}
```

Note: Only the properties shown above have changed and need to be updated.

#### Code

```
title "Home Budget Assessment"
instructions `
- Calculate your monthly budget based on income percentages
- Fill in the empty cells with the correct formulas
- Ensure all expenses and savings are properly allocated
`
columns [
  column A width 150 align "left" {}
  column B width 100 format "($#,##0)" {}
  column C width 250 align "left" {}
]
cells [
  cell A1 text "CATEGORY" font-weight "bold" {}
  cell B1 text "AMOUNT" font-weight "bold" {}
  cell C1 text "DETAILS" font-weight "bold" {}

  cell A2 text "Income" {}
  cell B2 text "4000" {}
  cell C2 text "Total monthly income" {}

  cell A3 text "Rent" {}
  cell B3
    text "",
    assess [
      method "value"
      expected "1400"
    ] {}
  cell C3 text "35% of your total income" {}

  cell A4 text "Utilities" {}
  cell B4 text "200" {}
  cell C4 text "Fixed expense" {}

  cell A5 text "Food" {}
  cell B5
    text "",
    assess [
      method "value"
      expected "600"
    ] {}
  cell C5 text "15% of your total income" {}

  cell A6 text "Transportation" {}
  cell B6
    text "",
    assess [
      method "value"
      expected "400"
    ] {}
  cell C6 text "10% of your total income" {}

  cell A7 text "Entertainment" {}
  cell B7 text "150" {}
  cell C7 text "Fixed expense" {}

  cell A8 text "Savings" {}
  cell B8
    text "",
    assess [
      method "value"
      expected "800"
    ] {}
  cell C8 text "20% of your total income" {}

  cell A9 text "Miscellaneous" {}
  cell B9
    text "",
    assess [
      method "value"
      expected "450"
    ] {}
  cell C9 text "Remaining income after all other expenses" {}
]
{
  v: "0.0.1"
}..
```



