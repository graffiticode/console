import admin from "firebase-admin";
import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index";
import { buildGetTaskDaoForStorageType } from "./utils";
import { getFirestore } from "../../utils/db";
import { getApiTask, getBaseUrlForApi, getLanguageAsset, getLanguageLexicon, isLangOverridden, languageOfflineMessage, isLanguageOfflineError } from "../../lib/api";
import { parser, unparse } from "@graffiticode/parser";
import { generateCode as codeGenerationService, getRelevantExamples } from "../../lib/code-generation-service";
import { generateSpec } from "../../lib/spec-generation-service";
import { planSequence, classifyAndRoute, composesWithFor, fenceComposition, orchestrateComposition, capturePlanForCuration } from "../../lib/language-router";
import { resolveUpstreams } from "../../lib/composition-discovery";
import { ragLog, generateRequestId } from "../../lib/logger";
import { FREE_PLAN_ITEM_TTL_MS } from "../../lib/free-plan-context";
import { chargeAutoOverage } from "../../lib/auto-overage-service";
import fs from "fs";
import path from "path";
import { encrypt, decrypt, isConfigured as isSecretCryptoConfigured } from "../../lib/secret-crypto";
import { getCredentialBackend, fieldVisibilityFor } from "../../lib/credential-backends";

type AuthArg = {
  uid: string;
  token: string;
  freePlan?: boolean;
  sessionNamespace?: string;
};

function isItemVisibleToFreePlan(
  data: any,
  auth: AuthArg,
  opts: { byId?: boolean } = {},
  now = Date.now(),
): boolean {
  if (!auth.freePlan) return true;
  // By-id access treats the unguessable item id as the capability (like the public
  // app form page, which renders any item by id): no sessionNamespace match required,
  // only non-expiry. This is what lets a stateless MCP client (ChatGPT opens a new
  // session per tool call) retrieve/refine an item it just created. LISTING still
  // requires the session match, so a session can never enumerate another's items.
  if (!opts.byId && data?.sessionNamespace !== auth.sessionNamespace) return false;
  if (typeof data?.expiresAt === "number" && data.expiresAt <= now) return false;
  return true;
}

function freePlanItemFields(auth: AuthArg, now = Date.now()) {
  return {
    freePlan: true,
    sessionNamespace: auth.sessionNamespace,
    expiresAt: now + FREE_PLAN_ITEM_TTL_MS,
  };
}
// import { buildDynamicSchema } from "./schemas";

const SECRET_NAME_RE = /^[a-z0-9-]+$/;

// Credential fields are stored as individual variables, keyed by their binding
// name `<backend>-<field>`, split across two physically separate stores by
// visibility:
//   - secrets doc:     { <name>: { backend?, value: <ciphertext>, updatedAt } } -> get-val-private
//   - credentials doc: { <name>: { backend?, value: <plaintext>,  updatedAt } } -> get-val-public
// The public read path never opens the secrets doc, so a secret value cannot be
// returned in cleartext through get-val-public.
type StoredVar = { backend?: string; value: string; updatedAt: string };

function secretsDocRef(uid: string) {
  return db.collection('users').doc(uid).collection('settings').doc('secrets');
}

function credentialsDocRef(uid: string) {
  return db.collection('users').doc(uid).collection('settings').doc('credentials');
}

// Loads the user's private credential fields as a plaintext name->value map for
// the private parse callback. Never throws into the parse path — returns {} on
// any failure. Reads ONLY the secrets doc.
export async function getSecretsForUser(uid: string): Promise<Record<string, string>> {
  try {
    if (!uid) return {};
    const doc = await secretsDocRef(uid).get();
    if (!doc.exists) return {};
    const stored = (doc.data()?.secrets || {}) as Record<string, StoredVar>;
    const out: Record<string, string> = {};
    for (const [name, entry] of Object.entries(stored)) {
      if (entry?.value != null) out[name] = decrypt(entry.value);
    }
    return out;
  } catch (err) {
    console.error("getSecretsForUser failed:", err);
    return {};
  }
}

// Loads the user's public credential fields as a plaintext name->value map for
// the public parse callback. Never throws into the parse path — returns {} on
// any failure. Reads ONLY the credentials doc (never the secrets doc).
export async function getPublicValuesForUser(uid: string): Promise<Record<string, string>> {
  try {
    if (!uid) return {};
    const doc = await credentialsDocRef(uid).get();
    if (!doc.exists) return {};
    const stored = (doc.data()?.credentials || {}) as Record<string, StoredVar>;
    const out: Record<string, string> = {};
    for (const [name, entry] of Object.entries(stored)) {
      if (entry?.value != null && entry.value !== "") out[name] = entry.value;
    }
    return out;
  } catch (err) {
    console.error("getPublicValuesForUser failed:", err);
    return {};
  }
}

function maskSecret(plaintext: string): string {
  return plaintext.length > 4
    ? '••••••••' + plaintext.slice(-4)
    : plaintext.length > 0 ? '••••' : '';
}

