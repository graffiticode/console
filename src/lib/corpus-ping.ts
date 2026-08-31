// Daily generation-pipeline liveness ping.
//
// PURPOSE, and what this deliberately is NOT. This answers one question — "can the
// generation pipeline still produce a compiling program for each live language today" —
// and nothing else. It does not compare against the corpus, score quality, or judge
// design drift. That is the weekly corpus health sweep's job, and conflating the two
// makes a cheap daily signal as noisy as an expensive weekly one: a single sample per
// language cannot support a diff alarm, so this must never raise one.
//
// PROMPTS COME FROM THE CORPUS, not from `spec/examples.md`. Two reasons, both hard:
//   - Cloud Run has no sibling language repos, so the `../l{lang}/packages/core/spec/`
//     path that scripts/create-items-from-prompts.ts reads does not exist here.
//   - Five of the eleven pinged languages (0159, 0169, 0170, 0172, 0173) ship no
//     examples.md at all; the corpus is their only prompt source.
//
// ROTATION IS DETERMINISTIC, not random. Day N takes corpus index N mod size, so a month
// walks ~30 distinct prompts per language with no repeats and no luck involved. A random
// pick would re-test the same easy prompt by chance and leave others never exercised.
//
// BILLING BOUNDARY — the one thing that must not regress here. This calls
// generateCodeForRequest and stops. It never calls createItem/updateItem, which is what
// meters a billable item (see scripts/create-items-from-prompts.ts, and the same pairing
// in src/pages/api/generate-job.ts). Cross that line and a daily health check silently
// bills ~330 items a month.
//
// PRIVACY — prompts are referenced by lang + corpus doc id, never by text, per the
// contract in CLAUDE.md that applies to every emitter without exception.
import { getFirestore } from "../utils/db";
import { generateCodeForRequest } from "./code-generation/generate-for-request";
import { getCredentialsForApiKey } from "./api-credentials";
import { getBaseUrlForApi } from "./api";

/**
 * The pinged set: registered in LANGUAGES *and* carrying a RAG corpus, minus the
 * deprecated dialects (0158, 0166) and the internal composition planner (0010). A
 * failure in one of these is a customer-facing breakage; the excluded ones are either
 * being subsumed or are not content-authoring targets.
 *
 * Languages registered with no corpus (0003, 0013, 0152, 0153, 0154, 0171, 0174) cannot
 * be pinged at all until they have one — there is no prompt to send. They are absent
 * rather than silently passing, and `no-corpus` is reported if one is added here early.
 */
export const PING_LANGUAGES = [
  "0000", "0159", "0169", "0170", "0172",
  "0173", "0175", "0176", "0177", "0178", "0179",
];

/** How many generations run at once. Eleven serial generations would be ~11-25 min,
 *  uncomfortably close to Cloud Scheduler's 30-minute attempt deadline; four at a time
 *  brings a full run to ~3-6 min and leaves headroom as the set grows. */
const CONCURRENCY = 4;

/** Per-language wall-clock cap. A stalled generation fails that language rather than
 *  the run — one hung language must not cost the other ten their result. */
const STEP_TIMEOUT_MS = 180_000;

export type PingStage = "no-corpus" | "generate" | "empty" | "compile" | "out-of-scope";

/**
 * Three outcomes, not two — the distinction the first multi-language run forced.
 *
 *   ok      — generated and compiled. The pipeline works for this language.
 *   stale   — the SCOPE GATE refused the prompt. The pipeline behaved perfectly; the
 *             CORPUS is wrong. L0173's corpus still holds a scatter-plot prompt that
 *             L0173 v1 explicitly puts out of scope, so RAG is serving an example the
 *             language will now refuse. Real rot, worth reporting — but calling it an
 *             outage would page for something that is working as designed.
 *   failed  — generation errored, returned nothing, or the program did not compile.
 *             This is the outage signal.
 */
export type PingOutcome = "ok" | "stale" | "failed";

export interface PingResult {
  lang: string;
  outcome: PingOutcome;
  /** Where it broke. Absent when ok. */
  stage?: PingStage;
  error?: string;
  /** Corpus doc id of the prompt used — the handle for reproducing this, since the
   *  prompt text itself is never recorded. */
  exampleRef?: string;
  latencyMs: number;
  model?: string;
}

