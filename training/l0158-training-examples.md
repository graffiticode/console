# Graffiticode Training Examples

*Downloaded on 2026-03-27T22:09:31.076Z*

## Language L0158

### Example 1

#### Prompt
"Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo"."

#### Chat Transcript

**User**: Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo".

#### Code

```
items [
  item questions [
    shorttext stimulus "What is the capital of Japan?" valid-response "Tokyo" {}
  ] {}
]..
```

---

### Example 2

#### Prompt
"Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct.

#### Code

```
items [
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
]..
```

---

### Example 3

#### Prompt
"Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here...".

#### Code

```
items [
  item questions [
    longtext stimulus "Write about your favorite book" placeholder "Start writing here..." {}
  ] {}
]..
```

---

### Example 4

#### Prompt
"Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive.

#### Code

```
items [
  item questions [
    clozetext stimulus "Water is made of {{response}} and oxygen" valid-response [
      [
        "hydrogen"
      ]
    ] case-sensitive false {}
  ] {}
]..
```

---

### Example 5

#### Prompt
"Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct."

#### Chat Transcript

**User**: Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct.

#### Code

```
items [
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
]..
```

---

### Example 6

#### Prompt
"Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive.

#### Code

```
items [
  item questions [
    shorttext stimulus "What is the abbreviation for Doctor?" valid-response "Dr." case-sensitive true {}
  ] {}
]..
```

---

### Example 7

#### Prompt
"Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback.

#### Code

```
items [
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
]..
```

---

### Example 8

#### Prompt
"Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses."

#### Chat Transcript

**User**: Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses.

#### Code

```
items [
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
]..
```

---

### Example 9

#### Prompt
"Create a plain text essay question asking "List three things you learned today" with a 100-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "List three things you learned today" with a 100-word limit.

#### Code

```
items [
  item questions [
    plaintext stimulus "List three things you learned today." max-word-count 100 {}
  ] {}
]..
```

---

### Example 10

#### Prompt
"Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O"."

#### Chat Transcript

**User**: Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O".

#### Code

```
items [
  item questions [
    shorttext stimulus "What is the chemical symbol for water?" valid-response "H2O" {}
  ] {}
]..
```

---

### Example 11

#### Prompt
"Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct.

#### Code

```
items [
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
]..
```

---

### Example 12

#### Prompt
"Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit."

#### Chat Transcript

**User**: Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit.

#### Code

```
items [
  item questions [
    longtext stimulus "Compare and contrast two historical events" max-word-count 400 {}
  ] {}
]..
```

---

### Example 13

#### Prompt
"Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay...".

#### Code

```
items [
  item questions [
    longtext stimulus "Discuss the causes of climate change" max-word-count 500 placeholder "Begin your essay..." {}
  ] {}
]..
```

---

### Example 14

#### Prompt
"Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive.

#### Code

```
items [
  item questions [
    shorttext stimulus "Spell the number 4" valid-response "four" case-sensitive false {}
  ] {}
]..
```

---

### Example 15

#### Prompt
"Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria".

#### Code

```
items [
  item questions [
    clozetext stimulus "The {{response}} is the powerhouse of the cell." valid-response [
      [
        "mitochondria"
      ]
    ] {}
  ] {}
] {}..
```

---

### Example 16

#### Prompt
"Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options.

#### Code

```
items [
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
]..
```

---

### Example 17

#### Prompt
"Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct.

#### Code

```
items [
  item questions [
    mcq stimulus "Which season comes after spring?" options [
      "Summer"
      "Fall"
      "Winter"
    ] valid-response [
      0
    ] instant-feedback true {}
  ] {}
]..
```

---

### Example 18

#### Prompt
"Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct."

#### Chat Transcript

**User**: Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct.

#### Code

```
items [
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
]..
```

---

### Example 19

#### Prompt
"Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements..."."

#### Chat Transcript

**User**: Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements...".

#### Code

```
items [
  item questions [
    mcq {}
  ] {}
]..
```

---

### Example 20

#### Prompt
"Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct."

#### Chat Transcript

**User**: Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct.

#### Code

