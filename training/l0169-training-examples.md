# Graffiticode Training Examples

*Downloaded on 2026-03-10T20:09:12.209Z*

## Language L0169

### Example 1

#### Prompt
"Create a concept web with custom edges, dark theme, topic, and instructions."

#### Chat Transcript

**User**: Create a concept web with custom edges, dark theme, topic, and instructions.

#### Code

```
topic "Concept Web" instructions "Explore the connections between concepts by following the edges in the diagram." theme DARK anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid-arrow" {}
  edge from "Foo" to "Bar" type "dashed" text "related" {}
  edge from "Bar" to "Baz" type "dashed" text "related" {}
] {}..
```

---

### Example 2

#### Prompt
"Create a concept web where the connections list has style defaults but one connection overrides with its own bg."

#### Chat Transcript

**User**: Create a concept web where the connections list has style defaults but one connection overrides with its own bg.

#### Code

```
topic "Concept Web" anchor text "Hub" {} connections [
  connection text "Foo" {}
  connection text "Bar" bg "rose-500" {}
  connection text "Baz" {}
] bg "blue-500" color "white" {}..
```

---

### Example 3

#### Prompt
"Create a concept web with an anchor with text set to empty string for drag-and-drop."

#### Chat Transcript

**User**: Create a concept web with an anchor with text set to empty string for drag-and-drop.

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
] {}..
```

---

### Example 4

#### Prompt
"Create a concept web with images on connections. ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)"

#### Chat Transcript

**User**: Create a concept web with images on connections. ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

#### Code

```
topic "Concept Web" anchor text "Hub" {} connections [
  connection text "thumbnail_4" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36" {}
  connection text "thumbnail_5" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9" {}
  connection text "thumbnail_1" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  connection text "thumbnail_2" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  connection text "thumbnail_3" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c" {}
] {}..
```

---

### Example 5

#### Prompt
"Create a concept web with solid edges from anchor to all connections plus a dashed peer-to-peer edge between two connections."

#### Chat Transcript

**User**: Create a concept web with solid edges from anchor to all connections plus a dashed peer-to-peer edge between two connections.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" {}
  edge from "Foo" to "Bar" type "dashed" {}
] {}..
```

---

### Example 6

#### Prompt
"Create a concept web with styled nodes, custom edges, assessment, and a concepts tray — combining styling with existing features."

#### Chat Transcript

**User**: Create a concept web with styled nodes, custom edges, assessment, and a concepts tray — combining styling with existing features.

#### Code

```
topic "Concept Web" instructions "Drag the concepts from the tray onto the correct nodes." theme LIGHT anchor value "Hub" text "" w 28 h 28 bg "indigo-500" color "white" rounded "full" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" w 24 h 12 bg "sky-100" color "sky-800" border "sky-400" rounded "lg" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" w 24 h 12 bg "emerald-100" color "emerald-800" border "emerald-400" rounded "lg" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" w 24 h 12 bg "rose-100" color "rose-800" border "rose-400" rounded "lg" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" text "leads to" {}
  edge from "Hub" to "Bar" type "dashed-arrow" text "relates to" {}
  edge from "Hub" to "Baz" type "dashed" text "connects" {}
  edge from "Foo" to "Bar" type "dashed" text "linked" {}
] concepts [
  concept value "Hub" bg "indigo-500" color "white" rounded "full" {}
  concept value "Foo" bg "sky-100" color "sky-800" {}
  concept value "Bar" bg "emerald-100" color "emerald-800" {}
  concept value "Baz" bg "rose-100" color "rose-800" {}
  concept value "Qux" text "Qux (distractor)" {}
  concept value "Quux" text "Quux (distractor)" {}
] align RIGHT {}..
```

---

### Example 7

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

### Example 8

#### Prompt
"Create a fully featured concept web with topic, instructions, dark theme, a circular styled anchor, rectangular styled connections with container defaults, custom edges, assessed nodes, a concepts tray with styled items, and a relations tray with styled labels."

#### Chat Transcript

**User**: Create a fully featured concept web with topic, instructions, dark theme, a circular styled anchor, rectangular styled connections with container defaults, custom edges, assessed nodes, a concepts tray with styled items, and a relations tray with styled labels.

#### Code

```
topic "Concept Web" instructions "**Instructions:** Drag the concepts onto the correct nodes, then drag the relationship labels onto the correct edges.
- The **center node** is the main topic
- **Solid arrows** show primary relationships
- **Dashed lines** show secondary connections
- Use the tray on the **right** for concepts and the tray on the **bottom** for relations" theme DARK anchor value "Hub" text "" w 28 h 28 rounded "full" bg "indigo-600" color "white" border "indigo-300" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
  connection value "Qux" text "" assess [
    method "value"
    expected "Qux"
  ] {}
] w 24 h 12 rounded "lg" bg "slate-700" color "white" border "slate-400" edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "leads to"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Baz" type "dashed-arrow" assess [
    method "value"
    expected "connects"
  ] {}
  edge from "Hub" to "Qux" type "dashed" assess [
    method "value"
    expected "influences"
  ] {}
  edge from "Foo" to "Bar" type "dashed" assess [
    method "value"
    expected "linked"
  ] {}
] concepts [
  concept value "Hub" bg "indigo-500" color "white" {}
  concept value "Foo" bg "sky-500" color "white" {}
  concept value "Bar" bg "emerald-500" color "white" {}
  concept value "Baz" bg "amber-500" color "white" {}
  concept value "Qux" bg "rose-500" color "white" {}
  concept value "Distractor1" text "Wrong A" bg "zinc-600" color "zinc-300" {}
  concept value "Distractor2" text "Wrong B" bg "zinc-600" color "zinc-300" {}
] align RIGHT relations [
  relation value "leads to" text "Leads To →" bg "sky-100" color "sky-800" {}
  relation value "relates to" text "Relates To ↔" bg "emerald-100" color "emerald-800" {}
  relation value "connects" text "Connects ~" bg "amber-100" color "amber-800" {}
  relation value "influences" text "Influences ⇢" bg "rose-100" color "rose-800" {}
  relation value "linked" text "Linked --" bg "violet-100" color "violet-800" {}
  relation value "causes" text "Causes ✕" bg "zinc-200" color "zinc-700" {}
  relation value "opposes" text "Opposes ≠" bg "zinc-200" color "zinc-700" {}
] align BOTTOM {}..
```

---

### Example 9

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

### Example 10

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

### Example 11

#### Prompt
"Create a concept web with solid-arrow edges, an image on one edge, and a concepts tray with images."

#### Chat Transcript

**User**: Create a concept web with solid-arrow edges, an image on one edge, and a concepts tray with images.

#### Code

```
topic "Concept Web" anchor value "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" {}
  edge from "Hub" to "Bar" type "solid-arrow" image "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/120px-PNG_transparency_demonstration_1.png" {}
  edge from "Hub" to "Baz" type "solid-arrow" {}
] concepts [
  concept value "Hub" image "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Circle_-_black_simple.svg/120px-Circle_-_black_simple.svg.png" {}
  concept value "Foo" image "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Solar_system.jpg/120px-Solar_system.jpg" {}
  concept value "Bar" image "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/120px-PNG_transparency_demonstration_1.png" {}
  concept value "Baz" image "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Stonehenge.jpg/120px-Stonehenge.jpg" {}
] align RIGHT {}..
```

---

### Example 12

#### Prompt
"![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

Create a concept web with a mix of image concepts and text concepts in the tray."

#### Chat Transcript

**User**: ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

