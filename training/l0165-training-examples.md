# Graffiticode Training Examples

## Language L0165

### Prompt
"create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

protect the cells in column B

bold column b"

### Chat Transcript

**User**: create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

**Assistant**: This generated Graffiticode creates a table with two columns, A and B. Column A is set to a width of 100 and the text is aligned to the right, while Column B is also set to a width of 100 but the text is aligned to the left. The code then generates two rows of data, with the first row containing the values "100" in Column A and "cows" in Column B. The second row contains the values "200" in Column A and "pigs" in Column B, and the code also includes assessment criteria to verify that the values in the second row match the expected values.

**User**: protect the cells in column B

**Assistant**: ```ocaml
This generated Graffiticode creates a spreadsheet-like structure with two columns, A and B. Column A has cells with the numbers "100" and "200", and these cells are set up to be automatically assessed to ensure their values match the expected values. Column B has cells with the text "cows" and "pigs", and these cells are marked as protected, meaning they cannot be edited. The code also includes a version number of "0.0.1" at the end.
```

**User**: bold column b

**Assistant**: ```ocaml
The generated code creates a spreadsheet-like table with two columns, A and B. Column A has cells with the numbers "100" and "200", which are set up to be automatically assessed for their values. Column B has cells with the words "cows" and "pigs", which are formatted to be in bold text. The code also includes some configuration settings, such as the width of the columns and the justification of the text.
```

### Code

