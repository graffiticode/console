# Language style: member lists, not chained attributes

How to encode a language's attributes when you are building a new `l0NNN` dialect. This is the
style L0176 uses and the one to copy; L0166 shows the older chained style, which is still
correct for what it does. The audience is whoever (or whatever) is authoring a new language —
the decision described here is made once, early, and is expensive to reverse, because it
changes every program the dialect will ever have in its RAG corpus.

Companion to `language-routing-and-composition.md`, which covers what a language must publish
(`scope.json`, `composesWith`) rather than how its source looks.

---

## 1. The two encodings

**Chained (arity 2).** Every attribute word takes its value *and the rest of the program*, so a
program is a right-nested chain terminated by `{}`. L0166:

```
cell "A1" text "Total" background-color "#eee" font-weight "bold" assess [
  method "value" expected "836" points 2
] {}
```

`cell`, `text`, `background-color`, `font-weight`, `assess` are all `arity: 2`. Only the three
words inside the `assess` brackets — `method`, `expected`, `points` — are `arity: 1`.

**Member lists (arity 1).** Every attribute word takes exactly one argument and evaluates to a
single-key record. A `[...]` list of them merges into one object. L0176:

```
choicematrix [
  stimulus "Mark each statement True or False."
  stems [ "The Bill of Rights is the first ten amendments" "The President can declare war" ]
  options [ "True" "False" ]
  validation [
    scoring-type "partialMatch"
    valid-response [ score 1 value [[0] [1]] ]
  ]
]
```

Nothing here is chained. `stimulus`, `stems`, `options`, `validation`, `scoring-type`,
`valid-response`, `score`, `value` are all `arity: 1` members, and the same word means the same
thing at any depth.

**The style is a hybrid, and arity 2 is not vestigial.** Two roles genuinely need a second
argument, and they are different from each other.

**A container with configuration.** This is the case that earns arity 2 in this style: a word
that takes *a list of child elements* **and** *its own configuration attributes*.

```
questions [q1 q2 q3] {a1 a2 a3}
```

The list is the children; the braces are a record of attributes belonging to the container
itself. L0176's `QUESTIONS` merges the two, with computed fields winning:

```js
const continuation = toPlainObject(v1);                 // the {…} record
const val = { ...continuation, ...questionsResult };    // merged into the result
```

So `{}` is the *empty* configuration, not a terminator — which is why real programs are full of
`items [...] {}` and `questions [...] {}`. A member list cannot express this shape: a member is
one key applied to one value, and here the word needs two argument roles that mean different
things.

**Binding into the environment.** `set-var` takes a name and a value and writes
`options[name] = value`:

```js
SET_VAR(node, options, resume) {
  this.visit(node.elts[0], options, (e0, v0) => {       // the name
    this.visit(node.elts[1], options, (e1, v1) => {     // the value
      options[v0] = v1;
      resume([...e0, ...e1], v1);
    });
  });
}
```

Note where the scope comes from: `options` is one mutable object threaded through the entire
traversal, and a program is a *sequence* of expressions. The binding is visible to everything
that follows because of that, not because the word swallows the rest of the program as an
argument.

```
set-var "lrn-id" get-val-public "itemId"
items [ item [ questions [ mcq [ … ] ] {} ] ] {}..
```

Descendants read `options["lrn-id"]`. You will need this for anything the whole program must
see — ids, credentials, render-time parameters — and it cannot be a member, because a member's
value lands in the record its list merges into, never in the environment. Prefer reusing the
base language's `set-var` over minting a dialect-specific binding word: L0176 carried an `id`
alias for exactly this key, and it went unused in all 169 training examples before being
removed.

**The rule.** A word is a member (arity 1) unless it needs a second argument role — children
*plus* configuration, or a name *plus* a value to bind. Everything that merely describes a
value is a member.

Worth seeing how the older style differs, since the two look identical in the grammar. In
L0166 the second argument is the *accumulating record*: `TEXT` returns `{ ...v1, text: v0 }`,
so each attribute prepends itself onto the record built by the words after it, and `{}` closes
the chain. Same `(value, record)` shape, entirely different meaning — and it is why every
attribute word in that dialect has to be arity 2.

---

## 2. The whole surface syntax, in three rules

An author (usually an LLM) needs exactly this much to write any attribute:

