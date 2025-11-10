# Graffiticode Training Examples

*Downloaded on 2025-11-10T23:43:42.554Z*

## Language L0168

### Example 1

#### Prompt
"show the toolbar"

#### Chat Transcript

**User**: show the toolbar

#### Code

```
show-toolbar true geometry expressions [] {}..
```

---

### Example 2

#### Prompt
"validate the equation of a line"

#### Chat Transcript

**User**: validate the equation of a line

#### Code

```
geometry expressions [
  expression "y=2x+1" assess [
    method "line"
    expected "y=2x+1"
    {}
  ] {}
] {}..
```

---

### Example 3

#### Prompt
"Make draggable points A and B that define a segment"

#### Chat Transcript

**User**: Make draggable points A and B that define a segment

#### Code

```
geometry expressions [
  expression "A = (1, 2)" label "A" show-label true drag-mode "XY" {}
  expression "B = (4, 3)" label "B" show-label true drag-mode "XY" {}
  "\\segment(A, B)"
] {}..
```

---

### Example 4

#### Prompt
"Define points A (1, 1) and B (3 + a, 2 − b) using parameters a and b"

#### Chat Transcript

**User**: Define points A (1, 1) and B (3 + a, 2 − b) using parameters a and b

#### Code

```
geometry expressions [
  "a = 1"
  "b = 0.5"
  expression "(1, 1)" label "A" show-label true {}
  expression "(3 + a, 2 - b)" label "B" show-label true {}
] {}..
```

---

### Example 5

#### Prompt
"Create points A, B, and C on the same horizontal line"

#### Chat Transcript

**User**: Create points A, B, and C on the same horizontal line

#### Code

```
geometry expressions [
  expression "(0, 2)" label "A" show-label true {}
  expression "(3, 2)" label "B" show-label true {}
  expression "(6, 2)" label "C" show-label true {}
] {}..
```

---

### Example 6

#### Prompt
"Make a draggable point on the line through (0,0) and (4,2)"

#### Chat Transcript

**User**: Make a draggable point on the line through (0,0) and (4,2)

#### Code

```
geometry expressions [
  expression "(0, 0)" label "A" show-label true {}
  expression "(4, 2)" label "B" show-label true {}
  expression "P = (2, 1)" label "P" show-label true drag-mode Y {}
  "y = P.y - 1 + 0.5x"
] {}..
```

---

### Example 7

#### Prompt
"show the expressions list and the expressions tools"

#### Chat Transcript

**User**: show the expressions list and the expressions tools

#### Code

```
show-expressions true show-expressions-tools true geometry expressions [] {}..
```

---

### Example 8

#### Prompt
"make an assessment where the student is asked to place a point at the midpoint of a line segment. make the expected response to be a integer coordinates"

#### Chat Transcript

**User**: make an assessment where the student is asked to place a point at the midpoint of a line segment. make the expected response to be a integer coordinates

#### Code

```
show-toolbar false show-expressions false bounds 10 geometry expressions [
  expression "A = (2, 4)" color "blue" {}
  expression "B = (6, 8)" color "blue" {}
  expression "\\segment(A, B)" color "blue" {}
  expression "(0, 0)" label "M" show-label true drag-mode XY assess [
    method "point"
    expected "(4, 6)"
  ] {}
] {}..
```

---

### Example 9

#### Prompt
"create an assessment where the student is asked to plot the line y=-3x-1 using a line through two draggable points"

#### Chat Transcript

**User**: create an assessment where the student is asked to plot the line y=-3x-1 using a line through two draggable points

#### Code

```
geometry expressions [
  expression "A = (0, -1)" label "A" show-label true drag-mode "XY" {}
  expression "B = (1, -4)" label "B" show-label true drag-mode "XY" {}
  expression "\line(A, B)" assess [
    method "line"
    expected "y=-3x-1"
  ] {}
] {}..
```

---

### Example 10

#### Prompt
"Add a labeled point A at (4, 1)"

#### Chat Transcript

**User**: Add a labeled point A at (4, 1)

#### Code

```
geometry expressions [
  expression "(4, 1)" label "A" show-label true {}
] {}..
```

---

### Example 11

#### Prompt
"Make a dashed line through A and B"

#### Chat Transcript

**User**: Make a dashed line through A and B

#### Code

```
geometry expressions [
  expression "A = (1, 2)" {}
  expression "B = (4, 6)" {}
  expression "L = \\line(A, B)" line-style "DASHED" color "blue" label "ℓ" show-label true {}
] {}..
```

---

### Example 12

#### Prompt
"Draw the perpendicular bisector of segment AB"

#### Chat Transcript

