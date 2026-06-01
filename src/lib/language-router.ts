import axios from "axios";
import admin from "firebase-admin";
import { CLAUDE_MODELS, generateCode as generateCodeService } from "./code-generation-service";
import { listLanguages } from "./languages";
import { vectorSearch } from "./embedding-service";
import { getData } from "../pages/api/resolvers";

// Hard bound on composition depth: head + at most (MAX_STAGES-1) upstream
// stages. Keeps planning cost and chain length sane.
const MAX_STAGES = 4;

// Composition planning is its own Graffiticode dialect, L0010: a program maps a
// prompt to an ordered language sequence (and nothing else). Plans are learned
// from the Haiku planner, written as mark-2 (yellow) items under the training
// uid, promoted to mark 3/4 by a human, then embedded into `training_examples`
// (lang 0010) — the same curation workflow every dialect uses.
const PLAN_LANG = "0010";
const TRAINING_UID = "24493e1c7a7f1ad57e3c478087c74c2dacb0cba1";
// A retrieved head-lang example containing `data use "<id>"` triggers planning;
// only examples this relevant count. A planning-RAG hit must be at least this
// similar to be trusted (no compile / no LLM on a hit).
const USE_TRIGGER_THRESHOLD = Number(process.env.COMPOSE_USE_TRIGGER_THRESHOLD ?? 0.6);
const PLAN_RAG_THRESHOLD = Number(process.env.COMPOSE_PLAN_RAG_THRESHOLD ?? 0.85);

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

// The compose trigger: do any sufficiently-relevant head-lang examples author a
// `data use "<id>"`? Returns the distinct upstream ids found (a hint only — the
// actual sequence comes from planning), or [] when the request looks atomic.
export function detectComposeTrigger(examples: any[]): string[] {
  if (!Array.isArray(examples)) return [];
  const hint = new Set<string>();
  for (const ex of examples) {
    const score = ex?.combinedScore ?? ex?.similarity ?? 0;
    if (score < USE_TRIGGER_THRESHOLD) continue;
    for (const id of extractLangIds(ex?.code || "", true)) hint.add(id);
  }
  return [...hint];
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
  const candidates = opts?.excludeLang
    ? languages.filter((l) => l.id !== opts.excludeLang)
    : languages;
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

  // Generate the tail deepest-first so each stage is authored knowing the real
  // data model produced by the stage it consumes. Content always comes from the
  // original prompt (the dialect + its own RAG take the right slice); the
  // sequence only fixes which languages run and in what order.
  const taskIdByIndex: Record<number, string> = {};
  let downstream: { lang: string; sample: unknown } | null = null;

  for (let i = sequence.length - 1; i >= 1; i--) {
    const lang = sequence[i];
    const r: any = await generateCodeService({
      auth,
      prompt,
      lang,
      options,
      rid,
      upstreamContext: downstream,
    });
    if (r?.errors || !r?.taskId) {
      return failedOrchestration(
        headLang,
        r?.errors || [{ message: `Upstream L${lang} failed to produce a taskId` }],
      );
    }
    taskIdByIndex[i] = r.taskId;

    // Fetch this stage's compiled data model to feed the next stage up.
    try {
      const compiled: any = await getData({ authToken: auth?.token, id: r.taskId });
      const sample = compiled && typeof compiled === "object" && "data" in compiled ? compiled.data : compiled;
      downstream = { lang, sample };
    } catch (err) {
      console.warn(
        `[language-router] orchestrateComposition: failed to fetch upstream L${lang} data:`,
        (err as Error)?.message,
      );
      downstream = { lang, sample: null };
    }
  }

  // Generate the head last — with currentCode (for edits), the data model of the
  // stage directly beneath it, and the reused head-lang retrieval. Hand back
  // src + metadata, not a posted task (the resolver re-parses+posts it).
  const headResult: any = await generateCodeService({
    auth,
    prompt,
    lang: headLang,
    options,
    currentCode,
    rid,
    conversationSummary,
    upstreamContext: downstream,
    precomputedExamples: headExamples ?? null,
  });

  if (headResult?.errors) {
    return failedOrchestration(headLang, headResult.errors, headResult.model || "", {
      input_tokens: headResult.usage?.input_tokens || 0,
      output_tokens: headResult.usage?.output_tokens || 0,
    });
  }

  // Chain order: head + s2 + s3 + … (api evaluates depth-first).
  const upstreamTaskIds: string[] = [];
  for (let i = 1; i < sequence.length; i++) upstreamTaskIds.push(taskIdByIndex[i]);

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
// captured as a mark-2 L0010 item for human curation. Returns the ordered
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
    const results = await vectorSearch({
      collection: "training_examples",
      query: prompt,
      limit: 1,
      lang: PLAN_LANG,
      db: getDb(),
      rid: rid ?? null,
    });
    const top = results?.[0];
    if (!top) return null;
    const sim = top.similarity ?? 0;
    if (sim < PLAN_RAG_THRESHOLD) {
      console.log(`[language-router] planRAG: best sim=${sim.toFixed(3)} < ${PLAN_RAG_THRESHOLD}, miss`);
      return null;
    }
    const sequence = extractLangIds(top.code || "", false);
    if (sequence.length === 0) return null;
    console.log(`[language-router] planRAG: HIT id=${top.id} sim=${sim.toFixed(3)} sequence=${sequence.map((l) => `L${l}`).join(" -> ")}`);
    return sequence;
  } catch (err) {
    console.warn("[language-router] planRAG lookup failed:", (err as Error)?.message);
    return null;
  }
}