| Target shape | How it is written |
| :----------- | :---------------- |
| object | a member list — `validation [scoring-type "exactMatch"]` |
| array of objects | a list of member lists — `alt-responses [[value ["a"]] [value ["b"]]]` |
| scalar, or array of scalars | the value itself — `case-sensitive false`, `options ["True" "False"]` |

Three rules, no per-attribute syntax to memorize. That is the payoff of the style and the
reason to prefer it: the instructions file can state the mapping once instead of documenting a
shape per word, and the generator's job collapses to "name the field, give it its value."

---

## 3. Why this style

- **One word, any depth.** `value` inside `valid-response` and `value` inside an mcq option are
  the same arity-1 word. Under chaining they would be separate positional constructs.
- **The source mirrors the target 1:1.** Each word is the kebab-case spelling of the field it
  emits, nesting the way that field nests. There is no translation table for the generator to
  get wrong, and a reviewer can diff source against target by eye.
- **Handlers are generated, not written.** Adding an attribute is a row in a data table, not a
  new Checker method plus a new Transformer method. L0176 carries 132 attribute words this
  way; hand-writing pairs for them would be 264 near-identical methods.
- **It makes attribute legality checkable.** Because every member is a single-key record keyed
  by field name, a container can compare the keys it received against the set it accepts. That
  check is the single highest-value thing in this document — see §5.

---

## 4. The machinery

Reference implementation: `l0176/packages/core/`. Four pieces.

**4.1 Lexicon — a flat global vocabulary.** Every attribute is
`{ tk: 1, name: "UPPER_SNAKE", cls: "function", length: 1, arity: 1 }`. The lexicon is *not*
where you scope which container accepts which word; it is global on purpose, so the same word
works everywhere it legitimately appears. (`lexicon.ts`)

**4.2 A member table — name → field + shape.** One row per word:

```ts
export const memberFields: Record<string, { field: string; shape?: MemberShape }> = {
  STIMULUS:       { field: "stimulus" },                          // scalar, pass through
  VALIDATION:     { field: "validation",   shape: "object" },      // merge the member list
  ALT_RESPONSES:  { field: "alt_responses", shape: "objectArray" },// merge each member list
  OPTIONS:        { field: "options",      shape: "infer" },       // decided by element type
};
```

`infer` exists for words the target gives different types on different containers. L0176 uses
it for `options` and `value`; the readings are mutually exclusive by element type (members →
one object, member lists → array, lists of members → array of arrays), so nothing is guessed.
Reach for it only when the target forced your hand. (`question-types.ts`)

**4.3 Generated handlers.** Loop the table and install both methods:

```ts
// Checker: walk the child expression only. Value validation does NOT go here — see §5.1.
for (const name of Object.keys(memberFields)) {
  Checker.prototype[name] = function (node, options, resume) {
    this.visit(node.elts[0], options, (e0) => resume([].concat(e0 || []), node));
  };
}

// Transformer: return a single-key record; whatever encloses it merges the list.
for (const [name, meta] of Object.entries(memberFields)) {
  Transformer.prototype[name] = function (node, options, resume) {
    this.visit(node.elts[0], options, (e0, v0) => {
      /* apply meta.shape to v0 */
      resume(err, { [meta.field]: value });
    });
  };
}
```

**4.4 `mergeMembers` — merge, or throw.** Containers fold a member list into one object.
Malformed entries must be a compile error, never a silent drop:

```ts
export function mergeMembers(members: any, where: string) {
  if (!Array.isArray(members)) {
    throw new Error(`${where}: expected a member list in [brackets], e.g. [score 1 value "x"].`);
  }
  const out = {};
  for (const m of members) {
    if (m == null || typeof m !== "object" || Array.isArray(m)) {
      throw new Error(`${where}: every entry must be an attribute applied to a value, e.g. [score 1 value "x"].`);
    }
    Object.assign(out, m);
  }
  return out;
}
```

Note `Object.assign`: a repeated key silently wins. Decide deliberately whether a duplicate
member is an error in your dialect; if it is, check before assigning.

---

## 5. The three traps

Each of these has actually bitten a shipped language. They are properties of the style, not
mistakes anyone made twice.

### 5.1 `Checker.LIST` visits only the first element

In the base compiler (`basis/src/compiler.js`, and identically in L0000):

