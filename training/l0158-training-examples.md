# Graffiticode Training Examples

*Downloaded on 2026-03-29T22:56:15.177Z*

## Language L0158

### Example 1

#### Prompt
"Create a cloze dropdown: "Water boils at {{response}} degrees Celsius" with options "50", "100", "150" where 100 is correct."

#### Chat Transcript

**User**: Create a cloze dropdown: "Water boils at {{response}} degrees Celsius" with options "50", "100", "150" where 100 is correct.

#### Code

```
learnosity id "1IgvIk8fW6ggFT9MTmxz" items [
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
"Create a cloze dropdown question with the template "The largest mammal is the {{response}}" with options "blue whale", "elephant", "giraffe" where blue whale is correct."

#### Chat Transcript

**User**: Create a cloze dropdown question with the template "The largest mammal is the {{response}}" with options "blue whale", "elephant", "giraffe" where blue whale is correct.

#### Code

```
learnosity id "6EWyoX6UHbU8l4wjpiae" items [
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

### Example 3

#### Prompt
"Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo"."

#### Chat Transcript

**User**: Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo".

#### Code

```
learnosity id "6lK6cTB0QQgBjs1XQBc7" items [
  item questions [
    shorttext stimulus "What is the capital of Japan?" valid-response "Tokyo" {}
  ] {}
] {}..
```

---

### Example 4

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

### Example 5

#### Prompt
"Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Write about your favorite book" with placeholder text "Start writing here...".

#### Code

```
learnosity id "9h2ex3qnuQNcizIEwAiQ" items [
  item questions [
    longtext stimulus "Write about your favorite book" placeholder "Start writing here..." {}
  ] {}
] {}..
```

---

### Example 6

#### Prompt
"Create a cloze text question with the template "The {{response}} of the United States is Washington, D.C." with the correct answers "capital" or "Capital"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The {{response}} of the United States is Washington, D.C." with the correct answers "capital" or "Capital".

#### Code

```
learnosity "CKoYHuffRx3EjbgVDZg4" items [
  item questions [
    clozetext stimulus "The {{response}} of the United States is Washington, D.C." valid-response [
      "capital"
      "Capital"
    ] {}
  ] {}
]
{}..
```

---

### Example 7

#### Prompt
"Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct."

#### Chat Transcript

**User**: Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct.

#### Code

```
learnosity id "DJCMsxOE3y7qaZ9W8gb4" items [
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

### Example 8

#### Prompt
"Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the abbreviation for Doctor?" with the correct answer "Dr.", case sensitive.

#### Code

```
learnosity id "DY7jADczkd4UoLIf0YhK" items [
  item questions [
    shorttext stimulus "What is the abbreviation for Doctor?" valid-response "Dr." case-sensitive true {}
  ] {}
] {}..
```

---

### Example 9

#### Prompt
"Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The {{response}} is the powerhouse of the cell" with the correct answer "mitochondria".

#### Code

```
learnosity id "Dbne402rxjy22myr9ui1" items [
  item questions [
    clozetext stimulus "The {{response}} is the powerhouse of the cell." valid-response [
      "mitochondria"
    ] {}
  ] {}
] {}..
```

---

### Example 10

#### Prompt
"Create a cloze dropdown question with the template "The sky is {{response}}" with dropdown options "blue", "red", "green" where blue is correct."

#### Chat Transcript

**User**: Create a cloze dropdown question with the template "The sky is {{response}}" with dropdown options "blue", "red", "green" where blue is correct.

#### Code

```
learnosity id "EWAbAMZqmEk8SAukdXQh" items [
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

### Example 11

#### Prompt
"Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback.

#### Code

```
learnosity id "FOgeRNAml3cIew7CMFFr" items [
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

### Example 12

#### Prompt
"Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses."

#### Chat Transcript

**User**: Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses.

#### Code

```
learnosity id "FuRb9MmmrsvG52SeP09N" items [
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

### Example 13

#### Prompt
"Create a plain text essay question asking "List three things you learned today" with a 100-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "List three things you learned today" with a 100-word limit.

#### Code

```
items [
  item id "GOr2d4bR77YXF6T1ryV3" questions [
    plaintext stimulus "List three things you learned today." max-word-count 100 {}
  ] {}
]..
```

---

### Example 14

#### Prompt
"Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O"."

#### Chat Transcript

**User**: Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O".

#### Code

```
learnosity id "HP3SVCzA5wvt5fi2lHhk" items [
  item questions [
    shorttext stimulus "What is the chemical symbol for water?" valid-response "H2O" {}
  ] {}
] {}..
```

---

### Example 15

#### Prompt
"Create a cloze dropdown with two blanks: "{{response}} are mammals and {{response}} are reptiles" with dropdown options ["Dogs", "Cats", "Fish"] and ["Snakes", "Birds", "Frogs"] where Dogs and Snakes are correct."

#### Chat Transcript

**User**: Create a cloze dropdown with two blanks: "{{response}} are mammals and {{response}} are reptiles" with dropdown options ["Dogs", "Cats", "Fish"] and ["Snakes", "Birds", "Frogs"] where Dogs and Snakes are correct.

#### Code

```
learnosity id "JIWTyMyc8E5LoNQPekas" items [
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

### Example 16

#### Prompt
"Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct.

#### Code

```
learnosity id "Jc1Dun1HOJM8SBZtluLU" items [
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

### Example 17

#### Prompt
"Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit."

#### Chat Transcript

**User**: Create an items assessment with a long text essay asking "Compare and contrast two historical events" with a 400-word limit.

#### Code

```
items [
  item id "JpN2Fl2V4ivrscWEiZ4W" questions [
    longtext stimulus "Compare and contrast two historical events" max-word-count 400 {}
  ] {}
]..
```

---

### Example 18

#### Prompt
"Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Discuss the causes of climate change" with a 500-word limit and placeholder "Begin your essay...".

#### Code

```
learnosity id "K2IzqqFom4MiIsbLCPAG" items [
  item questions [
    longtext stimulus "Discuss the causes of climate change" max-word-count 500 placeholder "Begin your essay..." {}
  ] {}
] {}..
```

---

### Example 19

#### Prompt
"Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive.

#### Code

```
learnosity id "MDURCXrs6lR4MnN686Cq" items [
  item questions [
    shorttext stimulus "Spell the number 4" valid-response "four" case-sensitive false {}
  ] {}
] {}..
```

---

### Example 20

#### Prompt
"Create a choice matrix question asking "Rate your agreement" with rows "Exercise is important", "Sleep is optional" and columns "Agree", "Disagree" where answers are Agree and Disagree."

#### Chat Transcript

**User**: Create a choice matrix question asking "Rate your agreement" with rows "Exercise is important", "Sleep is optional" and columns "Agree", "Disagree" where answers are Agree and Disagree.

#### Code

```
learnosity id "OdQNhvjVx2IIbGgOPrSw" items [
  item questions [
    choicematrix stimulus "Rate your agreement" rows [
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

### Example 21

#### Prompt
"Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit."

#### Chat Transcript

**User**: Create a long text essay asking "Analyze the themes in the poem" with a 600-word limit.

#### Code

```
learnosity id "Pvab7QMnbOTbORxUrysd" items [
  item questions [
    longtext stimulus "Analyze the themes in the poem" max-word-count 600 {}
  ] {}
] {}..
```

---

### Example 22

#### Prompt
"Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options.

#### Code

```
learnosity id "QG6oiI1iIQRPiDblZDlE" items [
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

### Example 23

#### Prompt
"Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct.

#### Code

```
learnosity id "RUSpCD45t3mGBK7jofAA" items [
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

### Example 24

#### Prompt
"Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Water is made of {{response}} and oxygen" with the correct answer "hydrogen", case insensitive.

#### Code

```
learnosity id "RyJfCPRwoBf2EXY7SsLw" items [
  item questions [
    clozetext stimulus "Water is made of {{response}} and oxygen" valid-response [
      "hydrogen"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 25

#### Prompt
"Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct."

#### Chat Transcript

**User**: Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct.

#### Code

```
learnosity id "T0gHmys7WFGz9usvSvpj" items [
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

### Example 26

#### Prompt
"Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive.

#### Code

```
learnosity id "TocW1RWITsGO6LAooUQJ" items [
  item questions [
    clozetext stimulus "Photosynthesis occurs in the {{response}} of plant cells" valid-response [
      "chloroplast"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 27

#### Prompt
"Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements..."."

#### Chat Transcript

**User**: Create a plain text question asking "Write a brief biography" with a 250-word limit and placeholder "Name, birth date, achievements...".

#### Code

```
learnosity id "UOneN2SO6qZyRGZmtofB" items [
  item questions [
    plaintext stimulus "Write a brief biography" max-word-count 250 placeholder "Name, birth date, achievements..." {}
  ] {}
] {}..
```

---

### Example 28

#### Prompt
"Create a cloze text question with the template "{{response}} is the chemical symbol for gold" with the correct answer "Au"."

#### Chat Transcript

**User**: Create a cloze text question with the template "{{response}} is the chemical symbol for gold" with the correct answer "Au".

#### Code

```
learnosity id "VU8EUoG8teyhBHOQ4Ra7" items [
  item questions [
    clozetext stimulus "{{response}} is the chemical symbol for gold" valid-response [
      "Au"
    ] {}
  ] {}
] {}..
```

---

### Example 29

#### Prompt
"Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct."

#### Chat Transcript

**User**: Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct.

#### Code

```
learnosity id "WSZUAF8EyyhlsuZf7G7b" items [
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

### Example 30

#### Prompt
"Create an items assessment with a cloze association: "The {{response}} is the closest star to Earth" with possible responses "Sun", "Moon", "Mars" where Sun is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze association: "The {{response}} is the closest star to Earth" with possible responses "Sun", "Moon", "Mars" where Sun is correct.

#### Code

```
learnosity id "WaqWEEXfJMcwHn2Nuwfc" items [
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

### Example 31

#### Prompt
"Create a cloze text question with the template "DNA stands for {{response}} acid" with the correct answer "deoxyribonucleic", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "DNA stands for {{response}} acid" with the correct answer "deoxyribonucleic", case insensitive.

#### Code

```
learnosity id "WqpUAJiL7hbYHNsSVli5" items [
  item questions [
    clozetext stimulus "DNA stands for {{response}} acid" valid-response [
      "deoxyribonucleic"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 32

#### Prompt
"Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False" where the answers are True and False."

#### Chat Transcript

**User**: Create a choice matrix question asking "Classify each statement" with rows "The sun is a star" and "The moon is a planet" and columns "True" and "False" where the answers are True and False.

#### Code

```
learnosity id "" items [
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

### Example 33

#### Prompt
"Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation..."."

#### Chat Transcript

**User**: Create a long text essay question asking "Explain how gravity works" with a 400-word limit and placeholder "Begin your explanation...".

#### Code

```
items [
  item id "aO60vq84010ygOUYJyD7" questions [
    longtext stimulus "Explain how gravity works" max-word-count 400 placeholder "Begin your explanation..." {}
  ] {}
]..
```

---

### Example 34

#### Prompt
"Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive.

#### Code

```
learnosity id "aitPmLpPyDRz3p7jXVut" items [
  item questions [
    shorttext stimulus "What gas do plants absorb?" valid-response "carbon dioxide" case-sensitive false {}
  ] {}
] {}..
```

---

### Example 35

#### Prompt
"Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive."

#### Chat Transcript

**User**: Create a cloze text question with the template "Photosynthesis occurs in the {{response}} of plant cells" with the correct answer "chloroplast", case insensitive.

#### Code

```
learnosity id "aoq2NKsJpbjeVPAyy2U8" items [
  item questions [
    clozetext stimulus "Photosynthesis occurs in the {{response}} of plant cells" valid-response [
      "chloroplast"
    ] case-sensitive false {}
  ] {}
] {}..
```

---

### Example 36

#### Prompt
"Create a cloze association question with the template "Drag the correct answer: {{response}} is the largest planet" with possible responses "Jupiter", "Saturn", "Earth" where Jupiter is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "Drag the correct answer: {{response}} is the largest planet" with possible responses "Jupiter", "Saturn", "Earth" where Jupiter is correct.

#### Code

```
learnosity id "biTQp0EpiZgdmyLTouZT" items [
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

### Example 37

#### Prompt
"Create a plain text essay question asking "Summarize the main argument" with a 150-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Summarize the main argument" with a 150-word limit.

#### Code

```
learnosity id "cfx7Wq1jWGmK751vT0EO" items [
  item questions [
    plaintext stimulus "Summarize the main argument" max-word-count 150 {}
  ] {}
] {}..
```

---

### Example 38

#### Prompt
"Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct."

#### Chat Transcript

**User**: Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct.

#### Code

```
learnosity id "fDOveWPep9wqdXucgQTm" items [
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

### Example 39

#### Prompt
"Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct."

#### Chat Transcript

**User**: Create a cloze association question with two blanks: "{{response}} is to hot as {{response}} is to cold" with possible responses "fire", "ice", "water" where fire and ice are correct.

#### Code

```
learnosity id "fJfxEEwrWjWaZKtFb4Cs" items [
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

### Example 40

#### Prompt
"Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct."

#### Chat Transcript

**User**: Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct.

#### Code

```
learnosity id "g4OagLuTJOXyVpHXjwsv" items [
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

### Example 41

#### Prompt
"Create a cloze text question with the template "The speed of {{response}} is approximately 300,000 km/s" with the correct answer "light"."

#### Chat Transcript

**User**: Create a cloze text question with the template "The speed of {{response}} is approximately 300,000 km/s" with the correct answer "light".

#### Code

```
learnosity id "g6iqqEdaeOTg3lv4lTV2" items [
  item questions [
    clozetext stimulus "The speed of {{response}} is approximately 300,000 km/s" valid-response [
      "light"
    ] {}
  ] {}
] {}..
```

---

### Example 42

#### Prompt
"Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct."

#### Chat Transcript

**User**: Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct.

#### Code

```
learnosity id "hiIQ0fDT0kQlSfe3eQkO" items [
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

### Example 43

#### Prompt
"Create an items assessment with a cloze dropdown: "The Earth revolves around the {{response}}" with options "Sun", "Moon", "Mars" where Sun is correct."

#### Chat Transcript

**User**: Create an items assessment with a cloze dropdown: "The Earth revolves around the {{response}}" with options "Sun", "Moon", "Mars" where Sun is correct.

#### Code

```
learnosity id "i2pLk0W2keicOimcQImI" items [
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

### Example 44

#### Prompt
"Create a cloze text with instant feedback and the template "Plants convert {{response}} into oxygen" with the correct answer "carbon dioxide"."

#### Chat Transcript

**User**: Create a cloze text with instant feedback and the template "Plants convert {{response}} into oxygen" with the correct answer "carbon dioxide".

#### Code

```
learnosity id "iPdN4gYomf0ZrCa61g5d" items [
  item questions [
    clozetext stimulus "Plants convert {{response}} into oxygen" valid-response [
      "carbon dioxide"
    ] instant-feedback true {}
  ] {}
] {}..
```

---

### Example 45

#### Prompt
"Create a cloze dropdown with instant feedback: "HTML stands for {{response}}" with options "HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language" where the first is correct."

#### Chat Transcript

**User**: Create a cloze dropdown with instant feedback: "HTML stands for {{response}}" with options "HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language" where the first is correct.

#### Code

```
learnosity id "j74aN6i6d57LlnrGutHp" items [
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

### Example 46

#### Prompt
"Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit.

Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit."

#### Chat Transcript

**User**: Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit.

**User**: Create a long text essay question asking "Describe the water cycle in your own words" with a 300-word limit.

#### Code

```
learnosity id "kF2N8yNHhAs75T1AxLvq" items [
  item questions [
    longtext stimulus "Describe the water cycle in your own words" max-word-count 300 {}
  ] {}
] {}..
```

---

### Example 47

#### Prompt
"Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled.

#### Code

```
learnosity id "mVwWKSJnnP1XZ5QvPyo2" items [
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

### Example 48

#### Prompt
"Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters."

#### Chat Transcript

**User**: Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters.

#### Code

```
learnosity id "mcNbOfG3N0GbeRObnyeR" items [
  item questions [
    shorttext stimulus "Type the missing word: The quick brown ___" valid-response "fox" max-length 20 {}
  ] {}
] {}..
```

---

### Example 49

#### Prompt
"Create a cloze association question with the template "{{response}} wrote Romeo and Juliet" with possible responses "Shakespeare", "Dickens", "Austen" where Shakespeare is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "{{response}} wrote Romeo and Juliet" with possible responses "Shakespeare", "Dickens", "Austen" where Shakespeare is correct.

#### Code

```
learnosity id "ok85J0TQWw5L0KqoRMQh" items [
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

### Example 50

#### Prompt
"Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific"."

#### Chat Transcript

**User**: Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific".

#### Code

```
learnosity id "r5HqjZQHtL6kC9dS8QUX" items [
  item questions [
    shorttext stimulus "Name the largest ocean" valid-response "Pacific" placeholder "Enter your answer here" {}
  ] {}
] {}..
```

---

### Example 51

#### Prompt
"Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945"."

#### Chat Transcript

**User**: Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945".

#### Code

```
learnosity id "siSWMsOZB1H55NIcT8PM" items [
  item questions [
    shorttext stimulus "What year did World War II end?" valid-response "1945" {}
  ] {}
] {}..
```

---

### Example 52

#### Prompt
"Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct.

#### Code

```
learnosity id "uMJ8XKA6zLilFNFzhHfN" items [
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

### Example 53

#### Prompt
"Create a cloze association with instant feedback: "{{response}} discovered gravity" with possible responses "Newton", "Einstein", "Galileo" where Newton is correct."

#### Chat Transcript

**User**: Create a cloze association with instant feedback: "{{response}} discovered gravity" with possible responses "Newton", "Einstein", "Galileo" where Newton is correct.

#### Code

```
learnosity id "ulVERCp30XQ5zA0SHvpR" items [
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

### Example 54

#### Prompt
"Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

#### Code

```
learnosity id "unORRVn5ZiIigU3P9ZYh" items [
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

### Example 55

#### Prompt
"Create a plain text essay question asking "Explain your reasoning" with a 200-word limit."

#### Chat Transcript

**User**: Create a plain text essay question asking "Explain your reasoning" with a 200-word limit.

#### Code

```
learnosity id "v3AA3yoAwaQSLmV7XWG6" items [
  item questions [
    plaintext stimulus "Explain your reasoning" max-word-count 200 {}
  ] {}
] {}..
```

---

### Example 56

#### Prompt
"Create an items assessment with a cloze text question: "The {{response}} War ended in {{response}}" with correct answers "Civil" and "1865"."

#### Chat Transcript

**User**: Create an items assessment with a cloze text question: "The {{response}} War ended in {{response}}" with correct answers "Civil" and "1865".

#### Code

```
learnosity id "wPcxrfQ1LkSzadFxny9Q" items [
  item questions [
    clozetext stimulus "The {{response}} War ended in {{response}}" valid-response [
      "Civil"
      "1865"
    ] {}
  ] {}
] {}..
```

---

### Example 57

#### Prompt
"Create a cloze association: "{{response}} is the capital of {{response}}" with possible responses "Paris", "France", "Germany", "Berlin" where Paris and France are correct."

#### Chat Transcript

**User**: Create a cloze association: "{{response}} is the capital of {{response}}" with possible responses "Paris", "France", "Germany", "Berlin" where Paris and France are correct.

#### Code

```
learnosity id "xLlUq8qjbBlEgQPy9t6Z" items [
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

### Example 58

#### Prompt
"Create a cloze association question with the template "The chemical formula for water is {{response}}" with possible responses "H2O", "CO2", "NaCl" where H2O is correct."

#### Chat Transcript

**User**: Create a cloze association question with the template "The chemical formula for water is {{response}}" with possible responses "H2O", "CO2", "NaCl" where H2O is correct.

#### Code

```
learnosity id "yqy4gmhOTMmRkaIbxaKC" items [
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

### Example 59

#### Prompt
"Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive.

#### Code

```
learnosity id "zOkil8ZxrJJTp0Q3Gdnd" items [
  item questions [
    shorttext stimulus "What is the opposite of hot?" valid-response "cold" case-sensitive false placeholder "Type your answer here" {}
  ] {}
] {}..
```

---

### Example 60

#### Prompt
"Create a short text question asking "What is 7 × 8?" with the correct answer "56"."

#### Chat Transcript

**User**: Create a short text question asking "What is 7 × 8?" with the correct answer "56".

#### Code

```
learnosity id "zUgyf5K87OF3oEfjHtp0" items [
  item questions [
    shorttext stimulus "What is 7 × 8?" valid-response "56" {}
  ] {}
] {}..
```



