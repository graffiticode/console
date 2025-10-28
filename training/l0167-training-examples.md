# Graffiticode Training Examples

*Downloaded on 2025-10-27T22:16:24.598Z*

## Language L0167

### Example 1

#### Prompt
"line width square root 9"

#### Chat Transcript

**User**: line width square root 9

#### Code

```
graphing expressions [
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
width 800 graphing expressions [] {}..
```

---

### Example 3

#### Prompt
"collapse expressions list"

#### Chat Transcript

**User**: collapse expressions list

#### Code

```
expressions-list true expression-collapsed true graphing expressions [] {
  options: {
    "expressionsTopbar": true
  }
}..
```

---

### Example 4

#### Prompt
"secret curve"

#### Chat Transcript

**User**: secret curve

#### Code

```
graphing expressions [
  expression "y=x^2" secret true {}
] {}..
```

---

### Example 5

#### Prompt
"dotted line"

#### Chat Transcript

**User**: dotted line

#### Code

```
graphing expressions [
  expression "y=x^2" line-style "DOTTED" {}
] {}..
```

---

### Example 6

#### Prompt
"red curve"

#### Chat Transcript

**User**: red curve

#### Code

```
graphing expressions [
  color "red" "y=x^2"
] {}..
```

---

### Example 7

#### Prompt
"plot two expressions"

#### Chat Transcript

**User**: plot two expressions

#### Code

```
graphing expressions [
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
] graphing expressions [] {}..
```

---

### Example 9

#### Prompt
"Create a point that can be dragged freely in the most natural way, letting the system decide how it moves."

#### Chat Transcript

**User**: Create a point that can be dragged freely in the most natural way, letting the system decide how it moves.

#### Code

```
graphing expressions [
  expression "(2, 3)" drag-mode "AUTO" {}
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
graphing expressions [
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
graphing expressions [
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
graphing expressions [
  expression "(0, 0)" id "a" drag-mode XY {}
  expression "(5, 5)" id "b" {}
  expression "[a, b]" lines true {}
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
graphing expressions [
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
graphing expressions [
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
graphing expressions [
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
width 800 height 600 graphing expressions [] {}..
```

---

### Example 17

#### Prompt
"Plot the polar cardioid r=1−cos⁡θ over θ∈[0,2π] and lightly shade the region"

#### Chat Transcript

**User**: Plot the polar cardioid r=1−cos⁡θ over θ∈[0,2π] and lightly shade the region

#### Code

```
graphing expressions [
  expression "r=1-\\cos(\\theta)" polar-domain {
    min: "0"
    max: "2\\pi"
  } fill true fill-opacity 0.3 {}
] {}..
```

---

### Example 18

#### Prompt
"Create a point that can move left and right along the x-axis, but not up or down."

#### Chat Transcript

**User**: Create a point that can move left and right along the x-axis, but not up or down.

#### Code

```
graphing expressions [
  expression "(2, 3)" drag-mode X {}
] {}..
```

---

### Example 19

#### Prompt
"plot a list of points in a single expression"

#### Chat Transcript

**User**: plot a list of points in a single expression

#### Code

```
graphing expressions [
  "[(1,2), (3,4), (5,6), (2,8), (7,1)]"
] {}..
```

---

### Example 20

#### Prompt
"Create an animated slider for a=5a = 5a=5 that runs automatically between 0 and 10 to show how the slope of y=axy = axy=ax changes."

#### Chat Transcript

**User**: Create an animated slider for a=5a = 5a=5 that runs automatically between 0 and 10 to show how the slope of y=axy = axy=ax changes.

#### Code

```
show-expressions true graphing expressions [
  expression "a=5" slider-bounds {
    min: "0"
    max: "10"
    step: "0.1"
  } playing true {}
  "y=ax"
] {}..
```

---

### Example 21

#### Prompt
"Create a point that can move only up and down along the y-axis."

#### Chat Transcript

**User**: Create a point that can move only up and down along the y-axis.

#### Code

```
graphing expressions [
  expression "(0, 0)" drag-mode Y {}
] {}..
```

---

### Example 22

#### Prompt
"Fill the area under the line that connects the points (1,1), (2,4), and (3,1), keeping both the line and points visible."

