# Graffiticode Pipeline Imports — Design Spec (v1)

## Summary

This spec defines how a Graffiticode program declares and consumes data from an upstream pipeline node. The design introduces a single language-level construct — `from "<language-id>"` — that produces the upstream's output as a typed value, with parse-time schema validation against the named language's JSON Schema.

The threat model is **accidents only**: prevent program authors from referencing fields that don't exist in the upstream, accidentally coupling to fields they didn't mean to use, or wiring incompatible languages together. Adversarial scenarios (malicious data, capability isolation, information-flow control) are explicitly out of scope.

## Goals

- Prevent accidental misuse of pipeline data (typos, references to nonexistent fields, unintended coupling).
- Make pipeline-data dependencies legible in the program source.
- Reuse the existing per-language JSON Schemas as the type system. Do not introduce a separate type system.
- Keep the language surface area small.

## Non-goals (v1)

- Abuse prevention, capability isolation, information-flow control.
- Schema versioning. Within a language ID, schemas evolve additively only. Breaking changes mean a new language ID.
- Multiple direct upstream imports per program. Multi-source needs are handled by pipeline-level fan-in plus a base-language merge function.
- Optional parameters with defaults beyond what JSON Schema's own `required` list expresses.
- `open`/unqualified access. Imports are always referenced through their bound name.

## Core concept

A program that consumes pipeline data is a function of one input. The input's type is the JSON Schema of a specific upstream language, identified by a language ID literal. Pipeline composition is function application: wiring producer Y into consumer X is supplying Y's output as X's argument.

## Surface syntax

A program may contain at most one `from` expression, which evaluates to the upstream's output value. The expression appears on the right-hand side of a `let` binding.

### Whole-output binding

```
let data = from "l0166"
```

Binds `data` to the entire upstream output. The type of `data` is the L0166 schema.

### Destructured binding

```
let { interaction: { cells } } = from "l0166"
```

Binds `cells` to the cells subtree. Provided as ergonomic sugar over whole-output binding plus dot-path access. Destructuring patterns may name specific keys (including instances of pattern-keyed maps, e.g., `cells: { B5 }`).

### No upstream

A program with no `from` expression is a pipeline source — it produces output without consuming any.

### Reference in body

The bound name behaves as a normal value reference. Field access uses dot paths: `data.interaction.cells`, `cells.B5.text`. Provenance is preserved by always referring through the bound name.

## Semantics

### Parse-time validation

The parser is schema-aware. When parsing a program containing `from "l0166"`:

1. Resolve `"l0166"` to its current schema in the registry. If not found, parse error.
2. Validate the binding pattern (the LHS of the `let`) against the schema. Any path referenced in destructuring must be a valid path in the schema.
3. Validate every reference to the bound name (or destructured names) in the program body. Field accesses must traverse valid schema paths.

Schema violations surface as parse errors, naming the offending path and the language ID.

### Single-import constraint

A program may have at most one `from` expression. Multiple `from` expressions are a parse error.

### Caching

Programs are parsed once and their ASTs are interned by task ID. Compiled outputs are also interned by task ID. Schema validation is performed during parsing and baked into the cached AST — schema changes do not invalidate cached artifacts. Re-authoring a program produces a new task ID and re-parses against the current schema.

### Pipeline composition

When a pipeline edge wires producer Y's output into consumer X's `from "..."` slot:

1. **Construction-time check.** Y's language ID must match the language ID in X's `from`. Mismatch is rejected when the pipeline graph is constructed.
2. **Edge-time runtime check.** The actual data flowing across the edge is validated against X's expected shape. This is the safety net for cases where Y's cached output was generated against a different schema state than X's cached AST was parsed against. (Both states are valid points in an additive evolution, but a consumer expecting a recently-added field would not see it from an old producer.) On mismatch, the edge fails with a clear error.

### Schema evolution

Within a language ID, schemas evolve additively only:

- New optional fields may be added.
- No fields may be removed or renamed.
- Existing field types may not change.

Breaking changes are not permitted within a language ID. They require introducing a new language ID. Programs opt into the new dialect by updating the literal in `from "..."`. Old and new dialects may coexist in the system simultaneously.

## Worked example: L0166 → L0158

A spreadsheet question authored in L0158 uses spreadsheet content produced by an L0166 program. The L0158 program imports the L0166 output and embeds it at the `data:` position of a question's content tree, several levels deep:

```
let data = from "l0166"

question {
  parts: [
    {
      id: 1,
      content: {
        type: spreadsheet,
        data: data
      }
    }
  ]
}
```

What the parser does:

1. Resolves `"l0166"` to L0166's schema.
2. Records that `data` has type L0166 schema.
3. Walks the rest of the program. When it encounters `data: data` inside `content`, it accepts the embedding because L0158's schema declares `content.data` as a generic object slot (loose at the destination).
4. If the body had instead referenced `data.interaction.celsl` (typo), the parser would error: `Field 'interaction.celsl' not found in schema for language 'l0166'. Did you mean 'interaction.cells'?`

L0158 itself does not need to know about L0166. The import contract on the L0158 program side is the only thing that ties the two together.

## Implementation notes

### Schema registry

The parser needs access to all language schemas at parse time. A schema registry abstraction is suggested, with a default file-system-based implementation pointing at the language packages' published schemas. The registry contract:

- `resolve(language_id) -> Schema | NotFound`
- Synchronous lookup is fine for v1.
- Schemas should be pre-loaded into memory at parser startup; per-parse network calls are not desirable.

### AST representation

The parsed AST should record, for each `from` expression:

- The language ID of the upstream (string literal value).
- The bound name(s) and any destructuring pattern.
- Pre-resolved type information for the bound names, so downstream compiler stages don't need to re-validate against the schema.

### Error messages

The accidents-only threat model puts a premium on error message quality. At minimum:

- Field-not-found errors name the offending path and the language: `Field 'interaction.celsl' not found in schema for language 'l0166'`.
- "Did you mean" suggestions for common typos (Levenshtein-near schema paths) strongly recommended.
- Multiple `from` expressions: `Program may have at most one upstream import; found 2 (lines X and Y)`.
- Unknown language ID: `Language 'l0166' not found in schema registry`.
- Wiring mismatch (pipeline construction): `Pipeline edge: producer language 'l0167' does not match consumer's expected language 'l0166'`.
- Edge runtime mismatch: include the producer task ID, consumer task ID, the specific path, and the expected vs. actual shape.

### Edge runtime validation

When a pipeline runtime hands a producer's cached output to a consumer task:

- If the cache state is unambiguous (both artifacts known to have been generated/parsed against the same schema state), validation may be skipped as an optimization.
- Otherwise, validate the data against the consumer's recorded expected shape and fail loudly on mismatch. Do not silently coerce.

## Open decisions for implementation

These are not pinned by the design and should be resolved by Claude Code during planning, ideally in dialogue with Jeff:

1. **Exact destructuring grammar.** Borrow JS-style, ML-style, or align with whatever destructuring (if any) the existing Graffiticode language family already supports.
2. **Where in the grammar `from "..."` is permitted.** Simplest: only on the RHS of a top-level `let`. Whether to allow it in nested expressions is a language-family choice.
3. **Schema registry implementation.** File system path, in-memory map, or hybrid. Whatever fits current language-package distribution.
4. **Unused destructured fields:** error, warning, or silent. Match the existing language family convention.
5. **Suggestion ranking for "did you mean."** Levenshtein is a reasonable default; consider also weighting by sibling proximity in the schema tree.
6. **Pre-loading vs. lazy loading of schemas.** Acceptable to start with eager pre-load; revisit if registry size becomes meaningful.

## Future work (out of v1)

- Multi-source imports per program (currently handled via pipeline-level fan-in plus a base-language merge function in user code).
- Per-pipeline-edge logical names (decoupling the import from the literal language ID).
- Optional/default-valued imports.
- `open`-style flattening of imported names into the local scope.
- Adversarial threat model: capability tokens, IFC labels, declassification.
- Schema migration tooling for breaking-change forks (helping authors port programs from L0166 to L0167, etc.).

## Acceptance criteria

A v1 implementation should pass at least the following:

- A program with a single `from "l0166"` and a valid destructuring pattern parses successfully.
- A program referencing a nonexistent field on the imported value fails with a path-naming error.
- A program with two `from` expressions fails with a clear "at most one" error.
- A program with `from "lXXXX"` for an unknown language ID fails with a registry-lookup error.
- A pipeline that wires an L0166 producer into an L0166 consumer constructs successfully.
- A pipeline that wires an L0167 producer into an L0166 consumer fails at construction.
- A program that re-uses a cached AST after a (compatible, additive) schema change continues to function without re-parsing.
- The L0166 → L0158 worked example above parses, compiles, and produces the expected composed output when wired into a pipeline.
