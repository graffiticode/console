import axios from "axios";
import admin from "firebase-admin";
import { CLAUDE_MODELS, generateCode as generateCodeService, extractSearchQuery } from "./code-generation-service";
import { listLanguages, findLanguageById } from "./languages";
import { hybridSearch } from "./embedding-service";
import { parseCode } from "../pages/api/resolvers";

// Hard bound on composition depth: head + at most (MAX_STAGES-1) upstream
// stages. Keeps planning cost and chain length sane.
const MAX_STAGES = 4;

// Composition planning is its own Graffiticode dialect, L0010: a program maps a
// prompt to an ordered language sequence (and nothing else). Plans are written
// as mark-1 items under the generating user's account; a human promotes
// good ones to mark 3/4, then `download-training-examples --lang 0010` (sourced
// from the admin uid) + `update-embeddings` move them into the `training_examples`
// corpus that the runtime planning-RAG (`lookupPlanRAG`) consults.
const PLAN_LANG = "0010";
// A planning-RAG hit must be at least this similar to be trusted (no compile / no LLM on a hit).
const PLAN_RAG_THRESHOLD = Number(process.env.COMPOSE_PLAN_RAG_THRESHOLD ?? 0.7);

function getDb() {
  try {
    return admin.firestore();
  } catch {
    if (!admin.apps.length) admin.initializeApp();
    return admin.firestore();
  }
}

