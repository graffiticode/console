# Plan: Multi-Language Composition via Router-as-Planner

## Context

Some Graffiticode requests need more than one language — e.g., a Learnosity (l0158) custom question whose interaction is an embeddable spreadsheet assessment (l0166). The l0166 compile output becomes the `data` of the l0158 question object. Today's code generator is single-lang scoped (`src/lib/code-generation-service.ts`: per-lang prompt, per-lang RAG); it has no way to author such a composition.

The runtime already supports composition transparently via the `id1+id2` chained-id primitive: `src/utils/swr/fetchers.ts:18` slices on `+` when re-feeding form data; `src/utils/storage/firestore.ts:32` decodes chained ids. The console passes chained ids through to api.graffiticode.org without modification — the inner compile's output is fed as `data` to the outer compile, and the outer language's compiler does the composition (which is the safety property we want).

What's missing is the *generator-side* piece that decides "this prompt needs both langs," runs each through the existing single-lang pipeline, and returns a chained taskId. We solve it by promoting the existing `language-router.ts` (currently invoked only on OUT_OF_SCOPE) from a flat lang-suggester into a planner: it returns an ordered Plan whose steps are (lang, prompt, dataFromStep?) tuples. For most prompts the plan is one step (today's behavior). For composition prompts the plan is N steps with dataflow edges. A small server-side orchestrator inside `generateCode()` walks the plan, threads taskIds, and returns `{ src, taskId: "tOuter+tInner" }` — same shape today's callers consume. No GraphQL/MCP changes, no items schema change.

The composition pair l0158 (outer) + l0166 (inner) is the first instance, but the mechanism is general — adding a new pair is a router-catalog change, not a generator change.

## Approach

**Signal model** (mirrors the existing OUT_OF_SCOPE pattern, preserving "positive scope per language"):
- The outer language's instructions teach it to emit `NEEDS_INNER: <synthesized inner prompt>` when the user's request requires content this dialect doesn't author from prose alone.
- `generateCode()` detects the signal (parallel to its OUT_OF_SCOPE branch), calls the router with the inner prompt, picks the inner lang, runs the inner step's full single-lang generation+compile, captures `tInner`, then re-runs the outer step with awareness that `data` will be the inner's compile output.
- Final returned taskId is the chained string `tOuter+tInner` (outer left, inner right — matches existing semantics in `fetchers.ts:18`).

**Why this shape**:
- Each language's RAG/prompt scope stays clean — no language is taught the schema of any other.
- The composition is performed by the l0158 compiler at compile time (compiler-as-composer = the stated safety requirement).
- Inner step is a normal l0166 generation, so adding a new outer language only needs a `NEEDS_INNER` instruction in that language's prompt + (optionally) a routing hint pairing it with l0166. No console code change for new pairs.
- Single composite item persists with `taskId: "tOuter+tInner"` — zero items-schema change.

## Files Modified

| File | Change |
|------|--------|
| `src/lib/language-router.ts` | Add a sibling export `planInnerForRequest({ userRequest, innerNeed, outerLang })` that returns `{ inner: { lang, prompt } \| null }`. Reuses `listLanguages()` + Haiku call shape. Existing `findBestLanguages` is unchanged. |
| `src/lib/code-generation-service.ts` | After the existing OUT_OF_SCOPE detection branch (~line 1450), add a parallel `NEEDS_INNER:` detection branch. On match: parse the inner prompt, call `planInnerForRequest`, run a recursive/inline single-lang generation for the inner step, capture its taskId, then re-invoke the outer generation with `priorTaskId = tInner` so the outer's compile receives inner data. Return `{ src, taskId: "${tOuter}+${tInner}", lang, ... }`. Also: extend the base system prompt with the `NEEDS_INNER` instruction (parallel to the existing OUT_OF_SCOPE base-prompt addition). |
| L0158 language repo (outside this repo, `instructions.md`) | Teach l0158 to emit `NEEDS_INNER: <one-paragraph description of the inner content needed>` when the user asks for an interaction-rich question (spreadsheet assessment, etc.) that requires structured content the l0158 dialect can't author from prose. Keep the instruction *positive* per spec — describe l0158's scope, not l0166's. |
| L0158 routing hint in `src/lib/languages.ts` (or wherever `routingHint` lives) | Optional: add a hint that l0158 acts as an outer wrapper for interaction-rich inners, so the router has a small prior when picking the inner lang. |
| RAG: l0158 training corpus | Add 2–3 examples showing l0158 source authored against a `data` shape supplied by an inner (not the inner shape itself — just l0158 source assuming `data` is bound). |

