# Graffiticode Training Examples

*Downloaded on 2025-09-02T16:49:03.599Z*

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

**Assistant**: ```ocaml
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

**Assistant**: ```ocaml
This generated code creates a basic arithmetic assessment with six questions. The user is presented with arithmetic problems, and they must enter the correct answers in the empty cells. The code includes instructions for the user and sets up the layout of the assessment, with the questions in the left column and the answer cells in the right column.
```

**User**: that's interesting, but I want to create a single problem arranged vertically

**Assistant**: ```ocaml
The generated code creates a vertical arithmetic problem where the user needs to solve the addition of 4327 and 958. The code sets up a table with a single column, and the first three rows display the numbers to be added vertically. The fourth row is left blank for the user to enter the solution, which is expected to be 5285.
```

**User**: that's good, but remove row 3 and add a border bottom true to b2

**Assistant**: ```ocaml
This code generates a simple arithmetic problem where the user needs to add two numbers vertically. The problem is presented with the first number "4327" and the second number "+958" displayed, and the user is expected to enter the correct result of "5285" in the empty cell below. The generated code sets up the layout and formatting for this arithmetic problem.
```

**User**: sorry, i wasn't being clear. set border to "bottom"

**Assistant**: ```ocaml
The generated code creates a simple arithmetic problem where the user needs to add two numbers vertically. The problem is presented with the first number "4327" and the second number "+958" displayed, and the user is expected to enter the correct result of "5285" in the empty cell below. This type of interactive arithmetic exercise can be used to test or practice basic math skills.
```

**User**: format numbers using #,##0

**Assistant**: ```ocaml
The generated code creates a simple arithmetic problem where the user needs to add two numbers, 4,327 and 958, and enter the result in the third cell. The code sets up the layout and formatting of the problem, including the column width, text formatting, and a bottom border for the second row. The third cell is set up to assess the user's input, expecting the correct answer of 5,285.
```

**User**: move coumn a to column b

**Assistant**: ```ocaml
The generated code creates a simple arithmetic problem where the user needs to solve the addition of two numbers, 4,327 and 958, and enter the result in the provided cell. The code sets up the layout and formatting of the problem, including the instructions, column widths, and the expected result of 5,285.
```

**User**: move the + in B2 to A2

**Assistant**: ```ocaml
The generated code creates a simple arithmetic problem where the user needs to solve the addition of two numbers, 4,327 and 958, and enter the result in the provided cell. The code sets up the layout of the problem, including the column widths and the formatting of the numbers, and includes an assessment to check if the user's answer is correct.
```

**User**: change the value in b2 to 6345

**Assistant**: ```ocaml
The generated code creates a simple arithmetic problem where the user needs to solve the addition of two large numbers, "4,327" and "6,345", and enter the result in the provided cell. The code sets up the layout of the problem, including the column widths and the formatting of the numbers, and includes an assessment to check if the user's answer is correct.
```

**User**: set the border underline for a2

**Assistant**: ```ocaml
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

**Assistant**: ```ocaml
This creates an interactive checkbook balancing exercise where students practice calculating running account balances by filling in the correct balance amounts after each deposit and withdrawal transaction.
```

**User**: format column a using date

**Assistant**: ```ocaml
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

**Assistant**: ```ocaml
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

**Assistant**: ```ocaml
This Graffiticode creates a clear, formatted table showing Twilio's quarterly revenue growth from 2019 to 2023, displaying how the company's earnings have consistently increased over the past five years.
```

**User**: add validations to every 3rd revenue value

**Assistant**: ```ocaml
This application helps users track and analyze Twilio's quarterly revenue growth from 2019 to 2023, allowing them to review financial performance and fill in missing data points in an interactive spreadsheet format.
```

**User**: replace the Q4 heading and make the row and column headings protected

**Assistant**: ```ocaml
This interactive spreadsheet helps users track and complete Twilio's quarterly revenue data from 2019 to 2023, allowing them to fill in missing financial figures and observe the company's consistent revenue growth over time.
```