#### Chat Transcript

**User**: Fill the area under the line that connects the points (1,1), (2,4), and (3,1), keeping both the line and points visible.

#### Code

```
graphing expressions [
  expression "[(1,1), (2,4), (3,1), (1,1)]" color "blue" fill true fill-opacity 0.3 lines true points true {}
] {}..
```

---

### Example 23

#### Prompt
"curve with color #ff00f1"

#### Chat Transcript

**User**: curve with color #ff00f1

#### Code

```
graphing expressions [
  color "#ff00f1" "y=x^2"
] {}..
```

---

### Example 24

#### Prompt
"graph a curve with name 'myParabola'"

#### Chat Transcript

**User**: graph a curve with name 'myParabola'

#### Code

```
graphing expressions [
  expression "y=x^2" id "myParabola" {}
] {}..
```

---

### Example 25

#### Prompt
"make a minimal graph of a parabola"

#### Chat Transcript

**User**: make a minimal graph of a parabola

#### Code

```
graphing expressions [
  "y=x^2"
] {}..
```

---

### Example 26

#### Prompt
"Plot only the points (1,1), (2,4), and (3,9) without connecting lines or any filled area."

#### Chat Transcript

**User**: Plot only the points (1,1), (2,4), and (3,9) without connecting lines or any filled area.

#### Code

```
bounds [0 0 5 10] graphing expressions [
  expression "(1,1)" lines false fill false {}
  expression "(2,4)" lines false fill false {}
  expression "(3,9)" lines false fill false {}
] {}..
```

---

### Example 27

#### Prompt
"point as cross or x"

#### Chat Transcript

**User**: point as cross or x

#### Code

```
graphing expressions [
  expression "(0, 0)" point-style "CROSS" {}
] {}..
```

---

### Example 28

#### Prompt
"plot an expression with a color"

#### Chat Transcript

**User**: plot an expression with a color

#### Code

```
graphing expressions [
  color "red" "y=x^2"
] {}..
```

---

### Example 29

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
graphing expressions [
  expression "x^2 + y^2 < 25" color "blue" line-opacity 0.3 line-width 5 fill-opacity 0.1 {}
  expression "y = 2x + 1" color "red" line-opacity 0.8 line-width 5 {}
] {}..
```

---

### Example 30

#### Prompt
"dotted x^2 dashed x^3"

#### Chat Transcript

**User**: dotted x^2 dashed x^3

#### Code

```
graphing expressions [
  expression "y=x^2" line-style "DOTTED" {}
  expression "y=x^3" line-style "DASHED" {}
] {}..
```

---

### Example 31

#### Prompt
"create a calculator with a mix of points and lines"

#### Chat Transcript

**User**: create a calculator with a mix of points and lines

#### Code

```
graphing expressions [
  expression "(2, 3)" color "red" point-size 8 {}
  expression "(-1, 4)" color "blue" point-size 8 {}
  expression "y = 2x + 1" color "green" line-width 3 {}
  expression "y = x^2 - 2" color "purple" line-style "DASHED" {}
] {}..
```

---

### Example 32

#### Prompt
"plot a list of points"

#### Chat Transcript

**User**: plot a list of points

#### Code

```
graphing expressions [
  "(1, 2)"
  "(3, 4)"
  "(5, 1)"
  "(-2, 3)"
  "(0, -1)"
] {}..
```

---

### Example 33

#### Prompt
"point using computed size with latex"

#### Chat Transcript

**User**: point using computed size with latex

#### Code

```
graphing expressions [
  expression "(2, 3)" point-size "2 + 3" {}
] {}..
```

---

### Example 34

#### Prompt
"Make two sliders, a and b, to control the slope and intercept of the line y=ax+by = a x + by=ax+b. Let a move from 0–10 in steps of 0.5 and b move from −5–5 in steps of 1."

#### Chat Transcript

**User**: Make two sliders, a and b, to control the slope and intercept of the line y=ax+by = a x + by=ax+b. Let a move from 0–10 in steps of 0.5 and b move from −5–5 in steps of 1.

#### Code

```
show-expressions true graphing expressions [
  expression "a=1" slider-bounds {
    min: "0"
    max: "10"
    step: "0.5"
  } {}
  expression "b=0" slider-bounds {
    min: "-5"
    max: "5"
    step: "1"
  } {}
  "y=ax+b"
] {}..
```

---

### Example 35

#### Prompt
"show expressions list unccollapsed"

#### Chat Transcript

**User**: show expressions list unccollapsed

#### Code

```
show-expressions true expressions-collapsed false graphing expressions [] {v:1}..
```

---

### Example 36

#### Prompt
"big point"

#### Chat Transcript

**User**: big point

#### Code

```
graphing expressions [
  expression "(0, 0)" point-size "20" {}
] {}..
```

---

### Example 37

#### Prompt
"plot an expression"

#### Chat Transcript

**User**: plot an expression

#### Code

```
graphing expressions [
  expression "y=x^2" {}
] {}..
```

---

### Example 38

#### Prompt
"plot an expression with a color using a record"

#### Chat Transcript

**User**: plot an expression with a color using a record

#### Code

```
graphing expressions [
  {
    latex: "y=x^2"
    color: "#ff0000"
  }
] {}..
```

---

### Example 39

#### Prompt
"point as open circle"

#### Chat Transcript

**User**: point as open circle

#### Code

```
graphing expressions [
  expression "(0, 0)" point-style "OPEN" {}
] {}..
```

---

### Example 40

#### Prompt
"Connect the points (1,1), (2,4), and (3,9) with lines while keeping the point markers visible."

#### Chat Transcript

**User**: Connect the points (1,1), (2,4), and (3,9) with lines while keeping the point markers visible.

#### Code

```
graphing expressions [
  "[(1,1), (2,4), (3,9)]"
  expression "y = x^2" color "blue" line-width 2 {}
] {}..
```

---

### Example 41

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
] graphing expressions [
  "y = x^2 - 2x + 1"
] {}..
```

