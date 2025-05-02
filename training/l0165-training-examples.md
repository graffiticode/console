# Graffiticode Training Examples

## Language L0165

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

---

### Prompt
"Create a 2 by 2 spreadsheet with the content being the names of the cells

Create a 2 by 2 spreadsheet with the cell contents being the cell names"

### Chat Transcript

**User**: Create a 2 by 2 spreadsheet with the content being the names of the cells

**User**: Create a 2 by 2 spreadsheet with the cell contents being the cell names

**Assistant**: This generated code creates a simple spreadsheet-like structure with two columns, each 100 units wide, and four cells with text content. The code defines an object called "columns" that specifies the width of each column, and another object called "cells" that defines the text content for each cell. Finally, the code combines these two objects into a single output.

### Code

```
let columns = {
  A: { width: 100 }
  B: { width: 100 }
}..

let cells = {
  A1: { text: \"A1\" }
  A2: { text: \"A2\" }
  B1: { text: \"B1\" }
  B2: { text: \"B2\" }
}..

{
  columns: columns
  cells: cells
}
```

