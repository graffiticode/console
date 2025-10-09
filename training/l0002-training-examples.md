# Graffiticode Training Examples

*Downloaded on 2025-10-09T23:58:15.326Z*

## Language L0002

### Example 1

#### Prompt
"say "hello, world" and set theme to dark"

#### Chat Transcript

**User**: say "hello, world" and set theme to dark

**Assistant**: ```graffiticode
This code creates a dark-themed display that shows the text "Hello, world!" on the screen.
```

#### Code

```
theme dark
hello 'world'
..
```

---

### Example 2

#### Prompt
"simple case expression"

#### Chat Transcript

**User**: simple case expression

#### Code

```
case 42 of
  42: "Found forty-two"
  _: "Something else"
end..
```

---

### Example 3

#### Prompt
"get the first element in a list of strings"

#### Chat Transcript

**User**: get the first element in a list of strings

**Assistant**: The generated code creates a function called "first" that retrieves the first element from a list. It then defines a list of fruit names and uses the "first" function to get the first fruit in the list. Finally, it prints the first fruit to the console.

In simple terms, this generated code allows you to easily access the first item in a list and display it.

#### Code

```
let first = <list: hd list>..
let fruits = ["apple" "banana" "orange" "grape"]..
let firstFruit = first fruits..
firstFruit..
```

---

### Example 4

#### Prompt
"get the value of binding 'x' from and object that contains 'x'"

#### Chat Transcript

**User**: get the value of binding 'x' from and object that contains 'x'

**Assistant**: The generated code creates an object with two properties, 'x' and 'y', and assigns the values 42 and "hello" to them, respectively. It then retrieves the value of the 'x' property using the 'get' function and stores it in the 'xValue' variable. Finally, it prints the value of 'x' to the console.

#### Code

```
let obj = {x: 42}..
let xValue = get "x" obj..
xValue..
```

---

### Example 5

#### Prompt
"sum the values in an array of the first 100 integers"

#### Chat Transcript

**User**: sum the values in an array of the first 100 integers

**Assistant**: ```graffiticode
This generated code creates a list of the first 100 whole numbers (from 1 to 100) and then adds them all together to find their total sum. The code then displays the final result, which would be 5,050. It's essentially performing the mathematical task of finding the sum of all integers from 1 to 100.
```

#### Code

```
let numbers = range 1 101 1..
let sum = reduce (<x y: add x y>) 0 numbers..
sum..
```

---

### Example 6

#### Prompt
"compute fizzbuzz through 100"

#### Chat Transcript

**User**: compute fizzbuzz through 100

**Assistant**: ```graffiticode
This generated code creates a classic FizzBuzz program that processes numbers from 1 to 100. For each number, it replaces multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both 3 and 5 with "FizzBuzz", while leaving all other numbers unchanged. The code then displays this complete list of transformed numbers and words as the final output.
```

#### Code

```
let fizzbuzz = <n:
  if eq (mod n 15) 0 then "FizzBuzz"
  else if eq (mod n 3) 0 then "Fizz"
  else if eq (mod n 5) 0 then "Buzz"
  else n
>..
let numbers = range 1 101 1..
let results = map (fizzbuzz) numbers..
results..
```

---

### Example 7

#### Prompt
"create an record with field named foo to 10 and then set another field named bar to 20"

#### Chat Transcript

**User**: create an record with field named foo to 10 and then set another field named bar to 20

**Assistant**: The generated code creates a new record (or object) with a field named 'foo' set to the value 10. It then updates that record by adding another field called 'bar' with the value 20. Finally, it prints out the updated record with both the 'foo' and 'bar' fields.

#### Code

```
let myRecord = { foo: 10 }..
let updatedRecord = set "bar" 20 myRecord..
updatedRecord..
```

---

### Example 8

#### Prompt
"double a list of integers"

#### Chat Transcript

**User**: double a list of integers

#### Code

```
let double = <x: mul 2 x>..
map (double) [1 2 3]..
```

---

### Example 9

#### Prompt
"create a program with a let definition and an expression that calls the let definition"

#### Chat Transcript

**User**: create a program with a let definition and an expression that calls the let definition

#### Code

```
let x = 42..
x..
```

---

### Example 10

#### Prompt
"write a program that translates integers from 1 to 10 to their french names