// Lists the user's stored credential variables, flat. Public vars (credentials
// doc) carry their plaintext value; private vars (secrets doc) are masked. The
// client groups them into per-backend credentials.
export async function listCredentials({ auth }: { auth: AuthArg }) {
  const [credDoc, secretDoc] = await Promise.all([
    credentialsDocRef(auth.uid).get(),
    secretsDocRef(auth.uid).get(),
  ]);
  const publics = (credDoc.data()?.credentials || {}) as Record<string, StoredVar>;
  const secrets = (secretDoc.data()?.secrets || {}) as Record<string, StoredVar>;
  const out = [
    ...Object.entries(publics).map(([name, entry]) => ({
      name,
      backend: entry?.backend || null,
      isPublic: true,
      value: entry?.value ?? "",
      masked: "",
      updatedAt: entry?.updatedAt || "",
    })),
    ...Object.entries(secrets).map(([name, entry]) => ({
      name,
      backend: entry?.backend || null,
      isPublic: false,
      value: null as string | null,
      masked: entry?.value != null ? maskSecret(decrypt(entry.value)) : "",
      updatedAt: entry?.updatedAt || "",
    })),
  ];
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Writes a single credential variable. Visibility is server-authoritative for
// known backends (resolved from the registry) so a client can't store a private
// field as public plaintext; for custom vars the caller's `isPublic` is used.
export async function setCredential(
  { auth, name, value, backend, isPublic }:
  { auth: AuthArg; name: string; value: string; backend?: string | null; isPublic?: boolean | null },
) {
  if (!SECRET_NAME_RE.test(name)) {
    throw new Error("Credential name must contain only lowercase letters, digits and hyphens.");
  }
  if (!value) {
    throw new Error("A value is required.");
  }

  const def = getCredentialBackend(backend);
  let pub: boolean;
  if (def) {
    const visibility = fieldVisibilityFor(def.key, name);
    if (!visibility) {
      throw new Error(`"${name}" is not a recognized field for ${def.label}.`);
    }
    pub = visibility === "public";
  } else {
    pub = !!isPublic;
  }

  const updatedAt = new Date().toISOString();
  const tag = backend != null ? { backend } : {};

  if (pub) {
    // Public field -> credentials doc, plaintext. No key required.
    await credentialsDocRef(auth.uid).set(
      { credentials: { [name]: { ...tag, value, updatedAt } } },
      { merge: true },
    );
  } else {
    // Private field -> secrets doc, ciphertext.
    if (!isSecretCryptoConfigured()) {
      // Refuse to store plaintext: encrypt() would otherwise fail loud, but check
      // up front for a friendly message. See scripts/set-compiler-secret.sh.
      throw new Error("Secrets are unavailable: GRAFFITICODE_SECRET_KEY is not configured on the server.");
    }
    await secretsDocRef(auth.uid).set(
      { secrets: { [name]: { ...tag, value: encrypt(value), updatedAt } } },
      { merge: true },
    );
  }

  return {
    name,
    backend: backend ?? null,
    isPublic: pub,
    value: pub ? value : null,
    masked: pub ? "" : maskSecret(value),
    updatedAt,
  };
}

export async function deleteCredential({ auth, name }: { auth: AuthArg; name: string }) {
  const del = admin.firestore.FieldValue.delete();
  await Promise.all([
    credentialsDocRef(auth.uid).set({ credentials: { [name]: del } }, { merge: true }),
    secretsDocRef(auth.uid).set({ secrets: { [name]: del } }, { merge: true }),
  ]);
  return true;
}

function buildParseCallbacks(
  { privateValues = {}, publicValues = {} }:
  { privateValues?: Record<string, string>; publicValues?: Record<string, string> } = {},
) {
  return {
    GET_VAL_PRIVATE: (name: string) => {
      return encrypt(privateValues[name] || "");
    },
    GET_VAL_PUBLIC: (name: string) => {
      const result = publicValues[name] || "";
      console.log("GET_VAL_PUBLIC()", "name:", name, "result:", result);
      return result;
    },
  };
}

// Global cache for templates to avoid repeated fetches
const templateCache = new Map<string, string>();

const taskDaoFactory = buildTaskDaoFactory();
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

export async function parseCode(
  { lang, src, privateValues = {}, publicValues = {}, accessToken }:
  { lang: string; src: string; privateValues?: Record<string, string>; publicValues?: Record<string, string>; accessToken?: string },
) {
  try {
    const lexicon = await getLanguageLexicon(lang, accessToken);
    if (!lexicon) {
      // lexicon.json couldn't be fetched — treat the language service as offline.
      return { code: null, errors: [{ message: languageOfflineMessage(lang), from: -1, to: -1 }] };
    }
    const nodePool = await parser.parse(lang, src, lexicon, buildParseCallbacks({ privateValues, publicValues }));

    // Scan the AST pool for ERROR nodes
    const errors: Array<{ message: string; from: number; to: number }> = [];
    for (const key of Object.keys(nodePool)) {
      if (key === "root") continue;
      const node = nodePool[key];
      if (node && node.tag === "ERROR") {
        // ERROR node elts: [STR_nid, NUM_nid(from), NUM_nid(to)]
        const msgNode = nodePool[node.elts[0]];
        const fromNode = nodePool[node.elts[1]];
        const toNode = nodePool[node.elts[2]];
        const message = typeof msgNode === "string" ? msgNode
          : (msgNode?.tag === "STR" ? msgNode.elts[0] : String(msgNode));
        const from = typeof fromNode === "number" ? fromNode
          : (fromNode?.tag === "NUM" ? Number(fromNode.elts[0]) : -1);
        const to = typeof toNode === "number" ? toNode
          : (toNode?.tag === "NUM" ? Number(toNode.elts[0]) : -1);
        errors.push({ message, from, to });
      }
    }

    if (errors.length > 0) {
      return { code: null, errors };
    }
    return { code: JSON.stringify(nodePool), errors: null };
  } catch (err) {
    if (isLanguageOfflineError(err)) {
      return { code: null, errors: [{ message: languageOfflineMessage(lang), from: -1, to: -1 }] };
    }
    return { code: null, errors: [{ message: err.message || "Parse error", from: -1, to: -1 }] };
  }
}

export async function logCompile({ auth, units, id, timestamp, status, data }) {
  try {
    const [{ lang }] = await getApiTask({ id, auth });
    const path = `users/${auth.uid}/compiles/${id}`;
    data = JSON.parse(data);
    await db.doc(path).set({ id, timestamp, status, lang, data });

    // Track usage units if provided
    if (units && units > 0) {
      const now = new Date();

      // Check if user is over limit
      let wasOverLimit = false;
      try {
        const userDoc = await db.collection('users').doc(auth.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const plan = userData?.subscription?.plan || 'demo';
          const overageUnits = userData?.subscription?.overageUnits || 0;

          // Get plan allocation
          const planAllocations = {
            demo: 250,
            starter: 5000,
            pro: 100000,
            teams: 2000000
          };
          let allocatedUnits = planAllocations[plan] || 100;

          // Check for preserved allocation (from downgrade)
          const preservedUntil = userData?.subscription?.preservedUntil;
          const preservedAllocation = userData?.subscription?.preservedAllocation;
          if (preservedUntil && preservedAllocation && new Date(preservedUntil) > now) {
            allocatedUnits = preservedAllocation;
          }

          // Get current usage
          const usageDoc = await db.collection('usage').doc(auth.uid).get();
          const currentUsage = usageDoc.exists ? (usageDoc.data().currentMonthTotal || 0) : 0;

          // Calculate if over limit (before adding these new units)
          const totalAvailable = allocatedUnits + overageUnits;
          wasOverLimit = currentUsage >= totalAvailable;
        }
      } catch (error) {
        console.error('Error checking usage limit:', error);
      }

      // Add individual usage record for audit trail
      await db.collection('usage').add({
        userId: auth.uid,
        taskId: id,
        units: units,
        createdAt: now,
        timestamp: timestamp,
        lang: lang,
        type: 'compile',
        status: status,
        wasOverLimit: wasOverLimit
      });

      // Read subscription once for periodStart (reset boundary) and the
      // post-increment usageLimitReached check.
      const userDoc = await db.collection('users').doc(auth.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const subscription = userData?.subscription || {};
      const plan = subscription.plan || 'demo';
      const overageUnits = subscription.overageUnits || 0;

      // Update monthly usage total
      const usageDocRef = db.collection('usage').doc(auth.uid);
      const usageDoc = await usageDocRef.get();

      const periodStart = subscription.currentPeriodStart
        ? new Date(subscription.currentPeriodStart)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      let newTotal = units;
      if (usageDoc.exists) {
        const currentData = usageDoc.data();
        const lastReset = currentData.lastReset ? new Date(currentData.lastReset) : null;
        const isNewBillingPeriod = !lastReset || lastReset < periodStart;

        if (isNewBillingPeriod) {
          await usageDocRef.set({
            currentMonthTotal: units,
            lastReset: periodStart.toISOString(),
            lastUpdated: now.toISOString()
          });
          newTotal = units;
        } else {
          // Atomic increment — concurrent compiles can't lose updates via
          // read-then-write.
          await usageDocRef.update({
            currentMonthTotal: admin.firestore.FieldValue.increment(units),
            lastUpdated: now.toISOString()
          });
          newTotal = (currentData.currentMonthTotal || 0) + units;
        }
      } else {
        await usageDocRef.set({
          currentMonthTotal: units,
          lastReset: periodStart.toISOString(),
          lastUpdated: now.toISOString()
        });
        newTotal = units;
      }


      const planAllocations = {
        demo: 250,
        starter: 5000,
        pro: 100000,
        teams: 2000000
      };
      let allocatedUnits = planAllocations[plan] || 100;

      // Check for preserved allocation (from downgrade)
      const preservedUntil = subscription.preservedUntil;
      const preservedAllocation = subscription.preservedAllocation;
      if (preservedUntil && preservedAllocation && new Date(preservedUntil) > now) {
        allocatedUnits = preservedAllocation;
      }

      const totalAvailable = allocatedUnits + overageUnits;
      let usageLimitReached = newTotal > totalAvailable;

      // Auto-overage: top up as soon as usage crosses the limit so subsequent
      // requests aren't blocked. Safe/deduped via the in-flight lock.
      if (usageLimitReached && subscription.autoOverageEnabled) {
        const { charged } = await chargeAutoOverage(auth.uid);
        if (charged) usageLimitReached = false;
      }

      return JSON.stringify({ success: true, usageLimitReached });
    }

    return JSON.stringify({ success: true });
  } catch (x) {
    console.log("logCompile()", "ERROR", x);
  }
}

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");

export async function postTask({ auth, task, ephemeral, isPublic }) {
  try {
    const storageType = (ephemeral && "ephemeral") || "persistent";
    const headers = {
      Authorization: auth.token,
      "x-graffiticode-storage-type": storageType,
    };
    if (isPublic) {
      delete headers.Authorization;
    }
    const { data } = await postApiJSON("/task", { task }, headers);
    return data;
  } catch (x) {
    console.error("postTask()", "ERROR", x);
    const message = x && typeof x === "object" && "message" in x
      ? String((x as { message: unknown }).message)
      : "task post failed";
    throw new Error(`postTask: ${message}`);
  }
}

export async function getData({ authToken, id }) {
  try {
    const baseUrl = getBaseUrlForApi();
    const get = bent(baseUrl, "GET", "json", 200);
    const resp = await get(`/data?id=${id}&access_token=${authToken}`);
    console.log(
      "getData()",
      "resp.data=" + JSON.stringify(resp.data, null, 2),
    );
    return resp.data;
  } catch (x) {
    console.log("getData()", "ERROR", x);
  }
}

export async function getTasks({ auth, lang, mark }) {
  try {
    // Get items from the items collection (primary source)
    const items = await getItems({ auth, lang, mark, client: 'console' });

    // Get taskIds from the taskIds collection (for backward compatibility)
    const taskIdsDocs = await db
      .collection(`users/${auth.uid}/taskIds`)
      .where("lang", "==", lang)
      .where("mark", "==", mark)
      .get();

    // Create a set of IDs from items to avoid duplicates
    const itemIds = new Set(items.map((item) => item.taskId || item.id));

    // Process taskIds that aren't already in items and create items for them
    for (const doc of taskIdsDocs.docs) {
      const taskId = doc.id;
      const taskData = doc.data();

      if (!itemIds.has(taskId)) {
        // Create an item for this task
        try {
          const itemRef = db.collection(`users/${auth.uid}/items`).doc();
          const item = {
            id: itemRef.id,
            taskId: taskId,
            name: taskData.name || "unnamed",
            lang: taskData.lang,
            mark: taskData.mark || 1,
            help: taskData.help || "[]",
            isPublic: taskData.isPublic || false,
            created: taskData.created || Date.now(),
            updated: taskData.updated || taskData.created || Date.now(),
          };

          await itemRef.set(item);

          // Add the newly created item to our items list
          items.push({
            ...item,
            created: String(item.created),
            updated: String(item.updated),
          });

        } catch (error) {
          console.error(`Failed to create item for task ${taskId}:`, error);
        }
      }
    }

    // Mark all tasks in taskIds collection with mark 5 after loading them as items
    const allTaskIds = await db
      .collection(`users/${auth.uid}/taskIds`)
      .where("lang", "==", lang)
      .where("mark", "==", mark)
      .get();

    const updatePromises = allTaskIds.docs.map((doc) =>
      db.doc(`users/${auth.uid}/taskIds/${doc.id}`).update({ mark: 5 }),
    );

    await Promise.all(updatePromises);

    // Convert items to tasks format
    const tasks = await Promise.all(
      items.map(async (item) => {
        return {
          id: item.taskId || item.id,
          lang: item.lang,
          help: item.help || "[]",
          isPublic: item.isPublic || false,
          taskId: item.taskId || item.id,
          created: item.created,
          name: item.name,
          mark: item.mark || 1,
        };
      }),
    );

    return tasks;
  } catch (x) {
    console.log("getTasks()", "ERROR", x);
  }
}

export async function compiles({ auth, lang, type }) {
  try {
    const compilesDocs = await db
      .collection(`users/${auth.uid}/compiles`)
      .where("lang", "==", lang)
      .get();
    const data = [];
    compilesDocs.forEach((doc) => {
      data.push(doc.data());
    });
    return data;
  } catch (x) {
    console.log("compiles()", "ERROR", x);
  }
}

export async function generateCode({
  auth,
  prompt,
  language,
  options,
  currentSrc,
  conversationSummary = null,
  itemId = undefined,
}) {
  const rid = generateRequestId();

  try {
    if (!language) {
      return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: [{ message: "language is required" }] };
    }

    prompt = prompt.trim();
    let description = null;
    let changeSummary = null;
    let model = null;
    let usage = { input_tokens: 0, output_tokens: 0 };

    ragLog(rid, "request.start", {
      promptLength: prompt.length,
      language,
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
    const codegenOptions = {
      model: options?.model,
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
      // GUARDRAIL 1 — authoritative pre-flight head routing. The server validates the request
      // against the chosen language's scope and re-routes to the correct language if the client
      // picked wrong (clients freelance). Fresh creates only — never relabel an edit. Independent
      // of client cooperation and of the generation LLM volunteering OUT_OF_SCOPE.
      if (process.env.SCOPE_GATE_ENABLED !== "false" && !currentSrc) {
        const route = await classifyAndRoute({ userRequest: prompt, currentLang: language });
        // Log EVERY decision (in-scope included) so routing is observable — an in-scope verdict
        // is otherwise silent, which masks scope.json contracts that are too permissive.
        console.log(`[routing] rid=${rid} scope-gate lang=L${language} inScope=${route.inScope} routedLang=${route.routedLang ? "L" + route.routedLang : "none"}${route.reason ? ` reason=${route.reason}` : ""}`);
        ragLog(rid, "preflight.classify", { lang: language, inScope: route.inScope, routedLang: route.routedLang, reason: route.reason });
        if (route.inScope === false) {
          if (route.routedLang && route.routedLang !== language) {
            console.log(`[routing] rid=${rid} preflight.reroute from=L${language} to=L${route.routedLang} reason=${route.reason}`);
            ragLog(rid, "preflight.reroute", { from: language, to: route.routedLang, reason: route.reason });
            language = route.routedLang;
            headLang = route.routedLang;
          } else if (!route.routedLang) {
            const reason = route.reason || `Request is out of scope for L${language}.`;
            console.log(`[routing] rid=${rid} preflight.reject lang=L${language} reason=${reason}`);
            ragLog(rid, "preflight.reject", { lang: language, reason });
            return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: [{ message: `This request doesn't fit any available Graffiticode language. ${reason}` }], upstreamLangs: [] };
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
        const planResult = await planSequence({ prompt, headLang: language, auth, options: codegenOptions, rid, preferHaiku: true });
        const fenced = fenceComposition(planResult.sequence, permits);
        if (fenced.dropped.length > 0) {
          console.warn(`[composition] rid=${rid} fenced unpermitted upstreams=[${fenced.dropped.join(",")}] permits=[${permits.join(",")}]`);
        }
        sequence = fenced.sequence;
        fromRagHit = planResult.fromRag;
      }
      console.log(`[composition] rid=${rid} head=L${language} permits=[${permits.join(",")}] sequence=${sequence.map(l => `L${l}`).join(" -> ")}`);
      ragLog(rid, "composition.gate", { head: language, permits, sequence });

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
          conversationSummary,
          headExamples: headLang === language ? headExamples : null,
        });

        if (orch.errors) {
          return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: mapUsageLimit(orch.errors), upstreamLangs: [] };
        }

        src = orch.headSrc;
        model = orch.headModel;
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
        });

        if ('errors' in result && result.errors) {
          return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: mapUsageLimit(result.errors), upstreamLangs: [] };
        }

        const successResult = result as { code: any; taskId: string; model: string; usage: any; description: string | null; changeSummary: string | null };
        src = successResult.code;
        model = successResult.model;
        usage = successResult.usage;
        description = successResult.description;
        changeSummary = successResult.changeSummary;
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
      return { src, taskId: null, language, description, changeSummary, model, usage, errors: parseResult.errors, upstreamLangs: [] };
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

          const upstreamResults = await Promise.all(
            upstreamLangs.map((uLang) =>
              codeGenerationService({
                auth,
                prompt,
                lang: uLang,
                options: {
                  model: options?.model,
                  temperature: options?.temperature,
                  maxTokens: options?.maxTokens,
                },
                rid,
              })
            )
          );
          const upstreamErrors = upstreamResults.flatMap((r: any, i: number) => {
            if (r && 'errors' in r && r.errors) return r.errors;
            if (!r?.taskId) return [{ message: `Upstream L${upstreamLangs[i]} failed to produce a taskId` }];
            return [];
          });
          if (upstreamErrors.length > 0) {
            return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: upstreamErrors, upstreamLangs: [] };
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
            upstreamContext: { lang: expected },
            prompt: `${prompt}\n\nIMPORTANT: This program is the HEAD of a composition pipeline and MUST bind its upstream by emitting a top-level \`data use "${expected}"\` so the upstream data flows at runtime. Do not omit it.`,
          });
          if (repair?.errors) {
            return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: mapUsageLimit(repair.errors), upstreamLangs: [] };
          }
          const reparsed = await parseCode({ lang: headLang, src: repair.code, privateValues, publicValues, accessToken: auth?.token });
          if (reparsed.errors) {
            return { src: repair.code, taskId: null, language, description, changeSummary, model, usage, errors: reparsed.errors, upstreamLangs: [] };
          }
          code = JSON.parse(reparsed.code);
          resolved = await resolveUpstreams(code);
          if (resolved.upstreams.includes(expected)) {
            src = repair.code;
            model = repair.model;
            usage = repair.usage;
            description = repair.description ?? description;
            changeSummary = repair.changeSummary ?? changeSummary;
            console.log(`[composition] rid=${rid} repair.ok head=L${headLang} bound=L${expected}`);
            ragLog(rid, "composition.repair.ok", { headLang, expected });
          } else {
            console.warn(`[composition] rid=${rid} repair.failed head=L${headLang} expected=L${expected}`);
            ragLog(rid, "composition.repair.failed", { headLang, expected });
            return {
              src: repair.code, taskId: null, language, description, changeSummary, model, usage,
              errors: [{ message: `Composition failed: head L${headLang} could not bind upstream L${expected}. Try rephrasing the request.` }],
              upstreamLangs: [],
            };
          }
        }
      }
    } catch (err: any) {
      return {
        src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null,
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
      usage,
      upstreamLangs,
      success: true,
    });

    return { src: resolvedSrc, taskId, language: headLang, description, changeSummary, model, usage, errors: null, upstreamLangs };
  } catch (error) {
    console.error("generateCode()", "ERROR", error);
    ragLog(rid, "request.error", { error: error.message });
    return { src: null, taskId: null, language, description: null, changeSummary: null, model: null, usage: null, errors: [{ message: error.message }], upstreamLangs: [] };
  }
}

