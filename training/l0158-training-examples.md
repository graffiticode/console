# Graffiticode Training Examples

*Downloaded on 2026-04-21T21:56:30.173Z*

## Language L0158

### Example 1

#### Prompt
"Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "Water is made of {{response}} and oxygen"
      valid-response [
        "hydrogen"
      ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 2

#### Prompt
"Create a classification asking "Classify the words" with categories "Nouns", "Verbs" and items "run", "cat", "jump", "house" where cat and house are Nouns and run and jump are Verbs."

#### Chat Transcript

**User**: Create a classification asking "Classify the words" with categories "Nouns", "Verbs" and items "run", "cat", "jump", "house" where cat and house are Nouns and run and jump are Verbs.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Classify the words"
      possible-responses [
        "run"
        "cat"
        "jump"
        "house"
      ] categories [
      "Nouns"
      "Verbs"
    ] valid-response [
      [
        1
        3
      ]
      [
        0
        2
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 3

#### Prompt
"Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct."

#### Chat Transcript

**User**: Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is the largest continent?"
      options [
        "Asia"
        "Africa"
        "Europe"
        "Antarctica"
      ] valid-response [
      0
    ] {}
  ] {}
] {}..
```

---

### Example 4

#### Prompt
"Create a cloze dropdown with two blanks: "{{response}} are mammals and {{response}} are reptiles" with dropdown options ["Dogs", "Cats", "Fish"] and ["Snakes", "Birds", "Frogs"] where Dogs and Snakes are correct."

#### Chat Transcript

**User**: Create a cloze dropdown with two blanks: "{{response}} are mammals and {{response}} are reptiles" with dropdown options ["Dogs", "Cats", "Fish"] and ["Snakes", "Birds", "Frogs"] where Dogs and Snakes are correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozedropdown stimulus "{{response}} are mammals and {{response}} are reptiles"
      possible-responses [
        [
          "Dogs"
          "Cats"
          "Fish"
        ]
        [
          "Snakes"
          "Birds"
          "Frogs"
        ]
      ] valid-response [
      "Dogs"
      "Snakes"
    ] {}
  ] {}
] {}..
```

---

### Example 5

#### Prompt
"Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct."

#### Chat Transcript

**User**: Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "The Earth is flat"
      options [
        "True"
        "False"
      ] valid-response [
      1
    ] {}
  ] {}
] {}..
```

---

### Example 6

#### Prompt
"Create a cloze formula question asking "Simplify: {{response}}" with the correct answer "2x + 3" using equivSymbolic method."

#### Chat Transcript

**User**: Create a cloze formula question asking "Simplify: {{response}}" with the correct answer "2x + 3" using equivSymbolic method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Simplify: {{response}}"
      valid-response [
        "2x + 3"
      ] method "equivSymbolic" {}
  ] {}
] {}..
```

---

### Example 7

#### Prompt
"Create an order list question asking "Order from smallest to largest" with items "Jupiter", "Earth", "Mars", "Mercury" where the correct order is Mercury, Mars, Earth, Jupiter."

#### Chat Transcript

**User**: Create an order list question asking "Order from smallest to largest" with items "Jupiter", "Earth", "Mars", "Mercury" where the correct order is Mercury, Mars, Earth, Jupiter.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Order from smallest to largest"
      list [
        "Jupiter"
        "Earth"
        "Mars"
        "Mercury"
      ] valid-response [
      3
      2
      1
      0
    ] {}
  ] {}
] {}..
```

---

### Example 8

#### Prompt
"Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False" where the answers are True and False."

#### Chat Transcript

**User**: Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False" where the answers are True and False.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "Classify each statement"
      rows [
        "The sun is a star"
        "The moon is a planet"
      ] columns [
      "True"
      "False"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 9

#### Prompt
"Create a multiple choice question asking "What is the primary function of the mitochondria?" with four options where "ATP production" is correct, tag the item with NGSS MS-LS1-2 and difficulty medium, and save it to the item bank."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the primary function of the mitochondria?" with four options where "ATP production" is correct, tag the item with NGSS MS-LS1-2 and difficulty medium, and save it to the item bank.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      NGSS: "MS-LS1-2"
      Difficulty: "medium"
    }
  ] questions [
    mcq stimulus "What is the primary function of the mitochondria?"
      options [
        "ATP production through cellular respiration"
        "Protein synthesis using genetic instructions"
        "Regulation of what enters and exits the cell"
        "Storage and protection of the cell's DNA"
      ] valid-response [
      0
    ] {}
  ] {}
] save-to-itembank true {}..
```

---

### Example 10

#### Prompt
"Create a cloze association question with the template "Drag the correct answer: {{response}} is the largest planet" with possible responses "Jupiter", "Saturn", "Earth" where Jupiter is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "Drag the correct answer: {{response}} is the largest planet" with possible responses "Jupiter", "Saturn", "Earth" where Jupiter is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeassociation stimulus "Drag the correct answer: {{response}} is the largest planet"
      possible-responses [
        "Jupiter"
        "Saturn"
        "Earth"
      ] valid-response [
      "Jupiter"
    ] {}
  ] {}
] {}..
```

---

### Example 11

#### Prompt
"Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is the capital of France?"
      options [
        "Paris"
        "London"
        "Berlin"
        "Madrid"
      ] valid-response [
      0
    ] {}
  ] {}
] {}..
```

---

### Example 12

#### Prompt
"Create a choice matrix with shuffled options asking "Match each country to its continent" with rows "Brazil", "Japan", "Egypt" and columns "South America", "Asia", "Africa" where each matches respectively."

#### Chat Transcript

**User**: Create a choice matrix with shuffled options asking "Match each country to its continent" with rows "Brazil", "Japan", "Egypt" and columns "South America", "Asia", "Africa" where each matches respectively.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "Match each country to its continent."
      rows [
        "Brazil"
        "Japan"
        "Egypt"
      ] columns [
      "South America"
      "Asia"
      "Africa"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
      [
        2
      ]
    ] shuffle-options true {}
  ] {}
] {}..
```

---

### Example 13

#### Prompt
"Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False", tagged with NGSS MS-ESS1-2 and difficulty easy, with per-row rationale explaining the correct classification."

#### Chat Transcript

**User**: Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False", tagged with NGSS MS-ESS1-2 and difficulty easy, with per-row rationale explaining the correct classification.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      NGSS: "MS-ESS1-2"
      Difficulty: "easy"
    }
  ] questions [
    choicematrix stimulus "Classify each statement"
      rows [
        "The sun is a star"
        "The moon is a planet"
      ] columns [
      "True"
      "False"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
    ] metadata [
      distractor-rationale [
        "Correct — the Sun is indeed a star, a massive ball of plasma at the center of our solar system."
        "Correct — the Moon is a natural satellite, not a planet; it orbits Earth rather than the Sun directly."
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 14

#### Prompt
"Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct."

#### Chat Transcript

**User**: Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What color is the sky?"
      options [
        "Blue"
        "Green"
        "Red"
      ] valid-response [
      0
    ] shuffle-options true {}
  ] {}
] {}..
```

---

### Example 15

#### Prompt
"Create an order list question asking "Order these fractions from least to greatest" with items "1/2", "1/4", "3/4", "1/8" where the correct order is 1/8, 1/4, 1/2, 3/4."

#### Chat Transcript

**User**: Create an order list question asking "Order these fractions from least to greatest" with items "1/2", "1/4", "3/4", "1/8" where the correct order is 1/8, 1/4, 1/2, 3/4.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Order these fractions from least to greatest"
      list [
        "1/2"
        "1/4"
        "3/4"
        "1/8"
      ] valid-response [
      3
      1
      0
      2
    ] {}
  ] {}
] {}..
```

---

### Example 16

#### Prompt
"Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O", tag the item with CCSS 5-PS1-1, difficulty easy, DOK 1, and persist it in the Learnosity item bank."

#### Chat Transcript

**User**: Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O", tag the item with CCSS 5-PS1-1, difficulty easy, DOK 1, and persist it in the Learnosity item bank.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      CCSS: "5-PS1-1"
      Difficulty: "easy"
      DOK: 1
    }
  ] questions [
    shorttext stimulus "What is the chemical symbol for water?"
      valid-response "H2O" {}
  ] {}
] save-to-itembank true {}..
```

---

### Example 17

