# Graffiticode Training Examples

*Downloaded on 2025-10-22T00:07:57.809Z*

## Language L0167

### Example 1

#### Prompt
"line width square root 9"

#### Chat Transcript

**User**: line width square root 9

#### Code

```
calculator expressions [
  expression "y=x" line-width "\sqrt{16}" {}
] {}..
```

---

### Example 2

#### Prompt
"make the graph width 800"

#### Chat Transcript

**User**: make the graph width 800

#### Code

```
width 800 calculator expressions [] {}..
```

---

### Example 3

#### Prompt
"secret curve"

#### Chat Transcript

**User**: secret curve

#### Code

```
calculator expressions [
  expression "y=x^2" secret true {}
] {}..
```

---

### Example 4

#### Prompt
"dotted line"

#### Chat Transcript

**User**: dotted line

#### Code

```
calculator expressions [
  expression "y=x^2" line-style "DOTTED" {}
] {}..
```

---

### Example 5

#### Prompt
"red curve"

#### Chat Transcript

**User**: red curve

#### Code

```
calculator expressions [
  color "red" "y=x^2"
] {}..
```

---

### Example 6

#### Prompt
"plot two expressions"

#### Chat Transcript

**User**: plot two expressions

#### Code

```
calculator expressions [
  "y=x^2"
  "y=2x+1"
] {}..
```

---

### Example 7

#### Prompt
"create a calculator with custom bounding box"

#### Chat Transcript

**User**: create a calculator with custom bounding box

#### Code

```
bounds [
  -5
  -5
  5
  5
] calculator expressions [] {}..
```

---

### Example 8

#### Prompt
"line-style DASHED on a curve"

#### Chat Transcript

**User**: line-style DASHED on a curve

#### Code

```
calculator expressions [
  expression "y=x^2" line-style "DASHED" {}
] {}..
```

---

### Example 9

#### Prompt
"big cross point with opacity 30%"

#### Chat Transcript

**User**: big cross point with opacity 30%

#### Code

```
calculator expressions [
  expression "(0, 0)" point-style "CROSS" point-size 20 point-opacity 0.3 {}
] {}..
```

---

### Example 10

#### Prompt
"make the width 800 and height 600"

#### Chat Transcript

**User**: make the width 800 and height 600

#### Code

```
width 800 height 600 calculator expressions [] {}..
```

---

### Example 11

#### Prompt
"plot a list of points in a single expression"

#### Chat Transcript

**User**: plot a list of points in a single expression

#### Code

```
calculator expressions [
  "[(1,2), (3,4), (5,6), (2,8), (7,1)]"
] {}..
```

---

### Example 12

#### Prompt
"curve with color #ff00f1"

#### Chat Transcript

**User**: curve with color #ff00f1

#### Code

```
calculator expressions [
  color "#ff00f1" "y=x^2"
] {}..
```

---

### Example 13

#### Prompt
"graph a curve with name 'myParabola'"

#### Chat Transcript

**User**: graph a curve with name 'myParabola'

#### Code

```
calculator expressions [
  expression "y=x^2" id "myParabola" {}
] {}..
```

---

### Example 14

#### Prompt
"make a minimal graph of a parabola"

#### Chat Transcript

**User**: make a minimal graph of a parabola

#### Code

```
calculator expressions [
  "y=x^2"
] {}..
```

---

### Example 15

#### Prompt
"point as cross or x"

#### Chat Transcript

**User**: point as cross or x

#### Code

```
calculator expressions [
  expression "(0, 0)" point-style "CROSS" {}
] {}..
```

---

### Example 16

#### Prompt
"plot an expression with a color"

#### Chat Transcript

**User**: plot an expression with a color

#### Code

```
calculator expressions [
  color "red" "y=x^2"
] {}..
```

---

### Example 17

#### Prompt
"draw a circle and a line with different opacities

Update the code using these property values:
```json
{"lineWidth":"5"}
```
Note: Only the properties shown above have changed and need to be updated.