```
items [
  item questions [
    mcq stimulus "The Earth is flat" options [
      "True"
      "False"
    ] valid-response [
      1
    ] {}
  ] {}
]..
```

---

### Example 21

#### Prompt
"Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation...".

#### Code

```
items [
  item questions [
    longtext stimulus "Explain how gravity works" max-word-count 400 placeholder "Begin your explanation..." {}
  ] {}
]..
```

---

### Example 22

#### Prompt
"Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive.

#### Code

```
items [
  item questions [
    shorttext stimulus "What gas do plants absorb?" valid-response "carbon dioxide" case-sensitive false {}
  ] {}
]..
```

---

### Example 23

#### Prompt
"Create a plain text essay question asking "Summarize the main argument" with a 150-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Summarize the main argument" with a 150-word limit.

#### Code

```
items [
  item questions [
    plaintext stimulus "Summarize the main argument" max-word-count 150 {}
  ] {}
]..
```

---

### Example 24

#### Prompt
"Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct."

#### Chat Transcript

**User**: Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct.

#### Code

```
items [
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
]..
```

---

### Example 25

#### Prompt
"Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct."

#### Chat Transcript

**User**: Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct.

#### Code

```
items [
  item questions [
    mcq stimulus "What color is the sky?" options [
      "Blue"
      "Green"
      "Red"
    ] valid-response [
      0
    ] shuffle-options true {}
  ] {}
]..
```

---

### Example 26

#### Prompt
"Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct."

#### Chat Transcript

**User**: Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct.

#### Code

```
items [
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
]..
```

---

### Example 27

#### Prompt
"Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit."

#### Chat Transcript

**User**: Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit.

#### Code

```
items [
  item questions [
    longtext stimulus "Describe the water cycle in your own words" max-word-count 300 {}
  ] {}
]..
```

---

### Example 28

#### Prompt
"Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled.

#### Code

```
items [
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
]..
```

---

### Example 29

#### Prompt
"Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters."

#### Chat Transcript

**User**: Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters.

#### Code

```
items [
  item questions [
    shorttext stimulus "Type the missing word: The quick brown ___" valid-response "fox" max-length 20 {}
  ] {}
]..
```

---

### Example 30

#### Prompt
"Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit."

#### Chat Transcript

**User**: Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit.

#### Code

```
items [
  item questions [
    longtext stimulus "Analyze the themes in the poem" max-word-count 600 {}
  ] {}
]..
```

---

### Example 31

#### Prompt
"Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific"."

#### Chat Transcript

**User**: Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific".

#### Code

```
items [
  item questions [
    shorttext stimulus "Name the largest ocean" valid-response "Pacific" placeholder "Enter your answer here" {}
  ] {}
]..
```

---

### Example 32

#### Prompt
"Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945"."

#### Chat Transcript

**User**: Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945".

#### Code

```
items [
  item questions [
    shorttext stimulus "What year did World War II end?" valid-response "1945" {}
  ] {}
]..
```

---

### Example 33

#### Prompt
"Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct.

#### Code

```
items [
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
]..
```

---

### Example 34

#### Prompt
"Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

#### Code

```
{}..
```

---

### Example 35

#### Prompt
"Create a plain text essay question asking "Explain your reasoning" with a 200-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Explain your reasoning" with a 200-word limit.

#### Code

```
items [
  item questions [
    plaintext stimulus "Explain your reasoning" max-word-count 200 {}
  ] {}
]..
```

---

### Example 36

#### Prompt
"Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

**User**: Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

#### Code

```
items [
  item questions [
    mcq {}
  ] {}
]..
```

---

### Example 37

#### Prompt
"Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive.

#### Code

```
items [
  item questions [
    shorttext stimulus "What is the opposite of hot?" valid-response "cold" case-sensitive false placeholder "Type your answer here" {}
  ] {}
]..
```

---

### Example 38

#### Prompt
"Create a short text question asking "What is 7 × 8?" with the correct answer "56"."

#### Chat Transcript

**User**: Create a short text question asking "What is 7 × 8?" with the correct answer "56".

#### Code

```
items [
  item questions [
    shorttext stimulus "What is 7 × 8?" valid-response "56" {}
  ] {}
]..
```