**User**: Draw the perpendicular bisector of segment AB

#### Code

```
geometry expressions [
  expression "A = (1, 2)" drag-mode "XY" {}
  expression "B = (5, 4)" drag-mode "XY" {}
  expression "M = \frac{A + B}{2}" color "blue" {}
  expression "L = \\line(A, B)" {}
  expression "\\perpendicular(L, M)" color "red" {}
] {}..
```

---

### Example 13

#### Prompt
"Create a point B that is the reflection of A across the y-axis"

#### Chat Transcript

**User**: Create a point B that is the reflection of A across the y-axis

#### Code

```
geometry expressions [
  expression "(3, 2)" label "A" show-label true {}
  expression "(-3, 2)" label "B" show-label true {}
] {}..
```

---

### Example 14

#### Prompt
"Define a point P that is 2 units to the right of A"

#### Chat Transcript

**User**: Define a point P that is 2 units to the right of A

#### Code

```
geometry expressions [
  "A = (0, 0)"
  "P = (A.x + 2, A.y)"
] {}..
```

---

### Example 15

#### Prompt
"create an assessment that asks the student to plot a line that goes through the point (2,1) and has the slope of -3. provide a draggable line that does not satisfy the solution

add instructions to provide context for the problem"

#### Chat Transcript

**User**: create an assessment that asks the student to plot a line that goes through the point (2,1) and has the slope of -3. provide a draggable line that does not satisfy the solution

**User**: add instructions to provide context for the problem

#### Code

```
show-toolbar false instructions "Move points A and B so that the line through them has the equation $y = -3x + 7$." geometry expressions [
  expression "A = (0, 0)" label "A" show-label true drag-mode "XY" {}
  expression "B = (1, 2)" label "B" show-label true drag-mode "XY" {}
  expression "\line(A, B)" assess [
    method "line"
    expected "y=-3x+7"
  ] {}
] {}..
```

---

### Example 16

#### Prompt
"make an assessment that asked the student to plot a circle for (x-1)^2+(y+2)^2=9. provide the context for the problem

don't give the solution in the context"

#### Chat Transcript

**User**: make an assessment that asked the student to plot a circle for (x-1)^2+(y+2)^2=9. provide the context for the problem

**User**: don't give the solution in the context

#### Code

```
title "Circle Construction Exercise" instructions "Draw a circle that matches the equation $(x-1)^2+(y+2)^2=9$

Use the center point C and radius point P to construct your circle." geometry expressions [
  expression "C = (0, 0)" label "C" show-label true drag-mode "XY" {}
  expression "P = (1, 0)" label "P" show-label true drag-mode "XY" {}
  expression "\circle(C, P)" assess [
    method "circle"
    expected "(x-1)^2+(y+2)^2=9"
  ] {}
] {}..
```

---

### Example 17

#### Prompt
"Create point M as the midpoint between A and B"

#### Chat Transcript

**User**: Create point M as the midpoint between A and B

#### Code

```
geometry expressions [
  expression "(2, 3)" label "A" show-label true {}
  expression "(6, 7)" label "B" show-label true {}
  expression "M = ((2+6)/2, (3+7)/2)" label "M" show-label true {}
] {}..
```

---

### Example 18

#### Prompt
"show expressions list"

#### Chat Transcript

**User**: show expressions list

#### Code

```
show-expressions true geometry expressions [] {}..
```

---

### Example 19

#### Prompt
"create a line through two draggable points with the step of one unit"

#### Chat Transcript

**User**: create a line through two draggable points with the step of one unit

#### Code

```
geometry expressions [
  expression "A = (0, 0)" label "A" show-label true drag-mode "XY" {}
  expression "B = (1, 1)" label "B" show-label true drag-mode "XY" {}
  expression "\line(A,B)" {}
] {}..
```

---

### Example 20

#### Prompt
"show expressions list and toolbar"

#### Chat Transcript

**User**: show expressions list and toolbar

#### Code

```
show-expressions true show-toolbar true geometry expressions [] {}..
```

---

### Example 21

#### Prompt
"show expressions list with tools"

#### Chat Transcript

**User**: show expressions list with tools

#### Code

```
show-expressions true show-expressions-tools true geometry expressions [] {}..
```

---

### Example 22

#### Prompt
"create a point"

#### Chat Transcript

**User**: create a point

#### Code

```
geometry expressions [
  "(2, 3)"
] {}..
```

---

### Example 23

#### Prompt
"Create the line with equation y=2x+1"

#### Chat Transcript

**User**: Create the line with equation y=2x+1

#### Code

```
geometry expressions [
  "y=2x+1"
] {}..
```

---

