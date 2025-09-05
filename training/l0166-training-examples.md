# Graffiticode Training Examples

*Downloaded on 2025-09-02T21:38:09.061Z*

## Language L0165

### Example 1

#### Prompt
"Create a 2 by 2 spreadsheet with the cell contents being the cell names

Create a 4 by 4 spreadsheet with the cell contents being the cell names

change the cell value of A1 to 100"

#### Chat Transcript

**User**: Create a 2 by 2 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple spreadsheet-like structure with two columns, each 100 units wide, and four cells with text content. The code defines an object called "columns" that specifies the width of each column, and another object called "cells" that defines the text content for each cell. Finally, the code combines these two objects into a single output.

**User**: Create a 4 by 4 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple table structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the table has a specific text value, such as "A1", "B2", "C3", and so on. The code also defines the width of each column to be 100 units. This table structure can be used as a building block for creating more complex data visualizations or user interfaces.

**User**: change the cell value of A1 to 100

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific width (100) and contains some text, such as numbers or labels. The generated code defines the properties of the columns and the content of the cells, allowing for the creation of a basic spreadsheet-style layout.

#### Code

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

---

### Example 2

#### Prompt
"add 10 and 20 in a table"

#### Chat Transcript

**User**: add 10 and 20 in a table

**Assistant**: ```graffiticode
This generated code creates a simple spreadsheet with two columns (A and B) that demonstrates basic addition. The spreadsheet contains the numbers 10 and 20 in cells A1 and A2, and cell A3 contains a formula that adds these two numbers together. The code also includes an automatic assessment feature that checks whether the formula correctly calculates the sum as 30.
```

#### Code

```
title ""
instructions `
`
columns {
  A: {
    width: 100
    justify: "center"
  }
  B: {
    width: 100
    justify: "center"
  }
}
cells {
  A1: { text: "10" }
  A2: { text: "20" }
  A3: {
    text: "=A1+A2"
    attrs: {
      assess: {
        method: "value"
        expected: "30"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 3

#### Prompt
"i want to create a vertical math assessment for basic arithmetic. you pick the values to assess

that's interesting, but I want to create a single problem arranged vertically

that's good, but remove row 3 and add a border bottom true to b2

sorry, i wasn't being clear. set border to "bottom"

format numbers using #,##0

move coumn a to column b

move the + in B2 to A2

change the value in b2 to 6345

set the border underline for a2"

#### Chat Transcript

**User**: i want to create a vertical math assessment for basic arithmetic. you pick the values to assess

**Assistant**: ```graffiticode
This generated code creates a basic arithmetic assessment with six questions. The user is presented with arithmetic problems, and they must enter the correct answers in the empty cells. The code includes instructions for the user and sets up the layout of the assessment, with the questions in the left column and the answer cells in the right column.
```

**User**: that's interesting, but I want to create a single problem arranged vertically

**Assistant**: ```graffiticode
The generated code creates a vertical arithmetic problem where the user needs to solve the addition of 4327 and 958. The code sets up a table with a single column, and the first three rows display the numbers to be added vertically. The fourth row is left blank for the user to enter the solution, which is expected to be 5285.
```

**User**: that's good, but remove row 3 and add a border bottom true to b2

**Assistant**: ```graffiticode
This code generates a simple arithmetic problem where the user needs to add two numbers vertically. The problem is presented with the first number "4327" and the second number "+958" displayed, and the user is expected to enter the correct result of "5285" in the empty cell below. The generated code sets up the layout and formatting for this arithmetic problem.
```

**User**: sorry, i wasn't being clear. set border to "bottom"

**Assistant**: ```graffiticode
The generated code creates a simple arithmetic problem where the user needs to add two numbers vertically. The problem is presented with the first number "4327" and the second number "+958" displayed, and the user is expected to enter the correct result of "5285" in the empty cell below. This type of interactive arithmetic exercise can be used to test or practice basic math skills.
```

**User**: format numbers using #,##0

**Assistant**: ```graffiticode
The generated code creates a simple arithmetic problem where the user needs to add two numbers, 4,327 and 958, and enter the result in the third cell. The code sets up the layout and formatting of the problem, including the column width, text formatting, and a bottom border for the second row. The third cell is set up to assess the user's input, expecting the correct answer of 5,285.
```

**User**: move coumn a to column b

**Assistant**: ```graffiticode
The generated code creates a simple arithmetic problem where the user needs to solve the addition of two numbers, 4,327 and 958, and enter the result in the provided cell. The code sets up the layout and formatting of the problem, including the instructions, column widths, and the expected result of 5,285.
```

**User**: move the + in B2 to A2

**Assistant**: ```graffiticode
The generated code creates a simple arithmetic problem where the user needs to solve the addition of two numbers, 4,327 and 958, and enter the result in the provided cell. The code sets up the layout of the problem, including the column widths and the formatting of the numbers, and includes an assessment to check if the user's answer is correct.
```

**User**: change the value in b2 to 6345

**Assistant**: ```graffiticode
The generated code creates a simple arithmetic problem where the user needs to solve the addition of two large numbers, "4,327" and "6,345", and enter the result in the provided cell. The code sets up the layout of the problem, including the column widths and the formatting of the numbers, and includes an assessment to check if the user's answer is correct.
```

**User**: set the border underline for a2

**Assistant**: ```graffiticode
This generated Graffiticode creates a simple vertical arithmetic problem. It displays two large numbers, one above the other, with a "+" symbol between them. The user is instructed to solve the problem by entering the result in the cell below. The generated code formats the numbers with commas for readability and includes an assessment to check if the user's answer is correct.
```

#### Code

```
title "Vertical Arithmetic Problem"
instructions `
Solve the following arithmetic problem, entering the result below:
`
columns {
  A: { width: 30 }
  B: { width: 50 }
}
cells {
  A2: {
    text: "+"
    attrs: {
      border: "bottom"
    }
  }
  B1: {
    text: "  4,327"
    attrs: {
      format: "#,##0"
    }
  }
  B2: {
    text: "  6,345"
    attrs: {
      border: "bottom"
      format: "#,##0"
    }
  }
  B3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "10672"
      }
      format: "#,##0"
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 4

#### Prompt
"create a simple check book register assessment. the goal is for the student to balance a checkbook given several transactions

format column a using date"

#### Chat Transcript

**User**: create a simple check book register assessment. the goal is for the student to balance a checkbook given several transactions