#### Prompt
"Create a plain text essay question asking "Summarize the main argument" with a 150-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Summarize the main argument" with a 150-word limit.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    plaintext stimulus "Summarize the main argument."
      max-word-count 150
      placeholder "Start writing here..." {}
  ] {}
] {}..
```

---

### Example 18

#### Prompt
"Create a multiple choice question asking "What gas do plants primarily absorb during photosynthesis?" with options "Oxygen", "Carbon dioxide", "Nitrogen", "Helium" where Carbon dioxide is correct, with a one-line distractor rationale per option, tagged with NGSS MS-LS1-6, difficulty medium, DOK 2."

#### Chat Transcript

**User**: Create a multiple choice question asking "What gas do plants primarily absorb during photosynthesis?" with options "Oxygen", "Carbon dioxide", "Nitrogen", "Helium" where Carbon dioxide is correct, with a one-line distractor rationale per option, tagged with NGSS MS-LS1-6, difficulty medium, DOK 2.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      NGSS: "MS-LS1-6"
      Difficulty: "medium"
      DOK: 2
    }
  ] questions [
    mcq stimulus "What gas do plants primarily absorb during photosynthesis?"
      options [
        "Oxygen"
        "Carbon dioxide"
        "Nitrogen"
        "Helium"
      ] valid-response [
      1
    ] metadata [
      distractor-rationale [
        "Oxygen is actually released by plants as a byproduct of photosynthesis, not absorbed."
        "Correct — plants absorb carbon dioxide from the air and use it to produce glucose."
        "Nitrogen is absorbed by plants through the soil for protein synthesis, not for photosynthesis."
        "Helium is an inert noble gas and plays no role in plant biology or photosynthesis."
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 19

#### Prompt
"Create a classification asking "Sort by food group" with categories "Fruits", "Vegetables" and items "Apple", "Carrot", "Banana", "Broccoli" where Apple and Banana are Fruits and Carrot and Broccoli are Vegetables."

#### Chat Transcript

**User**: Create a classification asking "Sort by food group" with categories "Fruits", "Vegetables" and items "Apple", "Carrot", "Banana", "Broccoli" where Apple and Banana are Fruits and Carrot and Broccoli are Vegetables.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Sort by food group"
      possible-responses [
        "Apple"
        "Carrot"
        "Banana"
        "Broccoli"
      ] categories [
      "Fruits"
      "Vegetables"
    ] valid-response [
      [
        0
        2
      ]
      [
        1
        3
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 20

#### Prompt
"Create a cloze formula question asking "Express as a fraction: 0.5 = {{response}}" with the correct answer "\frac{1}{2}" using equivValue method."

#### Chat Transcript

**User**: Create a cloze formula question asking "Express as a fraction: 0.5 = {{response}}" with the correct answer "\frac{1}{2}" using equivValue method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Express as a fraction: 0.5 = {{response}}"
      valid-response [
        "\\frac{1}{2}"
      ] method "equivValue" {}
  ] {}
] {}..
```

---

### Example 21

#### Prompt
"Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct."

#### Chat Transcript

**User**: Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} is to hot as {{response}} is to cold"
      possible-responses [
        "fire"
        "ice"
        "water"
      ] valid-response [
      "fire"
      "ice"
    ] {}
  ] {}
] {}..
```

---

### Example 22

#### Prompt
"Create a bow-tie for a patient with severe abdominal pain and rebound tenderness. Columns: "Actions to Take", "Condition Most Likely", "Parameters to Monitor". Actions: "keep NPO", "administer pain medication", "encourage ambulation", "insert nasogastric tube". Condition: "appendicitis", "gastroenteritis", "kidney stones". Monitor: "temperature", "bowel sounds", "skin integrity", "hydration status". Correct actions: "keep NPO", "insert nasogastric tube". Correct condition: "appendicitis". Correct monitors: "temperature", "bowel sounds"."

#### Chat Transcript

**User**: Create a bow-tie for a patient with severe abdominal pain and rebound tenderness. Columns: "Actions to Take", "Condition Most Likely", "Parameters to Monitor". Actions: "keep NPO", "administer pain medication", "encourage ambulation", "insert nasogastric tube". Condition: "appendicitis", "gastroenteritis", "kidney stones". Monitor: "temperature", "bowel sounds", "skin integrity", "hydration status". Correct actions: "keep NPO", "insert nasogastric tube". Correct condition: "appendicitis". Correct monitors: "temperature", "bowel sounds".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    bowtie stimulus "A patient presents with severe abdominal pain and rebound tenderness."
      column-titles [
        "Actions to Take"
        "Condition Most Likely"
        "Parameters to Monitor"
      ] possible-responses [
      [
        "keep NPO"
        "administer pain medication"
        "encourage ambulation"
        "insert nasogastric tube"
      ]
      [
        "appendicitis"
        "gastroenteritis"
        "kidney stones"
      ]
      [
        "temperature"
        "bowel sounds"
        "skin integrity"
        "hydration status"
      ]
    ] valid-response [
      [
        "keep NPO"
        "insert nasogastric tube"
      ]
      [
        "appendicitis"
      ]
      [
        "temperature"
        "bowel sounds"
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 23

#### Prompt
"Create an items assessment with a choice matrix about weather: rows "Rain", "Snow", "Sunshine" with columns "Warm", "Cold" where Rain is Warm, Snow is Cold, and Sunshine is Warm."

#### Chat Transcript

**User**: Create an items assessment with a choice matrix about weather: rows "Rain", "Snow", "Sunshine" with columns "Warm", "Cold" where Rain is Warm, Snow is Cold, and Sunshine is Warm.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "What weather is associated with each condition?"
      rows [
        "Rain"
        "Snow"
        "Sunshine"
      ] columns [
      "Warm"
      "Cold"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
      [
        0
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 24

#### Prompt
"Create a cloze text question with two blanks: "The {{response}} is in the {{response}} system" with correct answers "Sun" and "solar"."

#### Chat Transcript

**User**: Create a cloze text question with two blanks: "The {{response}} is in the {{response}} system" with correct answers "Sun" and "solar".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} is in the {{response}} system"
      valid-response [
        "Sun"
        "solar"
      ] {}
  ] {}
] {}..
```

---

### Example 25

#### Prompt
"Create a classification question asking "Sort by type of energy" with categories "Renewable", "Non-renewable" and items "Solar", "Coal", "Wind", "Natural Gas" where Solar and Wind are Renewable and Coal and Natural Gas are Non-renewable."

#### Chat Transcript

**User**: Create a classification question asking "Sort by type of energy" with categories "Renewable", "Non-renewable" and items "Solar", "Coal", "Wind", "Natural Gas" where Solar and Wind are Renewable and Coal and Natural Gas are Non-renewable.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Sort by type of energy"
      possible-responses [
        "Solar"
        "Coal"
        "Wind"
        "Natural Gas"
      ] categories [
      "Renewable"
      "Non-renewable"
    ] valid-response [
      [
        0
        2
      ]
      [
        1
        3
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 26

#### Prompt
"Create a multiple choice question asking "What is the primary function of the mitochondria?" with four options where "ATP production" is correct, tag the item with NGSS MS-LS1-2 and difficulty medium, and save it to the item bank."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the primary function of the mitochondria?" with four options where "ATP production" is correct, tag the item with NGSS MS-LS1-2 and difficulty medium, and save it to the item bank.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      NGSS: "MS-LS1-2"
      Difficulty: "medium"
    }
  ] questions [
    mcq stimulus "What is the primary function of the mitochondria?"
      options [
        "ATP production via cellular respiration"
        "Protein synthesis using genetic instructions"
        "Regulation of substances entering and exiting the cell"
        "Storage and protection of the cell's DNA"
      ] valid-response [
      0
    ] {}
  ] {}
] save-to-itembank true {}..
```

---

### Example 27

#### Prompt
"Create a choice matrix asking "Is each statement a fact or opinion?" with rows "The Earth orbits the Sun", "Pizza is the best food" and columns "Fact", "Opinion" where answers are Fact and Opinion."

#### Chat Transcript

**User**: Create a choice matrix asking "Is each statement a fact or opinion?" with rows "The Earth orbits the Sun", "Pizza is the best food" and columns "Fact", "Opinion" where answers are Fact and Opinion.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "Is each statement a fact or opinion?"
      rows [
        "The Earth orbits the Sun"
        "Pizza is the best food"
      ] columns [
      "Fact"
      "Opinion"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 28

#### Prompt
"Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is the boiling point of water?"
      options [
        "50°C"
        "100°C"
        "150°C"
        "200°C"
      ] valid-response [
      1
    ] {}
  ] {}
] {}..
```

---

### Example 29