export async function createItem({
  auth,
  lang,
  name,
  taskId,
  mark,
  help,
  isPublic,
  client,
  upstreamLangs,
  deferGeneration,
}: {
  auth: AuthArg;
  lang: string;
  name?: string;
  taskId?: string;
  mark?: number;
  help?: string;
  isPublic?: boolean;
  client?: string;
  upstreamLangs?: string[];
  // When true, create a fast "shell" item with no task and
  // generationStatus="generating" — the caller (startCodeGeneration) runs the
  // real generation asynchronously and fills in the taskId later. Skips the
  // synchronous template generateCode below.
  deferGeneration?: boolean;
}) {
  try {
    // Generate a unique ID for the item
    const itemRef = db.collection(`users/${auth.uid}/items`).doc();
    const id = itemRef.id;
    // If no name provided, use "unnamed"
    if (!name) {
      name = "unnamed";
    }
    // If no taskId provided, create a minimal template task
    let generatedHelp = help || "[]";
    if (!taskId && !deferGeneration) {
      const result = await generateCode({
        auth,
        prompt: "Create a minimal starting template",
        language: lang,
        options: {},
        currentSrc: null,
        itemId: id,
      });
      taskId = result.taskId;
      if (!taskId) {
        throw new Error("Failed to generate template task");
      }
    }
    // Persist the parsed AST on the item doc so that getItem/getItems can
    // lazily re-post the task under the current uid if the taskId is ever null
    // (shareItem and the trial-claim flow both rely on this).
    let code: any = null;
    if (taskId) {
      try {
        const apiTask = await getApiTask({ id: taskId, auth });
        const taskData = apiTask?.[0] || apiTask;
        code = taskData?.code ?? null;
      } catch (err) {
        console.error("createItem(): failed to fetch code for item", id, err);
      }
    }

    const timestamp = Date.now();
    const item: Record<string, any> = {
      id,
      name,
      lang,
      mark: mark || 1, // Default to mark 1 if not provided
      help: generatedHelp,
      isPublic: isPublic || false,
      client: client || 'console', // Default to 'console' if not provided
      upstreamLangs: Array.isArray(upstreamLangs) ? upstreamLangs : [],
      created: timestamp,
      updated: timestamp,
    };
    if (taskId) {
      item.taskId = taskId;
    }
    if (deferGeneration) {
      item.generationStatus = "generating";
      item.generationStartedAt = timestamp;
    }
    if (code !== null) {
      item.code = code;
    }
    if (auth.freePlan) {
      Object.assign(item, freePlanItemFields(auth, timestamp));
    }
    await itemRef.set(item);
    return {
      ...item,
      created: String(timestamp),
      updated: String(timestamp),
    };
  } catch (error) {
    console.error("createItem()", "ERROR", error);
    throw new Error(`Failed to create item: ${error.message}`);
  }
}

