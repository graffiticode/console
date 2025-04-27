# Graffiticode Training Examples

## Language L0151

### Prompt
"what is 2 plus 2"

### Code

```
let add_numbers a b =
  a + b

let () =
  let result = add_numbers 2 2 in
  Printf.printf "%d\n" result
```

---

### Prompt
"create a spreadsheet question for me"

### Code

```
let overtimeHours = <employee: sub get employee "hours" 40>..
let overtimePay = <employee: mul get employee "wage" 1.5 overtimeHours employee>..
let regularPay = <employee: mul get employee "wage" if lt get employee "hours" 40 then get employee "hours" else 40>..
let totalPay = <employee: add regularPay employee overtimePay employee>..
let employeePay = map (totalPay) employees..
let totalPayroll = reduce (add) 0 employeePay..
```

---

### Prompt
"create a spreadsheet question for me"

### Code

```
table {
  rows: {
    "*": {
      assess: {
        index: "A",
        order: "actual", | "expected", "asc", "desc"
      }
    }
  },
  columns: {
    A: {
      width: 200,
      justify: "left",
    },
    B: {
      width: 100,
      format: "Currency",
    },
  },
  cells: {
    A1: {
      text: "{{A1}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A1}}",
        }
      }
    },
    A2: {
      text: "{{A2}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A2}}",
        }
      }
    },
    A3: {
      text: "{{A3}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A3}}",
        }
      }
    },
    A4: {
      text: "{{A4}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A4}}",
        }
      }
    },
    B1: {
      text: "{{B1}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B1}}",
        }
      }
    },
    B2: {
      text: "{{B2}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B2}}"
        }
      }
    },
    B3: {
      text: "{{B3}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B3}}",
        }
      }      
    }
    B4: {
      text: "{{B4}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B4}}",
        }
      }      
    }
  }
} 
params {
  A1: "Fees earned",
  A2: "Office expense",
  A3: "Miscellaneous expense",
  A4: "Salary and wage expense",
  B1: "1485000..1585000:200000",
  B2: "325000..425000:25000",
  B3: "26000..30000:2000",
  B4: "875000..975000:50000",
}..
```

---

### Prompt
"create a spreadsheet question for me"

### Code

```
table {
  rows: {
    "*": {
      assess: {
        index: "A",
        order: "actual", | "expected", "asc", "desc"
      }
    }
  },
  columns: {
    A: {
      width: 200,
      justify: "left",
    },
    B: {
      width: 100,
      format: "Currency",
    },
  },
  cells: {
    A1: {
      text: "{{A1}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A1}}",
        }
      }
    },
    A2: {
      text: "{{A2}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A2}}",
        }
      }
    },
    A3: {
      text: "{{A3}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A3}}",
        }
      }
    },
    A4: {
      text: "{{A4}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{A4}}",
        }
      }
    },
    B1: {
      text: "{{B1}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B1}}",
        }
      }
    },
    B2: {
      text: "{{B2}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B2}}"
        }
      }
    },
    B3: {
      text: "{{B3}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B3}}",
        }
      }      
    }
    B4: {
      text: "{{B4}}",
      attrs: {
        assess: {
          method: "value",
          expected: "{{B4}}",
        }
      }      
    }
  }
} 
params {
  A1: "Fees earned",
  A2: "Office expense",
  A3: "Miscellaneous expense",
  A4: "Salary and wage expense",
  B1: "1485000..1585000:200000",
  B2: "325000..425000:25000",
  B3: "26000..30000:2000",
  B4: "875000..975000:50000",
}..
```