#### Prompt
"Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is the square root of 144?"
      options [
        "10"
        "11"
        "12"
        "13"
      ] valid-response [
      2
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 30

#### Prompt
"Create a short text question asking "What is 7 × 8?" with the correct answer "56"."

#### Chat Transcript

**User**: Create a short text question asking "What is 7 × 8?" with the correct answer "56".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What is 7 × 8?"
      valid-response "56" {}
  ] {}
] {}..
```

---

### Example 31

#### Prompt
"Create an items assessment with an order list: "Order these numbers" with items "5", "2", "8", "1" where the correct order is 1, 2, 5, 8."

#### Chat Transcript

**User**: Create an items assessment with an order list: "Order these numbers" with items "5", "2", "8", "1" where the correct order is 1, 2, 5, 8.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Order these numbers"
      list [
        "5"
        "2"
        "8"
        "1"
      ] valid-response [
      3
      1
      0
      2
    ] {}
  ] {}
] {}..
```

---

### Example 32

#### Prompt
"Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What is the abbreviation for Doctor?"
      valid-response "Dr."
      case-sensitive true {}
  ] {}
] {}..
```

---

### Example 33

#### Prompt
"Create an items assessment with a cloze formula: "Solve for y: 2y = 10. y = {{response}}" with the correct answer "5"."

#### Chat Transcript

**User**: Create an items assessment with a cloze formula: "Solve for y: 2y = 10. y = {{response}}" with the correct answer "5".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Solve for y: 2y = 10. y = {{response}}"
      valid-response [
        "5"
      ] method "equivLiteral" {}
  ] {}
] {}..
```

---

### Example 34

#### Prompt
"Create an order list question asking "Arrange the planets by distance from the Sun" with items "Mercury", "Venus", "Earth", "Mars", tag with difficulty easy and DOK 1, and store it in the item bank."

#### Chat Transcript

**User**: Create an order list question asking "Arrange the planets by distance from the Sun" with items "Mercury", "Venus", "Earth", "Mars", tag with difficulty easy and DOK 1, and store it in the item bank.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      Difficulty: "easy"
      DOK: 1
    }
  ] questions [
    orderlist stimulus "Arrange the planets by distance from the Sun"
      list [
        "Mercury"
        "Venus"
        "Earth"
        "Mars"
      ] valid-response [
      0
      1
      2
      3
    ] {}
  ] {}
] save-to-itembank true {}..
```

---

### Example 35

#### Prompt
"Create an order list question asking "Arrange in chronological order" with items "World War II", "World War I", "Moon Landing", "Internet" where the correct order is WWI, WWII, Moon Landing, Internet."

#### Chat Transcript

**User**: Create an order list question asking "Arrange in chronological order" with items "World War II", "World War I", "Moon Landing", "Internet" where the correct order is WWI, WWII, Moon Landing, Internet.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Arrange in chronological order"
      list [
        "World War II"
        "World War I"
        "Moon Landing"
        "Internet"
      ] valid-response [
      1
      0
      2
      3
    ] {}
  ] {}
] {}..
```

---

### Example 36

#### Prompt
"Create an order list asking "Arrange the steps of the scientific method" with items "Hypothesis", "Experiment", "Observation", "Conclusion" where the correct order is Observation, Hypothesis, Experiment, Conclusion."

#### Chat Transcript

**User**: Create an order list asking "Arrange the steps of the scientific method" with items "Hypothesis", "Experiment", "Observation", "Conclusion" where the correct order is Observation, Hypothesis, Experiment, Conclusion.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Arrange the steps of the scientific method"
      list [
        "Hypothesis"
        "Experiment"
        "Observation"
        "Conclusion"
      ] valid-response [
      2
      0
      1
      3
    ] {}
  ] {}
] {}..
```

---

### Example 37

#### Prompt
"Create a cloze text question with the template "The speed of {{response}} is approximately 300,000 km/s" with the correct answer "light"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The speed of {{response}} is approximately 300,000 km/s" with the correct answer "light".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "The speed of {{response}} is approximately 300,000 km/s"
      valid-response [
        "light"
      ] {}
  ] {}
] {}..
```

---

### Example 38

#### Prompt
"Create a plain text essay question asking "List three things you learned today" with a 100-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "List three things you learned today" with a 100-word limit.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    plaintext stimulus "List three things you learned today."
      max-word-count 100
      placeholder "Start writing here..." {}
  ] {}
] {}..
```

---

### Example 39

#### Prompt
"Create an items assessment with a plain text essay asking "Reflect on what you learned" with a 200-word limit, and an MCQ asking "How confident are you?" with options "Very", "Somewhat", "Not at all" where Very is correct."

#### Chat Transcript

**User**: Create an items assessment with a plain text essay asking "Reflect on what you learned" with a 200-word limit, and an MCQ asking "How confident are you?" with options "Very", "Somewhat", "Not at all" where Very is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    plaintext stimulus "Reflect on what you learned"
      max-length 200
      placeholder "Start writing here..." {}
    mcq stimulus "How confident are you?"
      options [
        "Very"
        "Somewhat"
        "Not at all"
      ] valid-response [
      0
    ] {}
  ] {}
] {}..
```

---

### Example 40

#### Prompt
"Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct.

Create a cloze association question with the template "The chemical formula for water is {{response}}" with possible responses "H2O", "CO2", "NaCl" where H2O is correct."

#### Chat Transcript

**User**: Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct.

**User**: Create a cloze association question with the template "The chemical formula for water is {{response}}" with possible responses "H2O", "CO2", "NaCl" where H2O is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeassociation stimulus "The chemical formula for water is {{response}}"
      possible-responses [
        "H2O"
        "CO2"
        "NaCl"
      ] valid-response [
      "H2O"
    ] {}
  ] {}
] {}..
```

---

### Example 41

#### Prompt
"Create a classification asking "Sort instruments" with categories "String", "Wind", "Percussion" and items "Guitar", "Flute", "Drum", "Violin", "Trumpet", "Cymbal" where Guitar and Violin are String, Flute and Trumpet are Wind, and Drum and Cymbal are Percussion."

#### Chat Transcript

**User**: Create a classification asking "Sort instruments" with categories "String", "Wind", "Percussion" and items "Guitar", "Flute", "Drum", "Violin", "Trumpet", "Cymbal" where Guitar and Violin are String, Flute and Trumpet are Wind, and Drum and Cymbal are Percussion.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Sort instruments"
      possible-responses [
        "Guitar"
        "Flute"
        "Drum"
        "Violin"
        "Trumpet"
        "Cymbal"
      ] categories [
      "String"
      "Wind"
      "Percussion"
    ] valid-response [
      [
        0
        3
      ]
      [
        1
        4
      ]
      [
        2
        5
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 42

#### Prompt
"Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here...".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    longtext stimulus "Write about your favorite book"
      placeholder "Start writing here..." {}
  ] {}
] {}..
```

---

### Example 43

#### Prompt
"Create an items assessment with a long text essay asking "Describe photosynthesis" with a 300-word limit, and an MCQ asking "What gas do plants produce?" with options "CO2", "O2", "N2" where O2 is correct."

#### Chat Transcript

**User**: Create an items assessment with a long text essay asking "Describe photosynthesis" with a 300-word limit, and an MCQ asking "What gas do plants produce?" with options "CO2", "O2", "N2" where O2 is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    longtext stimulus "Describe photosynthesis."
      max-length 300
      placeholder "Start writing here..." {}
    mcq stimulus "What gas do plants produce?"
      options [
        "CO2"
        "O2"
        "N2"
      ] valid-response [
      1
    ] {}
  ] {}
] {}..
```

---

### Example 44

#### Prompt
"Update the existing item with id <ITEM_ID>: change the stem to be shorter and clearer, but keep all the existing tags, difficulty, DOK, and per-option distractor rationale unchanged."

#### Chat Transcript

**User**: Update the existing item with id <ITEM_ID>: change the stem to be shorter and clearer, but keep all the existing tags, difficulty, DOK, and per-option distractor rationale unchanged.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      Difficulty: "medium"
      DOK: 2
    }
  ] questions [
    mcq stimulus "What is the powerhouse of the cell?"
      options [
        "Mitochondria"
        "Nucleus"
        "Ribosome"
        "Cell membrane"
      ] valid-response [
      0
    ] metadata [
      distractor-rationale [
        "Correct — mitochondria produce ATP via cellular respiration."
        "The nucleus stores DNA and controls cell activity."
        "Ribosomes synthesize proteins."
        "The cell membrane regulates what enters and exits the cell."
      ]
    ] {}
  ] {}
] save-to-itembank true {}..
```

---

### Example 45

#### Prompt
"Create a cloze association: "{{response}} is the capital of {{response}}" with possible responses "Paris", "France", "Germany", "Berlin" where Paris and France are correct."

#### Chat Transcript

