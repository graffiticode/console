# Graffiticode Training Examples

## Language L0165

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
{}..
```

---

### Prompt
"Create a 2 by 2 spreadsheet with the cell contents being the cell names

Create a 4 by 4 spreadsheet with the cell contents being the cell names

change the cell value of A1 to 100

make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

remove all but the cells A1, A2 and A3"

### Chat Transcript

**User**: Create a 2 by 2 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple spreadsheet-like structure with two columns, each 100 units wide, and four cells with text content. The code defines an object called "columns" that specifies the width of each column, and another object called "cells" that defines the text content for each cell. Finally, the code combines these two objects into a single output.

**User**: Create a 4 by 4 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple table structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the table has a specific text value, such as "A1", "B2", "C3", and so on. The code also defines the width of each column to be 100 units. This table structure can be used as a building block for creating more complex data visualizations or user interfaces.

**User**: change the cell value of A1 to 100

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific width (100) and contains some text, such as numbers or labels. The generated code defines the properties of the columns and the content of the cells, allowing for the creation of a basic spreadsheet-style layout.

**User**: make the value of A2 200 and add A1 and A2 using the formula =sum(A1:A2) for the value of A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with four columns (A, B, C, and D) and four rows (1, 2, 3, and 4). Each cell in the spreadsheet has a specific text value, and one cell (A3) has a formula that calculates the sum of the values in cells A1 and A2. The code defines the width of each column and the content of each cell, allowing for the creation of a basic spreadsheet-like layout.

**User**: remove all but the cells A1, A2 and A3

**Assistant**: This generated code creates a simple spreadsheet-like structure with three columns and three rows. The first two rows contain the values "100" and "200" in the first column. The third row contains a formula that calculates the sum of the values in the first two rows and displays the result.

### Code

```
let columns = {
  A: { width: 100 }
}..

let cells = {
  A1: { text: "100" }
  A2: { text: "200" }
  A3: {
    text: "=sum(A1:A2)"
  }
}..

{
  columns: columns
  cells: cells
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
let columns = {
  A: { width: 100 }
  B: { width: 100 }
  C: { width: 100 }
  D: { width: 100 }
}..

let cells = {
  A1: { text: "100 " }
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
}..

{
  columns: columns
  cells: cells
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
let columns = {
  A: { width: 100 }
  B: { width: 100 }
}..

let cells = {
  A1: { text: "A1" }
  A2: { text: "A2" }
  B1: { text: "B1" }
  B2: { text: "B2" }
}..

{
  columns: columns
  cells: cells
}..
```

