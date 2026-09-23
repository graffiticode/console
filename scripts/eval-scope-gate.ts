/**
 * Scope-gate eval: what does the SERVER do with a create request?
 *
 *   npm run eval:scope-gate                 # every case, 3 runs each
 *   npm run eval:scope-gate -- --only brand --runs 5
 *
 * The MCP server's `scripts/eval-routing.ts` tests the agent's pick, with create_item stubbed,
 * so it never reaches `classifyAndRoute` — the server gate that overrides that pick. This calls
 * the gate directly with the real Haiku classifier and live scope.json, and asserts the verdict:
 * stays in the picked language, reroutes, or refuses.
 *
 * The brand cases exist because the gate once refused a branded request ("take the <brand> quiz",
 * naming a survey product with the wrong noun) on the survey language's own "do NOT route a quiz
 * here" clause, and a note telling the classifier that the brand decides lost to that clause.
 * Brands now come from `gatedBy` terms (Learnosity), which pull into their family.
 *
 * The survey cases pin that rating-scale requests — Likert, NPS, stars, semantic differentials —
 * reach L0182 now that it takes them, rather than L0180 or L0174.
 *
 * Costs one Haiku call per case per run. Uses ANTHROPIC_API_KEY from .env.local (the dev key).
 */
import { config } from "dotenv";

config({ path: ".env.local" });

/** "in": stays in `lang`. "refuse": out of scope, nowhere to go. Otherwise the reroute target. */
type Want = "in" | "refuse" | string;

interface Case {
  prompt: string;
  lang: string;
  want: Want;
  tag: string;
}

const CASES: Case[] = [
  // A gate term is a brand too: it pulls into the family, and the gate picks the member.
  { tag: "brand", lang: "0180", want: "0176", prompt: "Make a Learnosity multiple choice question about photosynthesis." },
  { tag: "brand", lang: "0180", want: "0178", prompt: "Pull all items from our Learnosity item bank." },
  // Controls: no brand, so routing is exactly what it was before brands.
  { tag: "control", lang: "0180", want: "in", prompt: "Make a 5-question quiz on the water cycle." },
  { tag: "control", lang: "0182", want: "0180", prompt: "Make a quiz about team priorities." },
  { tag: "control", lang: "0180", want: "0182", prompt: "Take the team-retro survey for me." },
  // Rating scales are L0182's now, in every form.
  { tag: "survey", lang: "0180", want: "0182", prompt: "Fill in the course-feedback survey and agree with every statement." },
  { tag: "survey", lang: "0180", want: "0182", prompt: "Record a 9 for the NPS question on the course-feedback survey." },
  { tag: "survey", lang: "0174", want: "0182", prompt: "Answer the customer-satisfaction survey: satisfied with everything and four stars overall." },
  { tag: "survey", lang: "0182", want: "in", prompt: "Rate the app-usability survey as someone opening the app for the first time." },
  { tag: "survey", lang: "0182", want: "in", prompt: "Take the workplace-pulse survey, and prefer not to say wherever it lets me." },
  // ...but a rating question with a right answer is still an assessment.
  { tag: "survey", lang: "0182", want: "0180", prompt: "Make a quiz where students rate each statement true or false, with an answer key." },
  // L0183 (concept webs) holds its own requests and hands off what is not a hub-and-ring web.
  { tag: "concept", lang: "0183", want: "in", prompt: "Make a concept map of the parts of a cell where students drag three terms onto blank nodes." },
  { tag: "concept", lang: "0183", want: "in", prompt: "Create a food chain web where students label each arrow." },
  { tag: "concept", lang: "0180", want: "0183", prompt: "Make a mind map of the causes of World War I." },
  { tag: "concept", lang: "0183", want: "0171", prompt: "Make a Venn diagram comparing cats and dogs." },
  { tag: "concept", lang: "0183", want: "0180", prompt: "Make a 5-question multiple choice quiz on the water cycle." },
];

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const only = arg("--only");
const runs = Number(arg("--runs") ?? 3);

(async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY (.env.local) — without it the gate fails open and every case reads 'in'.");
    process.exit(2);
  }
  const { classifyAndRoute } = await import("../src/lib/language-router");
  const cases = CASES.filter((c) => !only || c.tag.includes(only) || c.prompt.includes(only));

  let misses = 0;
  for (const c of cases) {
    const got: string[] = [];
    for (let i = 0; i < runs; i++) {
      const r = await classifyAndRoute({ userRequest: c.prompt, currentLang: c.lang });
      got.push(r.inScope ? "in" : r.routedLang ?? "refuse");
    }
    const bad = got.filter((g) => g !== c.want).length;
    if (bad) misses++;
    // A 1-of-N miss is still a miss: routing is stochastic, and that is how a regression starts.
    console.log(
      `${bad ? "FAIL" : "PASS"}  L${c.lang} → ${c.want.padEnd(6)} ${c.prompt.slice(0, 70)}` +
        (bad ? `  — got ${got.join(", ")}` : ""),
    );
  }
  console.log(`\n${cases.length - misses}/${cases.length} cases passed on all ${runs} runs`);
  process.exit(misses ? 1 : 0);
})();
