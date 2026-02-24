# Graffiticode Training Examples

*Downloaded on 2026-02-24T22:42:29.687Z*

## Language L0169

### Example 1

#### Prompt
"Make a drag-and-drop web with an invalid align value."

#### Chat Transcript

**User**: Make a drag-and-drop web with an invalid align value.

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align INVALID {}..
```

---

### Example 2

#### Prompt
"Make a standard concept web with a connections list of three connections (canonical format)."

#### Chat Transcript

**User**: Make a standard concept web with a connections list of three connections (canonical format).

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 3

#### Prompt
"Make a fully-featured concept web: topic, markdown instructions, theme, anchor assess, and three assessed connections."

#### Chat Transcript

**User**: Make a fully-featured concept web: topic, markdown instructions, theme, anchor assess, and three assessed connections.

#### Code

```
topic "Ecosystem Relationships"
instructions "
## Learning Objective
Identify the key components and their relationships in a forest ecosystem.

**Instructions:**
- Review each concept and its connection to the central ecosystem
- Consider how each element contributes to the overall balance
- Think about the flow of energy and nutrients
"
theme light
anchor text "Forest Ecosystem" assess [
  method "value"
  expected "Forest Ecosystem"
] {}
connections [
  connection text "Producers" assess [
    method "value"
    expected "Producers"
  ] {}
  connection text "Primary Consumers" assess [
    method "value"
    expected "Primary Consumers"
  ] {}
  connection text "Decomposers" assess [
    method "value"
    expected "Decomposers"
  ] {}
] {}..
```

---

### Example 4

#### Prompt
"Make a concept web where every connection has its own assess block."

#### Chat Transcript

**User**: Make a concept web where every connection has its own assess block.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 5

#### Prompt
"Make a drag-and-drop web with a concepts tray but omit the align setting."

#### Chat Transcript

**User**: Make a drag-and-drop web with a concepts tray but omit the align setting.

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] {}..
```

---

### Example 6

#### Prompt
"Make a concept web with markdown instructions that include quotation marks and apostrophes."

#### Chat Transcript

**User**: Make a concept web with markdown instructions that include quotation marks and apostrophes.

#### Code

```
topic "Concept Web" instructions `
Drag concepts onto the correct nodes. Remember: \"practice makes perfect\" and don't forget the apostrophe in \"it's important\" to get full credit.` anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 7

#### Prompt
"Make a concept web with an intentionally empty instructions string."

#### Chat Transcript

**User**: Make a concept web with an intentionally empty instructions string.

#### Code

```
topic "Concept Web" instructions "" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 8

#### Prompt
"Make a concept web with exactly one connection node."

#### Chat Transcript

**User**: Make a concept web with exactly one connection node.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
] {}..
```

---

### Example 9

#### Prompt
"Make a concept web with an assess block missing the expected field."

#### Chat Transcript

**User**: Make a concept web with an assess block missing the expected field.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 10

#### Prompt
"Make a drag-and-drop concept web: anchor and connections have blank text, and students drag concepts in."

#### Chat Transcript

**User**: Make a drag-and-drop concept web: anchor and connections have blank text, and students drag concepts in.

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT {}..
```

---

### Example 11

#### Prompt
"Make a drag-and-drop web with duplicate tray values, distractors, and mixed image/text overrides."

#### Chat Transcript

**User**: Make a drag-and-drop web with duplicate tray values, distractors, and mixed image/text overrides.

#### Code

```
topic "Concept Web Assessment" instructions "Drag the correct concepts to fill in the blanks. Some concepts may be used multiple times, and some are distractors." anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" text "Central Hub" {}
  concept value "Foo" image "https://example.com/foo.png" {}
  concept value "Bar" {}
  concept value "Foo" text "Alternative Foo" {}
  concept value "Baz" image "https://example.com/baz.png" {}
  concept value "Distractor1" text "Wrong Answer" {}
  concept value "Distractor2" image "https://example.com/wrong.png" {}
] align RIGHT {}..
```

---

### Example 12

#### Prompt
"Make a concept web with just a topic and an anchor—no connections."

#### Chat Transcript

**User**: Make a concept web with just a topic and an anchor—no connections.

#### Code

```
topic "Anchor only" anchor text "Anchor" {} {}..
```

---

### Example 13

#### Prompt
"Make a concept web where the anchor has an assess block with method value and an expected answer."

#### Chat Transcript

**User**: Make a concept web where the anchor has an assess block with method value and an expected answer.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 14

#### Prompt
"Make a concept web with markdown instructions using backticks, including bullet points"

#### Chat Transcript

**User**: Make a concept web with markdown instructions using backticks, including bullet points

#### Code

```
topic "Concept Web"
instructions `Complete the concept web by following these steps:
* Identify the main topic in the center
* Connect related concepts to the hub
* Think about how each concept relates to the central theme
`
anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 15

#### Prompt
"Make a concept web where only connections are assessed (anchor has no assess)."

#### Chat Transcript

**User**: Make a concept web where only connections are assessed (anchor has no assess).

#### Code