// Pull language ids out of a string — used both to find `data use "<id>"`
// triggers in head-lang examples and to read the sequence out of a stored L0010
// `plan ["0158" "0166"]` program without compiling it.
function extractLangIds(text: string, requireUse: boolean): string[] {
  if (!text) return [];
  const re = requireUse ? /\buse\s+"(\d{3,5})"/g : /"(\d{3,5})"/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

// Composition permission helpers. Each language's `composesWith` allowlist is the HARD FENCE
// for composition: the server's planner may only propose edges within it, and the client can
// never create an undeclared edge.

// The upstreams a head language is permitted to compose with (["*"] = any non-internal).
// Empty ⇒ atomic only. Sourced from the static LANGUAGES array (sync, in-memory; hot-path).
export function composesWithFor(headLang: string): string[] {
  return findLanguageById(headLang)?.composesWith ?? [];
}

// Enforce the allowlist on a planner-proposed sequence ([head, up1, up2, ...]). If ANY upstream
// is not permitted, drop to atomic [head] rather than post a partially-broken chain. Returns the
// fenced sequence plus any dropped (unpermitted) upstream ids for logging.
export function fenceComposition(
  sequence: string[],
  permits: string[],
): { sequence: string[]; dropped: string[] } {
  if (sequence.length <= 1) return { sequence, dropped: [] };
  const allowAny = permits.includes("*");
  const dropped = sequence.slice(1).filter((up) =>
    allowAny ? findLanguageById(up)?.internal === true : !permits.includes(up),
  );
  if (dropped.length > 0) return { sequence: [sequence[0]], dropped };
  return { sequence, dropped: [] };
}

interface LanguageSuggestion {
  id: string;
  name: string;
  description: string;
  reason: string;
}

interface RoutingResult {
  suggestions: LanguageSuggestion[];
}

// Build the catalog string used by both the routing helper (findBestLanguages)
// and the composition planner (planComposition). excludeLang lets the routing
// path filter out the current language; the planner passes none so every
// language is in scope.
//
// Each entry uses scope.json fields (summary / in_scope / out_of_scope) when
// they're available from the lang server, falling back to routingHint or
// description otherwise. The richer block helps Haiku make a better routing
// suggestion than a single one-liner can.
async function buildLanguageCatalog(opts?: { excludeLang?: string }) {
  const languages = await listLanguages({});
  // Exclude internal dialects (e.g. the L0010 planner itself) so the planner
  // never proposes itself as a composition stage; also honor excludeLang.
  const candidates = languages.filter(
    (l) => !l.internal && (!opts?.excludeLang || l.id !== opts.excludeLang),
  );
  const catalog = candidates
    .map((l) => {
      const head = l.summary || l.routingHint || l.description;
      const lines = [`- L${l.id}: ${head}`];
      if (l.inScope && l.inScope.length > 0) {
        lines.push(`    in scope: ${l.inScope.join("; ")}`);
      }
      if (l.outOfScope && l.outOfScope.length > 0) {
        lines.push(`    out of scope: ${l.outOfScope.join("; ")}`);
      }
      return lines.join("\n");
    })
    .join("\n");
  return { candidates, catalog };
}

export async function findBestLanguages({
  userRequest,
  outOfScopeReason,
  currentLang,
}: {
  userRequest: string;
  outOfScopeReason: string;
  currentLang: string;
}): Promise<RoutingResult> {
  try {
    const { candidates, catalog } = await buildLanguageCatalog({ excludeLang: currentLang });

    if (candidates.length === 0) {
      return { suggestions: [] };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("[language-router] ANTHROPIC_API_KEY not set");
      return { suggestions: [] };
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: CLAUDE_MODELS.HAIKU,
        max_tokens: 500,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `A user asked: "${userRequest}"

This was rejected by the current language (L${currentLang}) because: ${outOfScopeReason}

Available languages:
${catalog}

Which languages (max 3) could handle this request? Match based on specific capabilities described above. Return JSON only:
{"suggestions": [{"id": "0159", "reason": "brief explanation"}]}

If none fit, return {"suggestions": []}`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    const text = response.data?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { suggestions: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions: LanguageSuggestion[] = (parsed.suggestions || [])
      .slice(0, 3)
      .map((s: { id: string; reason: string }) => {
        const lang = candidates.find((l) => l.id === s.id);
        return {
          id: s.id,
          name: lang?.name || `L${s.id}`,
          description: lang?.description || "",
          reason: s.reason,
        };
      })
      .filter((s: LanguageSuggestion) => s.description);

    return { suggestions };
  } catch (error) {
    console.error("[language-router] Error:", error.message);
    return { suggestions: [] };
  }
}

export interface RouteResult {
  inScope: boolean;
  routedLang: string | null;
  reason: string;
}

// Authoritative pre-flight head router. Given a request and the language the client picked,
// decide whether the request is in-scope for that language; if not, name the best-fit language
// from the catalog. The SERVER uses this to honor or override the client's pick — the guardrail
// against clients (e.g. Codex/ChatGPT) freelancing the head language.
//
// FAIL-OPEN: any classifier error / missing key / unparseable response returns inScope:true
// (proceed with the client pick), logged. Availability beats blocking a valid request on an LLM
// hiccup; divergence is observable via logs. (This is the honest hole in "no exception".)
export async function classifyAndRoute({
  userRequest,
  currentLang,
}: {
  userRequest: string;
  currentLang: string;
}): Promise<RouteResult> {
  const FAIL_OPEN: RouteResult = { inScope: true, routedLang: null, reason: "" };
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("[routing] ANTHROPIC_API_KEY not set; fail-open (in-scope)");
      return FAIL_OPEN;
    }
    const all = await listLanguages({});
    const current = all.find((l) => l.id === currentLang);
    const { candidates, catalog } = await buildLanguageCatalog({ excludeLang: currentLang });
    const curScope = [
      current?.summary || current?.routingHint || current?.description || `L${currentLang}`,
      current?.inScope?.length ? `in scope: ${current.inScope.join("; ")}` : "",
      current?.outOfScope?.length ? `out of scope: ${current.outOfScope.join("; ")}` : "",
    ].filter(Boolean).join("\n");

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: CLAUDE_MODELS.HAIKU,
        max_tokens: 300,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `A user asked language L${currentLang} to create this:
"${userRequest}"

L${currentLang} scope:
${curScope}

Decide whether this request is IN SCOPE for L${currentLang}.
- If it clearly belongs in L${currentLang}, return {"inScope": true}.
- If it does NOT belong in L${currentLang}, pick the single best-fit language id from the catalog below (or null if none fits): {"inScope": false, "routedLang": "<id or null>", "reason": "<one sentence>"}.

Catalog of other languages:
${catalog}

Be conservative: only route away when the request clearly belongs to a different language. Return JSON only.`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      },
    );

    const text = response.data?.content?.[0]?.text || "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return FAIL_OPEN;
    const parsed = JSON.parse(m[0]);
    if (parsed.inScope === true) return { inScope: true, routedLang: null, reason: "" };
    let routedLang: string | null = parsed.routedLang ? String(parsed.routedLang).replace(/^L/i, "") : null;
    // Validate against the real, non-internal catalog (buildLanguageCatalog already excludes internal).
    if (routedLang && !candidates.some((c) => c.id === routedLang)) routedLang = null;
    return { inScope: false, routedLang, reason: String(parsed.reason || "") };
  } catch (err) {
    console.warn(`[routing] classifyAndRoute failed; fail-open (in-scope): ${(err as Error)?.message}`);
    return FAIL_OPEN;
  }
}