---

### Example 42

#### Prompt
"line with width 10"

#### Chat Transcript

**User**: line with width 10

#### Code

```
graphing expressions [
  expression "y = x" line-width 10 {}
] {}..
```

---

### Example 43

#### Prompt
"Mix colored curve + secret points"

#### Chat Transcript

**User**: Mix colored curve + secret points

#### Code

```
graphing expressions [
  expression "y=x^2" color "blue" {}
  expression "(1, 1)" secret true {}
  expression "(2, 4)" secret true {}
  expression "(-1, 1)" secret true {}
] {}..
```

---

### Example 44

#### Prompt
"Plot a polar rose using r=sin⁡(3θ) for θ from 0 to 2π"

#### Chat Transcript

**User**: Plot a polar rose using r=sin⁡(3θ) for θ from 0 to 2π

#### Code

```
graphing expressions [
  expression "r=\\sin(3\\theta)" polar-domain {
    max: "2\\pi"
    min: "0"
  } {}
] {}..
```

---

### Example 45

#### Prompt
"Add a slider a = 5 with bounds 0 to 10 in steps of 0.5, and use it to control the slope of the line y=axy = axy=ax."

#### Chat Transcript

**User**: Add a slider a = 5 with bounds 0 to 10 in steps of 0.5, and use it to control the slope of the line y=axy = axy=ax.

#### Code

```
show-expressions true graphing expressions [
  expression  "a=5" slider-bounds {
    step: "0.5"
    max: "10"
    min: "0"
  } {}
  "y=ax"
] {}..
```

---

### Example 46

#### Prompt
"don't show expressions list"

#### Chat Transcript

**User**: don't show expressions list

#### Code

```
show-expressions false graphing expressions [] {}..
```

---

### Example 47

#### Prompt
"line opacity 50%"

#### Chat Transcript

**User**: line opacity 50%

#### Code

```
graphing expressions [
  expression "y=x^2" line-opacity 0.5 {}
] {}..
```

---

### Example 48

#### Prompt
"plot two expressions (one a string another a record)"

#### Chat Transcript

**User**: plot two expressions (one a string another a record)

#### Code

```
graphing expressions [
  "y=x^2"
  {
    latex: "y=x^3"
    color: "#ff0000"
  }
] {}..
```

---

### Example 49

#### Prompt
"point opacity 50%"