export async function updateItem({
  auth,
  id,
  name,
  taskId,
  mark,
  help,
  isPublic,
  client,
  upstreamLangs,
  lang,
}: {
  auth: AuthArg;
  id: string;
  name?: string;
  taskId?: string;
  mark?: number;
  help?: string;
  isPublic?: boolean;
  client?: string;
  upstreamLangs?: string[];
  // Server/worker-internal: the corrected head language when the pre-flight scope gate
  // re-routed away from the client's pick. NOT a client-facing relabel.
  lang?: string;
}) {
  try {
    const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new Error("Item not found");
    }
    const itemData = itemDoc.data();
    // By-id update: the item id is the capability, so a stateless client can refine an
    // item it created under a now-expired MCP session. Listing stays session-gated.
    if (!isItemVisibleToFreePlan(itemData, auth, { byId: true })) {
      throw new Error("Item not found");
    }
    if (auth.freePlan && isPublic) {
      throw new Error("Free plan items cannot be made public.");
    }
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (taskId !== undefined) {
      updates.taskId = taskId;
      // Refresh the persisted AST so the lazy-repost in getItem/getItems can
      // recreate the task under a new owner (claim, share). createItem already
      // does this; updateItem must too whenever taskId changes.
      if (taskId !== itemData.taskId) {
        try {
          const apiTask = await getApiTask({ id: taskId, auth });
          const taskData = apiTask?.[0] || apiTask;
          const code = taskData?.code;
          if (code !== undefined && code !== null) {
            updates.code = code;
          }
        } catch (err) {
          console.error("updateItem(): failed to refresh code for item", id, err);
        }
      }
    }
    if (mark !== undefined) updates.mark = mark;
    if (client !== undefined) updates.client = client;
    if (lang !== undefined) updates.lang = lang;
    if (help !== undefined) updates.help = help;
    if (upstreamLangs !== undefined && Array.isArray(upstreamLangs)) {
      updates.upstreamLangs = upstreamLangs;
    }
    if (isPublic !== undefined) {
      if (isPublic) {
        // Make every task segment public BEFORE marking the item public, so a
        // failure leaves the item private (no local/API drift). A composition's
        // taskId is `head+up1+up2…`; getApiTask returns one entry per segment.
        // Re-posting each segment's {lang, code} with isPublic flips acls.public
        // on the existing task (postTask deletes Authorization but keeps the
        // persistent storage-type header). Each segment has its own lang.
        const itemTaskId = taskId || itemData.taskId;
        if (itemTaskId) {
          const apiTask = await getApiTask({ id: itemTaskId, auth });
          const segments = Array.isArray(apiTask) ? apiTask : [apiTask];
          await Promise.all(segments.map(({ lang, code }) =>
            postTask({ auth, task: { lang, code }, ephemeral: false, isPublic: true })
          ));
        }
      }
      updates.isPublic = isPublic;
    }
    // Only bump the `updated` timestamp when the taskId actually changes —
    // that's the canonical "content changed" signal. Metadata edits (mark,
    // name, isPublic, etc.) and selection-driven no-op writes shouldn't
    // make an item look freshly modified.
    const taskIdChanged = taskId !== undefined && taskId !== itemData.taskId;
    if (taskIdChanged) {
      updates.updated = Date.now();
    }
    if (auth.freePlan) {
      const ttlBase = updates.updated || itemData.updated || Date.now();
      updates.expiresAt = ttlBase + FREE_PLAN_ITEM_TTL_MS;
    }
    await itemRef.update(updates);
    const updatedDoc = await itemRef.get();
    const data = updatedDoc.data();
    return {
      id,
      ...data,
      created: String(data.created),
      updated: String(data.updated),
    };
  } catch (error) {
    console.error("updateItem()", "ERROR", error);
    throw new Error(`Failed to update item: ${error.message}`);
  }
}