// Proactive composition planner. A plan is an ORDERED linear pipeline of
// stages: stages[0] is the head (what the user ultimately gets), and each
// stage consumes the data model produced by the next (stages[i] consumes
// stages[i+1]). A single-element plan means no composition — the resolver
// follows the plain single-language path. This mirrors the runtime chain id
// `head+s2+s3`, which api.graffiticode.org evaluates depth-first: compile the
// deepest stage, feed its output up as `data` to the stage above, to the head.
export interface CompositionStage {
  lang: string;
  prompt: string;
}
export type CompositionPlan = CompositionStage[];

export async function planComposition({
  prompt,
  currentLang,
}: {
  prompt: string;
  currentLang: string;
}): Promise<CompositionPlan> {
  const fallback: CompositionPlan = [{ lang: currentLang, prompt }];
  try {
    const { candidates, catalog } = await buildLanguageCatalog();
    if (candidates.length === 0) return fallback;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("[language-router] ANTHROPIC_API_KEY not set");
      return fallback;
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: CLAUDE_MODELS.HAIKU,
        max_tokens: 800,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `A user asked: "${prompt}"

The active language is L${currentLang}. Available languages (each routing hint may state which other dialects it embeds):
${catalog}

Composition is a LINEAR PIPELINE: a head program may consume a data model produced by an upstream program, which may itself consume one from a further upstream, and so on. Decompose the request into an ORDERED sequence of stages from the head (what the user ultimately gets) down to the deepest data source. Stage i consumes the data model produced by stage i+1.

Add a downstream stage whenever a stage describes-but-does-not-author a content type produced by another dialect — e.g. a host language (L0158) embeds an interactive widget authored by another (L0166 spreadsheets, L0159 flashcards). Stop when a stage can author its content directly (a leaf). If the active language alone can fulfil the request, return a single stage.

Heuristics:
- If a stage's routing hint says it "embeds" or "hosts" another dialect for a content type the user asked for, add that dialect as the next stage.
- A "spreadsheet question", "spreadsheet assessment", or "use the spreadsheet" prompt under an embedding host (e.g. L0158) ⇒ next stage is the spreadsheet dialect (L0166).
- A pure question-form prompt (MCQ, short text, fill-in-the-blank) under L0158 ⇒ single stage, no upstream.
- If the user is already in the dialect that authors the content directly (e.g. currentLang=0166 asking for a spreadsheet) ⇒ single stage.
- If the data or content a downstream stage would supply is ALREADY present inline in the prompt (the user pasted the actual numbers, rows, or values), do NOT add that upstream stage — the request is self-contained. Only add a data-providing upstream when the values must be FETCHED or TRANSFORMED from a source not in the prompt.

Return JSON only:
{
  "stages": [
    { "lang": "${currentLang}", "prompt": "<scoped, standalone prompt for the head>" },
    { "lang": "<id>", "prompt": "<scoped, standalone prompt for the upstream it consumes>" }
  ]
}

Examples:
- prompt: "create a simple spreadsheet assessment for learnosity", currentLang: 0158 →
  { "stages": [
    { "lang": "0158", "prompt": "Build a Learnosity assessment item that embeds a spreadsheet interaction via its custom question type." },
    { "lang": "0166", "prompt": "Create a small interactive spreadsheet with a few rows and columns of data and one or two assessed cells the learner must fill in." } ] }
- prompt: "make an MCQ about France", currentLang: 0158 →
  { "stages": [ { "lang": "0158", "prompt": "Build a Learnosity MCQ item about France." } ] }
- prompt: "make a budget tracker spreadsheet", currentLang: 0166 →
  { "stages": [ { "lang": "0166", "prompt": "Author a budget-tracker spreadsheet." } ] }

Rules:
- stages[0].lang should remain "${currentLang}" unless the request is entirely outside that dialect.
- At most ${MAX_STAGES} stages.
- No language repeats in the sequence.
- Each "prompt" is a complete, standalone description of what that stage should produce.`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    const text = response.data?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`[language-router] planComposition: no JSON in response, falling back. raw=${text.substring(0, 200)}`);
      return fallback;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const rawStages = Array.isArray(parsed?.stages) ? parsed.stages : [];

    // Validate: every lang must be a known candidate, no lang repeats, length
    // bounded. Drop anything that fails rather than trusting the model.
    const seen = new Set<string>();
    const stages: CompositionPlan = [];
    for (const s of rawStages) {
      const lang = String(s?.lang || "");
      const stagePrompt = String(s?.prompt || "");
      if (!lang || !stagePrompt) continue;
      if (!candidates.some((c) => c.id === lang)) continue;
      if (seen.has(lang)) continue;
      seen.add(lang);
      stages.push({ lang, prompt: stagePrompt });
      if (stages.length >= MAX_STAGES) break;
    }

    // The head must survive validation; otherwise fall back to single-language.
    if (stages.length === 0) return fallback;

    console.log(
      `[language-router] planComposition: sequence=${stages.map((s) => `L${s.lang}`).join(" -> ")}`
    );

    return stages;
  } catch (error) {
    console.error("[language-router] planComposition error:", (error as Error)?.message);
    return fallback;
  }
}

