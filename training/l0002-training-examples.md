# Graffiticode Training Examples

## Language L0002

### Task
"write a program that computes the overtime payroll for a company with the following employee data: [ { name: "Alice", wage: 15, hours: 35 } { name: "Bob", wage: 20, hours: 50 } { name: "Charlie", wage: 18, hours: 40 } ]"

### Graffiticode
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

---

### Task
"use the function range to generate a list of number between 0 and 100 incremented by 10"

### Graffiticode
| Generate a list of numbers from 0 to 100 incremented by 10
let numbers = range 0 101 10..
print numbers..

---

### Task
"get the value of binding 'x' from and object that contains 'x'"

### Graffiticode
| Get the value of a binding (field) in a record
let obj = {x: 42 y: "hello"}..
print get "x" obj..

---

### Task
"write a program that prints hello world. make sure to delineate comment with the line comment token |"

### Graffiticode
let main = <: print "Hello, world!">..
main.."

---

### Task
"reduce a list of ten integers into the sum of their values"

### Graffiticode
| Define a list of 10 integers
let numbers = [5 12 8 23 1 9 18 7 4 11]..

| Use reduce to sum the values
| The lambda takes an accumulator and the current number 
| It returns the accumulator plus the current number
let sum = reduce (<acc num: add acc num>) 0 numbers..

| Print the final sum
print sum..

---

### Task
"write a program that computes the overtime payroll for a company with the following employee data: 
let employees = [
  { name: "Alice", wage: 15, hours: 35 }
  { name: "Bob", wage: 20, hours: 50 } 
  { name: "Charlie", wage: 18, hours: 40 }
].."

### Graffiticode
let add2 = <[a b]: add a b>..

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

---

### Task
"write a program that computes the overtime payroll for a company with the following employee data: [ { name: "Alice", wage: 15, hours: 35 } { name: "Bob", wage: 20, hours: 50 } { name: "Charlie", wage: 18, hours: 40 } ]"

### Graffiticode
| Function to calculate overtime pay for an employee
let overtimePay = <acc employee:
  let wage = get employee "wage"..
  let hours = get employee "hours"..
  let regularPay = mul wage (min hours 40)..
  let overtimeHours = max 0 (sub hours 40)..
  let overtimeRate = mul 1.5 wage..
  let overtimePay = mul overtimeHours overtimeRate..
  let name = get employee "name"..
  set acc name add regularPay overtimePay
>..

| Calculate overtime pay for each employee  
let payroll = reduce (overtimePay) {} [
  {name: "Alice" wage: 15 hours: 35}
  {name: "Bob" wage: 20 hours: 50}
  {name: "Charlie" wage: 18 hours: 40}  
]..

| Print the payroll
print payroll..

---

### Task
"use the builtin function filter to filter a list of even numbers between 0 and 100 so that only tenth value is remaining. print the result"

### Graffiticode
| Function to check if a number is a multiple of 10
let isMultipleOfTen = <x: eq mod x 10 0>..

| Generate a list of even numbers from 0 to 100
let evens = range 0 101 2..

| Filter the even numbers to only multiples of 10
let tens = filter (isMultipleOfTen) evens..

| Print the resulting list
print tens..

---

### Task
"add 3 to a list of ten integers and print the result"

### Graffiticode
| Generate a list of integers from 1 to 10
let numbers = range 1 10 1..

| Function to add 3 to a number 
let add3 = <x: add x 3>..

| Apply add3 to each number in the list
let result = map (add3) numbers..

| Print the resulting list
print result..

---

### Task
"print the message 'hello, world!'"

### Graffiticode
| print the message 'hello, world!'
print 'hello, world!'..

---

### Task
"write me a program that uses tags to represent the colors blue, red and green. use a case of expression to distinguish between those tags"

### Graffiticode
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

---

### Task
"create an record with field named foo to 10 and then set another field named bar to 20"

### Graffiticode
let obj = {foo: 10}..
set "bar" 20 obj..
..

---

### Task
"write fizzbuzz and print the result"

### Graffiticode
let fizzBuzz = <n:
  if eq 0 mod n 15 then "FizzBuzz"
  else if eq 0 mod n 3 then "Fizz"
  else if eq 0 mod n 5 then "Buzz"
  else n
>..
let numbers = range 1 101 1..
let result = map (fizzBuzz) numbers..
print result..

---

### Task
"use the builtin function filter to filter a list of even numbers between 0 and 100 so that only tenth value is remaining. print the result"

### Graffiticode
| Function to check if a number is a multiple of 10
let isMultipleOfTen = <x: eq mod x 10 0>..

| Generate a list of even numbers from 0 to 100
let evens = range 0 101 2..

| Filter the even numbers to only multiples of 10
let tens = filter (isMultipleOfTen) evens..

| Print the resulting list
print tens..

