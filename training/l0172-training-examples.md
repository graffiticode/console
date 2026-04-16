# Graffiticode Training Examples

*Downloaded on 2026-04-16T01:38:26.277Z*

## Language L0172

### Example 1

#### Prompt
"https://www.figma.com/board/TXtP1Te5lMCc9NU7kUETpa/Untitled?node-id=0-1&p=f&t=31XjOtGWhqytzSRh-11 Create a board with a text label at 50% opacity."

#### Chat Transcript

**User**: https://www.figma.com/board/TXtP1Te5lMCc9NU7kUETpa/Untitled?node-id=0-1&p=f&t=31XjOtGWhqytzSRh-11 Create a board with a text label at 50% opacity.

#### Code

```
board "https://www.figma.com/board/TXtP1Te5lMCc9NU7kUETpa/Untitled?node-id=0-1&p=f&t=31XjOtGWhqytzSRh-11"
  nodes [
    text "Hello"
      opacity 50 {}
  ] {}..
```

---

### Example 2

#### Prompt
"https://www.figma.com/board/zkr0vzuyjRzk4sTbldeCnV/Untitled?node-id=0-1&p=f&t=QjMXWRWYTXePgck1-11 Create a board with a sticky note at x 250 y 400."

#### Chat Transcript

**User**: https://www.figma.com/board/zkr0vzuyjRzk4sTbldeCnV/Untitled?node-id=0-1&p=f&t=QjMXWRWYTXePgck1-11 Create a board with a sticky note at x 250 y 400.

#### Code

```
board "https://www.figma.com/board/zkr0vzuyjRzk4sTbldeCnV/Untitled?node-id=0-1&p=f&t=QjMXWRWYTXePgck1-11"
  nodes [
    sticky "Hello"
      x 250
      y 400 {}
  ] {}..
```

---

### Example 3

#### Prompt
"https://www.figma.com/board/sUQliDGJryQ1AM6fKhjBrX/Untitled?node-id=0-1&p=f&t=uow2ykt1bGuCGrQL-11 Create a board with a square labeled "Box" filled with "#e5ccff"."

#### Chat Transcript

**User**: https://www.figma.com/board/sUQliDGJryQ1AM6fKhjBrX/Untitled?node-id=0-1&p=f&t=uow2ykt1bGuCGrQL-11 Create a board with a square labeled "Box" filled with "#e5ccff".

#### Code

```
board "https://www.figma.com/board/sUQliDGJryQ1AM6fKhjBrX/Untitled?node-id=0-1&p=f&t=uow2ykt1bGuCGrQL-11"
  nodes [
    square "Box"
      fill "#e5ccff" {}
  ] {}..
```

---

### Example 4

#### Prompt
"https://www.figma.com/board/KAdcWc5RFhKkYAE738Mn3i/Untitled?node-id=0-1&p=f&t=PTRoyGj16T872cYd-11 Create a board with a trapezoid labeled "Manual Input"."

#### Chat Transcript

**User**: https://www.figma.com/board/KAdcWc5RFhKkYAE738Mn3i/Untitled?node-id=0-1&p=f&t=PTRoyGj16T872cYd-11 Create a board with a trapezoid labeled "Manual Input".

#### Code

```
board "https://www.figma.com/board/KAdcWc5RFhKkYAE738Mn3i/Untitled?node-id=0-1&p=f&t=PTRoyGj16T872cYd-11"
  nodes [
    trapezoid "Manual Input"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 5

#### Prompt
"https://www.figma.com/board/TnsyrCvRTKHVRIscavkUxT/Untitled?node-id=0-1&p=f&t=EltwPbKs2UGNCVMq-11 Create a board with an eng-database, speech-bubble, and eng-queue illustrating a data pipeline."

#### Chat Transcript

**User**: https://www.figma.com/board/TnsyrCvRTKHVRIscavkUxT/Untitled?node-id=0-1&p=f&t=EltwPbKs2UGNCVMq-11 Create a board with an eng-database, speech-bubble, and eng-queue illustrating a data pipeline.

#### Code

```
board "https://www.figma.com/board/TnsyrCvRTKHVRIscavkUxT/Untitled?node-id=0-1&p=f&t=EltwPbKs2UGNCVMq-11"
  nodes [
    eng-database "Source DB"
      x 0
      y 100 {}
    connector "ingest"
      from "Source DB"
      to "Processing Queue" {}
    eng-queue "Processing Queue"
      x 300
      y 100 {}
    connector "notify"
      from "Processing Queue"
      to "Pipeline Ready" {}
    speech-bubble "Pipeline Ready"
      x 600
      y 100 {}
  ] {}..
```

---

### Example 6

#### Prompt
"https://www.figma.com/board/m4CGpEngfLKBJXngkv6wmX/Untitled?node-id=0-1&p=f&t=vboVlaX2wSjgl3M5-11 Create a board with an eng-file shape labeled "config.json"."

#### Chat Transcript

**User**: https://www.figma.com/board/m4CGpEngfLKBJXngkv6wmX/Untitled?node-id=0-1&p=f&t=vboVlaX2wSjgl3M5-11 Create a board with an eng-file shape labeled "config.json".

#### Code

```
board "https://www.figma.com/board/m4CGpEngfLKBJXngkv6wmX/Untitled?node-id=0-1&p=f&t=vboVlaX2wSjgl3M5-11"
  nodes [
    eng-file "config.json" {}
  ] {}..
```

---

### Example 7

#### Prompt
"https://www.figma.com/board/77pcaXb0DsAnjg1bur3LB3/Untitled?node-id=0-1&p=f&t=ggU2xGrgJH8G7ulK-11 Create a board with a star filled "#ffd700" at opacity 75."

#### Chat Transcript

**User**: https://www.figma.com/board/77pcaXb0DsAnjg1bur3LB3/Untitled?node-id=0-1&p=f&t=ggU2xGrgJH8G7ulK-11 Create a board with a star filled "#ffd700" at opacity 75.

#### Code

```
board "https://www.figma.com/board/77pcaXb0DsAnjg1bur3LB3/Untitled?node-id=0-1&p=f&t=ggU2xGrgJH8G7ulK-11"
  nodes [
    star ""
      fill "#ffd700"
      opacity 75 {}
  ] {}..
```

---

### Example 8

#### Prompt
"https://www.figma.com/board/zre1Yd6CDSNymJSfNQVCkO/Untitled?node-id=0-1&p=f&t=RV6qv0VlmuT0B1nC-11 Create a board with a diamond filled "#ff6b6b" and stroke "#333333"."

#### Chat Transcript

**User**: https://www.figma.com/board/zre1Yd6CDSNymJSfNQVCkO/Untitled?node-id=0-1&p=f&t=RV6qv0VlmuT0B1nC-11 Create a board with a diamond filled "#ff6b6b" and stroke "#333333".

#### Code

```
board "https://www.figma.com/board/zre1Yd6CDSNymJSfNQVCkO/Untitled?node-id=0-1&p=f&t=RV6qv0VlmuT0B1nC-11"
  nodes [
    diamond ""
      fill "#ff6b6b"
      stroke "#333333" {}
  ] {}..
```

---

### Example 9

#### Prompt
"https://www.figma.com/board/4DMfYlcKRuEUjCK1uQIoUN/Untitled?node-id=0-1&p=f&t=4sUXfoGYTLTvQvrQ-11 Create a board with a sticky note labeled "Todo" and another labeled "Done"."

#### Chat Transcript

**User**: https://www.figma.com/board/4DMfYlcKRuEUjCK1uQIoUN/Untitled?node-id=0-1&p=f&t=4sUXfoGYTLTvQvrQ-11 Create a board with a sticky note labeled "Todo" and another labeled "Done".

#### Code

```
board "https://www.figma.com/board/4DMfYlcKRuEUjCK1uQIoUN/Untitled?node-id=0-1&p=f&t=4sUXfoGYTLTvQvrQ-11"
  nodes [
    sticky "Todo"
      x 0
      y 0 {}
    sticky "Done"
      x 250
      y 0 {}
  ] {}..