### Example 24

#### Prompt
"Through point A with slope m, draw the line"

#### Chat Transcript

**User**: Through point A with slope m, draw the line

#### Code

```
geometry expressions [
  expression "(2, 3)" label "A" show-label true {}
  expression "m = 1" slider-bounds {
    min: "-5"
    max: "5"
    step: "0.1"
  } {}
  expression "y - 3 = m(x - 2)" color "blue" {}
] {}..
```

---

### Example 25

#### Prompt
"Define point P as the intersection of lines L₁ and L₂"

#### Chat Transcript

**User**: Define point P as the intersection of lines L₁ and L₂

#### Code

```
geometry expressions [
  "L_1 = \line((0,0),(2,1))"
  "L_2 = \line((1,0),(0,2))"
  expression "P = \intersection(L_1, L_2)" show-label true label "P" color "red" point-size 12 {}
] {}..
```

---

### Example 26

#### Prompt
"Add a draggable point D"

#### Chat Transcript

**User**: Add a draggable point D

#### Code

```
geometry expressions [
  expression "(0, 0)" label "D" show-label true drag-mode "XY" {}
] {}..
```

---

### Example 27

#### Prompt
"make a segment assessment"

#### Chat Transcript

**User**: make a segment assessment

#### Code

```
geometry expressions [
  expression "A = (0, 0)" label "A" show-label true drag-mode "XY" {}
  expression "B = (1, 1)" label "B" show-label true drag-mode "XY" {}
  expression "\segment(A, B)" assess [
    method "segment"
    expected "\segment((0,0),(3,4))"
  ] {}
] {}..
```

---

### Example 28

#### Prompt
"Define the intersection points of line L and circle C"

#### Chat Transcript

**User**: Define the intersection points of line L and circle C

#### Code

```
geometry expressions [
"C = \circle((0,0), 3)"
"L = \line((-3,-2), (3,2))"
"P = \\intersection(C, L)"
] {}..
```

---

### Example 29

#### Prompt
"Create an assessment where the student is asked to place a point at (2, 3) and its reflection over the y axis. Include points P and Q that the student will drag into place, respectively"

#### Chat Transcript

**User**: Create an assessment where the student is asked to place a point at (2, 3) and its reflection over the y axis. Include points P and Q that the student will drag into place, respectively

#### Code

```
geometry expressions [
  expression "(-8, 5)" secret true color "green" label "P" show-label true drag-mode "XY" assess [
    method "point"
    expected {
      latex: "(2, 3)"
      label: "P"
    }
  ] {}
  expression "(-8, 3)" secret true color "blue" label "Q" show-label true drag-mode "XY" assess [
    method "point"
    expected {
      latex: "(-2, 3)"
      label: "Q"
    }
  ] {}
] {}..
```

---

### Example 30

#### Prompt
"Add a draggable point called D"

#### Chat Transcript

**User**: Add a draggable point called D

#### Code

```
geometry expressions [
  expression "(0, 0)" label "D" show-label true drag-mode "XY" {}
] {}..
```

---

### Example 31

#### Prompt
"Add three draggable labeled points A, B, and C"

#### Chat Transcript

**User**: Add three draggable labeled points A, B, and C

#### Code

```
geometry expressions [
  expression "(1, 2)" label "A" show-label true drag-mode "XY" {}
  expression "(3, 1)" label "B" show-label true drag-mode "XY" {}
  expression "(-1, 3)" label "C" show-label true drag-mode "XY" {}
] {}..
```

---

### Example 32

#### Prompt
"Define point P where x = 2a and y = 3b"

#### Chat Transcript

**User**: Define point P where x = 2a and y = 3b

#### Code

```
geometry expressions [
  "a=2"
  "b=3"
  "P = (a, b)"
] {}..
```

---

### Example 33

#### Prompt
"Create two labeled points A and B at (1, 2) and (4, 3)"

#### Chat Transcript

**User**: Create two labeled points A and B at (1, 2) and (4, 3)

#### Code

```
geometry expressions [
  expression "(1, 2)" label "A" show-label true {}
  expression "(4, 3)" label "B" show-label true {}
] {}..
```

---

### Example 34

#### Prompt
"create an assessment that asked the student to draw a graph of adding the vectors (1,-2) and (-4,-3). Use bare assessments that validates all three vectors. write instructions that use latex for the vector notation. show the toolbar"

#### Chat Transcript

**User**: create an assessment that asked the student to draw a graph of adding the vectors (1,-2) and (-4,-3). Use bare assessments that validates all three vectors. write instructions that use latex for the vector notation. show the toolbar

#### Code