**User**: Create a concept web with a mix of image concepts and text concepts in the tray.

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
  concept value "Hub" text "Hub" {}
  concept value "Foo" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  concept value "Bar" text "Bar" {}
  concept value "Baz" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
] align RIGHT {}..
```

---

### Example 13

#### Prompt
"Create a concept web with three connections where expected values are multi-word strings."

#### Chat Transcript

**User**: Create a concept web with three connections where expected values are multi-word strings.

#### Code

```
topic "Concept Web" anchor text "Solar System" assess [
  method "value"
  expected "Solar System"
] {} connections [
  connection text "Rocky Inner Planets" assess [
    method "value"
    expected "Rocky Inner Planets"
  ] {}
  connection text "Gas Giant Planets" assess [
    method "value"
    expected "Gas Giant Planets"
  ] {}
  connection text "Dwarf Planets and Moons" assess [
    method "value"
    expected "Dwarf Planets and Moons"
  ] {}
] {}..
```

---

### Example 14

#### Prompt
"Create a light-themed concept web with a topic, instructions, and three connections."

#### Chat Transcript

**User**: Create a light-themed concept web with a topic, instructions, and three connections.

#### Code

```
topic "Concept Web" instructions "Explore the connections between concepts." theme LIGHT anchor text "Hub" assess [
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

### Example 16

#### Prompt
"Create a drag-and-drop concept web with a topic, instructions, blank anchor, blank connections, concepts tray, and assessment on all nodes."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with a topic, instructions, blank anchor, blank connections, concepts tray, and assessment on all nodes.

#### Code

```
topic "Concept Web" instructions "Drag the concepts from the tray onto the correct nodes." anchor text "" assess [
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

### Example 17

#### Prompt
"Create a concept web with solid edges from the anchor to all connections using the edges keyword."

#### Chat Transcript

**User**: Create a concept web with solid edges from the anchor to all connections using the edges keyword.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" {}
] {}..
```

---

### Example 18

#### Prompt
"Create a fully featured drag-and-drop concept web with topic, markdown instructions, dark theme, blank assessed nodes with a concepts tray, assessed edges with mixed types, a relations tray with text overrides and distractors, concepts aligned right, and relations aligned bottom."

#### Chat Transcript

**User**: Create a fully featured drag-and-drop concept web with topic, markdown instructions, dark theme, blank assessed nodes with a concepts tray, assessed edges with mixed types, a relations tray with text overrides and distractors, concepts aligned right, and relations aligned bottom.

#### Code

```
topic "Concept Web" instructions "**Instructions:** Drag the concepts onto the correct nodes, then drag the relationship labels onto the correct edges.
- The **center node** is the main topic
- **Solid arrows** show primary relationships
- **Dashed lines** show secondary connections
- Use the tray on the **right** for concepts and the tray on the **bottom** for relations" theme DARK anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
  connection value "Qux" text "" assess [
    method "value"
    expected "Qux"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "leads to"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Baz" type "dashed-arrow" assess [
    method "value"
    expected "connects"
  ] {}
  edge from "Hub" to "Qux" type "dashed" assess [
    method "value"
    expected "influences"
  ] {}
  edge from "Foo" to "Bar" type "dashed" assess [
    method "value"
    expected "linked"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
  concept value "Qux" {}
  concept value "Distractor1" text "Wrong A" {}
  concept value "Distractor2" text "Wrong B" {}
] align RIGHT relations [
  relation value "leads to" text "Leads To →" {}
  relation value "relates to" text "Relates To ↔" {}
  relation value "connects" text "Connects ~" {}
  relation value "influences" text "Influences ⇢" {}
  relation value "linked" text "Linked --" {}
  relation value "causes" text "Causes ✕" {}
  relation value "opposes" text "Opposes ≠" {}
] align BOTTOM {}..
```

---

### Example 19

#### Prompt
"Create a concept web with an anchor using larger rounded border radius."

#### Chat Transcript

**User**: Create a concept web with an anchor using larger rounded border radius.

#### Code

```
topic "Concept Web" anchor text "Hub" rounded "2xl" assess [
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
"Create a concept web with a relation that uses text to override the display independently of its value."

#### Chat Transcript

**User**: Create a concept web with a relation that uses text to override the display independently of its value.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "*" type "solid" assess [
    method "value"
    expected "relates to"
  ] {}
] relations [
  relation value "relates to" text "Relates To →" {}
] align BOTTOM {}..
```

---

### Example 21

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

### Example 22

#### Prompt
"Create a concept web with edges using '*' wildcard from the anchor and one specific peer edge with a text label."

#### Chat Transcript

**User**: Create a concept web with edges using '*' wildcard from the anchor and one specific peer edge with a text label.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" {}
  edge from "Foo" to "Bar" type "dashed" text "related" {}
] {}..
```

---

### Example 23

#### Prompt
"Create a concept web with an anchor that has display text.

Create a concept web with an anchor that has a value but no display text override."

#### Chat Transcript

**User**: Create a concept web with an anchor that has display text.

**User**: Create a concept web with an anchor that has a value but no display text override.

#### Code

```
topic "Concept Web" anchor value "Hub" assess [
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

### Example 24

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

### Example 25

#### Prompt
"Create a concept web with a relation that uses bg, color, and border together for full styling."

#### Chat Transcript

**User**: Create a concept web with a relation that uses bg, color, and border together for full styling.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" {}
] relations [
  relation value "relates to" bg "blue-500" color "white" border "blue-700" {}
] align BOTTOM {}..
```

---

### Example 26

#### Prompt
"Create a concept web with an anchor that has background color set."

#### Chat Transcript

**User**: Create a concept web with an anchor that has background color set.

#### Code

```
topic "Concept Web" anchor text "Hub" bg "blue-500" color "white" {} connections [
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

### Example 28

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

### Example 29

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

### Example 30

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

### Example 31

#### Prompt
"Create a concept web with the dark theme, a topic, and an anchor with two connections."

#### Chat Transcript

**User**: Create a concept web with the dark theme, a topic, and an anchor with two connections.

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
] theme DARK {}..
```

---

### Example 32

#### Prompt
"Create a concept web with a concepts tray aligned to the left."

#### Chat Transcript

**User**: Create a concept web with a concepts tray aligned to the left.

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

### Example 33

#### Prompt
"Create a concept web with assessed edges and assessed nodes on the same diagram."

#### Chat Transcript

**User**: Create a concept web with assessed edges and assessed nodes on the same diagram.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" text "relates to" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Bar" type "dashed" text "connects with" assess [
    method "value"
    expected "connects with"
  ] {}
  edge from "Hub" to "Baz" type "dashed-arrow" text "leads to" assess [
    method "value"
    expected "leads to"
  ] {}
] {}..
```

---

### Example 34

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

### Example 35

#### Prompt
"![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

Create a concepts tray where each concept has one of these images"

#### Chat Transcript

**User**: ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

**User**: Create a concepts tray where each concept has one of these images

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
] concepts [
  concept value "Hub" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  concept value "Foo" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  concept value "Bar" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c" {}
  concept value "Baz" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36" {}
] align RIGHT {}..
```

---

### Example 36

#### Prompt
"Create a concept web with custom edges and assessment on all nodes."

#### Chat Transcript

**User**: Create a concept web with custom edges and assessment on all nodes.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" text "relates to" {}
  edge from "Hub" to "Bar" type "dashed" text "connects with" {}
  edge from "Hub" to "Baz" type "solid-arrow" text "leads to" {}
] {}..
```

---

### Example 37

#### Prompt
"Create a drag-and-drop concept web where both anchor and connections are blank with a concepts tray."

#### Chat Transcript

**User**: Create a drag-and-drop concept web where both anchor and connections are blank with a concepts tray.

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

### Example 38

#### Prompt
"Create a concept web where the anchor is styled differently from connections using different background and rounding values."

#### Chat Transcript

**User**: Create a concept web where the anchor is styled differently from connections using different background and rounding values.

#### Code

```
topic "Concept Web" anchor text "Hub" bg "indigo-600" color "white" rounded "full" {} connections [
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
] bg "amber-100" rounded "lg" {}..
```

---

### Example 39

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

### Example 40

#### Prompt
"Create a concept web where only the connections are assessed and the anchor is display-only."

#### Chat Transcript

**User**: Create a concept web where only the connections are assessed and the anchor is display-only.

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

### Example 41

#### Prompt
"Create a concept web with a concepts tray containing two items."

#### Chat Transcript

**User**: Create a concept web with a concepts tray containing two items.

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
] align RIGHT {}..
```

---

### Example 42

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

### Example 43

#### Prompt
"Create a concept web with bg and color applied to concepts in the tray."

#### Chat Transcript

**User**: Create a concept web with bg and color applied to concepts in the tray.

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
  concept value "Hub" bg "indigo-500" color "white" {}
  concept value "Foo" bg "emerald-500" color "white" {}
  concept value "Bar" bg "rose-500" color "white" {}
  concept value "Baz" bg "amber-500" color "white" {}
] align RIGHT {}..
```

---

### Example 44

#### Prompt
"Create a concept web with an anchor using rounded 'sm' for small border radius."

#### Chat Transcript

**User**: Create a concept web with an anchor using rounded 'sm' for small border radius.

#### Code

```
topic "Concept Web" anchor text "Hub" rounded "sm" assess [
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

### Example 45

#### Prompt
"Make a concept web with just a topic and an anchor—no connections."

#### Chat Transcript

**User**: Make a concept web with just a topic and an anchor—no connections.

#### Code

```
topic "Anchor only" anchor text "Anchor" {} {}..
```

---

### Example 46

#### Prompt
"Create a concept web with a relations tray containing a mix of text and image relations. ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)
![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)"

#### Chat Transcript

**User**: Create a concept web with a relations tray containing a mix of text and image relations. ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)
![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)

#### Code

```
topic "Concept Web" instructions "Drag the correct relationship labels onto the edges." anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "causes"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "supports"
  ] {}
  edge from "Hub" to "Baz" type "dashed-arrow" assess [
    method "value"
    expected "inhibits"
  ] {}
] relations [
  relation value "causes" text "Causes" {}
  relation value "supports" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  relation value "inhibits" text "Inhibits" {}
  relation value "activates" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  relation value "signals" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c" {}
] align BOTTOM {}..
```

---

### Example 47

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

### Example 48

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

### Example 49

#### Prompt
"Create a drag-and-drop concept web where students drag relation labels from the tray onto assessed edges."

#### Chat Transcript

**User**: Create a drag-and-drop concept web where students drag relation labels from the tray onto assessed edges.

#### Code

```
topic "Concept Web" instructions "Drag the relation labels from the tray onto the correct edges." anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "causes"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "supports"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "inhibits"
  ] {}
] relations [
  relation value "causes" {}
  relation value "supports" {}
  relation value "inhibits" {}
] align BOTTOM {}..
```

---

### Example 50

#### Prompt
"Create a concept web with one connection that has display text."

#### Chat Transcript

**User**: Create a concept web with one connection that has display text.

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
] {
  v: 1
}..
```

---

### Example 51

#### Prompt
"Create a concept web with five connections, each assessed with different expected values."

#### Chat Transcript

**User**: Create a concept web with five connections, each assessed with different expected values.

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

### Example 52

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

### Example 53

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

### Example 54

#### Prompt
"Create a dark-themed drag-and-drop concept web with assessment."

#### Chat Transcript

**User**: Create a dark-themed drag-and-drop concept web with assessment.

#### Code

