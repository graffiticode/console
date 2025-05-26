# Dialect L0165 Specific Instructions

This dialect is used for generating spreadsheet based assessments.

## Response Requirements

- **IMPORTANT**: Whatever the user request is, the response should always be a complete spreadsheet with all necessary data, formulas, and formatting included.

## Program structure

```
title "Title"
instructions `
- Step 1
- Step 2
- Step 3
`
columns {
  A: {
    width: 100
  }
}
cells {
  A1: {
    text: "A1"
    attrs: {
      fontWeight: "bold"
    }
  }
}
{
}..
```

## Validation syntax

The following validates that cell A3 contains "300":

```
cells {
  A1: { text: "100" }
  A2: { text: "200" }
  A3: {
    text: ""
    attrs: {
      assess: {
        method: "value"
        expected: "300"
      }
    }
  }
}
```

## Formatting Guidelines

- IMPORTANT: Remember to maintain Graffiticode's core syntax with `let` declarations and `..` endings
- IMPORTANT: Use the following code as a template for all generated code:

```
title ""
instructions `
`
columns {
}
cells {
}
{
  v: "0.0.1"
}..
```