// Set the async-generation status on an item. Used by startCodeGeneration
// (status="generating") and the /api/generate-job worker (status="ready" on
// success, "failed"+error otherwise). Clears generationStartedAt on a terminal
// status so the staleness guard only fires while genuinely in-flight.
export async function setItemGenerationStatus({
  auth,
  id,
  status,
  error = null,
}: {
  auth: AuthArg;
  id: string;
  status: "generating" | "ready" | "failed";
  error?: string | null;
}) {
  const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
  const updates: Record<string, any> = {
    generationStatus: status,
    generationError: status === "failed" ? error : null,
  };
  if (status === "generating") {
    updates.generationStartedAt = Date.now();
  } else {
    updates.generationStartedAt = null;
  }
  await itemRef.update(updates);
}

export async function getItems({ auth, lang, mark, client }) {
  try {
    // Build the base query (lang + optional mark + free-plan). Client filtering
    // happens in memory below so items without a client/app field are treated
    // as 'console' (the default).
    let baseQuery = db
      .collection(`users/${auth.uid}/items`)
      .where("lang", "==", lang);
    if (mark !== undefined && mark !== null) {
      baseQuery = baseQuery.where("mark", "==", mark);
    }
    if (auth.freePlan) {
      baseQuery = baseQuery.where("sessionNamespace", "==", auth.sessionNamespace);
    }
    // Filtering rules:
    //   client undefined/'all' → no client filter, fetch all.
    //   client === 'console'   → fetch all and memory-filter, since missing
    //                            client field implicitly means console.
    //   client === <other>     → pure server-side `where("client", "==", X)`.
    let docs;
    if (!client || client === 'all') {
      const snap = await baseQuery.get();
      docs = snap.docs;
    } else if (client === 'console') {
      const snap = await baseQuery.get();
      docs = snap.docs.filter(d => (d.data().client ?? 'console') === 'console');
    } else {
      const snap = await baseQuery.where("client", "==", client).get();
      docs = snap.docs;
    }
    // Get the user's sharedItems data to add to items (skip on free plan — shared
    // items are not supported there).
    const sharedItemsData = auth.freePlan
      ? {}
      : (await db.doc(`users/${auth.uid}`).get()).data()?.sharedItems || {};

    const now = Date.now();

    // Process items in parallel and fetch legacy data if needed. Each doc may make
    // its own postTask HTTP call and/or legacy-help read; running them concurrently
    // avoids an N-item network waterfall. Order is restored by the sort below.
    const settled = await Promise.all(docs.map(async (doc) => {
      const data = doc.data();
      // Listing path — stays session-gated (no byId): a session must not enumerate
      // another session's items. `now` moves to the 4th arg after the new `opts`.
      if (!isItemVisibleToFreePlan(data, auth, {}, now)) return null;
      let help = data.help;
      let taskId = data.taskId;

      // If item doesn't have a taskId (e.g., shared item), post the task to create one
      if (!taskId && data.code) {
        try {
          const taskData = await postTask({
            auth,
            task: {
              lang: data.lang,
              code: data.code,
            },
            ephemeral: false,
            isPublic: false,
          });

          if (taskData && taskData.id) {
            taskId = taskData.id;
            // Update the item with the new taskId
            await doc.ref.update({ taskId });
          }
        } catch (error) {
          console.error(
            "getItems()",
            "Failed to create task for item",
            doc.id,
            error,
          );
        }
      }

      // For backward compatibility: fetch help from legacy taskIds collection
      if (!help && taskId) {
        try {
          const taskDoc = await db
            .doc(`users/${auth.uid}/taskIds/${taskId}`)
            .get();
          if (taskDoc.exists) {
            const taskData = taskDoc.data();
            help = taskData.help || "[]";
          }
        } catch (error) {
          console.log(
            "getItems()",
            "Failed to fetch legacy task data for item",
            doc.id,
            error,
          );
        }
      }

      // Get the sharedWith list for this item
      const sharedWith = sharedItemsData[doc.id]?.sharedWith || [];

      // Skip items without a valid taskId
      if (!taskId) {
        console.log("getItems()", "Skipping item with null taskId", doc.id);
        return null;
      }

      const item = {
        id: doc.id,
        name: data.name,
        taskId,
        lang: data.lang,
        mark: data.mark || 1, // Default to mark 1 if not set
        help: help || "[]",
        isPublic: data.isPublic || false,
        created: String(data.created),
        updated: data.updated ? String(data.updated) : String(data.created),
        sharedWith: sharedWith,
        sharedFrom: data.sharedFrom || null, // Include sharedFrom field if present
        client: data.client ?? 'console',
        upstreamLangs: Array.isArray(data.upstreamLangs) ? data.upstreamLangs : [],
        generationStatus: data.generationStatus ?? null,
        generationError: data.generationError ?? null,
        generationStartedAt: data.generationStartedAt ? String(data.generationStartedAt) : null,
      };

      const timestamp = data.updated || data.created || 0;
      return { ...item, _sortKey: timestamp };
    }));

    const items = settled.filter(Boolean);
    items.sort((a, b) => b._sortKey - a._sortKey);
    return items.map(({ _sortKey, ...item }) => item);
  } catch (error) {
    console.error("getItems()", "ERROR", error);
    throw new Error(`Failed to get items: ${error.message}`);
  }
}

