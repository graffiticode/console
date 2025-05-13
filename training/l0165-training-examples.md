# Graffiticode Training Examples

## Language L0165

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

score by formula rather than value"

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
  A: { width: 120 }
  B: {
    width: 100
    format: "Currency"
  }
  C: { width: 200 }
}
cells {
  A1: { text: "CATEGORY" }
  B1: { text: "AMOUNT" }
  C1: { text: "DETAILS" }

  A2: { text: "Income" }
  B2: { text: "5000" }
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
  B4: { text: "200" }
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
  B7: { text: "150" }
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
  v: "0.0.5"
}..
```

---

### Prompt
"create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs."

### Chat Transcript

**User**: create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

**Assistant**: This generated Graffiticode creates a table with two columns, A and B. Column A is set to a width of 100 and the text is aligned to the right, while Column B is also set to a width of 100 but the text is aligned to the left. The code then generates two rows of data, with the first row containing the values "100" in Column A and "cows" in Column B. The second row contains the values "200" in Column A and "pigs" in Column B, and the code also includes assessment criteria to verify that the values in the second row match the expected values.

### Code

```
columns {
  A: {
    width: 100
    justify: "right"
  }
  B: {
    width: 100
    justify: "left "
  }
}
cells {
  A1: { text: "100"
    attrs: {
      assess: {
        method: "value"
        expected: "100"
      }
    }
  }
  B1: { text: "cows" }
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
  }
}
{
  v: "0.0.1"
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
"Create a 2 by 2 spreadsheet with the cell contents being the cell names"

### Chat Transcript

**User**: Create a 2 by 2 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple spreadsheet-like structure with two columns, each 100 units wide, and four cells with text content. The code defines an object called "columns" that specifies the width of each column, and another object called "cells" that defines the text content for each cell. Finally, the code combines these two objects into a single output.

### Code

```
columns {
  A: { width: 100 }
  B: { width: 100 }
}
cells {
  A1: { text: "A1" }
  A2: { text: "A2" }
  B1: { text: "B1" }
  B2: { text: "B2" }
}
{
  v: "0.0.2"
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

