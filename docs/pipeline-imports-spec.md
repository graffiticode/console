# Graffiticode Pipeline Imports — Design Spec (v1)

## Summary

This spec defines how a Graffiticode program reads data from an upstream pipeline node. Two functions in the base language provide pipeline access:

- `data {default}` — an existing primitive that returns the upstream's compiled output value, or `{default}` if no upstream is wired. No language coupling, no compile-time validation. Loose and flexible.
- `typed-data "<language-id>" {default}` — a typed variant that returns the same upstream value but is validated at compile time against both the named language's schema and the upstream task's actual output. Compile-time errors surface accidents.

The threat model is **accidents only**: prevent program authors from referencing fields that don't exist in the upstream they're consuming. Adversarial scenarios are explicitly out of scope.

## Goals

- Provide a strict, statically-checked path (`typed-data`) for programs where catching accidents matters.
- Preserve the dynamic, late-bound path (`data`) for programs where flexibility or composability matters more than safety.
- Make the choice per-call, so authors and agents can mix safety levels as appropriate within a single program.
- Reuse existing per-language JSON Schemas for two distinct roles: producer-side conformance checking, and consumer-side compile-time error messaging. Do not introduce a separate type system.
- Treat the pipeline as a build graph of residual programs (Futamura-style partial evaluation), exploiting the existing content-addressed task model.

## Non-goals (v1)

- Abuse prevention, capability isolation, information-flow control.
- Schema versioning. Within a language ID, schemas evolve additively only. Breaking changes mean a new language ID.
- Multiple direct upstreams per program. A program has at most one upstream; multi-source needs use pipeline-level fan-in plus a base-language merge function.
- Migration of existing `data` users. Both functions coexist; nothing is forced to change.
- `open`-style flattening of imported names into local scope.

## Core concept

The pipeline is a build graph. Each consumer task is a function specialized at compile time to its specific upstream task's actual output value. The compiled output is a residual program with the upstream's data effectively folded in.

`data` performs the same runtime substitution but defers all validation to runtime — the consumer is parsed and compiled without any constraint on the upstream's shape, and the default value acts as a fallback when no upstream is wired.

`typed-data` adds a contract: a named language ID and compile-time validation that every reference into the typed-data result is consistent with both the language's schema and the upstream task's actual output value.

Because the system is content-addressed, a consumer's compile cache key is a function of (its source + the task IDs of its transitive upstreams). Re-authoring an upstream cascades new compile cache keys downstream. Parse cache keys depend only on source.

## Surface syntax

Both functions are first-class values in the base language and may appear anywhere a value is expected.

### Untyped, with default

```
let x = data {default}
```

Returns the upstream's compiled output, or `{default}` if no upstream is wired. No compile-time validation against a schema or against the upstream's shape.

### Typed, with language ID and default

```
let x = typed-data "l0166" {default}
```

Returns the upstream's compiled output, or `{default}` if no upstream is wired. Compile-time validation: every reference into `x` is checked against L0166's schema and the upstream task's actual output value. The default value is also checked against L0166's schema.

### Language ID forms

The language ID literal accepts three equivalent forms:

- Uppercase prefix: `"L0166"`
- Lowercase prefix: `"l0166"`
- Bare numeric: `"0166"`

All three resolve to the same language during registry lookup. The compiler normalizes them to a single canonical form (lowercase prefix, e.g., `"l0166"`) for use in error messages, AST records, and pipeline-construction comparisons.

### Destructured binding

Either form may be destructured on the LHS:

```
let { interaction: { cells } } = typed-data "l0166" {default}
```

Destructuring patterns may name specific keys, including instances of pattern-keyed maps (e.g., `cells: { B5 }`). For `typed-data`, every named path is checked against the upstream's schema and value.

### No upstream

A program with no `data` or `typed-data` call is a pipeline source.

## Semantics

### Compile-time validation (value-aware)

Validation for `typed-data` happens during compilation, not parsing. The parser produces a purely syntactic AST. The compiler walks the AST, resolves `typed-data` calls, and validates references.

When the compiler encounters `typed-data "l0166" {default}`:

1. Normalize the language ID literal to canonical form. Resolve the canonical ID to its current schema in the registry. The schema is used for error messaging only. Unknown language ID is a compile error.
2. Validate the default value `{default}` against L0166's schema. A non-conformant default is a compile error.
3. Locate the upstream task's compiled output value via the task store, using the pipeline's wiring of the producer task. If no upstream is wired, the default is used as the value for validation.
4. Validate every reference into the bound name (or destructured names) against the active value (upstream output if wired, otherwise the default). Field accesses must traverse paths actually present.

Build order is enforced bottom-up at compile time: a consumer cannot be compiled until its upstreams have been compiled. Parsing has no such constraint — a consumer can be parsed before its upstream is compiled.

`data` calls do not undergo any compile-time validation against a schema or upstream value. Errors surface at runtime when an access fails on the actual value.

### Three-state error messaging (typed-data only)

