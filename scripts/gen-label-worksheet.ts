/**
 * gen-label-worksheet.ts — emit a human-readable labeling worksheet for a dialect:
 * the scoring anchors up top, then each case's prompt (intent) with every candidate
 * program side by side, so a labeler can score overall 1–5 by eye. Reads the same
 * two files calibration uses — data/model-eval/labels/<lang>.json (id, model, code)
 * and data/model-eval/<lang>.json (prompts) — so the worksheet never drifts.
 *
 * Output: data/model-eval/labels/label-review-<lang>.md (gitignored, local).
 * Scores still go in labels/<lang>.json (or via the item mark → pull-eval-labels).
 *
 * Usage: npx tsx scripts/gen-label-worksheet.ts [--lang 0166]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";

const LANG = (() => {
  const i = process.argv.indexOf("--lang");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : "0166";
})();

const ANCHORS = `# L${LANG} labeling worksheet

Score each candidate **overall 1–5** (in \`data/model-eval/labels/${LANG}.json\`, or by setting the
item mark in the console eval tab → \`pull-eval-labels\`). Be discriminating: compile/render is
saturated, so "it renders" is a **2, not a free 3**. Anchor to intent + correctness.

| overall | meaning |
|---|---|
| **1** | Broken or off-task — doesn't render, or renders something unrelated to the intent. |
| **2** | Renders but **wrong** — misses the core ask or gets the central logic wrong. |
| **3** | On-intent but **materially flawed** — a requirement missing or an incorrect formula a user would notice. |
| **4** | Correct and complete, **minor** issues — polish only (values-as-text, missing formatting, awkward structure). |
| **5** | Correct, complete, idiomatic — does exactly what was asked; nothing you'd change. |

Rules of thumb: **1 broken · 2 runs-but-wrong · 3–5 on-intent quality gradient.** Correctness
dominates — a clean sheet that computes the wrong value is a 2–3, never a 4. Label stricter than the
judge and spread the range.
`;

function main() {
  const labelsPath = `data/model-eval/labels/${LANG}.json`;
  const setPath = `data/model-eval/${LANG}.json`;
  if (!existsSync(labelsPath)) { console.error(`No labels at ${labelsPath}`); process.exit(1); }
  const labels = JSON.parse(readFileSync(labelsPath, "utf8")) as any[];
  const prompts = new Map<string, string>(
    (existsSync(setPath) ? JSON.parse(readFileSync(setPath, "utf8")) : []).map((c: any) => [c.id, c.prompt]),
  );

  // Group candidates by case id, preserving first-seen order.
  const byCase = new Map<string, any[]>();
  for (const l of labels) (byCase.get(l.id) ?? byCase.set(l.id, []).get(l.id)!).push(l);

  const parts: string[] = [ANCHORS];
  for (const [caseId, cands] of byCase) {
    parts.push(`\n## ${caseId}\n`);
    const prompt = cands[0]?.prompt || prompts.get(caseId);
    if (prompt) parts.push(`**Prompt:** ${prompt}\n`);
    for (const c of cands) {
      parts.push(`### ${c.model || "candidate"}\n`);
      parts.push("```\n" + (c.code ?? "(no code)") + "\n```\n");
    }
  }

  const out = `data/model-eval/labels/label-review-${LANG}.md`;
  writeFileSync(out, parts.join("\n"));
  console.log(`Wrote worksheet (${byCase.size} cases, ${labels.length} candidates) → ${out}`);
}

main();