export async function getItemClientTags({ auth, lang }) {
  try {
    let query = db
      .collection(`users/${auth.uid}/items`)
      .where("lang", "==", lang);
    if (auth.freePlan) {
      query = query.where("sessionNamespace", "==", auth.sessionNamespace);
    }
    const snapshot = await query.select("client", "expiresAt").get();
    const now = Date.now();
    const tags = new Set<string>();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (auth.freePlan && typeof data.expiresAt === "number" && data.expiresAt <= now) continue;
      // Items with no client field are considered 'console'.
      tags.add(data.client ?? 'console');
    }
    return Array.from(tags).sort();
  } catch (error) {
    console.error("getItemClientTags()", "ERROR", error);
    return [];
  }
}

export async function getTask({ auth, id }) {
  try {
    const apiTask = await getApiTask({ id, auth });
    const taskList = Array.isArray(apiTask) ? apiTask : [apiTask];
    const taskData = taskList[0] || apiTask;
    const code = taskData.code;
    const codeStr = JSON.stringify(code, null, 2);
    let src = "";
    try {
      const lexicon = await getLanguageLexicon(taskData.lang, auth?.token);
      src = unparse(code, lexicon || {});
    } catch (err) {
      console.error("getTask: failed to unparse", err);
    }
    const langs = taskList
      .map(t => t && t.lang)
      .filter(l => typeof l === "string" && l.length > 0);
    return { id, lang: taskData.lang, code: codeStr, src, langs };
  } catch (error) {
    console.error("getTask()", "ERROR", error);
    throw new Error(`Failed to get task: ${error.message}`);
  }
}

