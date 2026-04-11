# Graffiticode Training Examples

*Downloaded on 2026-03-20T22:57:46.727Z*

## Language L0002

### Example 1

#### Prompt
"Checks if 3 is less than or equal to 8"

#### Chat Transcript

**User**: Checks if 3 is less than or equal to 8

#### Code

```
le 3 8..
```

---

### Example 2

#### Prompt
"Adds 3, 4, and 5 together."

#### Chat Transcript

**User**: Adds 3, 4, and 5 together.

#### Code

```
add 3 (add 4 5)..
```

---

### Example 3

#### Prompt
"Write Graffiticode that doubles numbers in [1 2 3 4] and then sums them."

#### Chat Transcript

**User**: Write Graffiticode that doubles numbers in [1 2 3 4] and then sums them.

#### Code

```
reduce (<acc x: add acc x>) 0 map (<x: mul 2 x>) [
  1
  2
  3
  4
]..
```

---

### Example 4

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

### Example 5

#### Prompt
"Write Graffiticode that defines a function addOne."

#### Chat Transcript

**User**: Write Graffiticode that defines a function addOne.

#### Code

```
add 1 42..
```

---

### Example 6

#### Prompt
"concatenates [1 2 3] and [4 5] into a single list."

#### Chat Transcript

**User**: concatenates [1 2 3] and [4 5] into a single list.

#### Code

```
concat [
  1
  2
  3
] [
  4
  5
]..
```

---

### Example 7

#### Prompt
"Defines three tags small, medium, and large, binds one to a variable, and uses case to return a number for each.

Defines three tags small, medium, and large, binds one to a variable, and uses case to return a number for each."

#### Chat Transcript

**User**: Defines three tags small, medium, and large, binds one to a variable, and uses case to return a number for each.

**User**: Defines three tags small, medium, and large, binds one to a variable, and uses case to return a number for each.

#### Code

```
case tag medium of
  tag small: 1
  tag medium: 2
  tag large: 3
  tag _: 0
end..
```

---

### Example 8

#### Prompt
"Write Graffiticode that filters numbers greater than 10 from [5 12 7 20]."

#### Chat Transcript

**User**: Write Graffiticode that filters numbers greater than 10 from [5 12 7 20].

#### Code

```
filter (<x: gt x 10>) [
  5
  12
  7
  20
]..
```

---

### Example 9

#### Prompt
"Defines two tags and uses equiv to check if they are the same."

#### Chat Transcript

**User**: Defines two tags and uses equiv to check if they are the same.

#### Code

```
equiv tag red tag blue..
```

---

### Example 10

#### Prompt
"Write Graffiticode that creates the list of numbers from 0 to 10 with step 2."

#### Chat Transcript

**User**: Write Graffiticode that creates the list of numbers from 0 to 10 with step 2.

#### Code

```
range 0 11 2..
```

---

### Example 11

#### Prompt
"Returns the last element of [10 20 30]"

#### Chat Transcript

**User**: Returns the last element of [10 20 30]

#### Code

```
last [
  10
  20
  30
]..
```

---

### Example 12

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

### Example 13

#### Prompt
"defines a function double, maps it over [1 2 3 4], and sums the result."

#### Chat Transcript

**User**: defines a function double, maps it over [1 2 3 4], and sums the result.

#### Code

```
reduce (<acc x: add acc x>) 0 map (<x: mul x 2>) [
  1
  2
  3
  4
]..
```

---

### Example 14

#### Prompt
"Write Graffiticode that adds 100 and -5."

#### Chat Transcript

**User**: Write Graffiticode that adds 100 and -5.

#### Code

```
95..
```

---

### Example 15

#### Prompt
"write code that checks if the list [] is empty"

#### Chat Transcript

**User**: write code that checks if the list [] is empty

#### Code

```
isempty []..
```

---

### Example 16

#### Prompt
"squares numbers and then sums them."

#### Chat Transcript

**User**: squares numbers and then sums them.

#### Code

```
reduce (<acc x: add acc x>) 0 map (<x: mul x x>) [
  1
  2
  3
  4
  5
]..
```

---

### Example 17

#### Prompt
"Write Graffiticode that reduces [2 3 4] using multiplication."

#### Chat Transcript

**User**: Write Graffiticode that reduces [2 3 4] using multiplication.

#### Code

```
reduce (<acc x: mul acc x>) 1 [
  2
  3
  4
]..
```

---

### Example 18

#### Prompt
"sums numbers in a list using reduce and a lambda."

