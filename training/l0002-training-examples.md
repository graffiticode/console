# Graffiticode Training Examples

## Language L0002

### Prompt
"write a program that computes the overtime payroll for a company with the following employee data: [ { name: "Alice", wage: 15, hours: 35 } { name: "Bob", wage: 20, hours: 50 } { name: "Charlie", wage: 18, hours: 40 } ]"

### Code

```
| Function to calculate overtime pay for an employee
let overtimePay = <employee:
  let wage = get employee "wage"..
  let hours = get employee "hours"..
  let regularPay = mul wage (min hours 40)..
  let overtimeHours = max 0 (sub hours 40)..
  let overtimeRate = mul 1.5 wage..
  let overtimePay = mul overtimeHours overtimeRate..
  add regularPay overtimePay
>..

| Calculate overtime pay for each employee
let payroll = map (overtimePay) [
  {name: "Alice" wage: 15 hours: 35}
  {name: "Bob" wage: 20 hours: 50}
  {name: "Charlie" wage: 18 hours: 40}
]..

| Print the payroll
print payroll..
```

---

### Prompt
"write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values"

### Code

```
let fn = <x:
  case x of
    10: "ten"
    30: "thirty"
    _: "other"
  end
>..
print fn 10..
```

---

### Prompt
"get the head of a list of strings"

### Code

```
| Define a list of strings
let fruits = ["apple" "banana" "orange"]..

| Get the head (first element) of the list
let firstFruit = hd fruits..

| Print the first fruit
print firstFruit..
```

---

### Prompt
"use the function range to generate a list of number between 0 and 100 incremented by 10"

### Code

```
| Generate a list of numbers from 0 to 100 incremented by 10
let numbers = range 0 101 10..
print numbers..
```

---

### Prompt
"get the value of binding 'x' from and object that contains 'x'"

### Code

```
| Get the value of a binding (field) in a record
let obj = {x: 42 y: "hello"}..
print get "x" obj..
```

---

### Prompt
"write a program that prints hello world. make sure to delineate comment with the line comment token |"

### Code

```
| this is a comment.
print "hello, comment!"..
Everything after the end of program is a comment
and doesn't affect the code.
```

---

### Prompt
"reduce a list of ten integers into the sum of their values"

### Code

```
| Define a list of 10 integers
let numbers = [5 12 8 23 1 9 18 7 4 11]..

| Use reduce to sum the values
| The lambda takes an accumulator and the current number
| It returns the accumulator plus the current number
let sum = reduce (<acc num: add acc num>) 0 numbers..

| Print the final sum
print sum..
```

---

### Prompt
"write a program that computes the overtime payroll for a company with the following employee data:
let employees = [
  { name: "Alice", wage: 15, hours: 35 }
  { name: "Bob", wage: 20, hours: 50 }
  { name: "Charlie", wage: 18, hours: 40 }
].."

### Code

```
| Function to calculate an employee's pay including overtime
let calculatePay = <
  employee:
    let regularHours =
      if lt get employee "hours" 40
        then get employee "hours"
        else 40..
  let overtimeHours =
    if gt get employee "hours" 40
      then sub get employee "hours" 40
      else 0..
  let regularPay =
    mul get employee "wage" regularHours..
  let overtimePay =
    mul mul get employee "wage" 1.5 overtimeHours..
  add regularPay overtimePay
>..

let add2 = <[a b]: add a b>..

| Function to calculate total payroll for all employees
let calculatePayroll = <employees:
  let payAmounts = map (calculatePay) employees..
  reduce (add2) 0 payAmounts
>..

| Employee data
let employees = [
  { name: "Alice", wage: 15, hours: 35 }
  { name: "Bob", wage: 20, hours: 50 }
  { name: "Charlie", wage: 18, hours: 40 }
]..

| Calculate the total payroll
let totalPayroll = calculatePayroll employees..
print totalPayroll..
```

---