**User**: Create a cloze association: "{{response}} is the capital of {{response}}" with possible responses "Paris", "France", "Germany", "Berlin" where Paris and France are correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} is the capital of {{response}}"
      possible-responses [
        "Paris"
        "France"
        "Germany"
        "Berlin"
      ] valid-response [
      "Paris"
      "France"
    ] {}
  ] {}
] {}..
```

---

### Example 46

#### Prompt
"Create a cloze formula question with instant feedback asking "√16 = {{response}}" with the correct answer "4" using equivLiteral method."

#### Chat Transcript

**User**: Create a cloze formula question with instant feedback asking "√16 = {{response}}" with the correct answer "4" using equivLiteral method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "√16 = {{response}}"
      valid-response [
        "4"
      ] method "equivLiteral"
      instant-feedback true {}
  ] {}
] {}..
```

---

### Example 47

#### Prompt
"Create an items assessment with a classification: "Sort by type" with categories "Even", "Odd" and items "1", "2", "3", "4" where 2 and 4 are Even and 1 and 3 are Odd."

#### Chat Transcript

**User**: Create an items assessment with a classification: "Sort by type" with categories "Even", "Odd" and items "1", "2", "3", "4" where 2 and 4 are Even and 1 and 3 are Odd.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Sort by type"
      possible-responses [
        "1"
        "2"
        "3"
        "4"
      ] categories [
      "Even"
      "Odd"
    ] valid-response [
      [
        1
        3
      ]
      [
        0
        2
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 48

#### Prompt
"Create a multiple choice question asking "What is the function of the cell membrane?" with four options where "control what enters and exits" is correct, and add a one-line distractor rationale per option explaining each misconception."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the function of the cell membrane?" with four options where "control what enters and exits" is correct, and add a one-line distractor rationale per option explaining each misconception.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is the function of the cell membrane?"
      options [
        "To produce energy for the cell"
        "To control what enters and exits the cell"
        "To store the cell's genetic information"
        "To synthesize proteins for the cell"
      ] valid-response [
      1
    ] metadata [
      distractor-rationale [
        "Energy production is the role of the mitochondria, not the cell membrane."
        "Correct — the cell membrane acts as a selective barrier regulating what enters and exits the cell."
        "Genetic information is stored in the nucleus, not the cell membrane."
        "Protein synthesis is carried out by ribosomes, not the cell membrane."
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 49

#### Prompt
"Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay...".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    longtext stimulus "Discuss the causes of climate change"
      max-length 500
      placeholder "Begin your essay..." {}
  ] {}
] {}..
```

---

### Example 50

#### Prompt
"Create a cloze text question with the template "DNA stands for {{response}} acid" with the correct answer "deoxyribonucleic", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "DNA stands for {{response}} acid" with the correct answer "deoxyribonucleic", case insensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "DNA stands for {{response}} acid"
      valid-response [
        "deoxyribonucleic"
      ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 51

#### Prompt
"Create a bow-tie question with the scenario "A 65-year-old male presents with chest pain and diaphoresis". Columns are "Actions to Take", "Condition Most Likely", "Parameters to Monitor". Actions options: "give aspirin", "give nitro", "call cardiology", "obtain 12-lead ECG". Condition options: "myocardial infarction", "pulmonary embolism", "pericarditis". Monitor options: "ST segment changes", "blood pressure", "troponin", "respiratory rate". Correct actions: "give aspirin" and "obtain 12-lead ECG". Correct condition: "myocardial infarction". Correct monitors: "ST segment changes" and "troponin"."

#### Chat Transcript

**User**: Create a bow-tie question with the scenario "A 65-year-old male presents with chest pain and diaphoresis". Columns are "Actions to Take", "Condition Most Likely", "Parameters to Monitor". Actions options: "give aspirin", "give nitro", "call cardiology", "obtain 12-lead ECG". Condition options: "myocardial infarction", "pulmonary embolism", "pericarditis". Monitor options: "ST segment changes", "blood pressure", "troponin", "respiratory rate". Correct actions: "give aspirin" and "obtain 12-lead ECG". Correct condition: "myocardial infarction". Correct monitors: "ST segment changes" and "troponin".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    bowtie stimulus "A 65-year-old male presents with chest pain and diaphoresis."
      column-titles [
        "Actions to Take"
        "Condition Most Likely"
        "Parameters to Monitor"
      ] possible-responses [
      [
        "give aspirin"
        "give nitro"
        "call cardiology"
        "obtain 12-lead ECG"
      ]
      [
        "myocardial infarction"
        "pulmonary embolism"
        "pericarditis"
      ]
      [
        "ST segment changes"
        "blood pressure"
        "troponin"
        "respiratory rate"
      ]
    ] valid-response [
      [
        "give aspirin"
        "obtain 12-lead ECG"
      ]
      [
        "myocardial infarction"
      ]
      [
        "ST segment changes"
        "troponin"
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 52

#### Prompt
"Create a bow-tie question for a patient with dyspnea and lower-extremity edema. Columns: "Actions", "Condition", "Monitor". Actions: "administer furosemide", "elevate head of bed", "start CPR", "place in Trendelenburg". Condition: "acute heart failure", "pneumothorax", "sepsis". Monitor: "daily weight", "oxygen saturation", "blood glucose", "urine output". Correct actions: "administer furosemide", "elevate head of bed". Correct condition: "acute heart failure". Correct monitors: "daily weight", "urine output"."

#### Chat Transcript

**User**: Create a bow-tie question for a patient with dyspnea and lower-extremity edema. Columns: "Actions", "Condition", "Monitor". Actions: "administer furosemide", "elevate head of bed", "start CPR", "place in Trendelenburg". Condition: "acute heart failure", "pneumothorax", "sepsis". Monitor: "daily weight", "oxygen saturation", "blood glucose", "urine output". Correct actions: "administer furosemide", "elevate head of bed". Correct condition: "acute heart failure". Correct monitors: "daily weight", "urine output".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    bowtie stimulus "A patient presents with dyspnea and lower-extremity edema. Select the appropriate actions, identify the most likely condition, and choose the parameters to monitor."
      column-titles [
        "Actions"
        "Condition"
        "Monitor"
      ] possible-responses [
      [
        "administer furosemide"
        "elevate head of bed"
        "start CPR"
        "place in Trendelenburg"
      ]
      [
        "acute heart failure"
        "pneumothorax"
        "sepsis"
      ]
      [
        "daily weight"
        "oxygen saturation"
        "blood glucose"
        "urine output"
      ]
    ] valid-response [
      [
        "administer furosemide"
        "elevate head of bed"
      ]
      [
        "acute heart failure"
      ]
      [
        "daily weight"
        "urine output"
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 53

#### Prompt
"Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Which language is L0158 built for?"
      options [
        "Learnosity"
        "Canvas"
        "Moodle"
        "Blackboard"
      ] valid-response [
      0
    ] {}
  ] {}
] {}..
```

---

### Example 54

#### Prompt
"Create an items assessment with a cloze text "The {{response}} is the largest organ" with correct answer "skin", and an MCQ asking "Which system does it belong to?" with options "Nervous", "Digestive", "Integumentary" where Integumentary is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze text "The {{response}} is the largest organ" with correct answer "skin", and an MCQ asking "Which system does it belong to?" with options "Nervous", "Digestive", "Integumentary" where Integumentary is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} is the largest organ"
      valid-response [
        "skin"
      ] {}
    mcq stimulus "Which system does it belong to?"
      options [
        "Nervous"
        "Digestive"
        "Integumentary"
      ] valid-response [
      2
    ] {}
  ] {}
] {}..
```

---

### Example 55

#### Prompt
"Create an items assessment combining all question types: an MCQ, a short text, a cloze text, and an order list, all related to basic math facts."

#### Chat Transcript

**User**: Create an items assessment combining all question types: an MCQ, a short text, a cloze text, and an order list, all related to basic math facts.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is 6 × 7?"
      options [
        "36"
        "42"
        "48"
        "56"
      ] valid-response [
      1
    ] {}
    shorttext stimulus "What is the square root of 64?"
      valid-response "8" {}
    clozetext stimulus "{{response}} × 9 = 81, so the missing number is {{response}}."
      valid-response [
        "9"
        "9"
      ] {}
    orderlist stimulus "Arrange these numbers from smallest to largest."
      list [
        "15"
        "3"
        "27"
        "9"
      ] valid-response [
      1
      3
      0
      2
    ] {}
  ] {}
] {
  v: 1
}..
```

---

### Example 56

#### Prompt
"Create a cloze dropdown question with the template "The {{response}} is the powerhouse of the cell" with options "mitochondria", "nucleus", "ribosome" where mitochondria is correct, tagged with difficulty medium and DOK 2."

#### Chat Transcript

