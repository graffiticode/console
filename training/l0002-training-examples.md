# Graffiticode Training Examples

*Downloaded on 2026-03-18T18:49:52.948Z*

## Language L0002

### Example 1

#### Prompt
"Write Graffiticode that adds 3, 4, and 5 together."

#### Chat Transcript

**User**: Write Graffiticode that adds 3, 4, and 5 together.

#### Code

```
12..
```

---

### Example 2

#### Prompt
"say "hello, world" and set theme to dark"

#### Chat Transcript

**User**: say "hello, world" and set theme to dark

**Assistant**: ```graffiticode
This code creates a dark-themed display that shows the text "Hello, world!" on the screen.
```

#### Code

```
theme dark hello "world"..
```

---

### Example 3

#### Prompt
"Write Graffiticode that defines a function addOne."

#### Chat Transcript

**User**: Write Graffiticode that defines a function addOne.

#### Code

```
add 1 42..
```

---

### Example 4

#### Prompt
"Write Graffiticode that creates the list of numbers from 0 to 10 with step 2."

#### Chat Transcript

**User**: Write Graffiticode that creates the list of numbers from 0 to 10 with step 2.

#### Code

```
range 0 11 2..
```

---

### Example 5

#### Prompt
"simple case expression"

#### Chat Transcript

**User**: simple case expression

#### Code

```
print case 42 of
  42: "Found forty-two"
  _: "Something else"
end..
```

---

### Example 6

#### Prompt
"Write Graffiticode that adds 100 and -5."

#### Chat Transcript

**User**: Write Graffiticode that adds 100 and -5.

#### Code

```
95..
```

---

### Example 7

#### Prompt
"write code that checks if the list [] is empty"

#### Chat Transcript

**User**: write code that checks if the list [] is empty

#### Code

```
isempty []..
```

---

### Example 8

#### Prompt
"Write Graffiticode that multiplies 2 by the sum of 3 and 4."

#### Chat Transcript

**User**: Write Graffiticode that multiplies 2 by the sum of 3 and 4.

#### Code

```
mul 2 7..
```

---

### Example 9

#### Prompt
"Write Graffiticode that filters even numbers from the range 1 to 10."

#### Chat Transcript

**User**: Write Graffiticode that filters even numbers from the range 1 to 10.

#### Code

```
filter (<x: eq 0 (mod x 2)>) range 1 11 1..
```

---

### Example 10

#### Prompt
"Write Graffiticode that defines a function triple and maps it over [1 2 3]."

#### Chat Transcript

**User**: Write Graffiticode that defines a function triple and maps it over [1 2 3].

#### Code

```
map (<x: mul 3 x>) [
  1
  2
  3
]..
```

---

### Example 11

#### Prompt
"Write Graffiticode that doubles numbers from 1 to 10."

#### Chat Transcript

**User**: Write Graffiticode that doubles numbers from 1 to 10.

#### Code

```
map (<x: mul 2 x>) range 1 11 1..
```

---

### Example 12

#### Prompt
"Write Graffiticode that keeps only the even numbers in [1 2 3 4 5 6]."

#### Chat Transcript

**User**: Write Graffiticode that keeps only the even numbers in [1 2 3 4 5 6].

#### Code

```
filter (<x: eq 0 (mod x 2)>) [
  1
  2
  3
  4
  5
  6
]..
```

---

### Example 13

#### Prompt
"Write Graffiticode that creates the list from 5 to 20 with step 5."

#### Chat Transcript

**User**: Write Graffiticode that creates the list from 5 to 20 with step 5.

#### Code

```
range 5 25 5..
```

---

### Example 14

#### Prompt
"Write Graffiticode that filters numbers greater than 3 from [1 2 3 4 5]."

#### Chat Transcript

**User**: Write Graffiticode that filters numbers greater than 3 from [1 2 3 4 5].

#### Code

```
filter (<x: gt x 3>) [
  1
  2
  3
  4
  5
]..
```

---

### Example 15

#### Prompt
"Write Graffiticode that returns the third element of [10 20 30 40]."

#### Chat Transcript

**User**: Write Graffiticode that returns the third element of [10 20 30 40].

#### Code

```
nth 2 [
  10
  20
  30
  40
]..
```

---

### Example 16

#### Prompt
"Write Graffiticode that triples the number 7."

#### Chat Transcript

**User**: Write Graffiticode that triples the number 7.

#### Code

