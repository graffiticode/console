// Request-level code generation: the orchestration that turns ONE user request
// into a posted (possibly `+`-chained) task.
//
// This is the layer ABOVE the per-stage generator. `generateCode` in
// ../code-generation-service.ts generates a single language's program; this
// function owns everything around that — the scope gate, the composition
// planner and its permission fence, upstream orchestration, the `data use`
// binding repair, and stitching `head+s2+s3`.
//
// It lives here rather than in pages/api/resolvers.ts so that scripts, jobs and
// the GraphQL resolver all reach the SAME code path. When it lived in the
// resolver, scripts could only import the per-stage generator, so anything they
// produced was silently atomic — no plan, no upstream, no chain.
//
// IMPORTANT — do NOT re-export this from ../code-generation-service.ts or from a
// code-generation/index.ts barrel. language-router.ts imports
// code-generation-service, and this module imports language-router; routing the
// export through either of those recreates that cycle. Import the deep path.
import { unparse } from "@graffiticode/parser";
import { getLanguageAsset, getLanguageLexicon, isLangOverridden } from "../api";
import { generateCode as codeGenerationService, getRelevantExamples, extractSearchQuery } from "../code-generation-service";
import {
  planSequence,
  classifyAndRoute,
  composesWithFor,
  fenceComposition,
  orchestrateComposition,
  capturePlanForCuration,
  splitRequest,
} from "../language-router";
import { resolveUpstreams } from "../composition-discovery";
import { ragLog, generateRequestId } from "../logger";
import { langKey, emitEvent, actor } from "../funnel-events";
import { classifyPromptLanguage, promptLanguageKey } from "../prompt-language";
import { buildRevisionLimitError } from "../free-plan-quota";
import { trialItemRevisionLimit } from "../plans-config";
import { getFirestore } from "../../utils/db";
import { parseCode, postTask } from "../task-api";
import { getSecretsForUser, getPublicValuesForUser } from "../user-credentials";

type AuthArg = {
  uid: string;
  token: string;
  freePlan?: boolean;
  sessionNamespace?: string;
  sessionUuid?: string;
};

const db = getFirestore();

// Global cache for templates to avoid repeated fetches
const templateCache = new Map<string, string>();

/**
 * Free-plan revision budget.
 *
 * Enforced at the top of generation rather than in updateItem because that's
 * where the money goes: the MCP client generates first and only then writes the
 * resulting taskId back through updateItem, so gating the write would bill the
 * LLM call and refuse it afterwards.
 *
 * A not-yet-written item doc (createItem generates its template before the doc
 * exists) and a first generation (no taskId yet) both read 0 and pass.
 */
async function assertRevisionsRemaining(auth: AuthArg, itemId?: string): Promise<void> {
  if (!auth.freePlan || !itemId) return;
  const limit = trialItemRevisionLimit();
  const snap = await db.doc(`users/${auth.uid}/items/${itemId}`).get();
  if (!snap.exists) return;
  const used = Number(snap.data()?.trialRevisions) || 0;
  if (used >= limit) {
    throw buildRevisionLimitError(limit);
  }
}

