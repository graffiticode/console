# Graffiticode Training Examples

*Downloaded on 2026-04-02T03:30:59.568Z*

## Language L0158

### Example 1

#### Prompt
"Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct."

#### Chat Transcript

**User**: Create an items assessment with an MCQ asking "What is the largest continent?" with options "Asia", "Africa", "Europe", "Antarctica" where Asia is correct.

#### Code

```
set-var "lrn-id" "1iIqfydiLVYunlYHRSmr"
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

### Example 2

#### Prompt
"Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct."

#### Chat Transcript

**User**: Create a multiple choice true/false question asking "The Earth is flat" with options "True", "False" where False is correct.

#### Code

```
set-var "lrn-id" "3KtEwfzYbCZdUk4DYVeF"
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

### Example 3

#### Prompt
"Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the capital of France?" with options "Paris", "London", "Berlin", "Madrid" where Paris is correct.

#### Code

```
set-var "lrn-id" "8tW2HFMk1QxsXCLo0up4"
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

### Example 4

#### Prompt
"Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct."

#### Chat Transcript

**User**: Create a multiple choice question with shuffled options asking "What color is the sky?" with options "Blue", "Green", "Red" where Blue is correct.

#### Code

```
set-var "lrn-id" "9Rn5W3fQZzWdzhLwGhxI"
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

### Example 5

#### Prompt
"Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the boiling point of water?" with options "50°C", "100°C", "150°C", "200°C" where 100°C is correct.

#### Code

```
set-var "lrn-id" "G491zsxoL4gxiW0CQKa9"
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

### Example 6

#### Prompt
"Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback."

#### Chat Transcript

**User**: Create a multiple choice question asking "What is the square root of 144?" with options "10", "11", "12", "13" where 12 is correct, with instant feedback.

#### Code

```
set-var "lrn-id" "G7lRKqs44gQxUbxlAlxR"
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

### Example 7

#### Prompt
"Create a short text question asking "What is 7 × 8?" with the correct answer "56"."

#### Chat Transcript

**User**: Create a short text question asking "What is 7 × 8?" with the correct answer "56".

#### Code

```
set-var "lrn-id" "GbXn45DoKLRksAGY8a49"
learnosity items [
  item questions [
    shorttext stimulus "What is 7 × 8?" valid-response "56" {}
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
set-var "lrn-id" "GwwEpssNLIC68T6KB6hu"
learnosity items [
  item questions [
    shorttext stimulus "What is the abbreviation for Doctor?" valid-response "Dr." case-sensitive true {}
  ] {}
] {}..
```

---

### Example 9

#### Prompt
"Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which language is L0158 built for?" with options "Learnosity", "Canvas", "Moodle", "Blackboard" where Learnosity is correct.

#### Code

```
set-var "lrn-id" "U2jYeBmDxnoelNYNAkrE"
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

### Example 10

#### Prompt
"Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct."

#### Chat Transcript

**User**: Create a multiple choice question with instant feedback asking "What is 2 + 2?" with options "3", "4", "5", "6" where 4 is correct.

#### Code

```
set-var "lrn-id" "WXAhrGuzCuFciwWAvz1U"
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

### Example 11

#### Prompt
"Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which element has atomic number 1?" with options "Helium", "Hydrogen", "Lithium", "Carbon" where Hydrogen is correct, with shuffled options.

#### Code

```
set-var "lrn-id" "XHqy0kuCXNPkpGMywuKk"
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

### Example 12

#### Prompt
"Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses."

#### Chat Transcript

**User**: Create a multiple choice question asking "Select all even numbers" with options "1", "2", "3", "4" where 2 and 4 are correct, allowing multiple responses.

#### Code

```
set-var "lrn-id" "ZPIbSaCWeQSvWslLWtgO"
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

### Example 13

#### Prompt
"Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945"."

#### Chat Transcript

**User**: Create an items assessment with a short text question asking "What year did World War II end?" with the correct answer "1945".

#### Code

```
set-var "lrn-id" "dzs9dtJ428folM3XHrkN"
learnosity items [
  item questions [
    shorttext stimulus "What year did World War II end?" valid-response "1945" {}
  ] {}
] {}..
```

---

### Example 14

#### Prompt
"Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O"."

#### Chat Transcript

**User**: Create a short text question asking "What is the chemical symbol for water?" with the correct answer "H2O".

#### Code