```
columns {
  A: {
    width: 100
    justify: "right"
  }
  B: {
    width: 100
    justify: "left"
    protected: true
  }
}
cells {
  A1: {
    text: "100"
    attrs: {
      assess: {
        method: "value"
        expected: "100"
      }
    }
  }
  B1: {
    text: "cows"
    attrs: {
      fontWeight: "bold"
    }
  }
  A2: {
    text: "200"
    attrs: {
      assess: {
        method: "value"
        expected: "200"
      }
    }
  }
  B2: {
    text: "pigs"
    attrs: {
      fontWeight: "bold"
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Prompt
"create a starter template with one cell"

### Chat Transcript

**User**: create a starter template with one cell

**Assistant**: ```ocaml
This generated Graffiticode creates a simple spreadsheet with a title of "Untitled Spreadsheet" and a single cell in the A1 position. The spreadsheet has a column width of 100 units for the A column. The code also includes a version number of "0.0.1" at the end.
```

### Code

```
title "Untitled Spreadsheet"
instructions `
`
columns {
  A: {
    width: 100
  }
}
cells {
  A1: {
    text: ""
  }
}
{
  v: "0.0.1"
}..
```

---

### Prompt
"change the cell value of A1 to 100

make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

remove all but the cells A1, A2 and A3

add the validation for a3 that the value is 300

make the unvalidated cells protected"

### Chat Transcript

**User**: change the cell value of A1 to 100

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific width (100) and contains some text, such as numbers or labels. The generated code defines the properties of the columns and the content of the cells, allowing for the creation of a basic spreadsheet-style layout.

**User**: make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific text value, and one cell (A3) has a formula that calculates the sum of the values in cells A1 and A2. The code defines the width of each column and the content of each cell, allowing for the creation of a basic spreadsheet-like layout.

**User**: remove all but the cells A1, A2 and A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" in the first column. The third row contains a formula that calculates the sum of the values in the first two rows and displays the result.

**User**: add the validation for a3 that the value is 300

**Assistant**: ```ocaml
This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" respectively, and the third row calculates the sum of those two values and checks if the result is "300". The generated code sets the width of the first column to 100 and defines the text and assessment criteria for each cell in the spreadsheet.
```

**User**: make the unvalidated cells protected

**Assistant**: ```ocaml
The generated code creates a spreadsheet-like structure with three cells in a single column. The first two cells contain the values "100" and "200", which are marked as protected. The third cell contains a formula that calculates the sum of the values in the first two cells, and it is set up to be assessed to ensure the result is "300".
```

### Code

```
columns {
  A: { width: 100 }
}
cells {
  A1: {
    text: "100"
    attrs: {
      protected: true
    }
  }
  A2: {
    text: "200"
    attrs: {
      protected: true
    }
  }
  A3: {
    text: "=sum(A1:A2)"
    attrs: {
      assess: {
        method: "value"
        expected: "300"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Prompt
"create a five by five table with integer values of your choosing where every other cell is protected

now prefix all the values in the protected cells with a letter P

add validations for all the unprotected cells

excellent! now bold all the protected cells"

### Chat Transcript

**User**: create a five by five table with integer values of your choosing where every other cell is protected

**Assistant**: ```ocaml
This generated Graffiticode creates a spreadsheet-like grid with 5 columns and 5 rows. Each cell in the grid contains a number, and some of the cells are marked as "protected", meaning their values cannot be changed. The purpose of this generated code is to create a structured data layout that could be used for various applications, such as displaying numerical information in a tabular format.
```

**User**: now prefix all the values in the protected cells with a letter P

**Assistant**: ```ocaml
This generated Graffiticode creates a table with 5 columns and 5 rows. The table cells contain a mix of numbers and text, some of which are marked as "protected". The purpose of this generated code is likely to create a structured data layout, potentially for a spreadsheet or other tabular application.
```

**User**: add validations for all the unprotected cells

**Assistant**: ```ocaml
The generated code creates a grid-like structure with 5 columns and 5 rows. Each cell in the grid contains either a number that needs to be entered correctly, or a protected value that the user cannot modify. This code is likely part of an interactive learning or assessment tool, where the user is expected to input the correct values in the unprotected cells.
```

**User**: excellent! now bold all the protected cells

**Assistant**: ```ocaml
The generated code creates a grid-like structure with 5 columns and 5 rows. Each cell in the grid contains either a number or a protected label (e.g., "P12", "P19"). The numbers in the cells have associated "assess" attributes that specify the expected value for that cell, which could be used for some kind of assessment or evaluation.
```

### Code

```
columns {
  A: { width: 50 }
  B: { width: 50 }
  C: { width: 50 }
  D: { width: 50 }
  E: { width: 50 }
}
cells {
  A1: {
    text: "P12"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  B1: {
    text: "7"
    attrs: {
      assess: {
        method: "value"
        expected: "7"
      }
    }
  }
  C1: {
    text: "P19"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  D1: {
    text: "3"
    attrs: {
      assess: {
        method: "value"
        expected: "3"
      }
    }
  }
  E1: {
    text: "P14"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  A2: {
    text: "8"
    attrs: {
      assess: {
        method: "value"
        expected: "8"
      }
    }
  }
  B2: {
    text: "P25"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  C2: {
    text: "11"
    attrs: {
      assess: {
        method: "value"
        expected: "11"
      }
    }
  }
  D2: {
    text: "P30"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  E2: {
    text: "5"
    attrs: {
      assess: {
        method: "value"
        expected: "5"
      }
    }
  }
  A3: {
    text: "P17"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  B3: {
    text: "9"
    attrs: {
      assess: {
        method: "value"
        expected: "9"
      }
    }
  }
  C3: {
    text: "P22"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  D3: {
    text: "6"
    attrs: {
      assess: {
        method: "value"
        expected: "6"
      }
    }
  }
  E3: {
    text: "P28"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  A4: {
    text: "13"
    attrs: {
      assess: {
        method: "value"
        expected: "13"
      }
    }
  }
  B4: {
    text: "P20"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  C4: {
    text: "4"
    attrs: {
      assess: {
        method: "value"
        expected: "4"
      }
    }
  }
  D4: {
    text: "P16"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  E4: {
    text: "10"
    attrs: {
      assess: {
        method: "value"
        expected: "10"
      }
    }
  }
  A5: {
    text: "P27"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  B5: {
    text: "2"
    attrs: {
      assess: {
        method: "value"
        expected: "2"
      }
    }
  }
  C5: {
    text: "P24"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  D5: {
    text: "18"
    attrs: {
      assess: {
        method: "value"
        expected: "18"
      }
    }
  }
  E5: {
    text: "P31"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Prompt
"create a starter template with one cell

let's play tic tac toe"

### Chat Transcript

**User**: create a starter template with one cell

**Assistant**: ```ocaml
This generated Graffiticode creates a simple spreadsheet with a title of "Untitled Spreadsheet" and a single cell in the A1 position. The spreadsheet has a column width of 100 units for the A column. The code also includes a version number of "0.0.1" at the end.
```

**User**: let's play tic tac toe

**Assistant**: ```ocaml
This code generates a Tic Tac Toe game interface. The generated code sets up a 3x3 grid with cells that can be filled with "X" or "O" by players. The goal is to get 3 of your symbols in a row, either horizontally, vertically, or diagonally, to win the game.
```

### Code

```
title "Tic Tac Toe"
instructions `
Play Tic Tac Toe by entering "X" or "O" into the cells.
First player to get 3 in a row horizontally, vertically, or diagonally wins!
`
columns {
  A: { width: 30 justify: "center" }
  B: { width: 30 justify: "center" }
  C: { width: 30 justify: "center" }
}
cells {
  A1: {
    text: ""
    attrs: {
      border: "bottom,right"
    }
  }
  B1: {
    text: ""
    attrs: {
      border: "bottom,right,left"
    }
  }
  C1: {
    text: ""
    attrs: {
      border: "bottom,left"
    }
  }
  A2: {
    text: ""
    attrs: {
      border: "top,bottom,right"
    }
  }
  B2: {
    text: ""
    attrs: {
      border: "top,bottom,right,left"
    }
  }
  C2: {
    text: ""
    attrs: {
      border: "top,bottom,left"
    }
  }
  A3: {
    text: ""
    attrs: {
      border: "top,right"
    }
  }
  B3: {
    text: ""
    attrs: {
      border: "top,right,left"
    }
  }
  C3: {
    text: ""
    attrs: {
      border: "top,left"
    }
  }
}
{
  hideMenu: true
  v: "0.0.1"
}..
```

---

### Prompt
"Create an assessment using the following table:

| CATEGORY | AMOUNT | DETAILS |
| --- | --- | --- |
| Income | $4,000.00 | Total monthly income |
| Rent |  | 35% of your total income |
| Utilities | $200.00 | Fixed expense |
| Food |  | 15% of your total income |
| Transportation |  | 10% of your total income |
| Entertainment | $150.00 | Fixed expense |
| Savings |  | 20% of your total income |
| Miscellaneous |  | Remaining income after all other expenses |

change the income value to 5000

use unformatted value in the text field

format column B as Currency

score by formula rather than value

make columns A and C protected

make cell b1 protected

make cells b2, b4 and b7 protected

make row 1 bold"

### Chat Transcript

**User**: Create an assessment using the following table:

| CATEGORY | AMOUNT | DETAILS |
| --- | --- | --- |
| Income | $4,000.00 | Total monthly income |
| Rent |  | 35% of your total income |
| Utilities | $200.00 | Fixed expense |
| Food |  | 15% of your total income |
| Transportation |  | 10% of your total income |
| Entertainment | $150.00 | Fixed expense |
| Savings |  | 20% of your total income |
| Miscellaneous |  | Remaining income after all other expenses |

**Assistant**: ```ocaml
This generated code creates a monthly budget assessment table. The table includes categories like Rent, Food, Transportation, and Savings, which are calculated as percentages of the total monthly income of $4,000. The table also has fixed expenses like Utilities and Entertainment, and a Miscellaneous category for the remaining income after all other expenses. The purpose of this generated code is to help the user calculate and track their monthly budget.
```

**User**: change the income value to 5000

**Assistant**: ```ocaml
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The code also includes fixed expenses for utilities and entertainment, and the remaining income is allocated to a miscellaneous category.
```

**User**: use unformatted value in the text field

**Assistant**: ```ocaml
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a given monthly income of $5,000. The code also includes fixed expenses like utilities and entertainment, and the remaining income is allocated to a miscellaneous category.
```

**User**: format column B as Currency

**Assistant**: ```ocaml
This generated Graffiticode creates a monthly budget assessment tool. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a given monthly income of $5,000. The tool also includes fixed expenses like utilities and entertainment, and the remaining income is categorized as "Miscellaneous." The purpose is to help the user understand how their income should be allocated across different budget items.
```

**User**: score by formula rather than value

**Assistant**: ```ocaml
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses like utilities and entertainment, and the remaining income is calculated as the "Miscellaneous" category.
```

**User**: make columns A and C protected

**Assistant**: ```ocaml
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses like utilities and entertainment, and a miscellaneous category for the remaining income after all other expenses are accounted for.
```

**User**: make cell b1 protected

**Assistant**: ```ocaml
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories based on a $5,000 monthly income. The code sets up the spreadsheet structure, including formulas to automatically calculate the budget items as percentages of the total income or as fixed expenses.
```

**User**: make cells b2, b4 and b7 protected

**Assistant**: ```ocaml
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses for utilities and entertainment, and the remaining income is calculated as the "Miscellaneous" category.
```

**User**: make row 1 bold

**Assistant**: ```ocaml
The generated code creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses for utilities and entertainment, and the remaining income is calculated as the "Miscellaneous" category.
```

### Code

```
title "Monthly Budget Assessment"
instructions `
Calculate the missing dollar amounts in the budget based on the $5000 monthly income.
- Rent, Food, Transportation, and Savings should be calculated as percentages of total income
- Utilities and Entertainment are fixed expenses
- Miscellaneous is the remaining income after all other expenses
Enter the correct formulas in the AMOUNT column.
`
columns {
  A: {
    width: 120
    protected: true
  }
  B: {
    width: 100
    format: "Currency"
  }
  C: {
    width: 200
    protected: true
  }
}
cells {
  A1: {
    text: "CATEGORY"
    attrs: {
      fontWeight: "bold"
    }
  }
  B1: {
    text: "AMOUNT"
    attrs: {
      protected: true
      fontWeight: "bold"
    }
  }
  C1: {
    text: "DETAILS"
    attrs: {
      fontWeight: "bold"
    }
  }

  A2: { text: "Income" }
  B2: {
    text: "5000"
    attrs: {
      protected: true
    }
  }
  C2: { text: "Total monthly income" }

  A3: { text: "Rent" }
  B3: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B2*0.35"
      }
    }
  }
  C3: { text: "35% of your total income" }

  A4: { text: "Utilities" }
  B4: {
    text: "200"
    attrs: {
      protected: true
    }
  }
  C4: { text: "Fixed expense" }

  A5: { text: "Food" }
  B5: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B2*0.15"
      }
    }
  }
  C5: { text: "15% of your total income" }

  A6: { text: "Transportation" }
  B6: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B2*0.1"
      }
    }
  }
  C6: { text: "10% of your total income" }

  A7: { text: "Entertainment" }
  B7: {
    text: "150"
    attrs: {
      protected: true
    }
  }
  C7: { text: "Fixed expense" }

  A8: { text: "Savings" }
  B8: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B2*0.2"
      }
    }
  }
  C8: { text: "20% of your total income" }

  A9: { text: "Miscellaneous" }
  B9: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B2-SUM(B3:B8)"
      }
    }
  }
  C9: { text: "Remaining income after all other expenses" }
}
{
  v: "0.0.6"
}..
```

---

### Prompt
"Create a 2 by 2 spreadsheet with the cell contents being the cell names

make column A protected

make b1 protected"

### Chat Transcript

**User**: Create a 2 by 2 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple spreadsheet-like structure with two columns, each 100 units wide, and four cells with text content. The code defines an object called "columns" that specifies the width of each column, and another object called "cells" that defines the text content for each cell. Finally, the code combines these two objects into a single output.

**User**: make column A protected

**Assistant**: ```ocaml
The generated code creates a simple spreadsheet-like layout with two columns, A and B, each 100 pixels wide. The first column, A, has its width protected, meaning it cannot be resized. The code then defines four cells within this layout, labeled A1, A2, B1, and B2, each with a text value.
```

**User**: make b1 protected

**Assistant**: ```ocaml
The generated code creates a simple spreadsheet-like structure with two columns, A and B, each 100 pixels wide. Within this structure, it defines four cells: A1 with the text "A1", A2 with the text "A2", B1 with the text "B1" and marked as protected, and B2 with the text "B2". The code also includes a version number of "0.0.2".
```

### Code

```
columns {
  A: {
    width: 100
    protected: true
  }
  B: { width: 100 }
}
cells {
  A1: { text: "A1" }
  A2: { text: "A2" }
  B1: {
    text: "B1"
    attrs: {
      protected: true
    }
  }
  B2: { text: "B2" }
}
{
  v: "0.0.2"
}..
```

---

### Prompt
"Create a spreadsheet assessment for a simple income statement.

Add to the instructions what the Revenue should be

Add the values for Revenue and Operating Expenses and instruct the student to complete the rest of the statement

Change the label Net Income to After Tax Income

Remove the instructions about revenue and operating expenses"

### Chat Transcript

**User**: Create a spreadsheet assessment for a simple income statement.

**Assistant**: ```ocaml
The generated Graffiticode creates an income statement assessment tool. It allows users to input the total revenue, and the code will automatically calculate the gross profit, operating expenses, operating income, income tax, and net income based on the provided formulas. The purpose of this generated code is to provide a simple and interactive way for users to assess their income statement without needing to perform the calculations manually.
```

**User**: Add to the instructions what the Revenue should be

**Assistant**: ```ocaml
This generated Graffiticode creates an income statement assessment template. It prompts the user to fill in missing values, such as the total revenue, operating expenses, and income tax. The code then calculates the gross profit, operating income, income tax, and net income based on the provided information. The goal is to guide the user through the process of completing an income statement.
```

**User**: Add the values for Revenue and Operating Expenses and instruct the student to complete the rest of the statement

**Assistant**: ```ocaml
This generated code creates an income statement assessment template. It provides instructions for the user to fill in missing values, such as the cost of goods sold, operating expenses, income tax, and net income. The code also sets up the layout of the income statement, including column widths and text alignment, to make it easy for the user to input and view the financial information.
```

**User**: Change the label Net Income to After Tax Income

**Assistant**: ```ocaml
This generated code creates an income statement assessment template. It provides instructions for the user to fill in missing values, such as the cost of goods sold, operating expenses, and income tax rate. The code then calculates the gross profit, operating income, income tax, and after-tax income based on the provided information, and allows the user to check their work by assessing the formulas used in the calculations.
```

**User**: Remove the instructions about revenue and operating expenses

**Assistant**: ```ocaml
This code generates an income statement assessment template. The template includes fields for revenue, cost of goods sold, gross profit, operating expenses, operating income, income tax, and after-tax income. The user is instructed to fill in the missing values, and the code will automatically calculate the gross profit, operating income, income tax, and after-tax income based on the provided formulas.
```

### Code

```
title "Income Statement Assessment"
instructions `
Fill in the missing values to complete the income statement:
- Calculate the gross profit by subtracting the cost of goods sold from the revenue
- Calculate the operating income by subtracting the operating expenses from the gross profit
- The income tax rate is 20%
- Calculate the income tax by multiplying the operating income by 20%
- Calculate the after tax income by subtracting the income tax from the operating income
`
columns {
  A: { width: 200 }
  B: {
    width: 100
    justify: "right"
  }
}
cells {
  A1: { text: "Revenue" }
  B1: { text: "1000" }
  A2: { text: "Cost of Goods Sold" }
  B2: { text: "400" }
  A3: { text: "Gross Profit" }
  B3: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1-B2"
      }
    }
  }
  A4: { text: "Operating Expenses" }
  B4: { text: "300" }
  A5: { text: "Operating Income" }
  B5: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B3-B4"
      }
    }
  }
  A6: { text: "Income Tax (20%)" }
  B6: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B5*0.2"
      }
    }
  }
  A7: { text: "After Tax Income" }
  B7: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B5-B6"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Prompt
