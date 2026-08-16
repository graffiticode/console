/**
 * verify-0178-corpus.ts — check generated L0178 (Data API cookbook) items before marking them.
 *
 * Same contract as verify-0177-corpus: verify and mark in ONE run, so nothing gets marked that did
 * not pass. The checks differ because the dialect does:
 *   lang      — L0177 and L0178 are siblings over the same nouns (items, banks, tags, status), so
 *               a mis-route is the failure mode to watch. An L0178 job that lands on 0177 is the
 *               same class of bug as the activity-list prompts that landed on 0170.
 *   head      — a job is `data-job`, not `author-embed`
 *   block     — exactly one of items-get / responses-get; a program with neither is not a job
 *   invented  — no string literal the prompt never supplied
 */
import "./eval-env";
import { unparse } from "@graffiticode/parser";
import { getLanguageLexicon } from "../src/lib/api";
import { getFirestore } from "../src/utils/db";

const UID = process.env.CORPUS_UID || "24493e1c7a7f1ad57e3c478087c74c2dacb0cba1";
const MARK = process.argv.includes("--mark");
const BLOCKS = ["items-get", "responses-get"];

async function main() {
  const prompts: Record<string, string> = JSON.parse(process.argv[2] || "{}");
  const lex = await getLanguageLexicon("0178");
  const db = getFirestore();
  const rows: Array<{ name: string; id: string; ok: boolean; why: string }> = [];

  for (const [name, prompt] of Object.entries(prompts)) {
    const snap = await db.collection(`users/${UID}/items`).where("name", "==", name).get();
    const doc = snap.docs.find(d => ["0178", "0177"].includes(String((d.data() as any).lang)));
    if (!doc) { rows.push({ name, id: "-", ok: false, why: "no item with that name" }); continue; }
    const d = doc.data() as any;
    if (String(d.lang) !== "0178") { rows.push({ name, id: doc.id, ok: false, why: `MISROUTED to ${d.lang}` }); continue; }
    if (!d.code) { rows.push({ name, id: doc.id, ok: false, why: `no code (${d.generationStatus ?? "?"})` }); continue; }

    const src = unparse(d.code, lex || {}, {}).replace(/\s+/g, " ");
    const problems: string[] = [];
    if (!/\bdata-job\b/.test(src)) problems.push("no data-job head");
    const blocks = BLOCKS.filter(b => new RegExp(`\\b${b}\\b`).test(src));
    if (blocks.length !== 1) problems.push(`blocks=${blocks.length ? blocks.join("+") : "none"}`);
    const lits = [...new Set((src.match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1)))];
    const invented = lits.filter(l => !prompt.toLowerCase().includes(l.toLowerCase()));
    if (invented.length) problems.push(`INVENTED ${JSON.stringify(invented)}`);
    rows.push({ name, id: doc.id, ok: !problems.length, why: problems.join("; ") || `block=${blocks[0]}` });
  }

  for (const r of rows) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}  ${r.id}  ${r.why}`);
  const passed = rows.filter(r => r.ok);
  console.log(`\n${passed.length}/${rows.length} pass`);
  if (MARK) {
    for (const r of passed) { await db.doc(`users/${UID}/items/${r.id}`).update({ mark: 3 }); console.log(`marked ${r.name}`); }
  }
  process.exit(passed.length === rows.length ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