// Produce a platform-neutral English spec of an item's content, for handing across languages.
// Resolves the item -> head taskId, then delegates to the spec generator. The item id is an
// opaque handle here; the returned spec (English) is the only cross-language exchange unit.
export async function getSpec({ auth, id }) {
  const item = await getItem({ auth, id });
  if (!item) {
    throw new Error(`Item not found: ${id}`);
  }
  if (!item.taskId) {
    throw new Error(`Item ${id} has no compiled task yet`);
  }
  const { spec, lang, coverage } = await generateSpec({ auth, taskId: item.taskId });
  return { spec, lang, itemId: id, coverage };
}

export async function getItem({ auth, id }) {
  try {
    const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return null;
    }

    const data = itemDoc.data();
    // By-id read: the item id is the capability (mirrors the public form page), so a
    // stateless MCP client can retrieve an item it created under a prior session.
    if (!isItemVisibleToFreePlan(data, auth, { byId: true })) {
      return null;
    }
    let help = data.help;
    let taskId = data.taskId;

    // If the item has no taskId (e.g., copied via shareItem or claim flow),
    // post the task under the current uid to bind it. Mirrors the guard in
    // getItems().
    if (!taskId && data.code) {
      try {
        const taskData = await postTask({
          auth,
          task: { lang: data.lang, code: data.code },
          ephemeral: false,
          isPublic: false,
        });
        if (taskData?.id) {
          taskId = taskData.id;
          await itemRef.update({ taskId });
        }
      } catch (error) {
        console.error("getItem(): failed to create task for item", id, error);
      }
    }

    // For backward compatibility: fetch help from legacy taskIds collection
    if (!help && taskId) {
      try {
        const taskDoc = await db.doc(`users/${auth.uid}/taskIds/${taskId}`).get();
        if (taskDoc.exists) {
          const taskData = taskDoc.data();
          help = taskData.help || "[]";
        }
      } catch (error) {
        console.log("getItem()", "Failed to fetch legacy task data", error);
      }
    }

    return {
      id: id,
      name: data.name,
      taskId: taskId,
      lang: data.lang,
      mark: data.mark || 1,
      help: help || "[]",
      isPublic: data.isPublic || false,
      created: String(data.created),
      updated: data.updated ? String(data.updated) : String(data.created),
      client: data.client ?? 'console',
      upstreamLangs: Array.isArray(data.upstreamLangs) ? data.upstreamLangs : [],
      // Absent status ⇒ legacy/synchronous item, treated as ready by clients.
      generationStatus: data.generationStatus ?? null,
      generationError: data.generationError ?? null,
      generationStartedAt: data.generationStartedAt ? String(data.generationStartedAt) : null,
    };
  } catch (error) {
    console.error("getItem()", "ERROR", error);
    throw new Error(`Failed to get item: ${error.message}`);
  }
}