"Prepare the General Journal entries to account for the share issue using the following data:

| Date | Details | Debit | Credit |
| --- | --- | --- | --- |
| 2025 |  |  |  |
| March 31 | Cash at Bank | 600 000 |  |
|  | Application – Ordinary Share capital |  | 600 000 |
|  | Cash received on application 400 000 ordinary shares at $1.50 |  |  |
|  |  |  |  |
| April 15 | Application – Ordinary Share capital | 600 000 |  |
|  |  |  |  |
|  | Share Capital |  | 600 000 |
|  | To record the allotment of 400 000 ordinary shares at $1.50 |  |  |
|  |  |  |  |
| April 23 | Share Issue Costs | (1) 8 000 |  |
|  | Accounts Payable |  | 8 000 |
|  | Share issue costs on credit ABN Stockbroking Pty Ltd |  |  |

left justify column B

remove (1) from c13

bold row 1

format columns c and d as currency

validate the numeric values in columns   c and d

remove the values from the validated cells"

### Chat Transcript

**User**: Prepare the General Journal entries to account for the share issue using the following data:

| Date | Details | Debit | Credit |
| --- | --- | --- | --- |
| 2025 |  |  |  |
| March 31 | Cash at Bank | 600 000 |  |
|  | Application – Ordinary Share capital |  | 600 000 |
|  | Cash received on application 400 000 ordinary shares at $1.50 |  |  |
|  |  |  |  |
| April 15 | Application – Ordinary Share capital | 600 000 |  |
|  |  |  |  |
|  | Share Capital |  | 600 000 |
|  | To record the allotment of 400 000 ordinary shares at $1.50 |  |  |
|  |  |  |  |
| April 23 | Share Issue Costs | (1) 8 000 |  |
|  | Accounts Payable |  | 8 000 |
|  | Share issue costs on credit ABN Stockbroking Pty Ltd |  |  |