```
topic "Concept Web" anchor text "Hub" {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 16

#### Prompt
"Make a concept web but include an instructions line with no text value."

#### Chat Transcript

**User**: Make a concept web but include an instructions line with no text value.

#### Code

```
topic "Concept Web"
instructions
anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 17

#### Prompt
"Make a concept web with an anchor and one connection, but don’t include a topic line."

#### Chat Transcript

**User**: Make a concept web with an anchor and one connection, but don’t include a topic line.

#### Code

```
anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
] {}..
```

---

### Example 18

#### Prompt
"Make a drag-and-drop web where the concepts tray is declared before the connections block"

#### Chat Transcript

**User**: Make a drag-and-drop web where the concepts tray is declared before the connections block

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT
connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 19

#### Prompt
"Make a concept web with three connections and a trailing comma after the last one."

#### Chat Transcript

**User**: Make a concept web with three connections and a trailing comma after the last one.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 20

#### Prompt
"Make a drag-and-drop web where only the anchor is blank, but connections show text."

#### Chat Transcript

**User**: Make a drag-and-drop web where only the anchor is blank, but connections show text.

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
] align RIGHT {}..
```

---

### Example 21

#### Prompt
"Make a drag-and-drop web with the concepts tray aligned LEFT"

#### Chat Transcript

**User**: Make a drag-and-drop web with the concepts tray aligned LEFT

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align LEFT {}..
```

---

### Example 22

#### Prompt
"Make a concept web where the anchor is written before the topic (keep it otherwise valid)."

#### Chat Transcript

**User**: Make a concept web where the anchor is written before the topic (keep it otherwise valid).

#### Code

```
anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} topic "Concept Web" connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 23

#### Prompt
"Make a concept web where only the anchor is assessed (connections have no assess)"

#### Chat Transcript

**User**: Make a concept web where only the anchor is assessed (connections have no assess)

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" {}
  connection text "Bar" {}
  connection text "Baz" {}
] {}..
```

---

### Example 24

#### Prompt
"Make a drag-and-drop web with the concepts tray aligned top"

#### Chat Transcript

**User**: Make a drag-and-drop web with the concepts tray aligned top

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align TOP {}..
```

---

### Example 25

#### Prompt
"Make a concept web and place the instructions at the very end of the program."

#### Chat Transcript

**User**: Make a concept web and place the instructions at the very end of the program.

#### Code

```
topic "Foo" anchor text "Bar" {} connections [
  connection text "Baz" {}
]
instructions "Instructions."
{}..
```

---

### Example 26

#### Prompt
"Make a concept web with a concepts tray on the RIGHT, containing three concept values."

#### Chat Transcript

**User**: Make a concept web with a concepts tray on the RIGHT, containing three concept values.

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT {}..
```

---

### Example 27

#### Prompt
"Make a drag-and-drop web where only the connections are blank, but the anchor shows text."

#### Chat Transcript

**User**: Make a drag-and-drop web where only the connections are blank, but the anchor shows text.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT {}..
```

---

### Example 28

#### Prompt
"Make a concept web and include a short instructions line for students."

#### Chat Transcript

**User**: Make a concept web and include a short instructions line for students.

#### Code

```
topic "Concept Web" instructions "Connect the related concepts to the central hub." anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 29

#### Prompt
"Make a concept web with a topic and connections, but omit the anchor."

#### Chat Transcript

**User**: Make a concept web with a topic and connections, but omit the anchor.

#### Code

```
topic "Concept Web" connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 30

#### Prompt
"Make a drag-and-drop web with the concepts tray aligned bottom"

#### Chat Transcript

**User**: Make a drag-and-drop web with the concepts tray aligned bottom

#### Code

```
topic "Concept Web" anchor text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "" assess [
    method "value"
    expected "Baz"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align BOTTOM {}..
```

---

### Example 31

#### Prompt
"Make a concept web with exactly two connection nodes."

#### Chat Transcript

**User**: Make a concept web with exactly two connection nodes.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
] {}..
```

---

### Example 32

#### Prompt
"Make a concept web with an assess block missing the method field."

#### Chat Transcript

**User**: Make a concept web with an assess block missing the method field.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 33

#### Prompt
"Make a concept web that includes two separate instructions lines."

#### Chat Transcript

**User**: Make a concept web that includes two separate instructions lines.

#### Code

```
topic "Concept Web"
instructions "First." instructions "Each concept should be placed on its matching connection."
instructions "Second." instructions "Each concept should be placed on its matching connection."
anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 34

#### Prompt
"Create the smallest valid concept web: a topic, one anchor, and one connection."

#### Chat Transcript

**User**: Create the smallest valid concept web: a topic, one anchor, and one connection.

#### Code

```
topic "Concept Web" anchor text "Hub" {} connections [
  connection text "Spoke" {}
] {}..
```

---

### Example 35

#### Prompt
"Make a concept web where connections are written before the anchor (keep it otherwise valid)."

#### Chat Transcript

**User**: Make a concept web where connections are written before the anchor (keep it otherwise valid).

#### Code

```
connections [
  connection text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} {}..
```