export interface PingRun {
  at: string;
  dayIndex: number;
  results: PingResult[];
  ok: number;
  stale: number;
  failed: number;
}

/** Days since the Unix epoch, UTC. The rotation cursor: stable within a day, +1 each day. */
export function dayIndex(now: Date = new Date()): number {
  return Math.floor(now.getTime() / 86_400_000);
}

async function withTimeout<T>(p: Promise<T>, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${STEP_TIMEOUT_MS}ms`)), STEP_TIMEOUT_MS);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Today's prompt for one language: corpus entry at index `dayIndex % size`.
 *
 * Ordered by document id so the rotation is deterministic for a given corpus state. A
 * corpus refresh rewrites those ids (they embed a write timestamp) and so shifts the
 * rotation — acceptable for a liveness check, which only needs *a* valid prompt, not a
 * specific one.
 */
async function promptForLang(lang: string, day: number): Promise<{ prompt: string; ref: string } | null> {
  const snap = await getFirestore()
    .collection("training_examples")
    .where("lang", "==", lang)
    .select("prompt")
    .get();

  if (snap.empty) return null;

  const docs = snap.docs.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const picked = docs[day % docs.length];
  const prompt = String(picked.get("prompt") || "").trim();
  if (!prompt) return null;
  return { prompt, ref: picked.id };
}

/**
 * Does this taskId actually evaluate? Mirrors scripts/create-items-from-prompts.ts —
 * and note that a 200 is NOT sufficient: /data answers 200 with an errors array, so
 * status-code gating alone reads as a false PASS. All three conditions are load-bearing.
 */
async function taskCompiles(taskId: string, accessToken: string): Promise<{ compiled: boolean; error?: string }> {
  try {
    const resp = await fetch(`${getBaseUrlForApi()}/data?id=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: accessToken },
      signal: AbortSignal.timeout(STEP_TIMEOUT_MS),
    });
    if (resp.status !== 200) return { compiled: false, error: `/data returned ${resp.status}` };
    const body: any = await resp.json();
    const obj = body?.data;
    const errors = Array.isArray(obj?.errors) ? obj.errors : [];
    if (errors.length > 0) {
      const message = errors
        .map((e: any) => (typeof e === "string" ? e : e?.message || JSON.stringify(e)))
        .join("; ");
      return { compiled: false, error: `Compile error: ${message}` };
    }
    if (obj?.data == null) return { compiled: false, error: "/data returned no compile output" };
    return { compiled: true };
  } catch (x: any) {
    return { compiled: false, error: `/data fetch failed: ${x?.message || x}` };
  }
}

async function pingLang(lang: string, day: number, auth: { uid: string; token: string }): Promise<PingResult> {
  const started = Date.now();
  const base = { lang, latencyMs: 0 };

  try {
    const picked = await promptForLang(lang, day);
    if (!picked) {
      return { ...base, outcome: "failed", stage: "no-corpus", error: "no corpus prompt for language", latencyMs: Date.now() - started };
    }

    // The REQUEST-level orchestrator, not the per-stage generator: it runs the scope
    // gate, the composition planner and its permission fence, and returns a chained
    // `head+upstream` taskId. Importing the per-stage generator instead is what once
    // made every generated item silently atomic.
    const gen: any = await withTimeout(
      generateCodeForRequest({
        auth,
        prompt: picked.prompt,
        language: lang,
        options: { maxTokens: 4096 },
        currentSrc: null,
        // REQUIRED, not cosmetic. `itemId` becomes publicValues.itemId
        // (generate-for-request.ts:368), which is what a dialect reading
        // `get-val-public "itemId"` resolves against. Omit it and L0176 compiles to
        // `set-var "lrn-id" must be set to a non-empty string before items is called` —
        // a permanent red that is an artifact of the ping, not a breakage. The corpus
        // pipeline gets there differently, rewriting the source to a literal
        // (normalizeCode in scripts/create-items-from-prompts.ts) because it needs a
        // stable literal in the STORED example; the ping stores nothing and only needs
        // the value to resolve.
        //
        // Creates nothing: the id is never written, and the only lookup keyed on it
        // (assertRevisionsRemaining) is free-plan-only, which this eval account is not.
        itemId: `corpus-ping-${lang}`,
      }),
      `generate L${lang}`,
    );

    const out: PingResult = { ...base, outcome: "failed", exampleRef: picked.ref, model: gen?.model || undefined, latencyMs: Date.now() - started };

    if (gen?.errors?.length > 0) {
      const first = gen.errors[0];
      // The scope gate refusing this prompt means the platform worked and the corpus is
      // stale — see PingOutcome. Keyed on the structured `code` set in
      // generate-for-request.ts, never on the message prose.
      const stale = first?.code === "out_of_scope";
      return {
        ...out,
        outcome: stale ? "stale" : "failed",
        stage: stale ? "out-of-scope" : "generate",
        error: String(first?.message || first),
        latencyMs: Date.now() - started,
      };
    }
    if (!gen?.src) {
      return { ...out, stage: "empty", error: "generation returned empty source", latencyMs: Date.now() - started };
    }
    if (!gen?.taskId) {
      return { ...out, stage: "empty", error: "generation returned no taskId", latencyMs: Date.now() - started };
    }

    const compile = await taskCompiles(gen.taskId, auth.token);
    if (!compile.compiled) {
      return { ...out, stage: "compile", error: compile.error, latencyMs: Date.now() - started };
    }

    return { ...out, outcome: "ok", latencyMs: Date.now() - started };
  } catch (err: any) {
    return { ...base, outcome: "failed", stage: "generate", error: err?.message || String(err), latencyMs: Date.now() - started };
  }
}

