# Graffiticode Training Examples

## Language L0165

### Prompt
"Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs."

### Chat Transcript

**Assistant**: ```graffiticode
let income = 5000..
let utilities = 200..
let entertainment = 300..

columns {
  A: {
    width: 150
    justify: "left"
  }
  B: {
    width: 100
    justify: "right"
  }
}

cells {
  A1: { text: "Income" }
  B1: { text: income }

  A2: {
    text: "Rent/Mortgage"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.35"
      }
    }
  }
  B2: { text: "" }

  A3: { text: "Utilities" }
  B3: { text: utilities }

  A4: {
    text: "Food"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.15"
      }
    }
  }
  B4: { text: "" }

  A5: {
    text: "Transportation"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.1"
      }
    }
  }
  B5: { text: "" }

  A6: { text: "Entertainment" }
  B6: { text: entertainment }

  A7: {
    text: "Savings"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.2"
      }
    }
  }
  B7: { text: "" }

  A8: {
    text: "Miscellaneous"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1-SUM(B2:B7)"
      }
    }
  }
  B8: { text: "" }
}..
```

**User**: Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

**Assistant**: ```graffiticode
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

**User**: create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

### Code

```
let income = 5000..
let utilities = 200..
let entertainment = 300..

columns {
  A: {
    width: 150
    justify: "left"
  }
  B: {
    width: 100
    justify: "right"
  }
}

cells {
  A1: { text: "Income" }
  B1: { text: income }

  A2: {
    text: "Rent/Mortgage"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.35"
      }
    }
  }
  B2: { text: "" }

  A3: { text: "Utilities" }
  B3: { text: utilities }

  A4: {
    text: "Food"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.15"
      }
    }
  }
  B4: { text: "" }

  A5: {
    text: "Transportation"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.1"
      }
    }
  }
  B5: { text: "" }

  A6: { text: "Entertainment" }
  B6: { text: entertainment }

  A7: {
    text: "Savings"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.2"
      }
    }
  }
  B7: { text: "" }

  A8: {
    text: "Miscellaneous"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1-SUM(B2:B7)"
      }
    }
  }
  B8: { text: "" }
}..
```

---

### Prompt
"Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs."

### Chat Transcript

**Assistant**: ```graffiticode
let income = 5000..
let utilities = 200..
let entertainment = 300..

columns {
  A: {
    width: 150
    justify: "left"
  }
  B: {
    width: 100
    justify: "right"
  }
}

cells {
  A1: { text: "Income" }
  B1: { text: income }

  A2: {
    text: "Rent/Mortgage"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.35"
      }
    }
  }
  B2: { text: "" }

  A3: { text: "Utilities" }
  B3: { text: utilities }

  A4: {
    text: "Food"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.15"
      }
    }
  }
  B4: { text: "" }

  A5: {
    text: "Transportation"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.1"
      }
    }
  }
  B5: { text: "" }

  A6: { text: "Entertainment" }
  B6: { text: entertainment }

  A7: {
    text: "Savings"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.2"
      }
    }
  }
  B7: { text: "" }

  A8: {
    text: "Miscellaneous"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1-SUM(B2:B7)"
      }
    }
  }
  B8: { text: "" }
}..
```

**User**: Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

**Assistant**: ```graffiticode
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

**User**: create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

### Code

```
let income = 5000..
let utilities = 200..
let entertainment = 300..

columns {
  A: {
    width: 150
    justify: "left"
  }
  B: {
    width: 100
    justify: "right"
  }
}

cells {
  A1: { text: "Income" }
  B1: { text: income }

  A2: {
    text: "Rent/Mortgage"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.35"
      }
    }
  }
  B2: { text: "" }

  A3: { text: "Utilities" }
  B3: { text: utilities }

  A4: {
    text: "Food"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.15"
      }
    }
  }
  B4: { text: "" }

  A5: {
    text: "Transportation"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.1"
      }
    }
  }
  B5: { text: "" }

  A6: { text: "Entertainment" }
  B6: { text: entertainment }

  A7: {
    text: "Savings"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.2"
      }
    }
  }
  B7: { text: "" }

  A8: {
    text: "Miscellaneous"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1-SUM(B2:B7)"
      }
    }
  }
  B8: { text: "" }
}
{}..
```

