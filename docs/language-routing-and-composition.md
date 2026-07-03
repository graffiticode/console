# Language contract: routing & composition

What each Graffiticode language (`l0NNN`) must provide so the console can **route requests to
the right language** and **compose languages safely**. The model is server-authoritative:

- **Routing** decides the *head* language for a request. The client's chosen `language` is a
  hint; the server validates it against each language's `scope.json` and re-routes if wrong.
  (Clients — especially Codex/ChatGPT — freelance; routing cannot depend on them.)
- **Composition** is governed by an explicit per-language `composesWith` allowlist (the hard
  fence). The server's planner may only propose edges within it; the client never composes.

Both decisions are only as good as the metadata each language publishes. This doc enumerates
that metadata, per language.

---

## 1. Every language: `scope.json` (the routing contract)

Served at `https://l<id>.graffiticode.org/scope.json`; the console fetches it in
`listLanguages()` (cached ~5 min). The pre-flight router (`classifyAndRoute` in
`src/lib/language-router.ts`) hands the current language's scope + a catalog of the others to a
classifier that decides in-scope vs. re-route.

Required fields:

- **`summary`** — one sentence: what this language *authors*. Do **not** over-claim adjacent
  domains. (Lesson: L0166 led with "spreadsheet-based **assessment**," which made the router
  judge ELA assessment items in-scope for a spreadsheet. It now leads with "interactive
  spreadsheets.")
- **`in_scope`** — concrete, specific capabilities. Specific beats broad: it both helps the
  router land *here* for the right requests and keeps it from landing here for the wrong ones.
- **`out_of_scope`** — the load-bearing field for routing accuracy. List **domain boundaries**,
  not just architectural exclusions. Explicitly disclaim the adjacent things this language could
  be *mistaken* for. Ask: "what would a confused client wrongly send here?" and name it.
  - Good: *"Authoring assessment items/questions as content — reading-comprehension/ELA items,
    MCQ/EBSR/short-answer, passages, stems, answer keys. L0166 authors a spreadsheet
    interaction, not question items."*
  - Weak: only listing "pivot tables, external imports, host embedding" (architectural).

**Rule of thumb:** the clearer a language *owns* its niche (`summary`/`in_scope`) and *disowns*
its neighbors (`out_of_scope`), the more deterministic routing becomes. The classifier is an LLM
with a logged fail-open — the scope contract is the determinism lever, not prompt tuning.

## 2. Every language: console registration

Add an entry to `LANGUAGES` in `src/lib/languages.ts`:

- `id`, `name`, `description`, `domains` — basic catalog fields.
- `routingHint` — fallback descriptor used before `scope.json` is fetched (cold start).
- `status` — `"Beta"`, `"Internal"`, etc.
- `internal: true` — for non-authoring dialects (e.g. the L0010 planner, L0013). Internal
  dialects are excluded from routing targets and never proposed as composition upstreams.
- `composesWith` — see §4.

`domains` is an attractor: don't tag a language into a domain (e.g. `"assessments"`) it only
*supports* indirectly — that draws mis-routes. (L0166 stays in `assessments` because it embeds
into Learnosity assessments, but its `scope.json` must then disclaim *authoring* assessment
items.)

## 3. Every language: out-of-scope sentinel (secondary net)

The generation instructions (`instructions.md`) already carry an "Out-of-Scope Detection"
block: if a request is clearly outside the dialect, emit `OUT_OF_SCOPE: <reason>` instead of
generating. This is the **backstop** behind the pre-flight router (it fires if routing missed).
Keep it. It's biased toward "when in doubt, generate," so it is not a substitute for a sharp
`scope.json`.

---

## 4. Composition: declare your edges (`composesWith`)

The permission matrix is the **hard fence** — composition can only happen along declared edges.
Set `composesWith` on the language's `LANGUAGES` entry (`src/lib/languages.ts`). Enforced by
`composesWithFor` + `fenceComposition` in `src/lib/language-router.ts`.

- **Explicit list** (`composesWith: ["0166"]`) — may compose ONLY with those upstreams. Use for
  widget-embedding hosts (e.g. L0158 embeds the L0166 spreadsheet as a Learnosity `custom`
  question).
- **Explicit data-consumer list** (e.g. L0173 charts → `composesWith: ["0170"]`) — a consumer that
  binds upstream data names exactly the provider(s) it pulls from. (L0173 is deliberately
  over-constrained to the one data-sourcing dialect, L0170, for now, rather than `["*"]`.)
- **`["*"]`** — *may* compose with any non-internal authoring language; the broad wildcard. Use
  only when a host genuinely consumes from anything. Prefer an explicit list — `["*"]` is a wide
  trust grant.
- **Absent / empty** — **atomic only.** No composition. This is the default and correct for most
  languages (e.g. L0175 ELA — it never composes; it authors complete items itself).

The planner (`planSequence`/`planComposition`) decides *whether* to compose within the fence;
any upstream it proposes that isn't permitted is dropped (the whole sequence falls back to
atomic rather than posting a partial/broken chain).