Update the code using these property values:
```json
{"latex":"x^2 + y^2 < 25"}
```
Note: Only the properties shown above have changed and need to be updated.

Update the code using these property values:
```json
{"fillOpacity":".1"}
```
Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: draw a circle and a line with different opacities

**User**: Update the code using these property values:
```json
{"lineWidth":"5"}
```
Note: Only the properties shown above have changed and need to be updated.

**User**: Update the code using these property values:
```json
{"latex":"x^2 + y^2 < 25"}
```
Note: Only the properties shown above have changed and need to be updated.

**User**: Update the code using these property values:
```json
{"fillOpacity":".1"}
```
Note: Only the properties shown above have changed and need to be updated.

#### Code

```
calculator expressions [
  expression "x^2 + y^2 < 25" color "blue" line-opacity 0.3 line-width 5 fill-opacity 0.1 {}
  expression "y = 2x + 1" color "red" line-opacity 0.8 line-width 5 {}
] {}..
```

---

### Example 18

#### Prompt
"dotted x^2 dashed x^3"

#### Chat Transcript

**User**: dotted x^2 dashed x^3

#### Code

```
calculator expressions [
  expression "y=x^2" line-style "DOTTED" {}
  expression "y=x^3" line-style "DASHED" {}
] {}..
```

---

### Example 19

#### Prompt
"create a calculator with a mix of points and lines"

#### Chat Transcript

**User**: create a calculator with a mix of points and lines

#### Code

```
calculator expressions [
  expression "(2, 3)" color "red" point-size 8 {}
  expression "(-1, 4)" color "blue" point-size 8 {}
  expression "y = 2x + 1" color "green" line-width 3 {}
  expression "y = x^2 - 2" color "purple" line-style "DASHED" {}
] {}..
```

---

### Example 20

#### Prompt
"plot a list of points"

#### Chat Transcript

**User**: plot a list of points

#### Code

```
calculator expressions [
  "(1, 2)"
  "(3, 4)"
  "(5, 1)"
  "(-2, 3)"
  "(0, -1)"
] {}..
```

---

### Example 21

#### Prompt
"point using computed size with latex"

#### Chat Transcript

**User**: point using computed size with latex

#### Code

```
calculator expressions [
  expression "(2, 3)" point-size "2 + 3" {}
] {}..
```

---

### Example 22

#### Prompt
"big point"

#### Chat Transcript

**User**: big point

#### Code

```
calculator expressions [
  expression "(0, 0)" point-size "20" {}
] {}..
```

---

### Example 23

#### Prompt
"plot an expression"

#### Chat Transcript

**User**: plot an expression

#### Code

```
calculator expressions [
  expression "y=x^2" {}
] {}..
```

---

### Example 24

#### Prompt
"plot an expression with a color using a record"

#### Chat Transcript

**User**: plot an expression with a color using a record

#### Code

```
calculator expressions [
  {
    latex: "y=x^2"
    color: "#ff0000"
  }
] {}..
```

---

### Example 25

#### Prompt
"point as open circle"

#### Chat Transcript

**User**: point as open circle

#### Code

```
calculator expressions [
  expression "(0, 0)" point-style "OPEN" {}
] {}..
```

---

### Example 26

#### Prompt
"plot a curve on graph with non-integer bounds"

#### Chat Transcript

**User**: plot a curve on graph with non-integer bounds

#### Code

```
bounds [
  -2.5
  -1.5
  3.7
  4.2
] calculator expressions [
  "y = x^2 - 2x + 1"
] {}..
```

---

### Example 27

#### Prompt
"line with width 10"

#### Chat Transcript

**User**: line with width 10

#### Code

```
calculator expressions [
  expression "y = x" line-width 10 {}
] {}..
```

---

### Example 28

#### Prompt
"Mix colored curve + secret points"

#### Chat Transcript

**User**: Mix colored curve + secret points

#### Code