```
topic "Concept Web" theme DARK anchor text "" assess [
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

### Example 55

#### Prompt
"Create a concept web with an anchor that sets the border color."

#### Chat Transcript

**User**: Create a concept web with an anchor that sets the border color.

#### Code

```
topic "Concept Web" anchor text "Hub" border "blue-400" assess [
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

### Example 56

#### Prompt
"Create a concept web with an anchor using rounded 'xl' for extra-large border radius."

#### Chat Transcript

**User**: Create a concept web with an anchor using rounded 'xl' for extra-large border radius.

#### Code

```
topic "Concept Web" anchor text "Hub" rounded "xl" assess [
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

### Example 57

#### Prompt
"Create a concept web with an edge where from is a list of two node values."

#### Chat Transcript

**User**: Create a concept web with an edge where from is a list of two node values.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from [
    "Foo"
    "Bar"
  ] to "Hub" type "solid" {}
  edge from "Baz" to "Hub" type "dashed" {}
] {}..
```

---

### Example 58

#### Prompt
"![gc-logo-sm](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd62983b8-6b83-4088-b4aa-5388ee03a96b_gc-logo-sm.png?alt=media&token=24ae2e84-d1cc-44a5-8f24-437187d9380a)

Create a concept web with an image on the anchor node."

#### Chat Transcript

**User**: ![gc-logo-sm](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd62983b8-6b83-4088-b4aa-5388ee03a96b_gc-logo-sm.png?alt=media&token=24ae2e84-d1cc-44a5-8f24-437187d9380a)

**User**: Create a concept web with an image on the anchor node.

#### Code

```
topic "Concept Web" anchor image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd62983b8-6b83-4088-b4aa-5388ee03a96b_gc-logo-sm.png?alt=media&token=24ae2e84-d1cc-44a5-8f24-437187d9380a" text "Hub" assess [
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

### Example 59

#### Prompt
"Create a concept web where relation styles (bg, color, border) carry through to the edge label when placed."

#### Chat Transcript

**User**: Create a concept web where relation styles (bg, color, border) carry through to the edge label when placed.

#### Code

```
topic "Concept Web" instructions "Drag the correct relationship labels onto the edges." anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "connects with"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "leads to"
  ] {}
] relations [
  relation value "relates to" bg "blue-100" color "blue-800" border "blue-400" {}
  relation value "connects with" bg "green-100" color "green-800" border "green-400" {}
  relation value "leads to" bg "purple-100" color "purple-800" border "purple-400" {}
] align BOTTOM {}..
```

---

### Example 60

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

### Example 61

#### Prompt
"Create a drag-and-drop concept web with relation labels where values differ from their display text."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with relation labels where values differ from their display text.

#### Code

```
topic "Ecosystem Relationships" instructions "Drag the concept labels onto the nodes, then drag the relationship labels onto the edges." anchor value "Producer" text "" assess [
  method "value"
  expected "Producer"
] {} connections [
  connection value "Consumer" text "" assess [
    method "value"
    expected "Consumer"
  ] {}
  connection value "Decomposer" text "" assess [
    method "value"
    expected "Decomposer"
  ] {}
  connection value "SunEnergy" text "" assess [
    method "value"
    expected "SunEnergy"
  ] {}
] edges [
  edge from "Producer" to "Consumer" type "solid-arrow" assess [
    method "value"
    expected "feeds"
  ] {}
  edge from "Consumer" to "Decomposer" type "solid-arrow" assess [
    method "value"
    expected "recycles"
  ] {}
  edge from "SunEnergy" to "Producer" type "dashed-arrow" assess [
    method "value"
    expected "powers"
  ] {}
] concepts [
  concept value "Producer" text "Makes its own food" {}
  concept value "Consumer" text "Eats other organisms" {}
  concept value "Decomposer" text "Breaks down dead matter" {}
  concept value "SunEnergy" text "Primary energy source" {}
] align LEFT relations [
  relation value "feeds" text "Feeds →" {}
  relation value "recycles" text "Recycles ↻" {}
  relation value "powers" text "Powers ☀" {}
] align BOTTOM {}..
```

---

### Example 62

#### Prompt
"Create a concept web where the concepts list has w, h, and rounded 'full' defaults for all tray items."

#### Chat Transcript

**User**: Create a concept web where the concepts list has w, h, and rounded 'full' defaults for all tray items.

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
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] w 24 h 24 rounded "full" align RIGHT {}..
```

---

### Example 63

#### Prompt
"Create a concept web with edges using the '*' wildcard on the from field."

#### Chat Transcript

**User**: Create a concept web with edges using the '*' wildcard on the from field.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "*" to "Hub" type "solid-arrow" {}
] {}..
```

---

### Example 64

#### Prompt
"Create a drag-and-drop concept web with concepts that have values different from their display text."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with concepts that have values different from their display text.

#### Code

```
topic "Solar System" instructions "Drag the planet names onto the correct nodes." anchor text "" assess [
  method "value"
  expected "Sun"
] {} connections [
  connection text "" assess [
    method "value"
    expected "Mercury"
  ] {}
  connection text "" assess [
    method "value"
    expected "Venus"
  ] {}
  connection text "" assess [
    method "value"
    expected "Earth"
  ] {}
  connection text "" assess [
    method "value"
    expected "Mars"
  ] {}
] concepts [
  concept value "Sun" text "The Star at Center" {}
  concept value "Mercury" text "Closest to the Sun" {}
  concept value "Venus" text "Hottest Planet" {}
  concept value "Earth" text "Our Home" {}
  concept value "Mars" text "The Red Planet" {}
] align RIGHT {}..
```

---

### Example 65

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

### Example 66

#### Prompt
"Create a concept web with edges where each edge has a different text label."

#### Chat Transcript

**User**: Create a concept web with edges where each edge has a different text label.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" text "relates to" {}
  edge from "Hub" to "Bar" type "solid" text "connects with" {}
  edge from "Hub" to "Baz" type "solid" text "leads to" {}
] {}..
```

---

### Example 67

#### Prompt
"Create a concept web where the relations list has style defaults but one relation overrides with its own bg."

#### Chat Transcript

**User**: Create a concept web where the relations list has style defaults but one relation overrides with its own bg.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "Foo" assess [
    method "value"
    expected "related"
  ] {}
  edge from "Hub" to "Bar" assess [
    method "value"
    expected "contrasts"
  ] {}
  edge from "Hub" to "Baz" assess [
    method "value"
    expected "related"
  ] {}
] relations [
  relation value "related" {}
  relation value "contrasts" bg "rose-500" color "white" {}
  relation value "supports" {}
] bg "blue-100" color "blue-800" align BOTTOM {}..
```

---

### Example 68

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

### Example 69

#### Prompt
"Create a concept web where the concepts list has round shape as defaults for all tray items."

#### Chat Transcript

**User**: Create a concept web where the concepts list has round shape as defaults for all tray items.

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
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] border "blue-500" bg "blue-200" rounded "full" align RIGHT {}..
```

---

### Example 70

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

### Example 71

#### Prompt
"Create a concept web with an anchor using small border radius for corners."

#### Chat Transcript

**User**: Create a concept web with an anchor using small border radius for corners.

#### Code

```
topic "Concept Web" anchor text "Hub" rounded "sm" assess [
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

### Example 72

#### Prompt
"Create a drag-and-drop concept web with both a concepts tray for nodes and a relations tray for edges."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with both a concepts tray for nodes and a relations tray for edges.

#### Code

```
topic "Concept Web" instructions "Drag concepts onto the nodes and relation labels onto the edges." anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "connects to"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "links to"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT relations [
  relation value "relates to" {}
  relation value "connects to" {}
  relation value "links to" {}
] align BOTTOM {}..
```

---

### Example 73

#### Prompt
"Create a drag-and-drop concept web with custom edges, blank nodes, assessment, and a right-aligned concepts tray with distractors."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with custom edges, blank nodes, assessment, and a right-aligned concepts tray with distractors.

#### Code

```
topic "Concept Web" instructions "Drag the concepts from the tray onto the correct nodes." anchor value "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" {}
  edge from "Hub" to "Bar" type "dashed-arrow" {}
  edge from "Hub" to "Baz" type "dashed" {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
  concept value "Qux" {}
  concept value "Quux" {}
] align RIGHT {}..
```

---

### Example 74

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

### Example 75

#### Prompt
"Create a concept web with the light theme."

#### Chat Transcript

**User**: Create a concept web with the light theme.

#### Code

```
topic "Concept Web" theme LIGHT anchor text "Hub" assess [
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

### Example 76

#### Prompt
"Create a concept web with an anchor that has a bg background color set."

#### Chat Transcript

**User**: Create a concept web with an anchor that has a bg background color set.

#### Code

```
topic "Concept Web" anchor text "Hub" bg "blue-500" {} connections [
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

### Example 77

#### Prompt
"Create a concept web where the concepts list, connections list, and relations list each have different container-level style defaults."

#### Chat Transcript

**User**: Create a concept web where the concepts list, connections list, and relations list each have different container-level style defaults.

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
] bg "indigo-200" color "indigo-900" rounded "xl" concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] bg "amber-300" color "amber-900" rounded "full" relations [
  relation value "relates to" {}
  relation value "depends on" {}
  relation value "contrasts with" {}
] bg "emerald-200" color "emerald-900" rounded "xs" align BOTTOM {}..
```

---

### Example 78

#### Prompt
"Create a concept web with an anchor circular."

#### Chat Transcript

**User**: Create a concept web with an anchor circular.

#### Code

```
topic "Concept Web" anchor rounded "full" text "Hub" assess [
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

### Example 79

#### Prompt
"Create a drag-and-drop concept web with image-based relation labels dragged onto assessed edges. ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)
![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)"

#### Chat Transcript

**User**: Create a drag-and-drop concept web with image-based relation labels dragged onto assessed edges. ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)
![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)

#### Code

```
topic "Concept Web" instructions "Drag the correct relationship images onto the edges." anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "thumbnail_1"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "thumbnail_2"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "thumbnail_3"
  ] {}
] relations [
  relation value "thumbnail_1" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  relation value "thumbnail_2" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  relation value "thumbnail_3" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c" {}
  relation value "thumbnail_4" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36" {}
  relation value "thumbnail_5" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9" {}
] align BOTTOM {}..
```

---

### Example 80

#### Prompt
"Create a concept web with edges where from and to both use lists of multiple node values."

#### Chat Transcript

**User**: Create a concept web with edges where from and to both use lists of multiple node values.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from [
    "Foo"
    "Bar"
  ] to [
    "Hub"
    "Baz"
  ] type "solid" {}
] {}..
```

