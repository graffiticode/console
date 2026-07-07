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

## Run

```bash
npx tsx scripts/model-eval.ts --lang 0166 0158 --calibrate
```

Reports `exact` (rounded-overall match), `within±1`, `MAE`, and Spearman `ρ` of judge-vs-human on
`overall`. Treat these as the trust gate — a judge that disagrees with humans is not a usable metric.
See `*.example.json` here for a starting template.
