# Dialect L0002 Specific Instructions

L0002 is the base dialect of Graffiticode, focused on simple interactions and visualizations.

## L0002 Specific Guidelines

- Use `hello` to display text output: `hello "Hello, world!"..`
- Use `theme` to set the visual theme: `theme dark..` or `theme light..`
- Prefer simple, readable expressions that are easy to understand
- Focus on making the code concise yet expressive
- Generate well-structured and modular code
- Add descriptive comments using the pipe symbol `|`

## Example Patterns

Here are some common patterns in L0002:

- Greeting with name: `hello concat "Hello, " name..`
- Conditional output:
  ```
  if condition then 
    hello "Yes" 
  else 
    hello "No"
  ..
  ```
- List processing: `map (double) [1 2 3]..`