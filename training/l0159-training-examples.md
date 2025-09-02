# Graffiticode Training Examples

*Downloaded on 2025-09-02T16:21:59.835Z*

## Language L0159

### Example 1

#### Prompt
"make flashcards for the us presidents and the number of their term"

#### Chat Transcript

**User**: make flashcards for the us presidents and the number of their term

**Assistant**: The generated code creates a list of US presidents and their term numbers. It then uses this data to generate flashcards with the title "US Presidents" and a background texture, which can be used for studying or reviewing information about the US presidents.

#### Code

```
| Define the list of US presidents and term numbers
let presidents = [
  ["\text{George Washington}", "\text{1}"],
  ["\text{John Adams}", "\text{2}"],
  ["\text{Thomas Jefferson}", "\text{3}"],
  ["\text{James Madison}", "\text{4}"],
  ["\text{James Monroe}", "\text{5}"],
  ["\text{John Quincy Adams}", "\text{6}"],
  ["\text{Andrew Jackson}", "\text{7}"],
  ["\text{Martin Van Buren}", "\text{8}"],
  ["\text{William Henry Harrison}", "\text{9}"],
  ["\text{John Tyler}", "\text{10}"],
  ["\text{James K. Polk}", "\text{11}"],
  ["\text{Zachary Taylor}", "\text{12}"],
  ["\text{Millard Fillmore}", "\text{13}"],
  ["\text{Franklin Pierce}", "\text{14}"],
  ["\text{James Buchanan}", "\text{15}"],
  ["\text{Abraham Lincoln}", "\text{16}"],
  ["\text{Andrew Johnson}", "\text{17}"],
  ["\text{Ulysses S. Grant}", "\text{18}"],
  ["\text{Rutherford B. Hayes}", "\text{19}"],
  ["\text{James A. Garfield}", "\text{20}"],
  ["\text{Chester A. Arthur}", "\text{21}"],
  ["\text{Grover Cleveland}", "\text{22 24}"],
  ["\text{Benjamin Harrison}", "\text{23}"],
  ["\text{William McKinley}", "\text{25}"],
  ["\text{Theodore Roosevelt}", "\text{26}"],
  ["\text{William Howard Taft}", "\text{27}"],
  ["\text{Woodrow Wilson}", "\text{28}"],
  ["\text{Warren G. Harding}", "\text{29}"],
  ["\text{Calvin Coolidge}", "\text{30}"],
  ["\text{Herbert Hoover}", "\text{31}"],
  ["\text{Franklin D. Roosevelt}", "\text{32}"],
  ["\text{Harry S. Truman}", "\text{33}"],
  ["\text{Dwight D. Eisenhower}", "\text{34}"],
  ["\text{John F. Kennedy}", "\text{35}"],
  ["\text{Lyndon B. Johnson}", "\text{36}"],
  ["\text{Richard Nixon}", "\text{37}"],
  ["\text{Gerald Ford}", "\text{38}"],
  ["\text{Jimmy Carter}", "\text{39}"],
  ["\text{Ronald Reagan}", "\text{40}"],
  ["\text{George H. W. Bush}", "\text{41}"],
  ["\text{Bill Clinton}", "\text{42}"],
  ["\text{George W. Bush}", "\text{43}"],
  ["\text{Barack Obama}", "\text{44}"],
  ["\text{Donald Trump}", "\text{45}"],
  ["\text{Joe Biden}", "\text{46}"]
]..

| Generate flashcards using the president data
flashcards
  facts presidents
{
  useBgTexture: true
}..
```

---

### Example 2

#### Prompt
"create flashcard for first grade addition

elide the answer in the first fact of each pair

don't escape quote characters"

#### Chat Transcript

**User**: create flashcard for first grade addition

**Assistant**: The generated code defines a list of first grade addition facts, with each fact presented as a pair of expressions - one with the answer highlighted in a red box, and the other showing the full equation. The code then uses this list of addition facts to generate a set of flashcards, with a title, instructions, and the addition facts displayed on the cards. This allows for the creation of a simple, visually appealing flashcard set for practicing first grade addition.

**User**: elide the answer in the first fact of each pair

**Assistant**: This generated code creates a set of flashcards for first-grade addition facts. It defines a list of addition problems with missing addends, and then generates flashcards with those problems on the front and the full equations on the back. The flashcards have a large blue text on a yellow background, making them visually engaging for young learners.

**User**: don't escape quote characters

**Assistant**: This generated code creates a set of flashcards for practicing first-grade addition facts. It defines a list of addition problems where the answer is hidden in a red box. The code then generates the flashcards with the addition facts, a title, instructions, and customized formatting such as blue text, large size, and a yellow background.

#### Code

```
| Define the addition facts with the answer elided in the first expression
let additionFacts = [
  ["\boxed{\textcolor{red}{?}} + 3 = 8", "5 + 3 = 8"],
  ["2 + \boxed{\textcolor{red}{?}} = 7", "2 + 5 = 7"],
  ["\boxed{\textcolor{red}{?}} + 6 = 10", "4 + 6 = 10"],
  ["1 + \boxed{\textcolor{red}{?}} = 9", "1 + 8 = 9"],
  ["\boxed{\textcolor{red}{?}} + 4 = 9", "5 + 4 = 9"],
  ["3 + \boxed{\textcolor{red}{?}} = 8", "3 + 5 = 8"],
  ["\boxed{\textcolor{red}{?}} + 7 = 10", "3 + 7 = 10"],
  ["2 + \boxed{\textcolor{red}{?}} = 6", "2 + 4 = 6"],
  ["\boxed{\textcolor{red}{?}} + 5 = 7", "2 + 5 = 7"],
  ["0 + \boxed{\textcolor{red}{?}} = 8", "0 + 8 = 8"]
]..

| Generate the flashcards
flashcards
  title "First Grade Addition"
/  instructions "Solve the addition problem on each card. The answer is hidden in the red box. Flip the card to check your answer!"
  facts additionFacts
  {
    textColor: "blue",
    textSize: "large",
    bgColor: "yellow"
  }..
```



