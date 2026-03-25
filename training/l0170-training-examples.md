# Graffiticode Training Examples

*Downloaded on 2026-03-25T15:39:29.317Z*

## Language L0170

### Example 1

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos" and filters rows where completed equals true."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos" and filters rows where completed equals true.

#### Code

```
filter {
  "completed": true
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 2

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where name starts with "C"."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where name starts with "C".

#### Code

```
filter {
  "name": {
    "startsWith": "C"
  }
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 3

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and sorts by sepal_length ascending."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and sorts by sepal_length ascending.

#### Code

```
sort "sepal_length" fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 4

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a totalValue field by multiplying price and stock, rounded to 2 decimal places."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a totalValue field by multiplying price and stock, rounded to 2 decimal places.

#### Code

```
mutate {
  totalValue: {
    mul: [
      "price"
      "stock"
    ]
    dp: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 5

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing average petal_width."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing average petal_width.

#### Code

```
group {
  avg: "petal_width"
  by: "species"
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 6

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and sorts by rating descending."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and sorts by rating descending.

#### Code

```
sort {
  field: "rating"
  order: "desc"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 7

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category summing price as totalPrice."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category summing price as totalPrice.

#### Code

```
group {
  sum: {
    as: "totalPrice"
    field: "price"
  }
  by: "category"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 8

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments" and filters rows where email ends with ".biz"."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments" and filters rows where email ends with ".biz".

#### Code

```
filter {
  "email": {
    "endsWith": ".biz"
  }
} fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 9

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a sepal_area field by multiplying sepal_length and sepal_width, rounded to 2 decimal places."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a sepal_area field by multiplying sepal_length and sepal_width, rounded to 2 decimal places.

#### Code

```
mutate {
  sepal_area: {
    dp: 2
    mul: [
      "sepal_length"
      "sepal_width"
    ]
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 10

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category summing stock as totalStock."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category summing stock as totalStock.

#### Code

```
group {
  by: "category"
  sum: {
    field: "stock"
    as: "totalStock"
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 11

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where address.city equals "Gwenborough"."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where address.city equals "Gwenborough".

#### Code

```
filter {
  "address.city": {
    "eq": "Gwenborough"
  }
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 12

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and selects address.city and address.zipcode."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and selects address.city and address.zipcode.

#### Code

```
select [
  "address.city"
  "address.zipcode"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 13

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing average sepal_length rounded to 2 decimal places."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing average sepal_length rounded to 2 decimal places.

#### Code

```
group {
  by: "species"
  avg: {
    dp: 2
    as: "sepal_length_avg"
    field: "sepal_length"
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 14

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos" and groups by userId counting rows as totalTodos."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos" and groups by userId counting rows as totalTodos.

#### Code

```
group {
  count: "totalTodos"
  by: "userId"
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 15

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and selects company.name and name."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and selects company.name and name.

#### Code

```
select [
  "name"
  {
    from: "company.name"
    to: "company_name"
  }
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 16

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and sorts by username."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and sorts by username.

#### Code

```
sort {
  field: "username"
  order: "asc"
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 17

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and adds a contact field by concatenating name, " (", phone, and ")"."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and adds a contact field by concatenating name, " (", phone, and ")".

#### Code

```
mutate {
  contact: {
    concat: [
      "name"
      " ("
      "phone"
      ")"
    ]
  }
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 18

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where price is less than 50."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where price is less than 50.

#### Code

```
filter {
  "price": {
    "lt": 50
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 19

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing min and max of sepal_length."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing min and max of sepal_length.

#### Code

```
group {
  max: {
    as: "sepal_length_msx"
    field: "sepal_length"
  }
  min: {
    as: "sepal_length_min"
    field: "sepal_length"
  }
  by: "species"
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 20

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where rating is greater than 4 and category equals "smartphones"."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where rating is greater than 4 and category equals "smartphones".

#### Code

```
filter {
  "category": "smartphones"
} filter {
  "rating": {
    "gt": 4
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 21

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos" and takes the last 10 items."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos" and takes the last 10 items.

#### Code

```
take {
  last: 10
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 22

#### Prompt
"Fetch post data from "https://jsonplaceholder.typicode.com/posts"."

#### Chat Transcript

**User**: Fetch post data from "https://jsonplaceholder.typicode.com/posts".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 23

#### Prompt
"Fetch comment data from "https://jsonplaceholder.typicode.com/comments"."

#### Chat Transcript

**User**: Fetch comment data from "https://jsonplaceholder.typicode.com/comments".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 24

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and sorts by petal_length descending."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and sorts by petal_length descending.

#### Code

```
sort {
  order: "desc"
  field: "petal_length"
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 25

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments" and selects only the email field."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments" and selects only the email field.

#### Code

```
select [
  "email"
] fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 26

#### Prompt
"Fetch posts from "https://jsonplaceholder.typicode.com/posts" and groups by userId counting rows as postCount."

#### Chat Transcript

**User**: Fetch posts from "https://jsonplaceholder.typicode.com/posts" and groups by userId counting rows as postCount.

#### Code

```
group {
  count: "postCount"
  by: "userId"
} fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 27

#### Prompt
"Fetch posts from "https://jsonplaceholder.typicode.com/posts" and takes the last 3 items."

#### Chat Transcript

**User**: Fetch posts from "https://jsonplaceholder.typicode.com/posts" and takes the last 3 items.

#### Code

```
take {
  last: 3
} fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 28

#### Prompt
"Fetch posts from "https://jsonplaceholder.typicode.com/posts" and sorts by title ascending."

#### Chat Transcript

**User**: Fetch posts from "https://jsonplaceholder.typicode.com/posts" and sorts by title ascending.

#### Code

```
sort {
  order: "asc"
  field: "title"
} fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 29

#### Prompt
"Fetch JSON data from "https://jsonplaceholder.typicode.com/users".

Fetch CSV data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"."

#### Chat Transcript

**User**: Fetch JSON data from "https://jsonplaceholder.typicode.com/users".

**User**: Fetch CSV data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv".

#### Code

```
fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 30

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and takes the first 5 items."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and takes the first 5 items.

#### Code

```
take 5 get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 31

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where stock is less than or equal to 10."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where stock is less than or equal to 10.

#### Code

```
filter {
  "stock": {
    "le": 10
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 32

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, sorts by price descending, and takes the first 1 item."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, sorts by price descending, and takes the first 1 item.

#### Code

```
take 1 sort {
  field: "price"
  order: "desc"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 33

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos" and filters rows where completed is not equal to true."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos" and filters rows where completed is not equal to true.

#### Code

```
filter {
  "completed": {
    "ne": true
  }
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 34

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and adds a label field by concatenating name, " <", and email, and ">"."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and adds a label field by concatenating name, " <", and email, and ">".

#### Code

```
mutate {
  label: {
    concat: [
      "name"
      " <"
      "email"
      ">"
    ]
  }
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 35

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a salePrice field by multiplying price and discountPercentage, rounded to 2 decimal places."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a salePrice field by multiplying price and discountPercentage, rounded to 2 decimal places.

#### Code

```
mutate {
  salePrice: {
    dp: 2
    mul: [
      "price"
      "discountPercentage"
    ]
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 36

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where rating is greater than or equal to 4.5."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where rating is greater than or equal to 4.5.

#### Code

```
filter {
  "rating": {
    "ge": 4.5
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 37

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and sorts by name ascending."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and sorts by name ascending.

#### Code

```
sort {
  order: "asc"
  field: "name"
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 38

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments" and groups by postId counting rows as commentCount."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments" and groups by postId counting rows as commentCount.

#### Code

```
group {
  by: "postId"
  count: "commentCount"
} fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 39

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a total_length field by summing sepal_length and petal_length, rounded to 1 decimal place."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a total_length field by summing sepal_length and petal_length, rounded to 1 decimal place.

#### Code

```
mutate {
  total_length: {
    dp: 1
    add: [
      "sepal_length"
      "petal_length"
    ]
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 40

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and sorts by stock descending."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and sorts by stock descending.

#### Code

```
sort {
  field: "stock"
  order: "desc"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 41

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average price rounded to 2 decimal places."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average price rounded to 2 decimal places.

#### Code

```
group {
  by: "category"
  avg: {
    dp: 2
    field: "price"
    as: "avgPrice"
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 42

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category counting rows as n."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category counting rows as n.

#### Code

```
group {
  count: "n"
  by: "category"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 43

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and selects category and price."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and selects category and price.

#### Code

```
select [
  "category"
  "price"
] get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 44

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users", renames company.name to companyName, and selects name."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users", renames company.name to companyName, and selects name.

#### Code

```
select [
  "name"
  {
    to: "companyName"
    from: "company.name"
  }
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 45

#### Prompt
"Fetch album data from "https://jsonplaceholder.typicode.com/albums"."

#### Chat Transcript

**User**: Fetch album data from "https://jsonplaceholder.typicode.com/albums".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/albums"..
```

---

### Example 46

#### Prompt
"Fetch JSON data from "https://jsonplaceholder.typicode.com/users"."

#### Chat Transcript

**User**: Fetch JSON data from "https://jsonplaceholder.typicode.com/users".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 47

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where category is in ["furniture", "groceries", "smartphones"]."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where category is in ["furniture", "groceries", "smartphones"].

#### Code

```
filter {
  "category": {
    "in": [
      "furniture"
      "groceries"
      "smartphones"
    ]
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 48

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where address.city is not in ["Gwenborough", "South Elvis", "Wisokyburgh"]."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where address.city is not in ["Gwenborough", "South Elvis", "Wisokyburgh"].

#### Code

```
filter {
  "address.city": {
    ne: "Wisokyburgh"
  }
  "address.city": {
    ne: "South Elvis"
  }
  "address.city": {
    ne: "Gwenborough"
  }
} select [
  "name"
  "email"
  "phone"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 49

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and adds an info field by concatenating username, " - ", website."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and adds an info field by concatenating username, " - ", website.

#### Code

```
mutate {
  info: {
    concat: [
      "username"
      " - "
      "website"
    ]
  }
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 50

#### Prompt
"Fetch photos from "https://jsonplaceholder.typicode.com/photos" and takes the first 10 items."

#### Chat Transcript

**User**: Fetch photos from "https://jsonplaceholder.typicode.com/photos" and takes the first 10 items.

#### Code

```
take 10 fetch "https://jsonplaceholder.typicode.com/photos"..
```

---

### Example 51

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and filters rows where sepal_length is greater than 5 and sepal_width is greater than 3."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and filters rows where sepal_length is greater than 5 and sepal_width is greater than 3.

#### Code

```
filter {
  "sepal_width": {
    "gt": 3
  }
  "sepal_length": {
    "gt": 5
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 52

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and adds a greeting field by concatenating "Hello, " and name."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and adds a greeting field by concatenating "Hello, " and name.

#### Code

```
mutate {
  greeting: {
    concat: [
      "Hello, "
      "name"
    ]
  }
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 53

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average rating rounded to 1 decimal place."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average rating rounded to 1 decimal place.

#### Code

```
group {
  by: "category"
  avg: {
    dp: 1
    field: "rating"
    as: "avgRating"
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 54

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and selects name, email, and phone."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and selects name, email, and phone.

#### Code

```
select [
  "name"
  "email"
  "phone"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 55

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where address.city equals "South Elvis"."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where address.city equals "South Elvis".

#### Code

```
filter {
  "address.city": "South Elvis"
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 56

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where category equals "furniture" and price is greater than 30."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and filters rows where category equals "furniture" and price is greater than 30.

#### Code

```
filter {
  "price": {
    "gt": 30
  }
} filter {
  "category": "furniture"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 57

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species counting rows as count and computing average petal_length."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species counting rows as count and computing average petal_length.

#### Code

```
group {
  avg: "petal_length"
  count: "count"
  by: "species"
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 58

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments" and takes the first 20 items."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments" and takes the first 20 items.

#### Code

```
take 20 fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 59

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where name contains "Leanne"."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and filters rows where name contains "Leanne".

#### Code

```
filter {
  "name": {
    "contains": "Leanne"
  }
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 60

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and selects name and email."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and selects name and email.

#### Code

```
select [
  "name"
  "email"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 61

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos" and adds a source field with the literal value "jsonplaceholder"."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos" and adds a source field with the literal value "jsonplaceholder".

#### Code

```
mutate {
  source: {
    concat: [
      "jsonplaceholder"
    ]
  }
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 62

#### Prompt
"Fetch JSON data from "https://dummyjson.com/products?limit=100"."

#### Chat Transcript

**User**: Fetch JSON data from "https://dummyjson.com/products?limit=100".

#### Code

```
fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 63

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and sorts by price descending."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and sorts by price descending.

#### Code

```
sort {
  order: "desc"
  field: "price"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 64

#### Prompt
"Fetch todo data from "https://jsonplaceholder.typicode.com/todos"."

#### Chat Transcript

**User**: Fetch todo data from "https://jsonplaceholder.typicode.com/todos".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 65

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos" and selects id, title, and completed."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos" and selects id, title, and completed.

#### Code

```
select [
  "id"
  "title"
  "completed"
] fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 66

#### Prompt
"Fetch posts from "https://jsonplaceholder.typicode.com/posts" and filters rows where userId equals 1."

#### Chat Transcript

**User**: Fetch posts from "https://jsonplaceholder.typicode.com/posts" and filters rows where userId equals 1.

#### Code

```
filter {
  "userId": {
    "eq": 1
  }
} fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 67

#### Prompt
"Fetch posts from "https://jsonplaceholder.typicode.com/posts" and renames userId to author and selects title."

#### Chat Transcript

**User**: Fetch posts from "https://jsonplaceholder.typicode.com/posts" and renames userId to author and selects title.

#### Code

```
select [
  {
    to: "author"
    from: "userId"
  }
  "title"
] fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 68

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a petal_area field by multiplying petal_length and petal_width."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a petal_area field by multiplying petal_length and petal_width.

#### Code

```
mutate {
  petal_area: {
    mul: [
      "petal_length"
      "petal_width"
    ]
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 69

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and renames title to name."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and renames title to name.

#### Code

```
select [
  {
    to: "name"
    from: "title"
  }
] get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 70

#### Prompt
"Fetch photo data from "https://jsonplaceholder.typicode.com/photos"."

#### Chat Transcript

**User**: Fetch photo data from "https://jsonplaceholder.typicode.com/photos".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/photos"..
```