---

### Prompt
"Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs."

### Chat Transcript

**Assistant**: ```graffiticode
let income = 5000..
let utilities = 200..
let entertainment = 300..

columns {
  A: {
    width: 150
    justify: "left"
  }
  B: {
    width: 100
    justify: "right"
  }
}

cells {
  A1: { text: "Income" }
  B1: { text: income }

  A2: {
    text: "Rent/Mortgage"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.35"
      }
    }
  }
  B2: { text: "" }

  A3: { text: "Utilities" }
  B3: { text: utilities }

  A4: {
    text: "Food"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.15"
      }
    }
  }
  B4: { text: "" }

  A5: {
    text: "Transportation"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.1"
      }
    }
  }
  B5: { text: "" }

  A6: { text: "Entertainment" }
  B6: { text: entertainment }

  A7: {
    text: "Savings"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.2"
      }
    }
  }
  B7: { text: "" }

  A8: {
    text: "Miscellaneous"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1-SUM(B2:B7)"
      }
    }
  }
  B8: { text: "" }
}..
```

**User**: Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

**Assistant**: ```graffiticode
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

**User**: create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

### Code

```
rows {
  "*": {
    assess: {
      index: "A",
      order: "expected",
    }
  }
}
columns {
  A: {
    width: 100,
    justify: "left",
  },
  B: {
    width: 100,
    format: "Currency",
  },
  C: {
    width: 300,
    justify: "left",
  },
}
cells {
  A1: {
    text: "CATEGORY",
    attrs: {
      background: "#efefef",
      fontWeight: "bold",
    },
  },
  A2: {
    text: "Income",
  },
  A3: {
    text: "Rent/Mortgage",
  },
  A4: {
    text: "Utilities",
  },
  A5: {
    text: "Food",
  },
  A6: {
    text: "Transportation",
  },
  A7: {
    text: "Entertainment",
  },
  A8: {
    text: "Savings",
  },
  A9: {
    text: "Miscellaneous",
  },
  B1: {
    text: "AMOUNT",
    attrs: {
      background: "#efefef",
      fontWeight: "bold",
    },
  },
  B2: {
    text: "4000",
  },
  B3: {
    attrs: {assess: {
      method: "formula",
      expected: "=b2*35%",
    }}
  },
  B4: {
    text: "200",
  },
  B5: {
    attrs: {assess: {
      method: "formula",
      expected: "=b2*15%",
    }}
  },
  B6: {
    attrs: {assess: {
      method: "formula",
      expected: "=b2*10%",
    }}
  },
  B7: {
    text: "150",
  },
  B8: {
    attrs: {assess: {
      method: "formula",
      expected: "=b2*20%",
    }}
  },
  B9: {
    attrs: {assess: {
      method: "formula",
      expected: "=b2-sum(b3:b8)",
    }}
  },
  C1: {
    text: "DETAILS",
    attrs: {
      background: "#efefef",
      fontWeight: "bold",
    },
  },
  C2: {
    text: "Total monthly income",
  },
  C3: {
    text: "35% of your total income",
  },
  C4: {
    text: "Fixed expense",
  },
  C5: {
    text: "15% of your total income",
  },
  C6: {
    text: "10% of your total income",
  },
  C7: {
    text: "Fixed expense",
  },
  C8: {
    text: "20% of your total income ",
  },
  C9: {
    text: "Remaining income after all other expenses",
  },
}{v:11}..
```

---

### Prompt
"Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs."

### Chat Transcript

**Assistant**: ```graffiticode
let income = 5000..
let utilities = 200..
let entertainment = 300..

