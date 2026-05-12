import axios from "axios";
import { CLAUDE_MODELS, generateCode as generateCodeService } from "./code-generation-service";
import { listLanguages } from "./languages";

interface LanguageSuggestion {
  id: string;
  name: string;
  description: string;
  reason: string;
}

interface RoutingResult {
  suggestions: LanguageSuggestion[];
}

// Build the catalog string used by both the reactive (findBestLanguages) and
// proactive (classifyComposition) planners. excludeLang lets the reactive
// path filter out the current language; the proactive path passes none so
// every language is in scope.
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

// Proactive composition planner. Decides whether the user's request needs
// multiple languages composed; if so, returns a head dialect plus an ordered
// list of upstream layers, each with its own scoped prompt. Empty `upstreams`
// means single-language and the resolver should follow today's path.
export interface CompositionPlan {
  head: { lang: string; prompt: string };
  upstreams: { lang: string; prompt: string }[];
}

export async function classifyComposition({
  prompt,
  currentLang,
}: {
  prompt: string;
  currentLang: string;
}): Promise<CompositionPlan> {
  const fallback: CompositionPlan = { head: { lang: currentLang, prompt }, upstreams: [] };
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
        max_tokens: 600,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: `A user asked: "${prompt}"

The active language is L${currentLang}. Available languages (each routing hint may state which other dialects it embeds):
${catalog}

A request needs composition when the active language describes-but-does-not-author a content type produced by another dialect — e.g. a host language (L0158) embeds an interactive widget authored by another (L0166 spreadsheets, L0159 flashcards). If the active language alone can fulfil the request, return upstreams: [].

Heuristics:
- If the active language's routing hint says it "embeds" or "hosts" another dialect for a particular content type, and the user's prompt asks for that content type, add that dialect as an upstream.
- A "spreadsheet question", "spreadsheet assessment", "table-based assessment", or "use the spreadsheet" prompt under an embedding host (e.g. L0158) ⇒ upstream is the spreadsheet dialect (L0166).
- A pure question-form prompt (MCQ, short text, fill-in-the-blank) under L0158 ⇒ no upstream.
- If the user is already in the spreadsheet dialect itself (e.g. currentLang=0166) and asks for a spreadsheet, no upstream — the active language authors it directly.

Return JSON only:
{
  "head": { "lang": "${currentLang}", "prompt": "<scoped prompt for the head>" },
  "upstreams": [
    { "lang": "<id>", "prompt": "<scoped prompt for that upstream>" }
  ]
}

Examples:
- prompt: "create a simple spreadsheet assessment for learnosity", currentLang: 0158 →
  { "head": { "lang": "0158", "prompt": "Build a Learnosity assessment item that embeds a spreadsheet interaction via its custom question type." },
    "upstreams": [ { "lang": "0166", "prompt": "Create a small interactive spreadsheet with a few rows and columns of data and one or two assessed cells the learner must fill in." } ] }
- prompt: "make an MCQ about France", currentLang: 0158 →
  { "head": { "lang": "0158", "prompt": "Build a Learnosity MCQ item about France." }, "upstreams": [] }
- prompt: "make a budget tracker spreadsheet", currentLang: 0166 →
  { "head": { "lang": "0166", "prompt": "Author a budget-tracker spreadsheet." }, "upstreams": [] }

Rules:
- "head.lang" should remain "${currentLang}" unless the request is entirely outside that dialect.
- "upstreams" is at most one entry for now.
- Each "prompt" is a complete, standalone description of what that language should produce.`,
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
      console.log(`[language-router] classifyComposition: no JSON in response, falling back. raw=${text.substring(0, 200)}`);
      return fallback;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const headLang = String(parsed?.head?.lang || currentLang);
    const headPrompt = String(parsed?.head?.prompt || prompt);
    const rawUpstreams = Array.isArray(parsed?.upstreams) ? parsed.upstreams : [];

    const upstreams = rawUpstreams
      .slice(0, 1)
      .map((u: any) => ({
        lang: String(u?.lang || ""),
        prompt: String(u?.prompt || ""),
      }))
      .filter((u: { lang: string; prompt: string }) =>
        u.lang && u.prompt && u.lang !== headLang && candidates.some((c) => c.id === u.lang)
      );

    console.log(
      `[language-router] classifyComposition: head=L${headLang} upstreams=${
        upstreams.length > 0 ? upstreams.map((u) => `L${u.lang}`).join(",") : "none"
      } rawUpstreamCount=${rawUpstreams.length}`
    );

    return {
      head: { lang: headLang, prompt: headPrompt },
      upstreams,
    };
  } catch (error) {
    console.error("[language-router] classifyComposition error:", (error as Error)?.message);
    return fallback;
  }
}

// Run the composition orchestration when classifyComposition returned a
// non-empty `upstreams` list. Generates each upstream as a standalone task,
// generates the head, and returns the head's source plus the upstream
// taskIds for the resolver to stitch onto the head's post-systemValues
// taskId. Each layer is produced by a single-language code-gen call;
// composition awareness lives only here.
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

export async function orchestrateComposition({
  plan,
  auth,
  options,
  currentCode,
  rid,
  conversationSummary,
}: {
  plan: CompositionPlan;
  auth: any;
  options?: any;
  currentCode?: string | null;
  rid?: string | null;
  conversationSummary?: any;
}): Promise<OrchestrationResult> {
  const headLang = plan.head.lang;

  // Generate each upstream in parallel — they're independent of each other
  // and of the head. Each returns a fully-posted, standalone taskId.
  const upstreamResults = await Promise.all(
    plan.upstreams.map((u) =>
      generateCodeService({
        auth,
        prompt: u.prompt,
        lang: u.lang,
        options,
        rid,
      })
    )
  );

  for (let i = 0; i < upstreamResults.length; i++) {
    const r: any = upstreamResults[i];
    if (r?.errors || !r?.taskId) {
      const lang = plan.upstreams[i].lang;
      return {
        headSrc: null,
        headDescription: null,
        headChangeSummary: null,
        headModel: "",
        headUsage: { input_tokens: 0, output_tokens: 0 },
        headLang,
        upstreamLangs: [],
        upstreamTaskIds: [],
        errors: r?.errors || [{ message: `Upstream L${lang} failed to produce a taskId` }],
      };
    }
  }

  const upstreamLangs = plan.upstreams.map((u) => u.lang);
  const upstreamTaskIds = upstreamResults.map((r: any) => r.taskId as string);

  // Generate the head. The resolver re-parses+posts the head src with
  // systemValues, so we hand back src + metadata, not a posted taskId.
  const headResult: any = await generateCodeService({
    auth,
    prompt: plan.head.prompt,
    lang: headLang,
    options,
    currentCode,
    rid,
    conversationSummary,
  });

  if (headResult?.errors) {
    return {
      headSrc: null,
      headDescription: null,
      headChangeSummary: null,
      headModel: headResult.model || "",
      headUsage: {
        input_tokens: headResult.usage?.input_tokens || 0,
        output_tokens: headResult.usage?.output_tokens || 0,
      },
      headLang,
      upstreamLangs: [],
      upstreamTaskIds: [],
      errors: headResult.errors,
    };
  }

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
    upstreamLangs,
    upstreamTaskIds,
  };
}