export async function generateCodeForRequest({
  auth,
  prompt,
  language,
  options,
  currentSrc,
  conversationSummary = null,
  itemId = undefined,
  // The surface this request came from ("mcp" | "console" | "front"), threaded
  // in solely so funnel events emitted HERE can be attributed. Without it the
  // language gate's event carries no `app`, fails isMcpOrigin in funnel-digest,
  // and silently vanishes from all three report surfaces — which looks exactly
  // like "no non-English traffic". Scripts pass nothing and land as "console",
  // correctly dropping out of the MCP-scoped report.
  client = undefined,
  // Pin the request to `language` and skip GUARDRAIL 1 (the scope gate) for this call only.
  //
  // For REPLAYING A CORPUS PROMPT, not for user traffic. The corpus is generated with the gate
  // off (scripts/create-items-from-prompts.ts sets SCOPE_GATE_ENABLED=false), so its prompts were
  // authored with the language already chosen and never have to justify it — most visibly for a
  // vendor-gated language like L0176, whose prompts do not name Learnosity because nothing made
  // them. Replaying such a prompt with the gate ON is refused every time, which says nothing
  // about whether the language can still generate.
  //
  // A PARAMETER rather than the env var the script uses: that script owns its process, while this
  // runs inside the server, where mutating process.env.SCOPE_GATE_ENABLED would disable the gate
  // for every concurrent user request.
  skipScopeGate = false,
}) {
  const rid = generateRequestId();

  // Per-stage timing. Accumulates (+=) rather than assigns, because the repair
  // loop re-enters codeGenerationService and parseCode — a run that repaired
  // twice should report the total spent generating, not the last attempt.
  //
  // Declared out here, with the outcome trackers, so the `finally` below can
  // emit on EVERY exit: the early returns (revision budget, non-English gate,
  // out-of-scope reject, composition error) are exactly the paths whose cost is
  // otherwise invisible, and the throw path is where a 300s timeout lands.
  const tStart = Date.now();
  const stageMs: Record<string, number> = {};
  const mark = (stage: string, since: number) => {
    stageMs[stage] = (stageMs[stage] ?? 0) + (Date.now() - since);
  };
  let composedRun = false;
  let repairRuns = 0;

  try {
    if (!language) {
      return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: [{ message: "language is required" }], upstreamLangs: [], rid };
    }

    // Free-plan revision budget, checked before any generation spend. Creation
    // is gated separately (assertItemCreateAllowed); this bounds iteration on an
    // item that already exists.
    await assertRevisionsRemaining(auth, itemId);

    prompt = prompt.trim();
    // What every log line in this function must use in place of `language`.
    //
    // `language` is a free-text tool argument, so it is a prompt channel: clients
    // really do send descriptions in it, and the routing/RAG lines below fire on
    // the scope gate — precisely the path a non-language value takes. `language`
    // itself stays raw because the router needs the real value; only the LOGS get
    // the canonical form. Internally-derived ids (routedLang, permits, sequence,
    // headLang) are ours and need no such treatment.
    const langLog = langKey(language);
    let description = null;
    let changeSummary = null;
    let model = null;
    let provider = null;
    let tier = null;
    let usage = { input_tokens: 0, output_tokens: 0 };
    // Repair turns the head generation needed to reach a clean compile. Reported
    // by generateCode but dropped here, so callers (the training harness, the
    // analytics) could only infer "did this need fixing?" from token counts.
    let fixAttempts: number | null = null;

    ragLog(rid, "request.start", {
      promptLength: prompt.length,
      // langKey, not the raw value: `language` is a free-text tool argument and
      // clients put prompts in it. Logging promptLength instead of prompt right
      // above and then passing this through verbatim leaked the thing the line
      // above is careful about.
      language: langLog,
      hasCurrentSrc: !!currentSrc,
    });

    let src = null;
    // Build-time state layers added by composition. The head's posted taskId
    // gets these task ids appended with `+` to form the saved chain.
    let upstreamLangs: string[] = [];
    let upstreamTaskIds: string[] = [];
    let headLang = language;
    // True only when the sequence came from a planning-RAG hit (already curated),
    // so we don't re-capture a duplicate mark-2 plan for it.
    let fromRagHit = false;

    // Hoisted out of the `if (!src)` block below so the post-parse repair (which lives in
    // the outer scope) can reuse them: codegen options, the usage-limit message mapper, and
    // the head-lang retrieval (reused for the compose trigger, the head gen, and the repair).
    // No model/provider/tier here on purpose: the language's static priority list
    // decides which family serves the request, so there is nothing for a caller to
    // pass. See src/lib/model-priority.ts.
    // `effort` controls how much the model THINKS before answering, and it is the
    // dominant term in generation latency for this workload.
    //
    // claude-sonnet-5 runs adaptive thinking when `thinking` is omitted, which is
    // what codegen has always done — and Anthropic bills thinking inside
    // output_tokens without breaking it out, so it never appeared in our own
    // numbers. A 2026-08-31 L0179 sheet logged 15,278 output tokens over 149s for a
    // program whose source is roughly 4,000 tokens: the rest was invisible
    // reasoning. The spec service measured the same effect from the other side —
    // 42.7s with thinking disabled against 86.3s adaptive.
    //
    // Lowering effort is preferred to disabling thinking outright: it keeps the
    // model on its normal path while cutting the depth. Authoring a spreadsheet
    // from an explicit layout spec is closer to transcription than reasoning, which
    // is the workload shape that loses least at low effort.
    //
    // Env-driven and unset by default, so the current behaviour is unchanged until
    // it is turned on deliberately, and it can be tuned or reverted on a live
    // service without a rebuild.
    const codegenEffort = process.env.CODEGEN_EFFORT || undefined;
    // ONE deadline for the whole request, created here and threaded down.
    //
    // generateLongCode bounds its continuation loop, but it defaults the budget
    // when none is passed — so every caller that starts a fresh generation starts
    // a fresh budget, and those callers MULTIPLY: the repair loop runs up to
    // MAX_FIX_ATTEMPTS (5) generations, and each of those tries up to 2 providers.
    // 5 x 2 fresh 240s budgets is 40 minutes of legal runtime, which is not a
    // bound at all. Creating it once here is what makes the number mean something.
    //
    // 420s leaves headroom under the 900s Cloud Run / Cloud Tasks ceiling for
    // parse, postTask and the item write that follow generation. It is the
    // REQUEST budget; the per-generation budget inside the loop stays smaller.
    const requestDeadlineAt =
      Date.now() +
      (Number(process.env.CODEGEN_REQUEST_BUDGET_MS) > 0
        ? Number(process.env.CODEGEN_REQUEST_BUDGET_MS)
        : 420_000);
    const codegenOptions = {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      deadlineAt: requestDeadlineAt,
      ...(codegenEffort ? { effort: codegenEffort } : {}),
    };
    const mapUsageLimit = (errs: any[]) => errs.map(err => ({
      ...err,
      message: err.message === 'Usage limit reached'
        ? 'Usage limit reached. Please upgrade your account or add overage units in Settings to continue. Your usage will reset to zero on the next billing cycle.'
        : err.message
    }));
    let headExamples: any[] = [];

    // Template generation
    if (prompt === "Create a minimal starting template") {
      const cacheKey = `L${language}`;
      // When this language is overridden for the caller the fetch is redirected
      // to a test revision, so bypass the shared (lang-keyed) template cache on
      // read and write. Non-overridden languages keep using the shared cache.
      const overridden = await isLangOverridden(language, auth?.token);
      src = overridden ? undefined : templateCache.get(cacheKey);
      if (!src) {
        src = await getLanguageAsset(`L${language}`, 'template.gc', auth?.token);
        if (src && !overridden) {
          templateCache.set(cacheKey, src);
        }
      }
      if (src) {
        description = "Template";
        changeSummary = "Initial code";
        model = "template-file";
      }
    }

    // Code generation — if no template source.
    //
    // Composition cascade:
    //   1. ATOMIC GUARD (free): retrieve head-lang examples once; if none above
    //      threshold authors `data use "<id>"`, the request is atomic — go
    //      straight to single-language code gen, reusing that retrieval.
    //   2. Otherwise PLAN: planSequence() (L0010 planning-RAG hit, else Haiku);
    //      a length>1 sequence runs the tail-first executor.
    if (!src) {
      // GUARDRAIL 0 — is this request even written in English?
      //
      // Ahead of the scope gate because it is free and deterministic where that
      // one is an LLM call, and because a non-English prompt degrades every
      // stage BELOW here silently rather than failing (see prompt-language.ts).
      // Unlike GUARDRAIL 1 this is NOT `!currentSrc`-gated: an update in Russian
      // breaks retrieval exactly as a create does.
      //
      // Fed extractSearchQuery(prompt), never the raw prompt. On the update path
      // the MCP server sends a windowed conversation (buildContextualPrompt), so
      // judging the whole thing would let prior English turns outvote a Russian
      // request. extractSearchQuery isolates the latest turn — which is the very
      // text that gets embedded, so the gate judges what actually breaks.
      const gateMode = process.env.NON_ENGLISH_GATE || "shadow";
      if (gateMode !== "off") {
        const plr = classifyPromptLanguage(extractSearchQuery(prompt, language));
        if (plr.verdict === "non_english") {
          const blocked = gateMode === "enforce";
          console.log(`[routing] rid=${rid} language-gate lang=${langLog} verdict=${plr.verdict} key=${promptLanguageKey(plr)} latinRatio=${plr.latinRatio} blocked=${blocked}`);
          ragLog(rid, "preflight.language", { lang: langLog, script: plr.script, plang: plr.plang, latinRatio: plr.latinRatio, blocked });
          emitEvent("non_english_request", {
            ...actor(auth),
            app: client ?? "console",
            lang: langLog,
            script: plr.script,
            plang: plr.plang,
            blocked,
          });
          if (blocked) {
            // A wall in the taxonomy sense, recorded for consistency with the
            // other seven. It does NOT reach the digest/report/SMS: wall_hit
            // carries no `app`, so isMcpOrigin drops it. non_english_request
            // above is what those surfaces actually read.
            emitEvent("wall_hit", { ...actor(auth), wall: "non_english_request", lang: langLog, script: plr.script });
            const message =
              "Graffiticode does not yet support requests written in languages other than English. " +
              "Please restate the request in English and try again. Text that should appear inside " +
              "the item itself — vocabulary, names, quoted passages — may stay in its original language.";
            return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: [{ message }], upstreamLangs: [], rid };
          }
        }
      }

      // GUARDRAIL 1 — authoritative pre-flight head routing. The server validates the request
      // against the chosen language's scope and re-routes to the correct language if the client
      // picked wrong (clients freelance). Fresh creates only — never relabel an edit. Independent
      // of client cooperation and of the generation LLM volunteering OUT_OF_SCOPE.
      if (process.env.SCOPE_GATE_ENABLED !== "false" && !skipScopeGate && !currentSrc) {
        const tRoute = Date.now();
        const route = await classifyAndRoute({ userRequest: prompt, currentLang: language, rid, itemId, auth });
        mark("route", tRoute);
        // Log EVERY decision (in-scope included) so routing is observable — an in-scope verdict
        // is otherwise silent, which masks scope.json contracts that are too permissive.
        // `lang=${langKey(language)}` rather than `lang=L${language}`: this line
        // fires on the scope gate, which is exactly the path a junk `language`
        // reaches, so the raw interpolation printed whole prompts.
        console.log(`[routing] rid=${rid} scope-gate lang=${langLog} inScope=${route.inScope} routedLang=${route.routedLang ? "L" + route.routedLang : "none"}${route.reason ? ` reason=${route.reason}` : ""}`);
        ragLog(rid, "preflight.classify", { lang: langLog, inScope: route.inScope, routedLang: route.routedLang, reason: route.reason });
        if (route.inScope === false) {
          if (route.routedLang && route.routedLang !== language) {
            console.log(`[routing] rid=${rid} preflight.reroute from=${langLog} to=L${route.routedLang} reason=${route.reason}`);
            ragLog(rid, "preflight.reroute", { from: langLog, to: route.routedLang, reason: route.reason });
            language = route.routedLang;
            headLang = route.routedLang;
          } else if (!route.routedLang) {
            const reason = route.reason || `Request is out of scope for L${language}.`;
            console.log(`[routing] rid=${rid} preflight.reject lang=${langLog} reason=${reason}`);
            ragLog(rid, "preflight.reject", { lang: langLog, reason });
            // `code` is additive and nothing branches on it today. It exists so a
            // non-human caller can tell "the platform correctly refused an out-of-scope
            // request" apart from "generation broke" without matching on prose — the
            // distinction the daily corpus ping needs (src/lib/corpus-ping.ts), where the
            // former is a stale corpus prompt and the latter is an outage.
            return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: [{ message: `This request doesn't fit any available Graffiticode language. ${reason}`, code: "out_of_scope" }], upstreamLangs: [], rid };
          }
        }
      }

      // Head-lang retrieval (for the routed language), reused by the atomic gen and the
      // composition head. Never fail generation if retrieval errors; just treat it as atomic.
      try {
        const tRetrieve = Date.now();
        headExamples = await getRelevantExamples({ prompt, lang: language, rid }) || [];
        mark("retrieve", tRetrieve);
      } catch (err: any) {
        console.warn(`[composition] rid=${rid} head retrieval failed: ${err?.message}`);
      }

      // GUARDRAIL 2 — permission-governed composition. `composesWith` is the HARD FENCE: the
      // planner may only propose edges within it (fenceComposition drops the rest). An empty
      // allowlist ⇒ atomic. The whole path is also globally disable-able via COMPOSITION_ENABLED.
      let sequence: string[] = [language];
      const permits = process.env.COMPOSITION_ENABLED === "false" ? [] : composesWithFor(language);
      if (permits.length > 0) {
        const tPlan = Date.now();
        const planResult = await planSequence({ prompt, headLang: language, auth, options: codegenOptions, rid, itemId, preferHaiku: true });
        mark("plan", tPlan);
        const fenced = fenceComposition(planResult.sequence, permits);
        if (fenced.dropped.length > 0) {
          console.warn(`[composition] rid=${rid} fenced unpermitted upstreams=[${fenced.dropped.join(",")}] permits=[${permits.join(",")}]`);
        }
        sequence = fenced.sequence;
        fromRagHit = planResult.fromRag;
      }
      // `head` is the EFFECTIVE head — `language` after any preflight reroute —
      // not the one the caller asked for. langLog is the pre-reroute value, and
      // printing it here made a reroute look like a composition failure: the
      // 2026-08-29 L0169→L0166 misroute logged `head=L0169 sequence=["0166"]`,
      // which reads as the planner emitting a foreign head under an empty
      // permits list — a bug in a component that had not run. The requested
      // language is already recorded by preflight.classify/preflight.reroute, so
      // nothing is lost by making this line agree with what actually generated.
      const headLog = langKey(language);
      console.log(`[composition] rid=${rid} head=${headLog} requested=${langLog} permits=[${permits.join(",")}] sequence=${sequence.map(l => `L${l}`).join(" -> ")}`);
      ragLog(rid, "composition.gate", { head: headLog, requested: langLog, permits, sequence });

      if (sequence.length > 1) {
        headLang = sequence[0];
        console.log(`[composition] rid=${rid} sequence=${sequence.map(l => `L${l}`).join(" -> ")}`);
        ragLog(rid, "composition.plan", { sequence });

        composedRun = true;
        const tCompose = Date.now();
        const orch = await orchestrateComposition({
          sequence,
          prompt,
          auth,
          options: codegenOptions,
          currentCode: currentSrc,
          rid,
          itemId,
          conversationSummary,
          headExamples: headLang === language ? headExamples : null,
        });
        mark("compose", tCompose);

        if (orch.errors) {
          return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, provider: orch.headProvider ?? null, tier: orch.headTier ?? null, usage: null, errors: mapUsageLimit(orch.errors), upstreamLangs: [], rid };
        }

        src = orch.headSrc;
        model = orch.headModel;
        provider = orch.headProvider;
        tier = orch.headTier;
        usage = orch.headUsage;
        description = orch.headDescription;
        changeSummary = orch.headChangeSummary;
        upstreamLangs = orch.upstreamLangs;
        upstreamTaskIds = orch.upstreamTaskIds;
      } else {
        // Atomic — single-language code gen, reusing the head retrieval.
        const tGen = Date.now();
        const result = await codeGenerationService({
          auth,
          prompt,
          lang: language,
          options: codegenOptions,
          currentCode: currentSrc,
          rid,
          conversationSummary,
          precomputedExamples: headExamples,
          itemId,
        });
        mark("generate", tGen);

        if ('errors' in result && result.errors) {
          return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, provider: (result as any).provider ?? null, tier: (result as any).tier ?? null, usage: null, errors: mapUsageLimit(result.errors), upstreamLangs: [], rid };
        }

        const successResult = result as {
          code: any;
          taskId: string;
          model: string;
          provider: string;
          tier: string;
          usage: any;
          description: string | null;
          changeSummary: string | null;
          fixAttempts?: number;
        };
        src = successResult.code;
        model = successResult.model;
        provider = successResult.provider;
        tier = successResult.tier;
        usage = successResult.usage;
        description = successResult.description;
        changeSummary = successResult.changeSummary;
        fixAttempts = successResult.fixAttempts ?? null;
      }
    }

    // Parse the head src, then post it. Private secrets and public credential ids
    // come from separate stores; itemId is a system-injected public value.
    const privateValues: Record<string, string> = await getSecretsForUser(auth?.uid);
    const publicValues: Record<string, string> = await getPublicValuesForUser(auth?.uid);
    if (itemId) publicValues.itemId = itemId;
    const tParse = Date.now();
    const parseResult = await parseCode({ lang: headLang, src, privateValues, publicValues, accessToken: auth?.token });
    mark("parse", tParse);
    if (parseResult.errors) {
      // Preserve the generated source alongside the parse errors so the
      // editor can render it with inline compile-error decorations, matching
      // the user-typed flow.
      return { src, taskId: null, language, description, changeSummary, model, provider, tier, usage, errors: parseResult.errors, upstreamLangs: [] };
    }
    let code = JSON.parse(parseResult.code);

    try {
      if (upstreamTaskIds.length === 0) {
        // No planner-driven composition. Honor any hand-written
        // `data use "<lang>"` in the generated/edited head (reactive path),
        // generating each upstream with the user's prompt verbatim.
        const resolved = await resolveUpstreams(code);
        if (resolved.upstreams.length > 0) {
          code = resolved.ast;
          upstreamLangs = resolved.upstreams;
          console.log(`[composition] rid=${rid} headLang=${headLang} reactive upstreams=${upstreamLangs.join(",")}`);
          ragLog(rid, "composition.reactive", { headLang, upstreamLangs });

          // Same split as the planner path: an upstream discovered from the head's
          // `data use` still receives the whole request otherwise, host framing and
          // all. Head keeps the original prompt (it is already generated by now);
          // only the upstreams get a scoped share. Fail-open to the original.
          const reactivePrompts = await splitRequest({
            prompt,
            sequence: [headLang, ...upstreamLangs],
            rid,
            itemId,
            auth,
          });
          const upstreamResults = await Promise.all(
            upstreamLangs.map((uLang, i) =>
              codeGenerationService({
                auth,
                prompt: reactivePrompts?.[i + 1] ?? prompt,
                lang: uLang,
                options: codegenOptions,
                rid,
                itemId,
              })
            )
          );
          const upstreamErrors = upstreamResults.flatMap((r: any, i: number) => {
            if (r && 'errors' in r && r.errors) return r.errors;
            if (!r?.taskId) return [{ message: `Upstream L${upstreamLangs[i]} failed to produce a taskId` }];
            return [];
          });
          if (upstreamErrors.length > 0) {
            return { src: null, taskId: null, language, description: null, changeSummary: null, model, provider, tier, usage: null, errors: upstreamErrors, upstreamLangs: [], rid };
          }
          upstreamTaskIds = upstreamResults.map((r: any) => r.taskId as string);
        }
      } else {
        // Planner/provenance-driven composition already generated the tail. Verify the head
        // actually emitted `data use "<nextStageLang>"` so the chained upstream data will
        // flow. Linear pipeline → the head only binds upstreamLangs[0] (deeper stages bind
        // each other). If the binding is missing, regenerate the head ONCE with a
        // strengthened directive; if it still won't bind, fail with an actionable error
        // rather than silently posting a `+`-chain whose upstream data never flows.
        const expected = upstreamLangs[0];
        let resolved = await resolveUpstreams(code);
        if (expected && !resolved.upstreams.includes(expected)) {
          console.log(`[composition] rid=${rid} repair.start head=L${headLang} expected=L${expected}`);
          ragLog(rid, "composition.repair.start", { headLang, expected });
          repairRuns++;
          const tRepair = Date.now();
          const repair: any = await codeGenerationService({
            auth,
            lang: headLang,
            options: codegenOptions,
            currentCode: currentSrc,
            rid,
            conversationSummary,
            precomputedExamples: headLang === language ? headExamples : null,
            itemId,
            upstreamContext: { lang: expected },
            prompt: `${prompt}\n\nIMPORTANT: This program is the HEAD of a composition pipeline and MUST bind its upstream by emitting a top-level \`data use "${expected}"\` so the upstream data flows at runtime. Do not omit it.`,
          });
          mark("repair", tRepair);
          if (repair?.errors) {
            return { src: null, taskId: null, language, description: null, changeSummary: null, model, provider, tier, usage: null, errors: mapUsageLimit(repair.errors), upstreamLangs: [], rid };
          }
          const tReparse = Date.now();
          const reparsed = await parseCode({ lang: headLang, src: repair.code, privateValues, publicValues, accessToken: auth?.token });
          mark("parse", tReparse);
          if (reparsed.errors) {
            return { src: repair.code, taskId: null, language, description, changeSummary, model, provider, tier, usage, errors: reparsed.errors, upstreamLangs: [] };
          }
          code = JSON.parse(reparsed.code);
          resolved = await resolveUpstreams(code);
          if (resolved.upstreams.includes(expected)) {
            src = repair.code;
            model = repair.model;
            provider = repair.provider;
            tier = repair.tier;
            usage = repair.usage;
            description = repair.description ?? description;
            changeSummary = repair.changeSummary ?? changeSummary;
            console.log(`[composition] rid=${rid} repair.ok head=L${headLang} bound=L${expected}`);
            ragLog(rid, "composition.repair.ok", { headLang, expected });
          } else {
            console.warn(`[composition] rid=${rid} repair.failed head=L${headLang} expected=L${expected}`);
            ragLog(rid, "composition.repair.failed", { headLang, expected });
            return {
              src: repair.code, taskId: null, language, description, changeSummary, model, provider, tier, usage,
              errors: [{ message: `Composition failed: head L${headLang} could not bind upstream L${expected}. Try rephrasing the request.` }],
              upstreamLangs: [],
            };
          }
        }
      }
    } catch (err: any) {
      return {
        src: null, taskId: null, language, description: null, changeSummary: null, model, provider, tier, usage: null,
        errors: [{ message: err?.message || "Composition discovery failed", from: -1, to: -1 }],
        upstreamLangs: [],
      };
    }

    const tPost = Date.now();
    const taskData = await postTask({
      auth,
      task: { lang: headLang, code },
      ephemeral: true,
      // Free-plan compiled tasks are owned by a shared service uid, so an
      // auth-less inline render (MCP widget iframe) can't read them. Post them
      // public so /form?id=<taskId> renders by their unguessable taskId.
      isPublic: auth.freePlan === true,
    });
    mark("post", tPost);
    const headTaskId = taskData.id;
    if (!headTaskId) {
      throw new Error("Failed to get taskId");
    }
    const taskId = upstreamTaskIds.length > 0
      ? `${headTaskId}+${upstreamTaskIds.join("+")}`
      : headTaskId;
    console.log(`[composition] rid=${rid} final taskId=${taskId} upstreamLangs=${upstreamLangs.length ? upstreamLangs.join(",") : "none"}`);
    // Capture the realized composition sequence as a mark-2 L0010 plan item for
    // curation — covers BOTH the planner and the reactive paths (the planner's
    // RAG trigger can miss, so capture here, not inside planSequence). Skip when
    // the sequence came from a planning-RAG hit: that plan is already curated.
    if (upstreamLangs.length > 0 && !fromRagHit) {
      await capturePlanForCuration(auth, prompt, [headLang, ...upstreamLangs]);
    }
    const lexicon = await getLanguageLexicon(headLang, auth?.token);
    const resolvedSrc = unparse(code, lexicon || {});

    ragLog(rid, "request.end", {
      taskId,
      model,
      provider,
      tier,
      usage,
      upstreamLangs,
      success: true,
    });

    return { src: resolvedSrc, taskId, language: headLang, description, changeSummary, model, provider, tier, usage, fixAttempts, errors: null, upstreamLangs, rid };
  } catch (error) {
    console.error("generateCodeForRequest()", "ERROR", error);
    ragLog(rid, "request.error", { error: error.message });
    // Outermost catch: sits outside the scope where model/provider/tier are
    // bound, and a throw this far out may predate generation entirely — so
    // nulls here are the honest answer, not a dropped field.
    return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, provider: null, tier: null, usage: null, errors: [{ message: error.message }], upstreamLangs: [], rid };
  } finally {
    // Best-effort, and deliberately in `finally`: the early returns above (revision
    // budget, non-English gate, out-of-scope reject, composition error) and the
    // caught throw are exactly the runs whose cost is otherwise unrecorded.
    // emitEvent swallows its own errors, so this cannot break a generation.
    //
    // `language` is the function PARAMETER and is reassigned by a preflight
    // reroute, so this reports the language that actually generated — matching
    // the [composition] head= line rather than the caller's original pick.
    emitEvent("item_generation_timing", {
      ...actor(auth),
      lang: langKey(language),
      app: client ?? "console",
      rid,
      total_ms: Date.now() - tStart,
      // Milliseconds per stage. Absent means the stage did not run — an atomic
      // request has no compose_ms, an edit has no route_ms — which is itself the
      // signal: it says which pipeline a run actually took.
      ...Object.fromEntries(Object.entries(stageMs).map(([k, v]) => [`${k}_ms`, v])),
      composed: composedRun,
      repairs: repairRuns,
    });
  }
}