```
mul 3 7..
```

---

### Example 17

#### Prompt
"Write Graffiticode that multiplies 6 by 4."

#### Chat Transcript

**User**: Write Graffiticode that multiplies 6 by 4.

#### Code

```
mul 6 4..
```

---

### Example 18

#### Prompt
"write a program that translates integers from 1 to 10 to their french names"

#### Chat Transcript

**User**: write a program that translates integers from 1 to 10 to their french names

#### Code

```
{
  errors: [
    {
      message: "Cannot read properties of undefined (reading 'id')"
    }
  ]
}..
```

---

### Example 19

#### Prompt
"Write Graffiticode that filters out negative numbers from [3 -1 4 -2 5]."

#### Chat Transcript

**User**: Write Graffiticode that filters out negative numbers from [3 -1 4 -2 5].

#### Code

```
filter (<x: ge x 0>) [
  3
  5
  7
  9
]..
```

---

### Example 20

#### Prompt
"Write Graffiticode that sums all numbers in [1 2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that sums all numbers in [1 2 3 4].

#### Code

```
reduce (<acc x: add acc x>) 0 [
  1
  2
  3
  4
]..
```

---

### Example 21

#### Prompt
"get the first element in a list of strings"

#### Chat Transcript

**User**: get the first element in a list of strings

**Assistant**: The generated code creates a function called "first" that retrieves the first element from a list. It then defines a list of fruit names and uses the "first" function to get the first fruit in the list. Finally, it prints the first fruit to the console.

In simple terms, this generated code allows you to easily access the first item in a list and display it.

#### Code

```
print hd [
  "apple"
  "banana"
  "orange"
  "grape"
]..
```

---

### Example 22

#### Prompt
"get the value of binding 'x' from and object that contains 'x'"

#### Chat Transcript

**User**: get the value of binding 'x' from and object that contains 'x'

**Assistant**: The generated code creates an object with two properties, 'x' and 'y', and assigns the values 42 and "hello" to them, respectively. It then retrieves the value of the 'x' property using the 'get' function and stores it in the 'xValue' variable. Finally, it prints the value of 'x' to the console.

#### Code

```
print get "x" {
  x: 42
}..
```

---

### Example 23

#### Prompt
"Write Graffiticode that sums the squares of [1 2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that sums the squares of [1 2 3 4].

#### Code

```
reduce (<acc x: add acc x>) 0 map (<x: mul x x>) [
  1
  2
  3
  4
]..
```

---

### Example 24

#### Prompt
"Write Graffiticode that doubles the number 9."

#### Chat Transcript

**User**: Write Graffiticode that doubles the number 9.

#### Code

```
mul 2 9..
```

---

### Example 25

#### Prompt
"Write Graffiticode that defines a function that adds two numbers."

#### Chat Transcript

**User**: Write Graffiticode that defines a function that adds two numbers.

#### Code

```
add 1 2..
```

---

### Example 26

#### Prompt
"compute fizzbuzz through 100"

#### Chat Transcript

**User**: compute fizzbuzz through 100

**Assistant**: ```graffiticode
This generated code creates a classic FizzBuzz program that processes numbers from 1 to 100. For each number, it replaces multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both 3 and 5 with "FizzBuzz", while leaving all other numbers unchanged. The code then displays this complete list of transformed numbers and words as the final output.
```

#### Code

```
print map (<n: if eq (mod n 15) 0 then
  "FizzBuzz"
else
  if eq (mod n 3) 0 then
    "Fizz"
else
    if eq (mod n 5) 0 then
      "Buzz"
else
      n>) range 1 101 1..
```

---

### Example 27

#### Prompt
"Write Graffiticode that triples every number in [2 4 6]."

#### Chat Transcript

**User**: Write Graffiticode that triples every number in [2 4 6].

#### Code

```
map (<x: mul 3 x>) [
  2
  4
  6
]..
```

---

### Example 28

#### Prompt
"Write Graffiticode that multiplies the result of 2+3 by 4."

#### Chat Transcript

**User**: Write Graffiticode that multiplies the result of 2+3 by 4.

#### Code

```
mul 5 4..
```

---

### Example 29

#### Prompt
"create an record with field named foo to 10 and then set another field named bar to 20"

#### Chat Transcript

**User**: create an record with field named foo to 10 and then set another field named bar to 20