**Assistant**: ```graffiticode
This creates an interactive checkbook balancing exercise where students practice calculating running account balances by filling in the correct balance amounts after each deposit and withdrawal transaction.
```

**User**: format column a using date

**Assistant**: ```graffiticode
This creates an interactive checkbook register exercise where students practice calculating running account balances by filling in the correct amounts after each deposit and withdrawal transaction.
```

#### Code

```
title "Checkbook Register Balance Assessment"
instructions `
- Complete the missing balance calculations
- Starting balance is $1,500.00
- For each transaction, calculate the new balance
- Deposits add to the balance, checks/withdrawals subtract from it
`
columns {
  A: { width: 100 format: "date" }
  B: { width: 80 }
  C: { width: 200 }
  D: { width: 100 justify: "right" }
  E: { width: 100 justify: "right" }
  F: { width: 120 justify: "right" }
}
cells {
  A1: { text: "Date" attrs: { fontWeight: "bold" } }
  B1: { text: "Check #" attrs: { fontWeight: "bold" } }
  C1: { text: "Description" attrs: { fontWeight: "bold" } }
  D1: { text: "Withdrawal" attrs: { fontWeight: "bold" } }
  E1: { text: "Deposit" attrs: { fontWeight: "bold" } }
  F1: { text: "Balance" attrs: { fontWeight: "bold" } }

  A2: { text: "1/1/2024" }
  B2: { text: "" }
  C2: { text: "Starting Balance" }
  D2: { text: "" }
  E2: { text: "" }
  F2: { text: "1500.00" attrs: { fontWeight: "bold" } }

  A3: { text: "1/3/2024" }
  B3: { text: "1001" }
  C3: { text: "Rent Payment" }
  D3: { text: "850.00" }
  E3: { text: "" }
  F3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "650"
      }
    }
  }

  A4: { text: "1/5/2024" }
  B4: { text: "" }
  C4: { text: "Paycheck Deposit" }
  D4: { text: "" }
  E4: { text: "2100.00" }
  F4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "2750.00"
      }
    }
  }

  A5: { text: "1/8/2024" }
  B5: { text: "1002" }
  C5: { text: "Grocery Store" }
  D5: { text: "127.50" }
  E5: { text: "" }
  F5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "2622.50"
      }
    }
  }

  A6: { text: "1/10/2024" }
  B6: { text: "1003" }
  C6: { text: "Electric Bill" }
  D6: { text: "95.00" }
  E6: { text: "" }
  F6: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "2527.50"
      }
    }
  }

  A7: { text: "1/15/2024" }
  B7: { text: "" }
  C7: { text: "ATM Withdrawal" }
  D7: { text: "200.00" }
  E7: { text: "" }
  F7: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "2327.50"
      }
    }
  }

  A8: { text: "1/18/2024" }
  B8: { text: "" }
  C8: { text: "Freelance Payment" }
  D8: { text: "" }
  E8: { text: "450.00" }
  F8: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "2777.50"
      }
    }
  }

  A9: { text: "1/22/2024" }
  B9: { text: "1004" }
  C9: { text: "Car Insurance" }
  D9: { text: "185.00" }
  E9: { text: "" }
  F9: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "2592.50"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 5

#### Prompt
"print fizzbuzz"

#### Chat Transcript

**User**: print fizzbuzz

**Assistant**: ```graffiticode
This generated code creates an interactive FizzBuzz learning exercise in the form of a spreadsheet. The code sets up a two-column table where students can practice the classic FizzBuzz problem by filling in the correct answers for numbers 1 through 15 - writing "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of both, and the number itself otherwise. The system automatically checks each answer against the expected solution to provide immediate feedback to learners.
```

#### Code

```
title "FizzBuzz"
instructions `
- Fill in the FizzBuzz values for numbers 1-15
- Numbers divisible by 3 should be "Fizz"
- Numbers divisible by 5 should be "Buzz"
- Numbers divisible by both 3 and 5 should be "FizzBuzz"
- Otherwise, use the number itself
`
columns {
  A: {
    width: 100
    justify: "center"
  }
  B: {
    width: 100
    justify: "center"
  }
}
cells {
  A1: {
    text: "Number"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  B1: {
    text: "FizzBuzz"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  A2: { text: "1" attrs: { protected: true } }
  B2: { text: "" attrs: { assess: { method: "value" expected: "1" } } }
  A3: { text: "2" attrs: { protected: true } }
  B3: { text: "" attrs: { assess: { method: "value" expected: "2" } } }
  A4: { text: "3" attrs: { protected: true } }
  B4: { text: "" attrs: { assess: { method: "value" expected: "Fizz" } } }
  A5: { text: "4" attrs: { protected: true } }
  B5: { text: "" attrs: { assess: { method: "value" expected: "4" } } }
  A6: { text: "5" attrs: { protected: true } }
  B6: { text: "" attrs: { assess: { method: "value" expected: "Buzz" } } }
  A7: { text: "6" attrs: { protected: true } }
  B7: { text: "" attrs: { assess: { method: "value" expected: "Fizz" } } }
  A8: { text: "7" attrs: { protected: true } }
  B8: { text: "" attrs: { assess: { method: "value" expected: "7" } } }
  A9: { text: "8" attrs: { protected: true } }
  B9: { text: "" attrs: { assess: { method: "value" expected: "8" } } }
  A10: { text: "9" attrs: { protected: true } }
  B10: { text: "" attrs: { assess: { method: "value" expected: "Fizz" } } }
  A11: { text: "10" attrs: { protected: true } }
  B11: { text: "" attrs: { assess: { method: "value" expected: "Buzz" } } }
  A12: { text: "11" attrs: { protected: true } }
  B12: { text: "" attrs: { assess: { method: "value" expected: "11" } } }
  A13: { text: "12" attrs: { protected: true } }
  B13: { text: "" attrs: { assess: { method: "value" expected: "Fizz" } } }
  A14: { text: "13" attrs: { protected: true } }
  B14: { text: "" attrs: { assess: { method: "value" expected: "13" } } }
  A15: { text: "14" attrs: { protected: true } }
  B15: { text: "" attrs: { assess: { method: "value" expected: "14" } } }
  A16: { text: "15" attrs: { protected: true } }
  B16: { text: "" attrs: { assess: { method: "value" expected: "FizzBuzz" } } }
}
{
  v: "0.0.1"
}..
```

---

### Example 6

#### Prompt
"create a table of twillio's quarterly revenue for the last 5 years

add validations to every 3rd revenue value

replace the Q4 heading and make the row and column headings protected

format the numeric values using ($#,##0)"

#### Chat Transcript

**User**: create a table of twillio's quarterly revenue for the last 5 years

**Assistant**: ```graffiticode
This Graffiticode creates a clear, formatted table showing Twilio's quarterly revenue growth from 2019 to 2023, displaying how the company's earnings have consistently increased over the past five years.
```

**User**: add validations to every 3rd revenue value

**Assistant**: ```graffiticode
This application helps users track and analyze Twilio's quarterly revenue growth from 2019 to 2023, allowing them to review financial performance and fill in missing data points in an interactive spreadsheet format.
```

**User**: replace the Q4 heading and make the row and column headings protected

**Assistant**: ```graffiticode
This interactive spreadsheet helps users track and complete Twilio's quarterly revenue data from 2019 to 2023, allowing them to fill in missing financial figures and observe the company's consistent revenue growth over time.
```

**User**: format the numeric values using ($#,##0)

**Assistant**: ```graffiticode
This application helps users track and complete Twilio's quarterly revenue data from 2019 to 2023, allowing them to fill in missing financial information and observe the company's consistent revenue growth over time.
```

#### Code

```
title "Twilio Quarterly Revenue (2019-2023)"
instructions `
- Review Twilio's quarterly revenue data for the last 5 years
- All figures are in millions USD
- Data shows consistent growth trajectory
- Complete the missing values where indicated
`
columns {
  A: {
    width: 80
  }
  B: {
    width: 80
    format: "($#,##0)"
  }
  C: {
    width: 80
    format: "($#,##0)"
  }
  D: {
    width: 80
    format: "($#,##0)"
  }
  E: {
    width: 80
    format: "($#,##0)"
  }
}
cells {
  A1: {
    text: "Year"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  B1: {
    text: "Q1"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  C1: {
    text: "Q2"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  D1: {
    text: "Q3"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  E1: {
    text: "Q4 Final"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  A2: {
    text: "2019"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  B2: {
    text: "$233.2"
  }
  C2: {
    text: "$275.0"
  }
  D2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "$295.0"
      }
    }
  }
  E2: {
    text: "$331.2"
  }
  A3: {
    text: "2020"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  B3: {
    text: "$364.9"
  }
  C3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "$400.8"
      }
    }
  }
  D3: {
    text: "$447.9"
  }
  E3: {
    text: "$548.1"
  }
  A4: {
    text: "2021"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  B4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "$589.9"
      }
    }
  }
  C4: {
    text: "$668.9"
  }
  D4: {
    text: "$740.2"
  }
  E4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "$842.7"
      }
    }
  }
  A5: {
    text: "2022"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  B5: {
    text: "$875.1"
  }
  C5: {
    text: "$943.4"
  }
  D5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "$983.0"
      }
    }
  }
  E5: {
    text: "$1,005.1"
  }
  A6: {
    text: "2023"
    attrs: {
      fontWeight: "bold"
      protected: true
    }
  }
  B6: {
    text: "$1,007.5"
  }
  C6: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "$1,013.2"
      }
    }
  }
  D6: {
    text: "$1,033.8"
  }
  E6: {
    text: "$1,034.2"
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 7

#### Prompt
"create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

protect the cells in column B

bold column b"

#### Chat Transcript

**User**: create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

**Assistant**: This generated Graffiticode creates a table with two columns, A and B. Column A is set to a width of 100 and the text is aligned to the right, while Column B is also set to a width of 100 but the text is aligned to the left. The code then generates two rows of data, with the first row containing the values "100" in Column A and "cows" in Column B. The second row contains the values "200" in Column A and "pigs" in Column B, and the code also includes assessment criteria to verify that the values in the second row match the expected values.

**User**: protect the cells in column B

**Assistant**: ```graffiticode
This generated Graffiticode creates a spreadsheet-like structure with two columns, A and B. Column A has cells with the numbers "100" and "200", and these cells are set up to be automatically assessed to ensure their values match the expected values. Column B has cells with the text "cows" and "pigs", and these cells are marked as protected, meaning they cannot be edited. The code also includes a version number of "0.0.1" at the end.
```

**User**: bold column b

**Assistant**: ```graffiticode
The generated code creates a spreadsheet-like table with two columns, A and B. Column A has cells with the numbers "100" and "200", which are set up to be automatically assessed for their values. Column B has cells with the words "cows" and "pigs", which are formatted to be in bold text. The code also includes some configuration settings, such as the width of the columns and the justification of the text.
```

#### Code

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

### Example 8

#### Prompt
"create a times table for integers up to 4

remove the validations for redundant cells and make their background gray

revert the last change and remove validations from duplicates

mark the unvalidated cells including the headers protected

change the background of the cells without validations light gray

use the attribute 'background' for background color

center justify the headings

now make the column width half as wide

now remove the validations the duplicate facts

make unprotected call white

make calls cells cells without validations light gray

make cells without validations protected"

#### Chat Transcript

**User**: create a times table for integers up to 4

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the empty cells with the correct products of multiplying the row and column numbers (like 2×3=6). The system automatically checks if the answers are correct, making it a self-grading math practice exercise.
```

**User**: remove the validations for redundant cells and make their background gray

**Assistant**: ```graffiticode
This code generates an interactive multiplication table worksheet for numbers 1 through 4. The generated spreadsheet has some cells pre-filled with example answers (highlighted in gray) while other cells are left blank for students to complete, with the system automatically checking if the entered answers match the correct multiplication results. It creates a learning exercise where students can practice their times tables by filling in the missing products in a structured grid format.
```

**User**: revert the last change and remove validations from duplicates

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells already completed as examples and others left blank for practice. It includes automatic checking to verify that students enter the correct answers in the empty cells.
```

**User**: mark the unvalidated cells including the headers protected

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells left blank as practice problems and others pre-filled or protected. When students enter their answers, the system automatically checks if they've entered the correct multiplication results.
```

**User**: change the background of the cells without validations light gray

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells already filled in as examples and others left blank for practice. The system automatically checks if the entered answers are correct and includes some grayed-out cells that can't be edited to guide students through the exercise.
```

**User**: use the attribute 'background' for background color

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells intentionally left blank or grayed out to create a progressive learning exercise. The system automatically checks if students enter the correct answers in the empty cells, making it a self-grading math practice tool.
```

**User**: center justify the headings

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students can practice their times tables by filling in empty cells with the correct products, while the row and column headers (showing the numbers being multiplied) are pre-filled and protected from editing. Some cells are intentionally left blank for students to complete, and the system can automatically check if their answers match the expected multiplication results.
```

**User**: now make the column width half as wide

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students need to fill in the missing products by multiplying the row and column numbers, with the headers and number labels already provided in gray boxes. Each empty cell automatically checks if the student entered the correct answer, making it a self-grading math practice exercise.
```

**User**: now remove the validations the duplicate facts

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students can practice their times tables by filling in empty cells with the correct products, while the row and column headers (showing the numbers being multiplied) are pre-filled and protected from editing. Some cells have built-in answer checking that will verify if students entered the correct multiplication results.
```

**User**: make unprotected call white

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a 5x5 grid where students can practice their times tables by filling in the missing products, with the row and column headers (showing the numbers being multiplied) already provided in gray boxes. When students enter answers in the blank cells, the system automatically checks if their responses match the correct multiplication results.
```

**User**: make calls cells cells without validations light gray

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students can fill in the missing products, with some cells left blank for practice and others pre-filled with the row and column headers. It includes automatic checking that validates whether students entered the correct answers in the empty cells, making it a self-grading math exercise.
```

**User**: make cells without validations protected

**Assistant**: ```graffiticode
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells already completed as examples and others left blank for practice. It includes automatic checking to verify that students enter the correct answers in the empty cells, making it a self-grading math exercise.
```

#### Code

```
title "Times Table (1-4)"
instructions `
- Complete the multiplication table
- Each cell should contain the product of its row and column numbers
`
columns {
  A: {
    width: 30
    justify: "center"
  }
  B: {
    width: 30
    justify: "center"
  }
  C: {
    width: 30
    justify: "center"
  }
  D: {
    width: 30
    justify: "center"
  }
  E: {
    width: 30
    justify: "center"
  }
}
cells {
  A1: {
    text: "×"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  B1: {
    text: "1"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  C1: {
    text: "2"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  D1: {
    text: "3"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  E1: {
    text: "4"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  A2: {
    text: "1"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  B2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "1"
      }
      background: "#ffffff"
    }
  }
  C2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "2"
      }
      background: "#ffffff"
    }
  }
  D2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "3"
      }
      background: "#ffffff"
    }
  }
  E2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "4"
      }
      background: "#ffffff"
    }
  }
  A3: {
    text: "2"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  B3: {
    text: ""
    attrs: {
      protected: true
      background: "#f0f0f0"
    }
  }
  C3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "4"
      }
      background: "#ffffff"
    }
  }
  D3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "6"
      }
      background: "#ffffff"
    }
  }
  E3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "8"
      }
      background: "#ffffff"
    }
  }
  A4: {
    text: "3"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  B4: {
    text: ""
    attrs: {
      protected: true
      background: "#f0f0f0"
    }
  }
  C4: {
    text: ""
    attrs: {
      protected: true
      background: "#f0f0f0"
    }
  }
  D4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "9"
      }
      background: "#ffffff"
    }
  }
  E4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "12"
      }
      background: "#ffffff"
    }
  }
  A5: {
    text: "4"
    attrs: {
      fontWeight: "bold"
      protected: true
      background: "#d3d3d3"
    }
  }
  B5: {
    text: ""
    attrs: {
      protected: true
      background: "#f0f0f0"
    }
  }
  C5: {
    text: ""
    attrs: {
      protected: true
      background: "#f0f0f0"
    }
  }
  D5: {
    text: ""
    attrs: {
      protected: true
      background: "#f0f0f0"
    }
  }
  E5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "16"
      }
      background: "#ffffff"
    }
  }
}
{
  hideMenu: true
  v: "0.0.1"
}..
```

---

### Example 9

#### Prompt
"create a starter template with one cell

let's play tic tac toe"

#### Chat Transcript

**User**: create a starter template with one cell

**Assistant**: ```graffiticode
This generated Graffiticode creates a simple spreadsheet with a title of "Untitled Spreadsheet" and a single cell in the A1 position. The spreadsheet has a column width of 100 units for the A column. The code also includes a version number of "0.0.1" at the end.
```

**User**: let's play tic tac toe

**Assistant**: ```graffiticode
This code generates a Tic Tac Toe game interface. The generated code sets up a 3x3 grid with cells that can be filled with "X" or "O" by players. The goal is to get 3 of your symbols in a row, either horizontally, vertically, or diagonally, to win the game.
```

#### Code

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

### Example 10

#### Prompt
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

#### Chat Transcript

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

**Assistant**: ```graffiticode
The generated code creates a table with a general journal entry assessment. It records the cash received from the issuance of 400,000 ordinary shares at $1.50 per share, the allotment of those shares, and the share issue costs incurred. The purpose of this code is to provide a structured way to account for the share issuance transaction.
```

**User**: left justify column B

**Assistant**: ```graffiticode
This generated Graffiticode creates a table that represents the general journal entries for a company's share issue. The table includes details such as the date, description, debit, and credit amounts related to the cash received from the share application, the allotment of shares, and the share issue costs. The purpose of this generated code is to provide a clear and organized record of the accounting transactions involved in the share issue process.
```

**User**: remove (1) from c13

**Assistant**: ```graffiticode
This generated Graffiticode creates a table that represents the general journal entries for a share issue. The table includes details such as the date, description, debit, and credit amounts related to the cash received from the share application, the allotment of the shares, and the share issue costs. The purpose of this generated code is to provide a structured way to record the accounting transactions associated with the share issue.
```

**User**: bold row 1

**Assistant**: ```graffiticode
This generated Graffiticode creates a table with a general journal entry for a share issue. It includes details such as the date, description, debit and credit amounts related to the cash received from the share application, the allotment of shares, and the share issue costs. The purpose of this generated code is to provide a structured format for recording the accounting entries associated with the share issue.
```

**User**: format columns c and d as currency

**Assistant**: ```graffiticode
This generated Graffiticode creates a table with a general journal entry for a share issue. It includes details such as the date, description, debit and credit amounts related to the cash received from the share application, the recording of the share capital, and the share issue costs. The purpose of this generated code is to provide a structured format for recording the accounting entries associated with the share issue.
```

**User**: validate the numeric values in columns   c and d

**Assistant**: ```graffiticode
This generated Graffiticode creates a table with a general journal entry to record the issuance of 400,000 ordinary shares at $1.50 per share. The code sets up the table structure, column widths, and formatting, and then populates the cells with the relevant financial details, such as the date, description, debit, and credit amounts. The purpose of this generated code is to provide a template for recording the share issue transaction in the general journal.
```

**User**: remove the values from the validated cells

**Assistant**: ```graffiticode
This generated Graffiticode creates a table with a general journal entry for a share issue. The table includes columns for the date, details, debit, and credit, and the rows contain specific entries related to the cash received from the share application, the allotment of the shares, and the share issue costs. The purpose of this generated code is to provide a structured format for recording the financial transactions associated with the share issue.
```

#### Code

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

### Example 11

#### Prompt
"create a table of the prime number up to 100

turn it into a puzzle where you provide the solution to about a third of the cells but validate all of them

add validation for the cells with given values

make the table 5 by 5

center align all columns

make all columns 50px wide

bold the cells with the given values

protect all cells with values given"

#### Chat Transcript

**User**: create a table of the prime number up to 100

**Assistant**: ```graffiticode
This generated code creates a table that displays all the prime numbers from 2 to 100. The table is organized in a 5-column grid format, with each prime number placed in its own cell, starting with 2, 3, 5, 7, and 11 in the first row and continuing through all 25 prime numbers up to 97. The code also includes a title and helpful instructions explaining what prime numbers are for anyone viewing the table.
```

**User**: turn it into a puzzle where you provide the solution to about a third of the cells but validate all of them

**Assistant**: ```graffiticode
This code generates an interactive math worksheet that teaches students about prime numbers from 2 to 100. The generated worksheet displays a 5x5 grid where some prime numbers are already filled in as hints, and students need to complete the missing prime numbers in the empty cells. When students enter their answers, the system automatically checks if they've entered the correct prime numbers, making it a self-grading educational exercise.
```

**User**: add validation for the cells with given values

**Assistant**: ```graffiticode
This code generates an interactive math puzzle that teaches students about prime numbers up to 100. The generated puzzle creates a grid where some prime numbers are already filled in as hints (like 2, 7, 17, 29), while students need to fill in the missing prime numbers in the empty cells. The system automatically checks whether students enter the correct prime numbers and provides feedback on their answers.
```

**User**: make the table 5 by 5

**Assistant**: ```graffiticode
This generated code creates an interactive math puzzle in the form of a 5x5 grid where students need to fill in missing prime numbers. The puzzle displays the first 25 prime numbers in sequential order, with some numbers already provided as hints (like 2, 5, 17, 29, etc.) and empty cells where students must enter the correct missing prime numbers. The code automatically checks whether each answer matches the expected prime number, making it a self-grading educational exercise for learning about prime numbers.
```

**User**: center align all columns

**Assistant**: ```graffiticode
This generated code creates an interactive prime numbers puzzle presented as a 5x5 grid table. The puzzle challenges users to fill in missing prime numbers from the first 25 prime numbers in sequential order, with some numbers already provided as hints (like 2, 5, 17, 29, etc.). The code automatically checks whether users enter the correct prime numbers in each empty cell, making it a self-grading educational exercise for learning about prime numbers.
```

**User**: make all columns 50px wide

**Assistant**: ```graffiticode
This generated code creates an interactive prime numbers puzzle presented as a 5x5 grid table. The puzzle challenges users to fill in missing prime numbers from the first 25 prime numbers in sequence, with some numbers already provided as hints (like 2, 5, 17, 29, etc.). The code automatically checks whether users enter the correct prime numbers in each empty cell, making it a self-grading educational exercise for learning about prime numbers.
```

**User**: bold the cells with the given values

**Assistant**: ```graffiticode
This generated code creates an interactive math puzzle in the form of a 5x5 grid where students need to fill in missing prime numbers. The puzzle displays the first 25 prime numbers in sequential order, with some numbers already provided as hints (shown in bold) and empty cells where students must enter the correct prime numbers. The code automatically checks whether the answers entered are correct, making it a self-grading educational exercise for learning about prime numbers.
```

**User**: protect all cells with values given

**Assistant**: ```graffiticode
This generated code creates an interactive math puzzle in the form of a 5x5 grid where students need to fill in missing prime numbers. The puzzle displays the first 25 prime numbers in sequential order, with some numbers already provided as hints (shown in bold) and empty cells that students must complete. The code automatically checks whether students enter the correct prime numbers in each blank space, making it a self-grading educational exercise.
```

#### Code

```
title "Prime Numbers Puzzle (5x5)"
instructions `
- Fill in the missing prime numbers
- The table contains the first 25 prime numbers in order
- Some values are provided as hints
`
columns {
  A: { width: 50 justify: "center" }
  B: { width: 50 justify: "center" }
  C: { width: 50 justify: "center" }
  D: { width: 50 justify: "center" }
  E: { width: 50 justify: "center" }
}
cells {
  A1: {
    text: "2"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "2"
      }
    }
  }
  B1: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "3"
      }
    }
  }
  C1: {
    text: "5"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "5"
      }
    }
  }
  D1: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "7"
      }
    }
  }
  E1: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "11"
      }
    }
  }
  A2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "13"
      }
    }
  }
  B2: {
    text: "17"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "17"
      }
    }
  }
  C2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "19"
      }
    }
  }
  D2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "23"
      }
    }
  }
  E2: {
    text: "29"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "29"
      }
    }
  }
  A3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "31"
      }
    }
  }
  B3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "37"
      }
    }
  }
  C3: {
    text: "41"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "41"
      }
    }
  }
  D3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "43"
      }
    }
  }
  E3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "47"
      }
    }
  }
  A4: {
    text: "53"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "53"
      }
    }
  }
  B4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "59"
      }
    }
  }
  C4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "61"
      }
    }
  }
  D4: {
    text: "67"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "67"
      }
    }
  }
  E4: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "71"
      }
    }
  }
  A5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "73"
      }
    }
  }
  B5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "79"
      }
    }
  }
  C5: {
    text: "83"
    attrs: {
      fontWeight: "bold"
      protected: true
      assess: {
        method: "value"
        expected: "83"
      }
    }
  }
  D5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "89"
      }
    }
  }
  E5: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "97"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 12

#### Prompt
"make a spreadsheet that allows me to track my stocks. see the sheet with a few dummy examples

format the currency values using ($#,##0)

add an example where there is a loss"

#### Chat Transcript

**User**: make a spreadsheet that allows me to track my stocks. see the sheet with a few dummy examples

**Assistant**: ```graffiticode
This application creates a spreadsheet that automatically calculates how much money you've gained or lost on your stock investments by comparing what you originally paid versus their current market value.
```

**User**: format the currency values using ($#,##0)

**Assistant**: ```graffiticode
This creates a spreadsheet that automatically calculates how much money you've made or lost on your stock investments by comparing what you originally paid versus their current value.
```

**User**: add an example where there is a loss

**Assistant**: ```graffiticode
This creates a spreadsheet that automatically calculates and tracks the profit or loss on your stock investments by comparing what you originally paid for each stock to what it's worth today.
```

#### Code

```
title "Stock Portfolio Tracker"
instructions `
- Enter your stock symbols in column A
- Enter the number of shares in column B
- Enter the purchase price per share in column C
- Column D will calculate your total investment
- Enter the current price per share in column E
- Column F will calculate your current value
- Column G will show your gain/loss
`
columns {
  A: {
    width: 100
  }
  B: {
    width: 80
    justify: "right"
  }
  C: {
    width: 100
    justify: "right"
  }
  D: {
    width: 120
    justify: "right"
  }
  E: {
    width: 100
    justify: "right"
  }
  F: {
    width: 120
    justify: "right"
  }
  G: {
    width: 120
    justify: "right"
  }
}
cells {
  A1: {
    text: "Symbol"
    attrs: {
      fontWeight: "bold"
    }
  }
  B1: {
    text: "Shares"
    attrs: {
      fontWeight: "bold"
    }
  }
  C1: {
    text: "Purchase Price"
    attrs: {
      fontWeight: "bold"
    }
  }
  D1: {
    text: "Total Investment"
    attrs: {
      fontWeight: "bold"
    }
  }
  E1: {
    text: "Current Price"
    attrs: {
      fontWeight: "bold"
    }
  }
  F1: {
    text: "Current Value"
    attrs: {
      fontWeight: "bold"
    }
  }
  G1: {
    text: "Gain/Loss"
    attrs: {
      fontWeight: "bold"
    }
  }
  A2: {
    text: "AAPL"
  }
  B2: {
    text: "100"
  }
  C2: {
    text: "$150.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  D2: {
    text: "=B2*C2"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  E2: {
    text: "$175.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  F2: {
    text: "=B2*E2"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  G2: {
    text: "=F2-D2"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  A3: {
    text: "GOOGL"
  }
  B3: {
    text: "50"
  }
  C3: {
    text: "$2500.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  D3: {
    text: "=B3*C3"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  E3: {
    text: "$2800.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  F3: {
    text: "=B3*E3"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  G3: {
    text: "=F3-D3"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  A4: {
    text: "MSFT"
  }
  B4: {
    text: "75"
  }
  C4: {
    text: "$300.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  D4: {
    text: "=B4*C4"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  E4: {
    text: "$350.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  F4: {
    text: "=B4*E4"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  G4: {
    text: "=F4-D4"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  A5: {
    text: "TSLA"
  }
  B5: {
    text: "25"
  }
  C5: {
    text: "$800.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  D5: {
    text: "=B5*C5"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  E5: {
    text: "$650.00"
    attrs: {
      format: "($#,##0)"
    }
  }
  F5: {
    text: "=B5*E5"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
  G5: {
    text: "=F5-D5"
    attrs: {
      formula: true
      format: "($#,##0)"
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 13

#### Prompt
"change the cell value of A1 to 100

make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

remove all but the cells A1, A2 and A3

add the validation for a3 that the value is 300"

#### Chat Transcript

**User**: change the cell value of A1 to 100

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific width (100) and contains some text, such as numbers or labels. The generated code defines the properties of the columns and the content of the cells, allowing for the creation of a basic spreadsheet-style layout.

**User**: make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific text value, and one cell (A3) has a formula that calculates the sum of the values in cells A1 and A2. The code defines the width of each column and the content of each cell, allowing for the creation of a basic spreadsheet-like layout.

**User**: remove all but the cells A1, A2 and A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" in the first column. The third row contains a formula that calculates the sum of the values in the first two rows and displays the result.

**User**: add the validation for a3 that the value is 300

**Assistant**: ```graffiticode
This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" respectively, and the third row calculates the sum of those two values and checks if the result is "300". The generated code sets the width of the first column to 100 and defines the text and assessment criteria for each cell in the spreadsheet.
```

#### Code

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

### Example 14

#### Prompt
"create a five by five table with integer values of your choosing where every other cell is protected

now prefix all the values in the protected cells with a letter P

add validations for all the unprotected cells

excellent! now bold all the protected cells"

#### Chat Transcript

**User**: create a five by five table with integer values of your choosing where every other cell is protected

**Assistant**: ```graffiticode
This generated Graffiticode creates a spreadsheet-like grid with 5 columns and 5 rows. Each cell in the grid contains a number, and some of the cells are marked as "protected", meaning their values cannot be changed. The purpose of this generated code is to create a structured data layout that could be used for various applications, such as displaying numerical information in a tabular format.
```

**User**: now prefix all the values in the protected cells with a letter P

**Assistant**: ```graffiticode
This generated Graffiticode creates a table with 5 columns and 5 rows. The table cells contain a mix of numbers and text, some of which are marked as "protected". The purpose of this generated code is likely to create a structured data layout, potentially for a spreadsheet or other tabular application.
```

**User**: add validations for all the unprotected cells

**Assistant**: ```graffiticode
The generated code creates a grid-like structure with 5 columns and 5 rows. Each cell in the grid contains either a number that needs to be entered correctly, or a protected value that the user cannot modify. This code is likely part of an interactive learning or assessment tool, where the user is expected to input the correct values in the unprotected cells.
```

**User**: excellent! now bold all the protected cells

**Assistant**: ```graffiticode
The generated code creates a grid-like structure with 5 columns and 5 rows. Each cell in the grid contains either a number or a protected label (e.g., "P12", "P19"). The numbers in the cells have associated "assess" attributes that specify the expected value for that cell, which could be used for some kind of assessment or evaluation.
```

#### Code

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

### Example 15

#### Prompt
"Create a spreadsheet assessment for a simple income statement.

Add to the instructions what the Revenue should be

Add the values for Revenue and Operating Expenses and instruct the student to complete the rest of the statement

Change the label Net Income to After Tax Income

Remove the instructions about revenue and operating expenses"

#### Chat Transcript

**User**: Create a spreadsheet assessment for a simple income statement.

**Assistant**: ```graffiticode
The generated Graffiticode creates an income statement assessment tool. It allows users to input the total revenue, and the code will automatically calculate the gross profit, operating expenses, operating income, income tax, and net income based on the provided formulas. The purpose of this generated code is to provide a simple and interactive way for users to assess their income statement without needing to perform the calculations manually.
```

**User**: Add to the instructions what the Revenue should be

**Assistant**: ```graffiticode
This generated Graffiticode creates an income statement assessment template. It prompts the user to fill in missing values, such as the total revenue, operating expenses, and income tax. The code then calculates the gross profit, operating income, income tax, and net income based on the provided information. The goal is to guide the user through the process of completing an income statement.
```

**User**: Add the values for Revenue and Operating Expenses and instruct the student to complete the rest of the statement

**Assistant**: ```graffiticode
This generated code creates an income statement assessment template. It provides instructions for the user to fill in missing values, such as the cost of goods sold, operating expenses, income tax, and net income. The code also sets up the layout of the income statement, including column widths and text alignment, to make it easy for the user to input and view the financial information.
```

**User**: Change the label Net Income to After Tax Income

**Assistant**: ```graffiticode
This generated code creates an income statement assessment template. It provides instructions for the user to fill in missing values, such as the cost of goods sold, operating expenses, and income tax rate. The code then calculates the gross profit, operating income, income tax, and after-tax income based on the provided information, and allows the user to check their work by assessing the formulas used in the calculations.
```

**User**: Remove the instructions about revenue and operating expenses

**Assistant**: ```graffiticode
This code generates an income statement assessment template. The template includes fields for revenue, cost of goods sold, gross profit, operating expenses, operating income, income tax, and after-tax income. The user is instructed to fill in the missing values, and the code will automatically calculate the gross profit, operating income, income tax, and after-tax income based on the provided formulas.
```

#### Code

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

### Example 16

#### Prompt
"Create a 2 by 2 spreadsheet with the cell contents being the cell names

make column A protected

make b1 protected"

#### Chat Transcript

**User**: Create a 2 by 2 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple spreadsheet-like structure with two columns, each 100 units wide, and four cells with text content. The code defines an object called "columns" that specifies the width of each column, and another object called "cells" that defines the text content for each cell. Finally, the code combines these two objects into a single output.

**User**: make column A protected

**Assistant**: ```graffiticode
The generated code creates a simple spreadsheet-like layout with two columns, A and B, each 100 pixels wide. The first column, A, has its width protected, meaning it cannot be resized. The code then defines four cells within this layout, labeled A1, A2, B1, and B2, each with a text value.
```

**User**: make b1 protected

**Assistant**: ```graffiticode
The generated code creates a simple spreadsheet-like structure with two columns, A and B, each 100 pixels wide. Within this structure, it defines four cells: A1 with the text "A1", A2 with the text "A2", B1 with the text "B1" and marked as protected, and B2 with the text "B2". The code also includes a version number of "0.0.2".
```

#### Code

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

### Example 17

#### Prompt
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

#### Chat Transcript

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

**Assistant**: ```graffiticode
This generated code creates a monthly budget assessment table. The table includes categories like Rent, Food, Transportation, and Savings, which are calculated as percentages of the total monthly income of $4,000. The table also has fixed expenses like Utilities and Entertainment, and a Miscellaneous category for the remaining income after all other expenses. The purpose of this generated code is to help the user calculate and track their monthly budget.
```

**User**: change the income value to 5000

**Assistant**: ```graffiticode
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The code also includes fixed expenses for utilities and entertainment, and the remaining income is allocated to a miscellaneous category.
```

**User**: use unformatted value in the text field

**Assistant**: ```graffiticode
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a given monthly income of $5,000. The code also includes fixed expenses like utilities and entertainment, and the remaining income is allocated to a miscellaneous category.
```

**User**: format column B as Currency

**Assistant**: ```graffiticode
This generated Graffiticode creates a monthly budget assessment tool. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a given monthly income of $5,000. The tool also includes fixed expenses like utilities and entertainment, and the remaining income is categorized as "Miscellaneous." The purpose is to help the user understand how their income should be allocated across different budget items.
```

**User**: score by formula rather than value

**Assistant**: ```graffiticode
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses like utilities and entertainment, and the remaining income is calculated as the "Miscellaneous" category.
```

**User**: make columns A and C protected

**Assistant**: ```graffiticode
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses like utilities and entertainment, and a miscellaneous category for the remaining income after all other expenses are accounted for.
```

**User**: make cell b1 protected

**Assistant**: ```graffiticode
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories based on a $5,000 monthly income. The code sets up the spreadsheet structure, including formulas to automatically calculate the budget items as percentages of the total income or as fixed expenses.
```

**User**: make cells b2, b4 and b7 protected

**Assistant**: ```graffiticode
This generated Graffiticode creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses for utilities and entertainment, and the remaining income is calculated as the "Miscellaneous" category.
```

**User**: make row 1 bold

**Assistant**: ```graffiticode
The generated code creates a monthly budget assessment spreadsheet. It calculates the missing dollar amounts for various budget categories, such as rent, food, transportation, and savings, based on a fixed monthly income of $5,000. The spreadsheet also includes fixed expenses for utilities and entertainment, and the remaining income is calculated as the "Miscellaneous" category.
```

#### Code

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
    justify: "left"
  }
  B: {
    width: 100
    format: "Currency"
  }
  C: {
    width: 200
    protected: true
    justify: "left"
  }
}
cells {
  A1: {
    text: "CATEGORY"
    attrs: {
      protected: true
      fontWeight: "bold"
      border: "bottom"
    }
  }
  B1: {
    text: "AMOUNT"
    attrs: {
      protected: true
      fontWeight: "bold"
      border: "bottom"
    }
  }
  C1: {
    text: "DETAILS"
    attrs: {
      protected: true
      fontWeight: "bold"
      border: "bottom"
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

### Example 18

#### Prompt
"create a simple balance sheet assessment for a high school finance class"

#### Chat Transcript

**User**: create a simple balance sheet assessment for a high school finance class

**Assistant**: ```graffiticode
This generated code creates an interactive balance sheet assessment exercise for students learning accounting fundamentals. The code produces a spreadsheet-style worksheet where students must fill in missing financial calculations, including totaling current assets, calculating total liabilities, and determining owner's equity using the basic accounting equation (Assets = Liabilities + Equity). The system automatically checks whether students enter the correct formulas and values, making it a hands-on learning tool for understanding how balance sheets work.
```

#### Code

```
title "Balance Sheet Assessment"
instructions `
Complete the missing values in this balance sheet:
- Calculate total current assets
- Calculate total assets (current assets + non-current assets)
- Calculate total current liabilities
- Calculate total liabilities (current liabilities + non-current liabilities)
- Calculate total equity (total assets - total liabilities)
- Verify that Assets = Liabilities + Equity
`
columns {
  A: {
    width: 250
  }
  B: {
    width: 120
    justify: "right"
  }
}
cells {
  A1: {
    text: "ASSETS"
    attrs: {
      fontWeight: "bold"
    }
  }
  A2: { text: "Current Assets:" }
  A3: { text: "  Cash" }
  B3: { text: "5000" }
  A4: { text: "  Accounts Receivable" }
  B4: { text: "3000" }
  A5: { text: "  Inventory" }
  B5: { text: "2000" }
  A6: {
    text: "Total Current Assets"
    attrs: {
      fontWeight: "bold"
    }
  }
  B6: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B3+B4+B5"
      }
    }
  }
  A8: { text: "Non-Current Assets:" }
  A9: { text: "  Equipment" }
  B9: { text: "15000" }
  A10: { text: "  Buildings" }
  B10: { text: "25000" }
  A11: {
    text: "TOTAL ASSETS"
    attrs: {
      fontWeight: "bold"
    }
  }
  B11: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B6+B9+B10"
      }
    }
  }
  A13: {
    text: "LIABILITIES"
    attrs: {
      fontWeight: "bold"
    }
  }
  A14: { text: "Current Liabilities:" }
  A15: { text: "  Accounts Payable" }
  B15: { text: "4000" }
  A16: { text: "  Short-term Loans" }
  B16: { text: "2000" }
  A17: {
    text: "Total Current Liabilities"
    attrs: {
      fontWeight: "bold"
    }
  }
  B17: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B15+B16"
      }
    }
  }
  A19: { text: "Non-Current Liabilities:" }
  A20: { text: "  Long-term Loans" }
  B20: { text: "20000" }
  A21: {
    text: "TOTAL LIABILITIES"
    attrs: {
      fontWeight: "bold"
    }
  }
  B21: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B17+B20"
      }
    }
  }
  A23: {
    text: "EQUITY"
    attrs: {
      fontWeight: "bold"
    }
  }
  A24: { text: "Owner's Equity" }
  B24: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B11-B21"
      }
    }
  }
  A26: {
    text: "TOTAL LIABILITIES + EQUITY"
    attrs: {
      fontWeight: "bold"
    }
  }
  B26: {
    text: ""
    attrs: {
      assess: {
        method: "formula"
        expected: "=B21+B24"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 19

#### Prompt
"make a spreadshet

add random numbers to each of the cells

make every other cell an assessment and put a riddle about its value in the instructions

add an apt title"

#### Chat Transcript

**User**: make a spreadshet

**Assistant**: ```graffiticode
This Graffiticode creates a basic three-column spreadsheet or grid layout with nine empty cells, ready for users to input text or data.
```

**User**: add random numbers to each of the cells

**Assistant**: ```graffiticode
This code creates a simple spreadsheet-like grid with three columns (A, B, and C), each containing three numbers, organized in a neat, structured layout.
```

**User**: make every other cell an assessment and put a riddle about its value in the instructions

**Assistant**: ```graffiticode
This is a spreadsheet-like exercise that challenges users to fill in specific cells with correct numerical values based on given instructions, such as finding the answer to life (42), calculating half of 112, or determining the product of 6 and 13.
```

**User**: add an apt title

**Assistant**: ```graffiticode
This is a number puzzle game where players must fill in specific cells with the correct numbers based on clever mathematical clues, like finding the answer to life (42), calculating half of 112, or determining the product of 6 and 13.
```

#### Code

```
title "Number Riddles Challenge"
instructions `
- Cell A1 contains a number that is the answer to life, the universe, and everything
- Cell A3 contains a number that is one less than ninety
- Cell B2 contains a number that is half of 112
- Cell C1 contains a number that is the product of 6 and 13
- Cell C3 contains a number that is a dozen
`
columns {
  A: { width: 100 }
  B: { width: 100 }
  C: { width: 100 }
}
cells {
  A1: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "42"
      }
    }
  }
  A2: { text: "17" }
  A3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "89"
      }
    }
  }
  B1: { text: "23" }
  B2: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "56"
      }
    }
  }
  B3: { text: "31" }
  C1: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "78"
      }
    }
  }
  C2: { text: "94" }
  C3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "12"
      }
    }
  }
}
{
  v: "0.0.1"
}..
```

---

### Example 20

#### Prompt
"change the cell value of A1 to 100

make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

remove all but the cells A1, A2 and A3

add the validation for a3 that the value is 300

make the unvalidated cells protected"

#### Chat Transcript

**User**: change the cell value of A1 to 100

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific width (100) and contains some text, such as numbers or labels. The generated code defines the properties of the columns and the content of the cells, allowing for the creation of a basic spreadsheet-style layout.

**User**: make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific text value, and one cell (A3) has a formula that calculates the sum of the values in cells A1 and A2. The code defines the width of each column and the content of each cell, allowing for the creation of a basic spreadsheet-like layout.

**User**: remove all but the cells A1, A2 and A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" in the first column. The third row contains a formula that calculates the sum of the values in the first two rows and displays the result.

**User**: add the validation for a3 that the value is 300

**Assistant**: ```graffiticode
This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" respectively, and the third row calculates the sum of those two values and checks if the result is "300". The generated code sets the width of the first column to 100 and defines the text and assessment criteria for each cell in the spreadsheet.
```

**User**: make the unvalidated cells protected

**Assistant**: ```graffiticode
The generated code creates a spreadsheet-like structure with three cells in a single column. The first two cells contain the values "100" and "200", which are marked as protected. The third cell contains a formula that calculates the sum of the values in the first two cells, and it is set up to be assessed to ensure the result is "300".
```

#### Code

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

### Example 21

#### Prompt
"create a starter template with one cell"

#### Chat Transcript

**User**: create a starter template with one cell

**Assistant**: ```graffiticode
This generated Graffiticode creates a simple spreadsheet with a title of "Untitled Spreadsheet" and a single cell in the A1 position. The spreadsheet has a column width of 100 units for the A column. The code also includes a version number of "0.0.1" at the end.
```

#### Code

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