```
calculator expressions [
  expression "y=x^2" color "blue" {}
  expression "(1, 1)" secret true {}
  expression "(2, 4)" secret true {}
  expression "(-1, 1)" secret true {}
] {}..
```

---

### Example 29

#### Prompt
"line opacity 50%"

#### Chat Transcript

**User**: line opacity 50%

#### Code

```
calculator expressions [
  expression "y=x^2" line-opacity 0.5 {}
] {}..
```

---

### Example 30

#### Prompt
"plot two expressions (one a string another a record)"

#### Chat Transcript

**User**: plot two expressions (one a string another a record)

#### Code

```
calculator expressions [
  "y=x^2"
  {
    latex: "y=x^3"
    color: "#ff0000"
  }
] {}..
```

---

### Example 31

#### Prompt
"point opacity 50%"

#### Chat Transcript

**User**: point opacity 50%

#### Code

```
calculator expressions [
  expression "(0, 0)" point-opacity 0.5 {}
] {}..
```

---

### Example 32

#### Prompt
"dotted blue line of width 5"

#### Chat Transcript

**User**: dotted blue line of width 5

#### Code

```
calculator expressions [
  expression "y=x^2" line-style "DOTTED" line-width 5 color "blue" {}
] {}..
```

---

### Example 33

#### Prompt
"make a graph with three curves of three different colors"

#### Chat Transcript

**User**: make a graph with three curves of three different colors

#### Code

```
calculator expressions [
  color "red" "y=x^2"
  color "blue" "y=x^3"
  color "green" "y=\sin(x)"
] {}..
```

---

### Example 34

#### Prompt
"make the calculator height 600"

#### Chat Transcript

**User**: make the calculator height 600

#### Code

```
height 600 calculator expressions [] {}..
```

---

### Example 35

#### Prompt
"plot a circle using an inequality"

#### Chat Transcript

**User**: plot a circle using an inequality

#### Code

```
calculator expressions [
  "x^2 + y^2 \leq 25"
] {}..
```

---

### Example 36

#### Prompt
"mixed styles across multiple points lists"

#### Chat Transcript

**User**: mixed styles across multiple points lists

#### Code

```
calculator expressions [
  expression "[(1,2), (3,4), (5,6)]" color "red" point-size 8 {}
  expression "[(2,1), (4,3), (6,5)]" color "blue" point-style "OPEN" point-size 12 {}
  expression "[(-1,2), (-3,4), (-2,1)]" color "green" point-style "CROSS" point-size 10 {}
] {}..
```

---

### Example 37

#### Prompt
"set the calculator graph bounds to 10"

#### Chat Transcript

**User**: set the calculator graph bounds to 10

#### Code

```
bounds 10 calculator expressions [] {}..
```

---

### Example 38

#### Prompt
"create a graph with very wide aspect ratio"

#### Chat Transcript

**User**: create a graph with very wide aspect ratio

#### Code

```
width 1200 height 200 bounds [
  -50
  -5
  50
  5
] calculator expressions [
  "y = \sin(x)"
] {}..
```

---

### Example 39

#### Prompt
"hidden curve"

#### Chat Transcript

**User**: hidden curve

#### Code

```
calculator expressions [
  expression "y=x^2" hidden true {}
] {}..
```

---

### Example 40

#### Prompt
"plot a point as a point"

#### Chat Transcript

**User**: plot a point as a point

#### Code

```
calculator expressions [
  "(2, 3)"
] {}..
```

---

### Example 41

#### Prompt
"make a plot of a curve with tight bounds"

#### Chat Transcript

**User**: make a plot of a curve with tight bounds

#### Code

```
bounds [
  -2
  -2
  2
  2
] calculator expressions [
  "y=x^3-x"
] {}..
```

---

### Example 42

#### Prompt
"non-hidden secret curve"

#### Chat Transcript

**User**: non-hidden secret curve

#### Code

```
calculator expressions [
  expression "y=x^2" hidden false secret true {}
] {}..
```