Schema and value together drive precise error categorization for `typed-data` references:

1. **Path absent from value AND absent from schema.** Likely typo. Error suggests the closest schema-valid sibling:
   ```
   Field 'interaction.celsl' not found. Did you mean 'interaction.cells'?
   ```
2. **Path absent from value but present in schema.** The upstream is permitted to emit this field but didn't. Error directs the author appropriately:
   ```
   Field 'interaction.cells.B5.notes' is declared by L0166's schema but not
   emitted by this upstream task. Check the upstream's logic, or guard with
   'has(sheet.interaction.cells.B5.notes)'.
   ```
3. **Path present in value.** Valid; no error.

### Single-upstream constraint

A program has at most one upstream. Multiple `data` and `typed-data` calls in the same program all read the same upstream's value. All `typed-data` calls in the same program must specify the same language ID (after normalization); disagreement is a compile error.

Mixing `data` and `typed-data` calls in the same program is permitted. `typed-data` does the schema assertion and validation; `data` is a fallback-supplying read of the same upstream.

### Caching

Programs are parsed once and their ASTs interned by source. Compile is a separate phase, and compiled outputs are interned by (source + transitive upstream task IDs).

A consumer's compile cache key is a function of (its own source + the task IDs of its transitive upstreams). Re-authoring an upstream produces a new upstream task ID, which invalidates the consumer's compile cache entry but not its parse cache entry. The consumer's AST is reused; its output is recomputed against the new upstream value.

This split:

- One parse per program source, regardless of pipeline configuration.
- One compile per (program source, upstream wiring), with content-addressed reuse.

### Pipeline composition

When a pipeline edge wires producer Y's output into consumer X:

1. **Construction-time check (typed-data only).** If X contains `typed-data` calls, Y's language ID must match the (normalized) language ID literal those calls assert. Mismatch is rejected at pipeline construction.
2. **No load-bearing edge-time validation.** Because the consumer is compiled against the producer's actual cached output, by construction the data and the consumer's expectations match. A defense-in-depth assertion may detect corruption in the task store but is not load-bearing for correctness.

`data` calls have no construction-time check — any upstream can be wired, and the consumer trusts the runtime to surface any access failures.

### Schema evolution

Within a language ID, schemas evolve additively only:

- New optional fields may be added.
- No fields may be removed or renamed.
- Existing field types may not change.

Breaking changes are not permitted within a language ID. They require a new language ID. Programs opt into the new dialect by updating the literal in `typed-data "..." {default}`. Old and new dialects coexist.

### Producer-side schema conformance

When a program in language L compiles to data, that data must conform to L's schema. This is the producer's compiler's responsibility and a separate concern from consumer-side validation. The two roles use the same schema artifact but are independent checks in the codebase.

## Worked example: L0166 → L0158

A spreadsheet question authored in L0158 uses spreadsheet content produced by an L0166 program. The L0158 program reads the L0166 task's output and embeds it at the `data:` position of a question's content tree, several levels deep:

```
let sheet = typed-data "l0166" {}

question {
  parts: [
    {
      id: 1,
      content: {
        type: spreadsheet,
        data: sheet
      }
    }
  ]
}
```

What the compiler does:

