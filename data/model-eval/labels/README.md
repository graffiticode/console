# Judge calibration labels

Hand-labeled ground truth for calibrating the LLM-as-judge (`src/lib/judge-service.ts`) before its
scores are trusted. An LLM judge is only as good as its agreement with humans — run calibration and
record the number before wiring any inline gate/selector or believing aggregate judge numbers.

## Format

`data/model-eval/labels/<lang>.json` — a JSON array of labeled candidates:

```json
[
  {
    "id": "invoice-tax-discount",
    "code": "<the generated Graffiticode program to judge>",
    "overall": 4,
    "correctness": 4,
    "instructionFollowing": 5,
    "idiomaticity": 4
  }
]
```

- `id` matches a case in `data/model-eval/<lang>.json` (the prompt/intent is pulled from there;
  or set `prompt` on the label to override).
- `code` is the candidate program a human scored (paste a real generation, e.g. from a
  `model-eval.json` run's `runs[].code`).
- `overall` is the human 1–5 score used for agreement. The per-dimension scores are optional.
- Rows with `overall: null` or no `code` are skipped — fine as templates.

Aim for ~10 labeled candidates to start (the existing eval sets are 0166: 6 cases, 0158: 4 cases —
label one generation each, or a mix of good and bad ones to spread the score range).

## Scoring anchors (be discriminating)

Compile/render is **saturated** (~100%) — it is table stakes, not quality. So "it renders" earns a
**2, not a free 3**; otherwise the usable scale collapses to 3–5 and every candidate starts
"above average" — the exact generosity the judge already shows. Anchor `overall` to **intent
satisfaction and correctness**, not to whether it runs. Correctness dominates: a clean sheet that
computes the wrong tax is a 2–3, never a 4.

| overall | meaning |
|---|---|
| **1** | Broken or off-task — doesn't render, or renders something unrelated to the intent. |
| **2** | Renders but **wrong** — misses the core ask or gets the central logic wrong (e.g. flat rate where marginal tiers were asked). "It runs, but it's not the thing requested." |
| **3** | On-intent but **materially flawed** — one requirement missing or one incorrect formula a user would notice (e.g. tax applied to the pre-discount subtotal). |
| **4** | Correct and complete, **minor** issues — right logic and all requirements, but polish problems (numbers stored as text, missing `$` formatting, awkward structure). |
| **5** | Correct, complete, idiomatic — does exactly what was asked; nothing you'd change. |

Two rules of thumb:
- **1 = broken, 2 = runs-but-wrong, 3–5 = on-intent quality gradient.**
- **Label stricter than the judge, and spread the range.** The human labels are the antidote to a
  generous judge — if you also anchor high, calibration can't detect the inflation (low MAE / stable
  ρ hide it). Deliberately include weak generations so labels span 2–5; spread matters more than
  volume. Don't tune the judge to match until *after* you've measured the gap.

## Run

```bash
npx tsx scripts/model-eval.ts --lang 0166 0158 --calibrate
```

Reports `exact` (rounded-overall match), `within±1`, `MAE`, and Spearman `ρ` of judge-vs-human on
`overall`. Treat these as the trust gate — a judge that disagrees with humans is not a usable metric.
See `*.example.json` here for a starting template.