```
set-var "lrn-id" "gyPXDYMmFtCadIjPZQg7"
learnosity items [
  item questions [
    shorttext stimulus "What is the chemical symbol for water?" valid-response "H2O" {}
  ] {}
] {}..
```

---

### Example 15

#### Prompt
"Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct."

#### Chat Transcript

**User**: Create an items assessment with a single MCQ asking "What is 3 × 4?" with options "7", "10", "12", "15" where 12 is correct.

#### Code

```
set-var "lrn-id" "iFffm8nA39PMDzCdG8Tf"
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

### Example 16

#### Prompt
"Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "Spell the number 4" with the correct answer "four", case insensitive.

#### Code

```
set-var "lrn-id" "iUwHEfU1xOibx4wZstVN"
learnosity items [
  item questions [
    shorttext stimulus "Spell the number 4" valid-response "four" case-sensitive false {}
  ] {}
] {}..
```

---

### Example 17

#### Prompt
"Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What gas do plants absorb?" with the correct answer "carbon dioxide", case insensitive.

#### Code

```
set-var "lrn-id" "j69hpRjJTpgppZv1SjNZ"
learnosity items [
  item questions [
    shorttext stimulus "What gas do plants absorb?" valid-response "carbon dioxide" case-sensitive false {}
  ] {}
] {}..
```

---

### Example 18

#### Prompt
"Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which is a mammal?" with options "Shark", "Eagle", "Dolphin", "Lizard" where Dolphin is correct, with instant feedback enabled.

#### Code

```
set-var "lrn-id" "j8ZVFtxnkjpNQgY1pvZd"
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

### Example 19

#### Prompt
"Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters.

Create a short text question asking "What is 7 × 8?" with the correct answer "56"."

#### Chat Transcript

**User**: Create a short text question asking "Type the missing word: The quick brown ___" with the correct answer "fox", with a maximum length of 20 characters.

**User**: Create a short text question asking "What is 7 × 8?" with the correct answer "56".

#### Code

```
set-var "lrn-id" "kH8LdimeF3GubNUBdMmp"
learnosity items [
  item questions [
    shorttext stimulus "What is 7 × 8?" valid-response "56" {}
  ] {}
] {}..
```

---

### Example 20

#### Prompt
"Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo"."

#### Chat Transcript

**User**: Create a short text question asking "What is the capital of Japan?" with the correct answer "Tokyo".

#### Code

```
set-var "lrn-id" "kxHQQTjCSDqgMj0zwPmh"
learnosity items [
  item questions [
    shorttext stimulus "What is the capital of Japan?" valid-response "Tokyo" {}
  ] {}
] {}..
```

---

### Example 21

#### Prompt
"Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific"."

#### Chat Transcript

**User**: Create a short text question with a placeholder "Enter your answer here" asking "Name the largest ocean" with the correct answer "Pacific".

#### Code

```
set-var "lrn-id" "naCL2FwAvR42WeaDg6dU"
learnosity items [
  item questions [
    shorttext stimulus "Name the largest ocean" valid-response "Pacific" placeholder "Enter your answer here" {}
  ] {}
] {}..
```

---

### Example 22

#### Prompt
"Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct."

#### Chat Transcript

**User**: Create a multiple choice question allowing multiple responses asking "Which are prime numbers?" with options "2", "4", "7", "9" where 2 and 7 are correct.

#### Code

```
set-var "lrn-id" "sZkL8FWXatwFEkjntIln"
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

### Example 23

#### Prompt
"Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which season comes after spring?" with options "Summer", "Fall", "Winter" where Summer is correct.

#### Code

```
set-var "lrn-id" "wmONxFLzJBT4q7cigm7E"
learnosity items [
  item questions [
    mcq stimulus "Which season comes after spring?" options [
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

### Example 24

#### Prompt
"Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct."

#### Chat Transcript

**User**: Create a multiple choice question asking "Which planet is largest?" with options "Earth", "Jupiter", "Mars", "Saturn" where Jupiter is correct.

#### Code

```
set-var "lrn-id" "wxvVKM4onYqsKdSsxluy"
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

### Example 25

#### Prompt
"Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive."

#### Chat Transcript

**User**: Create a short text question asking "What is the opposite of hot?" with the correct answer "cold", case insensitive.

#### Code

```
set-var "lrn-id" "xwvw99vROeXxQZUWatYn"
learnosity items [
  item questions [
    shorttext stimulus "What is the opposite of hot?" valid-response "cold" case-sensitive false {}
  ] {}
] {}..
```