**User**: Create a cloze dropdown question with the template "The {{response}} is the powerhouse of the cell" with options "mitochondria", "nucleus", "ribosome" where mitochondria is correct, tagged with difficulty medium and DOK 2.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      Difficulty: "medium"
      DOK: 2
    }
  ] questions [
    clozedropdown stimulus "The {{response}} is the powerhouse of the cell"
      possible-responses [
        [
          "mitochondria"
          "nucleus"
          "ribosome"
        ]
      ] valid-response [
      "mitochondria"
    ] {}
  ] {}
] {}..
```

---

### Example 57

#### Prompt
"Create a cloze association with instant feedback: "{{response}} discovered gravity" with possible responses "Newton", "Einstein", "Galileo" where Newton is correct."

#### Chat Transcript

**User**: Create a cloze association with instant feedback: "{{response}} discovered gravity" with possible responses "Newton", "Einstein", "Galileo" where Newton is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} discovered gravity"
      possible-responses [
        "Newton"
        "Einstein"
        "Galileo"
      ] valid-response [
      "Newton"
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 58

#### Prompt
"Create a cloze formula question asking "Solve: x + 3 = 7. x = {{response}}" with the correct answer "4" using equivLiteral method."

#### Chat Transcript

**User**: Create a cloze formula question asking "Solve: x + 3 = 7. x = {{response}}" with the correct answer "4" using equivLiteral method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Solve: x + 3 = 7. x = {{response}}"
      valid-response [
        "4"
      ] method "equivLiteral" {}
  ] {}
] {}..
```

---

### Example 59

#### Prompt
"Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What is the opposite of hot?"
      valid-response "cold"
      case-sensitive false {}
  ] {}
] {}..
```

---

### Example 60

#### Prompt
"Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct."

#### Chat Transcript

**User**: Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is 2 + 2?"
      options [
        "3"
        "4"
        "5"
        "6"
      ] valid-response [
      1
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 61

#### Prompt
"Create an items assessment with an MCQ asking "What is 2+2?" with options "3", "4", "5" where 4 is correct, and a short text question asking "Spell the answer" with correct answer "four"."

#### Chat Transcript

**User**: Create an items assessment with an MCQ asking "What is 2+2?" with options "3", "4", "5" where 4 is correct, and a short text question asking "Spell the answer" with correct answer "four".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is 2+2?"
      options [
        "3"
        "4"
        "5"
      ] valid-response [
      1
    ] {}
    shorttext stimulus "Spell the answer"
      valid-response "four" {}
  ] {}
] {}..
```

---

### Example 62

#### Prompt
"Create a bow-tie for a diabetic patient found confused and diaphoretic. Columns: "Actions", "Condition", "Monitor". Actions: "give 15 g oral glucose", "check finger-stick glucose", "administer insulin", "start normal saline". Condition: "hypoglycemia", "diabetic ketoacidosis", "stroke". Monitor: "blood glucose", "level of consciousness", "weight", "urine ketones". Correct actions: "give 15 g oral glucose", "check finger-stick glucose". Correct condition: "hypoglycemia". Correct monitors: "blood glucose", "level of consciousness"."

#### Chat Transcript

**User**: Create a bow-tie for a diabetic patient found confused and diaphoretic. Columns: "Actions", "Condition", "Monitor". Actions: "give 15 g oral glucose", "check finger-stick glucose", "administer insulin", "start normal saline". Condition: "hypoglycemia", "diabetic ketoacidosis", "stroke". Monitor: "blood glucose", "level of consciousness", "weight", "urine ketones". Correct actions: "give 15 g oral glucose", "check finger-stick glucose". Correct condition: "hypoglycemia". Correct monitors: "blood glucose", "level of consciousness".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    bowtie stimulus "A diabetic patient is found confused and diaphoretic."
      column-titles [
        "Actions"
        "Condition"
        "Monitor"
      ] possible-responses [
      [
        "give 15 g oral glucose"
        "check finger-stick glucose"
        "administer insulin"
        "start normal saline"
      ]
      [
        "hypoglycemia"
        "diabetic ketoacidosis"
        "stroke"
      ]
      [
        "blood glucose"
        "level of consciousness"
        "weight"
        "urine ketones"
      ]
    ] valid-response [
      [
        "give 15 g oral glucose"
        "check finger-stick glucose"
      ]
      [
        "hypoglycemia"
      ]
      [
        "blood glucose"
        "level of consciousness"
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 63

#### Prompt
"Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Which element has atomic number 1?"
      options [
        "Helium"
        "Hydrogen"
        "Lithium"
        "Carbon"
      ] valid-response [
      1
    ] shuffle-options true {}
  ] {}
] {}..
```

---

### Example 64

#### Prompt
"Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses."

#### Chat Transcript

**User**: Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Select all even numbers"
      options [
        "1"
        "2"
        "3"
        "4"
      ] valid-response [
      1
      3
    ] multiple-responses true {}
  ] {}
] {}..
```

---

### Example 65

#### Prompt
"Create a bow-tie for a toddler with a high fever and stiff neck. Columns: "Actions to Take", "Condition Most Likely", "Parameters to Monitor". Actions: "draw blood cultures", "give ibuprofen", "isolate the patient", "consult neurology". Condition: "bacterial meningitis", "febrile seizure", "viral URI". Monitor: "level of consciousness", "temperature", "weight", "skin turgor". Correct actions: "draw blood cultures", "isolate the patient". Correct condition: "bacterial meningitis". Correct monitors: "level of consciousness", "temperature"."

#### Chat Transcript

**User**: Create a bow-tie for a toddler with a high fever and stiff neck. Columns: "Actions to Take", "Condition Most Likely", "Parameters to Monitor". Actions: "draw blood cultures", "give ibuprofen", "isolate the patient", "consult neurology". Condition: "bacterial meningitis", "febrile seizure", "viral URI". Monitor: "level of consciousness", "temperature", "weight", "skin turgor". Correct actions: "draw blood cultures", "isolate the patient". Correct condition: "bacterial meningitis". Correct monitors: "level of consciousness", "temperature".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    bowtie stimulus "A toddler presents with a high fever and stiff neck."
      column-titles [
        "Actions to Take"
        "Condition Most Likely"
        "Parameters to Monitor"
      ] possible-responses [
      [
        "draw blood cultures"
        "give ibuprofen"
        "isolate the patient"
        "consult neurology"
      ]
      [
        "bacterial meningitis"
        "febrile seizure"
        "viral URI"
      ]
      [
        "level of consciousness"
        "temperature"
        "weight"
        "skin turgor"
      ]
    ] valid-response [
      [
        "draw blood cultures"
        "isolate the patient"
      ]
      [
        "bacterial meningitis"
      ]
      [
        "level of consciousness"
        "temperature"
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 66

#### Prompt
"Create an items assessment with three MCQ questions about geography: capital of France (Paris), capital of Japan (Tokyo), and capital of Australia (Canberra)."

#### Chat Transcript

**User**: Create an items assessment with three MCQ questions about geography: capital of France (Paris), capital of Japan (Tokyo), and capital of Australia (Canberra).

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is the capital of France?"
      options [
        "Paris"
        "London"
        "Berlin"
        "Madrid"
      ] valid-response [
      0
    ] {}
    mcq stimulus "What is the capital of Japan?"
      options [
        "Osaka"
        "Kyoto"
        "Tokyo"
        "Hiroshima"
      ] valid-response [
      2
    ] {}
    mcq stimulus "What is the capital of Australia?"
      options [
        "Sydney"
        "Melbourne"
        "Brisbane"
        "Canberra"
      ] valid-response [
      3
    ] {}
  ] {}
] {}..
```

---

### Example 67

#### Prompt
"Create a multiple choice question asking "What is the primary function of the mitochondria?" with four options where "ATP production" is correct, tagged with NGSS MS-LS1-2 and difficulty medium."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the primary function of the mitochondria?" with four options where "ATP production" is correct, tagged with NGSS MS-LS1-2 and difficulty medium.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      NGSS: "MS-LS1-2"
      Difficulty: "medium"
    }
  ] questions [
    mcq stimulus "What is the primary function of the mitochondria?"
      options [
        "To produce ATP through cellular respiration"
        "To control what enters and exits the cell"
        "To build proteins using genetic instructions"
        "To store and protect the cell's DNA"
      ] valid-response [
      0
    ] {}
  ] {}
] {}..
```

---

### Example 68

#### Prompt
"Create a cloze formula question asking "Factor: x² - 4 = {{response}}" with the correct answer "(x-2)(x+2)" using equivSymbolic method."

#### Chat Transcript

