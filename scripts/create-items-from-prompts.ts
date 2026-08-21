#!/usr/bin/env node

/**
 * Generate code examples and create them as items in Firestore.
 *
 * Single-pass script combining code generation + item creation:
 * 1. Extracts prompts from ../l{lang}/packages/core/spec/examples.md
 * 2. Generates code for each prompt via generateCode()
 * 3. Normalizes lrn-id references to the example id
 * 4. Recompiles the normalized source to get a real taskId
 * 5. Creates the item via createItem() library function, which handles Firestore write + billing
 *
 * Usage:
 *   npx tsx scripts/generate-and-create-items.ts --lang <code> --mark <number> [options]
 *
 * Required:
 *   --lang <code>        Language code (required)
 *   --mark <number>      Training mark to assign (required)
 *
 * Options:
 *   --limit <number>     Maximum examples to process (default: all)
 *   --start <index>      Start from example index (default: 0)
 *   --refresh            Delete existing items of same lang/mark before creating new ones
 *   --only <n,n,...>     Re-run only these example numbers (labels from examples.md);
 *                        with --refresh, deletes only those examples' items
 *   --scope-gate         Allow the scope gate to re-route out-of-scope prompts (default: pinned to --lang)
 *   --timeout <seconds>  Per-step wall-clock cap; a stalled request fails that example (default: 300)
 *   --dry-run            Extract and print prompts only, no generation/creation
 *   --output <path>      Output audit log file (default: training/data/{lang}-codegen-mapping.json)
 *
 * Note: Items are created under the authenticated user's own account (auth.uid);
 * there is no --user override. Every item created counts as one billable item and
 * will increment the account's monthly item quota and (for paid plans) emit Stripe meter events.
 */

import "./eval-env"; // Production bootstrap (MUST be first)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { generateCodeForRequest } from "../src/lib/code-generation/generate-for-request";
import { getCredentialsForApiKey } from "../src/lib/api-credentials";
import { getBaseUrlForApi } from "../src/lib/api";
import { createItem, parseCode, postTask } from "../src/pages/api/resolvers";
import { getSecretsForUser, getPublicValuesForUser } from "../src/lib/user-credentials";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

const langStr = args.includes("--lang")
  ? args[args.indexOf("--lang") + 1]
  : null;

const markStr = args.includes("--mark")
  ? args[args.indexOf("--mark") + 1]
  : null;

if (!langStr || !markStr) {
  console.error("Error: --lang and --mark parameters are required");
  console.error("Usage: npx tsx scripts/generate-and-create-items.ts --lang <code> --mark <number> [options]");
  process.exit(1);
}

const langCode = langStr;
const markValue = parseInt(markStr);

const limit = args.includes("--limit")
  ? parseInt(args[args.indexOf("--limit") + 1])
  : Infinity;

const startIdx = args.includes("--start")
  ? parseInt(args[args.indexOf("--start") + 1])
  : 0;

const refresh = args.includes("--refresh");

// Re-run named examples rather than a slice. --start/--limit index the extracted
// LIST, which is not the example's label, so repairing "example 66" meant
// counting entries in examples.md by hand. Takes labels: --only 11,66,109.
// With --refresh, only those examples' items are deleted; the rest of the
// corpus is left alone.
const only: Set<number> | null = args.includes("--only")
  ? new Set(
      args[args.indexOf("--only") + 1]
        .split(",")
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n)),
    )
  : null;

// The request orchestrator re-routes a fresh create whose prompt reads as
// out-of-scope for --lang. For a training harness that is wrong: a re-routed
// example silently lands in another language's corpus. Pin the head by default;
// --scope-gate restores the production behavior.
if (!args.includes("--scope-gate")) {
  process.env.SCOPE_GATE_ENABLED = "false";
}
const dryRun = args.includes("--dry-run");

// Wall-clock cap per network step. Nothing in this script timed out, so a single
// stalled request blocked the whole run indefinitely — observed hanging a batch
// driver for 14 minutes with the process asleep on 0.4s of CPU. A timed-out
// example is recorded as an error and the run moves on.
const stepTimeoutMs = (args.includes("--timeout")
  ? parseInt(args[args.indexOf("--timeout") + 1], 10)
  : 300) * 1000;

const outputPath = args.includes("--output")
  ? args[args.indexOf("--output") + 1]
  : `training/data/${langCode}-codegen-mapping.json`;

interface TrainingExample {
  id: string;
  prompt: string;
  exampleNumber: number;
}