make sure you wrap the function argument to map in parens so it is not prematurely applied

make sure you include the definition of numbers and return the result

now do the same for the tens from 10 to 100

test for numeric equality using the function eq

now generate a list of french names for the 10s

include 100"

#### Chat Transcript

**User**: write a program that translates integers from 1 to 10 to their french names

**Assistant**: The generated code creates a function that translates a number to its French name. It then generates a list of numbers from 1 to 10, maps each number to its French name using the translation function, and prints out the resulting list of French numbers.

**User**: make sure you wrap the function argument to map in parens so it is not prematurely applied

**Assistant**: The generated code creates a new list of French numbers by taking an existing list of numbers and applying a function called `frenchNumber` to each one. This allows the code to convert the original numbers into their French language equivalents, resulting in a new list of French numbers.

**User**: make sure you include the definition of numbers and return the result

**Assistant**: The generated code creates a function called `frenchNumber` that takes a number as input and returns its French name. It then defines a list of numbers from 1 to 10, maps each number to its French name using the `frenchNumber` function, and returns the resulting list of French numbers.

**User**: now do the same for the tens from 10 to 100

**Assistant**: The generated code creates a function called `frenchNumber` that takes a number as input and returns its French name. It then generates a list of numbers from 10 to 100 in increments of 10, and uses the `frenchNumber` function to translate each number into its French equivalent. Finally, the code returns the list of French numbers.

**User**: test for numeric equality using the function eq

**Assistant**: The generated code creates a function called `isEqual` that checks if two numbers are the same. It then tests this function with three different pairs of numbers and prints the results. The purpose of this code is to demonstrate how the `isEqual` function works by checking if various numbers are equal or not.

**User**: now generate a list of french names for the 10s

**Assistant**: The generated code performs the following tasks:

1. It defines a function called `frenchTens` that takes a number and returns its French name for tens (e.g., "dix" for 10, "vingt" for 20, etc.).
2. It generates a list of numbers from 10 to 100 in increments of 10, and then uses the `frenchTens` function to translate each number to its French name.
3. It checks if the 5th element in the list of French numbers is equal to "cinquante" (the French word for 50), and then prints both the list of French numbers and the result of the equality test.

**User**: include 100

**Assistant**: The generated code performs the following tasks:

1. It defines a function called `frenchTens` that translates numbers from 10 to 100 (in increments of 10) into their French names.
2. It generates a list of numbers from 10 to 100 (in increments of 10) and maps each number to its French name using the `frenchTens` function.
3. It checks if the 6th element in the list of French numbers (which should be "soixante" or 60) is indeed "soixante", and prints the list of French numbers and the result of this equality test.

#### Code

```
let frenchTens = <n:
  case n of
    10: "dix"
    20: "vingt"
    30: "trente"
    40: "quarante"
    50: "cinquante"
    60: "soixante"
    70: "soixante-dix"
    80: "quatre-vingts"
    90: "quatre-vingt-dix"
    100: "cent"
    _: "unknown"
  end
>..
let numbers = range 10 110 10..
let frenchNumbers = map (frenchTens) numbers..
frenchNumbers..
```

---

### Example 11

#### Prompt
"define a function and call it"

#### Chat Transcript

**User**: define a function and call it

#### Code

```
let myFunction = <x: mul x 2>..
myFunction 42..
```

---

### Example 12

#### Prompt
"use parenthesis to call a higher order function"

#### Chat Transcript

**User**: use parenthesis to call a higher order function

#### Code

```
let double = <x: mul 2 x>..
map (double) [1 2 3]..
```

---

### Example 13

#### Prompt
"write a program with a simple conditional expression"

#### Chat Transcript

**User**: write a program with a simple conditional expression

#### Code

```
if gt 5 3 then "five is greater" else "three is greater"..
```

---

### Example 14

#### Prompt
"get the tail of a list of integers"

#### Chat Transcript

**Assistant**: ```graffiticode
| Define a list of integers
let numbers = [5 8 2 9 3]..  | Get the tail of the list (everything after the first element)
let tail = tl numbers..  | Print the resulting tail
print tail..
```

**User**: get the tail of a list of integers

#### Code

```
let numbers = [6 8 2 9 3]..
let tail = tl numbers..
 tail..
```