**User**: Create a cloze formula question asking "Factor: x² - 4 = {{response}}" with the correct answer "(x-2)(x+2)" using equivSymbolic method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Factor: x² - 4 = {{response}}"
      valid-response [
        "(x-2)(x+2)"
      ] method "equivSymbolic" {}
  ] {}
] {}..
```

---

### Example 69

#### Prompt
"Create an items assessment with a cloze text question: "The {{response}} War ended in {{response}}" with correct answers "Civil" and "1865"."

#### Chat Transcript

**User**: Create an items assessment with a cloze text question: "The {{response}} War ended in {{response}}" with correct answers "Civil" and "1865".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} War ended in {{response}}"
      valid-response [
        "Civil"
        "1865"
      ] {}
  ] {}
] {}..
```

---

### Example 70

#### Prompt
"Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements..."."

#### Chat Transcript

**User**: Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements...".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    plaintext stimulus "Write a brief biography"
      max-word-count 250
      placeholder "Name, birth date, achievements..." {}
  ] {}
] {}..
```

---

### Example 71

#### Prompt
"Create an order list question asking "Arrange the planets by distance from the Sun" with items "Mercury", "Venus", "Earth", "Mars", tag with difficulty easy and DOK 1, and store it in the item bank."

#### Chat Transcript

**User**: Create an order list question asking "Arrange the planets by distance from the Sun" with items "Mercury", "Venus", "Earth", "Mars", tag with difficulty easy and DOK 1, and store it in the item bank.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      Difficulty: "easy"
      DOK: 1
    }
  ] questions [
    orderlist stimulus "Arrange the planets by distance from the Sun"
      list [
        "Mercury"
        "Venus"
        "Earth"
        "Mars"
      ] valid-response [
      0
      1
      2
      3
    ] {}
  ] {}
] {}..
```

---

### Example 72

#### Prompt
"Create a multiple choice question asking "Who painted the Mona Lisa?" with four options where "Leonardo da Vinci" is correct, with question-level acknowledgements "Image courtesy Louvre Museum, public domain"."

#### Chat Transcript

**User**: Create a multiple choice question asking "Who painted the Mona Lisa?" with four options where "Leonardo da Vinci" is correct, with question-level acknowledgements "Image courtesy Louvre Museum, public domain".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Who painted the Mona Lisa?"
      options [
        "Leonardo da Vinci"
        "Michelangelo"
        "Raphael"
        "Caravaggio"
      ] valid-response [
      0
    ] metadata [
      acknowledgements "Image courtesy Louvre Museum, public domain"
    ] {}
  ] {}
] {}..
```

---

### Example 73

#### Prompt
"Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit."

#### Chat Transcript

**User**: Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    longtext stimulus "Compare and contrast two historical events."
      max-length 400
      placeholder "Start writing here..." {}
  ] {}
] {}..
```

---

### Example 74

#### Prompt
"Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945"."

#### Chat Transcript

**User**: Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What year did World War II end?"
      valid-response "1945" {}
  ] {}
] {}..
```

---

### Example 75

#### Prompt
"Create a cloze formula question asking "Simplify: {{response}}" with the correct answer "x" for the expression "x²/x" using isSimplified method."

#### Chat Transcript

**User**: Create a cloze formula question asking "Simplify: {{response}}" with the correct answer "x" for the expression "x²/x" using isSimplified method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Simplify: x²/x = {{response}}"
      valid-response [
        "x"
      ] method "isSimplified" {}
  ] {}
] {}..
```

---

### Example 76

#### Prompt
"Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O"."

#### Chat Transcript

**User**: Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What is the chemical symbol for water?"
      valid-response "H2O" {}
  ] {}
] {}..
```

---

### Example 77

#### Prompt
"Create an items assessment with a choice matrix: "Is each number even or odd?" with rows "2", "3", "4", "5" and columns "Even", "Odd" where answers are Even, Odd, Even, Odd."

#### Chat Transcript

**User**: Create an items assessment with a choice matrix: "Is each number even or odd?" with rows "2", "3", "4", "5" and columns "Even", "Odd" where answers are Even, Odd, Even, Odd.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "Is each number even or odd?"
      rows [
        "2"
        "3"
        "4"
        "5"
      ] columns [
      "Even"
      "Odd"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
      [
        0
      ]
      [
        1
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 78

#### Prompt
"Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit."

#### Chat Transcript

**User**: Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    longtext stimulus "Analyze the themes in the poem."
      max-length 600
      placeholder "Start writing here..." {}
  ] {}
] {}..
```

---

### Example 79

#### Prompt
"Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct."

#### Chat Transcript

**User**: Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "What is 3 × 4?"
      options [
        "7"
        "10"
        "12"
        "15"
      ] valid-response [
      2
    ] {}
  ] {}
] {}..
```

---

### Example 80

#### Prompt
"Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation...".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    longtext stimulus "Explain how gravity works"
      max-length 400
      placeholder "Begin your explanation..." {}
  ] {}
] {}..
```

---

### Example 81

#### Prompt
"Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "Spell the number 4"
      valid-response "four"
      case-sensitive false {}
  ] {}
] {}..
```

---

### Example 82

#### Prompt
"Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What gas do plants absorb?"
      valid-response "carbon dioxide"
      case-sensitive false {}
  ] {}
] {}..
```

---

### Example 83

#### Prompt
"Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Which is a mammal?"
      options [
        "Shark"
        "Eagle"
        "Dolphin"
        "Lizard"
      ] valid-response [
      2
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 84

#### Prompt
"Create a cloze dropdown question with the template "The sky is {{response}}" with dropdown options "blue", "red", "green" where blue is correct."

#### Chat Transcript

**User**: Create a cloze dropdown question with the template "The sky is {{response}}" with dropdown options "blue", "red", "green" where blue is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozedropdown stimulus "The sky is {{response}}"
      possible-responses [
        [
          "blue"
          "red"
          "green"
        ]
      ] valid-response [
      "blue"
    ] {}
  ] {}
] {}..
```

---

### Example 85

#### Prompt
"Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters.

Create a short text question asking "What is 7 × 8?" with the correct answer "56"."

#### Chat Transcript

**User**: Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters.

**User**: Create a short text question asking "What is 7 × 8?" with the correct answer "56".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What is 7 × 8?"
      valid-response "56" {}
  ] {}
] {}..
```

---

### Example 86

#### Prompt
"Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo"."

#### Chat Transcript

**User**: Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What is the capital of Japan?"
      valid-response "Tokyo" {}
  ] {}
] {}..
```

---

### Example 87

#### Prompt
"Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} is the powerhouse of the cell."
      valid-response [
        "mitochondria"
      ] {}
  ] {}
] {}..
```

---

### Example 88

#### Prompt
"Create a cloze text with instant feedback and the template "Plants convert {{response}} into oxygen" with the correct answer "carbon dioxide"."

#### Chat Transcript

**User**: Create a cloze text with instant feedback and the template "Plants convert {{response}} into oxygen" with the correct answer "carbon dioxide".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "Plants convert {{response}} into oxygen"
      valid-response [
        "carbon dioxide"
      ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 89

#### Prompt
"Create a cloze dropdown: "Water boils at {{response}} degrees Celsius" with options "50", "100", "150" where 100 is correct."

#### Chat Transcript

**User**: Create a cloze dropdown: "Water boils at {{response}} degrees Celsius" with options "50", "100", "150" where 100 is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozedropdown stimulus "Water boils at {{response}} degrees Celsius"
      possible-responses [
        [
          "50"
          "100"
          "150"
        ]
      ] valid-response [
      "100"
    ] {}
  ] {}
] {}..
```

---

### Example 90

#### Prompt
"Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific"."

#### Chat Transcript

**User**: Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "Name the largest ocean"
      valid-response "Pacific"
      placeholder "Enter your answer here" {}
  ] {}
] {}..
```

---

### Example 91

#### Prompt
"Update the existing item with id <ITEM_ID>: keep the stem and options unchanged, but change the difficulty tag from medium to hard and update DOK from 2 to 3 — leave the distractor rationale alone."

#### Chat Transcript

**User**: Update the existing item with id <ITEM_ID>: keep the stem and options unchanged, but change the difficulty tag from medium to hard and update DOK from 2 to 3 — leave the distractor rationale alone.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      Difficulty: "hard"
      DOK: 3
    }
  ] questions [
    mcq {}
  ] {}
] save-to-itembank true {}..
```

---

### Example 92

#### Prompt
"Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O", tagged with CCSS 5-PS1-1, difficulty easy, DOK 1."

#### Chat Transcript

**User**: Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O", tagged with CCSS 5-PS1-1, difficulty easy, DOK 1.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      CCSS: "5-PS1-1"
      Difficulty: "easy"
      DOK: 1
    }
  ] questions [
    shorttext stimulus "What is the chemical symbol for water?"
      valid-response "H2O" {}
  ] {}
] {}..
```

---

### Example 93

#### Prompt
"Create a choice matrix asking "Identify the part of speech" with rows "run", "beautiful", "quickly" and columns "Noun", "Verb", "Adjective", "Adverb" where answers are Verb, Adjective, and Adverb."

