# Graffiticode Training Examples

*Downloaded on 2025-10-24T19:54:23.528Z*

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
"show the expressions list

Update the code for options using these property values:
```json
{"expressions":true}
```
Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: show the expressions list

**User**: Update the code for options using these property values:
```json
{"expressions":true}
```
Note: Only the properties shown above have changed and need to be updated.

#### Code

```
show-expressions true calculator expressions [] {}..
```

---

### Example 7

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

### Example 8

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

### Example 9

#### Prompt
"Create a point that can be dragged freely in the most natural way, letting the system decide how it moves."

#### Chat Transcript

**User**: Create a point that can be dragged freely in the most natural way, letting the system decide how it moves.

#### Code

```
calculator expressions [
  drag-mode AUTO point-size 20 "(0, 0)"
] {}..
```

---

### Example 10

#### Prompt
"Make a scatter plot of the points (1,1), (2,4), and (3,9) without connecting the lines."

#### Chat Transcript

**User**: Make a scatter plot of the points (1,1), (2,4), and (3,9) without connecting the lines.

#### Code

```
calculator expressions [
  expression "(1,1)" lines false {}
  expression "(2,4)" lines false {}
  expression "(3,9)" lines false {}
] {}..
```

---

### Example 11

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

### Example 12

#### Prompt
"Create a point that can move freely in both x and y directions."

#### Chat Transcript

**User**: Create a point that can move freely in both x and y directions.

#### Code

```
calculator expressions [
  expression "(0, 0)" drag-mode XY {}
] {}..
```

---

### Example 13

#### Prompt
"Show the boundary of y≤−x+4y \le -x + 4y≤−x+4 without shading the region."

#### Chat Transcript

**User**: Show the boundary of y≤−x+4y \le -x + 4y≤−x+4 without shading the region.

#### Code

```
calculator expressions [
  expression "y = -x + 4" color "blue" {}
  expression "y \leq -x + 4" fill-opacity 0 {}
] {}..
```

---

### Example 14

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

### Example 15

#### Prompt
"shade the region below the parabola y = x^2 with fill opacity 0.2"

#### Chat Transcript

**User**: shade the region below the parabola y = x^2 with fill opacity 0.2

#### Code

```
calculator expressions [
  expression "y < x^2" color "blue"
  fill-opacity 0.2 {}
] {}..
```

---

### Example 16

#### Prompt
"make the width 800 and height 600"

#### Chat Transcript

**User**: make the width 800 and height 600

#### Code

```
width 800 height 600 calculator expressions [] {}..
```

---

### Example 17

#### Prompt
"Create a point that can move left and right along the x-axis, but not up or down."

#### Chat Transcript

**User**: Create a point that can move left and right along the x-axis, but not up or down.

#### Code

```
calculator expressions [
  expression "(2, 3)" drag-mode X {}
] {}..
```

---

### Example 18

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

### Example 19

#### Prompt
"Create a point that can move only up and down along the y-axis."

#### Chat Transcript

**User**: Create a point that can move only up and down along the y-axis.

#### Code

```
calculator expressions [
  expression "(0, 0)" drag-mode Y {}
] {}..
```

---

### Example 20

#### Prompt
"Fill the area under the line that connects the points (1,1), (2,4), and (3,1), keeping both the line and points visible."

#### Chat Transcript

**User**: Fill the area under the line that connects the points (1,1), (2,4), and (3,1), keeping both the line and points visible.

#### Code

```
calculator expressions [
  expression "[(1,1), (2,4), (3,1), (1,1)]" color "blue" fill true fill-opacity 0.3 lines true points true {}
] {}..
```

---

### Example 21

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

### Example 22

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

### Example 23

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

### Example 24

#### Prompt
"Plot only the points (1,1), (2,4), and (3,9) without connecting lines or any filled area."

#### Chat Transcript

**User**: Plot only the points (1,1), (2,4), and (3,9) without connecting lines or any filled area.

#### Code

```
bounds [0 0 5 10] calculator expressions [
  expression "(1,1)" lines false fill false {}
  expression "(2,4)" lines false fill false {}
  expression "(3,9)" lines false fill false {}
] {}..
```

---

### Example 25

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

### Example 26

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

### Example 27

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

### Example 28

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

### Example 29

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

