# Graffiticode Training Examples

## Language L0159

### Prompt
"create flashcards for the us state capitals

wrap the text in latex like this: ["\text{Alabama}", "\text{Montgomery}"]. don't escape the backslashes"

### Chat Transcript

**User**: create flashcards for the us state capitals

**Assistant**: This generated code creates a list of state capitals in the United States. It then uses that list to generate a set of flashcards with a dark theme and a background texture. The purpose of this code is to provide an educational tool for learning the state capitals.

**User**: wrap the text in latex like this: ["\text{Alabama}", "\text{Montgomery}"]. don't escape the backslashes

**Assistant**: The generated code creates a set of flashcards that display the names of U.S. states and their corresponding state capitals. The flashcards are stored in the variable "flashcards" and can be used for educational or study purposes. The code also sets a dark gray background color for the flashcards.

### Code

```
flashcards
  facts [
    [
    "\text{Alabama}",
    "\text{Montgomery}"
    ],
    [
    "\text{Alaska}",
    "\text{Juneau}"
    ],
    [
    "\text{Arizona}",
    "\text{Phoenix}"
    ],
    [
    "\text{Arkansas}",
    "\text{Little Rock}"
    ],
    [
    "\text{California}",
    "\text{Sacramento}"
    ],
    [
    "\text{Colorado}",
    "\text{Denver}"
    ],
    [
    "\text{Connecticut}",
    "\text{Hartford}"
    ],
    [
    "\text{Delaware}",
    "\text{Dover}"
    ],
    [
    "\text{Florida}",
    "\text{Tallahassee}"
    ],
    [
    "\text{Georgia}",
    "\text{Atlanta}"
    ],
    [
    "\text{Hawaii}",
    "\text{Honolulu}"
    ],
    [
    "\text{Idaho}",
    "\text{Boise}"
    ],
    [
    "\text{Illinois}",
    "\text{Springfield}"
    ],
    [
    "\text{Indiana}",
    "\text{Indianapolis}"
    ],
    [
    "\text{Iowa}",
    "\text{Des Moines}"
    ],
    [
    "\text{Kansas}",
    "\text{Topeka}"
    ],
    [
    "\text{Kentucky}",
    "\text{Frankfort}"
    ],
    [
    "\text{Louisiana}",
    "\text{Baton Rouge}"
    ],
    [
    "\text{Maine}",
    "\text{Augusta}"
    ],
    [
    "\text{Maryland}",
    "\text{Annapolis}"
    ],
    [
    "\text{Massachusetts}",
    "\text{Boston}"
    ],
    [
    "\text{Michigan}",
    "\text{Lansing}"
    ],
    [
    "\text{Minnesota}",
    "\text{St. Paul}"
    ],
    [
    "\text{Mississippi}",
    "\text{Jackson}"
    ],
    [
    "\text{Missouri}",
    "\text{Jefferson City}"
    ],
    [
    "\text{Montana}",
    "\text{Helena}"
    ],
    [
    "\text{Nebraska}",
    "\text{Lincoln}"
    ],
    [
    "\text{Nevada}",
    "\text{Carson City}"
    ],
    [
    "\text{New Hampshire}",
    "\text{Concord}"
    ],
    [
    "\text{New Jersey}",
    "\text{Trenton}"
    ],
    [
    "\text{New Mexico}",
    "\text{Santa Fe}"
    ],
    [
    "\text{New York}",
    "\text{Albany}"
    ],
    [
    "\text{North Carolina}",
    "\text{Raleigh}"
    ],
    [
    "\text{North Dakota}",
    "\text{Bismarck}"
    ],
    [
    "\text{Ohio}",
    "\text{Columbus}"
    ],
    [
    "\text{Oklahoma}",
    "\text{Oklahoma City}"
    ],
    [
    "\text{Oregon}",
    "\text{Salem}"
    ],
    [
    "\text{Pennsylvania}",
    "\text{Harrisburg}"
    ],
    [
    "\text{Rhode Island}",
    "\text{Providence}"
    ],
    [
    "\text{South Carolina}",
    "\text{Columbia}"
    ],
    [
    "\text{South Dakota}",
    "\text{Pierre}"
    ],
    [
    "\text{Tennessee}",
    "\text{Nashville}"
    ],
    [
    "\text{Texas}",
    "\text{Austin}"
    ],
    [
    "\text{Utah}",
    "\text{Salt Lake City}"
    ],
    [
    "\text{Vermont}",
    "\text{Montpelier}"
    ],
    [
    "\text{Virginia}",
    "\text{Richmond}"
    ],
    [
    "\text{Washington}",
    "\text{Olympia}"
    ],
    [
    "\text{West Virginia}",
    "\text{Charleston}"
    ],
    [
    "\text{Wisconsin}",
    "\text{Madison}"
    ],
    [
    "\text{Wyoming}",
    "\text{Cheyenne}"
    ]
  ]
{
  useBgTexture: true
}..
```