// Execute a multi-stage plan TAIL-FIRST: generate the deepest stage first,
// then each stage above it knowing the ACTUAL data model the stage below
// produced (injected as upstreamContext so the head authors `data use "<lang>"`
// against real fields). Returns the head's source (unposted — the resolver
// re-parses+posts it with systemValues) plus the tail taskIds in chain order
// for the resolver to stitch into `head+s2+s3`. Composition awareness lives
// only here.
export interface OrchestrationResult {
  headSrc: string | null;
  headDescription: string | null;
  headChangeSummary: string | null;
  headModel: string;
  headUsage: { input_tokens: number; output_tokens: number };
  headLang: string;
  upstreamLangs: string[];
  upstreamTaskIds: string[];
  errors?: { message: string }[];
}

function failedOrchestration(
  headLang: string,
  errors: { message: string }[],
  headModel = "",
  headUsage = { input_tokens: 0, output_tokens: 0 },
): OrchestrationResult {
  return {
    headSrc: null,
    headDescription: null,
    headChangeSummary: null,
    headModel,
    headUsage,
    headLang,
    upstreamLangs: [],
    upstreamTaskIds: [],
    errors,
  };
}

export async function orchestrateComposition({
  sequence,
  prompt,
  auth,
  options,
  currentCode,
  rid,
  conversationSummary,
  headExamples,
}: {
  sequence: string[];          // [headLang, s2, s3, …]; head consumes s2 consumes s3 …
  prompt: string;              // original user prompt — the content source for every stage
  auth: any;
  options?: any;
  currentCode?: string | null;
  rid?: string | null;
  conversationSummary?: any;
  headExamples?: any[] | null; // precomputed head-lang retrieval to reuse for the head stage
}): Promise<OrchestrationResult> {
  const headLang = sequence[0];
  const tail = sequence.slice(1); // langs consumed downstream, head→deepest order

  // Generate ALL stages CONCURRENTLY. No stage needs another's compiled output
  // at gen time — each just emits `data use "<next>"` (its dialect knows how) and
  // api merges the upstream data at runtime via depth-first chain eval. So each
  // stage gets only a wiring hint (the next lang id), never a fetched sample —
  // avoiding the serial tail-first wait + the redundant compile/getData. Content
  // always comes from the original prompt; the sequence only fixes order.
  const gens = sequence.map((lang, i) => {
    const next = sequence[i + 1];
    const upstreamContext = next ? { lang: next } : null;
    if (i === 0) {
      // Head: carries currentCode/conversation + reuses the head retrieval;
      // returned unposted for the resolver to post with systemValues.
      return generateCodeService({
        auth, prompt, lang, options, currentCode, rid, conversationSummary,
        upstreamContext, precomputedExamples: headExamples ?? null,
      });
    }
    return generateCodeService({ auth, prompt, lang, options, rid, upstreamContext });
  });

  const results: any[] = await Promise.all(gens);
  const headResult = results[0];

  for (let i = 1; i < results.length; i++) {
    const r = results[i];
    if (r?.errors || !r?.taskId) {
      return failedOrchestration(
        headLang,
        r?.errors || [{ message: `Upstream L${sequence[i]} failed to produce a taskId` }],
      );
    }
  }

  if (headResult?.errors) {
    return failedOrchestration(headLang, headResult.errors, headResult.model || "", {
      input_tokens: headResult.usage?.input_tokens || 0,
      output_tokens: headResult.usage?.output_tokens || 0,
    });
  }

  // Chain order: head + s2 + s3 + … (api evaluates depth-first).
  const upstreamTaskIds: string[] = [];
  for (let i = 1; i < results.length; i++) upstreamTaskIds.push(results[i].taskId as string);

  return {
    headSrc: headResult.code || null,
    headDescription: headResult.description ?? null,
    headChangeSummary: headResult.changeSummary ?? null,
    headModel: headResult.model || "",
    headUsage: {
      input_tokens: headResult.usage?.input_tokens || 0,
      output_tokens: headResult.usage?.output_tokens || 0,
    },
    headLang,
    upstreamLangs: tail,
    upstreamTaskIds,
  };
}