**Assistant**: ```ocaml
The generated code creates a table with a general journal entry assessment. It records the cash received from the issuance of 400,000 ordinary shares at $1.50 per share, the allotment of those shares, and the share issue costs incurred. The purpose of this code is to provide a structured way to account for the share issuance transaction.
```

**User**: left justify column B

**Assistant**: ```ocaml
This generated Graffiticode creates a table that represents the general journal entries for a company's share issue. The table includes details such as the date, description, debit, and credit amounts related to the cash received from the share application, the allotment of shares, and the share issue costs. The purpose of this generated code is to provide a clear and organized record of the accounting transactions involved in the share issue process.
```

**User**: remove (1) from c13

**Assistant**: ```ocaml
This generated Graffiticode creates a table that represents the general journal entries for a share issue. The table includes details such as the date, description, debit, and credit amounts related to the cash received from the share application, the allotment of the shares, and the share issue costs. The purpose of this generated code is to provide a structured way to record the accounting transactions associated with the share issue.
```

**User**: bold row 1

**Assistant**: ```ocaml
This generated Graffiticode creates a table with a general journal entry for a share issue. It includes details such as the date, description, debit and credit amounts related to the cash received from the share application, the allotment of shares, and the share issue costs. The purpose of this generated code is to provide a structured format for recording the accounting entries associated with the share issue.
```

