# Graffiticode Training Examples

## Language L0165

### Prompt
"Create a 2 by 2 spreadsheet with the content being the names of the cells"

### Code

```
columns {
  A: {
    width: 50,
    justify: "center",
  },
  B: {
    width: 50,
    justify: "center",
  },
}
cells {
  A1: {
    text: "A1",
  },
  A2: {
    text: "A2",
  },
  B1: {
    text: "B1",
  },
  B2: {
    text: "B2",
  },
}
{}..
```

---

### Prompt
"create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs."

### Code

```
let table = {
  rows: {
    \"*\": {
      assess: {
        index: \"A\",
        order: \"actual\" | \"expected\", \"asc\", \"desc\"
      }
    }
  }
  columns: {
    A: {
      width: 100,
      justify: \"right\"
    },
    B: {
      width: 100,
      justify: \"left\"
    }
  }
  cells: {
    A1: {
      text: \"{{A1}}\",
      attrs: {
        assess: {
          method: \"value\",
          expected: \"{{A1}}\"
        }
      }
    },
    A2: {
      text: \"{{A2}}\",
      attrs: {
        assess: {
          method: \"value\",
          expected: \"{{A2}}\"
        }
      }
    },
    B1: {
      text: \"{{B1}}\",
      attrs: {
        assess: {
          method: \"value\",
          expected: \"{{B1}}\"
        }
      }
    },
    B2: {
      text: \"{{B2}}\",
      attrs: {
        assess: {
          method: \"value\",
          expected: \"{{B2}}\"
        }
      }
    }
  }
}..

let params = {
  A1: \"100\",
  A2: \"200\", 
  B1: \"cows\",
  B2: \"pigs\"
}..

| The main issue was a missing double dot (..) to terminate the `let table` statement
| Added the .. after the table record to fix this
| Also added .. after the `let params` statement for consistency
| Removed the empty record {} at the end as it served no purpose
```