/** Run `tasks` with at most `limit` in flight, preserving input order in the output. */
async function pool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= tasks.length) return;
      out[i] = await tasks[i]();
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Run one ping across every language in `langs`.
 *
 * Uses EVAL_API_KEY when set: generateCodeForRequest writes usage records under the
 * caller's uid, and a daily job should not accrue them against a real user's account.
 * Falls back to GC_API_KEY_SECRET so an unconfigured deploy still pings rather than
 * silently reporting nothing.
 */
export async function runPing(langs: string[] = PING_LANGUAGES, now: Date = new Date()): Promise<PingRun> {
  const apiKey = process.env.EVAL_API_KEY || process.env.GC_API_KEY_SECRET || "";
  if (!apiKey) throw new Error("EVAL_API_KEY or GC_API_KEY_SECRET must be set");

  const credentials: any = await getCredentialsForApiKey(apiKey);
  const auth = { uid: credentials.uid, token: credentials.idToken };
  const day = dayIndex(now);

  const results = await pool(langs.map((lang) => () => pingLang(lang, day, auth)), CONCURRENCY);
  const count = (o: PingOutcome) => results.filter((r) => r.outcome === o).length;

  return {
    at: now.toISOString(),
    dayIndex: day,
    results,
    ok: count("ok"),
    stale: count("stale"),
    failed: count("failed"),
  };
}

/**
 * SMS text. Failures first and named, because that is the only part worth reading on a
 * phone; stale trails as a secondary clause so corpus rot is visible without competing
 * with an outage for attention. The all-clear is deliberately one short line.
 */
export function formatPingSms(run: PingRun): string {
  const total = run.results.length;
  const named = (o: PingOutcome) =>
    run.results.filter((r) => r.outcome === o).map((r) => `L${r.lang} ${r.stage}`).join(", ");

  const stalePart = run.stale > 0 ? ` · ${run.stale} stale: ${named("stale")}` : "";

  if (run.failed === 0) return `corpus ping: ${run.ok}/${total} ok${stalePart}`;
  return `corpus ping: ${run.failed}/${total} FAILED — ${named("failed")}${stalePart}`;
}

/**
 * Record every run, pass or fail.
 *
 * This is what makes silence diagnosable. With alert-on-failure alone a dead scheduler
 * job is indistinguishable from a green day; the run log gives a `lastRun` to check, and
 * the weekly heartbeat below turns the check into something that arrives on its own.
 */
export async function recordPingRun(run: PingRun): Promise<void> {
  const date = run.at.slice(0, 10);
  await getFirestore().collection("corpus-ping-runs").doc(date).set(run, { merge: true });
}

/**
 * Send on any failure, and once a week when green.
 *
 * Alert-only-on-failure is the right default for a daily job — nobody wants eleven green
 * texts a week — but taken alone it makes a broken scheduler look exactly like a healthy
 * pipeline. The Monday all-clear is the cheapest fix that keeps silence meaningful.
 */
export function shouldSend(run: PingRun, now: Date = new Date()): boolean {
  return run.failed > 0 || now.getUTCDay() === 1;
}