#### Chat Transcript

**User**: point opacity 50%

#### Code

```
graphing expressions [
  expression "(0, 0)" point-opacity 0.5 {}
] {}..
```

---

### Example 50

#### Prompt
"dotted blue line of width 5"

#### Chat Transcript

**User**: dotted blue line of width 5

#### Code

```
graphing expressions [
  expression "y=x^2" line-style "DOTTED" line-width 5 color "blue" {}
] {}..
```

---

### Example 51

#### Prompt
"make a graph with three curves of three different colors"

#### Chat Transcript

**User**: make a graph with three curves of three different colors

#### Code

```
graphing expressions [
  color "red" "y=x^2"
  color "blue" "y=x^3"
  color "green" "y=\sin(x)"
] {}..
```

---

### Example 52

#### Prompt
"Update the code for options using these property values:
```json
{
  "expressions": true,
  "expressionsCollapsed": true
}
```
Note: Only the properties shown above have changed and need to be updated."

#### Chat Transcript

**User**: Update the code for options using these property values:
```json
{
  "expressions": true,
  "expressionsCollapsed": true
}
```
Note: Only the properties shown above have changed and need to be updated.

#### Code

```
graphing show-expressions true expressions-collapsed true expressions [] {}..
```

---

### Example 53

#### Prompt
"make the calculator height 600"

#### Chat Transcript

**User**: make the calculator height 600

#### Code

```
height 600 graphing expressions [] {}..
```

---

### Example 54

#### Prompt
"Create a line y=2x+1 and give it the id "mainLine" so it can be referenced later"

#### Chat Transcript

**User**: Create a line y=2x+1 and give it the id "mainLine" so it can be referenced later

#### Code

```
graphing expressions [
  expression "y=2x+1" id "mainLine" {}
] {}..
```

---

### Example 55

#### Prompt
"Place three labeled points A, B, and C at (1,1), (2,2), and (3,3). Assign each an id and position their labels differently: A above, B right, C left"

#### Chat Transcript

**User**: Place three labeled points A, B, and C at (1,1), (2,2), and (3,3). Assign each an id and position their labels differently: A above, B right, C left

#### Code

```
graphing expressions [
  expression "(1,1)" id "pointA" label "A" show-label true label-orientation "ABOVE" {}
  expression "(2,2)" id "pointB" label "B" show-label true label-orientation "RIGHT" {}
  expression "(3,3)" id "pointC" label "C" show-label true label-orientation "LEFT" {}
] {}..
```

---

### Example 56

#### Prompt
"Use a slider for a to control the slope of the line y=ax+2y"

#### Chat Transcript

**User**: Use a slider for a to control the slope of the line y=ax+2y

#### Code

```
show-expressions true expressions-collapsed true graphing expressions [
  expression "a=1" slider-bounds {
    min: "-5"
    max: "5"
    step: "0.1"
  } {}
  "y=ax+2"
] {}..
```

---

### Example 57

#### Prompt
"Plot a circle in polar coordinates using r=2 for θ from 0 to 2π"

#### Chat Transcript

**User**: Plot a circle in polar coordinates using r=2 for θ from 0 to 2π

#### Code

```
graphing expressions [
  expression "r=2" polar-domain {
    min: "0"
    max: "2\\pi"
  } {}
] {}..
```

---

### Example 58

#### Prompt
"plot a circle using an inequality"

#### Chat Transcript

**User**: plot a circle using an inequality

#### Code

```
graphing expressions [
  "x^2 + y^2 \leq 25"
] {}..
```

---

### Example 59

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
graphing expressions [
  expression "[(1,2), (3,4), (5,6)]" color "red" point-size 8 {}
  expression "[(2,1), (4,3), (6,5)]" color "blue" point-style "OPEN" point-size 12 {}
  expression "[(-1,2), (-3,4), (-2,1)]" color "green" point-style "CROSS" point-size 10 {}
] {}..
```

---

### Example 60

#### Prompt
"set the calculator graph bounds to 10"

#### Chat Transcript

**User**: set the calculator graph bounds to 10

#### Code

```
bounds 10 graphing expressions [] {}..
```

---

### Example 61

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
] graphing expressions [
  "y = \sin(x)"
] {}..
```