#### Chat Transcript

**User**: Create a choice matrix asking "Identify the part of speech" with rows "run", "beautiful", "quickly" and columns "Noun", "Verb", "Adjective", "Adverb" where answers are Verb, Adjective, and Adverb.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "Identify the part of speech"
      rows [
        "run"
        "beautiful"
        "quickly"
      ] columns [
      "Noun"
      "Verb"
      "Adjective"
      "Adverb"
    ] valid-response [
      [
        1
      ]
      [
        2
      ]
      [
        3
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 94

#### Prompt
"Create a cloze formula question asking "Evaluate: 2³ = {{response}}" with the correct answer "8" using equivValue method."

#### Chat Transcript

**User**: Create a cloze formula question asking "Evaluate: 2³ = {{response}}" with the correct answer "8" using equivValue method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Evaluate: 2³ = {{response}}"
      valid-response [
        "8"
      ] method "equivValue" {}
  ] {}
] {}..
```

---

### Example 95

#### Prompt
"Create a cloze formula question asking "What is the derivative of x²? {{response}}" with the correct answer "2x" using equivSymbolic method."

#### Chat Transcript

**User**: Create a cloze formula question asking "What is the derivative of x²? {{response}}" with the correct answer "2x" using equivSymbolic method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "What is the derivative of x²? {{response}}"
      valid-response [
        "2x"
      ] method "equivSymbolic" {}
  ] {}
] {}..
```

---

### Example 96

#### Prompt
"Create a choice matrix asking "Classify each animal" with rows "Whale", "Cobra", "Eagle" and columns "Mammal", "Reptile", "Bird" where each matches respectively."

#### Chat Transcript

**User**: Create a choice matrix asking "Classify each animal" with rows "Whale", "Cobra", "Eagle" and columns "Mammal", "Reptile", "Bird" where each matches respectively.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "Classify each animal"
      rows [
        "Whale"
        "Cobra"
        "Eagle"
      ] columns [
      "Mammal"
      "Reptile"
      "Bird"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
      [
        2
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 97

#### Prompt
"Create an items assessment with an order list asking "Order the planets from the Sun" with items "Earth", "Mars", "Venus", "Mercury" in correct order Mercury, Venus, Earth, Mars, and a classification sorting them into "Inner" and "Outer" categories."

#### Chat Transcript

**User**: Create an items assessment with an order list asking "Order the planets from the Sun" with items "Earth", "Mars", "Venus", "Mercury" in correct order Mercury, Venus, Earth, Mars, and a classification sorting them into "Inner" and "Outer" categories.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Order the planets from the Sun"
      list [
        "Earth"
        "Mars"
        "Venus"
        "Mercury"
      ] valid-response [
      3
      2
      0
      1
    ] {}
    classification stimulus "Sort the planets into Inner and Outer categories"
      possible-responses [
        "Earth"
        "Mars"
        "Venus"
        "Mercury"
      ] categories [
      "Inner"
      "Outer"
    ] valid-response [
      [
        2
        3
        0
      ]
      [
        1
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 98

#### Prompt
"Create a cloze text question with the template "{{response}} is the chemical symbol for gold" with the correct answer "Au"."

#### Chat Transcript

**User**: Create a cloze text question with the template "{{response}} is the chemical symbol for gold" with the correct answer "Au".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "{{response}} is the chemical symbol for gold."
      valid-response [
        "Au"
      ] {}
  ] {}
] {}..
```

---

### Example 99

#### Prompt
"Create a cloze dropdown with instant feedback: "HTML stands for {{response}}" with options "HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language" where the first is correct."

#### Chat Transcript

**User**: Create a cloze dropdown with instant feedback: "HTML stands for {{response}}" with options "HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language" where the first is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozedropdown stimulus "HTML stands for {{response}}"
      possible-responses [
        [
          "HyperText Markup Language"
          "High Tech Modern Language"
          "Home Tool Markup Language"
        ]
      ] valid-response [
      "HyperText Markup Language"
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 100

#### Prompt
"Create an order list with instant feedback asking "Arrange alphabetically" with items "Cherry", "Apple", "Banana", "Date" where the correct order is Apple, Banana, Cherry, Date."

#### Chat Transcript

**User**: Create an order list with instant feedback asking "Arrange alphabetically" with items "Cherry", "Apple", "Banana", "Date" where the correct order is Apple, Banana, Cherry, Date.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Arrange alphabetically"
      list [
        "Cherry"
        "Apple"
        "Banana"
        "Date"
      ] valid-response [
      1
      2
      0
      3
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 101

#### Prompt
"Create a plain text essay question asking "Explain your reasoning" with a 200-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Explain your reasoning" with a 200-word limit.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    plaintext stimulus "Explain your reasoning"
      max-word-count 200 {}
  ] {}
] {}..
```

---

### Example 102

#### Prompt
"Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "Photosynthesis occurs in the {{response}} of plant cells"
      valid-response [
        "chloroplast"
      ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 103

#### Prompt
"Create an items assessment with a cloze dropdown "Water is {{response}}" with options "solid", "liquid", "gas" where liquid is correct, and a cloze association "Ice is {{response}}" with possible responses "solid", "liquid", "gas" where solid is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze dropdown "Water is {{response}}" with options "solid", "liquid", "gas" where liquid is correct, and a cloze association "Ice is {{response}}" with possible responses "solid", "liquid", "gas" where solid is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozedropdown stimulus "Water is {{response}}"
      possible-responses [
        [
          "solid"
          "liquid"
          "gas"
        ]
      ] valid-response [
      "liquid"
    ] {}
    clozeassociation stimulus "Ice is {{response}}"
      possible-responses [
        "solid"
        "liquid"
        "gas"
      ] valid-response [
      "solid"
    ] {}
  ] {}
] {}..
```

---

### Example 104

#### Prompt
"Create a classification question asking "Sort animals by class" with categories "Mammals" and "Reptiles" and items "dog, snake, cat, lizard", tagged with NGSS MS-LS4-2 and difficulty medium, with an item-level note "Variant for the genetics unit; pair with the inheritance MCQ"."

#### Chat Transcript

**User**: Create a classification question asking "Sort animals by class" with categories "Mammals" and "Reptiles" and items "dog, snake, cat, lizard", tagged with NGSS MS-LS4-2 and difficulty medium, with an item-level note "Variant for the genetics unit; pair with the inheritance MCQ".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item metadata [
    tags {
      NGSS: "MS-LS4-2"
      Difficulty: "medium"
    }
    notes "Variant for the genetics unit; pair with the inheritance MCQ"
  ] questions [
    classification stimulus "Sort animals by class"
      possible-responses [
        "dog"
        "snake"
        "cat"
        "lizard"
      ] categories [
      "Mammals"
      "Reptiles"
    ] valid-response [
      [
        0
        2
      ]
      [
        1
        3
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 105

#### Prompt
"Create an items assessment with a cloze formula "Solve: 2x = 10. x = {{response}}" with correct answer "5", and a short text question asking "Is this equation linear?" with correct answer "yes"."

#### Chat Transcript

**User**: Create an items assessment with a cloze formula "Solve: 2x = 10. x = {{response}}" with correct answer "5", and a short text question asking "Is this equation linear?" with correct answer "yes".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "Solve: 2x = 10. x = {{response}}"
      valid-response [
        "5"
      ] method "equivLiteral" {}
    shorttext stimulus "Is this equation linear?"
      valid-response "yes" {}
  ] {}
] {
  v: 1
}..
```

---

### Example 106

#### Prompt
"Create a classification with instant feedback asking "Sort by era" with categories "Ancient", "Modern" and items "Pyramids", "Internet", "Roman Empire", "Space Station" where Pyramids and Roman Empire are Ancient and Internet and Space Station are Modern."

#### Chat Transcript

**User**: Create a classification with instant feedback asking "Sort by era" with categories "Ancient", "Modern" and items "Pyramids", "Internet", "Roman Empire", "Space Station" where Pyramids and Roman Empire are Ancient and Internet and Space Station are Modern.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Sort by era"
      categories [
        "Ancient"
        "Modern"
      ] possible-responses [
      "Pyramids"
      "Internet"
      "Roman Empire"
      "Space Station"
    ] valid-response [
      [
        0
        2
      ]
      [
        1
        3
      ]
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 107

#### Prompt
"Create a cloze dropdown question with the template "The largest mammal is the {{response}}" with options "blue whale", "elephant", "giraffe" where blue whale is correct."

#### Chat Transcript

**User**: Create a cloze dropdown question with the template "The largest mammal is the {{response}}" with options "blue whale", "elephant", "giraffe" where blue whale is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozedropdown stimulus "The largest mammal is the {{response}}"
      possible-responses [
        [
          "blue whale"
          "elephant"
          "giraffe"
        ]
      ] valid-response [
      "blue whale"
    ] {}
  ] {}
] {}..
```

---

### Example 108

#### Prompt
"Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct."

#### Chat Transcript

**User**: Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Which are prime numbers?"
      options [
        "2"
        "4"
        "7"
        "9"
      ] valid-response [
      0
      2
    ] multiple-responses true {}
  ] {}
] {}..
```