**Assistant**: The generated code creates a new record (or object) with a field named 'foo' set to the value 10. It then updates that record by adding another field called 'bar' with the value 20. Finally, it prints out the updated record with both the 'foo' and 'bar' fields.

#### Code

```
print set "bar" 20 {
  foo: 10
}..
```

---

### Example 30

#### Prompt
"double a list of integers"

#### Chat Transcript

**User**: double a list of integers

#### Code

```
map (<x: mul 2 x>) [
  1
  2
  3
]..
```

---

### Example 31

#### Prompt
"Write Graffiticode that multiplies three numbers: 2, 3, and 4."

#### Chat Transcript

**User**: Write Graffiticode that multiplies three numbers: 2, 3, and 4.

#### Code

```
mul 2 mul 3 4..
```

---

### Example 32

#### Prompt
"Write Graffiticode that counts the number of elements in [5 6 7 8]."

#### Chat Transcript

**User**: Write Graffiticode that counts the number of elements in [5 6 7 8].

#### Code

```
reduce (<acc x: add acc 1>) 0 [
  5
  6
  7
  8
]..
```

---

### Example 33

#### Prompt
"Write Graffiticode that adds three numbers: 1, 2, and 3."

#### Chat Transcript

**User**: Write Graffiticode that adds three numbers: 1, 2, and 3.

#### Code

```
6..
```

---

### Example 34

#### Prompt
"create a program with a let definition and an expression that calls the let definition"

#### Chat Transcript

**User**: create a program with a let definition and an expression that calls the let definition

#### Code

```
42..
```

---

### Example 35

#### Prompt
"Write Graffiticode that squares the number 6."

#### Chat Transcript

**User**: Write Graffiticode that squares the number 6.

#### Code

```
36..
```

---

### Example 36

#### Prompt
"Write Graffiticode that computes the remainder when 17 is divided by 5."

#### Chat Transcript

**User**: Write Graffiticode that computes the remainder when 17 is divided by 5.

#### Code

```
2..
```

---

### Example 37

#### Prompt
"create a function that prints the names of the first 10 integers in french and calls it with one of the integers"

#### Chat Transcript

**User**: create a function that prints the names of the first 10 integers in french and calls it with one of the integers

#### Code

```
case 10 of
  1: "un"
  2: "deux"
  3: "trois"
  4: "quatre"
  5: "cinq"
  6: "six"
  7: "sept"
  8: "huit"
  9: "neuf"
  10: "dix"
  _: "unknown"
end..
```

---

### Example 38

#### Prompt
"Write Graffiticode that defines a function that subtracts two numbers.

Write Graffiticode that defines a function that subtracts two numbers."

#### Chat Transcript

**User**: Write Graffiticode that defines a function that subtracts two numbers.

**User**: Write Graffiticode that defines a function that subtracts two numbers.

#### Code

```
sub 10 3..
```

---

### Example 39

#### Prompt
"Write Graffiticode that returns the first element of [5 6 7]."

#### Chat Transcript

**User**: Write Graffiticode that returns the first element of [5 6 7].

#### Code

```
hd [
  5
  6
  7
]..
```

---

### Example 40

#### Prompt
"Write Graffiticode that defines a function double and uses it with map."

#### Chat Transcript

**User**: Write Graffiticode that defines a function double and uses it with map.

#### Code

```
map (<x: mul x 2>) [
  1
  2
  3
  4
  5
]..
```

---

### Example 41

#### Prompt
"Write Graffiticode that squares numbers from 1 to 5."

#### Chat Transcript

**User**: Write Graffiticode that squares numbers from 1 to 5.

#### Code

```
map (<x: mul x x>) range 1 6 1..
```

---

