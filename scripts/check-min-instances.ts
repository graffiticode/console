#!/usr/bin/env node
/**
 * Are the services on a user's critical path pinned warm?
 *
 * Cloud Run scales to zero by default, and the first request after an idle period —
 * or after ANY deploy, which retires every warm instance — pays a full cold boot
 * before it does any work. Measured 2026-09-09 on `console`: a create_item that
 * normally takes 0.8s took 33.7s, of which the Next.js boot alone (`✓ Ready in
 * 13.2s`) was visible in the logs. The user was watching.
 *
 * WHY A CHECKER AND NOT A ONE-OFF UPDATE. `gcloud run services update
 * --min-instances=1` does stick across ordinary deploys — settings not named on a
 * deploy are preserved — but nothing in any repo records that the value SHOULD be
 * 1. It drifts silently from three directions: a full `services replace`, a manual
 * console change, and a new language deployed from a template whose `gcp:deploy`
 * line has no --min-instances (none of them do today). Only a check catches all
 * three, and only a check tells you the answer for 40-odd services in one command.
 *
 * Usage:
 *   npm run check-min-instances            # report drift, exit 1 if any
 *   npm run check-min-instances -- --fix   # and set them
 *   npm run check-min-instances -- --all-languages   # every l0*, not just the live set
 */
import { execFileSync } from "child_process";
import { PING_LANGUAGES } from "../src/lib/corpus-ping";

const REGION = "us-central1";
const WANT = 1;

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const allLanguages = args.includes("--all-languages");

/**
 * Infrastructure every request passes through, whatever language it is for.
 *
 * `api` earns its place over any individual dialect: parseCode, postTask,
 * getApiTask and getData all go through it, so a cold `api` is a cold start in
 * front of EVERY generation, where a cold `l0173` is one only for L0173.
 */
const INFRA: Array<{ name: string; project: string; why: string }> = [
  { name: "console", project: "graffiticode-app", why: "GraphQL API + generate-job worker" },
  { name: "mcp-service", project: "graffiticode-app", why: "the MCP surface itself" },
  { name: "api", project: "graffiticode", why: "parse/post/data — on every generation" },
  { name: "auth", project: "graffiticode", why: "API-key exchange on every session" },
];

function minScaleOf(name: string, project: string): number | null {
  try {
    const out = execFileSync("gcloud", [
      "run", "services", "describe", name,
      "--project", project, "--region", REGION,
      "--format=value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])",
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return out === "" ? 0 : Number(out);
  } catch {
    return null; // service absent, or no access — reported, never treated as 0
  }
}

function setMinScale(name: string, project: string): boolean {
  try {
    execFileSync("gcloud", [
      "run", "services", "update", name,
      "--project", project, "--region", REGION,
      `--min-instances=${WANT}`, "--quiet",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

async function targets() {
  const rows = [...INFRA];
  if (allLanguages) {
    // Every deployed l0*, including deprecated and internal ones nothing routes to.
    const names = execFileSync("gcloud", [
      "run", "services", "list", "--project", "graffiticode", "--format=value(metadata.name)",
    ], { encoding: "utf8" }).split("\n").map(s => s.trim()).filter(n => /^l0/.test(n));
    for (const name of names) rows.push({ name, project: "graffiticode", why: "language (--all-languages)" });
    return rows;
  }
  // PING_LANGUAGES: the live set, and the same list SWEEP_LANGUAGES uses. It is the
  // right source here for the reason it exists — a language in it is one whose
  // breakage is customer-facing, which is exactly the population worth keeping warm.
  //
  // Deliberately NOT `listLanguages()`. That returns everything not hidden and not
  // deprecated, which today still includes 0159 and four corpus-less dialects
  // (0003, 0152, 0153, 0154). If one of those is reachable by the scope gate but
  // should not be, the fix belongs in the catalog, not in a warm-instance list that
  // would quietly pay to keep it fast.
  for (const id of PING_LANGUAGES) {
    rows.push({ name: `l${id}`, project: "graffiticode", why: "live language" });
  }
  return rows;
}

async function main() {
  const rows = await targets();
  console.log(`checking min-instances=${WANT} across ${rows.length} services (region ${REGION})\n`);
  const drift: typeof rows = [];
  const missing: typeof rows = [];
  for (const t of rows) {
    const min = minScaleOf(t.name, t.project);
    if (min === null) {
      missing.push(t);
      console.log(`  ?  ${t.name.padEnd(16)} ${t.project.padEnd(17)} not found / no access`);
      continue;
    }
    const ok = min >= WANT;
    if (!ok) drift.push(t);
    console.log(`  ${ok ? "ok" : "->"} ${t.name.padEnd(16)} ${t.project.padEnd(17)} min=${min}${ok ? "" : `  ${t.why}`}`);
  }
  console.log(`\n${rows.length - drift.length - missing.length}/${rows.length} pinned` +
    (missing.length ? `, ${missing.length} unreachable` : "") +
    (drift.length ? `, ${drift.length} at 0` : ""));

  if (!drift.length) return;
  if (!fix) {
    console.log(`\nRe-run with --fix to set min-instances=${WANT} on the ${drift.length} above.`);
    console.log("COST: each pinned service bills an idle instance continuously.");
    process.exitCode = 1;
    return;
  }
  console.log("");
  for (const t of drift) {
    const done = setMinScale(t.name, t.project);
    console.log(`  ${done ? "set" : "FAILED"}  ${t.name} (${t.project})`);
    if (!done) process.exitCode = 1;
  }
}

main().catch(err => { console.error("Fatal:", err?.message || err); process.exit(1); });
