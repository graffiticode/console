# Graffiticode Training Examples

## Language L0159

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