```
show-toolbar true instructions "Draw a graph showing the addition of vectors $\vec{u} = (1,-2)$ and $\vec{v} = (-4,-3)$. Show both original vectors and their sum $\vec{u} + \vec{v}$." geometry expressions [
  assess [
    method "vector"
    expected "\vector((0,0),(1,-2))"
  ] {}
  assess [
    method "vector"
    expected "\vector((1,-2),(-3,-5))"
  ] {}
  assess [
    method "vector"
    expected "\vector((0,0),(-3,-5))"
  ] {}
] {}..
```

---

### Example 35

#### Prompt
"Draw segment AB"

#### Chat Transcript

**User**: Draw segment AB

#### Code

```
geometry expressions [
  "A = (1, 2)"
  "B = (4, 5)"
  "\\segment(A, B)"
] {}..
```

---

### Example 36

#### Prompt
"Define intersection points of circles C₁ and C₂"

#### Chat Transcript

**User**: Define intersection points of circles C₁ and C₂

#### Code

```
geometry expressions [
  "C_1 = \circle((0,0),3)"
  "C_2 = \circle((4,0),3)"
  expression "P = \intersection(C_1, C_2)" show-label true label "P" color "red" point-size 12 {}
] {}..
```

---

### Example 37

#### Prompt
"create an assessment where the student is expected to place a point at coordinates x=2 and y=-3"

#### Chat Transcript

**User**: create an assessment where the student is expected to place a point at coordinates x=2 and y=-3

#### Code

```
geometry expressions [
  expression "(0, 0)" drag-mode XY assess [
    method "point"
    expected "(2, -3)"
  ] {}
] {}..
```

---

### Example 38

#### Prompt
"Add draggable points A, B, and C"

#### Chat Transcript

**User**: Add draggable points A, B, and C

#### Code

```
geometry expressions [
  expression "(1, 2)" label "A" show-label true drag-mode "XY" {}
  expression "(3, 1)" label "B" show-label true drag-mode "XY" {}
  expression "(-1, 3)" label "C" show-label true drag-mode "XY" {}
] {}..
```

---

### Example 39

#### Prompt
"Create a vector from the origin to (2, 3)"

#### Chat Transcript

**User**: Create a vector from the origin to (2, 3)

#### Code

```
geometry expressions [
  expression "\vector((0, 0), (2, 3))" {}
] {}..
```

---

### Example 40

#### Prompt
"make a assessment that asked the student to draw a circle that matches (x-1)^2+(y+2)^2=9"

#### Chat Transcript

**User**: make a assessment that asked the student to draw a circle that matches (x-1)^2+(y+2)^2=9

#### Code

```
title "Circle Construction Exercise" instructions "Draw a circle that matches the equation $(x-1)^2+(y+2)^2=9$" geometry expressions [
  expression "C = (0, 0)" label "C" show-label true drag-mode "XY" {}
  expression "P = (1, 0)" label "P" show-label true drag-mode "XY" {}
  expression "\circle(C, P)" assess [
    method "circle"
    expected "(x-1)^2+(y+2)^2=9"
  ] {}
] {}..
```

---

### Example 41

#### Prompt
"Through point P, draw a line perpendicular to L"

#### Chat Transcript

**User**: Through point P, draw a line perpendicular to L

#### Code

```
geometry expressions [
  expression "A = (0,0)" label "A" show-label true {}
  expression "B = (2,1)" label "B" show-label true {}
  expression "L = \\line(A,B)" {}
  expression "P = (1,3)" label "P" show-label true {}
  expression "L_p = \\perpendicular(L, P)" {}
] {}..
```

---

### Example 42

#### Prompt
"Create point B by translating point A using vector v"

#### Chat Transcript

**User**: Create point B by translating point A using vector v

#### Code

```
geometry expressions [
  expression "A = (0, 0)" label "A" show-label true {}
  expression "B = (2, 3)" label "B" show-label true {}
  expression "v = \\vector(A, B)" label "v" show-label true {}
  expression "\\translate(A, v)" label "B" show-label true {}
] {}..
```

---

### Example 43

#### Prompt
"Create a draggable point on the circle centered at (0,0) with radius 3"

#### Chat Transcript

**User**: Create a draggable point on the circle centered at (0,0) with radius 3

#### Code

```
geometry expressions [
  expression "P = (3, 0)" drag-mode X label "P" show-label true {}
  "(x-0)^2 + (y-0)^2 = {P.x}^2"
] {}..
```

---

### Example 44

#### Prompt
"Make the line through A and B"

#### Chat Transcript

**User**: Make the line through A and B

#### Code