#### Chat Transcript

**User**: sums numbers in a list using reduce and a lambda.

#### Code

```
reduce (<acc x: add acc x>) 0 [
  1
  2
  3
  4
  5
]..
```

---

### Example 19

#### Prompt
"Multiplies 2 by the sum of 3 and 4."

#### Chat Transcript

**User**: Multiplies 2 by the sum of 3 and 4.

#### Code

```
mul
2
(7)..
```

---

### Example 20

#### Prompt
"Write Graffiticode that filters even numbers from the range 1 to 10."

#### Chat Transcript

**User**: Write Graffiticode that filters even numbers from the range 1 to 10.

#### Code

```
filter (<x: eq 0 (mod x 2)>) range 1 11 1..
```

---

### Example 21

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

### Example 22

#### Prompt
"Write Graffiticode that doubles numbers from 1 to 10."

#### Chat Transcript

**User**: Write Graffiticode that doubles numbers from 1 to 10.

#### Code

```
map (<x: mul 2 x>) range 1 11 1..
```

---

### Example 23

#### Prompt
"counts how many numbers in [1 2 3 4 5] are even."

#### Chat Transcript

**User**: counts how many numbers in [1 2 3 4 5] are even.

#### Code

```
reduce (<acc x: if eq 0 (mod x 2) then
  add acc 1
else
  acc>) 0 [
  1
  2
  3
  4
  5
]..
```

---

### Example 24

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

### Example 25

#### Prompt
"Write Graffiticode that creates the list from 5 to 20 with step 5."

#### Chat Transcript

**User**: Write Graffiticode that creates the list from 5 to 20 with step 5.

#### Code

```
range 5 25 5..
```

---

### Example 26

#### Prompt
"Write Graffiticode that sums numbers in [1 2 3 4 5] using reduce."

#### Chat Transcript

**User**: Write Graffiticode that sums numbers in [1 2 3 4 5] using reduce.

#### Code

```
reduce (<acc x: add acc x>) 0 [
  1
  2
  3
  4
  5
]..
```

---

### Example 27

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

### Example 28

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

### Example 29

#### Prompt
"Write Graffiticode that counts the number of elements in [5 6 7 8]."

#### Chat Transcript

**User**: Write Graffiticode that counts the number of elements in [5 6 7 8].

#### Code

```
/* LEN */..
```

---

### Example 30

#### Prompt
"triples the number 7."

#### Chat Transcript

**User**: triples the number 7.

#### Code

```
mul 3 7..
```

---

### Example 31

#### Prompt
"Multiplies 6 by 4."

#### Chat Transcript

**User**: Multiplies 6 by 4.

#### Code

```
mul 6 4..
```

---

### Example 32

#### Prompt
"returns the third number from range 1 10 1."

#### Chat Transcript

**User**: returns the third number from range 1 10 1.

#### Code

```
nth 2 range 1 10 1..
```

---

### Example 33

#### Prompt
"Prepends the number 0 to the list [1 2 3]"

#### Chat Transcript

**User**: Prepends the number 0 to the list [1 2 3]

#### Code

```
[
  0
  1
  2
  3
]..
```

---

### Example 34

#### Prompt
"Appends the number 4 to the list [1 2 3] using append."

#### Chat Transcript

**User**: Appends the number 4 to the list [1 2 3] using append.

#### Code

```
append 4 [
  1
  2
  3
]..
```

---

### Example 35

#### Prompt
"defines a tag value red using the tag keyword."

#### Chat Transcript

**User**: defines a tag value red using the tag keyword.

#### Code

```
tag red..
```

---

### Example 36

#### Prompt
"Takes the first three elements of [1 2 3 4 5]"

#### Chat Transcript

**User**: Takes the first three elements of [1 2 3 4 5]

#### Code

```
take 3 [
  1
  2
  3
  4
  5
]..
```

---

### Example 37

#### Prompt
"drops the first three numbers from range 1 10 1."

#### Chat Transcript

**User**: drops the first three numbers from range 1 10 1.

#### Code

```
drop 3 range 1 11 1..
```

---

### Example 38

#### Prompt
"Write Graffiticode that matches a list and returns the head."

#### Chat Transcript

**User**: Write Graffiticode that matches a list and returns the head.

#### Code

```
/* ERROR: "Syntax Error" */
```

---

### Example 39

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

### Example 40

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

### Example 41

#### Prompt
"Checks if 3 is not equal to 7"

#### Chat Transcript

**User**: Checks if 3 is not equal to 7

#### Code

