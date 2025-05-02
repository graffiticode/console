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