---

### Example 109

#### Prompt
"Create a bow-tie for a post-op patient with sudden tachycardia and low oxygen saturation. Columns: "Actions", "Condition", "Monitor". Actions: "administer oxygen", "notify provider", "encourage oral fluids", "ambulate the patient". Condition: "pulmonary embolism", "myocardial infarction", "atelectasis". Monitor: "oxygen saturation", "respiratory rate", "dietary intake", "capillary refill". Correct actions: "administer oxygen", "notify provider". Correct condition: "pulmonary embolism". Correct monitors: "oxygen saturation", "respiratory rate"."

#### Chat Transcript

**User**: Create a bow-tie for a post-op patient with sudden tachycardia and low oxygen saturation. Columns: "Actions", "Condition", "Monitor". Actions: "administer oxygen", "notify provider", "encourage oral fluids", "ambulate the patient". Condition: "pulmonary embolism", "myocardial infarction", "atelectasis". Monitor: "oxygen saturation", "respiratory rate", "dietary intake", "capillary refill". Correct actions: "administer oxygen", "notify provider". Correct condition: "pulmonary embolism". Correct monitors: "oxygen saturation", "respiratory rate".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    bowtie stimulus "A post-operative patient suddenly develops tachycardia and low oxygen saturation. Select the appropriate actions, the most likely condition, and the parameters to monitor."
      column-titles [
        "Actions"
        "Condition"
        "Monitor"
      ] possible-responses [
      [
        "administer oxygen"
        "notify provider"
        "encourage oral fluids"
        "ambulate the patient"
      ]
      [
        "pulmonary embolism"
        "myocardial infarction"
        "atelectasis"
      ]
      [
        "oxygen saturation"
        "respiratory rate"
        "dietary intake"
        "capillary refill"
      ]
    ] valid-response [
      [
        "administer oxygen"
        "notify provider"
      ]
      [
        "pulmonary embolism"
      ]
      [
        "oxygen saturation"
        "respiratory rate"
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 110

#### Prompt
"Create a cloze association question with the template "{{response}} wrote Romeo and Juliet" with possible responses "Shakespeare", "Dickens", "Austen" where Shakespeare is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "{{response}} wrote Romeo and Juliet" with possible responses "Shakespeare", "Dickens", "Austen" where Shakespeare is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} wrote Romeo and Juliet"
      possible-responses [
        "Shakespeare"
        "Dickens"
        "Austen"
      ] valid-response [
      "Shakespeare"
    ] {}
  ] {}
] {}..
```

---

### Example 111

#### Prompt
"Create an items assessment with a cloze dropdown: "The Earth revolves around the {{response}}" with options "Sun", "Moon", "Mars" where Sun is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze dropdown: "The Earth revolves around the {{response}}" with options "Sun", "Moon", "Mars" where Sun is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozedropdown stimulus "The Earth revolves around the {{response}}"
      possible-responses [
        [
          "Sun"
          "Moon"
          "Mars"
        ]
      ] valid-response [
      "Sun"
    ] {}
  ] {}
] {}..
```

---

### Example 112

#### Prompt
"Create a cloze formula question asking "What is 5 × 6? {{response}}" with the correct answer "30" using equivLiteral method."

#### Chat Transcript

**User**: Create a cloze formula question asking "What is 5 × 6? {{response}}" with the correct answer "30" using equivLiteral method.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeformula stimulus "What is 5 × 6? {{response}}"
      valid-response [
        "30"
      ] method "equivLiteral" {}
  ] {}
] {}..
```

---

### Example 113

#### Prompt
"Create a cloze text question with the template "The {{response}} of the United States is Washington, D.C." with the correct answers "capital" or "Capital"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The {{response}} of the United States is Washington, D.C." with the correct answers "capital" or "Capital".

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} of the United States is Washington, D.C."
      valid-response [
        "capital"
        "Capital"
      ] {}
  ] {}
] {}..
```

---

### Example 114

#### Prompt
"Create a choice matrix question asking "Rate your agreement" with rows "Exercise is important", "Sleep is optional" and columns "Agree", "Disagree" where answers are Agree and Disagree."

#### Chat Transcript

**User**: Create a choice matrix question asking "Rate your agreement" with rows "Exercise is important", "Sleep is optional" and columns "Agree", "Disagree" where answers are Agree and Disagree.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    choicematrix stimulus "Rate your agreement"
      rows [
        "Exercise is important"
        "Sleep is optional"
      ] columns [
      "Agree"
      "Disagree"
    ] valid-response [
      [
        0
      ]
      [
        1
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 115

#### Prompt
"Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Which season comes after spring?"
      options [
        "Summer"
        "Fall"
        "Winter"
      ] valid-response [
      0
    ] {}
  ] {}
] {}..
```

---

### Example 116

#### Prompt
"Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    mcq stimulus "Which planet is largest?"
      options [
        "Earth"
        "Jupiter"
        "Mars"
        "Saturn"
      ] valid-response [
      1
    ] {}
  ] {}
] {}..
```

---

### Example 117

#### Prompt
"Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    shorttext stimulus "What is the opposite of hot?"
      valid-response "cold"
      case-sensitive false {}
  ] {}
] {}..
```

---

### Example 118

#### Prompt
"Create a classification question asking "Sort by state of matter" with categories "Solid", "Liquid", "Gas" and items "Ice", "Water", "Steam", "Rock", "Juice", "Helium" where Ice and Rock are Solid, Water and Juice are Liquid, and Steam and Helium are Gas."

#### Chat Transcript

**User**: Create a classification question asking "Sort by state of matter" with categories "Solid", "Liquid", "Gas" and items "Ice", "Water", "Steam", "Rock", "Juice", "Helium" where Ice and Rock are Solid, Water and Juice are Liquid, and Steam and Helium are Gas.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Sort by state of matter"
      possible-responses [
        "Ice"
        "Water"
        "Steam"
        "Rock"
        "Juice"
        "Helium"
      ] categories [
      "Solid"
      "Liquid"
      "Gas"
    ] valid-response [
      [
        0
        3
      ]
      [
        1
        4
      ]
      [
        2
        5
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 119

#### Prompt
"Create a classification question asking "Sort the animals" with categories "Mammals" and "Reptiles" and items "Dog", "Snake", "Cat", "Lizard" where Dog and Cat are Mammals and Snake and Lizard are Reptiles."

#### Chat Transcript

**User**: Create a classification question asking "Sort the animals" with categories "Mammals" and "Reptiles" and items "Dog", "Snake", "Cat", "Lizard" where Dog and Cat are Mammals and Snake and Lizard are Reptiles.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    classification stimulus "Sort the animals"
      possible-responses [
        "Dog"
        "Snake"
        "Cat"
        "Lizard"
      ] categories [
      "Mammals"
      "Reptiles"
    ] valid-response [
      [
        0
        2
      ]
      [
        1
        3
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 120

#### Prompt
"Create an items assessment with a cloze association: "The {{response}} is the closest star to Earth" with possible responses "Sun", "Moon", "Mars" where Sun is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze association: "The {{response}} is the closest star to Earth" with possible responses "Sun", "Moon", "Mars" where Sun is correct.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    clozeassociation stimulus "The {{response}} is the closest star to Earth"
      possible-responses [
        "Sun"
        "Moon"
        "Mars"
      ] valid-response [
      "Sun"
    ] {}
  ] {}
] {}..
```

---

### Example 121

#### Prompt
"Create an order list asking "Order from coldest to hottest" with items "Boiling water", "Room temperature", "Ice", "Body temperature" where the correct order is Ice, Room temperature, Body temperature, Boiling water."

#### Chat Transcript

**User**: Create an order list asking "Order from coldest to hottest" with items "Boiling water", "Room temperature", "Ice", "Body temperature" where the correct order is Ice, Room temperature, Body temperature, Boiling water.

#### Code

```
set-var "lrn-id" get-val-public "itemId"
learnosity items [
  item questions [
    orderlist stimulus "Order from coldest to hottest"
      list [
        "Boiling water"
        "Room temperature"
        "Ice"
        "Body temperature"
      ] valid-response [
      2
      1
      3
      0
    ] {}
  ] {}
] {}..
```



