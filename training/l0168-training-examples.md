# Graffiticode Training Examples

*Downloaded on 2025-10-28T19:58:51.455Z*

## Language L0168

### Example 1

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

### Example 2

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

### Example 3

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

### Example 4

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

### Example 5

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

### Example 6

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

### Example 7

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

### Example 8

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

### Example 9

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

### Example 10

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

### Example 11

#### Prompt
"Create a point that snaps to integer coordinates"

#### Chat Transcript

**User**: Create a point that snaps to integer coordinates

#### Code

```
geometry expressions [
  expression "(0, 0)" drag-mode "X" slider-bounds {
    min: "-5"
    max: "5"
    step: "1"
  } {}
] {}..
```

---

### Example 12

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

### Example 13

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

### Example 14

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

### Example 15

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

### Example 16

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

### Example 17

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

### Example 18

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

### Example 19

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

### Example 20

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

### Example 21

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

### Example 22

#### Prompt
"Create a line with adjustable slope m passing through point P"

#### Chat Transcript

**User**: Create a line with adjustable slope m passing through point P

#### Code

```
geometry expressions [
  expression "(1, 2)" drag-mode NONE label "P" show-label true drag-mode "XY" {}
  expression "m=1" {}
  "y - 2 = m(x - 1)"
] {}..
```

---

### Example 23

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

### Example 24

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

### Example 25

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