### Example 30

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

### Example 31

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

### Example 32

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

### Example 33

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

### Example 34

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

### Example 35

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

### Example 36

#### Prompt
"Connect the points (1,1), (2,4), and (3,9) with lines while keeping the point markers visible."

#### Chat Transcript

**User**: Connect the points (1,1), (2,4), and (3,9) with lines while keeping the point markers visible.

#### Code

```
calculator expressions [
  "[(1,1), (2,4), (3,9)]"
  expression "y = x^2" color "blue" line-width 2 {}
] {}..
```

---

### Example 37

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

### Example 38

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

### Example 39

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

### Example 40

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

### Example 41

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

### Example 42

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

### Example 43

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

### Example 44

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

### Example 45

#### Prompt
"make the calculator height 600"

#### Chat Transcript

**User**: make the calculator height 600

#### Code

```
height 600 calculator expressions [] {}..
```

---

### Example 46

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

### Example 47

#### Prompt
"mixed styles across multiple points lists

Update the code for calculator using these property values:
```json
{"expressions":true}
```
Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: mixed styles across multiple points lists

**User**: Update the code for calculator using these property values:
```json
{"expressions":true}
```
Note: Only the properties shown above have changed and need to be updated.

#### Code

```
calculator expressions [
  expression "[(1,2), (3,4), (5,6)]" color "red" point-size 8 {}
  expression "[(2,1), (4,3), (6,5)]" color "blue" point-style "OPEN" point-size 12 {}
  expression "[(-1,2), (-3,4), (-2,1)]" color "green" point-style "CROSS" point-size 10 {}
] {}..
```

---

### Example 48

#### Prompt
"set the calculator graph bounds to 10"

#### Chat Transcript

**User**: set the calculator graph bounds to 10

#### Code

```
bounds 10 calculator expressions [] {}..
```

---

### Example 49

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

### Example 50

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

### Example 51

#### Prompt
"make a scatter plot without lines with red open points"

#### Chat Transcript

**User**: make a scatter plot without lines with red open points

#### Code

```
calculator expressions [
  expression "[(1,2), (3,4), (5,6), (2,8), (7,1)]" lines false point-style "OPEN" color "red" {}
] {}..
```

---

### Example 52

#### Prompt
"Plot a line through the points (1,1), (2,4), and (3,9) without showing the point markers."

#### Chat Transcript

**User**: Plot a line through the points (1,1), (2,4), and (3,9) without showing the point markers.

#### Code

```
bounds [0 0 5 10] calculator expressions [
  expression "[(1,1), (2,4), (3,9)]" lines true points false {}
] {}..
```

---

### Example 53

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

### Example 54

#### Prompt
"make a plot of a curve with tight bounds

Update the code using these property values:
```json
{"lineStyle":"DASHED"}
```
Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: make a plot of a curve with tight bounds

**User**: Update the code using these property values:
```json
{"lineStyle":"DASHED"}
```
Note: Only the properties shown above have changed and need to be updated.

#### Code

```
bounds [
  -2
  -2
  2
  2
] calculator expressions [
  expression "y=x^3-x" line-style "DASHED" line-opacity 0.5 {}
] {}..
```

---

### Example 55

#### Prompt
"Connect the points (1,1), (2,4), and (3,9) with lines to form a polygon while keeping the point markers visible."

#### Chat Transcript

**User**: Connect the points (1,1), (2,4), and (3,9) with lines to form a polygon while keeping the point markers visible.

#### Code

```
bounds [0 0 5 10] calculator expressions [
  lines true "[(1,1), (2,4), (3,9), (1,1)]"
] {}..
```

---

### Example 56

#### Prompt
"Update the code for calculator using these property values:
```json
{"expressions":true}
```
Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: Update the code for calculator using these property values:
```json
{"expressions":true}
```
Note: Only the properties shown above have changed and need to be updated.

#### Code

```
show-expressions true calculator expressions [
] {}..
```

---

### Example 57

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

---

### Example 58

#### Prompt
"Create a fixed point at (2, 3) that cannot be moved by dragging."

#### Chat Transcript

**User**: Create a fixed point at (2, 3) that cannot be moved by dragging.

#### Code

```
calculator expressions [
  expression "(2, 3)" drag-mode NONE {}
] {}..
```



