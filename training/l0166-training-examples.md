# Graffiticode Training Examples

*Downloaded on 2025-09-07T23:32:38.924Z*

## Language L0166

### Example 1

#### Prompt
"make a table with a single cell with an assessment"

#### Chat Transcript

**User**: make a table with a single cell with an assessment

**Assistant**: ```graffiticode
This code appears to be setting up a simple assessment cell where a value of "10" is expected to be entered and evaluated.
```

#### Code

```
columns [
  column "A" width 50 {}
  column "B" width 50 align "center" {}
]
cells [
  cell A1 text "10" assess [method "value" expected "10"] {}
]
{
  v: "0.0.2"
}..
```

---

### Example 2

#### Prompt
"make a single cell table"

#### Chat Transcript

**User**: make a single cell table

**Assistant**: ```graffiticode
This code appears to create a simple spreadsheet-like grid with a single cell labeled "A1" that has a width of 100 units.
```

#### Code

```
columns [
  column A width 100 {}
]
cells [
  cell A1 text "A1" {}
]
{
  v: "0.0.1"
}..
```