---

### Example 81

#### Prompt
"Create a concept web with a concepts tray containing three text concepts."

#### Chat Transcript

**User**: Create a concept web with a concepts tray containing three text concepts.

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
] align RIGHT {}..
```

---

### Example 82

#### Prompt
"Create a concept web with five assessed connections and an assessed anchor, all using method 'value'."

#### Chat Transcript

**User**: Create a concept web with five assessed connections and an assessed anchor, all using method 'value'.

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

### Example 83

#### Prompt
"![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)

Create a concepts tray with two image concepts and one text-only concept."

#### Chat Transcript

**User**: ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)

**User**: Create a concepts tray with two image concepts and one text-only concept.

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
] concepts [
  concept value "Foo" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  concept value "Bar" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  concept value "Baz" {}
] align RIGHT {}..
```

---

### Example 84

#### Prompt
"Create a concept web with a relations tray containing two relation labels."

#### Chat Transcript

**User**: Create a concept web with a relations tray containing two relation labels.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" assess [
    method "value"
    expected "relates to"
  ] {}
] relations [
  relation value "relates to" {}
  relation value "depends on" {}
] align BOTTOM {}..
```

---

### Example 85

#### Prompt
"Create a concept web with background and text color applied to individual connections."

#### Chat Transcript

**User**: Create a concept web with background and text color applied to individual connections.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" bg "red-500" color "white" {}
  connection text "Bar" bg "green-600" color "white" {}
  connection text "Baz" bg "blue-500" color "white" {}
] {}..
```

---

### Example 86

#### Prompt
"Create a concept web with an edge that has an image at the midpoint. ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)"

#### Chat Transcript

**User**: Create a concept web with an edge that has an image at the midpoint. ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  edge from "Hub" to "Bar" type "solid" {}
  edge from "Hub" to "Baz" type "solid" {}
] {}..
```

---

### Example 87

#### Prompt
"Create a concept web with a topic and instructions, but no nodes."

#### Chat Transcript

**User**: Create a concept web with a topic and instructions, but no nodes.

#### Code

```
topic "Concept Web" instructions "Add your instructions here." {}..
```

---

### Example 88

#### Prompt
"Create a concept web with custom edges where one edge has assessment expecting a specific value."

#### Chat Transcript

**User**: Create a concept web with custom edges where one edge has assessment expecting a specific value.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" text "relates to" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Bar" type "dashed" text "connects with" {}
  edge from "Hub" to "Baz" type "solid-arrow" text "leads to" {}
] {}..
```

---

### Example 89

#### Prompt
"Create a concept web with connections that have assessment on each node."

#### Chat Transcript

**User**: Create a concept web with connections that have assessment on each node.

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
] {
  v: 2
}..
```

---

### Example 90

#### Prompt
"Create a concept web with an edge where to is a list of two node values."

#### Chat Transcript

**User**: Create a concept web with an edge where to is a list of two node values.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to [
    "Foo"
    "Bar"
  ] type "solid" {}
  edge from "Hub" to "Baz" type "dashed" {}
] {}..
```

---

### Example 91

#### Prompt
"![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)

Create a concept with a value and an image URL."

#### Chat Transcript

**User**: ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)

**User**: Create a concept with a value and an image URL.

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
] concepts [
  concept value "Hub" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd62983b8-6b83-4088-b4aa-5388ee03a96b_gc-logo-sm.png?alt=media&token=24ae2e84-d1cc-44a5-8f24-437187d9380a" {}
] {}..
```

---

### Example 92

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

### Example 93

#### Prompt
"Create an assessed concept web with a topic, anchor, and three assessed connections. No concepts tray."

#### Chat Transcript

**User**: Create an assessed concept web with a topic, anchor, and three assessed connections. No concepts tray.

#### Code

```
topic "Concept Web" instructions "Explore the connections between the central concept and its related ideas." anchor text "Hub" {} connections [
  connection text "Foo" {}
  connection text "Bar" {}
] {}..
```

---

### Example 94

#### Prompt
"Create a concept web with a concepts tray aligned to the right."

#### Chat Transcript

**User**: Create a concept web with a concepts tray aligned to the right.

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

### Example 95

#### Prompt
"Create a concept web where the connections list has bg and color defaults applied to all children."

#### Chat Transcript

**User**: Create a concept web where the connections list has bg and color defaults applied to all children.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" {}
  connection text "Bar" {}
  connection text "Baz" {}
] bg "blue-500" color "white" {}..
```

---

### Example 96

#### Prompt
"Create a concept web with custom edges where some edges are assessed and others are display-only."

#### Chat Transcript

**User**: Create a concept web with custom edges where some edges are assessed and others are display-only.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" text "leads to" assess [
    method "value"
    expected "leads to"
  ] {}
  edge from "Hub" to "Bar" type "dashed" text "relates to" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Baz" type "solid" text "see also" {}
] {}..
```

---

### Example 97

#### Prompt
"Create a concept web with a concepts tray aligned to the bottom."

#### Chat Transcript

**User**: Create a concept web with a concepts tray aligned to the bottom.

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

### Example 98

#### Prompt
"Create a concept web with an anchor using rounded 'none' for sharp corners."

#### Chat Transcript

**User**: Create a concept web with an anchor using rounded 'none' for sharp corners.

#### Code

```
topic "Concept Web" anchor text "Hub" rounded "none" assess [
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

### Example 99

#### Prompt
"Create a concept web where connections use both value and text with different strings."

#### Chat Transcript

**User**: Create a concept web where connections use both value and text with different strings.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo Display" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar Display" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz Display" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 100

#### Prompt
"![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

Create a drag-and-drop concept web with three image concepts and assessment on the nodes."

#### Chat Transcript

**User**: ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

**User**: Create a drag-and-drop concept web with three image concepts and assessment on the nodes.

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

### Example 101

#### Prompt
"Create a concept web where each connection has a value set."

#### Chat Transcript

**User**: Create a concept web where each connection has a value set.

#### Code

```
topic "Concept Web" anchor text "Hub" value "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" value "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" value "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" value "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 102

#### Prompt
"Create a concept web with two connections, each with different text labels."

#### Chat Transcript

**User**: Create a concept web with two connections, each with different text labels.

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

### Example 103

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

### Example 104

#### Prompt
"Create a concept web with three connections where expected values are single-word strings."

#### Chat Transcript

**User**: Create a concept web with three connections where expected values are single-word strings.

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

### Example 105

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

### Example 106

#### Prompt
"Create a concept web with an anchor that has assessment expecting a specific value."

#### Chat Transcript

**User**: Create a concept web with an anchor that has assessment expecting a specific value.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Anchor" assess [
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

### Example 107

#### Prompt
"Create a concept web with an edge that has a text label at the midpoint."

#### Chat Transcript

**User**: Create a concept web with an edge that has a text label at the midpoint.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" text "related" {}
  edge from "Hub" to "Bar" type "solid" {}
  edge from "Hub" to "Baz" type "solid" {}
] {}..
```

---

### Example 108

#### Prompt
"Create a concept web where the anchor and all connections are assessed."

#### Chat Transcript

**User**: Create a concept web where the anchor and all connections are assessed.

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

### Example 109

#### Prompt
"Create a concept web with mixed edge types — some solid and some dashed."

#### Chat Transcript

**User**: Create a concept web with mixed edge types — some solid and some dashed.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" {}
  edge from "Hub" to "Bar" type "dashed" {}
  edge from "Hub" to "Baz" type "dashed" {}
] {}..
```

---

### Example 110

#### Prompt
"Create a concept web with bg applied to edges."

#### Chat Transcript

**User**: Create a concept web with bg applied to edges.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" text "foo" bg "blue-500" {}
  edge from "Hub" to "Bar" type "solid" bg "green-500" {}
  edge from "Hub" to "Baz" type "solid" bg "red-500" {}
] {}..
```

---

### Example 111

#### Prompt
"Create a drag-and-drop concept web where all connection texts are blank and concepts provide the answers."

#### Chat Transcript

**User**: Create a drag-and-drop concept web where all connection texts are blank and concepts provide the answers.

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

### Example 112

#### Prompt
"Create a concept web with the dark theme."

#### Chat Transcript

**User**: Create a concept web with the dark theme.

#### Code