**User**: format columns c and d as currency

**Assistant**: ```ocaml
This generated Graffiticode creates a table with a general journal entry for a share issue. It includes details such as the date, description, debit and credit amounts related to the cash received from the share application, the recording of the share capital, and the share issue costs. The purpose of this generated code is to provide a structured format for recording the accounting entries associated with the share issue.
```

**User**: validate the numeric values in columns   c and d

**Assistant**: ```ocaml
This generated Graffiticode creates a table with a general journal entry to record the issuance of 400,000 ordinary shares at $1.50 per share. The code sets up the table structure, column widths, and formatting, and then populates the cells with the relevant financial details, such as the date, description, debit, and credit amounts. The purpose of this generated code is to provide a template for recording the share issue transaction in the general journal.
```

**User**: remove the values from the validated cells

**Assistant**: ```ocaml
This generated Graffiticode creates a table with a general journal entry for a share issue. The table includes columns for the date, details, debit, and credit, and the rows contain specific entries related to the cash received from the share application, the allotment of the shares, and the share issue costs. The purpose of this generated code is to provide a structured format for recording the financial transactions associated with the share issue.
```

### Code

```
title "General Journal Entries"
instructions `
Prepare the General Journal entries to account for the share issue using the following data:
`
columns {
  A: {
    width: 100
    protected: true
  }
  B: {
    width: 300
    justify: "left"
    protected: true
  }
  C: {
    width: 100
    format: "currency"
  }
  D: {
    width: 100
    format: "currency"
  }
}
cells {
  A1: {
    text: "Date"
    attrs: {
      fontWeight: "bold"
    }
  }
  B1: {
    text: "Details"
    attrs: {
      fontWeight: "bold"
    }
  }
  C1: {
    text: "Debit"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  D1: {
    text: "Credit"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }

  A3: { text: "2025" }
  A4: { text: "March 31" }
  B4: { text: "Cash at Bank" }
  C4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "600000"
      }
    }
  }
  B5: { text: "Application – Ordinary Share capital" }
  D5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "600000"
      }
    }
  }
  B6: { text: "Cash received on application 400 000 ordinary shares at $1.50" }

  A8: { text: "April 15" }
  B8: { text: "Application – Ordinary Share capital" }
  C8: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "600000"
      }
    }
  }
  B10: { text: "Share Capital" }
  D10: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "600000"
      }
    }
  }
  B11: { text: "To record the allotment of 400 000 ordinary shares at $1.50" }

  A13: { text: "April 23" }
  B13: { text: "Share Issue Costs" }
  C13: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "8000"
      }
    }
  }
  B14: { text: "Accounts Payable" }
  D14: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "8000"
      }
    }
  }
  B15: { text: "Share issue costs on credit ABN Stockbroking Pty Ltd" }
}
{
  v: "0.0.1"
}..
```