```
if ne 3 7 then
  "3 is not equal to 7"
else
  "3 is equal to 7"..
```

---

### Example 42

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

### Example 43

#### Prompt
"Concatenates the strings "hello " and "world""

#### Chat Transcript

**User**: Concatenates the strings "hello " and "world"

#### Code

```
concat "hello " "world"..
```

---

### Example 44

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

### Example 45

#### Prompt
"doubles numbers in [1 2 3 4] and keeps only those greater than 5."

#### Chat Transcript

**User**: doubles numbers in [1 2 3 4] and keeps only those greater than 5.

#### Code

```
filter (<x: gt x 5>) map (<x: mul 2 x>) [
  1
  2
  3
  4
]..
```

---

### Example 46

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

### Example 47

#### Prompt
"Write Graffiticode that adds the elements of a pair (3, 7)."

#### Chat Transcript

**User**: Write Graffiticode that adds the elements of a pair (3, 7).

#### Code

```
add 3 7..
```

---

### Example 48

#### Prompt
"Checks if 5 equals 5 using eq."

#### Chat Transcript

**User**: Checks if 5 equals 5 using eq.

#### Code

```
if eq 5 5 then
  "5 equals 5"
else
  "5 does not equal 5"..
```

---

### Example 49

#### Prompt
"Computes 2 raised to the power of 10 using pow.

Computes 2 raised to the power of 10 using pow."

#### Chat Transcript

**User**: Computes 2 raised to the power of 10 using pow.

**User**: Computes 2 raised to the power of 10 using pow.

#### Code

```
pow 2 10..
```

---

### Example 50

#### Prompt
"doubles the number 9."

#### Chat Transcript

**User**: doubles the number 9.

#### Code

```
mul 2 9..
```

---

### Example 51

#### Prompt
"Write Graffiticode that defines a function that adds two numbers."

#### Chat Transcript

**User**: Write Graffiticode that defines a function that adds two numbers.

#### Code

```
add 1 2..
```

---

### Example 52

#### Prompt
"Defines tags yes and no and uses case to return true for yes and false for no."

#### Chat Transcript

**User**: Defines tags yes and no and uses case to return true for yes and false for no.

#### Code

```
case tag yes of
  tag yes: true
  tag no: false
end..
```

---

### Example 53

#### Prompt
"finds the largest number in [3 9 2 7]."

#### Chat Transcript

**User**: finds the largest number in [3 9 2 7].

#### Code

```
reduce (<acc x: if gt x acc then
  x
else
  acc>) 0 [
  3
  9
  2
  7
]..
```

---

### Example 54

#### Prompt
"Write Graffiticode that squares numbers from 1 to 10 and filters even results."

#### Chat Transcript

**User**: Write Graffiticode that squares numbers from 1 to 10 and filters even results.

#### Code

```
filter (<x: eq 0 (mod x 2)>) map (<x: mul x x>) range 1 11 1..
```

---

### Example 55

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

### Example 56

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

### Example 57

#### Prompt
"Write Graffiticode that multiplies the result of 2+3 by 4."

#### Chat Transcript

**User**: Write Graffiticode that multiplies the result of 2+3 by 4.

#### Code

```
mul 5 4..
```

---

### Example 58

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

### Example 59

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

### Example 60

#### Prompt
"Write Graffiticode that multiplies three numbers: 2, 3, and 4."

#### Chat Transcript

**User**: Write Graffiticode that multiplies three numbers: 2, 3, and 4.

#### Code

```
mul 2 mul 3 4..
```

---

### Example 61

#### Prompt
"Filters numbers equal to 3 from [1 2 3 3 4]"

#### Chat Transcript

**User**: Filters numbers equal to 3 from [1 2 3 3 4]

#### Code

```
filter (<x: eq x 3>) [
  1
  2
  3
  3
  4
]..
```

---

### Example 62

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

### Example 63

#### Prompt
"Write Graffiticode that adds three numbers: 1, 2, and 3."

#### Chat Transcript

**User**: Write Graffiticode that adds three numbers: 1, 2, and 3.

#### Code

```
6..
```

---

### Example 64

#### Prompt
"create a program with a let definition and an expression that calls the let definition"

#### Chat Transcript

**User**: create a program with a let definition and an expression that calls the let definition

#### Code

```
42..
```

---

### Example 65

#### Prompt
"Checks if 10 is greater than 4"

#### Chat Transcript

**User**: Checks if 10 is greater than 4

#### Code