```js
LIST(node, options, resume) {
  if (node.elts.length === 0) { resume([], node); }
  else { this.visit(node.elts[0], options, (e0) => resume([].concat(e0), node)); }
}
```

`Transformer.LIST` visits every element; `Checker.LIST` visits **only `elts[0]`**. So a
validation rule written as a Checker method fires only for the first member of any list.
L0166 hit this exactly: a Checker rule rejecting negative `points` did nothing in
`assess [method … expected … points -1]`, which compiled clean with `points: -1`.

**Consequence for the style: put value validation in the Transformer**, where the values are
known and every member is visited. L0176's generated Checker methods deliberately do nothing
but walk the child.

If you truly need a Checker-time rule, have the *container's* Checker walk its own list.
Do not override `LIST` globally to visit all elements: it will newly surface errors that were
previously swallowed everywhere else in the language, and existing programs that compiled will
stop compiling.

### 5.2 Open records swallow misplaced attributes

A member list merges whatever it is handed. An attribute written one level too high lands in
the wrong object, and most targets ignore unknown fields silently — so it compiles, renders,
and quietly does not do what it says. L0176 shipped this for a while at the block levels:
`item [instant-feedback true questions [...] {}]` compiled clean and had no effect.

**The fix is an explicit allowed-set per container, and an error that names it:**

```ts
function assertKnownAttributes(type, key, attrs) {
  const allowed = validAttributes[key];
  if (!allowed) return;
  const unknown = Object.keys(attrs).filter((k) => !allowed.includes(k));
  if (!unknown.length) return;
  throw new Error(`${type}: \`${unknown[0]}\` is not an attribute of ${type}. It takes: ${allowed.join(", ")}.`);
}
```

Do this for block levels too, not just leaf containers — that is where it was missed.

### 5.3 The compiler's error message is a product surface

The generator is an LLM that reads your compiler's output and tries again. A message that
names what is legal, and where the misplaced attribute belongs, is worth more than any amount
of prompt text. L0176's:

> `choicematrix: `scoring-type` is not an attribute of choicematrix. It takes: feedback-attempts, instant-feedback, …, validation. `scoring-type` belongs inside `validation`, e.g. validation [valid-response [score 1 value "x"]].`

That message plus a one-line correction to the instructions took a deterministic failure
(0 of 3 trials on a fast model) to 10 of 10, permanently and for every model. Budget real
effort here: the "misplaced, and here is where it goes" hint is the highest-leverage half.

---

## 6. Checklist for a new language

1. Decide the split. A word is `arity: 2` only if it needs two argument roles: a child list
   *plus* configuration (`questions [q1 q2 q3] {a1 a2 a3}`), or a name *plus* a value to bind.
   Everything else is `arity: 1` — a member. Default to member, and reuse the base language's
   `set-var` rather than minting your own binding word.
2. Name every member word as the kebab-case spelling of the field it emits. Do not invent
   friendlier names — the 1:1 mapping is the feature.
3. Write the member table (`field` + `shape`); generate Checker and Transformer methods from
   it. Do not hand-write per-attribute pairs.
4. Put value validation in the Transformer (§5.1).
5. Define an allowed-attribute set for every container, blocks included, and make the
   violation message name the legal set and the likely correct location (§5.2, §5.3).
6. Document the three shape rules once in `instructions.md`, then document per-word meaning —
   not per-word syntax.
7. Add a spec test that compiles (not merely parses) every program fragment in your docs.
   L0176's `docs.test.ts` catches stale examples before the generator learns them; a wrong
   example in `instructions.md` is reproduced verbatim into generated programs.

---

## 7. When the chained style is still right

This is not a blanket deprecation. Chaining suits a **flat stream of positioned elements**,
which is what L0166 is: cells, rows, and columns in sequence, each with a handful of
presentation attributes and no deep nesting. Twenty-five chained words there are perfectly
legible.

Member lists win when the target is a **nested document with a different attribute set per
node** — Learnosity items, and most JSON APIs. If you find yourself wanting the same attribute
word at two different depths, or writing a positional construct per nesting level, you want
members.

Conversion can be incremental: L0176 converted one question type at a time, with the lexicon
carrying both the old flat spellings and the aligned vocabulary during the transition, and
`validAttributes` enforcing only the converted types. A dialect does not have to switch in one
change — but a *new* dialect should start here.
