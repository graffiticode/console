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
let cowsCount = "100"..
let pigsCount = "200"..
rows {
  "*": {
    assess: {
      index: "B",
      order: "actual", | "expected", "asc", "desc"
    }
  }
}
columns {
  A: {
    width: 100,
    justify: "right",
  },
  B: {
    width: 100,
    justify: "left",
  },
}
cells {
  A1: {
    text: "",
    attrs: {
      assess: {
        method: "value",
        expected: cowsCount,
      }
    },
  },
  A2: {
    text: "",
    attrs: {
      assess: {
        method: "value",
        expected: pigsCount,
      }
    },
  },
  B1: {
    text: "cows",
  },
  B2: {
    text: "pigs",
  },
}
{}..
```