**No changes** to: items schema, GraphQL schema, MCP server, `/api/compile` proxy, fetchers, storage, UI. Composition is invisible above `generateCode()`.

## Mechanism (end-to-end, l0158 + l0166 example)

User picks lang=0158, prompt = "create a budget spreadsheet assessment as a Learnosity custom question."

1. `generateCode({ lang: '0158', prompt })` — single-lang generation as today.
2. Sonnet emits `NEEDS_INNER: "table with 3 columns (category / amount / details), 9 rows including header, with 'expected' assess values on percentage-of-income rows"`.
3. Generator parses the signal, calls `planInnerForRequest({ userRequest, innerNeed, outerLang: '0158' })`. Router (Haiku, with current `listLanguages()` catalog and `routingHint` strings) returns `{ inner: { lang: '0166', prompt: <innerNeed> } }`.
4. Generator recursively invokes its own single-lang path for the inner step → l0166 RAG, l0166 prompt, l0166 compile → `tInner`.
5. Generator re-invokes the outer generation with the inner's prompt context resolved (Sonnet sees: "the inner content is now available as `data`") and compiles → `tOuter`.
6. Return `{ src: outerSrc, taskId: "${tOuter}+${tInner}", lang: '0158', ... }`. The compile of `tOuter+tInner` at api.graffiticode.org will compile l0166 first, feed the result as `data` to l0158, and l0158's compiler composes the final question object (matching the example payload in the original prompt).

## Critical Files to Read Before Implementing

- `src/lib/code-generation-service.ts` — confirm where the OUT_OF_SCOPE branch currently sits (the spec says ~line 1450; the new NEEDS_INNER branch is parallel) and how `priorTaskId` / `data` is currently threaded into the outer generation.
- `src/lib/language-router.ts:16-100` — confirm catalog access and Haiku call shape that `planInnerForRequest` will mirror.
- `src/utils/swr/fetchers.ts:18` — confirm the chained-id slicing semantics so we emit the chain in the right order.
- L0158's existing `instructions.md` (in the L0158 language repo) — to know where `NEEDS_INNER` instruction fits and what l0158 currently says about question content.

## Open Assumptions to Validate During Implementation

1. **`generateCode()` already supports a `priorTaskId`/`data` input** that the outer step can use to author against inner-bound `data`. If not, we add it (small extension) — this is the only generator-internal API change.
2. **Inner prompt synthesis** lives in the outer lang (NEEDS_INNER carries it), not in the router. Rationale: the outer dialect knows what shape it needs better than a generic router. If during build we find Haiku does this better, we move the synthesis into `planInnerForRequest`.
3. **No need for a static composition-pairs registry** — `routingHint` strings are enough for Haiku to pick l0166 from "I need a spreadsheet-shaped data object." If the router struggles to pick correctly, fall back to a tiny declarative pairs file (`src/lib/composition-pairs.ts`) consulted before the Haiku call.
4. **Verification per step**: each step compiles independently; verification/error-correction loop runs per step using the existing logic. Composed items consume 2 compile units.

## Verification

End-to-end (browser):
1. `npm run dev`, sign in, set chat lang to 0158.
2. Prompt: "create a budget spreadsheet assessment with rows for income, rent, utilities, food, transportation, entertainment, savings, miscellaneous; assess the percentage-based rows."
3. Server logs should show: `NEEDS_INNER` detected → `planInnerForRequest` returned `inner.lang=0166` → l0166 generation+compile → l0166 taskId captured → l0158 generation+compile → final taskId is chained.
4. Response in chat renders the composed question; final taskId in the URL is `tOuter+tInner`.
5. `/items` shows a single row with `lang: 0158`. Inspect Firestore: `taskId` field is the chained string.
6. Re-fetch the item; confirm rendered question's `data.interaction` and `data.validation` shapes match the example payload in the original prompt (table type, 9 rows, expected values on percentage rows).

Edge cases:
- Prompt that doesn't need composition (e.g., "create a multiple-choice question with 4 options"): no `NEEDS_INNER` emitted → single-step path → unchanged behavior. **Regression check**.
- Inner step compile failure (l0166 invalid): generator returns error before consuming the outer compile unit; no chained id created.
- Outer step still emits OUT_OF_SCOPE after inner is built: existing OUT_OF_SCOPE branch handles it; no double-handling.
- Existing OUT_OF_SCOPE flow on a non-composition request (e.g., flashcards on l0166): unchanged — the new NEEDS_INNER branch is parallel, not in series. **Regression check**.

Lint/typecheck:
- `npm run lint && npm run typecheck` must pass.
