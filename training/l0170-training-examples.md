# Graffiticode Training Examples

*Downloaded on 2026-03-26T17:25:10.536Z*

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
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, selects title, price, and rating, formats price as "$#,##0.00" and rating as "0.0", and takes the first 10."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, selects title, price, and rating, formats price as "$#,##0.00" and rating as "0.0", and takes the first 10.

#### Code

```
take 10 format {
  price: "$#,##0.00"
  rating: "0.0"
} select [
  "title"
  "price"
  "rating"
] get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 4

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and sorts by sepal_length ascending."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and sorts by sepal_length ascending.

#### Code

```
sort "sepal_length" fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 5

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", groups by species and computes average sepal_length rounded to 2, and sorts by sepal_length descending."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", groups by species and computes average sepal_length rounded to 2, and sorts by sepal_length descending.

#### Code

```
sort {
  field: "sepal_length"
  order: "desc"
} group {
  by: "species"
  avg: {
    round: 2
    as: "sepal_length"
    field: "sepal_length"
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 6

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a total_length field by summing sepal_length and petal_length, rounded to 1."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a total_length field by summing sepal_length and petal_length, rounded to 1.

#### Code

```
mutate {
  total_length: {
    add: [
      "sepal_length"
      "petal_length"
    ]
    round: 1
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 7

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and flattens the "tags" field."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and flattens the "tags" field.

#### Code

```
flatten "tags" get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 8

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

### Example 9

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

### Example 10

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

### Example 11

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

### Example 12

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a sepal_area field by multiplying sepal_length and sepal_width, rounded to 2."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a sepal_area field by multiplying sepal_length and sepal_width, rounded to 2.

#### Code

```
mutate {
  sepal_area: {
    round: 2
    mul: [
      "sepal_length"
      "sepal_width"
    ]
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 13

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

### Example 14

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

### Example 15

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

### Example 16

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "company.name" field."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "company.name" field.

#### Code

```
select [
  "company.name"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 17

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing average sepal_length rounded to 2."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and groups by species computing average sepal_length rounded to 2.

#### Code

```
group {
  by: "species"
  avg: {
    round: 2
    as: "sepal_length_avg"
    field: "sepal_length"
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 18

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

### Example 19

#### Prompt
"Fetch earthquake data from "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=20", gets the "features" field, selects "properties.place", "properties.mag", and "properties.time", and formats time as "yyyy-mm-dd hh:mm"."

#### Chat Transcript

**User**: Fetch earthquake data from "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=20", gets the "features" field, selects "properties.place", "properties.mag", and "properties.time", and formats time as "yyyy-mm-dd hh:mm".

#### Code

```
format {
  time: "yyyy-mm-dd hh:mm"
} select [
  "properties.place"
  "properties.mag"
  "properties.time"
] get "features" fetch "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=20"..
```

---

### Example 20

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, selects title and rating, sorts by rating descending, and takes the first 5."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, selects title and rating, sorts by rating descending, and takes the first 5.

#### Code

```
take 5 sort {
  field: "rating"
  order: "desc"
} select [
  "title"
  "rating"
] get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 21

#### Prompt
"Fetch posts from "https://jsonplaceholder.typicode.com/posts" and deduplicates by userId."

#### Chat Transcript

**User**: Fetch posts from "https://jsonplaceholder.typicode.com/posts" and deduplicates by userId.

#### Code

```
unique "userId" fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 22

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

### Example 23

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and deduplicates by category."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and deduplicates by category.

#### Code

```
unique "category" get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 24

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and flattens the "reviews" field."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and flattens the "reviews" field.

#### Code

```
flatten "reviews" get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 25

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

### Example 26

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments", deduplicates by email, selects name and email, and sorts by email."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments", deduplicates by email, selects name and email, and sorts by email.

#### Code

```
sort "email" select [
  "name"
  "email"
] unique "email" fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 27

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", filters where sepal_length is greater than 6, and sorts by sepal_length descending."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", filters where sepal_length is greater than 6, and sorts by sepal_length descending.

#### Code

```
sort {
  field: "sepal_length"
  order: "desc"
} filter {
  sepal_length: {
    gt: 6
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 28

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

### Example 29

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

### Example 30

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

### Example 31

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

### Example 32

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

### Example 33

#### Prompt
"Fetch post data from "https://jsonplaceholder.typicode.com/posts"."

#### Chat Transcript

**User**: Fetch post data from "https://jsonplaceholder.typicode.com/posts".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/posts"..
```

---

### Example 34

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and formats stock as integer"

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and formats stock as integer

#### Code

```
format {
  stock: "#,##0"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 35

#### Prompt
"Fetch comment data from "https://jsonplaceholder.typicode.com/comments"."

#### Chat Transcript

**User**: Fetch comment data from "https://jsonplaceholder.typicode.com/comments".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 36

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

### Example 37

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

### Example 38

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

### Example 39

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

### Example 40

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

### Example 41

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments" and joins with posts fetched from "https://jsonplaceholder.typicode.com/posts" on postId matching id."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments" and joins with posts fetched from "https://jsonplaceholder.typicode.com/posts" on postId matching id.

#### Code

```
join {
  right: fetch "https://jsonplaceholder.typicode.com/posts"
  on: "id"
} fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 42

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

### Example 43

#### Prompt
"Fetch posts from "https://jsonplaceholder.typicode.com/posts" and joins with users fetched from "https://jsonplaceholder.typicode.com/users" on userId matching id."

#### Chat Transcript

**User**: Fetch posts from "https://jsonplaceholder.typicode.com/posts" and joins with users fetched from "https://jsonplaceholder.typicode.com/users" on userId matching id.

#### Code

```
join {
  right: (fetch "https://jsonplaceholder.typicode.com/posts")
  on: "id"
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 44

#### Prompt
"Fetch photos from "https://jsonplaceholder.typicode.com/photos" and joins with albums fetched from "https://jsonplaceholder.typicode.com/albums" on albumId matching id."

#### Chat Transcript

**User**: Fetch photos from "https://jsonplaceholder.typicode.com/photos" and joins with albums fetched from "https://jsonplaceholder.typicode.com/albums" on albumId matching id.

#### Code

```
join {
  right: fetch "https://jsonplaceholder.typicode.com/albums"
  on: "albumId"
  rightOn: "id"
} fetch "https://jsonplaceholder.typicode.com/photos"..
```

---

### Example 45

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and takes the first 5 items."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and takes the first 5 items.

#### Code

```
take 5 get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 46

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

### Example 47

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a pricePerUnit field by dividing price and stock, rounded to 2."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a pricePerUnit field by dividing price and stock, rounded to 2.

#### Code

```
mutate {
  pricePerUnit: {
    div: [
      "price"
      "stock"
    ]
    round: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 48

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category and sums price as totalPrice rounded to 2, sorts by totalPrice descending, and formats totalPrice as "$#,##0.00"."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category and sums price as totalPrice rounded to 2, sorts by totalPrice descending, and formats totalPrice as "$#,##0.00".

#### Code

```
format {
  totalPrice: "$#,##0.00"
} sort {
  field: "totalPrice"
  order: "desc"
} group {
  by: "category"
  sum: {
    field: "price"
    as: "totalPrice"
    round: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 49

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a sepal_ratio field by dividing sepal_length and sepal_width, rounded to 2."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a sepal_ratio field by dividing sepal_length and sepal_width, rounded to 2.

#### Code

```
mutate {
  sepal_ratio: {
    div: [
      "sepal_length"
      "sepal_width"
    ]
    round: 2
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 50

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", groups by species and computes average sepal_length rounded to 2, and formats sepal_length as "0.00"."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", groups by species and computes average sepal_length rounded to 2, and formats sepal_length as "0.00".

#### Code

```
format {
  sepal_length: "0.00"
} group {
  by: "species"
  avg: {
    round: 2
    as: "sepal_length"
    field: "sepal_length"
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 51

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

### Example 52

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

### Example 53

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

### Example 54

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and formats price as "#,##0.00;(#,##0.00)"."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and formats price as "#,##0.00;(#,##0.00)".

#### Code

```
format {
  price: "#,##0.00;(#,##0.00)"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 55

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a salePrice field by multiplying price and discountPercentage, rounded to 2."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a salePrice field by multiplying price and discountPercentage, rounded to 2.

#### Code

```
mutate {
  salePrice: {
    mul: [
      "price"
      "discountPercentage"
    ]
    round: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 56

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments" and deduplicates by email."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments" and deduplicates by email.

#### Code

```
unique "email" fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 57

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

### Example 58

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

### Example 59

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

### Example 60

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

### Example 61

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "address.geo" field."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "address.geo" field.

#### Code

```
select [
  "address.geo"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 62

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and deduplicates by category and brand."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and deduplicates by category and brand.

#### Code

```
unique [
  "category"
  "brand"
] get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 63

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

### Example 64

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos", filters where completed equals true, and sorts by title."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos", filters where completed equals true, and sorts by title.

#### Code

```
sort "title" filter {
  completed: true
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 65

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average price rounded to 2."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average price rounded to 2.

#### Code

```
group {
  by: "category"
  avg: {
    round: 2
    field: "price"
    as: "avgPrice"
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 66

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

### Example 67

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

### Example 68

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", adds a sepal_area field by multiplying sepal_length and sepal_width rounded to 2, and formats sepal_area as with 2 decimal places"

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv", adds a sepal_area field by multiplying sepal_length and sepal_width rounded to 2, and formats sepal_area as with 2 decimal places

#### Code

```
format {
  sepal_area: "#,##0.00"
} mutate {
  sepal_area: {
    round: 2
    mul: [
      "sepal_length"
      "sepal_width"
    ]
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 69

#### Prompt
"Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a length_diff field by subtracting sepal_length and petal_length, rounded to 2."

#### Chat Transcript

**User**: Fetch iris data from "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv" and adds a length_diff field by subtracting sepal_length and petal_length, rounded to 2.

#### Code

```
mutate {
  length_diff: {
    sub: [
      "sepal_length"
      "petal_length"
    ]
    round: 2
  }
} fetch "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv"..
```

---

### Example 70

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

### Example 71

#### Prompt
"Fetch album data from "https://jsonplaceholder.typicode.com/albums"."

#### Chat Transcript

**User**: Fetch album data from "https://jsonplaceholder.typicode.com/albums".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/albums"..
```

---

### Example 72

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos", filters where completed equals true, and sorts by title."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos", filters where completed equals true, and sorts by title.

#### Code

```
sort "title" filter {
  completed: true
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 73

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and formats price as "$#,##0.00"."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and formats price as "$#,##0.00".

#### Code

```
format {
  price: "$#,##0.00"
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 74

#### Prompt
"Fetch JSON data from "https://jsonplaceholder.typicode.com/users"."

#### Chat Transcript

**User**: Fetch JSON data from "https://jsonplaceholder.typicode.com/users".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 75

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

### Example 76

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

### Example 77

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

### Example 78

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, filters where rating is greater than or equal to 4, and selects title and price."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, filters where rating is greater than or equal to 4, and selects title and price.

#### Code

```
select [
  "title"
  "price"
] filter {
  "rating": {
    "ge": 4
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 79

#### Prompt
"Fetch photos from "https://jsonplaceholder.typicode.com/photos" and takes the first 10 items."

#### Chat Transcript

**User**: Fetch photos from "https://jsonplaceholder.typicode.com/photos" and takes the first 10 items.

#### Code

```
take 10 fetch "https://jsonplaceholder.typicode.com/photos"..
```

---

### Example 80

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

### Example 81

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, adds a salePrice field by multiplying price and discountPercentage rounded to 2, and formats salePrice as "$#,##0.00"."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, adds a salePrice field by multiplying price and discountPercentage rounded to 2, and formats salePrice as "$#,##0.00".

#### Code

```
format {
  salePrice: "$#,##0.00"
} mutate {
  salePrice: {
    mul: [
      "price"
      "discountPercentage"
    ]
    round: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 82

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "address" field."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "address" field.

#### Code

```
select [
  "address"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 83

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100" and gets the "products.title" field."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100" and gets the "products.title" field.

#### Code

```
select [
  "title"
] get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 84

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

### Example 85

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average rating rounded to 1."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and groups by category computing average rating rounded to 1.

#### Code

```
group {
  by: "category"
  avg: {
    round: 1
    field: "rating"
    as: "avgRating"
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 86

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

### Example 87

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

### Example 88

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

### Example 89

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a discount field by subtracting price and salePrice, rounded to 2."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, and adds a discount field by subtracting price and salePrice, rounded to 2.

#### Code

```
mutate {
  discount: {
    sub: [
      "price"
      "salePrice"
    ]
    round: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 90

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

### Example 91

#### Prompt
"Fetch comments from "https://jsonplaceholder.typicode.com/comments" and takes the first 20 items."

#### Chat Transcript

**User**: Fetch comments from "https://jsonplaceholder.typicode.com/comments" and takes the first 20 items.

#### Code

```
take 20 fetch "https://jsonplaceholder.typicode.com/comments"..
```

---

### Example 92

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users", selects name and email, and sorts by name."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users", selects name and email, and sorts by name.

#### Code

```
sort {
  field: "name"
  order: "asc"
} select [
  "name"
  "email"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 93

#### Prompt
"Given data with rows containing an "items" array of records (e.g., [{order: 1, items: [{sku: "A1", qty: 2}, {sku: "B3", qty: 1}]}, {order: 2, items: [{sku: "A1", qty: 5}]}]), flatten the "items" field to produce one row per item."

#### Chat Transcript

**User**: Given data with rows containing an "items" array of records (e.g., [{order: 1, items: [{sku: "A1", qty: 2}, {sku: "B3", qty: 1}]}, {order: 2, items: [{sku: "A1", qty: 5}]}]), flatten the "items" field to produce one row per item.

#### Code

```
flatten "items" [
  {
    order: 1
    items: [
      {
        sku: "A1"
        qty: 2
      }
      {
        sku: "B3"
        qty: 1
      }
    ]
  }
  {
    order: 2
    items: [
      {
        sku: "A1"
        qty: 5
      }
    ]
  }
]..
```

---

### Example 94

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

### Example 95

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

### Example 96

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

### Example 97

#### Prompt
"Given data with rows containing a "scores" array of numbers (e.g., [{student: "Alice", scores: [90, 85, 92]}, {student: "Bob", scores: [78, 88]}]), flatten the "scores" field to produce one row per score."

#### Chat Transcript

**User**: Given data with rows containing a "scores" array of numbers (e.g., [{student: "Alice", scores: [90, 85, 92]}, {student: "Bob", scores: [78, 88]}]), flatten the "scores" field to produce one row per score.

#### Code

```
flatten "scores" [
  {
    student: "Alice"
    scores: [
      90
      85
      92
    ]
  }
  {
    student: "Bob"
    scores: [
      78
      88
    ]
  }
]..
```

---

### Example 98

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100" and gets the "products" field."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100" and gets the "products" field.

#### Code

```
get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 99

#### Prompt
"Fetch JSON data from "https://dummyjson.com/products?limit=100"."

#### Chat Transcript

**User**: Fetch JSON data from "https://dummyjson.com/products?limit=100".

#### Code

```
fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 100

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category and sums price as totalPrice rounded to 2, sorts by totalPrice descending, and formats totalPrice as currency"

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category and sums price as totalPrice rounded to 2, sorts by totalPrice descending, and formats totalPrice as currency

#### Code

```
format {
  totalPrice: "$#,##0.00"
} sort {
  field: "totalPrice"
  order: "desc"
} group {
  by: "category"
  sum: {
    field: "price"
    as: "totalPrice"
    round: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 101

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

### Example 102

#### Prompt
"Fetch todo data from "https://jsonplaceholder.typicode.com/todos"."

#### Chat Transcript

**User**: Fetch todo data from "https://jsonplaceholder.typicode.com/todos".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 103

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, selects title and price, formats price as currency whole number, and sorts by title."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, selects title and price, formats price as currency whole number, and sorts by title.

#### Code

```
sort "title" format {
  price: "$#,##0"
} select [
  "title"
  "price"
] get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 104

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category and sums price as totalPrice rounded to 2, and sorts by totalPrice descending."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category and sums price as totalPrice rounded to 2, and sorts by totalPrice descending.

#### Code

```
sort {
  field: "totalPrice"
  order: "desc"
} group {
  by: "category"
  sum: {
    field: "price"
    as: "totalPrice"
    round: 2
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 105

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

### Example 106

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

### Example 107

#### Prompt
"Fetch albums from "https://jsonplaceholder.typicode.com/albums" and joins with users fetched from "https://jsonplaceholder.typicode.com/users" on userId matching id."

#### Chat Transcript

**User**: Fetch albums from "https://jsonplaceholder.typicode.com/albums" and joins with users fetched from "https://jsonplaceholder.typicode.com/users" on userId matching id.

#### Code

```
join {
  right: fetch "https://jsonplaceholder.typicode.com/albums"
  on: "id"
} fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 108

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "address.city" field."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users" and gets the "address.city" field.

#### Code

```
select [
  "address.city"
] fetch "https://jsonplaceholder.typicode.com/users"..
```

---

### Example 109

#### Prompt
"Fetch todos from "https://jsonplaceholder.typicode.com/todos", groups by userId and counts as totalTodos, sorts by totalTodos descending, and takes the first 3."

#### Chat Transcript

**User**: Fetch todos from "https://jsonplaceholder.typicode.com/todos", groups by userId and counts as totalTodos, sorts by totalTodos descending, and takes the first 3.

#### Code

```
take 3 sort {
  field: "totalTodos"
  order: "desc"
} group {
  by: "userId"
  count: "totalTodos"
} fetch "https://jsonplaceholder.typicode.com/todos"..
```

---

### Example 110

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category computing average rating rounded to 1, sorts by rating descending, and takes the first 5."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, groups by category computing average rating rounded to 1, sorts by rating descending, and takes the first 5.

#### Code

```
take 5 sort {
  field: "avgRating"
  order: "desc"
} group {
  by: "category"
  avg: {
    field: "rating"
    as: "avgRating"
    round: 1
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 111

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, flattens the "tags" field, deduplicates by tags, and sorts by tags."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, flattens the "tags" field, deduplicates by tags, and sorts by tags.

#### Code

```
sort "tags" unique "tags" flatten "tags" get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 112

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

### Example 113

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

### Example 114

#### Prompt
"Fetch users from "https://jsonplaceholder.typicode.com/users", adds a label field by concatenating name, " <", email, and ">", and selects label and phone."

#### Chat Transcript

**User**: Fetch users from "https://jsonplaceholder.typicode.com/users", adds a label field by concatenating name, " <", email, and ">", and selects label and phone.

#### Code

```
select [
  "label"
  "phone"
] mutate {
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

### Example 115

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, mutates discountRate by dividing discountPercentage by 100, and formats discountRate as "0.0%"."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, mutates discountRate by dividing discountPercentage by 100, and formats discountRate as "0.0%".

#### Code

```
format {
  discountRate: "0.0%"
} mutate {
  discountRate: {
    div: [
      "discountPercentage"
      100
    ]
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 116

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

### Example 117

#### Prompt
"Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, filters where price is greater than 100, selects title and price, and sorts by price descending."

#### Chat Transcript

**User**: Fetch products from "https://dummyjson.com/products?limit=100", gets the "products" field, filters where price is greater than 100, selects title and price, and sorts by price descending.

#### Code

```
sort {
  field: "price"
  order: "desc"
} select [
  "title"
  "price"
] filter {
  price: {
    gt: 100
  }
} get "products" fetch "https://dummyjson.com/products?limit=100"..
```

---

### Example 118

#### Prompt
"Fetch photo data from "https://jsonplaceholder.typicode.com/photos"."

#### Chat Transcript

**User**: Fetch photo data from "https://jsonplaceholder.typicode.com/photos".

#### Code

```
fetch "https://jsonplaceholder.typicode.com/photos"..
```