```
topic "Concept Web" theme DARK anchor text "Hub" assess [
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

### Example 113

#### Prompt
"![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

Create a drag-and-drop concept web where concepts use images instead of text."

#### Chat Transcript

**User**: ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

**User**: Create a drag-and-drop concept web where concepts use images instead of text.

#### Code

```
topic "Concept Web" instructions "Drag the images onto the correct nodes." anchor text "" assess [
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
  concept value "Hub" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36" {}
  concept value "Foo" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  concept value "Bar" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  concept value "Baz" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c" {}
] align RIGHT {}..
```

---

### Example 114

#### Prompt
"Create a concept web with a concepts tray aligned to the top."

#### Chat Transcript

**User**: Create a concept web with a concepts tray aligned to the top.

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

### Example 115

#### Prompt
"Create a concept web with a relations tray aligned to the left."

#### Chat Transcript

**User**: Create a concept web with a relations tray aligned to the left.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "Foo" assess [
    method "value"
    expected "related"
  ] {}
  edge from "Hub" to "Bar" assess [
    method "value"
    expected "related"
  ] {}
  edge from "Hub" to "Baz" assess [
    method "value"
    expected "related"
  ] {}
] relations [
  relation value "related" {}
] align LEFT {}..
```

---

### Example 116

#### Prompt
"Create a drag-and-drop concept web with custom edges and a concepts tray."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with custom edges and a concepts tray.

#### Code

```
topic "Concept Web" anchor value "Hub" text "" assess [
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
] align RIGHT edges [
  edge from "Hub" to "*" type "solid" {}
] {}..
```

---

### Example 117

#### Prompt
"Create a concept web with an empty edges list so no edges are rendered."

#### Chat Transcript

**User**: Create a concept web with an empty edges list so no edges are rendered.

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
] edges [] {}..
```

---

### Example 118

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

### Example 119

#### Prompt
"Create a concept web with four connections."

#### Chat Transcript

**User**: Create a concept web with four connections.

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
] {}..
```

---

### Example 120

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

### Example 121

#### Prompt
"Create a fully featured concept web with topic, markdown instructions, dark theme, custom edges with mixed types and text labels, assessed anchor and connections, and a bottom-aligned concepts tray with image concepts and text distractors."

#### Chat Transcript

**User**: Create a fully featured concept web with topic, markdown instructions, dark theme, custom edges with mixed types and text labels, assessed anchor and connections, and a bottom-aligned concepts tray with image concepts and text distractors.

#### Code

```
topic "Fully Featured Concept Web" instructions "**Instructions:** Drag the concepts from the tray below onto the correct nodes.
- The **center node** is the main topic
- Solid arrows show primary relationships
- Dashed lines show secondary connections
- Use the labels on edges as hints!" theme DARK anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
  connection value "Qux" text "" assess [
    method "value"
    expected "Qux"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" text "leads to" {}
  edge from "Hub" to "Bar" type "solid-arrow" text "relates to" {}
  edge from "Hub" to "Baz" type "dashed-arrow" text "connects" {}
  edge from "Hub" to "Qux" type "dashed" text "influences" {}
  edge from "Foo" to "Bar" type "dashed" text "linked" {}
  edge from "Baz" to "Qux" type "dashed" text "similar" {}
] concepts [
  concept value "Hub" image "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Circle_-_black_simple.svg/120px-Circle_-_black_simple.svg.png" {}
  concept value "Foo" image "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/120px-PNG_transparency_demonstration_1.png" {}
  concept value "Bar" image "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/120px-Camponotus_flavomarginatus_ant.jpg" {}
  concept value "Baz" image "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Felis_silvestris_catus_lying_on_rice_straw.jpg/120px-Felis_silvestris_catus_lying_on_rice_straw.jpg" {}
  concept value "Qux" image "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Solar_system.jpg/120px-Solar_system.jpg" {}
  concept value "Distractor1" text "Wrong A" {}
  concept value "Distractor2" text "Wrong B" {}
  concept value "Distractor3" text "Wrong C" {}
] align BOTTOM {}..
```

---

### Example 122

#### Prompt
"Create a concept web with an anchor using method VALUE tag instead of string 'value'."

#### Chat Transcript

**User**: Create a concept web with an anchor using method VALUE tag instead of string 'value'.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method VALUE
  expected "Hub"
] {} connections [
  connection assess [
    method VALUE
    expected "Foo"
  ] {}
  connection assess [
    method VALUE
    expected "Bar"
  ] {}
  connection assess [
    method VALUE
    expected "Baz"
  ] {}
] {
  v: 4
}..
```

---

### Example 123

#### Prompt
"Create a concept web where only the anchor is assessed and connections are display-only."

#### Chat Transcript

**User**: Create a concept web where only the anchor is assessed and connections are display-only.

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

### Example 124

#### Prompt
"Create a concept web with six connections around a central anchor."

#### Chat Transcript

**User**: Create a concept web with six connections around a central anchor.

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
  connection text "Corge" assess [
    method "value"
    expected "Corge"
  ] {}
] {}..
```

---

### Example 125

#### Prompt
"Create a concept web with three connections arranged around the anchor."

#### Chat Transcript

**User**: Create a concept web with three connections arranged around the anchor.

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

### Example 126

#### Prompt
"Create a concept web where the anchor is styled differently from connections using different bg and rounded values."

#### Chat Transcript

**User**: Create a concept web where the anchor is styled differently from connections using different bg and rounded values.

#### Code

```
topic "Concept Web" anchor text "Hub" bg "indigo-600" color "white" rounded "full" {} connections [
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
] bg "sky-100" rounded "lg" {}..
```

---

### Example 127

#### Prompt
"Create a concept web with a relation that uses an image for display. ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)"

#### Chat Transcript

**User**: Create a concept web with a relation that uses an image for display. ![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
] relations [
  relation value "relates to" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
] align BOTTOM {}..
```

---

### Example 128

#### Prompt
"Create a drag-and-drop concept web with four blank connections, four concepts, and assessment on every node."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with four blank connections, four concepts, and assessment on every node.

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
  connection text "" assess [
    method "value"
    expected "Qux"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
  concept value "Qux" {}
] align RIGHT {}..
```

---

### Example 129

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

### Example 130

#### Prompt
"Create a concept web with custom edges, light theme, topic, instructions, and images on connections."

#### Chat Transcript

**User**: Create a concept web with custom edges, light theme, topic, instructions, and images on connections.

#### Code

```
topic "Concept Web" instructions "Explore the connections between concepts below. Each node is linked by custom edges." theme LIGHT anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" image "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/120px-PNG_transparency_demonstration_1.png" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" image "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/120px-Camponotus_flavomarginatus_ant.jpg" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" image "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Felis_silvestris_catus_lying_on_rice_straw.jpg/120px-Felis_silvestris_catus_lying_on_rice_straw.jpg" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" text "leads to" {}
  edge from "Hub" to "Bar" type "dashed-arrow" text "relates to" {}
  edge from "Hub" to "Baz" type "dashed" text "connects" {}
  edge from "Foo" to "Bar" type "dashed" text "linked" {}
] {}..
```

---

### Example 131

#### Prompt
"Create a concept web with three connections, each assessed with method 'value' and different expected values."

#### Chat Transcript

**User**: Create a concept web with three connections, each assessed with method 'value' and different expected values.

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

### Example 132

#### Prompt
"Create a concept web with an anchor that has a specific text color."

#### Chat Transcript

**User**: Create a concept web with an anchor that has a specific text color.

#### Code

```
topic "Concept Web" anchor text "Hub" color "red-500" assess [
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

### Example 133

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

### Example 134

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

### Example 135

#### Prompt
"Create an assessed concept web where the anchor expects the value "Main"."

#### Chat Transcript

**User**: Create an assessed concept web where the anchor expects the value "Main".

#### Code

```
topic "Concept Web" anchor text "Main" assess [
  method "value"
  expected "Main"
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

### Example 136

#### Prompt
"Create a concept web where assessment uses the VALUE tag instead of the string 'value'."

#### Chat Transcript

**User**: Create a concept web where assessment uses the VALUE tag instead of the string 'value'.

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method VALUE
  expected "Hub"
] {} connections [
  connection text "Foo" assess [
    method VALUE
    expected "Foo"
  ] {}
  connection text "Bar" assess [
    method VALUE
    expected "Bar"
  ] {}
  connection text "Baz" assess [
    method VALUE
    expected "Baz"
  ] {}
] {}..
```

---

### Example 137

#### Prompt
"Create a concept web where the anchor has a value, display text override, and assessment."

#### Chat Transcript

**User**: Create a concept web where the anchor has a value, display text override, and assessment.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Central Hub" assess [
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

### Example 138

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

### Example 139

#### Prompt
"Create a concept web where the edges list has style defaults applied to all edge children."

#### Chat Transcript

**User**: Create a concept web where the edges list has style defaults applied to all edge children.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" {}
  edge from "Hub" to "Bar" {}
  edge from "Hub" to "Baz" {}
] type "solid-arrow" color "white" {
  v: 1
}..
```

---

### Example 140

#### Prompt
"Create a concept web with a single solid edge from the anchor to one connection."

#### Chat Transcript

**User**: Create a concept web with a single solid edge from the anchor to one connection.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" {}
] {}..
```

---

### Example 141

#### Prompt
"Create a concept web with three connections, only two of which are assessed."

#### Chat Transcript

**User**: Create a concept web with three connections, only two of which are assessed.

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
  connection text "Baz" {}
] {}..
```

---

### Example 142

#### Prompt
"Create a concept web with a topic, instructions, dark theme, anchor, and four connections. No assessment."

#### Chat Transcript

**User**: Create a concept web with a topic, instructions, dark theme, anchor, and four connections. No assessment.

