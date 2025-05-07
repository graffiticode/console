# Dialect L0165 Specific Instructions

This dialect is used for generating spreadsheet based assessments.

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
- IMPORTANT: All functions have arity of 2 so if there is no data object needed as the last argument, add an empty object