// Persist a Haiku-produced plan as a mark-2 (yellow) L0010 item under the
// training uid, in the shape `download-training-examples` reads (help dialog +
// `plan [...]` source). A human promotes good ones to mark 3/4, after which
// `update-embeddings` moves them into the L0010 planning-RAG corpus. Best-effort.
async function capturePlanForCuration(prompt: string, sequence: string[]): Promise<void> {
  try {
    const planSrc = `plan [${sequence.map((l) => `"${l}"`).join(" ")}]..`;
    const help = JSON.stringify([
      { type: "user", user: prompt, timestamp: "" },
      { type: "bot", help: { type: "code", language: "graffiticode", text: planSrc }, timestamp: "" },
    ]);
    const db = getDb();
    const ref = db.collection(`users/${TRAINING_UID}/items`).doc();
    const now = Date.now();
    await ref.set({
      id: ref.id,
      name: "composition plan",
      lang: PLAN_LANG,
      mark: 2, // yellow — pending human review; promote to 3/4 to enter the fast path
      help,
      src: planSrc,
      isPublic: false,
      client: "console",
      upstreamLangs: [],
      created: now,
      updated: now,
    });
    console.log(`[language-router] captured mark-2 L${PLAN_LANG} plan ${ref.id} sequence=${sequence.map((l) => `L${l}`).join(" -> ")}`);
  } catch (err) {
    console.warn("[language-router] capturePlanForCuration failed:", (err as Error)?.message);
  }
}

// Resolve the language sequence for a composable request: planning-RAG hit
// (fast, no LLM) → else Haiku planner (captured as a mark-2 L0010 item for
// curation). Returns [headLang] when the request is actually atomic.
export async function planSequence({
  prompt,
  headLang,
  rid,
}: {
  prompt: string;
  headLang: string;
  rid?: string | null;
}): Promise<string[]> {
  const hit = await lookupPlanRAG({ prompt, rid });
  if (hit && hit.length > 0) return hit;

  // Miss → Haiku planner. (When the L0010 dialect is deployed this becomes
  // generateCode({lang:"0010"}); the captured examples seed that corpus today.)
  const plan = await planComposition({ prompt, currentLang: headLang });
  const sequence = plan.map((s) => s.lang);
  if (sequence.length > 1) {
    void capturePlanForCuration(prompt, sequence);
  }
  return sequence;
}