#### Code

```
topic "Concept Web" instructions "Explore the connections between concepts." anchor text "Hub" {} connections [
  connection text "Foo" {}
  connection text "Bar" {}
  connection text "Baz" {}
  connection text "Qux" {}
] theme DARK {}..
```

---

### Example 143

#### Prompt
"Create a drag-and-drop concept web with exactly one distractor concept in the tray."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with exactly one distractor concept in the tray.

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
  concept value "Qux" {}
] align RIGHT {}..
```

---

### Example 144

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

### Example 145

#### Prompt
"Create a concept web with an anchor using a raw CSS rounded value like '50% / 25%' for custom border radius."

#### Chat Transcript

**User**: Create a concept web with an anchor using a raw CSS rounded value like '50% / 25%' for custom border radius.

#### Code

```
topic "Concept Web" anchor text "Hub" rounded "50% / 25%" assess [
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

### Example 146

#### Prompt
"![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

Create a concepts tray with images aligned to the top of the diagram."

#### Chat Transcript

**User**: ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

**User**: Create a concepts tray with images aligned to the top of the diagram.

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
  concept value "Hub" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36" {}
  concept value "Foo" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  concept value "Bar" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  concept value "Baz" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c" {}
] align TOP {}..
```

---

### Example 147

#### Prompt
"Create a concept web with a topic, instructions, assessed anchor, three assessed connections, and a right-aligned concepts tray with matching items."

#### Chat Transcript

**User**: Create a concept web with a topic, instructions, assessed anchor, three assessed connections, and a right-aligned concepts tray with matching items.

#### Code

```
topic "Concept Web" instructions "Drag the concepts from the tray onto the correct nodes." anchor text "" assess [
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

### Example 148

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

### Example 149

#### Prompt
"Create a concept web with an anchor that uses w and h to set a custom size."

#### Chat Transcript

**User**: Create a concept web with an anchor that uses w and h to set a custom size.

#### Code

```
topic "Concept Web" anchor w 32 h 32 text "Hub" assess [
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
] {
  v: 1
}..
```

---

### Example 150

#### Prompt
"Create a concept web with bg and border on relation labels in the tray."

#### Chat Transcript

**User**: Create a concept web with bg and border on relation labels in the tray.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" text "foo" type "solid" {}
] relations [
  relation value "relates to" bg "blue-500" border "blue-700" color "white" {}
  relation value "depends on" bg "emerald-500" border "emerald-700" color "white" {}
  relation value "contrasts with" bg "rose-500" border "rose-700" color "white" {}
] align BOTTOM {}..
```

---

### Example 151

#### Prompt
"give all connections a blue background and white text"

#### Chat Transcript

**User**: give all connections a blue background and white text

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" {}
  connection text "Bar" {}
  connection text "Baz" {}
] bg "blue-500" color "white" {}..
```

---

### Example 152

#### Prompt
"Create a concept web with an anchor using rounded 'full' to make it circular."

#### Chat Transcript

**User**: Create a concept web with an anchor using rounded 'full' to make it circular.

#### Code

```
topic "Concept Web" anchor text "Hub" rounded "full" assess [
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

### Example 153

#### Prompt
"Create a concept web with a relations tray aligned to the bottom."

#### Chat Transcript

**User**: Create a concept web with a relations tray aligned to the bottom.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "*" type "solid" assess [
    method "value"
    expected "related"
  ] {}
] relations [
  relation value "related" {}
] align BOTTOM {}..
```

---

### Example 154

#### Prompt
"Create a concept web with edges where one edge uses '*' wildcard and another uses a specific list for from. make the node text blank but provide a tray of concept and validation on each connection"

#### Chat Transcript

**User**: Create a concept web with edges where one edge uses '*' wildcard and another uses a specific list for from. make the node text blank but provide a tray of concept and validation on each connection

#### Code

```
topic "Concept Web" instructions "Drag the concepts from the tray onto the correct nodes." anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "*" to "Hub" type "solid-arrow" {}
  edge from [
    "Foo"
    "Bar"
  ] to "Baz" type "dashed" text "related" {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT {}..
```

---

### Example 155

#### Prompt
"Create a concept web with a relations tray aligned to the top."

#### Chat Transcript

**User**: Create a concept web with a relations tray aligned to the top.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" {} connections [
  connection value "Foo" text "Foo" {}
  connection value "Bar" text "Bar" {}
  connection value "Baz" text "Baz" {}
] edges [
  edge from "Hub" to "*" type "solid" assess [
    method "value"
    expected "related"
  ] {}
] relations [
  relation value "related" {}
] align TOP {}..
```

---

### Example 156

#### Prompt
"Create a concept web with a relation that has a value for scoring."

#### Chat Transcript

**User**: Create a concept web with a relation that has a value for scoring.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
] relations [
  relation value "relates to" {}
] align BOTTOM {}..
```

---

### Example 157

#### Prompt
"Create a concept web with dashed edges, assessment, and a left-aligned concepts tray."

#### Chat Transcript

**User**: Create a concept web with dashed edges, assessment, and a left-aligned concepts tray.

#### Code

```
topic "Concept Web" anchor value "Hub" assess [
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
] edges [
  edge from "Hub" to "*" type "dashed" {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align LEFT {}..
```

---

### Example 158

#### Prompt
"Create a concept web with just an anchor node labeled "Center"."

#### Chat Transcript

**User**: Create a concept web with just an anchor node labeled "Center".

#### Code

```
topic "Concept Web" anchor text "Center" {} {}..
```

---

### Example 159

#### Prompt
"Create a concept web with a concepts tray containing five items."

#### Chat Transcript

**User**: Create a concept web with a concepts tray containing five items.

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
  concept value "Qux" {}
] align RIGHT {}..
```

---

### Example 160

#### Prompt
"Create a concept web with solid-arrow edges from anchor to connections and a dashed-arrow edge between two connections."

#### Chat Transcript

**User**: Create a concept web with solid-arrow edges from anchor to connections and a dashed-arrow edge between two connections.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid-arrow" {}
  edge from "Foo" to "Bar" type "dashed-arrow" {}
] {}..
```

---

### Example 161

#### Prompt
"Create a concept web where one connection has no assessment and the others do."

#### Chat Transcript

**User**: Create a concept web where one connection has no assessment and the others do.

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
  connection text "Bar" {}
  connection text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 162

#### Prompt
"Create a concept web with two assessed connections using method VALUE tag."

#### Chat Transcript

**User**: Create a concept web with two assessed connections using method VALUE tag.

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

### Example 163

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

### Example 164

#### Prompt
"Create a concept web with circular of specific radius on concepts in the tray."

#### Chat Transcript

**User**: Create a concept web with circular of specific radius on concepts in the tray.

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
] concepts [
  concept value "Hub" rounded "full" w 20 h 20 {}
  concept value "Foo" rounded "full" w 20 h 20 {}
  concept value "Bar" rounded "full" w 20 h 20 {}
  concept value "Baz" rounded "full" w 20 h 20 {}
] align RIGHT {}..
```

---

### Example 165

#### Prompt
"Create a concept web with an assessed anchor and four assessed connections."

#### Chat Transcript

**User**: Create a concept web with an assessed anchor and four assessed connections.

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
] {}..
```

---

### Example 166

#### Prompt
"Create a drag-and-drop concept web with three blank nodes and three matching concepts in the tray."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with three blank nodes and three matching concepts in the tray.

#### Code

```
topic "Concept Web" anchor text "Hub" {} connections [
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

### Example 167

#### Prompt
"Create a concept web with mixed edge types, text labels on edges, and assessment on all nodes."

#### Chat Transcript

**User**: Create a concept web with mixed edge types, text labels on edges, and assessment on all nodes.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" text "relates to" {}
  edge from "Hub" to "Bar" type "dashed" text "connects with" {}
  edge from "Hub" to "Baz" type "dashed-arrow" text "leads to" {}
] {}..
```

---

### Example 168

#### Prompt
"Create a concept web with edges that mix solid, dashed, solid-arrow, and dashed-arrow types."

#### Chat Transcript