export async function shareItem({ auth, itemId, targetUserId }) {
  try {
    // Validate that the source item exists and belongs to the current user
    const itemRef = db.doc(`users/${auth.uid}/items/${itemId}`);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return {
        success: false,
        message: "Item not found",
        newItemId: null,
      };
    }

    // Validate that the target user exists
    const targetUserRef = db.doc(`users/${targetUserId}`);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      return {
        success: false,
        message: "Target user not found",
        newItemId: null,
      };
    }

    const itemData = itemDoc.data();

    // Create a new item in the target user's collection with "(from <uid>)" suffix
    const targetItemRef = db.collection(`users/${targetUserId}/items`).doc();
    const newItemId = targetItemRef.id;
    const timestamp = Date.now();

    // Add a note to the help transcript about where the item was shared from
    let updatedHelp = itemData.help || "[]";
    try {
      const helpArray = JSON.parse(updatedHelp);
      // Add a note at the end of the help transcript (since display is reversed)
      helpArray.push({
        role: "system",
        content: `Shared by ${auth.uid}`,
        timestamp: timestamp,
        taskId: itemData.taskId // Include the original task ID for clickability
      });
      updatedHelp = JSON.stringify(helpArray);
    } catch (error) {
      // If help is not valid JSON, create a new array with the note
      updatedHelp = JSON.stringify([{
        role: "system",
        content: `Shared by ${auth.uid}`,
        timestamp: timestamp,
        taskId: itemData.taskId // Include the original task ID for clickability
      }]);
    }

    const sharedItem = {
      ...itemData,
      id: newItemId,
      taskId: null, // Clear the task ID - it will be created when the user loads the item
      name: itemData.name,
      help: updatedHelp,
      sharedFrom: auth.uid, // Track who shared this item
      created: timestamp,
      updated: timestamp,
      // Don't copy the isPublic flag - let the recipient decide
      isPublic: false,
    };

    await targetItemRef.set(sharedItem);

    // Update the sender's user document to track shared items
    const senderUserRef = db.doc(`users/${auth.uid}`);
    const senderUserDoc = await senderUserRef.get();

    const sharedItems = senderUserDoc.data()?.sharedItems || {};

    // Initialize the item's share record if it doesn't exist
    if (!sharedItems[itemId]) {
      sharedItems[itemId] = {
        sharedWith: [],
        sharedAt: {},
      };
    }

    // Add the target user if not already shared with
    if (!sharedItems[itemId].sharedWith.includes(targetUserId)) {
      sharedItems[itemId].sharedWith.push(targetUserId);
    }

    // Record when it was shared
    sharedItems[itemId].sharedAt[targetUserId] = timestamp;

    // Update the sender's user document
    await senderUserRef.update({
      sharedItems: sharedItems,
    });

    return {
      success: true,
      message: `Item shared successfully with ${targetUserId}`,
      newItemId: newItemId,
    };
  } catch (error) {
    console.error("shareItem()", "ERROR", error);
    return {
      success: false,
      message: `Failed to share item: ${error.message}`,
      newItemId: null,
    };
  }
}

// Structured claim funnel event → Cloud Logging. Claims run in the console (not
// the MCP server), so failures never reach the mcp_tool stream and Firestore only
// records successes — this is the only signal the funnel report has for the
// anonymous→account (north-star #1) step. Best-effort; never breaks a claim.
export function logClaimEvent(fields: { outcome: "ok" | "error"; transferred?: number; session: string; err?: string }) {
  try {
    console.log(JSON.stringify({
      ev: "claim",
      t: new Date().toISOString(),
      outcome: fields.outcome,
      session: fields.session,
      transferred: fields.transferred,
      err: fields.err ? fields.err.slice(0, 300) : undefined,
    }));
  } catch {
    // ignore
  }
}

export async function claimFreePlanSession({
  auth,
  trialAuth,
  sessionNamespace,
  sessionUuid,
}: {
  auth: AuthArg;
  trialAuth: AuthArg;
  sessionNamespace: string;
  sessionUuid: string;
}) {
  const db = getFirestore();
  const now = Date.now();

  try {
  const snapshot = await db
    .collection(`users/${trialAuth.uid}/items`)
    .where("freePlan", "==", true)
    .where("sessionNamespace", "==", sessionNamespace)
    .get();

  let transferred = 0;
  const items: { id: string; lang: string; created: number }[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.expiresAt === "number" && data.expiresAt <= now) continue;

    // The lazy repost in getItem/getItems needs an accurate AST. The taskId on
    // the doc is authoritative (api.graffiticode.org owns the canonical task),
    // so prefer fetching code fresh through trial auth over trusting the
    // Firestore-stored copy, which can drift if updateItem misses a write.
    let code: any = data.code ?? null;
    if (data.taskId) {
      try {
        const apiTask = await getApiTask({ id: data.taskId, auth: trialAuth });
        const taskData = apiTask?.[0] || apiTask;
        if (taskData?.code !== undefined && taskData?.code !== null) {
          code = taskData.code;
        }
      } catch (err) {
        console.error("claimFreePlanSession(): failed to fetch task code", doc.id, err);
      }
    }

    const targetRef = db.collection(`users/${auth.uid}/items`).doc();
    const newId = targetRef.id;
    const timestamp = Date.now();

    const claimedItem: Record<string, any> = {
      ...data,
      id: newId,
      taskId: null, // triggers lazy repost in getItem/getItems under the new uid
      claimedFrom: sessionUuid,
      // Surface claimed items in the default /items view (which filters to
      // client=='console'). Provenance is preserved in `claimedFrom`.
      client: "console",
      created: timestamp,
      updated: timestamp,
    };
    delete claimedItem.freePlan;
    delete claimedItem.sessionNamespace;
    delete claimedItem.expiresAt;
    delete claimedItem.app; // legacy field; new items use `client` only
    if (code !== null) {
      claimedItem.code = code;
    } else {
      delete claimedItem.code;
    }

    await targetRef.set(claimedItem);
    transferred += 1;
    items.push({ id: newId, lang: String(data.lang || ""), created: timestamp });
  }

  items.sort((a, b) => b.created - a.created);
  logClaimEvent({ outcome: "ok", transferred, session: sessionNamespace });
  return {
    transferred,
    sessionNamespace,
    items: items.map(({ id, lang }) => ({ id, lang })),
  };
  } catch (err: any) {
    logClaimEvent({ outcome: "error", session: sessionNamespace, err: String(err?.message ?? err) });
    throw err;
  }
}
