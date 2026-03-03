# Graffiticode Training Examples

*Downloaded on 2026-03-02T23:27:45.592Z*

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
topic "Ecosystem Relationships" instructions "
## Learning Objective
Identify the key components and their relationships in a forest ecosystem.

**Instructions:**
- Review each concept and its connection to the central ecosystem
- Consider how each element contributes to the overall balance
- Think about the flow of energy and nutrients
" theme light anchor text "Forest Ecosystem" assess [
  method "value"
  expected "Forest Ecosystem"
] {} connections [
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
topic "Concept Web" instructions "
Drag concepts onto the correct nodes. Remember: \"practice makes perfect\" and don't forget the apostrophe in \"it's important\" to get full credit." anchor text "Hub" assess [
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
"Create a concept web with a short one-line instruction."

#### Chat Transcript

**User**: Create a concept web with a short one-line instruction.

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

### Example 8

#### Prompt
"Create a concept web with a topic and instructions that explain how to complete the assessment."

#### Chat Transcript

**User**: Create a concept web with a topic and instructions that explain how to complete the assessment.

#### Code

```
topic "Concept Web" instructions "Welcome to the Concept Web assessment! Your goal is to explore how ideas connect to a central concept. Review each node in the diagram — the center node is the main topic, and the surrounding nodes show related concepts. Each connecting line represents a relationship between the central idea and its associated concepts. Take your time to understand how each concept links back to the hub before submitting your answers." anchor text "Hub" assess [
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

### Example 9

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

### Example 10

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

### Example 11

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

### Example 12

#### Prompt
"Make a drag-and-drop concept web: anchor and connections have blank text, and students drag concepts in."

#### Chat Transcript

**User**: Make a drag-and-drop concept web: anchor and connections have blank text, and students drag concepts in.

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

### Example 13

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

### Example 14

#### Prompt
"Make a concept web with just a topic and an anchor—no connections."

#### Chat Transcript

**User**: Make a concept web with just a topic and an anchor—no connections.

#### Code

```
topic "Anchor only" anchor text "Anchor" {} {}..
```

---

### Example 15

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

### Example 16

#### Prompt
"Make a concept web with markdown instructions using backticks, including bullet points"

#### Chat Transcript

**User**: Make a concept web with markdown instructions using backticks, including bullet points

#### Code

```
topic "Concept Web" instructions "Complete the concept web by following these steps:
* Identify the main topic in the center
* Connect related concepts to the hub
* Think about how each concept relates to the central theme
" anchor text "Hub" assess [
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
"Create an empty concept web with only a topic label."

#### Chat Transcript

**User**: Create an empty concept web with only a topic label.

#### Code

```
topic "Concept Web" {}..
```

---

### Example 18

#### Prompt
"Create a concept web where the instructions tell students to drag concepts onto the correct nodes."

#### Chat Transcript

**User**: Create a concept web where the instructions tell students to drag concepts onto the correct nodes.

#### Code

```
topic "Concept Web" instructions "Drag concepts onto the correct nodes." anchor text "" assess [
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

### Example 19

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

### Example 20

#### Prompt
"Create a concept web with a topic and an anchor."

#### Chat Transcript

**User**: Create a concept web with a topic and an anchor.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} {}..
```

---

### Example 21

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

### Example 22

#### Prompt
"Create a concept web with the topic "Solar System"."

#### Chat Transcript

**User**: Create a concept web with the topic "Solar System".

#### Code

```
topic "Solar System" anchor text "Solar System" assess [
  method "value"
  expected "Solar System"
] {} connections [
  connection text "Sun" assess [
    method "value"
    expected "Sun"
  ] {}
  connection text "Mercury" assess [
    method "value"
    expected "Mercury"
  ] {}
  connection text "Venus" assess [
    method "value"
    expected "Venus"
  ] {}
  connection text "Earth" assess [
    method "value"
    expected "Earth"
  ] {}
  connection text "Mars" assess [
    method "value"
    expected "Mars"
  ] {}
  connection text "Jupiter" assess [
    method "value"
    expected "Jupiter"
  ] {}
  connection text "Saturn" assess [
    method "value"
    expected "Saturn"
  ] {}
  connection text "Uranus" assess [
    method "value"
    expected "Uranus"
  ] {}
  connection text "Neptune" assess [
    method "value"
    expected "Neptune"
  ] {}
] {}..
```

---

### Example 23

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
] align RIGHT connections [
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

### Example 24

#### Prompt
"Create a concept web with a topic, an anchor, and two connections."

#### Chat Transcript

**User**: Create a concept web with a topic, an anchor, and two connections.

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

### Example 25

#### Prompt
"Create a concept web with markdown instructions that include bold and italic text."

#### Chat Transcript

**User**: Create a concept web with markdown instructions that include bold and italic text.

#### Code

```
topic "Concept Web" instructions "Complete the concept web by reviewing these guidelines:
**Bold concepts** are the most important to remember, and *italic text* highlights key relationships between ideas." anchor text "Hub" assess [
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

### Example 26

#### Prompt
"Create a concept web with a topic and empty instructions."

#### Chat Transcript

**User**: Create a concept web with a topic and empty instructions.

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

### Example 27

#### Prompt
"Create a concept web with an anchor and three connections.

Create a concept web with an anchor and five connections."

#### Chat Transcript

**User**: Create a concept web with an anchor and three connections.

**User**: Create a concept web with an anchor and five connections.

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
  connection text "Qux" assess [
    method "value"
    expected "Qux"
  ] {}
  connection text "Quux" assess [
    method "value"
    expected "Quux"
  ] {}
] {}..
```

---

### Example 28

#### Prompt
"Create a concept web with a topic and instructions, but no nodes."

#### Chat Transcript

**User**: Create a concept web with a topic and instructions, but no nodes.

#### Code

```
topic "Concept Web" instructions "Add your instructions here." {}..
```

---

### Example 29

#### Prompt
"Create a concept web with an anchor and one connection."

#### Chat Transcript

**User**: Create a concept web with an anchor and one connection.

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

### Example 30

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

### Example 31

#### Prompt
"Create a concept web with a topic, instructions, an anchor, and one connection."

#### Chat Transcript

**User**: Create a concept web with a topic, instructions, an anchor, and one connection.

#### Code

```
topic "Concept Web" instructions "Explore the connections between concepts." anchor text "Hub" assess [
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

### Example 32

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

### Example 33

#### Prompt
"Create a concept web with a long descriptive instruction paragraph."

#### Chat Transcript

**User**: Create a concept web with a long descriptive instruction paragraph.

#### Code

```
topic "Concept Web" instructions "In this activity, you will explore the relationships between key concepts by examining how each idea connects to the central hub. As you work through the diagram, consider how the surrounding concepts relate to and support the main idea at the center. Think carefully about the role each concept plays, how it might influence or be influenced by the hub, and what broader themes or patterns emerge from these connections. Use this opportunity to deepen your understanding of the topic by reflecting on both the individual concepts and the web of relationships that links them all together." anchor text "Hub" assess [
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

### Example 35

#### Prompt
"Create a concept web with an anchor that has display text."

#### Chat Transcript

**User**: Create a concept web with an anchor that has display text.

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

### Example 36

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

### Example 37

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

### Example 38

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

### Example 39

#### Prompt
"Make a concept web and place the instructions at the very end of the program."

#### Chat Transcript

**User**: Make a concept web and place the instructions at the very end of the program.

#### Code

```
topic "Foo" anchor text "Bar" {} connections [
  connection text "Baz" {}
] instructions "Instructions." {}..
```

---

### Example 40

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

### Example 41

#### Prompt
"Create a concept web with just an anchor node labeled "Center"."

#### Chat Transcript

**User**: Create a concept web with just an anchor node labeled "Center".

#### Code

```
topic "Concept Web" anchor text "Center" {} {}..
```

---

### Example 42

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

### Example 43

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

### Example 44

#### Prompt
"Create a concept web with an anchor and two connections."

#### Chat Transcript

**User**: Create a concept web with an anchor and two connections.

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

### Example 45

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

### Example 46

#### Prompt
"Create a concept web with instructions that include both a description and a bulleted list."

#### Chat Transcript

**User**: Create a concept web with instructions that include both a description and a bulleted list.

#### Code

```
topic "Concept Web" instructions "This concept web explores key relationships between ideas. As you review each node, consider the following:

- How does each concept connect to the central hub?
- What relationships exist between the outer concepts?
- Can you identify any patterns or themes across the web?" anchor text "Hub" assess [
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

### Example 47

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

### Example 48

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

### Example 49

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

### Example 50

#### Prompt
"Create a concept web with numbered step-by-step instructions in markdown."

#### Chat Transcript

**User**: Create a concept web with numbered step-by-step instructions in markdown.

#### Code

```
topic "Concept Web" instructions "Follow these steps to complete the concept web:
1. Identify the central hub concept in the middle
2. Review each connected concept surrounding the hub
3. Consider how each outer concept relates to the central hub
4. Verify your understanding of the relationships between all concepts
" anchor text "Hub" assess [
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

### Example 51

#### Prompt
"Make a concept web that includes two separate instructions lines."

#### Chat Transcript

**User**: Make a concept web that includes two separate instructions lines.

#### Code

```
topic "Concept Web" instructions "First." instructions "Each concept should be placed on its matching connection." instructions "Second." instructions "Each concept should be placed on its matching connection." anchor text "Hub" assess [
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

### Example 52

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

### Example 53

#### Prompt
"Create a concept web with multiline markdown instructions using a bulleted list."

#### Chat Transcript

**User**: Create a concept web with multiline markdown instructions using a bulleted list.

#### Code

```
topic "Concept Web" instructions "Complete the concept web by following these steps:
* Identify the main topic in the center
* Connect related concepts to the hub
* Think about how each concept relates to the central theme
" anchor text "Hub" assess [
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

### Example 54

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

---

### Example 55

#### Prompt
"Create a concept web with an anchor and three connections."

#### Chat Transcript

**User**: Create a concept web with an anchor and three connections.

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