```
geometry expressions [
  expression "(1, 2)" label "A" show-label true {}
  expression "(4, 6)" label "B" show-label true {}
  "y - 2 = \frac{6-2}{4-1}(x - 1)"
] {}..
```

---

### Example 45

#### Prompt
"Define a point P where x = 2a + 1 and y = 3b − 2"

#### Chat Transcript

**User**: Define a point P where x = 2a + 1 and y = 3b − 2

#### Code

```
geometry expressions [
  "a = 1"
  "b = 2"
  expression "P = (2a + 1, 3b - 2)" label "P" show-label true {}
] {}..
```

---

### Example 46

#### Prompt
"Through point P, draw a line parallel to L"

#### Chat Transcript

**User**: Through point P, draw a line parallel to L

#### Code

```
geometry expressions [
"A = (0,0)"
"B = (2,1)"
"L = \\line(A,B)"
"P = (1,3)"
"L_p = \\parallel(L, P)"
] {}..
```

---

### Example 47

#### Prompt
"Create a line with adjustable slope m passing through point P"

#### Chat Transcript

**User**: Create a line with adjustable slope m passing through point P

#### Code

```
geometry expressions [
  expression "(1, 2)" drag-mode NONE label "P" show-label true drag-mode "XY" {}
  expression "m=1" slider-bounds {
    min: "-5"
    max: "5"
    step: "1"
  } {}
  "y - 2 = m(x - 1)"
] {}..
```

---

### Example 48

#### Prompt
"Add points A (0, 0), B (4, 0), and C (2, 3) to form the vertices of a triangle"

#### Chat Transcript

**User**: Add points A (0, 0), B (4, 0), and C (2, 3) to form the vertices of a triangle

#### Code

```
geometry expressions [
  expression "(0, 0)" label "A" show-label true {}
  expression "(4, 0)" label "B" show-label true {}
  expression "(2, 3)" label "C" show-label true {}
] {}..
```

---

### Example 49

#### Prompt
"write instructions that tell the student to draw a graph of adding the vectors (1,2) and (4,3), use latex for vector notation. create a bare assessment that validates all three vectors"

#### Chat Transcript

**User**: write instructions that tell the student to draw a graph of adding the vectors (1,2) and (4,3), use latex for vector notation. create a bare assessment that validates all three vectors

#### Code

```
instructions "Draw a graph showing the addition of vectors $\\vec{u} = (1,2)$ and $\\vec{v} = (4,3)$. Show both original vectors and their sum $\\vec{u} + \\vec{v}$." geometry expressions [
  assess [
    method "vector"
    expected "\\vector((0,0),(1,2))"
  ] {}
  assess [
    method "vector"
    expected "\\vector((1,2),(5,5))"
  ] {}
  assess [
    method "vector"
    expected "\\vector((0,0),(5,5))"
  ] {}
] {}..
```

---

### Example 50

#### Prompt
"create a line assessment with a line through two draggable points. add a title and instructions"

#### Chat Transcript

**User**: create a line assessment with a line through two draggable points. add a title and instructions

#### Code

```
title "Line Assessment" instructions "Move the points so the line is equivalent to $y=-2x$." geometry expressions [
  expression "A = (1, 2)" label "A" show-label true drag-mode "XY" {}
  expression "B = (4, 3)" label "B" show-label true drag-mode "XY" {}
  expression "\line(A, B)" assess [
    method "line"
    expected "y=-2x"
    {}
  ] {}
] {}..
```

---

### Example 51

#### Prompt
"Draw a ray starting at A and passing through B"

#### Chat Transcript

**User**: Draw a ray starting at A and passing through B

#### Code

```
geometry expressions [
  expression "A = (1, 2)" label "A" show-label true {}
  expression "B = (4, 5)" label "B" show-label true {}
  expression "\\ray(A, B)" {}
] {}..
```

---

### Example 52

#### Prompt
"Define point P as the intersection of line y = 2x + 1 and the circle centered at (2, 3) with radius 2"

#### Chat Transcript

**User**: Define point P as the intersection of line y = 2x + 1 and the circle centered at (2, 3) with radius 2

#### Code

```
geometry expressions [
  "L = \line((0,1),(2,5))"
  "C = \circle((2,3),2)"
  expression "P = \intersection(L, C)" show-label true label "P" color "red" point-size 12 {}
] {}..
```

---

### Example 53

#### Prompt
"Make a vector from the origin whose head is draggable"

#### Chat Transcript

**User**: Make a vector from the origin whose head is draggable

#### Code

```
geometry expressions [
  expression "P = (3, 2)" show-label true drag-mode "XY" {}
  expression "\vector((0,0),P)" color "blue" {}
] {}..
```