// ── Planning: prompt → language sequence ────────────────────────────────────
// The fast path is L0010 planning RAG (a vector lookup over curated, promoted
// L0010 examples); a miss falls back to the Haiku planner, whose result is
// captured as a mark-1 L0010 item for human curation. Returns the ordered
// sequence (length 1 ⇒ atomic).

// Planning-RAG lookup over promoted L0010 examples. Returns the stored sequence
// when the top hit clears PLAN_RAG_THRESHOLD, else null. The matched id +
// similarity are logged for analytics ONLY — never injected anywhere.
export async function lookupPlanRAG({
  prompt,
  rid,
}: {
  prompt: string;
  rid?: string | null;
}): Promise<string[] | null> {
  try {
    // Use the SAME query path as the main code-gen RAG (extractSearchQuery +
    // hybridSearch) so the lookup is symmetric with how L0010 keys are stored —
    // an identical prompt scores ~1.0. allowExact keeps a perfect (distance 0)
    // match from being dropped as degenerate.
    const query = extractSearchQuery(prompt);
    const results = await hybridSearch({
      collection: "training_examples",
      query,
      limit: 1,
      lang: PLAN_LANG,
      db: getDb(),
      rid: rid ?? null,
      allowExact: true,
    });
    const top = results?.[0];
    if (!top) return null;
    const score = top.combinedScore ?? top.similarity ?? 0;
    if (score < PLAN_RAG_THRESHOLD) {
      console.log(`[language-router] planRAG: best score=${score.toFixed(3)} < ${PLAN_RAG_THRESHOLD}, miss`);
      return null;
    }
    const sequence = extractLangIds(top.code || "", false);
    if (sequence.length === 0) return null;
    console.log(`[language-router] planRAG: HIT id=${top.id} score=${score.toFixed(3)} sequence=${sequence.map((l) => `L${l}`).join(" -> ")}`);
    return sequence;
  } catch (err) {
    console.warn("[language-router] planRAG lookup failed:", (err as Error)?.message);
    return null;
  }
}

