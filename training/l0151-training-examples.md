# Graffiticode Training Examples

## Language L0151

### Task
"what is 2 plus 2"

### Graffiticode
let add_numbers a b =
  a + b

let () =
  let result = add_numbers 2 2 in
  Printf.printf "%d\n" result

---

### Task
"create a spreadsheet question for me"

### Graffiticode
Here's a spreadsheet question for you, along with the solution in Graffiticode:

Question:
Given a spreadsheet with columns for employee name, hourly wage, and hours worked, calculate the total payroll cost. Employees get paid 1.5x their hourly wage for any hours over 40.

Spreadsheet data:
[
  { name: "Alice", wage: 15, hours: 35 }
  { name: "Bob", wage: 20, hours: 47 } 
  { name: "Charlie", wage: 18, hours: 40 }
]

Solution:
let overtimeHours = <employee: sub get employee "hours" 40>..\nlet overtimePay = <employee: mul get employee "wage" 1.5 overtimeHours employee>..\nlet regularPay = <employee: mul get employee "wage" if lt get employee "hours" 40 then get employee "hours" else 40>..\nlet totalPay = <employee: add regularPay employee overtimePay employee>..\nlet employeePay = map (totalPay) employees..\nlet totalPayroll = reduce (add) 0 employeePay..

Explanation:
1. `overtimeHours` calculates the number of overtime hours for each employee (hours over 40)
2. `overtimePay` calculates overtime pay at 1.5x wage for those overtime hours 
3. `regularPay` calculates regular pay for the first 40 hours (or less if under 40 total hours)
4. `totalPay` sums the regular and overtime pay for each employee
5. `employeePay` maps the `totalPay` function over the list of employees 
6. Finally, `totalPayroll` sums up the pay for all employees to get the total payroll cost

The key steps are calculating regular and overtime pay separately, then combining them for each employee before summing the total. Let me know if you have any other questions!

---

### Task
"create a spreadsheet question for me"

### Graffiticode
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

---

### Task
"create a spreadsheet question for me"

### Graffiticode
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

---

### Task
"create a spreadsheet question for me"

### Graffiticode
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