### Example 42

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
print map (<n: case n of
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
end>) range 10 110 10..
```

---

### Example 43

#### Prompt
"Write Graffiticode that squares every number in [1 2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that squares every number in [1 2 3 4].

#### Code

```
map (<x: mul x x>) [
  1
  2
  3
  4
]..
```

---

### Example 44

#### Prompt
"Write Graffiticode that subtracts 4 from -10."

#### Chat Transcript

**User**: Write Graffiticode that subtracts 4 from -10.

#### Code

```
sub -10 4..
```

---

### Example 45

#### Prompt
"create a minimal correct program"

#### Chat Transcript

**User**: create a minimal correct program

#### Code

```
42..
```

---

### Example 46

#### Prompt
"define a function and call it"

#### Chat Transcript

**User**: define a function and call it

#### Code

```
print mul 42 2..
```

---

### Example 47

#### Prompt
"Write Graffiticode that doubles every number in [1 2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that doubles every number in [1 2 3 4].

#### Code

```
map (<x: mul 2 x>) [
  1
  2
  3
  4
]..
```

---

### Example 48

#### Prompt
"Write Graffiticode that drops the first two elements of [1 2 3 4 5]."

#### Chat Transcript

**User**: Write Graffiticode that drops the first two elements of [1 2 3 4 5].

#### Code

```
drop
2
[
  1
  2
  3
  4
  5
]..
```

---

### Example 49

#### Prompt
"Write Graffiticode that returns the number 42."

#### Chat Transcript

**User**: Write Graffiticode that returns the number 42.

#### Code

```
42..
```

---

### Example 50

#### Prompt
"Write Graffiticode that reduces [1 2 3 4] using addition."

#### Chat Transcript

**User**: Write Graffiticode that reduces [1 2 3 4] using addition.

#### Code

```
reduce (<acc x: add acc x>) 0 [
  1
  2
  3
  4
]..
```

---

### Example 51

#### Prompt
"use parenthesis to call a higher order function"

#### Chat Transcript

**User**: use parenthesis to call a higher order function

#### Code

```
print map (<x: mul 2 x>) [
  1
  2
  3
  4
]..
```

---

### Example 52

#### Prompt
"Write Graffiticode that adds all numbers in the range from 1 to 10."

#### Chat Transcript

**User**: Write Graffiticode that adds all numbers in the range from 1 to 10.

#### Code

```
reduce (<acc x: add acc x>) 0 range 1 11 1..
```

---

### Example 53

#### Prompt
"Write Graffiticode that appends [4 5] to [1 2 3]."

#### Chat Transcript

**User**: Write Graffiticode that appends [4 5] to [1 2 3].

#### Code

```
concat [
  1
  2
  3
]
[
  4
  5
]..
```

---

### Example 54

#### Prompt
"write a program with a simple conditional expression"

#### Chat Transcript

**User**: write a program with a simple conditional expression

#### Code

```
print if gt 5 3 then
  "five is greater"
else
  "three is greater"..
```

---

### Example 55

#### Prompt
"Write Graffiticode that multiplies all numbers in [2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that multiplies all numbers in [2 3 4].

#### Code

```
reduce (<acc x: mul acc x>) 1 [
  2
  3
  4
]..
```

---

### Example 56

#### Prompt
"Write Graffiticode that returns the length of [1 2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that returns the length of [1 2 3 4].

#### Code

```
length
[
  1
  2
  3
  4
]..
```

---

### Example 57

#### Prompt
"Write Graffiticode that keeps only numbers greater than 5 in [3 5 7 9]."

#### Chat Transcript

**User**: Write Graffiticode that keeps only numbers greater than 5 in [3 5 7 9].

#### Code

```
filter (<x: gt x 5>) [
  3
  5
  7
  9
]..
```

---

### Example 58

#### Prompt
"Write Graffiticode that defines a function increment and uses it on 5."

#### Chat Transcript

**User**: Write Graffiticode that defines a function increment and uses it on 5.

#### Code

```
add 1 5..
```

---

### Example 59

#### Prompt
"Write Graffiticode that maps a lambda that squares numbers over [2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that maps a lambda that squares numbers over [2 3 4].

#### Code

```
map (<x: mul x x>) [
  2
  3
  4
]..
```

---

### Example 60

#### Prompt
"Write Graffiticode that returns the list [1 2 3]."

#### Chat Transcript

**User**: Write Graffiticode that returns the list [1 2 3].

#### Code

```
[
  1
  2
  3
]..
```

---

### Example 61

#### Prompt
"Write Graffiticode that defines a function double that multiplies a number by 2."

#### Chat Transcript

**User**: Write Graffiticode that defines a function double that multiplies a number by 2.

#### Code

```
true..
```

---

### Example 62

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
print tl [
  6
  8
  2
  9
  3
]..
```

---

### Example 63

#### Prompt
"Write Graffiticode that returns the tail of [5 6 7 8]."

#### Chat Transcript

**User**: Write Graffiticode that returns the tail of [5 6 7 8].

#### Code

```
tl [
  5
  6
  7
  8
]..
```

---

### Example 64

#### Prompt
"Write Graffiticode that defines a function square."

#### Chat Transcript

**User**: Write Graffiticode that defines a function square.