interface AuditLogEntry {
  exampleId: string;
  exampleNumber: number;
  firestoreItemId?: string;
  prompt: string;
  generatedCode?: string;
  normalizedCode?: string;
  compiled: boolean;
  usage?: { input_tokens?: number; output_tokens?: number } | null;
  // Repair turns the generator needed. 0 = compiled first try. Without it, "did
  // this need fixing?" was only inferable from an inflated token count.
  fixAttempts?: number | null;
  taskId?: string | null;
  upstreamLangs?: string[];
  created?: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Extract examples from markdown file in the language repo
 */
function extractExamples(markdownPath: string, langCode: string): TrainingExample[] {
  const content = fs.readFileSync(markdownPath, "utf-8");
  const examples: TrainingExample[] = [];

  const lines = content.split("\n");
  let exampleCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+[a-z]?)\.\s+(.+)$/);
    if (match) {
      exampleCount++;
      const prompt = match[2];

      // Number the example by the LABEL written in examples.md, not by scan
      // order. A sub-lettered entry ("86a.") advances the counter without
      // advancing the label, and the two then disagree for every example after
      // it — which silently misnames items and misreports which prompt failed.
      // Fall back to the counter only for a label we can't read as a number.
      const label = Number.parseInt(match[1], 10);
      const exampleNumber = Number.isFinite(label) ? label : exampleCount;

      examples.push({
        id: `${langCode}-example-${exampleNumber}`,
        prompt,
        exampleNumber,
      });
    }
  }

  return examples;
}

/**
 * Normalize code by replacing any lrn-id value with example.id
 */
function normalizeCode(code: string, exampleId: string): string {
  return code.replace(
    /set-var "lrn-id" (?:"[^"]*"|get-val-public "[^"]*")/g,
    `set-var "lrn-id" "${exampleId}"`
  );
}

/**
 * Reject if `work` outruns the step budget.
 *
 * The underlying request is NOT cancelled — an in-flight LLM or Firestore call
 * has no abort handle here — so a timed-out step may still be running when we
 * move on. That is why main() exits explicitly: an abandoned socket would
 * otherwise keep the event loop alive after the audit log is written.
 */
