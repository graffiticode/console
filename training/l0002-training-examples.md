# Graffiticode Training Examples

## Language L0002

### Prompt
"print fizzbuzz

compute fizzbuzz through 100"

### Chat Transcript

**User**: print fizzbuzz

**Assistant**: ```ocaml
This generated code creates a classic FizzBuzz program that takes numbers from 1 to 15 and applies special rules to them. For each number, it replaces multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both 3 and 5 with "FizzBuzz", while leaving other numbers unchanged. The code then displays all the results, showing a mix of numbers and words like "1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz".
```

**User**: compute fizzbuzz through 100

**Assistant**: ```ocaml
This generated code creates a classic FizzBuzz program that processes numbers from 1 to 100. For each number, it replaces multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both 3 and 5 with "FizzBuzz", while leaving all other numbers unchanged. The code then displays this complete list of transformed numbers and words as the final output.
```

### Code

```
| FizzBuzz implementation that computes values from 1 to 100
let fizzbuzz = <n:
  if eq (mod n 15) 0 then "FizzBuzz"
  else if eq (mod n 3) 0 then "Fizz"
  else if eq (mod n 5) 0 then "Buzz"
  else n
>..

| Generate numbers from 1 to 100
let numbers = range 1 101 1..

| Apply fizzbuzz to each number
let results = map (fizzbuzz) numbers..

| Print the results
print results..
```

---

### Prompt
"translate a list of french numbers between 1 and 10 into french

translate 10 into french

translate a list of integers from zero to twenty incremented by 2 into french"

### Chat Transcript

**User**: translate a list of french numbers between 1 and 10 into french

**Assistant**: The generated code creates a function that takes a number as input and returns its French name. It then applies this function to a list of numbers, creating a new list of their French translations. Finally, it prints out the resulting list of French number names.

**User**: translate 10 into french

**Assistant**: The generated code creates a function called `frenchNumber` that takes a number as input and returns its French name. For example, if you pass in the number 10, the function will return the French word "dix". The code then uses this `frenchNumber` function to translate the number 10 to French and print the result.

**User**: translate a list of integers from zero to twenty incremented by 2 into french

**Assistant**: The generated code performs the following tasks:

1. It defines a function called `frenchNumber` that takes a number as input and returns its French name. The function covers numbers from 0 to 20, with some common even numbers.

2. It generates a list of even numbers from 0 to 20 using the `range` function.

3. It then maps each number in the list to its French name using the `frenchNumber` function and stores the results in the `frenchNumbers` variable. Finally, it prints out the list of French numbers.

### Code

```
| Function to translate a number to its French name
let frenchNumber = <n:
  case n of
    0: "zéro"
    2: "deux"
    4: "quatre"
    6: "six"
    8: "huit"
    10: "dix"
    12: "douze"
    14: "quatorze"
    16: "seize"
    18: "dix-huit"
    20: "vingt"
    _: "unknown"
  end
>..\n

| Generate a list of even numbers from 0 to 20
let numbers = range 0 22 2..\n

| Map each number to its French name
let frenchNumbers = map (frenchNumber) numbers..\n

| Print the results
print frenchNumbers..
```

---

### Prompt
"create an record with field named foo to 10 and then set another field named bar to 20"

### Chat Transcript

**User**: create an record with field named foo to 10 and then set another field named bar to 20

**Assistant**: The generated code creates a new record (or object) with a field named 'foo' set to the value 10. It then updates that record by adding another field called 'bar' with the value 20. Finally, it prints out the updated record with both the 'foo' and 'bar' fields.

### Code

```
| Create a record with a field named 'foo' set to 10
let myRecord = { foo: 10 }..

| Set another field named 'bar' to 20 in the same record
let updatedRecord = set "bar" 20 myRecord..

| Print the updated record
print updatedRecord..
```

---

### Prompt
"add 10 to a list of integers 1 through 9"

### Chat Transcript

**User**: add 10 to a list of integers 1 through 9

**Assistant**: ```ocaml
This generated code creates a simple mathematical operation that adds 10 to each number in a sequence. The code first defines a list of numbers from 1 to 9, then automatically applies a function that adds 10 to every number in that list. The result would be a new list containing the numbers 11, 12, 13, 14, 15, 16, 17, 18, and 19.
```

### Code

```
| Function to add 10 to a number
let addTen = <x: add x 10>..

| Create a list of integers from 1 to 9
let numbers = range 1 10 1..

| Add 10 to each number in the list
map (addTen) numbers..
```

---

### Prompt
"get the first element in a list of strings"

### Chat Transcript

**User**: get the first element in a list of strings

**Assistant**: The generated code creates a function called "first" that retrieves the first element from a list. It then defines a list of fruit names and uses the "first" function to get the first fruit in the list. Finally, it prints the first fruit to the console.

In simple terms, this generated code allows you to easily access the first item in a list and display it.

### Code

```
| Function to get the first element of a list
let first = <list: hd list>..


| Example list of strings
let fruits = ["apple" "banana" "orange" "grape"]..


| Get the first fruit
let firstFruit = first fruits..


| Print the first fruit
print firstFruit..
```

---

### Prompt
"print the sum of 100 and 200"

### Chat Transcript

**User**: print the sum of 100 and 200

**Assistant**: ```ocaml
The generated code performs a simple mathematical calculation by adding two numbers together: 100 and 200. It then displays the result of this addition, which would be 300, on the screen. This is a basic arithmetic operation that demonstrates how to compute and show the sum of two values.
```

### Code

```
| Calculate and print the sum of 100 and 200
print (add 100 200)..
```

---

### Prompt
"create an record with field named foo to 10 and then set another field named bar to 20"

### Chat Transcript

**User**: create an record with field named foo to 10 and then set another field named bar to 20

**Assistant**: The generated code creates a new record (or object) with a field named 'foo' set to the value 10. It then updates that record by adding another field called 'bar' with the value 20. Finally, it prints out the updated record with both the 'foo' and 'bar' fields.

### Code

```
theme dark hello 'world'..
```

---

### Prompt
"get the value of binding 'x' from and object that contains 'x'"

### Chat Transcript

**User**: get the value of binding 'x' from and object that contains 'x'

**Assistant**: The generated code creates an object with two properties, 'x' and 'y', and assigns the values 42 and "hello" to them, respectively. It then retrieves the value of the 'x' property using the 'get' function and stores it in the 'xValue' variable. Finally, it prints the value of 'x' to the console.

### Code

```
| Object containing the binding 'x'
let obj = {x: 42 y: "hello"}.. | Get the value of 'x' using the 'get' function
let xValue = get "x" obj.. | Print the value of 'x'
print xValue..
```

---

### Prompt
"write a program that translates integers from 1 to 10 to their french names

make sure you wrap the function argument to map in parens so it is not prematurely applied

make sure you include the definition of numbers and return the result

now do the same for the tens from 10 to 100

test for numeric equality using the function eq

now generate a list of french names for the 10s

include 100"

### Chat Transcript

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

### Code

```
| Function to translate a number to its French name for tens
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

| Generate a list of numbers from 10 to 100 in increments of 10
let numbers = range 10 110 10..

| Map each number to its French name
let frenchNumbers = map (frenchTens) numbers..

| Check if the 6th element is "soixante" (60 in French)
let isSixty = eq "soixante" nth 5 frenchNumbers..

| Print the list of French numbers and the result of the equality test
print frenchNumbers..
```

