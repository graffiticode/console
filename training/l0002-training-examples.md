# Graffiticode Training Examples

*Downloaded on 2025-09-02T16:48:38.720Z*

## Language L0002

### Example 1

#### Prompt
"use the builtin function filter to filter a list of even numbers between 0 and 100 so that only tenth value is remaining. print the result"

#### Chat Transcript

**Assistant**: ```graffiticode
| Function to check if a number is a multiple of 10
let isMultipleOfTen = <x: eq mod x 10 0>..

| Generate a list of even numbers from 0 to 100
let evens = range 0 101 2..

| Filter the even numbers to only multiples of 10
let tens = filter (isMultipleOfTen) evens..

| Print the resulting list
print tens..
```

**User**: use the builtin function filter to filter a list of even numbers between 0 and 100 so that only tenth value is remaining. print the result

#### Code

```
let add2 = <a b: add a b>..
print apply (add2) [10 21]..
```