```
if gt 10 4 then
  "Yes, 10 is greater than 4"
else
  "No, 10 is not greater than 4"..
```

---

### Example 66

#### Prompt
"squares the number 6."

#### Chat Transcript

**User**: squares the number 6.

#### Code

```
mul 6 6..
```

---

### Example 67

#### Prompt
"computes the remainder when 17 is divided by 5."

#### Chat Transcript

**User**: computes the remainder when 17 is divided by 5.

#### Code

```
mod 17 5..
```

---

### Example 68

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

### Example 69

#### Prompt
"Parses the string '{"x": 1}' using json."

#### Chat Transcript

**User**: Parses the string '{"x": 1}' using json.

#### Code

```
json "{\"x\": 1}"..
```

---

### Example 70

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

### Example 71

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

### Example 72

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

### Example 73

#### Prompt
"Write Graffiticode that squares numbers from 1 to 5."

#### Chat Transcript

**User**: Write Graffiticode that squares numbers from 1 to 5.

#### Code

```
map (<x: mul x x>) range 1 6 1..
```

---

### Example 74

#### Prompt
"Returns the length of the string "hello""

#### Chat Transcript

**User**: Returns the length of the string "hello"

#### Code

```
length "hello"..
```

---

### Example 75

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

### Example 76

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

### Example 77

#### Prompt
"creates numbers 1 to 10 and sums them."

#### Chat Transcript

**User**: creates numbers 1 to 10 and sums them.

#### Code

```
reduce (<acc x: add acc x>) 0 range 1 11 1..
```

---

### Example 78

#### Prompt
"Squares a number"

#### Chat Transcript

**User**: Squares a number

#### Code

```
pow 42 2..
```

---

### Example 79

#### Prompt
"defines two tags red and blue and binds red to a variable color."

#### Chat Transcript

**User**: defines two tags red and blue and binds red to a variable color.

#### Code

```
case tag red of
  tag red: "warm"
  tag blue: "cool"
end..
```

---

### Example 80

#### Prompt
"adds the first and last numbers of [2 4 6 8]."

#### Chat Transcript

**User**: adds the first and last numbers of [2 4 6 8].

#### Code

```
add (hd [
  2
  4
  6
  8
]) (last [
  2
  4
  6
  8
])..
```

---

### Example 81

#### Prompt
"Filters numbers equal to 3 from [1 2 3 3 4] using eq."

#### Chat Transcript

**User**: Filters numbers equal to 3 from [1 2 3 3 4] using eq.

#### Code

```
filter (<x: eq x 3>) [
  1
  2
  3
  3
  4
]..
```

---

### Example 82

#### Prompt
"multiplies the first two numbers of [3 5 7]."

#### Chat Transcript

**User**: multiplies the first two numbers of [3 5 7].

#### Code

```
mul (hd [
  3
  5
  7
]) (nth 1 [
  3
  5
  7
])..
```

---

### Example 83

#### Prompt
"takes the first three numbers from range 1 10 1."

#### Chat Transcript

**User**: takes the first three numbers from range 1 10 1.

#### Code

```
take 3 range 1 10 1..
```

---

### Example 84

#### Prompt
"Write Graffiticode that subtracts 4 from -10."

#### Chat Transcript

**User**: Write Graffiticode that subtracts 4 from -10.

#### Code

```
sub -10 4..
```

---

### Example 85

#### Prompt
"create a minimal correct program"

#### Chat Transcript

**User**: create a minimal correct program

#### Code

```
42..
```

---

### Example 86

#### Prompt
"finds the smallest number in [3 9 2 7]."

#### Chat Transcript

**User**: finds the smallest number in [3 9 2 7].

#### Code

```
reduce (<acc x: if lt x acc then
  x
else
  acc>) (hd [
  3
  9
  2
  7
]) (tl [
  3
  9
  2
  7
])..
```

---

### Example 87

#### Prompt
"define a function and call it"

#### Chat Transcript

**User**: define a function and call it

#### Code

```
print mul 42 2..
```

---

### Example 88

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

### Example 89

#### Prompt
"drops the first two elements of [1 2 3 4 5]."

#### Chat Transcript

**User**: drops the first two elements of [1 2 3 4 5].

#### Code

```
drop 2 [
  1
  2
  3
  4
  5
]..
```

---

### Example 90

#### Prompt
"Returns the number 42."

#### Chat Transcript

**User**: Returns the number 42.

#### Code

```
42..
```

---

### Example 91

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

### Example 92

#### Prompt
"Checks if 2 is less than 9"