**User**: format the numeric values using ($#,##0)

**Assistant**: ```ocaml
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

**Assistant**: ```ocaml
This generated Graffiticode creates a spreadsheet-like structure with two columns, A and B. Column A has cells with the numbers "100" and "200", and these cells are set up to be automatically assessed to ensure their values match the expected values. Column B has cells with the text "cows" and "pigs", and these cells are marked as protected, meaning they cannot be edited. The code also includes a version number of "0.0.1" at the end.
```

**User**: bold column b

**Assistant**: ```ocaml
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

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the empty cells with the correct products of multiplying the row and column numbers (like 2×3=6). The system automatically checks if the answers are correct, making it a self-grading math practice exercise.
```

**User**: remove the validations for redundant cells and make their background gray

**Assistant**: ```ocaml
This code generates an interactive multiplication table worksheet for numbers 1 through 4. The generated spreadsheet has some cells pre-filled with example answers (highlighted in gray) while other cells are left blank for students to complete, with the system automatically checking if the entered answers match the correct multiplication results. It creates a learning exercise where students can practice their times tables by filling in the missing products in a structured grid format.
```

**User**: revert the last change and remove validations from duplicates

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells already completed as examples and others left blank for practice. It includes automatic checking to verify that students enter the correct answers in the empty cells.
```

**User**: mark the unvalidated cells including the headers protected

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells left blank as practice problems and others pre-filled or protected. When students enter their answers, the system automatically checks if they've entered the correct multiplication results.
```

**User**: change the background of the cells without validations light gray

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells already filled in as examples and others left blank for practice. The system automatically checks if the entered answers are correct and includes some grayed-out cells that can't be edited to guide students through the exercise.
```

**User**: use the attribute 'background' for background color

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a spreadsheet-like grid where students need to fill in the missing products by multiplying the row and column numbers, with some cells intentionally left blank or grayed out to create a progressive learning exercise. The system automatically checks if students enter the correct answers in the empty cells, making it a self-grading math practice tool.
```

**User**: center justify the headings

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students can practice their times tables by filling in empty cells with the correct products, while the row and column headers (showing the numbers being multiplied) are pre-filled and protected from editing. Some cells are intentionally left blank for students to complete, and the system can automatically check if their answers match the expected multiplication results.
```

**User**: now make the column width half as wide

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students need to fill in the missing products by multiplying the row and column numbers, with the headers and number labels already provided in gray boxes. Each empty cell automatically checks if the student entered the correct answer, making it a self-grading math practice exercise.
```

**User**: now remove the validations the duplicate facts

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students can practice their times tables by filling in empty cells with the correct products, while the row and column headers (showing the numbers being multiplied) are pre-filled and protected from editing. Some cells have built-in answer checking that will verify if students entered the correct multiplication results.
```

**User**: make unprotected call white

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a 5x5 grid where students can practice their times tables by filling in the missing products, with the row and column headers (showing the numbers being multiplied) already provided in gray boxes. When students enter answers in the blank cells, the system automatically checks if their responses match the correct multiplication results.
```

**User**: make calls cells cells without validations light gray

**Assistant**: ```ocaml
This generated code creates an interactive multiplication table worksheet for numbers 1 through 4. The code sets up a grid where students can fill in the missing products, with some cells left blank for practice and others pre-filled with the row and column headers. It includes automatic checking that validates whether students entered the correct answers in the empty cells, making it a self-grading math exercise.
```

**User**: make cells without validations protected

**Assistant**: ```ocaml
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

**Assistant**: ```ocaml
This generated Graffiticode creates a simple spreadsheet with a title of "Untitled Spreadsheet" and a single cell in the A1 position. The spreadsheet has a column width of 100 units for the A column. The code also includes a version number of "0.0.1" at the end.
```

**User**: let's play tic tac toe

**Assistant**: ```ocaml
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



