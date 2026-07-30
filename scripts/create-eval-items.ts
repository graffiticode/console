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
 * IDEMPOTENT and quota-safe. Reconciles in place: an existing item for a
 * candidate has its taskId updated (a revision, not billed), an identical
 * program is left alone entirely, and only genuinely new candidates are created.
 * Items whose candidate left the label set are retired. Re-running is therefore
 * free unless the label set actually grew — unlike the original purge-and-create,
 * which charged the whole set every run because the plan gate counts cumulative
 * creates, not live items.
 *
 * Prereqs (same env as model-eval): .env.local with EVAL_API_KEY, and
 * GRAFFITICODE_APP_CREDENTIALS for prod Firestore. eval-env pins prod api/auth.
 *
 * Usage: npx tsx scripts/create-eval-items.ts [--lang 0166]
 */
import "./eval-env"; // MUST be first: prod Firestore/auth/api bootstrap before app imports

import { readFileSync, existsSync } from "fs";
import { getCredentialsForApiKey } from "../src/lib/api-credentials";
import { postTask, createItem, updateItem, parseCode } from "../src/pages/api/resolvers";
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

  // Reconcile in place rather than purge-and-recreate.
  //
  // The plan gate counts CUMULATIVE item creates for the billing period, not the
  // live item count, so deleting an item returns nothing to the quota. The old
  // purge-then-create flow therefore charged the full candidate set on every
  // re-run to achieve a net change of zero — which is exactly how this account
  // burned its monthly allowance and ended up unable to recreate the items it
  // had just deleted. Updating an existing item's taskId is a revision, which is
  // not billed (only createItem, and updateItem's no-taskId -> first-taskId
  // transition, record a billable item).
  const db = getFirestore();
  const existing = await db.collection(`users/${creds.uid}/items`)
    .where("client", "==", "eval").where("lang", "==", LANG).get();
  const byName = new Map<string, { id: string; taskId?: string }>();
  for (const d of existing.docs) {
    const data = d.data() as any;
    if (data?.name) byName.set(String(data.name), { id: d.id, taskId: data.taskId });
  }

  // The item name is the reconciliation key, so two candidates must never share
  // one. shortModel() collapses a family to "opus"/"sonnet"/"haiku", so a label
  // set containing both claude-opus-4-8 and claude-opus-5 would collide and
  // silently reconcile two candidates onto one item. Fail loudly instead.
  const nameFor = (lab: any) => `${lab.id} \u00b7 ${shortModel(lab.model || "")}`;
  const seen = new Map<string, string>();
  for (const lab of labels) {
    const n = nameFor(lab);
    const prev = seen.get(n);
    if (prev && prev !== lab.model) {
      console.error(`\nName collision: "${n}" maps to both ${prev} and ${lab.model}.`);
      console.error(`shortModel() collapses these to the same label; rename or extend it before re-running.\n`);
      process.exit(1);
    }
    seen.set(n, lab.model);
  }

  const results: any[] = [];
  let created = 0, updated = 0, unchanged = 0;
  const wanted = new Set<string>();
  for (const lab of labels) {
    if (!lab.code) { console.error(`  – skip ${lab.id}/${lab.model}: no code`); continue; }
    const name = nameFor(lab);
    wanted.add(name);
    try {
      // labels store DSL source; /task expects the parsed AST — compile first.
      const parsed = await parseCode({ lang: LANG, src: lab.code, accessToken: auth.token });
      if (parsed.errors) throw new Error(`parse: ${parsed.errors.map((e: any) => e.message).join("; ")}`);
      const code = JSON.parse(parsed.code as string);
      const taskData = await postTask({ auth, task: { lang: LANG, code }, ephemeral: false });
      const taskId = taskData?.id;
      if (!taskId) throw new Error("postTask returned no id");

      const prior = byName.get(name);
      if (prior) {
        if (prior.taskId === taskId) {
          // Tasks are content-addressed, so an identical program yields an
          // identical taskId — nothing changed and there is nothing to write.
          unchanged++;
          console.error(`  = ${name.padEnd(34)} unchanged  item=${prior.id}`);
          results.push({ id: lab.id, model: lab.model, name, taskId, itemId: prior.id, action: "unchanged" });
          continue;
        }
        // Deliberately does NOT pass `mark`: the item's mark is the human's
        // score and updateItem merges only the fields given, so omitting it
        // preserves the label. Refreshing content must never reset a score.
        await updateItem({
          auth, id: prior.id, taskId,
          help: helpFor(prompts.get(lab.id)),
          source: "eval" as any,
        });
        updated++;
        console.error(`  ~ ${name.padEnd(34)} task=${taskId}  item=${prior.id} (updated)`);
        results.push({ id: lab.id, model: lab.model, name, taskId, itemId: prior.id, action: "updated" });
        continue;
      }

      // New candidate. Seed the mark from any score the label already carries so
      // a fresh item does not sit at the default and read back as a genuine 1.
      const item = await createItem({
        auth, lang: LANG, name, taskId, client: "eval",
        mark: lab.overall != null ? Math.min(5, Math.max(1, Math.round(Number(lab.overall)))) : 1,
        help: helpFor(prompts.get(lab.id)),
      });
      created++;
      console.error(`  + ${name.padEnd(34)} task=${taskId}  item=${item.id} (created)`);
      results.push({ id: lab.id, model: lab.model, name, taskId, itemId: item.id, action: "created" });
    } catch (e: any) {
      console.error(`  \u2717 ${name.padEnd(34)} ${e?.message || e}`);
    }
  }

  // Retire items whose candidate is no longer in the label set. This is the only
  // deletion, and it removes genuinely stale rows rather than churning live ones.
  const stale = [...byName.entries()].filter(([name]) => !wanted.has(name));
  if (stale.length) {
    const batch = db.batch();
    for (const [, v] of stale) batch.delete(db.doc(`users/${creds.uid}/items/${v.id}`));
    await batch.commit();
    console.error(`\n  retired ${stale.length} item(s) no longer in the label set: ${stale.map(([n]) => n).join(", ")}`);
  }

  console.error(
    `\n${created} created, ${updated} updated, ${unchanged} unchanged` +
    `${stale.length ? `, ${stale.length} retired` : ""}  (only creates consume plan quota).`,
  );
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