1. Normalizes `"l0166"` and resolves to L0166's schema. (`"L0166"` and `"0166"` would resolve identically.)
2. Validates the default `{}` against L0166's schema (an empty object is permitted by L0166).
3. Looks up the upstream task's compiled output value in the task store (or uses the default if no upstream is wired).
4. Records that `sheet` is bound to that value.
5. Walks the rest of the program. When it encounters `data: sheet` inside `content`, it accepts the embedding because L0158's schema declares `content.data` as a generic object slot.
6. If the body had referenced `sheet.interaction.celsl` (typo), the compiler errors with a "did you mean" suggestion.
7. If the body had referenced `sheet.interaction.cells.B5.notes` (declared in L0166's schema but not emitted by this specific upstream), the compiler errors with the schema-valid-but-not-emitted guidance.

If the author had used `data {}` instead of `typed-data "l0166" {}`, none of the field-level validation would happen at compile time. Errors would surface at runtime if the actual value did not have the expected fields, with no schema-based error guidance.

L0158 itself does not need to know about L0166. The `typed-data` contract on the L0158 program side is the only thing tying the two languages together at the language level.

## Implementation notes

### Phase split

- **Parse phase:** purely syntactic. Produces an AST without consulting any schemas or upstream values. Cached by source. Runs anytime, including during authoring and editor previews.
- **Compile phase:** consumes the AST plus (for `typed-data` calls) the upstream task's compiled output and the language schema. Produces the residual output value. Cached by (source + transitive upstream task IDs).

### Language ID normalization

A single normalization function is the entry point for resolving any language-ID literal. It accepts the three documented forms (`"L0123"`, `"l0123"`, `"0123"`), strips/normalizes the prefix to lowercase, and returns the canonical string used everywhere downstream — registry lookup, AST records, error messages, and pipeline-construction comparisons. All language-ID handling routes through this function so the equivalence is enforced in one place.

### Upstream value resolution

The compiler obtains the upstream task's output value via the existing task-store lookup mechanism. The pipeline configuration provides the mapping from the consumer to a specific producer task ID; the compiler fetches that task's output during the consumer's compile phase.

### Schema registry

The compiler also needs access to language schemas for `typed-data` error messaging and default validation. A registry abstraction is suggested, with `resolve(canonical_language_id) -> Schema | NotFound`. Synchronous lookup is fine for v1; pre-loading at compiler startup is acceptable.

### AST representation

The parsed AST is purely syntactic. It records `data` and `typed-data` calls as standard function applications with their arguments. References to bound names are recorded as path expressions; the compiler resolves them against the upstream value during compilation.

The compiler may attach validation results to AST nodes during compilation, but the parse-cached AST itself does not carry such information.

### Error messages

The accidents-only threat model puts a premium on error message quality. Required categories for `typed-data`:

- **Typo** (path absent from both value and schema): name the offending path, suggest the closest schema-valid sibling. Levenshtein with sibling-proximity weighting is reasonable.
- **Schema-valid but not emitted** (path in schema, absent from value): name the offending path, name the language, suggest a presence check or upstream-side investigation.
- **Default value non-conformance:** name the schema constraint violated and the location in the default value where it was violated.
- **Multiple `typed-data` language disagreement:** name both calls and the conflicting (canonical) language IDs.
- **Unknown language ID:** name the literal as written, the canonical form it normalized to, and the registry being consulted.
- **Construction-time mismatch:** name producer language, consumer expected language, and the offending edge.

### Edge runtime validation (defense-in-depth only)

Because compilation is value-aware, consumer expectations and producer outputs match by construction. An optional sanity assertion when a cached output crosses a pipeline edge can detect corruption in the task store but should not be relied upon for correctness.

### Producer-side schema conformance check

Each language's compiler should validate its emitted output against the language's own schema before storing it. Independent of the import system but uses the same schema artifact.

## Open decisions for implementation

These are not pinned by the design and should be resolved during planning:

1. **Naming.** `typed-data` is descriptive. `checked-data`, `safe-data`, `from-data` are alternatives.
2. **Where in the grammar `data` / `typed-data` are permitted.** As regular function calls they can appear anywhere; whether to syntactically restrict their use to top-level `let` bindings is a language-family choice.
3. **Destructuring grammar.** Match whatever pattern destructuring (if any) the existing language family uses.
4. **Schema registry implementation.** File system, in-memory map, or hybrid.
5. **Suggestion ranking for "did you mean."** Levenshtein with sibling-proximity weighting is a reasonable default.
6. **Presence-check construct.** A `has(path)` form is implied by the schema-valid-but-not-emitted error guidance. Decide whether to add it in v1 or punt.
7. **Linting `data` + `typed-data` mix.** A program with both forms is legal; whether to surface a lint warning is a tooling decision.

## Future work (out of v1)

- Multi-source imports per program.
- Per-pipeline-edge logical names (decoupling from literal language ID).
- Optional/default-valued imports beyond what the function-level default already provides.
- `open`-style flattening of imported names into local scope.
- Adversarial threat model: capability tokens, IFC labels, declassification.
- Schema migration tooling for breaking-change forks (porting from L0166 to L0167).
- Editor/preview tooling that surfaces typed-data errors during authoring (parse is fast and unconstrained, but typed-data feedback requires compilation against an upstream).

## Acceptance criteria

A v1 implementation should pass at least the following:

- A program containing only `data {...}` parses and compiles without invoking the schema registry.
- A program containing `typed-data "l0166" {...}` parses without consulting any upstream or schema.
- The three forms `"L0166"`, `"l0166"`, and `"0166"` all resolve to the same language at compile time. A program using one form composes successfully with a producer task whose language was specified via a different form.
- A program containing `typed-data` and a destructuring pattern present in the upstream's actual output compiles successfully.
- A program referencing a path absent from both the upstream value and L0166's schema fails at compile time with a "did you mean" error.
- A program referencing a path that L0166's schema permits but the specific upstream did not emit fails at compile time with a "declared but not emitted" error.
- A program with two `typed-data` calls naming different language IDs (after normalization) fails at compile time with a clear disagreement error.
- A program with `typed-data "lXXXX" {...}` for an unknown language ID fails with a registry-lookup error.
- A `typed-data` default that does not conform to the named language's schema fails at compile time with a default-conformance error.
- A pipeline that wires an L0166 producer into a consumer with `typed-data "l0166" {...}` constructs successfully.
- A pipeline that wires an L0167 producer into a consumer with `typed-data "l0166" {...}` fails at construction.
- Editing an upstream program (producing a new upstream task ID) invalidates downstream consumers' compile cache entries while preserving their parse cache entries.
- The L0166 → L0158 worked example above parses, compiles, and produces the expected composed output when wired into a pipeline.
