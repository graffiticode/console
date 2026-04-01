# Graffiticode Training Examples

*Downloaded on 2026-04-01T01:20:57.607Z*

## Language L0158

### Example 1

#### Prompt
"Create a cloze dropdown: "Water boils at {{response}} degrees Celsius" with options "50", "100", "150" where 100 is correct."

#### Chat Transcript

**User**: Create a cloze dropdown: "Water boils at {{response}} degrees Celsius" with options "50", "100", "150" where 100 is correct.

#### Code

```
set-var "lrn-id" "1IgvIk8fW6ggFT9MTmxz"
learnosity items [
  item questions [
    clozedropdown stimulus "Water boils at {{response}} degrees Celsius" possible-responses [
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

### Example 2

#### Prompt
"Create an items assessment with a cloze text "The {{response}} is the largest organ" with correct answer "skin", and an MCQ asking "Which system does it belong to?" with options "Nervous", "Digestive", "Integumentary" where Integumentary is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze text "The {{response}} is the largest organ" with correct answer "skin", and an MCQ asking "Which system does it belong to?" with options "Nervous", "Digestive", "Integumentary" where Integumentary is correct.

#### Code

```
set-var "lrn-id" "1WiFrbl0qyJZ2pabdD7c"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} is the largest organ" valid-response [
      "skin"
    ] {}
    mcq stimulus "Which system does it belong to?" options [
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

### Example 3

#### Prompt
"Create an items assessment with three MCQ questions about geography: capital of France (Paris), capital of Japan (Tokyo), and capital of Australia (Canberra)."

#### Chat Transcript

**User**: Create an items assessment with three MCQ questions about geography: capital of France (Paris), capital of Japan (Tokyo), and capital of Australia (Canberra).

#### Code

```
set-var "lrn-id" "5Wow743uYsqWqXsp6z3V"
learnosity items [
  item questions [
    mcq stimulus "What is the capital of France?" options [
      "Paris"
      "London"
      "Berlin"
      "Madrid"
    ] valid-response [
      0
    ] {}
    mcq stimulus "What is the capital of Japan?" options [
      "Osaka"
      "Kyoto"
      "Tokyo"
      "Hiroshima"
    ] valid-response [
      2
    ] {}
    mcq stimulus "What is the capital of Australia?" options [
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

### Example 4

#### Prompt
"Create a cloze dropdown question with the template "The largest mammal is the {{response}}" with options "blue whale", "elephant", "giraffe" where blue whale is correct."

#### Chat Transcript

**User**: Create a cloze dropdown question with the template "The largest mammal is the {{response}}" with options "blue whale", "elephant", "giraffe" where blue whale is correct.

#### Code

```
set-var "lrn-id" "6EWyoX6UHbU8l4wjpiae"
learnosity items [
  item questions [
    clozedropdown stimulus "The largest mammal is the {{response}}" possible-responses [
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

### Example 5

#### Prompt
"Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo"."

#### Chat Transcript

**User**: Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo".

#### Code

```
set-var "lrn-id" "6lK6cTB0QQgBjs1XQBc7"
learnosity items [
  item questions [
    shorttext stimulus "What is the capital of Japan?" valid-response "Tokyo" {}
  ] {}
] {}..
```

---

### Example 6

#### Prompt
"Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct.

#### Code

```
set-var "lrn-id" "7E0ndP1vJfFu9U5fQcsY"
learnosity items [
  item questions [
    mcq stimulus "Which language is L0158 built for?" options [
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

### Example 7

#### Prompt
"Create a cloze text question with the template "The speed of {{response}} is approximately 300,000 km/s" with the correct answer "light"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The speed of {{response}} is approximately 300,000 km/s" with the correct answer "light".

#### Code

```
set-var "lrn-id" "7wsDHiSuWkwHskk3pak2"
learnosity items [
  item questions [
    clozetext stimulus "The speed of {{response}} is approximately 300,000 km/s" valid-response [
      "light"
    ] {}
  ] {}
] {}..
```

---

### Example 8

#### Prompt
"Create an items assessment with a cloze formula "Solve: 2x = 10. x = {{response}}" with correct answer "5", and a short text question asking "Is this equation linear?" with correct answer "yes"."

#### Chat Transcript

**User**: Create an items assessment with a cloze formula "Solve: 2x = 10. x = {{response}}" with correct answer "5", and a short text question asking "Is this equation linear?" with correct answer "yes".

#### Code

```
set-var "lrn-id" "95uMaPyaSFWYJIhVIeid"
learnosity items [
  item questions [
    clozeformula stimulus "Solve: 2x = 10. x = {{response}}" valid-response [
      "5"
    ] method "equivLiteral" {}
    shorttext stimulus "Is this equation linear?" valid-response "yes" {}
  ] {}
] {}..
```

---

### Example 9

#### Prompt
"Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here...".

#### Code

```
set-var "lrn-id" "9h2ex3qnuQNcizIEwAiQ"
learnosity items [
  item questions [
    longtext stimulus "Write about your favorite book" placeholder "Start writing here..." {}
  ] {}
] {}..
```

---

### Example 10

#### Prompt
"Create an order list question asking "Order these fractions from least to greatest" with items "1/2", "1/4", "3/4", "1/8" where the correct order is 1/8, 1/4, 1/2, 3/4."

#### Chat Transcript

**User**: Create an order list question asking "Order these fractions from least to greatest" with items "1/2", "1/4", "3/4", "1/8" where the correct order is 1/8, 1/4, 1/2, 3/4.

#### Code

```
set-var "lrn-id" "A8mJAZhOuH8gWorABGhm"
learnosity items [
  item questions [
    orderlist stimulus "Order these fractions from least to greatest" list [
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

### Example 11

#### Prompt
"Create an order list asking "Order from coldest to hottest" with items "Boiling water", "Room temperature", "Ice", "Body temperature" where the correct order is Ice, Room temperature, Body temperature, Boiling water."

#### Chat Transcript

**User**: Create an order list asking "Order from coldest to hottest" with items "Boiling water", "Room temperature", "Ice", "Body temperature" where the correct order is Ice, Room temperature, Body temperature, Boiling water.

#### Code

```
set-var "lrn-id" "CKHLNJ7UfGsfEHNL7E89"
learnosity items [
  item questions [
    orderlist stimulus "Order from coldest to hottest" list [
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

---

### Example 12

#### Prompt
"Create a cloze text question with the template "The {{response}} of the United States is Washington, D.C." with the correct answers "capital" or "Capital"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The {{response}} of the United States is Washington, D.C." with the correct answers "capital" or "Capital".

#### Code

```
set-var "lrn-id" "CKoYHuffRx3EjbgVDZg4"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} of the United States is Washington, D.C." valid-response [
      "capital"
      "Capital"
    ] {}
  ] {}
] {}..
```

---

### Example 13

#### Prompt
"Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct."

#### Chat Transcript

**User**: Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct.

#### Code

```
set-var "lrn-id" "DJCMsxOE3y7qaZ9W8gb4"
learnosity items [
  item questions [
    mcq stimulus "What is 2 + 2?" options [
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

### Example 14

#### Prompt
"Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive.

#### Code

```
set-var "lrn-id" "DY7jADczkd4UoLIf0YhK"
learnosity items [
  item questions [
    shorttext stimulus "What is the abbreviation for Doctor?" valid-response "Dr." case-sensitive true {}
  ] {}
] {}..
```

---

### Example 15

#### Prompt
"Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria".

#### Code

```
set-var "lrn-id" "Dbne402rxjy22myr9ui1"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} is the powerhouse of the cell." valid-response [
      "mitochondria"
    ] {}
  ] {}
] {}..
```

---

### Example 16

#### Prompt
"Create a cloze dropdown question with the template "The sky is {{response}}" with dropdown options "blue", "red", "green" where blue is correct."

#### Chat Transcript

**User**: Create a cloze dropdown question with the template "The sky is {{response}}" with dropdown options "blue", "red", "green" where blue is correct.

#### Code

```
set-var "lrn-id" "EWAbAMZqmEk8SAukdXQh"
learnosity items [
  item questions [
    clozedropdown stimulus "The sky is {{response}}" possible-responses [
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

### Example 17

#### Prompt
"Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback.

#### Code

```
set-var "lrn-id" "FOgeRNAml3cIew7CMFFr"
learnosity items [
  item questions [
    mcq stimulus "What is the square root of 144?" options [
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

### Example 18

#### Prompt
"Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses."

#### Chat Transcript

**User**: Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses.

#### Code

```
set-var "lrn-id" "FuRb9MmmrsvG52SeP09N"
learnosity items [
  item questions [
    mcq stimulus "Select all even numbers" options [
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

### Example 19

#### Prompt
"Create an items assessment with a choice matrix: "Is each number even or odd?" with rows "2", "3", "4", "5" and columns "Even", "Odd" where answers are Even, Odd, Even, Odd."

#### Chat Transcript

**User**: Create an items assessment with a choice matrix: "Is each number even or odd?" with rows "2", "3", "4", "5" and columns "Even", "Odd" where answers are Even, Odd, Even, Odd.

#### Code

```
set-var "lrn-id" "HOFIaE2NKTtWcTKpjMcp"
learnosity items [
  item questions [
    choicematrix stimulus "Is each number even or odd?" rows [
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

### Example 20

#### Prompt
"Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O"."

#### Chat Transcript

**User**: Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O".

#### Code

```
set-var "lrn-id" "HP3SVCzA5wvt5fi2lHhk"
learnosity items [
  item questions [
    shorttext stimulus "What is the chemical symbol for water?" valid-response "H2O" {}
  ] {}
] {}..
```

---

### Example 21

#### Prompt
"Create an items assessment with an order list asking "Order the planets from the Sun" with items "Earth", "Mars", "Venus", "Mercury" in correct order Mercury, Venus, Earth, Mars, and a classification sorting them into "Inner" and "Outer" categories."

#### Chat Transcript

**User**: Create an items assessment with an order list asking "Order the planets from the Sun" with items "Earth", "Mars", "Venus", "Mercury" in correct order Mercury, Venus, Earth, Mars, and a classification sorting them into "Inner" and "Outer" categories.

#### Code

```
set-var "lrn-id" "IF7e5Pgt88bJSCSBhWL3"
learnosity items [
  item questions [
    orderlist stimulus "Order the planets from the Sun" list [
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
    classification stimulus "Sort the planets into Inner and Outer categories" possible-responses [
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

### Example 22

#### Prompt
"Create a cloze dropdown with two blanks: "{{response}} are mammals and {{response}} are reptiles" with dropdown options ["Dogs", "Cats", "Fish"] and ["Snakes", "Birds", "Frogs"] where Dogs and Snakes are correct."

#### Chat Transcript

**User**: Create a cloze dropdown with two blanks: "{{response}} are mammals and {{response}} are reptiles" with dropdown options ["Dogs", "Cats", "Fish"] and ["Snakes", "Birds", "Frogs"] where Dogs and Snakes are correct.

#### Code

```
set-var "lrn-id" "JIWTyMyc8E5LoNQPekas"
learnosity items [
  item questions [
    clozedropdown stimulus "{{response}} are mammals and {{response}} are reptiles" possible-responses [
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

### Example 23

#### Prompt
"Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct.

#### Code

```
set-var "lrn-id" "Jc1Dun1HOJM8SBZtluLU"
learnosity items [
  item questions [
    mcq stimulus "Which planet is largest?" options [
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

### Example 24

#### Prompt
"Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay...".

#### Code

```
set-var "lrn-id" "K2IzqqFom4MiIsbLCPAG"
learnosity items [
  item questions [
    longtext stimulus "Discuss the causes of climate change" max-word-count 500 placeholder "Begin your essay..." {}
  ] {}
] {}..
```

---

### Example 25

#### Prompt
"Create a classification with instant feedback asking "Sort by era" with categories "Ancient", "Modern" and items "Pyramids", "Internet", "Roman Empire", "Space Station" where Pyramids and Roman Empire are Ancient and Internet and Space Station are Modern."

#### Chat Transcript

**User**: Create a classification with instant feedback asking "Sort by era" with categories "Ancient", "Modern" and items "Pyramids", "Internet", "Roman Empire", "Space Station" where Pyramids and Roman Empire are Ancient and Internet and Space Station are Modern.

#### Code

```
set-var "lrn-id" "KCOL7cFJ7cyPmg3e20oq"
learnosity items [
  item questions [
    classification stimulus "Sort by era" categories [
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

### Example 26

#### Prompt
"Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive.

#### Code

```
set-var "lrn-id" "MDURCXrs6lR4MnN686Cq"
learnosity items [
  item questions [
    shorttext stimulus "Spell the number 4" valid-response "four" case-sensitive false {}
  ] {}
] {}..
```

---

### Example 27

#### Prompt
"Create a choice matrix question asking "Rate your agreement" with rows "Exercise is important", "Sleep is optional" and columns "Agree", "Disagree" where answers are Agree and Disagree."

#### Chat Transcript

**User**: Create a choice matrix question asking "Rate your agreement" with rows "Exercise is important", "Sleep is optional" and columns "Agree", "Disagree" where answers are Agree and Disagree.

#### Code

```
set-var "lrn-id" "OdQNhvjVx2IIbGgOPrSw"
learnosity items [
  item questions [
    choicematrix stimulus "Is each statement a fact or opinion?" rows [
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
"Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit."

#### Chat Transcript

**User**: Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit.

#### Code

```
set-var "lrn-id" "Pvab7QMnbOTbORxUrysd"
learnosity items [
  item questions [
    longtext stimulus "Analyze the themes in the poem" max-word-count 600 {}
  ] {}
] {}..
```

---

### Example 29

#### Prompt
"Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options.

#### Code

```
set-var "lrn-id" "QG6oiI1iIQRPiDblZDlE"
learnosity items [
  item questions [
    mcq stimulus "Which element has atomic number 1?" options [
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

### Example 30

#### Prompt
"Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct.

#### Code

```
set-var "lrn-id" "RUSpCD45t3mGBK7jofAA"
learnosity items [
  item questions [
    mcq stimulus "Which season comes after spring?" options [
      "Summer"
      "Fall"
      "Winter"
    ] valid-response [
      0
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 31

#### Prompt
"Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive.

#### Code

```
set-var "lrn-id" "RyJfCPRwoBf2EXY7SsLw"
learnosity items [
  item questions [
    clozetext stimulus "Water is made of {{response}} and oxygen" valid-response [
      "hydrogen"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 32

#### Prompt
"Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct."

#### Chat Transcript

**User**: Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct.

#### Code

```
set-var "lrn-id" "T0gHmys7WFGz9usvSvpj"
learnosity items [
  item questions [
    mcq stimulus "What is the largest continent?" options [
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

### Example 33

#### Prompt
"Create a choice matrix with shuffled options asking "Match each country to its continent" with rows "Brazil", "Japan", "Egypt" and columns "South America", "Asia", "Africa" where each matches respectively."

#### Chat Transcript

**User**: Create a choice matrix with shuffled options asking "Match each country to its continent" with rows "Brazil", "Japan", "Egypt" and columns "South America", "Asia", "Africa" where each matches respectively.

#### Code

```
set-var "lrn-id" "T9NeRUqUxDjzDn0TbD02"
learnosity items [
  item questions [
    choicematrix stimulus "Match each country to its continent" rows [
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

### Example 34

#### Prompt
"Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive.

#### Code

```
set-var "lrn-id" "TocW1RWITsGO6LAooUQJ"
learnosity items [
  item questions [
    clozetext stimulus "Photosynthesis occurs in the {{response}} of plant cells" valid-response [
      "chloroplast"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 35

#### Prompt
"Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements..."."

#### Chat Transcript

**User**: Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements...".

#### Code

```
set-var "lrn-id" "UOneN2SO6qZyRGZmtofB"
learnosity items [
  item questions [
    plaintext stimulus "Write a brief biography" max-word-count 250 placeholder "Name, birth date, achievements..." {}
  ] {}
] {}..
```

---

### Example 36

#### Prompt
"Create a cloze text question with the template "{{response}} is the chemical symbol for gold" with the correct answer "Au"."

#### Chat Transcript

**User**: Create a cloze text question with the template "{{response}} is the chemical symbol for gold" with the correct answer "Au".

#### Code

```
set-var "lrn-id" "VU8EUoG8teyhBHOQ4Ra7"
learnosity items [
  item questions [
    clozetext stimulus "{{response}} is the chemical symbol for gold" valid-response [
      "Au"
    ] {}
  ] {}
] {}..
```

---

### Example 37

#### Prompt
"Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct."

#### Chat Transcript

**User**: Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct.

#### Code

```
set-var "lrn-id" "WSZUAF8EyyhlsuZf7G7b"
learnosity items [
  item questions [
    mcq stimulus "The Earth is flat" options [
      "True"
      "False"
    ] valid-response [
      1
    ] {}
  ] {}
] {}..
```

---

### Example 38

#### Prompt
"Create an items assessment with a long text essay asking "Describe photosynthesis" with a 300-word limit, and an MCQ asking "What gas do plants produce?" with options "CO2", "O2", "N2" where O2 is correct."

#### Chat Transcript

**User**: Create an items assessment with a long text essay asking "Describe photosynthesis" with a 300-word limit, and an MCQ asking "What gas do plants produce?" with options "CO2", "O2", "N2" where O2 is correct.

#### Code

```
set-var "lrn-id" "WXLMyKCRl2IesMUcoYRE"
learnosity items [
  item questions [
    longtext stimulus "Describe photosynthesis" max-word-count 300 {}
    mcq stimulus "What gas do plants produce?" options [
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

### Example 39

#### Prompt
"Create an items assessment with a cloze association: "The {{response}} is the closest star to Earth" with possible responses "Sun", "Moon", "Mars" where Sun is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze association: "The {{response}} is the closest star to Earth" with possible responses "Sun", "Moon", "Mars" where Sun is correct.

#### Code

```
set-var "lrn-id" "WaqWEEXfJMcwHn2Nuwfc"
learnosity items [
  item questions [
    clozeassociation stimulus "The {{response}} is the closest star to Earth" possible-responses [
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

### Example 40

#### Prompt
"Create a classification question asking "Sort by type of energy" with categories "Renewable", "Non-renewable" and items "Solar", "Coal", "Wind", "Natural Gas" where Solar and Wind are Renewable and Coal and Natural Gas are Non-renewable."

#### Chat Transcript

**User**: Create a classification question asking "Sort by type of energy" with categories "Renewable", "Non-renewable" and items "Solar", "Coal", "Wind", "Natural Gas" where Solar and Wind are Renewable and Coal and Natural Gas are Non-renewable.

#### Code

```
set-var "lrn-id" "WbC00V2picRF32SKN3Of"
learnosity items [
  item questions [
    classification stimulus "Sort by type of energy" categories [
      "Renewable"
      "Non-renewable"
    ] possible-responses [
      "Solar"
      "Coal"
      "Wind"
      "Natural Gas"
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

### Example 41

#### Prompt
"Create a cloze text question with the template "DNA stands for {{response}} acid" with the correct answer "deoxyribonucleic", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "DNA stands for {{response}} acid" with the correct answer "deoxyribonucleic", case insensitive.

#### Code

```
set-var "lrn-id" "WqpUAJiL7hbYHNsSVli5"
learnosity items [
  item questions [
    clozetext stimulus "DNA stands for {{response}} acid" valid-response [
      "deoxyribonucleic"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 42

#### Prompt
"Create an order list question asking "Order from smallest to largest" with items "Jupiter", "Earth", "Mars", "Mercury" where the correct order is Mercury, Mars, Earth, Jupiter."

#### Chat Transcript

**User**: Create an order list question asking "Order from smallest to largest" with items "Jupiter", "Earth", "Mars", "Mercury" where the correct order is Mercury, Mars, Earth, Jupiter.

#### Code

```
set-var "lrn-id" "YUMwmaeVLGSSFAp7xBm8"
learnosity items [
  item questions [
    orderlist stimulus "Order from smallest to largest" list [
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

### Example 43

#### Prompt
"Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False" where the answers are True and False."

#### Chat Transcript

**User**: Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False" where the answers are True and False.

#### Code

```
set-var "lrn-id" "YZ1a2LjBpSwYMGoNZAhc"
learnosity items [
  item questions [
    choicematrix stimulus "Classify each statement" rows [
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

### Example 44

#### Prompt
"Create a choice matrix asking "Identify the part of speech" with rows "run", "beautiful", "quickly" and columns "Noun", "Verb", "Adjective", "Adverb" where answers are Verb, Adjective, and Adverb."

#### Chat Transcript

**User**: Create a choice matrix asking "Identify the part of speech" with rows "run", "beautiful", "quickly" and columns "Noun", "Verb", "Adjective", "Adverb" where answers are Verb, Adjective, and Adverb.

#### Code

```
set-var "lrn-id" "Yc9ySH8B48RsuHLKNkAx"
learnosity items [
  item questions [
    choicematrix stimulus "Identify the part of speech" rows [
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

### Example 45

#### Prompt
"Create a classification question asking "Sort the animals" with categories "Mammals" and "Reptiles" and items "Dog", "Snake", "Cat", "Lizard" where Dog and Cat are Mammals and Snake and Lizard are Reptiles."

#### Chat Transcript

**User**: Create a classification question asking "Sort the animals" with categories "Mammals" and "Reptiles" and items "Dog", "Snake", "Cat", "Lizard" where Dog and Cat are Mammals and Snake and Lizard are Reptiles.

#### Code

```
set-var "lrn-id" "YfQdSKHnoVx0LmRWeSuY"
learnosity items [
  item questions [
    classification stimulus "Sort the animals" possible-responses [
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

### Example 46

#### Prompt
"Create a classification asking "Sort instruments" with categories "String", "Wind", "Percussion" and items "Guitar", "Flute", "Drum", "Violin", "Trumpet", "Cymbal" where Guitar and Violin are String, Flute and Trumpet are Wind, and Drum and Cymbal are Percussion."

#### Chat Transcript

**User**: Create a classification asking "Sort instruments" with categories "String", "Wind", "Percussion" and items "Guitar", "Flute", "Drum", "Violin", "Trumpet", "Cymbal" where Guitar and Violin are String, Flute and Trumpet are Wind, and Drum and Cymbal are Percussion.

#### Code

```
set-var "lrn-id" "aA9lmeNxgnnY2TAKiKm7"
learnosity items [
  item questions [
    classification stimulus "Sort instruments" categories [
      "String"
      "Wind"
      "Percussion"
    ] possible-responses [
      "Guitar"
      "Flute"
      "Drum"
      "Violin"
      "Trumpet"
      "Cymbal"
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

### Example 47

#### Prompt
"Create an order list with instant feedback asking "Arrange alphabetically" with items "Cherry", "Apple", "Banana", "Date" where the correct order is Apple, Banana, Cherry, Date."

#### Chat Transcript

**User**: Create an order list with instant feedback asking "Arrange alphabetically" with items "Cherry", "Apple", "Banana", "Date" where the correct order is Apple, Banana, Cherry, Date.

#### Code

```
set-var "lrn-id" "aC5b5PuVxkW3QHhNUT5t"
learnosity items [
  item questions [
    orderlist stimulus "Arrange alphabetically" list [
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

### Example 48

#### Prompt
"Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive.

#### Code

```
set-var "lrn-id" "aitPmLpPyDRz3p7jXVut"
learnosity items [
  item questions [
    shorttext stimulus "What gas do plants absorb?" valid-response "carbon dioxide" case-sensitive false {}
  ] {}
] {}..
```

---

### Example 49

#### Prompt
"Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive.

#### Code

```
set-var "lrn-id" "aoq2NKsJpbjeVPAyy2U8"
learnosity items [
  item questions [
    clozetext stimulus "Photosynthesis occurs in the {{response}} of plant cells" valid-response [
      "chloroplast"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 50

#### Prompt
"Create an items assessment with a plain text essay asking "Reflect on what you learned" with a 200-word limit, and an MCQ asking "How confident are you?" with options "Very", "Somewhat", "Not at all" where Very is correct."

#### Chat Transcript

**User**: Create an items assessment with a plain text essay asking "Reflect on what you learned" with a 200-word limit, and an MCQ asking "How confident are you?" with options "Very", "Somewhat", "Not at all" where Very is correct.

#### Code

```
set-var "lrn-id" "b0vkZJueWE3OdUcydX9E"
learnosity items [
  item questions [
    plaintext stimulus "Reflect on what you learned" max-word-count 200 {}
    mcq stimulus "How confident are you?" options [
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

### Example 51

#### Prompt
"Create a cloze association question with the template "Drag the correct answer: {{response}} is the largest planet" with possible responses "Jupiter", "Saturn", "Earth" where Jupiter is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "Drag the correct answer: {{response}} is the largest planet" with possible responses "Jupiter", "Saturn", "Earth" where Jupiter is correct.

#### Code

```
set-var "lrn-id" "biTQp0EpiZgdmyLTouZT"
learnosity items [
  item questions [
    clozeassociation stimulus "Drag the correct answer: {{response}} is the largest planet" possible-responses [
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

### Example 52

#### Prompt
"Create a plain text essay question asking "Summarize the main argument" with a 150-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Summarize the main argument" with a 150-word limit.

#### Code

```
set-var "lrn-id" "cfx7Wq1jWGmK751vT0EO"
learnosity items [
  item questions [
    plaintext stimulus "Summarize the main argument" max-word-count 150 {}
  ] {}
] {}..
```

---

### Example 53

#### Prompt
"Create a plain text essay question asking "Explain your reasoning" with a 200-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Explain your reasoning" with a 200-word limit.

#### Code

```
set-var "lrn-id" "d404yTurCzArkFA6KHSN"
learnosity items [
  item questions [
    plaintext stimulus "Explain your reasoning" max-word-count 200 {}
  ] {}
] {}..
```

---

### Example 54

#### Prompt
"Create a classification question asking "Sort by state of matter" with categories "Solid", "Liquid", "Gas" and items "Ice", "Water", "Steam", "Rock", "Juice", "Helium" where Ice and Rock are Solid, Water and Juice are Liquid, and Steam and Helium are Gas."

#### Chat Transcript

**User**: Create a classification question asking "Sort by state of matter" with categories "Solid", "Liquid", "Gas" and items "Ice", "Water", "Steam", "Rock", "Juice", "Helium" where Ice and Rock are Solid, Water and Juice are Liquid, and Steam and Helium are Gas.

#### Code

```
set-var "lrn-id" "d6KOKjIA4y3Z2q0dafTf"
learnosity items [
  item questions [
    classification stimulus "Sort by state of matter" categories [
      "Solid"
      "Liquid"
      "Gas"
    ] possible-responses [
      "Ice"
      "Water"
      "Steam"
      "Rock"
      "Juice"
      "Helium"
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

### Example 55

#### Prompt
"Create an items assessment with a choice matrix about weather: rows "Rain", "Snow", "Sunshine" with columns "Warm", "Cold" where Rain is Warm, Snow is Cold, and Sunshine is Warm."

#### Chat Transcript

**User**: Create an items assessment with a choice matrix about weather: rows "Rain", "Snow", "Sunshine" with columns "Warm", "Cold" where Rain is Warm, Snow is Cold, and Sunshine is Warm.

#### Code

```
set-var "lrn-id" "dClTuXusoCNOykUu9PtU"
learnosity items [
  item questions [
    choicematrix stimulus "Which weather is warm or cold?" rows [
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

### Example 56

#### Prompt
"Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit."

#### Chat Transcript

**User**: Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit.

#### Code

```
set-var "lrn-id" "dJshWYT8JBPiHDqERDKV"
learnosity items [
  item questions [
    longtext stimulus "Compare and contrast two historical events" max-word-count 400 {}
  ] {}
] {}..
```

---

### Example 57

#### Prompt
"Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct."

#### Chat Transcript

**User**: Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct.

#### Code

```
set-var "lrn-id" "fDOveWPep9wqdXucgQTm"
learnosity items [
  item questions [
    mcq stimulus "Which are prime numbers?" options [
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

### Example 58

#### Prompt
"Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct."

#### Chat Transcript

**User**: Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct.

#### Code

```
set-var "lrn-id" "fJfxEEwrWjWaZKtFb4Cs"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} is to hot as {{response}} is to cold" possible-responses [
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

### Example 59

#### Prompt
"Create an items assessment with an order list: "Order these numbers" with items "5", "2", "8", "1" where the correct order is 1, 2, 5, 8."

#### Chat Transcript

**User**: Create an items assessment with an order list: "Order these numbers" with items "5", "2", "8", "1" where the correct order is 1, 2, 5, 8.

#### Code

```
set-var "lrn-id" "fSuqcS9AWmt51FagramU"
learnosity items [
  item questions [
    orderlist stimulus "Order these numbers" list [
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

### Example 60

#### Prompt
"Create an items assessment combining all question types: an MCQ, a short text, a cloze text, and an order list, all related to basic math facts."

#### Chat Transcript

**User**: Create an items assessment combining all question types: an MCQ, a short text, a cloze text, and an order list, all related to basic math facts.

#### Code

```
set-var "lrn-id" "gb9UqPK23FCATCv1RvCl"
learnosity items [
  item questions [
    mcq stimulus "What is 6 × 7?" options [
      "36"
      "42"
      "48"
      "54"
    ] valid-response [
      1
    ] {}
    shorttext stimulus "What is the square root of 64?" valid-response "8" {}
    clozetext stimulus "If you have {{response}} apples and add 9 more, you will have 15 apples." valid-response [
      "6"
    ] {}
    orderlist stimulus "Arrange these numbers from smallest to largest." list [
      "25"
      "7"
      "13"
      "2"
      "19"
    ] valid-response [
      3
      1
      2
      4
      0
    ] {}
  ] {}
] {}..
```

---

### Example 61

#### Prompt
"Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct."

#### Chat Transcript

**User**: Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct.

#### Code

```
set-var "lrn-id" "hiIQ0fDT0kQlSfe3eQkO"
learnosity items [
  item questions [
    mcq stimulus "What is 3 × 4?" options [
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

### Example 62

#### Prompt
"Create an items assessment with a cloze dropdown: "The Earth revolves around the {{response}}" with options "Sun", "Moon", "Mars" where Sun is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze dropdown: "The Earth revolves around the {{response}}" with options "Sun", "Moon", "Mars" where Sun is correct.

#### Code

```
set-var "lrn-id" "i2pLk0W2keicOimcQImI"
learnosity items [
  item questions [
    clozedropdown stimulus "The Earth revolves around the {{response}}" possible-responses [
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

### Example 63

#### Prompt
"Create a cloze text with instant feedback and the template "Plants convert {{response}} into oxygen" with the correct answer "carbon dioxide"."

#### Chat Transcript

**User**: Create a cloze text with instant feedback and the template "Plants convert {{response}} into oxygen" with the correct answer "carbon dioxide".

#### Code

```
set-var "lrn-id" "iPdN4gYomf0ZrCa61g5d"
learnosity items [
  item questions [
    clozetext stimulus "Plants convert {{response}} into oxygen" valid-response [
      "carbon dioxide"
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 64

#### Prompt
"Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct."

#### Chat Transcript

**User**: Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct.

#### Code

```
set-var "lrn-id" "ikYHqX2qAJK02M1W05Te"
learnosity items [
  item questions [
    mcq stimulus "What color is the sky?" options [
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

### Example 65

#### Prompt
"Create a cloze dropdown with instant feedback: "HTML stands for {{response}}" with options "HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language" where the first is correct."

#### Chat Transcript

**User**: Create a cloze dropdown with instant feedback: "HTML stands for {{response}}" with options "HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language" where the first is correct.

#### Code

```
set-var "lrn-id" "j74aN6i6d57LlnrGutHp"
learnosity items [
  item questions [
    clozedropdown stimulus "HTML stands for {{response}}" possible-responses [
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

### Example 66

#### Prompt
"Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit.

Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit."

#### Chat Transcript

**User**: Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit.

**User**: Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit.

#### Code

```
set-var "lrn-id" "kF2N8yNHhAs75T1AxLvq"
learnosity items [
  item questions [
    longtext stimulus "Describe the water cycle in your own words" max-word-count 300 {}
  ] {}
] {}..
```

---

### Example 67

#### Prompt
"Create an items assessment with an MCQ asking "What is 2+2?" with options "3", "4", "5" where 4 is correct, and a short text question asking "Spell the answer" with correct answer "four"."

#### Chat Transcript

**User**: Create an items assessment with an MCQ asking "What is 2+2?" with options "3", "4", "5" where 4 is correct, and a short text question asking "Spell the answer" with correct answer "four".

#### Code

```
set-var "lrn-id" "lMFj3tNblGegeiuT6wMg"
learnosity items [
  item questions [
    mcq stimulus "What is 2+2?" options [
      "3"
      "4"
      "5"
    ] valid-response [
      1
    ] {}
    shorttext stimulus "Spell the answer" valid-response "four" {}
  ] {}
] {}..
```

---

### Example 68

#### Prompt
"Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled.

#### Code

```
set-var "lrn-id" "mVwWKSJnnP1XZ5QvPyo2"
learnosity items [
  item questions [
    mcq stimulus "Which is a mammal?" options [
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

### Example 69

#### Prompt
"Create an order list question asking "Arrange in chronological order" with items "World War II", "World War I", "Moon Landing", "Internet" where the correct order is WWI, WWII, Moon Landing, Internet."

#### Chat Transcript

**User**: Create an order list question asking "Arrange in chronological order" with items "World War II", "World War I", "Moon Landing", "Internet" where the correct order is WWI, WWII, Moon Landing, Internet.

#### Code

```
set-var "lrn-id" "mb4FWoYMcuN9buOoeUgN"
learnosity items [
  item questions [
    orderlist stimulus "Arrange in chronological order" list [
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

### Example 70

#### Prompt
"Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters."

#### Chat Transcript

**User**: Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters.

#### Code

```
set-var "lrn-id" "mcNbOfG3N0GbeRObnyeR"
learnosity items [
  item questions [
    shorttext stimulus "Type the missing word: The quick brown ___" valid-response "fox" max-length 20 {}
  ] {}
] {}..
```

---

### Example 71

#### Prompt
"Create a choice matrix asking "Classify each animal" with rows "Whale", "Cobra", "Eagle" and columns "Mammal", "Reptile", "Bird" where each matches respectively."

#### Chat Transcript

**User**: Create a choice matrix asking "Classify each animal" with rows "Whale", "Cobra", "Eagle" and columns "Mammal", "Reptile", "Bird" where each matches respectively.

#### Code

```
set-var "lrn-id" "mfcIS6ihBsCkfmU8D6NS"
learnosity items [
  item questions [
    choicematrix stimulus "Classify each animal" rows [
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

### Example 72

#### Prompt
"Create a plain text essay question asking "List three things you learned today" with a 100-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "List three things you learned today" with a 100-word limit.

#### Code

```
set-var "lrn-id" "muJ2baliNx8YYxy1uMtb"
learnosity items [
  item questions [
    plaintext stimulus "List three things you learned today" max-word-count 100 {}
  ] {}
] {}..
```

---

### Example 73

#### Prompt
"Create a classification asking "Sort by food group" with categories "Fruits", "Vegetables" and items "Apple", "Carrot", "Banana", "Broccoli" where Apple and Banana are Fruits and Carrot and Broccoli are Vegetables."

#### Chat Transcript

**User**: Create a classification asking "Sort by food group" with categories "Fruits", "Vegetables" and items "Apple", "Carrot", "Banana", "Broccoli" where Apple and Banana are Fruits and Carrot and Broccoli are Vegetables.

#### Code

```
set-var "lrn-id" "n5mEvPOoxHKzLSHyPmqI"
learnosity items [
  item questions [
    classification stimulus "Sort by food group" possible-responses [
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

### Example 74

#### Prompt
"Create a cloze association question with the template "{{response}} wrote Romeo and Juliet" with possible responses "Shakespeare", "Dickens", "Austen" where Shakespeare is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "{{response}} wrote Romeo and Juliet" with possible responses "Shakespeare", "Dickens", "Austen" where Shakespeare is correct.

#### Code

```
set-var "lrn-id" "ok85J0TQWw5L0KqoRMQh"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} wrote Romeo and Juliet" possible-responses [
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

### Example 75

#### Prompt
"Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation...".

#### Code

```
set-var "lrn-id" "qs4CA9z5sRjELC85fCuC"
learnosity items [
  item questions [
    longtext stimulus "Explain how gravity works" max-word-count 400 placeholder "Begin your explanation..." {}
  ] {}
] {}..
```

---

### Example 76

#### Prompt
"Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific"."

#### Chat Transcript

**User**: Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific".

#### Code

```
set-var "lrn-id" "r5HqjZQHtL6kC9dS8QUX"
learnosity items [
  item questions [
    shorttext stimulus "Name the largest ocean" valid-response "Pacific" placeholder "Enter your answer here" {}
  ] {}
] {}..
```

---

### Example 77

#### Prompt
"Create an items assessment with a classification: "Sort by type" with categories "Even", "Odd" and items "1", "2", "3", "4" where 2 and 4 are Even and 1 and 3 are Odd."

#### Chat Transcript

**User**: Create an items assessment with a classification: "Sort by type" with categories "Even", "Odd" and items "1", "2", "3", "4" where 2 and 4 are Even and 1 and 3 are Odd.

#### Code

```
set-var "lrn-id" "saY2kJj1whS8YLjzQxvd"
learnosity items [
  item questions [
    classification stimulus "Sort by type" possible-responses [
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

### Example 78

#### Prompt
"Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945"."

#### Chat Transcript

**User**: Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945".

#### Code

```
set-var "lrn-id" "siSWMsOZB1H55NIcT8PM"
learnosity items [
  item questions [
    shorttext stimulus "What year did World War II end?" valid-response "1945" {}
  ] {}
] {}..
```

---

### Example 79

#### Prompt
"Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct.

#### Code

```
set-var "lrn-id" "uMJ8XKA6zLilFNFzhHfN"
learnosity items [
  item questions [
    mcq stimulus "What is the boiling point of water?" options [
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

### Example 80

#### Prompt
"Create a classification asking "Classify the words" with categories "Nouns", "Verbs" and items "run", "cat", "jump", "house" where cat and house are Nouns and run and jump are Verbs."

#### Chat Transcript

**User**: Create a classification asking "Classify the words" with categories "Nouns", "Verbs" and items "run", "cat", "jump", "house" where cat and house are Nouns and run and jump are Verbs.

#### Code

```
set-var "lrn-id" "ucnMShJ9vhbcAZOSkfQ4"
learnosity items [
  item questions [
    classification stimulus "Classify the words" possible-responses [
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

### Example 81

#### Prompt
"Create a cloze association with instant feedback: "{{response}} discovered gravity" with possible responses "Newton", "Einstein", "Galileo" where Newton is correct."

#### Chat Transcript

**User**: Create a cloze association with instant feedback: "{{response}} discovered gravity" with possible responses "Newton", "Einstein", "Galileo" where Newton is correct.

#### Code

```
set-var "lrn-id" "ulVERCp30XQ5zA0SHvpR"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} discovered gravity" possible-responses [
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

### Example 82

#### Prompt
"Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

#### Code

```
set-var "lrn-id" "unORRVn5ZiIigU3P9ZYh"
learnosity items [
  item questions [
    mcq stimulus "What is the capital of France?" options [
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

### Example 83

#### Prompt
"Create an items assessment with a cloze dropdown "Water is {{response}}" with options "solid", "liquid", "gas" where liquid is correct, and a cloze association "Ice is {{response}}" with possible responses "solid", "liquid", "gas" where solid is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze dropdown "Water is {{response}}" with options "solid", "liquid", "gas" where liquid is correct, and a cloze association "Ice is {{response}}" with possible responses "solid", "liquid", "gas" where solid is correct.

#### Code

```
set-var "lrn-id" "vgapPvDRWzTw0dY3HEzj"
learnosity items [
  item questions [
    clozedropdown stimulus "Water is {{response}}" possible-responses [
      [
        "solid"
        "liquid"
        "gas"
      ]
    ] valid-response [
      "liquid"
    ] {}
    clozeassociation stimulus "Ice is {{response}}" possible-responses [
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

### Example 84

#### Prompt
"Create an items assessment with a cloze text question: "The {{response}} War ended in {{response}}" with correct answers "Civil" and "1865"."

#### Chat Transcript

**User**: Create an items assessment with a cloze text question: "The {{response}} War ended in {{response}}" with correct answers "Civil" and "1865".

#### Code

```
set-var "lrn-id" "wPcxrfQ1LkSzadFxny9Q"
learnosity items [
  item questions [
    clozetext stimulus "The {{response}} War ended in {{response}}" valid-response [
      "Civil"
      "1865"
    ] {}
  ] {}
] {}..
```

---

### Example 85

#### Prompt
"Create a cloze association: "{{response}} is the capital of {{response}}" with possible responses "Paris", "France", "Germany", "Berlin" where Paris and France are correct."

#### Chat Transcript

**User**: Create a cloze association: "{{response}} is the capital of {{response}}" with possible responses "Paris", "France", "Germany", "Berlin" where Paris and France are correct.

#### Code

```
set-var "lrn-id" "xLlUq8qjbBlEgQPy9t6Z"
learnosity items [
  item questions [
    clozeassociation stimulus "{{response}} is the capital of {{response}}" possible-responses [
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

### Example 86

#### Prompt
"Create a cloze association question with the template "The chemical formula for water is {{response}}" with possible responses "H2O", "CO2", "NaCl" where H2O is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "The chemical formula for water is {{response}}" with possible responses "H2O", "CO2", "NaCl" where H2O is correct.

#### Code

```
set-var "lrn-id" "yqy4gmhOTMmRkaIbxaKC"
learnosity items [
  item questions [
    clozeassociation stimulus "The chemical formula for water is {{response}}" possible-responses [
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

### Example 87

#### Prompt
"Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive.

#### Code

```
set-var "lrn-id" "zOkil8ZxrJJTp0Q3Gdnd"
learnosity items [
  item questions [
    shorttext stimulus "What is the opposite of hot?" valid-response "cold" case-sensitive false placeholder "Type your answer here" {}
  ] {}
] {}..
```

---

### Example 88

#### Prompt
"Create a choice matrix asking "Is each statement a fact or opinion?" with rows "The Earth orbits the Sun", "Pizza is the best food" and columns "Fact", "Opinion" where answers are Fact and Opinion."

#### Chat Transcript

**User**: Create a choice matrix asking "Is each statement a fact or opinion?" with rows "The Earth orbits the Sun", "Pizza is the best food" and columns "Fact", "Opinion" where answers are Fact and Opinion.

#### Code

```
set-var "lrn-id" "zQGuw2xhFtx9vDAg3Fpu"
learnosity items [
  item questions [
    choicematrix stimulus "Is each statement a fact or opinion?" rows [
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

### Example 89

#### Prompt
"Create a short text question asking "What is 7 × 8?" with the correct answer "56"."

#### Chat Transcript

**User**: Create a short text question asking "What is 7 × 8?" with the correct answer "56".

#### Code

```
set-var "lrn-id" "zUgyf5K87OF3oEfjHtp0"
learnosity items [
  item questions [
    shorttext stimulus "What is 7 × 8?" valid-response "56" {}
  ] {}
] {}..
```



