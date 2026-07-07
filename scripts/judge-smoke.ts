/**
 * Offline smoke test for the LLM-as-judge (src/lib/judge-service.ts).
 *
 * Exercises the judge END-TO-END with NO generation pipeline: no EVAL_API_KEY, no compile
 * server, no Firestore. It makes a few real Opus-4.8 calls (~a cent) against hardcoded
 * good/bad candidates and asserts the judge ranks them correctly and fails safe.
 *
 *   npx tsx scripts/judge-smoke.ts
 *
 * Exits non-zero on failure, so it's usable as a pre-commit / CI check. Needs ANTHROPIC_API_KEY
 * (from .env.local). This is the cheapest way to confirm the judge works before running the full
 * `model-eval --judge` sweep (which does require generation).
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { updateRAGConfig, getJudgeMode } from "../src/lib/rag-config";
import { judgeCode, judgePair } from "../src/lib/judge-service";

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("Set ANTHROPIC_API_KEY in .env.local"); process.exit(1); }
  updateRAGConfig({ enableJudge: true, judgeMode: "async" });

  const lang = "0166";
  const prompt = "Build a sheet with cells A1=10, A2=20, and A3 = the sum of A1 and A2.";
  const good = `'A1' = 10..\n'A2' = 20..\n'A3' = add(cell 'A1', cell 'A2')..`;
  const bad = `'A1' = 10..`; // ignores A2 and the requested sum

  const checks: { name: string; pass: boolean }[] = [];

  console.log("getJudgeMode() =", getJudgeMode());
  checks.push({ name: "getJudgeMode==async when enabled", pass: getJudgeMode() === "async" });

  const g = await judgeCode({ prompt, code: good, lang });
  const b = await judgeCode({ prompt, code: bad, lang });
  console.log("pointwise good.overall =", g?.overall, " bad.overall =", b?.overall);
  checks.push({ name: "pointwise returns verdicts", pass: !!g && !!b });
  checks.push({ name: "good >= bad (overall)", pass: !!g && !!b && g.overall >= b.overall });

  const p = await judgePair({ prompt, codeA: good, codeB: bad, lang });
  console.log("pairwise winner =", p?.winner, " agreed =", p?.agreed);
  checks.push({ name: "pairwise picks A (the good one)", pass: p?.winner === "A" });

  const nil = await judgeCode({ prompt, code: good, lang, apiKey: "sk-ant-invalid" });
  checks.push({ name: "bad key => null (never throws)", pass: nil === null });

  console.log("");
  for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}`);
  const ok = checks.every((c) => c.pass);
  console.log(`\nSMOKE: ${ok ? "PASS" : "FAIL"}`);
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