#### Chat Transcript

**User**: Checks if 2 is less than 9

#### Code

```
if lt 2 9 then
  "Yes, 2 is less than 9"
else
  "No, 2 is not less than 9"..
```

---

### Example 93

#### Prompt
"Drops the first two elements of [1 2 3 4 5]"

#### Chat Transcript

**User**: Drops the first two elements of [1 2 3 4 5]

#### Code

```
drop 2 [
  1
  2
  3
  4
  5
]..
```

---

### Example 94

#### Prompt
"Concatenates two lists [1 2] and [3 4]"

#### Chat Transcript

**User**: Concatenates two lists [1 2] and [3 4]

#### Code

```
concat [
  1
  2
] [
  3
  4
]..
```

---

### Example 95

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

### Example 96

#### Prompt
"Write Graffiticode that adds all numbers in the range from 1 to 10."

#### Chat Transcript

**User**: Write Graffiticode that adds all numbers in the range from 1 to 10.

#### Code

```
reduce (<acc x: add acc x>) 0 range 1 11 1..
```

---

### Example 97

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
] [
  4
  5
]..
```

---

### Example 98

#### Prompt
"Defines two tags and puts them in a list."

#### Chat Transcript

**User**: Defines two tags and puts them in a list.

#### Code

```
[
  tag red
  tag blue
]..
```

---

### Example 99

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

### Example 100

#### Prompt
"Checks if 5 is greater than or equal to 5"

#### Chat Transcript

**User**: Checks if 5 is greater than or equal to 5

#### Code

```
ge 5 5..
```

---

### Example 101

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

### Example 102

#### Prompt
"Write Graffiticode that returns the length of [1 2 3 4]."

#### Chat Transcript

**User**: Write Graffiticode that returns the length of [1 2 3 4].

#### Code

```
length [
  1
  2
  3
  4
]..
```

---

### Example 103

#### Prompt
"Squares a number using pow."

#### Chat Transcript

**User**: Squares a number using pow.

#### Code

```
pow 42 2..
```

---

### Example 104

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

### Example 105

#### Prompt
"creates numbers 1 to 10 and doubles them."

#### Chat Transcript

**User**: creates numbers 1 to 10 and doubles them.

#### Code

```
map (<x: mul 2 x>) range 1 11 1..
```

---

### Example 106

#### Prompt
"Write Graffiticode that defines a function increment and uses it on 5."

#### Chat Transcript

**User**: Write Graffiticode that defines a function increment and uses it on 5.

#### Code

```
add 1 5..
```

---

### Example 107

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

### Example 108

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

### Example 109

#### Prompt
"Write Graffiticode that defines a function double that multiplies a number by 2."

#### Chat Transcript

**User**: Write Graffiticode that defines a function double that multiplies a number by 2.

#### Code

```
true..
```

---

### Example 110

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

### Example 111

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

### Example 112

#### Prompt
"Write Graffiticode that defines a function square."

#### Chat Transcript

**User**: Write Graffiticode that defines a function square.

#### Code

```
mul 5 5..
```

---

### Example 113

#### Prompt
"takes the first three elements of [1 2 3 4 5]."

#### Chat Transcript

**User**: takes the first three elements of [1 2 3 4 5].

#### Code

```
take 3 [
  1
  2
  3
  4
  5
]..
```

---

### Example 114

#### Prompt
"Defines tags on and off, binds one to a variable, and matches it with a wildcard fallback returning "unknown"."

#### Chat Transcript

**User**: Defines tags on and off, binds one to a variable, and matches it with a wildcard fallback returning "unknown".

#### Code

```
case tag x of
  tag a: "a"
  tag _: "x"
end..
```

---

### Example 115

#### Prompt
"Write Graffiticode that matches the number 1 and returns "one"."

#### Chat Transcript

**User**: Write Graffiticode that matches the number 1 and returns "one".

#### Code

```
case 1 of
  1: "one"
  tag _: "unknown"