```

---

### Example 10

#### Prompt
"https://www.figma.com/board/sQOp6gJx7CdUXVbnk0sjxa/Untitled?node-id=0-1&p=f&t=4gCbrX7P9KEVZePX-11 Create a board with a text label that says "Section heading" at x 0 y 0."

#### Chat Transcript

**User**: https://www.figma.com/board/sQOp6gJx7CdUXVbnk0sjxa/Untitled?node-id=0-1&p=f&t=4gCbrX7P9KEVZePX-11 Create a board with a text label that says "Section heading" at x 0 y 0.

#### Code

```
board "https://www.figma.com/board/sQOp6gJx7CdUXVbnk0sjxa/Untitled?node-id=0-1&p=f&t=4gCbrX7P9KEVZePX-11"
  nodes [
    text "Section heading"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 11

#### Prompt
"https://www.figma.com/board/No3YmlfB0ms2qfrGJLGNtW/Untitled?localFileKey=LOCAL_870dac56-0229-4136-899e-2237b1a5e5e9&t=HJs0FadqUJVI3UMK-11 Create a board with a wide section of width 1200 and height 300 named "Timeline"."

#### Chat Transcript

**User**: https://www.figma.com/board/No3YmlfB0ms2qfrGJLGNtW/Untitled?localFileKey=LOCAL_870dac56-0229-4136-899e-2237b1a5e5e9&t=HJs0FadqUJVI3UMK-11 Create a board with a wide section of width 1200 and height 300 named "Timeline".

#### Code

```
board "https://www.figma.com/board/No3YmlfB0ms2qfrGJLGNtW/Untitled?localFileKey=LOCAL_870dac56-0229-4136-899e-2237b1a5e5e9&t=HJs0FadqUJVI3UMK-11"
  nodes [
    section "Timeline"
      width 1200
      height 300
      x 0
      y 0 {}
  ] {}..
```

---

### Example 12

#### Prompt
"Create a board with a single section named "Phase 1" with width 600 and height 400.

board https://www.figma.com/board/1d0hizPL0dYTrtirAly5FF/Untitled?node-id=0-1&p=f&t=0DMH671vWU5YeGeH-0"

#### Chat Transcript

**User**: Create a board with a single section named "Phase 1" with width 600 and height 400.

**User**: board https://www.figma.com/board/1d0hizPL0dYTrtirAly5FF/Untitled?node-id=0-1&p=f&t=0DMH671vWU5YeGeH-0

#### Code

```
board "https://www.figma.com/board/1d0hizPL0dYTrtirAly5FF/Untitled?node-id=0-1&p=f&t=0DMH671vWU5YeGeH-0"
  nodes [
    section "Phase 1"
      width 600
      height 400 {}
  ] {}..
```

---

### Example 13

#### Prompt
"https://www.figma.com/board/k0gVMEmPTFbdllXQXWjyiF/Untitled?node-id=0-1&p=f&t=dhNFqK52quZGYF7M-11 Create a board with a rounded-rectangle of width 200 and height 100."

#### Chat Transcript

**User**: https://www.figma.com/board/k0gVMEmPTFbdllXQXWjyiF/Untitled?node-id=0-1&p=f&t=dhNFqK52quZGYF7M-11 Create a board with a rounded-rectangle of width 200 and height 100.

#### Code

```
board "https://www.figma.com/board/k0gVMEmPTFbdllXQXWjyiF/Untitled?node-id=0-1&p=f&t=dhNFqK52quZGYF7M-11"
  nodes [
    rounded-rectangle ""
      x 0
      y 0
      width 200
      height 100 {}
  ] {}..
```

---

### Example 14

#### Prompt
"https://www.figma.com/board/wm4xu8MRwaZtzQlZUFUegL/Untitled?localFileKey=LOCAL_729cd1d2-48df-4a4b-817a-44c841f98329&t=smNTNgFZQy6awaVS-11 Create a board with a rounded-rectangle labeled "Card"."

#### Chat Transcript

**User**: https://www.figma.com/board/wm4xu8MRwaZtzQlZUFUegL/Untitled?localFileKey=LOCAL_729cd1d2-48df-4a4b-817a-44c841f98329&t=smNTNgFZQy6awaVS-11 Create a board with a rounded-rectangle labeled "Card".

#### Code

```
board "https://www.figma.com/board/wm4xu8MRwaZtzQlZUFUegL/Untitled?localFileKey=LOCAL_729cd1d2-48df-4a4b-817a-44c841f98329&t=smNTNgFZQy6awaVS-11"
  nodes [
    rounded-rectangle "Card"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 15

#### Prompt
"Create an empty board with file key "wi2zOkBW8wUaZS2elLre18"."

#### Chat Transcript

**User**: Create an empty board with file key "wi2zOkBW8wUaZS2elLre18".

#### Code

```
board "wi2zOkBW8wUaZS2elLre18"
  nodes [] {}..
```

---

### Example 16

#### Prompt
"https://www.figma.com/board/4KvHYiNg02jd8UG0IdrCcu/Untitled?node-id=0-1&p=f&t=k5cKDSYMvGxvy221-11 Create a board with three stars in a row representing a rating."

#### Chat Transcript

**User**: https://www.figma.com/board/4KvHYiNg02jd8UG0IdrCcu/Untitled?node-id=0-1&p=f&t=k5cKDSYMvGxvy221-11 Create a board with three stars in a row representing a rating.

#### Code

```
board "https://www.figma.com/board/4KvHYiNg02jd8UG0IdrCcu/Untitled?node-id=0-1&p=f&t=k5cKDSYMvGxvy221-11"
  nodes [
    star "★"
      x 0
      y 0
      fill "#FFD700" {}
    star "★"
      x 200
      y 0
      fill "#FFD700" {}
    star "★"
      x 400
      y 0
      fill "#FFD700" {}
  ] {}..
```

---

### Example 17

#### Prompt
"https://www.figma.com/board/cGW5OaBXYQlFR4mHM9ZDgl/Untitled?node-id=0-1&p=f&t=mUZ3Aw2vnEvhURRZ-11 Create a board with a diamond labeled "Decision?" filled in red."

#### Chat Transcript

**User**: https://www.figma.com/board/cGW5OaBXYQlFR4mHM9ZDgl/Untitled?node-id=0-1&p=f&t=mUZ3Aw2vnEvhURRZ-11 Create a board with a diamond labeled "Decision?" filled in red.

#### Code

```
board "https://www.figma.com/board/cGW5OaBXYQlFR4mHM9ZDgl/Untitled?node-id=0-1&p=f&t=mUZ3Aw2vnEvhURRZ-11"
  nodes [
    diamond "Decision?"
      fill "#ff0000" {}
  ] {}..
```

---

### Example 18

#### Prompt
"https://www.figma.com/board/cvmCv9a7lg6OdKnMlyRCyq/Untitled?node-id=0-1&p=f&localFileKey=LOCAL_d8c59e24-f599-41bc-9ab7-ac2d5341b5cf&t=BA9I1nmGLvUV1ZFj-11 Create a board with a parallelogram-left labeled "Feedback"."

#### Chat Transcript

**User**: https://www.figma.com/board/cvmCv9a7lg6OdKnMlyRCyq/Untitled?node-id=0-1&p=f&localFileKey=LOCAL_d8c59e24-f599-41bc-9ab7-ac2d5341b5cf&t=BA9I1nmGLvUV1ZFj-11 Create a board with a parallelogram-left labeled "Feedback".

#### Code

```
board "https://www.figma.com/board/cvmCv9a7lg6OdKnMlyRCyq/Untitled?node-id=0-1&p=f&localFileKey=LOCAL_d8c59e24-f599-41bc-9ab7-ac2d5341b5cf&t=BA9I1nmGLvUV1ZFj-11"
  nodes [
    parallelogram-left "Feedback"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 19

#### Prompt
"https://www.figma.com/board/Iby21LzcjvKHcVgHkPGLwT/Untitled?node-id=0-1&p=f&t=mgGUyzdpwFf7500Z-11 Create a board with three sticky notes in pastel yellow, pink, and green."

#### Chat Transcript

**User**: https://www.figma.com/board/Iby21LzcjvKHcVgHkPGLwT/Untitled?node-id=0-1&p=f&t=mgGUyzdpwFf7500Z-11 Create a board with three sticky notes in pastel yellow, pink, and green.

#### Code

```
board "https://www.figma.com/board/Iby21LzcjvKHcVgHkPGLwT/Untitled?node-id=0-1&p=f&t=mgGUyzdpwFf7500Z-11"
  nodes [
    sticky "Note 1"
      x 0
      y 0
      fill "#FFFACD" {}
    sticky "Note 2"
      x 250
      y 0
      fill "#FFD1DC" {}
    sticky "Note 3"
      x 500
      y 0
      fill "#B5EAD7" {}
  ] {}..
```

---

### Example 20

#### Prompt
"https://www.figma.com/board/6D6llGUcFRbqI9PC3taPj5/Untitled?node-id=0-1&p=f&t=P7ggc2JzvmcH3ebx-11 Create a board with a triangle-up labeled "Growth"."

#### Chat Transcript

**User**: https://www.figma.com/board/6D6llGUcFRbqI9PC3taPj5/Untitled?node-id=0-1&p=f&t=P7ggc2JzvmcH3ebx-11 Create a board with a triangle-up labeled "Growth".

#### Code

```
board "https://www.figma.com/board/6D6llGUcFRbqI9PC3taPj5/Untitled?node-id=0-1&p=f&t=P7ggc2JzvmcH3ebx-11"
  nodes [
    triangle-up "Growth"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 21

#### Prompt
"https://www.figma.com/board/2LtK0ymSDnc4jyDkUMtvjX/Untitled?node-id=0-1&p=f&t=LXn8rfkUGslpr6GT-11 Create a board with an octagon shape filled with "#ff1493"."

#### Chat Transcript

**User**: https://www.figma.com/board/2LtK0ymSDnc4jyDkUMtvjX/Untitled?node-id=0-1&p=f&t=LXn8rfkUGslpr6GT-11 Create a board with an octagon shape filled with "#ff1493".

#### Code

```
board "https://www.figma.com/board/2LtK0ymSDnc4jyDkUMtvjX/Untitled?node-id=0-1&p=f&t=LXn8rfkUGslpr6GT-11"
  nodes [
    octagon ""
      fill "#ff1493" {}
  ] {}..
```

---

### Example 22

#### Prompt
"https://www.figma.com/board/ux2Fhl3cZaO3Euz2U4L9Ow/Untitled?node-id=0-1&p=f&t=0V4XL46Tr09QKypi-11 Create a board with a rounded-rectangle with white fill and gray stroke."

#### Chat Transcript

**User**: https://www.figma.com/board/ux2Fhl3cZaO3Euz2U4L9Ow/Untitled?node-id=0-1&p=f&t=0V4XL46Tr09QKypi-11 Create a board with a rounded-rectangle with white fill and gray stroke.

#### Code

```
board "https://www.figma.com/board/ux2Fhl3cZaO3Euz2U4L9Ow/Untitled?node-id=0-1&p=f&t=0V4XL46Tr09QKypi-11"
  nodes [
    rounded-rectangle ""
      fill "#ffffff"
      stroke "#808080" {}
  ] {}..
```

---

### Example 23

#### Prompt
"https://www.figma.com/board/VRBF0c9MQElT8wGStvlYOn/Untitled?node-id=0-1&p=f&t=CknFHcLnJzlz1jAv-11 Create a board with one sticky labeled "Hub" connected to all other nodes using a wildcard to "*"."

#### Chat Transcript

**User**: https://www.figma.com/board/VRBF0c9MQElT8wGStvlYOn/Untitled?node-id=0-1&p=f&t=CknFHcLnJzlz1jAv-11 Create a board with one sticky labeled "Hub" connected to all other nodes using a wildcard to "*".

#### Code

```
board "https://www.figma.com/board/gb174iWdrTWVrzP2AcbfDH/Untitled?node-id=0-1&p=f&t=nr5X21lmnmFJUCl9-11"
  nodes [
    sticky "Hub"
      x 300
      y 200 {}
    sticky "Child 1"
      x 0
      y 400 {}
    sticky "Child 2"
      x 0
      y 0 {}
    sticky "Child 3"
      x 600
      y 400 {}
    connector "to-children"
      from "Hub"
      to [
        ""
      ] {}
  ] {}..
```

---

### Example 24

#### Prompt
"https://www.figma.com/board/k8vRwmdIibzqYWbbhZr6CH/Untitled?node-id=0-1&p=f&t=Mtos4sUldJ8QAt2J-11 Create a board with an ellipse filled "#ffcc00" with stroke "#333333" and stroke-width 2."

#### Chat Transcript

**User**: https://www.figma.com/board/k8vRwmdIibzqYWbbhZr6CH/Untitled?node-id=0-1&p=f&t=Mtos4sUldJ8QAt2J-11 Create a board with an ellipse filled "#ffcc00" with stroke "#333333" and stroke-width 2.

#### Code

```
board "https://www.figma.com/board/k8vRwmdIibzqYWbbhZr6CH/Untitled?node-id=0-1&p=f&t=Mtos4sUldJ8QAt2J-11"
  nodes [
    ellipse ""
      fill "#ffcc00"
      stroke "#333333"
      stroke-width 2 {}
  ] {}..
```

---

### Example 25

#### Prompt
"https://www.figma.com/board/hvrwdKrk0722AUEnsHWbIy/Untitled?node-id=0-1&p=f&t=bpl21GQdAz2ArS4l-11 Create a board with a speech-bubble filled "#10b981" and a diamond filled "#ff6b6b"."

#### Chat Transcript

**User**: https://www.figma.com/board/hvrwdKrk0722AUEnsHWbIy/Untitled?node-id=0-1&p=f&t=bpl21GQdAz2ArS4l-11 Create a board with a speech-bubble filled "#10b981" and a diamond filled "#ff6b6b".

#### Code

```
board "https://www.figma.com/board/hvrwdKrk0722AUEnsHWbIy/Untitled?node-id=0-1&p=f&t=bpl21GQdAz2ArS4l-11"
  nodes [
    speech-bubble ""
      fill "#10b981" {}
    diamond ""
      x 200
      fill "#ff6b6b" {}
  ] {}..
```

---

### Example 26

#### Prompt
"https://www.figma.com/board/LfP1Quw4023XrHnQyhbVPX/Untitled?node-id=0-1&p=f&t=4EmjBLsdUEsJAgU4-0
Create a board with a sticky note at position x 0 y 0 that says "Kickoff"."

#### Chat Transcript

**User**: https://www.figma.com/board/LfP1Quw4023XrHnQyhbVPX/Untitled?node-id=0-1&p=f&t=4EmjBLsdUEsJAgU4-0
Create a board with a sticky note at position x 0 y 0 that says "Kickoff".

#### Code

```
board "https://www.figma.com/board/LfP1Quw4023XrHnQyhbVPX/Untitled?node-id=0-1&p=f&t=4EmjBLsdUEsJAgU4-0"
  nodes [
    sticky "Kickoff"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 27

#### Prompt
"https://www.figma.com/board/CnQ8FQOb75sMpjHp1xeXPM/Untitled?node-id=0-1&p=f&t=QRhOj2qLykphpMl7-11 Create a board with an eng-database shape labeled "Users DB"."

#### Chat Transcript

**User**: https://www.figma.com/board/CnQ8FQOb75sMpjHp1xeXPM/Untitled?node-id=0-1&p=f&t=QRhOj2qLykphpMl7-11 Create a board with an eng-database shape labeled "Users DB".

#### Code

```
board "https://www.figma.com/board/CnQ8FQOb75sMpjHp1xeXPM/Untitled?node-id=0-1&p=f&t=QRhOj2qLykphpMl7-11"
  nodes [
    eng-database "Users DB"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 28

#### Prompt
"https://www.figma.com/board/xeNNlBF9Kcx9xe0a625GmE/Untitled?node-id=0-1&p=f&t=7tzkXxC63S0rH3mv-11 Create a board with an unlabeled connector between a start and end ellipse."

#### Chat Transcript

**User**: https://www.figma.com/board/xeNNlBF9Kcx9xe0a625GmE/Untitled?node-id=0-1&p=f&t=7tzkXxC63S0rH3mv-11 Create a board with an unlabeled connector between a start and end ellipse.

#### Code

```
board "https://www.figma.com/board/xeNNlBF9Kcx9xe0a625GmE/Untitled?node-id=0-1&p=f&t=7tzkXxC63S0rH3mv-11"
  nodes [
    ellipse "Start"
      x 0
      y 0 {}
    ellipse "End"
      x 300
      y 0 {}
    connector ""
      from "Start"
      to "End" {}
  ] {}..
```

---

### Example 29

#### Prompt
"https://www.figma.com/board/V24wvXvsi04MgQYYlBQYVv/Untitled?node-id=0-1&p=f&t=DkV6OU0XkP68GQIZ-0

Create a board with three sticky notes in a horizontal row."

#### Chat Transcript

**User**: https://www.figma.com/board/V24wvXvsi04MgQYYlBQYVv/Untitled?node-id=0-1&p=f&t=DkV6OU0XkP68GQIZ-0

**User**: Create a board with three sticky notes in a horizontal row.

#### Code

```
board "https://www.figma.com/board/V24wvXvsi04MgQYYlBQYVv/Untitled?node-id=0-1&p=f&t=DkV6OU0XkP68GQIZ-0"
  nodes [
    sticky "Hello"
      x 0
      y 0 {}
    sticky "World"
      x 250
      y 0 {}
    sticky "There"
      x 500
      y 0 {}
  ] {}..
```

---

### Example 30

#### Prompt
"https://www.figma.com/board/wu6HlADzVZEgC1U7O9Wjml/Untitled?node-id=0-1&p=f&t=Bsh8QyFNjXaJB7aE-11 Create a board with an eng-folder shape labeled "assets"."

#### Chat Transcript

**User**: https://www.figma.com/board/wu6HlADzVZEgC1U7O9Wjml/Untitled?node-id=0-1&p=f&t=Bsh8QyFNjXaJB7aE-11 Create a board with an eng-folder shape labeled "assets".

#### Code

```
board "https://www.figma.com/board/wu6HlADzVZEgC1U7O9Wjml/Untitled?node-id=0-1&p=f&t=Bsh8QyFNjXaJB7aE-11"
  nodes [
    eng-folder "assets"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 31

#### Prompt
"Create a board with a predefined-process shape labeled "Compute" at x 400 y 0."

#### Chat Transcript

**User**: Create a board with a predefined-process shape labeled "Compute" at x 400 y 0.

#### Code

```
board "https://www.figma.com/board/jk4eYuOHl8oJnDqygNY9xt/Untitled?node-id=0-1&p=f&t=Ygx0qQnBQsH0sCmw-11"
  nodes [
    predefined-process "Compute"
      x 400
      y 0 {}
  ] {}..
```

---

### Example 32

#### Prompt
"https://www.figma.com/board/1vVfK3Vs4ClEFFieU29CZr/Untitled?node-id=0-1&p=f&t=Oqg0FERmK28QIgB4-11 Create a board with five sticky notes stacked vertically at x 0."

#### Chat Transcript

**User**: https://www.figma.com/board/1vVfK3Vs4ClEFFieU29CZr/Untitled?node-id=0-1&p=f&t=Oqg0FERmK28QIgB4-11 Create a board with five sticky notes stacked vertically at x 0.

#### Code

```
board "https://www.figma.com/board/1vVfK3Vs4ClEFFieU29CZr/Untitled?node-id=0-1&p=f&t=Oqg0FERmK28QIgB4-11"
  nodes [
    sticky "Note 1"
      x 0
      y 0 {}
    sticky "Note 2"
      x 0
      y 250 {}
    sticky "Note 3"
      x 0
      y 500 {}
    sticky "Note 4"
      x 0
      y 750 {}
    sticky "Note 5"
      x 0
      y 1000 {}
  ] {}..
```

---

### Example 33

#### Prompt
"Create a board with one ellipse and no other nodes.

https://www.figma.com/board/Ud8CqmI36nt9MY90lvKyoy/Untitled?node-id=0-1&p=f&t=2rsgheoTjHOvt90a-0"

#### Chat Transcript

**User**: Create a board with one ellipse and no other nodes.

**User**: https://www.figma.com/board/Ud8CqmI36nt9MY90lvKyoy/Untitled?node-id=0-1&p=f&t=2rsgheoTjHOvt90a-0

#### Code

```
board "https://www.figma.com/board/Ud8CqmI36nt9MY90lvKyoy/Untitled?node-id=0-1&p=f&t=2rsgheoTjHOvt90a-0"
  nodes [
    ellipse "Ellipse" {}
  ] {}..
```

---

### Example 34

#### Prompt
"https://www.figma.com/board/O2DnkCbfehugCTz9RNpbvs/Untitled?node-id=0-1&p=f&t=VpvXY5BvlaXvXAZu-11 Create a board with a parallelogram-right labeled "User Input" used for I/O."

#### Chat Transcript

**User**: https://www.figma.com/board/O2DnkCbfehugCTz9RNpbvs/Untitled?node-id=0-1&p=f&t=VpvXY5BvlaXvXAZu-11 Create a board with a parallelogram-right labeled "User Input" used for I/O.

#### Code

```
board "https://www.figma.com/board/O2DnkCbfehugCTz9RNpbvs/Untitled?node-id=0-1&p=f&t=VpvXY5BvlaXvXAZu-11"
  nodes [
    parallelogram-right "User Input"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 35

#### Prompt
"https://www.figma.com/board/K9ClPrLskmNmFikYJeNc2E/Untitled?node-id=0-1&p=f&t=aJ65pyeTv76RktQ2-11 Create a board with a rounded-rectangle labeled "Start" used as a terminator."

#### Chat Transcript

**User**: https://www.figma.com/board/K9ClPrLskmNmFikYJeNc2E/Untitled?node-id=0-1&p=f&t=aJ65pyeTv76RktQ2-11 Create a board with a rounded-rectangle labeled "Start" used as a terminator.

#### Code

```
board "https://www.figma.com/board/K9ClPrLskmNmFikYJeNc2E/Untitled?node-id=0-1&p=f&t=aJ65pyeTv76RktQ2-11"
  nodes [
    rounded-rectangle "Start"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 36

#### Prompt
"Create a board with a single text label that says "Welcome".

link to https://www.figma.com/board/ZIBFyW0r6JH0Hv4w3AKoZU/Untitled?node-id=0-1&p=f&t=1r6fWrEo0zQZTrsU-0"

#### Chat Transcript

**User**: Create a board with a single text label that says "Welcome".

**User**: link to https://www.figma.com/board/ZIBFyW0r6JH0Hv4w3AKoZU/Untitled?node-id=0-1&p=f&t=1r6fWrEo0zQZTrsU-0

#### Code

```
board "https://www.figma.com/board/ZIBFyW0r6JH0Hv4w3AKoZU/Untitled?node-id=0-1&p=f&t=1r6fWrEo0zQZTrsU-0"
  nodes [
    text "Welcome" {}
  ] {}..
```

---

### Example 37

#### Prompt
"https://www.figma.com/board/MIF6cksgILXvWpvX2VX4MB/Untitled?node-id=0-1&p=f&t=JMIxhEAXowpZvzjP-11 Create a board with a gold star labeled "Success"."

#### Chat Transcript

**User**: https://www.figma.com/board/MIF6cksgILXvWpvX2VX4MB/Untitled?node-id=0-1&p=f&t=JMIxhEAXowpZvzjP-11 Create a board with a gold star labeled "Success".

#### Code

```
board "https://www.figma.com/board/MIF6cksgILXvWpvX2VX4MB/Untitled?node-id=0-1&p=f&t=JMIxhEAXowpZvzjP-11"
  nodes [
    star "Success"
      fill "#FFD700" {}
  ] {}..
```

---

### Example 38

#### Prompt
"https://www.figma.com/board/Ad7XThFucIm6atNjsiUmUv/Untitled?node-id=0-1&p=f&t=JaDVCDi5Bs2xRHAu-11 Create a board with a sticky note at 70% opacity."

#### Chat Transcript

**User**: https://www.figma.com/board/Ad7XThFucIm6atNjsiUmUv/Untitled?node-id=0-1&p=f&t=JaDVCDi5Bs2xRHAu-11 Create a board with a sticky note at 70% opacity.

#### Code

```
board "https://www.figma.com/board/Ad7XThFucIm6atNjsiUmUv/Untitled?node-id=0-1&p=f&t=JaDVCDi5Bs2xRHAu-11"
  nodes [
    sticky "Hello"
      opacity 70 {}
  ] {}..
```

---

### Example 39

#### Prompt
"https://www.figma.com/board/gb174iWdrTWVrzP2AcbfDH/Untitled?node-id=0-1&p=f&t=nr5X21lmnmFJUCl9-11 Create a board with a hub sticky connected to three child stickies using a list to-target."

#### Chat Transcript

**User**: https://www.figma.com/board/gb174iWdrTWVrzP2AcbfDH/Untitled?node-id=0-1&p=f&t=nr5X21lmnmFJUCl9-11 Create a board with a hub sticky connected to three child stickies using a list to-target.

#### Code

```
board "https://www.figma.com/board/gb174iWdrTWVrzP2AcbfDH/Untitled?node-id=0-1&p=f&t=nr5X21lmnmFJUCl9-11"
  nodes [
    sticky "Hub"
      x 300
      y 200 {}
    sticky "Child 1"
      x 0
      y 400 {}
    sticky "Child 2"
      x 0
      y 0 {}
    sticky "Child 3"
      x 600
      y 400 {}
    connector "to-children"
      from "Hub"
      to [
        "Child 1"
        "Child 2"
        "Child 3"
      ] {}
  ] {}..
```

---

### Example 40

#### Prompt
"https://www.figma.com/board/uBWYgI0DgEld7pSQNUYa8L/Untitled?node-id=0-1&p=f&t=05WJY63kIIhzmagD-11 Create a board with a centered text label that says "Roadmap 2026"."

#### Chat Transcript

**User**: https://www.figma.com/board/uBWYgI0DgEld7pSQNUYa8L/Untitled?node-id=0-1&p=f&t=05WJY63kIIhzmagD-11 Create a board with a centered text label that says "Roadmap 2026".

#### Code

```
board "https://www.figma.com/board/uBWYgI0DgEld7pSQNUYa8L/Untitled?node-id=0-1&p=f&t=05WJY63kIIhzmagD-11"
  nodes [
    text "Roadmap 2026"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 41

#### Prompt
"https://www.figma.com/board/CSMdFCUdmB2Leu3zHpDhBn/Untitled?node-id=0-1&p=f&t=Mhvr2LAAMnBhkd7K-11 Create a board with a faded sticky note at opacity 40 next to a solid one."

#### Chat Transcript

**User**: https://www.figma.com/board/CSMdFCUdmB2Leu3zHpDhBn/Untitled?node-id=0-1&p=f&t=Mhvr2LAAMnBhkd7K-11 Create a board with a faded sticky note at opacity 40 next to a solid one.

#### Code

```
board "https://www.figma.com/board/CSMdFCUdmB2Leu3zHpDhBn/Untitled?node-id=0-1&p=f&t=Mhvr2LAAMnBhkd7K-11"
  nodes [
    sticky "Solid"
      x 0
      y 0 {}
    sticky "Faded"
      x 250
      y 0
      opacity 40 {}
  ] {}..
```

---

### Example 42

#### Prompt
"https://www.figma.com/board/K5yMzIqBbTyAXG9InbzoYs/Untitled?node-id=0-1&p=f&t=HJ3j9orP6Dw1wUdp-11 Create a board with a square and an ellipse side by side."

#### Chat Transcript

**User**: https://www.figma.com/board/K5yMzIqBbTyAXG9InbzoYs/Untitled?node-id=0-1&p=f&t=HJ3j9orP6Dw1wUdp-11 Create a board with a square and an ellipse side by side.

#### Code

```
board "https://www.figma.com/board/K5yMzIqBbTyAXG9InbzoYs/Untitled?node-id=0-1&p=f&t=HJ3j9orP6Dw1wUdp-11"
  nodes [
    square "Square"
      x 0
      y 0 {}
    ellipse "Ellipse"
      x 250
      y 0 {}
  ] {}..
```

---

### Example 43

#### Prompt
"https://www.figma.com/board/1WfAONgN7azfnaZKKI8RBJ/Untitled?node-id=0-1&p=f&t=15LljAAMX0bIAnwf-11 Create a board with an internal-storage shape labeled "Cache"."

#### Chat Transcript

**User**: https://www.figma.com/board/1WfAONgN7azfnaZKKI8RBJ/Untitled?node-id=0-1&p=f&t=15LljAAMX0bIAnwf-11 Create a board with an internal-storage shape labeled "Cache".

#### Code

```
board "https://www.figma.com/board/1WfAONgN7azfnaZKKI8RBJ/Untitled?node-id=0-1&p=f&t=15LljAAMX0bIAnwf-11"
  nodes [
    internal-storage "Cache"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 44

#### Prompt
"https://www.figma.com/board/LPL0MUtgETc8XLb5db5Tm0/Untitled?node-id=0-1&p=f&t=9GO6eyK14FjaMQwa-11 Create a board with a square with a red fill and black stroke."

#### Chat Transcript

**User**: https://www.figma.com/board/LPL0MUtgETc8XLb5db5Tm0/Untitled?node-id=0-1&p=f&t=9GO6eyK14FjaMQwa-11 Create a board with a square with a red fill and black stroke.

#### Code

```
board "https://www.figma.com/board/LPL0MUtgETc8XLb5db5Tm0/Untitled?node-id=0-1&p=f&t=9GO6eyK14FjaMQwa-11"
  nodes [
    square ""
      fill "#ff0000"
      stroke "#000000" {}
  ] {}..
```

---

### Example 45

#### Prompt
"https://www.figma.com/board/fDzElR1uJgHMd3X5RrIOPz/Untitled?node-id=0-1&p=f&t=aIyvaXOEuXKgXQUX-11 Create a board with a predefined-process shape labeled "Subroutine"."

#### Chat Transcript

**User**: https://www.figma.com/board/fDzElR1uJgHMd3X5RrIOPz/Untitled?node-id=0-1&p=f&t=aIyvaXOEuXKgXQUX-11 Create a board with a predefined-process shape labeled "Subroutine".

#### Code

```
board "https://www.figma.com/board/fDzElR1uJgHMd3X5RrIOPz/Untitled?node-id=0-1&p=f&t=aIyvaXOEuXKgXQUX-11"
  nodes [
    predefined-process "Subroutine"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 46

#### Prompt
"https://www.figma.com/board/B8W1bXaczhF9dg5wDJAIXq/Untitled?node-id=0-1&p=f&t=2NxIAU72DDcsOf1U-11 Create a board with an ellipse labeled "Start" at x 0 y 0."

#### Chat Transcript

**User**: https://www.figma.com/board/B8W1bXaczhF9dg5wDJAIXq/Untitled?node-id=0-1&p=f&t=2NxIAU72DDcsOf1U-11 Create a board with an ellipse labeled "Start" at x 0 y 0.

#### Code

```
board "https://www.figma.com/board/B8W1bXaczhF9dg5wDJAIXq/Untitled?node-id=0-1&p=f&t=2NxIAU72DDcsOf1U-11"
  nodes [
    ellipse "Start"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 47

#### Prompt
"https://www.figma.com/board/RbwvDTt1xrLooIZZuMoGDh/Untitled?node-id=0-1&p=f&t=xh6mGmRyXbBfdpbh-11 Create a board with three text labels: "Title", "Subtitle", and "Body"."

#### Chat Transcript

**User**: https://www.figma.com/board/RbwvDTt1xrLooIZZuMoGDh/Untitled?node-id=0-1&p=f&t=xh6mGmRyXbBfdpbh-11 Create a board with three text labels: "Title", "Subtitle", and "Body".

#### Code

```
board "https://www.figma.com/board/RbwvDTt1xrLooIZZuMoGDh/Untitled?node-id=0-1&p=f&t=xh6mGmRyXbBfdpbh-11"
  nodes [
    text "Title"
      x 0
      y 0 {}
    text "Subtitle"
      x 0
      y 100 {}
    text "Body"
      x 0
      y 200 {}
  ] {}..
```

---

### Example 48

#### Prompt
"https://www.figma.com/board/2Enu5D8sXeKyWjxop3cQif/Untitled?node-id=0-1&p=f&t=HL6ypqyOkmXS6x2f-11 Create a board with four stickies laid out in a 100-unit grid starting at origin."

#### Chat Transcript

**User**: https://www.figma.com/board/2Enu5D8sXeKyWjxop3cQif/Untitled?node-id=0-1&p=f&t=HL6ypqyOkmXS6x2f-11 Create a board with four stickies laid out in a 100-unit grid starting at origin.

#### Code

```
board "https://www.figma.com/board/2Enu5D8sXeKyWjxop3cQif/Untitled?node-id=0-1&p=f&t=HL6ypqyOkmXS6x2f-11"
  nodes [
    sticky "Note 1"
      x 0
      y 0 {}
    sticky "Note 2"
      x 100
      y 0 {}
    sticky "Note 3"
      x 0
      y 100 {}
    sticky "Note 4"
      x 100
      y 100 {}
  ] {}..
```

---

### Example 49

#### Prompt
"Create a board with a text label in color "#333333".

https://www.figma.com/board/6r3E9ZLYgpi2xokE4va6JC/Untitled?node-id=0-1&p=f&t=OpfWRLz1U0A0ZzAP-11"

#### Chat Transcript

**User**: Create a board with a text label in color "#333333".

**User**: https://www.figma.com/board/6r3E9ZLYgpi2xokE4va6JC/Untitled?node-id=0-1&p=f&t=OpfWRLz1U0A0ZzAP-11

#### Code

```
board "https://www.figma.com/board/6r3E9ZLYgpi2xokE4va6JC/Untitled?node-id=0-1&p=f&t=OpfWRLz1U0A0ZzAP-11"
  nodes [
    text "Label"
      color "#333333" {}
  ] {}..
```

---

### Example 50

#### Prompt
"https://www.figma.com/board/muxsKmGTXXfzmzEuRkQjCF/Untitled?node-id=0-1&p=f&t=PkDdV5xLvAPZuKqi-11 Create a board where each shape is offset by 150 units horizontally from the previous."

#### Chat Transcript

**User**: https://www.figma.com/board/muxsKmGTXXfzmzEuRkQjCF/Untitled?node-id=0-1&p=f&t=PkDdV5xLvAPZuKqi-11 Create a board where each shape is offset by 150 units horizontally from the previous.

#### Code

```
board "https://www.figma.com/board/muxsKmGTXXfzmzEuRkQjCF/Untitled?node-id=0-1&p=f&t=PkDdV5xLvAPZuKqi-11"
  nodes [
    sticky "Hello"
      x 0
      y 0 {}
    sticky "World"
      x 150
      y 0 {}
    sticky "Foo"
      x 300
      y 0 {}
    sticky "Bar"
      x 450
      y 0 {}
  ] {}..
```

---

### Example 51

#### Prompt
"https://www.figma.com/board/JEQ9mBjCzQNPj8BVK4t6Az/Untitled?node-id=0-1&p=f&t=HgarO8jkK7JU0Thx-11 Create a board where three input stickies all connect to a single predefined-process using from as a list."

#### Chat Transcript

**User**: https://www.figma.com/board/JEQ9mBjCzQNPj8BVK4t6Az/Untitled?node-id=0-1&p=f&t=HgarO8jkK7JU0Thx-11 Create a board where three input stickies all connect to a single predefined-process using from as a list.

#### Code

```
board "https://www.figma.com/board/JEQ9mBjCzQNPj8BVK4t6Az/Untitled?node-id=0-1&p=f&t=HgarO8jkK7JU0Thx-11"
  nodes [
    sticky "Input A"
      x 0
      y 0 {}
    sticky "Input B"
      x 0
      y 300 {}
    sticky "Input C"
      x 0
      y 600 {}
    predefined-process "Process"
      x 500
      y 300 {}
    connector "to process"
      from [
        "Input A"
        "Input B"
        "Input C"
      ] to "Process" {}
  ] {}..
```

---

### Example 52

#### Prompt
"https://www.figma.com/board/fQ9Ym8rjf9cd9hD8OrJjYf/Untitled?node-id=0-1&p=f&t=wN4GdJoe58cxP9SF-11 Create a flowchart with rounded-rectangle, predefined-process, diamond, and rounded-rectangle connected in sequence by labeled connectors."

#### Chat Transcript

**User**: https://www.figma.com/board/fQ9Ym8rjf9cd9hD8OrJjYf/Untitled?node-id=0-1&p=f&t=wN4GdJoe58cxP9SF-11 Create a flowchart with rounded-rectangle, predefined-process, diamond, and rounded-rectangle connected in sequence by labeled connectors.

#### Code

```
board "https://www.figma.com/board/fQ9Ym8rjf9cd9hD8OrJjYf/Untitled?node-id=0-1&p=f&t=wN4GdJoe58cxP9SF-11"
  nodes [
    rounded-rectangle "Start"
      x 0
      y 0
      width 160
      height 80 {}
    predefined-process "Process"
      x 0
      y 200
      width 160
      height 80 {}
    diamond "Decision?"
      x 0
      y 400
      width 160
      height 80 {}
    rounded-rectangle "End"
      x 0
      y 600
      width 160
      height 80 {}
    connector "step1"
      label "begin"
      from "Start"
      to "Process" {}
    connector "step2"
      label "execute"
      from "Process"
      to "Decision?" {}
    connector "step3"
      label "yes"
      from "Decision?"
      to "End" {}
  ] {}..
```

---

### Example 53

#### Prompt
"https://www.figma.com/board/F1JKJ6ZTew4bCTrh33ecK1/Untitled?localFileKey=LOCAL_a72483da-02c0-44de-92b6-7e8b3a3f485e&t=r8qKTD3bPhgTeNyh-11 Create a board with a connector with stroke-width 3."

#### Chat Transcript

**User**: https://www.figma.com/board/F1JKJ6ZTew4bCTrh33ecK1/Untitled?localFileKey=LOCAL_a72483da-02c0-44de-92b6-7e8b3a3f485e&t=r8qKTD3bPhgTeNyh-11 Create a board with a connector with stroke-width 3.

#### Code

```
board "https://www.figma.com/board/F1JKJ6ZTew4bCTrh33ecK1/Untitled?localFileKey=LOCAL_a72483da-02c0-44de-92b6-7e8b3a3f485e&t=r8qKTD3bPhgTeNyh-11"
  nodes [
    sticky "Start"
      x 0
      y 0 {}
    sticky "End"
      x 350
      y 0 {}
    connector "link"
      from "Start"
      to "End"
      stroke-width 3 {}
  ] {}..
```

---

### Example 54

#### Prompt
"Create a board with a sticky note filled with the color "#ffcc00". https://www.figma.com/board/P4BSh26vlfJy4UxMPnemx1/Untitled?node-id=0-1&p=f&t=lgYZIBzjTizNmJSc-11"

#### Chat Transcript

**User**: Create a board with a sticky note filled with the color "#ffcc00". https://www.figma.com/board/P4BSh26vlfJy4UxMPnemx1/Untitled?node-id=0-1&p=f&t=lgYZIBzjTizNmJSc-11

#### Code

```
board "https://www.figma.com/board/P4BSh26vlfJy4UxMPnemx1/Untitled?node-id=0-1&p=f&t=lgYZIBzjTizNmJSc-11"
  nodes [
    sticky "Hello"
      fill "#ffcc00" {}
  ] {}..
```

---

### Example 55

#### Prompt
"https://www.figma.com/board/AGlRuCmG1ySVFWx3T1A4ds/Untitled?node-id=0-1&p=f&t=AqYPblYsKLfczlEt-11 Create a board with a parallelogram-right labeled "Data"."

#### Chat Transcript

**User**: https://www.figma.com/board/AGlRuCmG1ySVFWx3T1A4ds/Untitled?node-id=0-1&p=f&t=AqYPblYsKLfczlEt-11 Create a board with a parallelogram-right labeled "Data".

#### Code

```
board "https://www.figma.com/board/AGlRuCmG1ySVFWx3T1A4ds/Untitled?node-id=0-1&p=f&t=AqYPblYsKLfczlEt-11"
  nodes [
    parallelogram-right "Data"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 56

#### Prompt
"https://www.figma.com/board/stmIXhaC2APxKuTNuvQIOf/Untitled?node-id=0-1&p=f&t=Y4T5j7J9O5YiWRwv-11 Create a board with a labeled "yes" connector and a labeled "no" connector leaving a decision.

be aware of space between nodes"

#### Chat Transcript

**User**: https://www.figma.com/board/stmIXhaC2APxKuTNuvQIOf/Untitled?node-id=0-1&p=f&t=Y4T5j7J9O5YiWRwv-11 Create a board with a labeled "yes" connector and a labeled "no" connector leaving a decision.

**User**: be aware of space between nodes

#### Code

```
board "https://www.figma.com/board/stmIXhaC2APxKuTNuvQIOf/Untitled?node-id=0-1&p=f&t=Y4T5j7J9O5YiWRwv-11"
  nodes [
    diamond "Decision?"
      x 200
      y 0 {}
    sticky "Yes Path"
      x 600
      y 50 {}
    sticky "No Path"
      x 250
      y 400 {}
    connector "yes"
      from "Decision?"
      to "Yes Path" {}
    connector "no"
      from "Decision?"
      to "No Path" {}
  ] {}..
```

---

### Example 57

#### Prompt
"https://www.figma.com/board/kMi4BWwFVXzKvijvYeEArx/Untitled?node-id=0-1&p=f&t=Kx5znJk2KRPRiG1V-11 Create a board with a document-single shape labeled "Spec"."

#### Chat Transcript

**User**: https://www.figma.com/board/kMi4BWwFVXzKvijvYeEArx/Untitled?node-id=0-1&p=f&t=Kx5znJk2KRPRiG1V-11 Create a board with a document-single shape labeled "Spec".

#### Code

```
board "https://www.figma.com/board/kMi4BWwFVXzKvijvYeEArx/Untitled?node-id=0-1&p=f&t=Kx5znJk2KRPRiG1V-11"
  nodes [
    document-single "Spec"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 58

#### Prompt
"Create a board using the full Figma URL "https://www.figma.com/board/z3NR92REIZpbCe5ZM26vBH/Untitled?t=1lOZrGdkATJfiMsQ-0&localFileKey=LOCAL_16cf37cd-e682-4f4d-921b-8f495f981ba3"."

#### Chat Transcript

**User**: Create a board using the full Figma URL "https://www.figma.com/board/z3NR92REIZpbCe5ZM26vBH/Untitled?t=1lOZrGdkATJfiMsQ-0&localFileKey=LOCAL_16cf37cd-e682-4f4d-921b-8f495f981ba3".

#### Code

```
board "https://www.figma.com/board/z3NR92REIZpbCe5ZM26vBH/Untitled?t=1lOZrGdkATJfiMsQ-0&localFileKey=LOCAL_16cf37cd-e682-4f4d-921b-8f495f981ba3"
  nodes [
    sticky "Hello" {}
  ] {}..
```

---

### Example 59

#### Prompt
"https://www.figma.com/board/YiIY6rmKQ8nRRFNKcTqPZ4/Untitled?node-id=0-1&p=f&t=yiv5M5LffAJa8P7K-11 Create a board with a predefined-process shape at 80% opacity."

#### Chat Transcript

**User**: https://www.figma.com/board/YiIY6rmKQ8nRRFNKcTqPZ4/Untitled?node-id=0-1&p=f&t=yiv5M5LffAJa8P7K-11 Create a board with a predefined-process shape at 80% opacity.

#### Code

```
board "https://www.figma.com/board/YiIY6rmKQ8nRRFNKcTqPZ4/Untitled?node-id=0-1&p=f&t=yiv5M5LffAJa8P7K-11"
  nodes [
    predefined-process ""
      opacity 80 {}
  ] {}..
```

---

### Example 60

#### Prompt
"https://www.figma.com/board/D75GIgaJtvpFwAlr8ROQuE/Untitled?localFileKey=LOCAL_e9b16e6a-7497-4f78-bb36-429514d790b8&t=ysFJExsqdWghc7bn-11 Create a board with two text labels used as section headings above sticky notes."

#### Chat Transcript

**User**: https://www.figma.com/board/D75GIgaJtvpFwAlr8ROQuE/Untitled?localFileKey=LOCAL_e9b16e6a-7497-4f78-bb36-429514d790b8&t=ysFJExsqdWghc7bn-11 Create a board with two text labels used as section headings above sticky notes.

#### Code

```
board "https://www.figma.com/board/D75GIgaJtvpFwAlr8ROQuE/Untitled?localFileKey=LOCAL_e9b16e6a-7497-4f78-bb36-429514d790b8&t=ysFJExsqdWghc7bn-11"
  nodes [
    text "Section 1"
      x 0
      y 0 {}
    sticky "Note 1"
      x 0
      y 60 {}
    sticky "Note 2"
      x 250
      y 60 {}
    text "Section 2"
      x 0
      y 320 {}
    sticky "Note 3"
      x 0
      y 380 {}
    sticky "Note 4"
      x 250
      y 380 {}
  ] {}..
```

---

### Example 61

#### Prompt
"https://www.figma.com/board/GHjsLmFo1L7DhMzqpYIE4I/Untitled?node-id=0-1&p=f&t=9HekGkuAuJufzcq4-11 Create a board with stamps "like", "love", and "celebrate" in a row."

#### Chat Transcript

**User**: https://www.figma.com/board/GHjsLmFo1L7DhMzqpYIE4I/Untitled?node-id=0-1&p=f&t=9HekGkuAuJufzcq4-11 Create a board with stamps "like", "love", and "celebrate" in a row.

#### Code

```
board "https://www.figma.com/board/GHjsLmFo1L7DhMzqpYIE4I/Untitled?node-id=0-1&p=f&t=9HekGkuAuJufzcq4-11"
  nodes [
    stamp "like"
      x 0
      y 0 {}
    stamp "love"
      x 50
      y 0 {}
    stamp "celebrate"
      x 100
      y 0 {}
  ] {}..
```

---

### Example 62

#### Prompt
"https://www.figma.com/board/RhBzxDntpkj6hHti1MU2Tu/Untitled?node-id=0-1&p=f&t=gbiUryoTklW9Hksa-11 Create a board with a speech-bubble shape labeled "External API"."

#### Chat Transcript

**User**: https://www.figma.com/board/RhBzxDntpkj6hHti1MU2Tu/Untitled?node-id=0-1&p=f&t=gbiUryoTklW9Hksa-11 Create a board with a speech-bubble shape labeled "External API".

#### Code

```
board "https://www.figma.com/board/RhBzxDntpkj6hHti1MU2Tu/Untitled?node-id=0-1&p=f&t=gbiUryoTklW9Hksa-11"
  nodes [
    speech-bubble "External API"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 63

#### Prompt
"https://www.figma.com/board/xDgjSJWu86x9Qvn2MoSyhQ/Untitled?node-id=0-1&p=f&t=UoLp0f2aiEdrPPi2-11 Create a board with a shield shape labeled "Auth"."

#### Chat Transcript

**User**: https://www.figma.com/board/xDgjSJWu86x9Qvn2MoSyhQ/Untitled?node-id=0-1&p=f&t=UoLp0f2aiEdrPPi2-11 Create a board with a shield shape labeled "Auth".

#### Code

```
board "https://www.figma.com/board/xDgjSJWu86x9Qvn2MoSyhQ/Untitled?node-id=0-1&p=f&t=UoLp0f2aiEdrPPi2-11"
  nodes [
    shield "Auth"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 64

#### Prompt
"https://www.figma.com/board/NC8cKT4zAw2J7UKkajrrtH/Untitled?node-id=0-1&p=f&t=LlgTN3q4zTAYBbcX-11 Create a board with a connector at 50% opacity between two stickies."

#### Chat Transcript

**User**: https://www.figma.com/board/NC8cKT4zAw2J7UKkajrrtH/Untitled?node-id=0-1&p=f&t=LlgTN3q4zTAYBbcX-11 Create a board with a connector at 50% opacity between two stickies.

#### Code

```
board "https://www.figma.com/board/NC8cKT4zAw2J7UKkajrrtH/Untitled?node-id=0-1&p=f&t=LlgTN3q4zTAYBbcX-11"
  nodes [
    sticky "Hello"
      x 0
      y 0 {}
    sticky "World"
      x 350
      y 0 {}
    connector "link"
      from "Hello"
      to "World"
      opacity 50 {}
  ] {}..
```

---

### Example 65

#### Prompt
"Create a board with a single sticky note that says "Hello".

link to board https://www.figma.com/board/glhuSwysHXAW7ScjHWmekS/Untitled?node-id=0-1&p=f&t=lVBmA1V1FduXfq6f-0"

#### Chat Transcript

**User**: Create a board with a single sticky note that says "Hello".

**User**: link to board https://www.figma.com/board/glhuSwysHXAW7ScjHWmekS/Untitled?node-id=0-1&p=f&t=lVBmA1V1FduXfq6f-0

#### Code

```
board "https://www.figma.com/board/glhuSwysHXAW7ScjHWmekS/Untitled?node-id=0-1&p=f&t=lVBmA1V1FduXfq6f-0"
  nodes [
    sticky "Hello" {}
  ] {}..
```

---

### Example 66

#### Prompt
"https://www.figma.com/board/sCRF8uNO2mFybuF2jntER4/Untitled?node-id=0-1&p=f&localFileKey=LOCAL_69c14af5-df14-4c26-b84e-5ecfb0409e0f&t=tMZTbzf6DkV8hBun-11 Create a flowchart with rounded-rectangle "Start", predefined-process "Validate", diamond "OK?", and rounded-rectangle "End" in a row."

#### Chat Transcript

**User**: https://www.figma.com/board/sCRF8uNO2mFybuF2jntER4/Untitled?node-id=0-1&p=f&localFileKey=LOCAL_69c14af5-df14-4c26-b84e-5ecfb0409e0f&t=tMZTbzf6DkV8hBun-11 Create a flowchart with rounded-rectangle "Start", predefined-process "Validate", diamond "OK?", and rounded-rectangle "End" in a row.

#### Code

```
board "https://www.figma.com/board/sCRF8uNO2mFybuF2jntER4/Untitled?node-id=0-1&p=f&localFileKey=LOCAL_69c14af5-df14-4c26-b84e-5ecfb0409e0f&t=tMZTbzf6DkV8hBun-11"
  nodes [
    rounded-rectangle "Start"
      x 0
      y 0
      width 160
      height 80 {}
    predefined-process "Validate"
      x 0
      y 200
      width 160
      height 80 {}
    diamond "OK?"
      x 0
      y 400
      width 160
      height 80 {}
    rounded-rectangle "End"
      x 0
      y 600
      width 160
      height 80 {}
    connector "c1"
      from "Start"
      to "Validate" {}
    connector "c2"
      from "Validate"
      to "OK?" {}
    connector "c3"
      from "OK?"
      to "End" {}
  ] {}..
```

---

### Example 67

#### Prompt
"https://www.figma.com/board/1Jz4yVIjrVaxcpB7k3gbp0/Untitled?node-id=0-1&p=f&t=N8YA0nOS1EEeo2NK-11 Create a board with two sticky notes stacked vertically 120 units apart."

#### Chat Transcript

**User**: https://www.figma.com/board/1Jz4yVIjrVaxcpB7k3gbp0/Untitled?node-id=0-1&p=f&t=N8YA0nOS1EEeo2NK-11 Create a board with two sticky notes stacked vertically 120 units apart.

#### Code

```
board "https://www.figma.com/board/1Jz4yVIjrVaxcpB7k3gbp0/Untitled?node-id=0-1&p=f&t=N8YA0nOS1EEeo2NK-11"
  nodes [
    sticky "Hello"
      x 0
      y 0 {}
    sticky "World"
      x 0
      y 120 {}
  ] {}..
```

---

### Example 68

#### Prompt
"https://www.figma.com/board/mPpYSwK2uAWSxqAeY9FbbH/Untitled?node-id=0-1&p=f&t=2KpKg19MgutTG2IN-11 Create a board with a sticky note and a "heart" stamp next to it."

#### Chat Transcript

**User**: https://www.figma.com/board/mPpYSwK2uAWSxqAeY9FbbH/Untitled?node-id=0-1&p=f&t=2KpKg19MgutTG2IN-11 Create a board with a sticky note and a "heart" stamp next to it.

#### Code

```
board "https://www.figma.com/board/mPpYSwK2uAWSxqAeY9FbbH/Untitled?node-id=0-1&p=f&t=2KpKg19MgutTG2IN-11"
  nodes [
    sticky "Hello"
      x 0
      y 0 {}
    stamp "heart"
      x 250
      y 0 {}
  ] {}..
```

---

### Example 69

#### Prompt
"https://www.figma.com/board/2vqOjbyL6rcea1pdZia01z/Untitled?node-id=0-1&p=f&t=ZbcBIimVGEv0knbt-11 Create a board with a square of width 150 and height 150 at x 100 y 100."

#### Chat Transcript

**User**: https://www.figma.com/board/2vqOjbyL6rcea1pdZia01z/Untitled?node-id=0-1&p=f&t=ZbcBIimVGEv0knbt-11 Create a board with a square of width 150 and height 150 at x 100 y 100.

#### Code

```
board "https://www.figma.com/board/2vqOjbyL6rcea1pdZia01z/Untitled?node-id=0-1&p=f&t=ZbcBIimVGEv0knbt-11"
  nodes [
    square ""
      x 100
      y 100
      width 150
      height 150 {}
  ] {}..
```

---

### Example 70

#### Prompt
"https://www.figma.com/board/vR9rnd27bhz7qfHeriNfJM/Untitled?node-id=0-1&p=f&t=wefXgtcLaQsqz69I-11 Create a board with an eng-queue shape labeled "Task Queue"."

#### Chat Transcript

**User**: https://www.figma.com/board/vR9rnd27bhz7qfHeriNfJM/Untitled?node-id=0-1&p=f&t=wefXgtcLaQsqz69I-11 Create a board with an eng-queue shape labeled "Task Queue".

#### Code

```
board "https://www.figma.com/board/vR9rnd27bhz7qfHeriNfJM/Untitled?node-id=0-1&p=f&t=wefXgtcLaQsqz69I-11"
  nodes [
    eng-queue "Task Queue"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 71

#### Prompt
"https://www.figma.com/board/2hhgMJ9L5iWJ9vafUxnCKF/Untitled?node-id=0-1&p=f&t=oQkxIjKKOKPSULNJ-11 Create a board with three ellipses positioned at x 0, x 200, and x 400 on the same y."

#### Chat Transcript

**User**: https://www.figma.com/board/2hhgMJ9L5iWJ9vafUxnCKF/Untitled?node-id=0-1&p=f&t=oQkxIjKKOKPSULNJ-11 Create a board with three ellipses positioned at x 0, x 200, and x 400 on the same y.

#### Code

```
board "https://www.figma.com/board/2hhgMJ9L5iWJ9vafUxnCKF/Untitled?node-id=0-1&p=f&t=oQkxIjKKOKPSULNJ-11"
  nodes [
    ellipse "Ellipse 1"
      x 0
      y 0 {}
    ellipse "Ellipse 2"
      x 200
      y 0 {}
    ellipse "Ellipse 3"
      x 400
      y 0 {}
  ] {}..
```

---

### Example 72

#### Prompt
"https://www.figma.com/board/ELLicGzhiLvqfWLpUTr5LW/Untitled?node-id=0-1&p=f&t=UCHje57alBKN7UVB-11 Create a board with a text label in color "#4f46e5"."

#### Chat Transcript

**User**: https://www.figma.com/board/ELLicGzhiLvqfWLpUTr5LW/Untitled?node-id=0-1&p=f&t=UCHje57alBKN7UVB-11 Create a board with a text label in color "#4f46e5".

#### Code

```
board "https://www.figma.com/board/ELLicGzhiLvqfWLpUTr5LW/Untitled?node-id=0-1&p=f&t=UCHje57alBKN7UVB-11"
  nodes [
    text "Label"
      color "#4f46e5" {}
  ] {}..
```

---

### Example 73

#### Prompt
"https://www.figma.com/board/BIoe2Zo9b1a4uFv5bTlIYJ/Untitled?node-id=0-1&p=f&t=3THWHzy8r6ik5zGR-11 Create a board with a connector with a custom stroke color "#4f46e5"."

#### Chat Transcript

**User**: https://www.figma.com/board/BIoe2Zo9b1a4uFv5bTlIYJ/Untitled?node-id=0-1&p=f&t=3THWHzy8r6ik5zGR-11 Create a board with a connector with a custom stroke color "#4f46e5".

#### Code

```
board "https://www.figma.com/board/BIoe2Zo9b1a4uFv5bTlIYJ/Untitled?node-id=0-1&p=f&t=3THWHzy8r6ik5zGR-11"
  nodes [
    sticky "Start"
      x 0
      y 0 {}
    sticky "End"
      x 300
      y 0 {}
    connector "link"
      from "Start"
      to "End"
      stroke "#4f46e5" {}
  ] {}..
```

---

### Example 74

#### Prompt
"https://www.figma.com/board/DBf5QhdsOcaMJGr4l72QJ7/Untitled?node-id=0-1&p=f&t=tTk9j6sFcclFpX94-11 Create a board with a summing-junction shape and an or shape."

#### Chat Transcript

**User**: https://www.figma.com/board/DBf5QhdsOcaMJGr4l72QJ7/Untitled?node-id=0-1&p=f&t=tTk9j6sFcclFpX94-11 Create a board with a summing-junction shape and an or shape.

#### Code

```
board "https://www.figma.com/board/DBf5QhdsOcaMJGr4l72QJ7/Untitled?node-id=0-1&p=f&t=tTk9j6sFcclFpX94-11"
  nodes [
    summing-junction "Sum"
      x 0
      y 0 {}
    or "Or"
      x 250
      y 0 {}
  ] {}..
```

---

### Example 75

#### Prompt
"https://www.figma.com/board/keH8XsaXGvwis1o6eyF4J8/Untitled?node-id=0-1&p=f&t=RpcPkuAdW6RF0GzS-11 Create a board with a "like" stamp at x 100 y 100."

#### Chat Transcript

**User**: https://www.figma.com/board/keH8XsaXGvwis1o6eyF4J8/Untitled?node-id=0-1&p=f&t=RpcPkuAdW6RF0GzS-11 Create a board with a "like" stamp at x 100 y 100.

#### Code

```
board "https://www.figma.com/board/keH8XsaXGvwis1o6eyF4J8/Untitled?node-id=0-1&p=f&t=RpcPkuAdW6RF0GzS-11"
  nodes [
    stamp "like"
      x 100
      y 100 {}
  ] {
    v: 2
  }..
```

---

### Example 76

#### Prompt
"https://www.figma.com/board/GsQ8STnjoojx0ZTaegzbWC/Untitled?node-id=0-1&p=f&t=iQekLFFcCSeVZhKJ-11 Create a board with a diamond labeled "Is valid?" used as a decision."

#### Chat Transcript

**User**: https://www.figma.com/board/GsQ8STnjoojx0ZTaegzbWC/Untitled?node-id=0-1&p=f&t=iQekLFFcCSeVZhKJ-11 Create a board with a diamond labeled "Is valid?" used as a decision.

#### Code

```
board "https://www.figma.com/board/GsQ8STnjoojx0ZTaegzbWC/Untitled?node-id=0-1&p=f&t=iQekLFFcCSeVZhKJ-11"
  nodes [
    diamond "Is valid?"
      x 0
      y 0 {}
  ] {}..
```

---

### Example 77

#### Prompt
"https://www.figma.com/board/TMSj7fsn5Qu10186L1bJnx/Untitled?node-id=0-1&p=f&t=YUBxlopPlEaCcbrp-11 Create a board with two sticky notes connected by a connector labeled "next"."

#### Chat Transcript

**User**: https://www.figma.com/board/TMSj7fsn5Qu10186L1bJnx/Untitled?node-id=0-1&p=f&t=YUBxlopPlEaCcbrp-11 Create a board with two sticky notes connected by a connector labeled "next".

#### Code

```
board "https://www.figma.com/board/TMSj7fsn5Qu10186L1bJnx/Untitled?node-id=0-1&p=f&t=YUBxlopPlEaCcbrp-11"
  nodes [
    sticky "Hello"
      x 0
      y 0 {}
    sticky "World"
      x 350
      y 0 {}
    connector "next"
      from "Hello"
      to "World" {}
  ] {}..
```

---

### Example 78

#### Prompt
"https://www.figma.com/board/JbDOBFYl1PyHNSQGmjJmzU/Untitled?node-id=0-1&p=f&t=tzzdqahsMT3Jdul0-11 Create a board with a yellow, pink, and blue sticky note side by side."

#### Chat Transcript

**User**: https://www.figma.com/board/JbDOBFYl1PyHNSQGmjJmzU/Untitled?node-id=0-1&p=f&t=tzzdqahsMT3Jdul0-11 Create a board with a yellow, pink, and blue sticky note side by side.

#### Code

```
board "https://www.figma.com/board/JbDOBFYl1PyHNSQGmjJmzU/Untitled?node-id=0-1&p=f&t=tzzdqahsMT3Jdul0-11"
  nodes [
    sticky "Yellow"
      x 0
      y 0
      fill "#FFFF00" {}
    sticky "Pink"
      x 250
      y 0
      fill "#FF69B4" {}
    sticky "Blue"
      x 500
      y 0
      fill "#ADD8E6" {}
  ] {}..
```

---

### Example 79

#### Prompt
"https://www.figma.com/board/0KygitdjzHK4EbupN1Esqz/Untitled?node-id=0-1&p=f&t=GpTX0e6vvZB8bbe3-11 Create a board with four sticky notes arranged in a 2x2 grid."

#### Chat Transcript

**User**: https://www.figma.com/board/0KygitdjzHK4EbupN1Esqz/Untitled?node-id=0-1&p=f&t=GpTX0e6vvZB8bbe3-11 Create a board with four sticky notes arranged in a 2x2 grid.

#### Code

```
board "https://www.figma.com/board/0KygitdjzHK4EbupN1Esqz/Untitled?node-id=0-1&p=f&t=GpTX0e6vvZB8bbe3-11"
  nodes [
    sticky "Note 1"
      x 0
      y 0 {}
    sticky "Note 2"
      x 250
      y 0 {}
    sticky "Note 3"
      x 0
      y 250 {}
    sticky "Note 4"
      x 250
      y 250 {}
  ] {}..
```

---

### Example 80

#### Prompt
"https://www.figma.com/board/3N8uQm6yDv0S4W3VIx9eJw/Untitled?node-id=0-1&p=f&t=r50ir8EnoY9WY9re-11 Create a board with a connector going from a predefined-process shape to a diamond."

#### Chat Transcript

**User**: https://www.figma.com/board/3N8uQm6yDv0S4W3VIx9eJw/Untitled?node-id=0-1&p=f&t=r50ir8EnoY9WY9re-11 Create a board with a connector going from a predefined-process shape to a diamond.

#### Code

```
board "https://www.figma.com/board/3N8uQm6yDv0S4W3VIx9eJw/Untitled?node-id=0-1&p=f&t=r50ir8EnoY9WY9re-11"
  nodes [
    predefined-process "Process"
      x 0
      y 0 {}
    diamond "Decision"
      x 300
      y 0 {}
    connector "flow"
      from "Process"
      to "Decision" {}
  ] {}..
```

---

### Example 81

#### Prompt
"https://www.figma.com/board/lfDczNeyWPltCzz43eDLG5/Untitled?node-id=0-1&p=f&t=4Ca450UbP3J74B2F-11 Create a board with a triangle-down labeled "Decline"."

#### Chat Transcript

**User**: https://www.figma.com/board/lfDczNeyWPltCzz43eDLG5/Untitled?node-id=0-1&p=f&t=4Ca450UbP3J74B2F-11 Create a board with a triangle-down labeled "Decline".

#### Code

```
board "https://www.figma.com/board/lfDczNeyWPltCzz43eDLG5/Untitled?node-id=0-1&p=f&t=4Ca450UbP3J74B2F-11"
  nodes [
    triangle-down "Decline" {}
  ] {}..
```