**User**: Create a concept web with edges that mix solid, dashed, solid-arrow, and dashed-arrow types.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" {}
  edge from "Hub" to "Bar" type "dashed" {}
  edge from "Hub" to "Baz" type "solid-arrow" {}
  edge from "Foo" to "Bar" type "dashed-arrow" text "related" {}
] {}..
```

---

### Example 169

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

### Example 170

#### Prompt
"![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

Create a drag-and-drop concept web where image concepts have values that differ from the image URL."

#### Chat Transcript

**User**: ![thumbnail_4](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36)
![thumbnail_5](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F30937792-d124-4e11-ac9c-655e09e93446_thumbnail_5.png?alt=media&token=8ab2e9be-bdb0-4fde-95e6-52bdfbd3f0f9)
![thumbnail_1](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557)
![thumbnail_2](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a)
![thumbnail_3](https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c)

**User**: Create a drag-and-drop concept web where image concepts have values that differ from the image URL.

#### Code

```
topic "Concept Web" instructions "Drag the images onto the correct nodes." anchor text "" assess [
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
  concept value "Hub" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F84b31270-b402-4c11-beaf-4e0a7772a671_thumbnail_4.png?alt=media&token=49a2e8d1-75fa-4d46-b30f-76aab84d2a36" {}
  concept value "Foo" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2Fd27e745e-b6d1-4a3b-a504-b01bdea0f416_thumbnail_1.png?alt=media&token=51a8781d-bab5-45c0-ab5b-38a4dbfb0557" {}
  concept value "Bar" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F8fa5c11a-2146-48f9-8862-79ce6af6db75_thumbnail_2.png?alt=media&token=98efcf39-1991-43cc-b6a2-d1cc65479b0a" {}
  concept value "Baz" image "https://firebasestorage.googleapis.com/v0/b/graffiticode.appspot.com/o/uploads%2F24493e1c7a7f1ad57e3c478087c74c2dacb0cba1%2F9a421a6c-2f51-4356-b1c3-7020dc6c1faa_thumbnail_3.png?alt=media&token=0f9ffcb3-a94a-48d6-940c-d89c0a2b714c" {}
] align RIGHT {}..
```

---

### Example 171

#### Prompt
"Create a drag-and-drop concept web with a relations tray containing more relations than edges as distractors."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with a relations tray containing more relations than edges as distractors.

#### Code

```
topic "Concept Web" instructions "Drag the concepts onto the correct nodes, then drag the correct relationship labels onto the edges." anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "causes"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "supports"
  ] {}
  edge from "Hub" to "Baz" type "dashed-arrow" assess [
    method "value"
    expected "inhibits"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT relations [
  relation value "causes" {}
  relation value "supports" {}
  relation value "inhibits" {}
  relation value "requires" {}
  relation value "produces" {}
  relation value "blocks" {}
] align BOTTOM {}..
```

---

### Example 172

#### Prompt
"Create a concept web with background and border on relation labels in the tray."

#### Chat Transcript

**User**: Create a concept web with background and border on relation labels in the tray.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" assess [
    method "value"
    expected "relates to"
  ] {}
] relations [
  relation value "relates to" bg "blue-100" border "blue-400" {}
  relation value "depends on" bg "green-100" border "green-400" {}
] align BOTTOM {}..
```

---

### Example 173

#### Prompt
"Create a concept web with a peer-to-peer edge that has both a text label and a specific type."

#### Chat Transcript

**User**: Create a concept web with a peer-to-peer edge that has both a text label and a specific type.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" {}
  edge from "Hub" to "Bar" type "solid" {}
  edge from "Hub" to "Baz" type "solid" {}
  edge from "Foo" to "Bar" type "dashed" text "peer" {}
] {}..
```

---

### Example 174

#### Prompt
"Create a concept web with a peer-to-peer edge between two connections, not through the anchor."

#### Chat Transcript

**User**: Create a concept web with a peer-to-peer edge between two connections, not through the anchor.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" {}
  edge from "Foo" to "Bar" type "dashed" text "related" {}
] {}..
```

---

### Example 175

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

### Example 176

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

### Example 177

#### Prompt
"Create a drag-and-drop concept web where the anchor text is blank and the concepts tray has the answer."

#### Chat Transcript

**User**: Create a drag-and-drop concept web where the anchor text is blank and the concepts tray has the answer.

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

### Example 178

#### Prompt
"Create a drag-and-drop concept web with a concepts tray aligned right and a relations tray aligned bottom, with assessment on both nodes and edges. *"

#### Chat Transcript

**User**: Create a drag-and-drop concept web with a concepts tray aligned right and a relations tray aligned bottom, with assessment on both nodes and edges. *

#### Code

```
topic "Concept Web" instructions "Drag the concepts onto the correct nodes, then drag the relationship labels onto the edges." anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "causes"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "supports"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "relates to"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT relations [
  relation value "causes" {}
  relation value "supports" {}
  relation value "relates to" {}
] align BOTTOM {}..
```

---

### Example 179

#### Prompt
"Create a concept web where the relations list has bg, color, and border defaults applied to all relation children."

#### Chat Transcript

**User**: Create a concept web where the relations list has bg, color, and border defaults applied to all relation children.

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
] relations [
  relation value "activates" {}
  relation value "inhibits" {}
  relation value "requires" {}
] bg "violet-100" color "violet-800" border "violet-400" align BOTTOM {}..
```

---

### Example 180

#### Prompt
"Create an assessed concept web with a topic, anchor, and three assessed connections. No concepts tray."

#### Chat Transcript

**User**: Create an assessed concept web with a topic, anchor, and three assessed connections. No concepts tray.

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

### Example 181

#### Prompt
"Create a concept web with dashed edges from the anchor to all connections."

#### Chat Transcript

**User**: Create a concept web with dashed edges from the anchor to all connections.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "dashed" {}
] {}..
```

---

### Example 182

#### Prompt
"Create a concept web with an anchor using width, height, rounded, backgrounds, text color, and border all together."

#### Chat Transcript

**User**: Create a concept web with an anchor using width, height, rounded, backgrounds, text color, and border all together.

#### Code

```
topic "Concept Web" anchor text "Hub" w 28 h 28 rounded "full" bg "indigo-600" color "white" border "indigo-300" {} connections [
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

### Example 183

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

### Example 184

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

### Example 185

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

### Example 186

#### Prompt
"Create a concept web with a topic, five connections with assessment, and a concepts tray with five items plus two distractors aligned to the left."

#### Chat Transcript

**User**: Create a concept web with a topic, five connections with assessment, and a concepts tray with five items plus two distractors aligned to the left.

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
  connection text "" assess [
    method "value"
    expected "Qux"
  ] {}
  connection text "" assess [
    method "value"
    expected "Quux"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
  concept value "Qux" {}
  concept value "Quux" {}
  concept value "Corge" {}
  concept value "Grault" {}
] align LEFT {}..
```

---

### Example 187

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

### Example 188

#### Prompt
"Create a concept web with connections where text is set to empty strings for drag-and-drop."

#### Chat Transcript

**User**: Create a concept web with connections where text is set to empty strings for drag-and-drop.

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

### Example 189

#### Prompt
"Create a concept web with edges where one edge uses '*' wildcard and another uses a specific list for from."

#### Chat Transcript

**User**: Create a concept web with edges where one edge uses '*' wildcard and another uses a specific list for from.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "*" to "Hub" type "solid-arrow" {}
  edge from [
    "Foo"
    "Bar"
  ] to "Baz" type "dashed" text "related" {}
] {}..
```

---

### Example 190

#### Prompt
"Create a drag-and-drop concept web with three assessed edges and three matching relation labels in the tray."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with three assessed edges and three matching relation labels in the tray.

#### Code

```
topic "Concept Web" instructions "Drag the concept labels onto the nodes, then drag the relation labels onto the edges." anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "causes"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "supports"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "inhibits"
  ] {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT relations [
  relation value "causes" {}
  relation value "supports" {}
  relation value "inhibits" {}
] align BOTTOM {}..
```

---

### Example 191

#### Prompt
"Create a concept web with custom edges where every edge is assessed with different expected values."

#### Chat Transcript

**User**: Create a concept web with custom edges where every edge is assessed with different expected values.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid" text "relates to" assess [
    method "value"
    expected "relates to"
  ] {}
  edge from "Hub" to "Bar" type "dashed" text "connects with" assess [
    method "value"
    expected "connects with"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" text "leads to" assess [
    method "value"
    expected "leads to"
  ] {}
] {}..
```

---

### Example 192

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

### Example 193

#### Prompt
"Create a concept web where the connections list has style defaults but one connection overrides with its own background."

#### Chat Transcript

**User**: Create a concept web where the connections list has style defaults but one connection overrides with its own background.

#### Code

```
topic "Concept Web" anchor text "Hub" {} connections [
  connection text "Foo" {}
  connection text "Bar" bg "rose-500" {}
  connection text "Baz" {}
] bg "blue-500" color "white" {}..
```

---

### Example 194

#### Prompt
"Create a concept web with dashed-arrow edges from the anchor to all connections."

#### Chat Transcript

**User**: Create a concept web with dashed-arrow edges from the anchor to all connections.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "dashed-arrow" {}
] {}..
```

---

### Example 195

#### Prompt
"Create a concept web with solid-arrow edges from the anchor to all connections."

#### Chat Transcript

**User**: Create a concept web with solid-arrow edges from the anchor to all connections.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid-arrow" {}
] {}..
```

---

### Example 196

#### Prompt
"Create a concept web with an anchor assessed with method 'value' and an expected value."

#### Chat Transcript

**User**: Create a concept web with an anchor assessed with method 'value' and an expected value.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Anchor" assess [
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

### Example 197

#### Prompt
"Create a concept web where nodes have custom bg colors and assessment is active, showing that green/red assessment overrides the custom bg."

#### Chat Transcript

**User**: Create a concept web where nodes have custom bg colors and assessment is active, showing that green/red assessment overrides the custom bg.

#### Code

```
topic "Concept Web" instructions "Assessment is active — green/red overrides the custom background colors on each node." anchor text "Hub" bg "indigo-500" color "white" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "Foo" bg "amber-400" color "white" assess [
    method "value"
    expected "Foo"
  ] {}
  connection text "Bar" bg "rose-400" color "white" assess [
    method "value"
    expected "Bar"
  ] {}
  connection text "Baz" bg "teal-400" color "white" assess [
    method "value"
    expected "Baz"
  ] {}
] {}..
```

---

### Example 198

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

### Example 199

#### Prompt
"Create a concept web with a relation that sets the background color, border and text color together for full styling."

#### Chat Transcript