---

### Prompt
"change the cell value of A1 to 100

make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

remove all but the cells A1, A2 and A3

add the validation for a3 that the value is 300"

### Chat Transcript

**User**: change the cell value of A1 to 100

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific width (100) and contains some text, such as numbers or labels. The generated code defines the properties of the columns and the content of the cells, allowing for the creation of a basic spreadsheet-style layout.

**User**: make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific text value, and one cell (A3) has a formula that calculates the sum of the values in cells A1 and A2. The code defines the width of each column and the content of each cell, allowing for the creation of a basic spreadsheet-like layout.

**User**: remove all but the cells A1, A2 and A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" in the first column. The third row contains a formula that calculates the sum of the values in the first two rows and displays the result.

**User**: add the validation for a3 that the value is 300

**Assistant**: ```ocaml
This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" respectively, and the third row calculates the sum of those two values and checks if the result is "300". The generated code sets the width of the first column to 100 and defines the text and assessment criteria for each cell in the spreadsheet.
```

### Code

```
columns {
  A: { width: 100 }
}
cells {
  A1: { text: "100" }
  A2: { text: "200" }
  A3: {
    text: "=sum(A1:A2)"
    attrs: {
      assess: {
        method: "value"
        expected: "300"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Prompt
"Create a 2 by 2 spreadsheet with the cell contents being the cell names

Create a 4 by 4 spreadsheet with the cell contents being the cell names

change the cell value of A1 to 100"

### Chat Transcript

**User**: Create a 2 by 2 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple spreadsheet-like structure with two columns, each 100 units wide, and four cells with text content. The code defines an object called "columns" that specifies the width of each column, and another object called "cells" that defines the text content for each cell. Finally, the code combines these two objects into a single output.

**User**: Create a 4 by 4 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple table structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the table has a specific text value, such as "A1", "B2", "C3", and so on. The code also defines the width of each column to be 100 units. This table structure can be used as a building block for creating more complex data visualizations or user interfaces.

**User**: change the cell value of A1 to 100

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific width (100) and contains some text, such as numbers or labels. The generated code defines the properties of the columns and the content of the cells, allowing for the creation of a basic spreadsheet-style layout.

### Code

```
columns {
  A: { width: 100 }
  B: { width: 100 }
  C: { width: 100 }
  D: { width: 100 }
}
cells {
  A1: { text: "100" }
  A2: { text: "A2" }
  A3: { text: "A3" }
  A4: { text: "A4" }
  B1: { text: "B1" }
  B2: { text: "B2" }
  B3: { text: "B3" }
  B4: { text: "B4" }
  C1: { text: "C1" }
  C2: { text: "C2" }
  C3: { text: "C3" }
  C4: { text: "C4" }
  D1: { text: "D1" }
  D2: { text: "D2" }
  D3: { text: "D3" }
  D4: { text: "D4" }
}
{
  v: "0.0.2"
}..
```

