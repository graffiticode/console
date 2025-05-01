# Graffiticode Training Examples

## Language L0002

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
"compute fibinocci for 10

write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values"

### Chat Transcript

**Assistant**: ```graffiticode
| Function to calculate the nth Fibonacci number
let fib = <n:
  if eq n 0 then
    0
  else if eq n 1 then
    1
  else
    add (fib (sub n 1)) (fib (sub n 2))
>..


| Calculate the 10th Fibonacci number
let result = fib 10..

| Print the result
print result..
```

**User**: compute fibinocci for 10

**Assistant**: ```graffiticode
| Function to translate a number to its French name
let frenchNumber = <n:
  case n of
    0: "zéro"
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
  end
>..\n

| List of numbers to translate
let numbers = [1 3 5 7 9 11 8 6 4 2]..\n

| Map each number to its French name
let frenchNumbers = map (frenchNumber) numbers..\n

| Print the results
print frenchNumbers..
```

**User**: write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values

### Code

```
| Function to calculate the nth Fibonacci number
let fib = <n:
  if eq n 0 then
    0
  else if eq n 1 then
    1
  else
    add (fib (sub n 1)) (fib (sub n 2))
>..


| Calculate the 10th Fibonacci number
let result = fib 10..

| Print the result
print result..
```

---

### Prompt
"translate a list of french numbers between 1 and 10 into french"

### Chat Transcript

**User**: translate a list of french numbers between 1 and 10 into french

**Assistant**: The generated code creates a function that takes a number as input and returns its French name. It then applies this function to a list of numbers, creating a new list of their French translations. Finally, it prints out the resulting list of French number names.

### Code

```
| Function to translate a number to its French name
let frenchNumber = <n:
  case n of
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
  end
>..\n

| List of numbers to translate
let numbers = [1 2 3 4 5 6 7 8 9 10]..\n

| Map each number to its French name
let frenchNumbers = map (frenchNumber) numbers..\n

| Print the results
print frenchNumbers..
```

---

### Prompt
"translate a list of french numbers between 1 and 10 into french"

### Chat Transcript

**User**: translate a list of french numbers between 1 and 10 into french

**Assistant**: The generated code creates a function that takes a number as input and returns its French name. It then applies this function to a list of numbers, creating a new list of their French translations. Finally, it prints out the resulting list of French number names.

### Code

```
| Function to translate a number to its French name
let frenchNumber = <n:
  case n of
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
  end
>..\n

| List of numbers to translate
let numbers = [1 2 3 4 5 6 7 8 9 10]..

| Map each number to its French name
let frenchNumbers = map (frenchNumber) numbers..

| Print the results
print frenchNumbers..
```

---

### Prompt
"compute fibinocci for 10

write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values"

### Chat Transcript

**Assistant**: ```graffiticode
| Function to calculate the nth Fibonacci number
let fib = <n:
  if eq n 0 then
    0
  else if eq n 1 then
    1
  else
    add (fib (sub n 1)) (fib (sub n 2))
>..


| Calculate the 10th Fibonacci number
let result = fib 10..

| Print the result
print result..
```

**User**: compute fibinocci for 10

**Assistant**: ```graffiticode
| Function to translate a number to its French name
let frenchNumber = <n:
  case n of
    0: "zéro"
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
  end
>..\n

| List of numbers to translate
let numbers = [1 3 5 7 9 11 8 6 4 2]..\n

| Map each number to its French name
let frenchNumbers = map (frenchNumber) numbers..\n

| Print the results
print frenchNumbers..
```

**User**: write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values

### Code

```
| Function to translate a number to its French name
let frenchNumber = <n:
  case n of
    0: "zéro"
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
  end
>..

| List of numbers to translate
let numbers = [1 3 5 7 9 11 8 6 4 2]..

| Map each number to its French name
let frenchNumbers = map (frenchNumber) numbers..

| Print the results
print frenchNumbers..
```