### Prompt
"write a program that computes the overtime payroll for a company with the following employee data: [ { name: "Alice", wage: 15, hours: 35 } { name: "Bob", wage: 20, hours: 50 } { name: "Charlie", wage: 18, hours: 40 } ]"

### Code

```
| Function to calculate overtime pay for an employee
let overtimePay = <acc employee:
  let wage = get employee "wage"..
  let hours = get employee "hours"..
  let regularPay = mul wage (min hours 40)..
  let overtimeHours = max 0 (sub hours 40)..
  let overtimeRate = mul 1.5 wage..
  let overtimePay = mul overtimeHours overtimeRate..
  let name = get employee "name"..
  let pay = add regularPay overtimePay..
  let total = get acc "total"..
  set (set acc name pay) "total" add total pay
>..

| Calculate overtime pay for each employee
let payroll = reduce (overtimePay) {total: 0} [
  {name: "Alice" wage: 15 hours: 35}
  {name: "Bob" wage: 20 hours: 50}
  {name: "Charlie" wage: 18 hours: 40}
]..

| Print the payroll
print payroll..
```

---

### Prompt
"get the tail of a list of integers"

### Code

```
| Define a list of integers
let numbers = [5 8 2 9 3]..  | Get the tail of the list (everything after the first element)
let tail = tl numbers..  | Print the resulting tail
print tail..
```

---

### Prompt
"write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values"

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
"use the builtin function filter to filter a list of even numbers between 0 and 100 so that only tenth value is remaining. print the result"

### Code

```
let add2 = <a b: add a b>..
print apply (add2) [10 21]..
```

---

### Prompt
"add 3 to a list of ten integers and print the result"

### Code

```
| Generate a list of integers from 1 to 10
let numbers = range 1 10 1..

| Function to add 3 to a number
let add3 = <x: add x 3>..

| Apply add3 to each number in the list
let result = map (add3) numbers..

| Print the resulting list
print result..
```

---

### Prompt
"write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values"

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
let numbers = [1 3 5 7 9 11 8 6 10 2]..

| Map each number to its French name
let frenchNumbers = map (frenchNumber) numbers..

| Print the results
print frenchNumbers..
```

---

### Prompt
"write a case expression that translates ten number values to their french names as strings. call it with a list of ten matching and non matching values"

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

---

### Prompt
"print the message 'hello, world!'"

### Code

```
| print the message 'hello, world!'
print 'hello, world!'..
```

---

### Prompt
"write me a program that uses tags to represent the colors blue, red and green. use a case of expression to distinguish between those tags"

### Code

```
| Function to get color name from tag
let colorName = <color:
  case color of
    Blue: "blue"
    Red: "red"
    Green: "green"
    _: "unknown"
  end
>..

| Example usage
let favoriteColor = Blue..
print `Your favorite color is ${colorName favoriteColor}.`..
```

---

### Prompt
"create an record with field named foo to 10 and then set another field named bar to 20"

### Code

```
let obj = {foo: 10}..
set "bar" 20 obj..
..
```

---

### Prompt
"write fizzbuzz and print the result"

### Code

```
let fizzBuzz = <n:
  if eq 0 mod n 15 then "FizzBuzz"
  else if eq 0 mod n 3 then "Fizz"
  else if eq 0 mod n 5 then "Buzz"
  else n
>..
let numbers = range 1 101 1..
let result = map (fizzBuzz) numbers..
print result..
```

---

### Prompt
"use the builtin function filter to filter a list of even numbers between 0 and 100 so that only tenth value is remaining. print the result"

### Code

```
| Function to check if a number is a multiple of 10
let isMultipleOfTen = <x: eq mod x 10 0>..

| Generate a list of even numbers from 0 to 100
let evens = range 0 101 2..

| Filter the even numbers to only multiples of 10
let tens = filter (isMultipleOfTen) evens..

| Print the resulting list
print tens..
```

