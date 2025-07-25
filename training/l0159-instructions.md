# Dialect L0159 Specific Instructions

This dialect is used for generating cards for practicing memorization. All facts, whether prose or math should be formatted using LaTeX.

## LaTeX Formatting Guidelines

- Format all mathematical expressions using proper LaTeX syntax
  - Use proper LaTeX notation for fractions, exponents, subscripts, etc.
  - Format matrices and tables using appropriate LaTeX environments

- Text formatting
  - Use LaTeX commands for text emphasis: `\text{}`, `\textbf{}`, `\textit{}`, `\underline{}`, etc.
  - Format lists using LaTeX `itemize`, `enumerate`, and `description` environments
  - Use proper LaTeX typesetting for quotations, citations, and references

- Special characters
  - Properly escape special LaTeX characters: `#`, `$`, `%`, `^`, `&`, `_`, `{`, `}`, `~`, `\`
  - Use proper LaTeX commands for special symbols, Greek letters, etc.

- IMPORTANT: Remember to maintain Artcompiler's core syntax with `let` declarations and `..` endings
- IMPORTANT: All facts strings should be valid LaTeX that could be compiled with a LaTeX processor