> Today `composesWith` lives in the console's static `LANGUAGES`. Adding a composition edge is a
> console change, not a language-repo change. (Planned: move it into each `scope.json` so
> languages self-declare.)

## 5. Composition — as a HEAD (consumer)

If your language consumes an upstream (it's in someone's pipeline as stage 0):

- **Reliably emit the binding.** The head MUST author `data use "<lang>"` (where `<lang>` is the
  upstream id) so the upstream's compiled output flows in at runtime. A head that describes the
  embedded content but omits the binding renders an **empty** interaction.
  - Make this a **hard requirement** in `instructions.md`, with a finish-time self-check —
    not a soft "preferred." (Lesson: L0158 dropped the `data use "0166"` binding ~40% of the
    time, forcing the console's repair pass to regenerate the head.)
- The console verifies the binding post-parse and runs **one repair** (regenerate the head with a
  strengthened directive) if it's missing; if it still can't bind, it fails with an actionable
  error rather than posting a broken chain. The repair is a safety net — don't rely on it;
  binding-first-try is the goal.
- The surrounding `custom`/embed node's `lang` should equal the `use` argument.

## 6. Composition — as an UPSTREAM (provider)

If your language feeds a head (data provider or embeddable widget):

- **Produce a consumable, schema-stable data model.** The head binds your output via the
  base-language `data {}` primitive; a stable shape is what makes the edge work.
- Publish a `schema.json` the console can fetch (the reactive path reads `L<lang>/schema.json`
  when generating the upstream).
- Render sensibly **standalone** too (with empty `data {}`), so the upstream task previews on its
  own before it's chained.

## 7. Cross-language reuse (`get_spec`)

`get_spec` produces a platform-neutral English spec of an item so its content can be re-authored
in another language. For this to be faithful, your language must provide:

- **Lexicon** (`getLanguageLexicon`) and **unparse-hints** (`getLanguageHints`) — `get_spec`
  decompiles the AST via `unparse(code, lexicon, { hints })`. Missing/empty lexicon or hints →
  low-fidelity spec.
- **`instructions.md`** — reused (canonical semantics) by the spec generator.
- Keep authored content as readable string literals in the AST where possible — the spec's
  fidelity guard checks that salient authored strings survive into the spec.
- **`spec-directive.md`** (OPTIONAL, `getLanguageSpecDirective`) — overrides the global
  content-oriented `SPEC_DIRECTIVE` so a dialect can shape what `get_spec` emits. Absent → the
  global directive is used (unchanged). Used by the developer-integration "oracle" dialects (e.g.
  L0177) to emit a language-neutral **recipe** — goal, preconditions, procedure, gotchas,
  acceptance criteria — instead of a content description.

## 8. Operational notes

- **Caching:** `scope.json` and language docs are cached in the console ~5 min. After you change
  a language's `scope.json`/`instructions.md`, **redeploy that `l0NNN` service** (`npm run
  gcp:build`), then allow the console's fetch-cache TTL to lapse before the change takes effect.
- **Verify routing** via `npm run gcp:logs`: look for
  `[routing] … preflight.reroute from=… to=…` (re-route happened),
  `[routing] … scope-gate … inScope=…` (every decision), and
  `[composition] … head=L… permits=[…] sequence=…` (composition fence outcome).
- **Kill switches:** `SCOPE_GATE_ENABLED=false` disables routing; `COMPOSITION_ENABLED=false`
  forces everything atomic.

---

## Quick checklist per language

| Concern | Provide |
| --- | --- |
| **Routing in** | sharp `scope.json` `summary` + `in_scope`; accurate `domains`/`routingHint` |
| **Routing out** | `out_of_scope` naming the adjacent things you'd be mis-sent (domain boundaries) |
| **Backstop** | `OUT_OF_SCOPE:` sentinel in `instructions.md` |
| **Compose: allowed?** | `composesWith` on the `LANGUAGES` entry (explicit list e.g. `["0166"]` / `["0170"]` / `["*"]` wildcard / omit ⇒ atomic) |
| **Compose: as head** | `instructions.md` makes `data use "<lang>"` a REQUIRED binding + self-check |
| **Compose: as upstream** | stable data model + `schema.json`; renders standalone with empty `data {}` |
| **Cross-language** | lexicon + unparse-hints + `instructions.md` for `get_spec` |
| **Internal dialect** | `internal: true` in `LANGUAGES` (excluded from routing & composition) |