**User**: Create a concept web with a relation that sets the background color, border and text color together for full styling.

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
] edges [
  edge from "Hub" to "*" type "solid" assess [
    method "value"
    expected "relates"
  ] {}
] relations [
  relation value "relates" bg "violet-600" color "white" border "violet-800" {}
] align BOTTOM {}..
```

---

### Example 200

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

### Example 201

#### Prompt
"create a concept web that has 10 connections associated with the anchor fruit. make the connections ten fruit and create peer connections based on the region of farming

order the nodes so that the regions are adjacent

remove the edges from the anchor to the connections and leave the peer connections

move all concepts into a tray and add validations for each of the connection nodes

give the anchor as a freebee validation"

#### Chat Transcript

**User**: create a concept web that has 10 connections associated with the anchor fruit. make the connections ten fruit and create peer connections based on the region of farming

**User**: order the nodes so that the regions are adjacent

**User**: remove the edges from the anchor to the connections and leave the peer connections

**User**: move all concepts into a tray and add validations for each of the connection nodes

**User**: give the anchor as a freebee validation

#### Code

```
topic "Fruit Concept Web" instructions "Explore how fruits are connected by their farming regions around the world." anchor value "Fruit" text "Fruit" assess [
  method "value"
  expected "Fruit"
] {} connections [
  connection value "Apple" text "" assess [
    method "value"
    expected "Apple"
  ] {}
  connection value "Peach" text "" assess [
    method "value"
    expected "Peach"
  ] {}
  connection value "Grape" text "" assess [
    method "value"
    expected "Grape"
  ] {}
  connection value "Strawberry" text "" assess [
    method "value"
    expected "Strawberry"
  ] {}
  connection value "Orange" text "" assess [
    method "value"
    expected "Orange"
  ] {}
  connection value "Mango" text "" assess [
    method "value"
    expected "Mango"
  ] {}
  connection value "Banana" text "" assess [
    method "value"
    expected "Banana"
  ] {}
  connection value "Pineapple" text "" assess [
    method "value"
    expected "Pineapple"
  ] {}
  connection value "Coconut" text "" assess [
    method "value"
    expected "Coconut"
  ] {}
  connection value "Papaya" text "" assess [
    method "value"
    expected "Papaya"
  ] {}
] edges [
  edge from "Fruit" to "*" {}
  edge from "Apple" to "Grape" type "dashed" text "Temperate" {}
  edge from "Apple" to "Peach" type "dashed" text "Temperate" {}
  edge from "Apple" to "Strawberry" type "dashed" text "Temperate" {}
  edge from "Grape" to "Peach" type "dashed" text "Temperate" {}
  edge from "Grape" to "Strawberry" type "dashed" text "Temperate" {}
  edge from "Peach" to "Strawberry" type "dashed" text "Temperate" {}
  edge from "Mango" to "Banana" type "dashed" text "Tropical" {}
  edge from "Mango" to "Pineapple" type "dashed" text "Tropical" {}
  edge from "Mango" to "Coconut" type "dashed" text "Tropical" {}
  edge from "Mango" to "Papaya" type "dashed" text "Tropical" {}
  edge from "Banana" to "Pineapple" type "dashed" text "Tropical" {}
  edge from "Banana" to "Coconut" type "dashed" text "Tropical" {}
  edge from "Banana" to "Papaya" type "dashed" text "Tropical" {}
  edge from "Pineapple" to "Coconut" type "dashed" text "Tropical" {}
  edge from "Pineapple" to "Papaya" type "dashed" text "Tropical" {}
  edge from "Coconut" to "Papaya" type "dashed" text "Tropical" {}
  edge from "Orange" to "Grape" type "dashed" text "Mediterranean" {}
  edge from "Orange" to "Mango" type "dashed" text "Subtropical" {}
] concepts [
  concept value "Apple" {}
  concept value "Peach" {}
  concept value "Grape" {}
  concept value "Strawberry" {}
  concept value "Orange" {}
  concept value "Mango" {}
  concept value "Banana" {}
  concept value "Pineapple" {}
  concept value "Coconut" {}
  concept value "Papaya" {}
] align RIGHT {}..
```

---

### Example 202

#### Prompt
"Create a concept web where one connection is assessed with expected value "A"."

#### Chat Transcript

**User**: Create a concept web where one connection is assessed with expected value "A".

#### Code

```
topic "Concept Web" anchor text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection text "A" assess [
    method "value"
    expected "A"
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

### Example 203

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

### Example 204

#### Prompt
"Create a drag-and-drop concept web with the tray on the left side and three concepts."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with the tray on the left side and three concepts.

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
] align LEFT {}..
```

---

### Example 205

#### Prompt
"Create a concept web with a topic, anchor with text override, three connections with text overrides, and assessment on all nodes using different expected values."

#### Chat Transcript

**User**: Create a concept web with a topic, anchor with text override, three connections with text overrides, and assessment on all nodes using different expected values.

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

### Example 206

#### Prompt
"Create a concept web with an anchor using w, h, rounded, bg, color, and border all together."

#### Chat Transcript

**User**: Create a concept web with an anchor using w, h, rounded, bg, color, and border all together.

#### Code

```
topic "Concept Web" anchor text "Hub" w 28 h 28 rounded "full" bg "indigo-600" color "white" border "indigo-300" {} connections [
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

### Example 207

#### Prompt
"Create a drag-and-drop concept web where the tray has more concepts than there are nodes (distractors)."

#### Chat Transcript

**User**: Create a drag-and-drop concept web where the tray has more concepts than there are nodes (distractors).

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
  concept value "Qux" {}
  concept value "Quux" {}
] align RIGHT {}..
```

---

### Example 208

#### Prompt
"Create a drag-and-drop concept web with topic, instructions, light theme, solid-arrow edges from anchor to all connections, dashed peer-to-peer edges with labels, blank assessed nodes, and a right-aligned concepts tray with matching concepts."

#### Chat Transcript

**User**: Create a drag-and-drop concept web with topic, instructions, light theme, solid-arrow edges from anchor to all connections, dashed peer-to-peer edges with labels, blank assessed nodes, and a right-aligned concepts tray with matching concepts.

#### Code

```
topic "Concept Web" instructions "Drag the concepts from the tray onto the correct nodes." theme LIGHT anchor value "Hub" text "" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" {}
  edge from "Hub" to "Bar" type "solid-arrow" {}
  edge from "Hub" to "Baz" type "solid-arrow" {}
  edge from "Foo" to "Bar" type "dashed" text "related" {}
  edge from "Bar" to "Baz" type "dashed" text "related" {}
  edge from "Foo" to "Baz" type "dashed" text "related" {}
] concepts [
  concept value "Hub" {}
  concept value "Foo" {}
  concept value "Bar" {}
  concept value "Baz" {}
] align RIGHT {}..
```

---

### Example 209

#### Prompt
"Create a concept web with an anchor that uses both value and text where text differs from value."

#### Chat Transcript

**User**: Create a concept web with an anchor that uses both value and text where text differs from value.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Central Hub" assess [
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

### Example 210

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

### Example 211

#### Prompt
"Create a concept web with edges using the '*' wildcard on the to field to connect the anchor to all connections."

#### Chat Transcript

**User**: Create a concept web with edges using the '*' wildcard on the to field to connect the anchor to all connections.

#### Code

```
topic "Concept Web" anchor value "Hub" text "Hub" assess [
  method "value"
  expected "Hub"
] {} connections [
  connection value "Foo" text "Foo" assess [
    method "value"
    expected "Foo"
  ] {}
  connection value "Bar" text "Bar" assess [
    method "value"
    expected "Bar"
  ] {}
  connection value "Baz" text "Baz" assess [
    method "value"
    expected "Baz"
  ] {}
] edges [
  edge from "Hub" to "*" type "solid" {}
] {}..
```

---

### Example 212

#### Prompt
"Create a concept web with the light theme and a concepts tray."

#### Chat Transcript

**User**: Create a concept web with the light theme and a concepts tray.

#### Code

```
topic "Concept Web" theme LIGHT anchor text "" assess [
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

### Example 213

#### Prompt
"Create a concept web with styled connections, styled concepts tray, and styled relation labels, each with different colors."

#### Chat Transcript

**User**: Create a concept web with styled connections, styled concepts tray, and styled relation labels, each with different colors.

#### Code

```
topic "Concept Web" instructions "Drag concepts onto the correct nodes, then label the edges." anchor value "Hub" text "" w 28 h 28 bg "indigo-500" color "white" rounded "full" {} connections [
  connection value "Foo" text "" w 24 h 12 bg "rose-400" color "white" rounded "lg" {}
  connection value "Bar" text "" w 24 h 12 bg "amber-400" color "white" rounded "lg" {}
  connection value "Baz" text "" w 24 h 12 bg "teal-400" color "white" rounded "lg" {}
] edges [
  edge from "Hub" to "Foo" type "solid-arrow" assess [
    method "value"
    expected "causes"
  ] {}
  edge from "Hub" to "Bar" type "solid-arrow" assess [
    method "value"
    expected "supports"
  ] {}
  edge from "Hub" to "Baz" type "solid-arrow" assess [
    method "value"
    expected "inhibits"
  ] {}
] concepts [
  concept value "Hub" bg "indigo-500" color "white" rounded "full" {}
  concept value "Foo" bg "rose-400" color "white" rounded "lg" {}
  concept value "Bar" bg "amber-400" color "white" rounded "lg" {}
  concept value "Baz" bg "teal-400" color "white" rounded "lg" {}
] relations [
  relation value "causes" bg "violet-200" color "violet-900" rounded "xs" {}
  relation value "supports" bg "sky-200" color "sky-900" rounded "xs" {}
  relation value "inhibits" bg "orange-200" color "orange-900" rounded "xs" {}
] {}..
```

---

### Example 214

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