end..
```

---

### Example 116

#### Prompt
"Defines a tag red and uses equiv to compare it to itself."

#### Chat Transcript

**User**: Defines a tag red and uses equiv to compare it to itself.

#### Code

```
equiv tag red tag red..
```

---

### Example 117

#### Prompt
"Write Graffiticode that creates the list of numbers from 1 to 5 using range."

#### Chat Transcript

**User**: Write Graffiticode that creates the list of numbers from 1 to 5 using range.

#### Code

```
range 1 6 1..
```

---

### Example 118

#### Prompt
"Filters numbers greater than 5 from [2 4 6 8 10]"

#### Chat Transcript

**User**: Filters numbers greater than 5 from [2 4 6 8 10]

#### Code

```
filter (<x: gt x 5>) [
  2
  4
  6
  8
  10
]..
```

---

### Example 119

#### Prompt
"Returns the length of [5 6 7 8 9]"

#### Chat Transcript

**User**: Returns the length of [5 6 7 8 9]

#### Code

```
length [
  5
  6
  7
  8
  9
]..
```

---

### Example 120

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

### Example 121

#### Prompt
"Write Graffiticode that defines a function sum3 that adds three numbers."

#### Chat Transcript

**User**: Write Graffiticode that defines a function sum3 that adds three numbers.

#### Code

```
sub 10 3..
```

---

### Example 122

#### Prompt
"Subtracts 3 from 10."

#### Chat Transcript

**User**: Subtracts 3 from 10.

#### Code

```
sub 10 3..
```

---

### Example 123

#### Prompt
"computes the sum of 8 and the product of 2 and 5."

#### Chat Transcript

**User**: computes the sum of 8 and the product of 2 and 5.

#### Code

```
add 8 mul 2 5..
```

---

### Example 124

#### Prompt
"sums the even numbers in [1 2 3 4 5 6]."

#### Chat Transcript

**User**: sums the even numbers in [1 2 3 4 5 6].

#### Code

```
reduce (<acc x: add acc x>) 0 (filter (<x: eq 0 (mod x 2)>) [
  1
  2
  3
  4
  5
  6
])..
```

---

### Example 125

#### Prompt
"Write Graffiticode that multiplies -3 by 8."

#### Chat Transcript

**User**: Write Graffiticode that multiplies -3 by 8.

#### Code

```
mul -3 8..
```

---

### Example 126

#### Prompt
"Adds 7 and 5."

#### Chat Transcript

**User**: Adds 7 and 5.

#### Code

```
add 7 5..
```

---

### Example 127

#### Prompt
"Concatenates the strings "hello " and "world" using concat."

#### Chat Transcript

**User**: Concatenates the strings "hello " and "world" using concat.

#### Code

```
concat "hello " "world"..
```

---

### Example 128

#### Prompt
"Defines tags red and blue, then uses case to return "warm" for red and "cool" for blue."

#### Chat Transcript

**User**: Defines tags red and blue, then uses case to return "warm" for red and "cool" for blue.

#### Code

```
case tag red of
  tag red: "warm"
  tag blue: "cool"
end..
```

---

### Example 129

#### Prompt
"Computes 2 raised to the power of 10"

#### Chat Transcript

**User**: Computes 2 raised to the power of 10

#### Code

```
pow 2 10..
```

---

### Example 130

#### Prompt
"Write Graffiticode that adds the result of 4x5 to 6."

#### Chat Transcript

**User**: Write Graffiticode that adds the result of 4x5 to 6.

#### Code

```
add mul 4 5 6..
```

---

### Example 131

#### Prompt
"Write Graffiticode that defines a function that multiplies two numbers."

#### Chat Transcript

**User**: Write Graffiticode that defines a function that multiplies two numbers.

#### Code

```
mul 6 7..
```

---

### Example 132

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

### Example 133

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

### Example 134

#### Prompt
"Defines tags cat and dog, creates a list of them, and maps a lambda that uses case to convert each to a string."

#### Chat Transcript

**User**: Defines tags cat and dog, creates a list of them, and maps a lambda that uses case to convert each to a string.

#### Code

```
map (<a: case a of
  tag cat: "cat"
  tag dog: "dog"
  tag _: "unknown"
end>) [
  tag cat
  tag dog
  tag cat
  tag dog
]..
```

---

### Example 135

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

### Example 136

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

### Example 137

#### Prompt
"Write Graffiticode that matches numbers 1, 2, or anything else and returns a string."

#### Chat Transcript

**User**: Write Graffiticode that matches numbers 1, 2, or anything else and returns a string.

#### Code

```
case 2 of
  1: "one"
  2: "two"
  tag _: "something else"
end..
```

---

### Example 138

#### Prompt
"computes 10 minus the product of 2 and 3."

#### Chat Transcript

**User**: computes 10 minus the product of 2 and 3.

#### Code

```
sub 10 mul 2 3..
```

---

### Example 139

#### Prompt
"Returns the string "hello"."

#### Chat Transcript

**User**: Returns the string "hello".

#### Code

```
"hello"..
```

---

### Example 140

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



