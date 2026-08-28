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
}) {
  const rid = generateRequestId();

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
    const codegenOptions = {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
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
      if (process.env.SCOPE_GATE_ENABLED !== "false" && !currentSrc) {
        const route = await classifyAndRoute({ userRequest: prompt, currentLang: language, rid, itemId, auth });
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
            return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: [{ message: `This request doesn't fit any available Graffiticode language. ${reason}` }], upstreamLangs: [], rid };
          }
        }
      }

      // Head-lang retrieval (for the routed language), reused by the atomic gen and the
      // composition head. Never fail generation if retrieval errors; just treat it as atomic.
      try {
        headExamples = await getRelevantExamples({ prompt, lang: language, rid }) || [];
      } catch (err: any) {
        console.warn(`[composition] rid=${rid} head retrieval failed: ${err?.message}`);
      }

      // GUARDRAIL 2 — permission-governed composition. `composesWith` is the HARD FENCE: the
      // planner may only propose edges within it (fenceComposition drops the rest). An empty
      // allowlist ⇒ atomic. The whole path is also globally disable-able via COMPOSITION_ENABLED.
      let sequence: string[] = [language];
      const permits = process.env.COMPOSITION_ENABLED === "false" ? [] : composesWithFor(language);
      if (permits.length > 0) {
        const planResult = await planSequence({ prompt, headLang: language, auth, options: codegenOptions, rid, itemId, preferHaiku: true });
        const fenced = fenceComposition(planResult.sequence, permits);
        if (fenced.dropped.length > 0) {
          console.warn(`[composition] rid=${rid} fenced unpermitted upstreams=[${fenced.dropped.join(",")}] permits=[${permits.join(",")}]`);
        }
        sequence = fenced.sequence;
        fromRagHit = planResult.fromRag;
      }
      console.log(`[composition] rid=${rid} head=${langLog} permits=[${permits.join(",")}] sequence=${sequence.map(l => `L${l}`).join(" -> ")}`);
      ragLog(rid, "composition.gate", { head: langLog, permits, sequence });

      if (sequence.length > 1) {
        headLang = sequence[0];
        console.log(`[composition] rid=${rid} sequence=${sequence.map(l => `L${l}`).join(" -> ")}`);
        ragLog(rid, "composition.plan", { sequence });

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
    const parseResult = await parseCode({ lang: headLang, src, privateValues, publicValues, accessToken: auth?.token });
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
          if (repair?.errors) {
            return { src: null, taskId: null, language, description: null, changeSummary: null, model, provider, tier, usage: null, errors: mapUsageLimit(repair.errors), upstreamLangs: [], rid };
          }
          const reparsed = await parseCode({ lang: headLang, src: repair.code, privateValues, publicValues, accessToken: auth?.token });
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

    const taskData = await postTask({
      auth,
      task: { lang: headLang, code },
      ephemeral: true,
      // Free-plan compiled tasks are owned by a shared service uid, so an
      // auth-less inline render (MCP widget iframe) can't read them. Post them
      // public so /form?id=<taskId> renders by their unguessable taskId.
      isPublic: auth.freePlan === true,
    });
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
  }
}