// Persist a generated plan as a mark-1 L0010 item under the
// generating user's account, in the shape `download-training-examples` reads
// (help dialog + `plan [...]` source). Writing under the requesting user keeps
// item-owner == task-owner (the L0010 task was posted under their auth), so
// there's no cross-uid ACL mismatch. A human promotes good ones to mark 3/4,
// after which `update-embeddings` moves them into the L0010 planning-RAG corpus.
// The RAG itself stays curated from the admin uid via the curation scripts.
// Best-effort; skipped for free-plan / anonymous sessions.
export async function capturePlanForCuration(auth: any, prompt: string, sequence: string[]): Promise<void> {
  if (!auth?.uid || auth.freePlan) return;
  try {
    // Key the item on the canonical request (context-stripped) — the same text
    // the planning-RAG lookup queries with — so an identical prompt re-hits.
    const key = extractSearchQuery(prompt);
    const planSrc = `plan [${sequence.map((l) => `"${l}"`).join(" ")}]..`;
    const help = JSON.stringify([
      { type: "user", user: key, timestamp: "" },
      { type: "bot", help: { type: "code", language: "graffiticode", text: planSrc }, timestamp: "" },
    ]);
    // Parse to AST so it's a first-class item: getItems can lazily post a task
    // and the editor renders it. `src` is also kept for download-training-examples.
    let code: any = null;
    try {
      const parsed = await parseCode({ lang: PLAN_LANG, src: planSrc });
      if (!parsed.errors) code = JSON.parse(parsed.code);
    } catch (err) {
      console.warn("[language-router] capture: parse failed:", (err as Error)?.message);
    }
    const db = getDb();
    const ref = db.collection(`users/${auth.uid}/items`).doc();
    const now = Date.now();
    const item: Record<string, any> = {
      id: ref.id,
      name: `plan: ${key.slice(0, 60)}`,
      lang: PLAN_LANG,
      mark: 1, // uncurated auto-capture; a human promotes to 3/4 to enter the fast path
      help,
      src: planSrc,
      isPublic: false,
      client: "console",
      upstreamLangs: [],
      created: now,
      updated: now,
    };
    if (code) item.code = code;
    await ref.set(item);
    console.log(`[language-router] captured mark-1 L${PLAN_LANG} plan ${ref.id} sequence=${sequence.map((l) => `L${l}`).join(" -> ")}`);
  } catch (err) {
    console.warn("[language-router] capturePlanForCuration failed:", (err as Error)?.message);
  }
}

// Resolve the language sequence for a composable request:
//   1. planning-RAG hit (fast, no LLM) → return the stored sequence;
//   2. miss → generate an L0010 `plan` item (the planner dialect), parse its
//      sequence;
//   3. if L0010 is unreachable/unusable → fall back to the Haiku planner.
// Returns [headLang] when the request is atomic. `fromRag` is true only on a
// planning-RAG hit, so the resolver can skip re-capturing an already-curated
// plan.
export interface PlanResult {
  sequence: string[];
  fromRag: boolean;
}

export async function planSequence({
  prompt,
  headLang,
  auth,
  options,
  rid,
  preferHaiku = false,
}: {
  prompt: string;
  headLang: string;
  auth?: any;
  options?: any;
  rid?: string | null;
  // Skip the L0010 (Sonnet) codegen on a planRAG miss and go straight to the cheap
  // Haiku planner. Set when the gate was opened ONLY by capability (no RAG signal):
  // such requests are usually atomic (an agent inlined the data, or it's a plain
  // question), atomic plans are never curated so they ALWAYS miss planRAG, and we
  // don't want a ~4s Sonnet call on that hot atomic path. Haiku's prompt fast-returns
  // a single stage for those cases.
  preferHaiku?: boolean;
}): Promise<PlanResult> {
  const hit = await lookupPlanRAG({ prompt, rid });
  if (hit && hit.length > 0) return { sequence: hit, fromRag: true };

  // Capability-only trigger → skip the Sonnet L0010 codegen entirely.
  if (preferHaiku) {
    const plan = await planComposition({ prompt, currentLang: headLang });
    return { sequence: plan.map((s) => s.lang), fromRag: false };
  }

  // Miss → generate an L0010 plan. This is a direct service call (it does NOT
  // re-enter the resolver's composition cascade, so no recursion). The L0010
  // program is `plan ["<id>" ...]`; read the sequence straight from its source.
  try {
    const r: any = await generateCodeService({ auth, prompt, lang: PLAN_LANG, options, rid });
    if (!r?.errors && typeof r?.code === "string" && /\bplan\b/.test(r.code)) {
      const seq = [...new Set(extractLangIds(r.code, false))].slice(0, MAX_STAGES);
      console.log(`[language-router] L${PLAN_LANG} plan: ${seq.length ? seq.map((l) => `L${l}`).join(" -> ") : "atomic"}`);
      return { sequence: seq.length > 0 ? seq : [headLang], fromRag: false };
    }
    console.warn(`[language-router] L${PLAN_LANG} codegen returned no usable plan; falling back to Haiku planner`);
  } catch (err) {
    console.warn(`[language-router] L${PLAN_LANG} codegen failed (${(err as Error)?.message}); falling back to Haiku planner`);
  }

  // Fallback → Haiku planner. (Capture happens at the resolver's success point.)
  const plan = await planComposition({ prompt, currentLang: headLang });
  return { sequence: plan.map((s) => s.lang), fromRag: false };
}