columns {
  A: {
    width: 150
    justify: "left"
  }
  B: {
    width: 100
    justify: "right"
  }
}

cells {
  A1: { text: "Income" }
  B1: { text: income }

  A2: {
    text: "Rent/Mortgage"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.35"
      }
    }
  }
  B2: { text: "" }

  A3: { text: "Utilities" }
  B3: { text: utilities }

  A4: {
    text: "Food"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.15"
      }
    }
  }
  B4: { text: "" }

  A5: {
    text: "Transportation"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.1"
      }
    }
  }
  B5: { text: "" }

  A6: { text: "Entertainment" }
  B6: { text: entertainment }

  A7: {
    text: "Savings"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1*0.2"
      }
    }
  }
  B7: { text: "" }

  A8: {
    text: "Miscellaneous"
    attrs: {
      assess: {
        method: "formula"
        expected: "=B1-SUM(B2:B7)"
      }
    }
  }
  B8: { text: "" }
}..
```

**User**: Create a spreadsheet assessment that asked the student to complete a spreadsheet that has the line items of Income, Rent/Mortgage, Utilities, Food, Transportation, Entertainment, Savings, and Miscellaneous. Give reasonable fixed values for the Income, Utilities and Entertainment. Prompt the student to complete the cells for Rent as 35% of Income, Food as 15%, Transportation as 10%, Savings as 20%, and Miscellaneous as the amount that is left over.

**Assistant**: ```graffiticode
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

**User**: create a spreadsheet assessment with two rows and two columns. the spreadsheet should indicate how many pigs and how many cows are listed. the A column indicates the quantity and the B column indicates the animal type. there are 100 cows and 200 pigs.

### Code

```
rows {
    "*": {
      assess: {
        index: "A",
        order: "expected",
      }
    }
  }
columns {
    A: {
      width: 100,
      justify: "left",
    },
    B: {
      width: 100,
      format: "Currency",
    },
    C: {
      width: 300,
      justify: "left",
    },
  }
cells {
    A1: {
      text: "CATEGORY",
      attrs: {
        background: "#efefef",
        fontWeight: "bold",
      },
    },
    A2: {
      text: "Income",
    },
    A3: {
      text: "Rent/Mortgage",
    },
    A4: {
      text: "Utilities",
    },
    A5: {
      text: "Food",
    },
    A6: {
      text: "Transportation",
    },
    A7: {
      text: "Entertainment",
    },
    A8: {
      text: "Savings",
    },
    A9: {
      text: "Miscellaneous",
    },
    B1: {
      text: "AMOUNT",
      attrs: {
        background: "#efefef",
        fontWeight: "bold",
      },
    },
    B2: {
      text: "4000",
    },
    B3: {
      attrs: {assess: {
        method: "formula",
        expected: "=b2*35%",
      }}
    },
    B4: {
      text: "200",
    },
    B5: {
      attrs: {assess: {
        method: "formula",
        expected: "=b2*15%",
      }}
    },
    B6: {
      attrs: {assess: {
        method: "formula",
        expected: "=b2*10%",
      }}
    },
    B7: {
      text: "150",
    },
    B8: {
      attrs: {assess: {
        method: "formula",
        expected: "=b2*20%",
      }}
    },
    B9: {
      attrs: {assess: {
        method: "formula",
        expected: "=b2-sum(b3:b8)",
      }}
    },
    C1: {
      text: "DETAILS",
      attrs: {
        background: "#efefef",
        fontWeight: "bold",
      },
    },
    C2: {
      text: "Total monthly income",
    },
    C3: {
      text: "35% of your total income",
    },
    C4: {
      text: "Fixed expense",
    },
    C5: {
      text: "15% of your total income",
    },
    C6: {
      text: "10% of your total income",
    },
    C7: {
      text: "Fixed expense",
    },
    C8: {
      text: "20% of your total income ",
    },
    C9: {
      text: "Remaining income after all other expenses",
    },
  }
{v:11}..
```