---

### Prompt
"create a matching game for the french names of the 10s from 10 to 100"

### Chat Transcript

**User**: create a matching game for the french names of the 10s from 10 to 100

**Assistant**: The generated code creates a simple matching game where the player has to match numbers to their French names. It defines a list of number-name pairs, sets up the game instructions, and applies a light color theme to the game interface. This code is designed to provide an educational and interactive way for users to learn French number names.

### Code

```
let pairs = [
  ["10", "dix"]
  ["20", "vingt"]
  ["30", "trente"]
  ["40", "quarante"]
  ["50", "cinquante"]
  ["60", "soixante"]
  ["70", "soixante-dix"]
  ["80", "quatre-vingts"]
  ["90", "quatre-vingt-dix"]
  ["100", "cent"]
]..

match facts pairs {}..
```

---

### Prompt
"create a matching game for the 9 times facts up to 9 times 9. add a textured background to the board"

### Chat Transcript

**User**: create a matching game for the 9 times facts up to 9 times 9. add a textured background to the board

**Assistant**: This generated code creates a simple matching game where the player has to match each multiplication fact with its correct answer. The game includes a list of multiplication facts and their corresponding answers, as well as some configuration options to customize the game's appearance. The purpose of this code is to provide an interactive way for users to practice their multiplication skills.

### Code

```
match facts [
    [
    '9 \times 1'
    '9'
    ]
    [
    '9 \times 2'
    '18'
    ]
    [
    '9 \times 3'
    '27'
    ]
    [
    '9 \times 4'
    '36'
    ]
    [
    '9 \times 5'
    '45'
    ]
    [
    '9 \times 6'
    '54'
    ]
    [
    '9 \times 7'
    '63'
    ]
    [
    '9 \times 8'
    '72'
    ]
    [
    '9 \times 9'
    '81'
    ]
  ]
  {
    useBgTexture: true
  }
..
```

---

### Prompt
"create flashcards for practicing the names of the french alphabet"

### Chat Transcript

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
}..
```

---

### Prompt
"create a matching game for the 9 times facts up to 9 times 9. add a textured background to the board"

### Chat Transcript

**User**: create a matching game for the 9 times facts up to 9 times 9. add a textured background to the board

**Assistant**: This generated code creates a simple matching game where the player has to match each multiplication fact with its correct answer. The game includes a list of multiplication facts and their corresponding answers, as well as some configuration options to customize the game's appearance. The purpose of this code is to provide an interactive way for users to practice their multiplication skills.

### Code

```
match facts [
  [
    '9 \times 1'
    '9'
  ]
  [
    '9 \times 2'
    '18'
  ]
  [
    '9 \times 3'
    '27'
  ]
  [
    '9 \times 4'
    '36'
  ]
  [
    '9 \times 5'
    '45'
  ]
  [
    '9 \times 6'
    '54'
  ]
  [
    '9 \times 7'
    '63'
  ]
  [
    '9 \times 8'
    '72'
  ]
  [
    '9 \times 9'
    '81'
  ]
] {
  useBgTexture: true
}..
```

