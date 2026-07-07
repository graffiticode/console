/**
 * create-eval-items.ts — materialize the hand-label candidates as reviewable
 * console items in the EVAL account (prod), so the exact Sonnet/Opus generations
 * being calibrated can be eyeballed/rendered in /items instead of only as raw
 * code in data/model-eval/labels/<lang>.json.
 *
 * For each labeled candidate: post its EXACT code to api.graffiticode.org (a
 * persistent task → renderable taskId), then write an item doc under the eval
 * account tagged `client: 'eval'` (the /items "App" chip filters on `client`,
 * so these surface under an "eval" tab, out of the default console view).
 *
 * NOT idempotent — re-running creates fresh item docs. Run once.
 *
 * Prereqs (same env as model-eval): .env.local with EVAL_API_KEY, and
 * GRAFFITICODE_APP_CREDENTIALS for prod Firestore. eval-env pins prod api/auth.
 *
 * Usage: npx tsx scripts/create-eval-items.ts [--lang 0166]
 */
import "./eval-env"; // MUST be first: prod Firestore/auth/api bootstrap before app imports

import { readFileSync, existsSync } from "fs";
import { getCredentialsForApiKey } from "../src/lib/api-credentials";
import { postTask, createItem, parseCode } from "../src/pages/api/resolvers";
import { getFirestore } from "../src/utils/db";

const LANG = (() => {
  const i = process.argv.indexOf("--lang");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : "0166";
})();

const shortModel = (m: string) =>
  m.includes("opus") ? "opus" : m.includes("sonnet") ? "sonnet" : m.includes("haiku") ? "haiku" : m;

async function main() {
  const apiKey = process.env.EVAL_API_KEY;
  if (!apiKey) { console.error("Set EVAL_API_KEY (the eval account's api key) in .env.local"); process.exit(1); }

  const path = `data/model-eval/labels/${LANG}.json`;
  if (!existsSync(path)) { console.error(`No labels at ${path}`); process.exit(1); }
  const labels = JSON.parse(readFileSync(path, "utf8")) as any[];

  // Prompt (intent) per case, from the eval set — surfaced in each item's help dialog.
  const setPath = `data/model-eval/${LANG}.json`;
  const prompts = new Map<string, string>(
    (existsSync(setPath) ? JSON.parse(readFileSync(setPath, "utf8")) : [])
      .map((c: any) => [c.id, c.prompt]),
  );
  const helpFor = (prompt?: string) =>
    prompt ? JSON.stringify([{ user: prompt, type: "user", timestamp: new Date().toISOString() }]) : "[]";

  const creds = await getCredentialsForApiKey(apiKey);
  const auth = { token: creds.idToken, uid: creds.uid };
  console.error(`[create-eval-items] lang=${LANG}  ${labels.length} candidates → account ${creds.uid}  client='eval'\n`);

  // Idempotency: delete any existing client='eval' items for this lang first, so
  // re-running doesn't accumulate duplicate item docs (tasks are content-addressed).
  const db = getFirestore();
  const existing = await db.collection(`users/${creds.uid}/items`)
    .where("client", "==", "eval").where("lang", "==", LANG).get();
  if (!existing.empty) {
    const batch = db.batch();
    existing.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.error(`[create-eval-items] purged ${existing.size} pre-existing client='eval' lang=${LANG} items\n`);
  }

  const results: any[] = [];
  for (const lab of labels) {
    if (!lab.code) { console.error(`  – skip ${lab.id}/${lab.model}: no code`); continue; }
    const name = `${lab.id} · ${shortModel(lab.model || "")}`;
    try {
      // labels store DSL source; /task expects the parsed AST — compile first.
      const parsed = await parseCode({ lang: LANG, src: lab.code, accessToken: auth.token });
      if (parsed.errors) throw new Error(`parse: ${parsed.errors.map((e: any) => e.message).join("; ")}`);
      const code = JSON.parse(parsed.code as string);
      const taskData = await postTask({ auth, task: { lang: LANG, code }, ephemeral: false });
      const taskId = taskData?.id;
      if (!taskId) throw new Error("postTask returned no id");
      const item = await createItem({ auth, lang: LANG, name, taskId, client: "eval", help: helpFor(prompts.get(lab.id)) });
      console.error(`  ✓ ${name.padEnd(34)} task=${taskId}  item=${item.id}`);
      results.push({ id: lab.id, model: lab.model, name, taskId, itemId: item.id });
    } catch (e: any) {
      console.error(`  ✗ ${name.padEnd(34)} ${e?.message || e}`);
    }
  }
  console.error(`\nCreated ${results.length}/${labels.length} items under client='eval'.`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