#### Code

```
mul 5 5..
```

---

### Example 65

#### Prompt
"Write Graffiticode that takes the first three elements of [1 2 3 4 5]."

#### Chat Transcript

**User**: Write Graffiticode that takes the first three elements of [1 2 3 4 5].

#### Code

```
take
3
[
  1
  2
  3
  4
  5
]..
```

---

### Example 66

#### Prompt
"Write Graffiticode that creates the list of numbers from 1 to 5 using range."

#### Chat Transcript

**User**: Write Graffiticode that creates the list of numbers from 1 to 5 using range.

#### Code

```
range 1 6 1..
```

---

### Example 67

#### Prompt
"Write Graffiticode that adds the number 1 to the front of [2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that adds the number 1 to the front of [2 3 4].

#### Code

```
cons 1 [
  2
  3
  4
]..
```

---

### Example 68

#### Prompt
"Write Graffiticode that defines a function sum3 that adds three numbers."

#### Chat Transcript

**User**: Write Graffiticode that defines a function sum3 that adds three numbers.

#### Code

```
sub 10 3..
```

---

### Example 69

#### Prompt
"Write Graffiticode that subtracts 3 from 10."

#### Chat Transcript

**User**: Write Graffiticode that subtracts 3 from 10.

#### Code

```
sub 10 3..
```

---

### Example 70

#### Prompt
"Write Graffiticode that computes the sum of 8 and the product of 2 and 5."

#### Chat Transcript

**User**: Write Graffiticode that computes the sum of 8 and the product of 2 and 5.

#### Code

```
add 8 mul 2 5..
```

---

### Example 71

#### Prompt
"Write Graffiticode that multiplies -3 by 8."

#### Chat Transcript

**User**: Write Graffiticode that multiplies -3 by 8.

#### Code

```
mul -3 8..
```

---

### Example 72

#### Prompt
"Write Graffiticode that adds 7 and 5."

#### Chat Transcript

**User**: Write Graffiticode that adds 7 and 5.

#### Code

```
12..
```

---

### Example 73

#### Prompt
"Write Graffiticode that adds the result of 4x5 to 6."

#### Chat Transcript

**User**: Write Graffiticode that adds the result of 4x5 to 6.

#### Code

```
add mul 4 5 6..
```

---

### Example 74

#### Prompt
"Write Graffiticode that defines a function that multiplies two numbers."

#### Chat Transcript

**User**: Write Graffiticode that defines a function that multiplies two numbers.

#### Code

```
mul 6 7..
```

---

### Example 75

#### Prompt
"Write Graffiticode that checks if the list [1 2 3] is empty."

#### Chat Transcript

**User**: Write Graffiticode that checks if the list [1 2 3] is empty.

#### Code

```
isempty [
  1
  2
  3
]..
```

---

### Example 76

#### Prompt
"Write Graffiticode that maps a lambda that doubles numbers over [3 6 9]."

#### Chat Transcript

**User**: Write Graffiticode that maps a lambda that doubles numbers over [3 6 9].

#### Code

```
map (<x: mul 2 x>) [
  3
  6
  9
]..
```

---

### Example 77

#### Prompt
"Write Graffiticode that returns the last element of [2 4 6 8]."

#### Chat Transcript

**User**: Write Graffiticode that returns the last element of [2 4 6 8].

#### Code

```
nth 3 [
  2
  4
  6
  8
]..
```

---

### Example 78

#### Prompt
"Write Graffiticode that adds 1 to every element of [5 6 7]."

#### Chat Transcript

**User**: Write Graffiticode that adds 1 to every element of [5 6 7].

#### Code

```
map (<x: add 1 x>) [
  5
  6
  7
]..
```

---

### Example 79

#### Prompt
"Write Graffiticode that computes 10 minus the product of 2 and 3."

#### Chat Transcript

**User**: Write Graffiticode that computes 10 minus the product of 2 and 3.

#### Code

```
sub 10 mul 2 3..
```

---

### Example 80

#### Prompt
"Write Graffiticode that returns the string "hello"."

#### Chat Transcript

**User**: Write Graffiticode that returns the string "hello".

#### Code

```
"hello"..
```

---

### Example 81

#### Prompt
"Write Graffiticode that returns the list [10 20 30 40]."

#### Chat Transcript

**User**: Write Graffiticode that returns the list [10 20 30 40].

#### Code

```
[
  10
  20
  30
  50
]..
```



