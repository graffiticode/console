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
 * The brand cases exist because the gate once refused "Take the Mystic Wonk quiz" on L0182's own
 * "do NOT route a quiz here" clause, and a note telling the classifier that the brand decides
 * lost to that clause. Refusals are asserted as firmly as pulls: "Mystic Wonk concept web" must
 * come back refused, never handed to L0169.
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
  // A named brand pulls the request, whatever noun it uses.
  { tag: "brand", lang: "0180", want: "0182", prompt: "Make a Mystic Wonk quiz about what our team should prioritize next quarter." },
  { tag: "brand", lang: "0180", want: "0182", prompt: "Take the Mystic Wonk quiz on team priorities at https://example.com/ideas.json" },
  { tag: "brand", lang: "0182", want: "in", prompt: "Take the Mystic Wonk team-priorities quiz for me." },
  { tag: "brand", lang: "0180", want: "0182", prompt: "Answer the mystic wonk test about office improvements." },
  { tag: "brand", lang: "0174", want: "0182", prompt: "Fill in the Mystic Wonk questionnaire on remote work." },
  // ...and is refused when it asks the brand for a different kind of artifact.
  { tag: "brand", lang: "0169", want: "refuse", prompt: "Create a Mystic Wonk concept web about the water cycle." },
  { tag: "brand", lang: "0182", want: "refuse", prompt: "Create a Mystic Wonk concept web about the water cycle." },
  { tag: "brand", lang: "0182", want: "refuse", prompt: "Make a Mystic Wonk mind map of our team's ideas." },
  { tag: "brand", lang: "0173", want: "refuse", prompt: "Make a Mystic Wonk bar chart of the survey results." },
  { tag: "brand", lang: "0179", want: "refuse", prompt: "Make a Mystic Wonk spreadsheet of team budgets." },
  { tag: "brand", lang: "0181", want: "refuse", prompt: "Make MysticWonk flashcards for the survey ideas." },
  // A gate term is a brand too: it pulls into the family, and the gate picks the member.
  { tag: "brand", lang: "0180", want: "0176", prompt: "Make a Learnosity multiple choice question about photosynthesis." },
  { tag: "brand", lang: "0180", want: "0178", prompt: "Pull all items from our Learnosity item bank." },
  // Controls: no brand, so routing is exactly what it was before brands.
  { tag: "control", lang: "0180", want: "in", prompt: "Make a 5-question quiz on the water cycle." },
  { tag: "control", lang: "0182", want: "0180", prompt: "Make a quiz about team priorities." },
  { tag: "control", lang: "0180", want: "0182", prompt: "Take the team-priorities survey at https://example.com/ideas.json" },
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