---

### Example 62

#### Prompt
"Place a point at (1, 2) labeled “Point A” and make the label visible"

#### Chat Transcript

**User**: Place a point at (1, 2) labeled “Point A” and make the label visible

#### Code

```
graphing expressions [
  expression "(1, 2)" label "Point A" show-label true {}
] {}..
```

---

### Example 63

#### Prompt
"hidden curve"

#### Chat Transcript

**User**: hidden curve

#### Code

```
graphing expressions [
  expression "y=x^2" hidden true {}
] {}..
```

---

### Example 64

#### Prompt
"Plot an ellipse using the parametric equations x=2cos⁡(t), y=sin⁡(t), for t from 0 to 2π, with a dashed blue outline and 20% fill opacity"

#### Chat Transcript

**User**: Plot an ellipse using the parametric equations x=2cos⁡(t), y=sin⁡(t), for t from 0 to 2π, with a dashed blue outline and 20% fill opacity

#### Code

```
graphing expressions [
  expression "(2\\cos(t), \\sin(t))" parametric-domain {
    max: "2\\pi"
    min: "0"
  } line-style "DASHED" color "blue" fill true fill-opacity 0.2 {}
] {}..
```

---

### Example 65

#### Prompt
"make a scatter plot without lines with red open points"

#### Chat Transcript

**User**: make a scatter plot without lines with red open points

#### Code

```
graphing expressions [
  expression "[(1,2), (3,4), (5,6), (2,8), (7,1)]" lines false point-style "OPEN" color "red" {}
] {}..
```

---

### Example 66

#### Prompt
"Plot a line through the points (1,1), (2,4), and (3,9) without showing the point markers."

#### Chat Transcript

**User**: Plot a line through the points (1,1), (2,4), and (3,9) without showing the point markers.

#### Code

```
bounds [0 0 5 10] graphing expressions [
  expression "[(1,1), (2,4), (3,9)]" lines true points false {}
] {}..
```

---

### Example 67

#### Prompt
"plot a point as a point"

#### Chat Transcript

**User**: plot a point as a point

#### Code

```
graphing expressions [
  "(2, 3)"
] {}..
```

---

### Example 68

#### Prompt
"Plot a unit circle using the parametric curve (cos t, sin t) for t from 0 to 2π"

#### Chat Transcript

**User**: Plot a unit circle using the parametric curve (cos t, sin t) for t from 0 to 2π

#### Code

```
graphing expressions [
  expression "(\cos(t), \sin(t))" parametric-domain {
    min: "0"
    max: "2\\pi"
  } {}
] {}..
```

---

### Example 69

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
] graphing expressions [
  expression "y=x^3-x" line-style "DASHED" line-opacity 0.5 {}
] {}..
```

---

### Example 70

#### Prompt
"Connect the points (1,1), (2,4), and (3,9) with lines to form a polygon while keeping the point markers visible."

#### Chat Transcript

**User**: Connect the points (1,1), (2,4), and (3,9) with lines to form a polygon while keeping the point markers visible.

#### Code

```
graphing [0 0 5 10] calculator expressions [
  lines true "[(1,1), (2,4), (3,9), (1,1)]"
] {}..
```

---

### Example 71

#### Prompt
"non-hidden secret curve"

#### Chat Transcript

**User**: non-hidden secret curve

#### Code

```
graphing expressions [
  expression "y=x^2" hidden false secret true {}
] {}..
```

---

### Example 72

#### Prompt
"Label a point “A” at (2, 1), make the label 1.5× the normal size, and place it above the point"

#### Chat Transcript

**User**: Label a point “A” at (2, 1), make the label 1.5× the normal size, and place it above the point

#### Code

```
graphing expressions [
  expression "(2, 1)" label "A" show-label true label-size "1.5" label-orientation "ABOVE" {}
] {}..
```

---

### Example 73

#### Prompt
"Create a fixed point at (2, 3) that cannot be moved by dragging."

#### Chat Transcript

**User**: Create a fixed point at (2, 3) that cannot be moved by dragging.

#### Code

```
graphing expressions [
  expression "(2, 3)" drag-mode NONE {}
] {}..
```