function withTimeout<T>(work: Promise<T>, label: string, ms = stepTimeoutMs): Promise<T> {
  let timer: NodeJS.Timeout;
  const bell = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms,
    );
  });
  return Promise.race([work, bell]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * Ask the api to evaluate a task and report whether it actually compiled.
 *
 * postTask returning an id only means the AST was stored. Gating `compiled` on
 * a posted id reported a "compilation rate" that was really a post-success rate.
 *
 * The status code is no better: /data answers 200 unconditionally
 * (routes/data.js `res.status(200).json(createSuccessResponse({ data }))`) and
 * a compile failure rides inside that 200 as `{ data: null, errors: [...] }`.
 * Read the envelope: compiled means no errors AND a non-null payload.
 */
async function taskCompiles(
  taskId: string,
  accessToken: string,
): Promise<{ compiled: boolean; error?: string }> {
  try {
    const resp = await fetch(
      `${getBaseUrlForApi()}/data?id=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: accessToken }, signal: AbortSignal.timeout(stepTimeoutMs) },
    );
    if (resp.status !== 200) {
      return { compiled: false, error: `/data returned ${resp.status}` };
    }
    const body: any = await resp.json();
    const obj = body?.data;
    const errors = Array.isArray(obj?.errors) ? obj.errors : [];
    if (errors.length > 0) {
      const message = errors
        .map((e: any) => (typeof e === "string" ? e : e?.message || JSON.stringify(e)))
        .join("; ");
      return { compiled: false, error: `Compile error: ${message}` };
    }
    if (obj?.data == null) {
      return { compiled: false, error: "/data returned no compile output" };
    }
    return { compiled: true };
  } catch (x: any) {
    return { compiled: false, error: `/data fetch failed: ${x?.message || x}` };
  }
}

/**
 * Delete existing items for this lang/mark
 */
async function deleteExistingItems(db: admin.firestore.Firestore, userId: string, lang: string, markValue: number): Promise<number> {
  console.log(`Querying existing L${lang} items with mark=${markValue} for user ${userId}...`);

  const query = db
    .collection("users")
    .doc(userId)
    .collection("items")
    .where("lang", "==", lang)
    .where("mark", "==", markValue);

  const snapshot = await query.get();
  let deleted = 0;

  // Under --only, a re-run replaces just the named examples. Deleting the whole
  // mark would throw away the corpus we're repairing.
  const docs = only
    ? snapshot.docs.filter((d) => only.has(Number(d.data().exampleNumber)))
    : snapshot.docs;

  console.log(`Found ${docs.length} existing items to delete`);

  for (const doc of docs) {
    if (!dryRun) {
      await doc.ref.delete();
    }
    deleted++;
  }

  return deleted;
}

/**
 * Process one example: generate code, normalize, recompile, create item
 */
async function processExample(
  example: TrainingExample,
  auth: any,
  db: admin.firestore.Firestore
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    exampleId: example.id,
    exampleNumber: example.exampleNumber,
    prompt: example.prompt,
    compiled: false,
    upstreamLangs: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Step 1: Generate. This is the REQUEST-level orchestrator, not the
    // per-stage generator — it runs the scope gate, the composition planner and
    // its permission fence, generates any upstream stages, and returns a
    // `head+upstream` chained taskId. Importing the per-stage generator here is
    // what silently made every generated item atomic.
    const genResult: any = await withTimeout(
      generateCodeForRequest({
        auth,
        prompt: example.prompt,
        language: langCode,
        options: {
          maxTokens: 4096,
        },
        currentSrc: null,
        itemId: example.id,
      }),
      `generate ${example.id}`,
    );

    if (genResult.errors && genResult.errors.length > 0) {
      entry.error = genResult.errors[0].message;
      return entry;
    }

    entry.generatedCode = genResult.src || "";
    entry.usage = genResult.usage || null;
    entry.fixAttempts = genResult.fixAttempts ?? null;
    entry.upstreamLangs = Array.isArray(genResult.upstreamLangs) ? genResult.upstreamLangs : [];

    if (!genResult.src) {
      entry.error = "generateCodeForRequest returned empty source";
      return entry;
    }

    // Step 2: Normalize lrn-id to the example.id
    const normalizedCode = normalizeCode(genResult.src, example.id);
    entry.normalizedCode = normalizedCode;

    // Step 3: Recompile the normalized HEAD and re-attach the upstream segments.
    // Only segment 0 is ours to rewrite; re-posting the head alone would drop
    // the chain and with it the upstream data. Same shape as the editor's
    // hand-edit path (src/components/editor.tsx).
    const upstreamSegments = String(genResult.taskId || "").split("+").slice(1);

    // Same credential wiring the resolver uses (generate-for-request.ts). Without
    // the private store a program that reads `get-val-private "learnosity-secret"`
    // bakes an empty secret here and fails the compile with "key and secret must
    // both be set together" — after passing generation-time verification, which
    // compiles under the `verify-itemid` sentinel and is exempt from the
    // credential gate. Generation is not the place that difference shows up.
    const privateValues: Record<string, string> = await getSecretsForUser(auth.uid);
    const publicValues: Record<string, string> = await getPublicValuesForUser(auth.uid);
    publicValues.itemId = example.id;

    const parseResult = await withTimeout(
      parseCode({
        lang: langCode,
        src: normalizedCode,
        privateValues,
        publicValues,
        accessToken: auth.token,
      }),
      `parse ${example.id}`,
    );

    if (parseResult.errors && parseResult.errors.length > 0) {
      entry.error = `Parse error: ${parseResult.errors[0].message}`;
      return entry;
    }

    const postResult = await withTimeout(
      postTask({
        auth,
        task: {
          lang: langCode,
          code: JSON.parse(parseResult.code),
        },
        ephemeral: false,
        isPublic: false,
      }),
      `postTask ${example.id}`,
    );

    if (!postResult || !postResult.id) {
      entry.error = "postTask returned no taskId";
      return entry;
    }

    entry.taskId = upstreamSegments.length > 0
      ? [postResult.id, ...upstreamSegments].join("+")
      : postResult.id;

    // Step 3b: A posted task is not a compiled one. Ask the api to actually
    // evaluate the chain — that is the only thing that proves the program runs.
    const compileCheck = await taskCompiles(entry.taskId, auth.token);
    entry.compiled = compileCheck.compiled;
    if (!entry.compiled) {
      entry.error = compileCheck.error || "task posted but did not compile";
      return entry;
    }

    // Step 4: Create the item via createItem() — this handles Firestore write + billing
    const itemName = String(example.exampleNumber).padStart(3, "0");
    const helpEntry = JSON.stringify([
      {
        type: "user",
        user: example.prompt,
        help: { text: example.prompt },
        timestamp: new Date().toISOString(),
      },
    ]);
    const newItem = await withTimeout(createItem({
      auth,
      lang: langCode,
      name: itemName,
      taskId: entry.taskId,
      mark: markValue,
      help: helpEntry,
      source: "codegen-mapping",
      client: "training",
      // Without this the item and its version record lose the chain, and the
      // first compile with form data slices the upstream off (buildLayerCount).
      upstreamLangs: entry.upstreamLangs,
    }), `createItem ${example.id}`);

    entry.firestoreItemId = newItem.id;
    entry.created = true;

    // Step 5: Merge in audit metadata (prompt for reference, exampleNumber for audit)
    await db
      .collection("users")
      .doc(auth.uid)
      .collection("items")
      .doc(newItem.id)
      .set(
        {
          prompt: example.prompt,
          exampleNumber: example.exampleNumber,
        },
        { merge: true }
      );

    return entry;
  } catch (error: any) {
    entry.error = error.message || String(error);
    return entry;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`Extracting L${langCode} examples from language repo...`);

  const trainingFile = path.resolve(
    __dirname,
    `../../l${langCode}/packages/core/spec/examples.md`
  );

  if (!fs.existsSync(trainingFile)) {
    console.error(`Error: Examples file not found: ${trainingFile}`);
    process.exit(1);
  }

  const examples = extractExamples(trainingFile, langCode);
  const slice = only
    ? examples.filter((ex) => only.has(ex.exampleNumber))
    : examples.slice(startIdx, Math.min(startIdx + limit, examples.length));

  if (only) {
    const missing = [...only].filter((n) => !slice.some((ex) => ex.exampleNumber === n));
    if (missing.length > 0) {
      console.error(`Error: --only names examples not in examples.md: ${missing.join(", ")}`);
      process.exit(1);
    }
  }

  console.log(`Extracted ${examples.length} examples, processing ${slice.length}${dryRun ? " (dry run)" : ""}`);

  if (dryRun) {
    console.log("\nExtracted prompts:");
    slice.forEach((ex) => {
      console.log(`\n[${ex.exampleNumber}] ${ex.id}:`);
      console.log(`  ${ex.prompt}`);
    });
    return;
  }

  // Get authentication
  const gcApiKey = process.env.GC_API_KEY_SECRET;
  if (!gcApiKey) {
    console.error("Error: GC_API_KEY_SECRET environment variable not set");
    process.exit(1);
  }

  let credentials: any;
  try {
    credentials = await getCredentialsForApiKey(gcApiKey);
  } catch (error: any) {
    console.error("Error getting credentials:", error.message);
    process.exit(1);
  }

  const auth = {
    token: credentials.idToken,
    uid: credentials.uid,
  };

  // Initialize Firestore for --refresh
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: "graffiticode-app",
      credential: admin.credential.applicationDefault(),
    });
  }
  const db = admin.firestore();

  console.log(`Generating and creating items for L${langCode} with mark=${markValue}`);
  console.log(`User: ${auth.uid}`);

  // Optionally delete existing items
  if (refresh) {
    const deleted = await deleteExistingItems(db, auth.uid, langCode, markValue);
    console.log(`Deleted ${deleted} existing items`);
  }

  const auditLog: AuditLogEntry[] = [];
  let compiledCount = 0;
  let createdCount = 0;
  let errorCount = 0;

  for (let i = 0; i < slice.length; i++) {
    const example = slice[i];
    process.stdout.write(
      `[${i + 1}/${slice.length}] Processing ${example.id}... `
    );

    const entry = await processExample(example, auth, db);
    auditLog.push(entry);

    if (entry.error) {
      console.log(`✗ Error: ${entry.error}`);
      errorCount++;
    } else if (entry.compiled) {
      console.log(`✓ Created (item: ${entry.firestoreItemId})`);
      compiledCount++;
      if (entry.created) {
        createdCount++;
      }
    } else {
      console.log(`✗ Did not compile`);
    }
  }

  // Write audit log
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(auditLog, null, 2));

  console.log(`\n✓ Audit log written to: ${outputPath}`);
  console.log(`Summary:`);
  console.log(`  Processed: ${slice.length}`);
  console.log(`  Compiled: ${compiledCount}`);
  console.log(`  Created (billed): ${createdCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Compilation rate: ${((compiledCount / slice.length) * 100).toFixed(1)}%`);
}

main()
  .then(() => {
    // Exit explicitly. A step that timed out is still in flight — its socket
    // would otherwise hold the event loop open long after the audit log landed,
    // which is indistinguishable from the hang the timeouts exist to prevent.
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
