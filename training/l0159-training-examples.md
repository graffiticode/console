# Graffiticode Training Examples

## Language L0159

### Prompt
"create flashcards for practicing the french names for numbers from 10 to 100"

### Chat Transcript

**User**: create flashcards for practicing the french names for numbers from 10 to 100

**Assistant**: This generated code creates a set of flashcards that display French translations for numbers from 10 to 100. The code defines an array of facts, where each fact is a pair of the English number and its French equivalent. The generated code also includes a setting to use a background texture for the flashcards.

### Code

```
let flashcards =
  facts [
    [
    '10',
    'dix'
    ],
    [
    '20',
    'vingt'
    ],
    [
    '30',
    'trente'
    ],
    [
    '40',
    'quarante'
    ],
    [
    '50',
    'cinquante'
    ],
    [
    '60',
    'soixante'
    ],
    [
    '70',
    'soixante-dix'
    ],
    [
    '80',
    'quatre-vingts'
    ],
    [
    '90',
    'quatre-vingt-dix'
    ],
    [
    '100',
    'cent'
    ],
  ]
{
  useBgTexture: true,
}..
```

---

### Prompt
"create flashcards for practicing the numbers 1 to 10 in french

create flashcards for practicing the names of the french alphabet"

### Chat Transcript

**User**: create flashcards for practicing the numbers 1 to 10 in french

**Assistant**: This generated code creates a list of French number flashcards from 1 to 10. The code defines an array of French number words and their English translations, and then uses that data to generate a set of flashcards with a background texture. The purpose of this code is to provide a simple way to practice and learn French numbers from 1 to 10.

**User**: create flashcards for practicing the names of the french alphabet

**Assistant**: The generated code defines a list of the French alphabet letters and their corresponding pronunciations. It then uses this data to create a set of flashcards, each displaying a French letter and its name. The purpose of this code is to provide a simple way to learn the French alphabet and its pronunciation.

### Code

```
| Define the French alphabet and their names
let alphabet = [
  ["A", "ah"],
  ["B", "bay"],
  ["C", "say"],
  ["D", "day"],
  ["E", "euh"],
  ["F", "eff"],
  ["G", "jhay"],
  ["H", "ahsh"],
  ["I", "ee"],
  ["J", "jhee"],
  ["K", "kah"],
  ["L", "ell"],
  ["M", "emm"],
  ["N", "enn"],
  ["O", "oh"],
  ["P", "pay"],
  ["Q", "kew"],
  ["R", "air"],
  ["S", "ess"],
  ["T", "tay"],
  ["U", "ew"],
  ["V", "vay"],
  ["W", "doobluh-vay"],
  ["X", "eeks"],
  ["Y", "ee-grehk"],
  ["Z", "zehd"]
]..


| Generate flashcards from the alphabet data
flashcards facts alphabet
{

}
..
```

---

### Prompt
"create flashcards for practicing the numbers 1 to 10 in french"

### Chat Transcript

**User**: create flashcards for practicing the numbers 1 to 10 in french

**Assistant**: This generated code creates a list of French number flashcards from 1 to 10. The code defines an array of French number words and their English translations, and then uses that data to generate a set of flashcards with a background texture. The purpose of this code is to provide a simple way to practice and learn French numbers from 1 to 10.

### Code

```
| Create a list of French number flashcards from 1 to 10
let frenchNumbers = [
  ["un", "one"],
  ["deux", "two"],
  ["trois", "three"],
  ["quatre", "four"],
  ["cinq", "five"],
  ["six", "six"],
  ["sept", "seven"],
  ["huit", "eight"],
  ["neuf", "nine"],
  ["dix", "ten"]
]..|

flashcards
  facts frenchNumbers
{
  useBgTexture: true,
}..
```

---

### Prompt
"create flashcards for practicing the french names for numbers from 10 to 100"

### Chat Transcript

**User**: create flashcards for practicing the french names for numbers from 10 to 100

**Assistant**: This generated code creates a set of flashcards that display French translations for numbers from 10 to 100. The code defines an array of facts, where each fact is a pair of the English number and its French equivalent. The generated code also includes a setting to use a background texture for the flashcards.

### Code

```
flashcards
  facts [
    [
    '10',
    'dix'
    ],
    [
    '20',
    'vingt'
    ],
    [
    '30',
    'trente'
    ],
    [
    '40',
    'quarante'
    ],
    [
    '50',
    'cinquante'
    ],
    [
    '60',
    'soixante'
    ],
    [
    '70',
    'soixante-dix'
    ],
    [
    '80',
    'quatre-vingts'
    ],
    [
    '90',
    'quatre-vingt-dix'
    ],
    [
    '100',
    'cent'
    ],
  ]
{
}..
```

---

### Prompt
"Create flashcards for 9 times practice from 1 to 9"

### Chat Transcript

**User**: Create flashcards for 9 times practice from 1 to 9

**Assistant**: The generated code creates a set of flashcards for practicing multiplication. It generates a list of numbers from 1 to 9, creates a flashcard for each number that displays the question "What is 9 x [number]?" and the corresponding answer, and then displays each flashcard. The code also sets the theme to dark mode for the flashcards.

### Code

```
flashcards
  facts [
    [
    '9\times2',
    '18'
    ],
    [
    '9\times3',
    '27'
    ],
    [
    '9\times4',
    '36'
    ],
    [
    '9\times5',
    '45'
    ],
    [
    '9\times6',
    '54'
    ],
    [
    '9\times7',
    '63'
    ],
    [
    '9\times8',
    '72'
    ],
    [
    '9\times9',
    '81'
    ],
  ]
{
  useBgTexture: true,
}..
```

---

### Prompt
"create flashcards for practicing the french names for numbers from 10 to 100"

### Chat Transcript

**User**: create flashcards for practicing the french names for numbers from 10 to 100

**Assistant**: This generated code creates a set of flashcards that display French translations for numbers from 10 to 100. The code defines an array of facts, where each fact is a pair of the English number and its French equivalent. The generated code also includes a setting to use a background texture for the flashcards.

### Code

```
flashcards
  facts [
    [
    '10',
    'dix'
    ],
    [
    '20',
    'vingt'
    ],
    [
    '30',
    'trente'
    ],
    [
    '40',
    'quarante'
    ],
    [
    '50',
    'cinquante'
    ],
    [
    '60',
    'soixante'
    ],
    [
    '70',
    'soixante-dix'
    ],
    [
    '80',
    'quatre-vingts'
    ],
    [
    '90',
    'quatre-vingt-dix'
    ],
    [
    '100',
    'cent'
    ],
  ]
{
  useBgTexture: true,
}..
```

