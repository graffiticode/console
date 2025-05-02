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

