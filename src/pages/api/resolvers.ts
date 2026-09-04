import admin from "firebase-admin";
import { randomUUID } from "crypto";
import bent from "bent";
import { buildTaskDaoFactory } from "../../utils/storage/index";
import { buildGetTaskDaoForStorageType } from "./utils";
import { getFirestore } from "../../utils/db";
import { getApiTask, getBaseUrlForApi, getLanguageAsset, getLanguageLexicon, isLangOverridden, languageOfflineMessage, isLanguageOfflineError } from "../../lib/api";
import { unparse } from "@graffiticode/parser";
import { generateCodeForRequest } from "../../lib/code-generation/generate-for-request";
import { parseCode, postTask, getData } from "../../lib/task-api";
import {
  StoredVar,
  secretsDocRef,
  credentialsDocRef,
  getSecretsForUser,
  getPublicValuesForUser,
} from "../../lib/user-credentials";
import { generateCode as codeGenerationService, getRelevantExamples } from "../../lib/code-generation-service";
import { generateSpec, specModelFor, SPEC_CACHE_VERSION } from "../../lib/spec-generation-service";
import { planSequence, classifyAndRoute, composesWithFor, fenceComposition, orchestrateComposition, capturePlanForCuration } from "../../lib/language-router";
import { backfillTokenUsageItemId, currentEnv } from "../../lib/token-usage-service";
import { resolveUpstreams } from "../../lib/composition-discovery";
import { ragLog, generateRequestId } from "../../lib/logger";
import { FREE_PLAN_ITEM_TTL_MS } from "../../lib/free-plan-context";
import {
  adoptWorkspace,
  adoptSiblingWorkspace,
  isFreePlanItemExpired,
} from "../../lib/workspace-adoption";
import { reportItemUsage } from "../../lib/item-metering";
import { checkItemCreateAllowed } from "../../lib/usage-service";
import { emitEvent, actor, langKey } from "../../lib/funnel-events";
import {
  assertWithinDailyPace,
  buildItemExpiredError,
  buildMonthlyQuotaError,
  buildRevisionLimitError,
  buildScopeError,
  maybeAlertBudget,
  recordTrialItem,
} from "../../lib/free-plan-quota";
import { freePlanLanguageIds, isLanguageInFreePlanScope, isLanguageSponsored } from "../../lib/languages";
import { trialItemRevisionLimit } from "../../lib/plans-config";
import { mintSessionToken, isSessionTokenConfigured } from "../../lib/free-plan-session-token";
import { mintClaimToken } from "../../lib/claim-token";
import fs from "fs";
import path from "path";
import { encrypt, decrypt, isConfigured as isSecretCryptoConfigured } from "../../lib/secret-crypto";
import { getCredentialBackend, fieldVisibilityFor } from "../../lib/credential-backends";

type AuthArg = {
  uid: string;
  token: string;
  freePlan?: boolean;
  // The effective workspace. Starts as the caller's session namespace and may be
  // rebound by adoptWorkspace when the request names an item that already
  // belongs somewhere else.
  sessionNamespace?: string;
  sessionUuid?: string;
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
  if (isFreePlanItemExpired(data, now)) return false;
  return true;
}

/**
 * Whether a by-id lookup failed specifically because the item aged out.
 *
 * Worth distinguishing: "not found" tells an agent nothing it can act on, and it
 * will usually retry the same id. "Expired" tells it the content is gone for a
 * knowable reason, with a recovery (recreate, or sign in to keep items) — which
 * is also the moment the 48h TTL is most persuasive as a signup argument.
 */
function isExpiredForFreePlan(data: any, auth: AuthArg, now = Date.now()): boolean {
  if (!auth.freePlan) return false;
  return isFreePlanItemExpired(data, now);
}

/**
 * Gate item creation against the caller's item budget, throwing when it's spent.
 *
 * One path for everyone. The anonymous trial resolves to a real account with a
 * real subscription (auth.uid is already that account), so its plan allowance IS
 * the trial's monthly budget — no parallel counter, no hardcoded number. Trial
 * callers additionally pace that budget across the billing period so a single
 * day can't burn the month, and they fail CLOSED: there's no tenant to bill and
 * no user to notify if the check itself breaks.
 */
async function assertItemCreateAllowed(auth: AuthArg, lang?: string): Promise<void> {
  if (auth.freePlan && !isLanguageInFreePlanScope(lang)) {
    throw buildScopeError(lang, freePlanLanguageIds());
  }
  const gate = await checkItemCreateAllowed(auth.uid, {
    failClosed: auth.freePlan,
    // The trial account runs at its full allowance every month by design, so
    // the self-heal's per-period record scan grows without bound and would run
    // on every create. Trust the counter here; reconcile out-of-band.
    skipSelfHeal: auth.freePlan,
    // Same reasoning: the trial account has no Stripe customer, so the
    // subscription repair is a guaranteed no-op on this path.
    skipSubscriptionRepair: auth.freePlan,
  });
  if (!gate.allowed) {
    if (auth.freePlan) {
      // buildMonthlyQuotaError emits its own wall_hit.
      throw buildMonthlyQuotaError(gate.currentUsage, gate.totalAvailable);
    }
    emitEvent("wall_hit", {
      ...actor(auth),
      wall: gate.wall ?? "plan_item_limit",
      lang,
    });
    throw new Error(gate.reason || "Item limit reached");
  }
  if (auth.freePlan) {
    await assertWithinDailyPace({
      includedItems: gate.includedItems ?? 0,
      currentPeriodTotal: gate.currentUsage ?? 0,
      periodEnd: gate.periodEnd,
    });
    // Warn while there's still budget left to protect, rather than letting the
    // cap announce itself by refusing a user's request.
    await maybeAlertBudget({
      used: gate.currentUsage ?? 0,
      included: gate.includedItems ?? 0,
      periodEnd: gate.periodEnd,
    });
  }
}

/**
 * Throw when a trial item has spent its revision budget.
 *
 * Enforced at the top of generateCode rather than in updateItem because that's
 * where the money goes: the MCP client calls generateCode first and only then
 * writes the resulting taskId back through updateItem, so gating the write
 * would bill the LLM call and refuse it afterwards.
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

/**
 * Look up a sibling item and adopt its workspace.
 *
 * The decision rules live in lib/workspace-adoption.ts so they can be asserted
 * without a database (this module opens Firestore at import time). Only the
 * lookup is here.
 *
 * Best-effort by design: an unknown, expired, or unreadable id leaves the caller
 * in their own workspace rather than failing the create. The id arrives as a hint
 * from a model, and a stale hint must never cost the user their item.
 */
export async function adoptWorkspaceFromSibling(
  auth: AuthArg,
  siblingId?: string,
): Promise<void> {
  if (!auth.freePlan || !siblingId) return;
  try {
    const doc = await db.doc(`users/${auth.uid}/items/${siblingId}`).get();
    if (!doc.exists) return;
    adoptSiblingWorkspace(auth, doc.data());
  } catch (err) {
    console.error("adoptWorkspaceFromSibling()", "ERROR", err);
  }
}

/**
 * Free-plan-only response fields: a signed workspace token the client sends back
 * so its next call stays in this workspace, and a claim token addressing this
 * workspace's items. Both derive from the EFFECTIVE namespace, i.e. after any
 * adoption above.
 *
 * Best-effort — a missing salt degrades to no tokens (the item still returns)
 * rather than failing the whole mutation, matching how the MCP server has always
 * treated an unconfigured salt.
 */
async function freePlanTokens(
  auth: AuthArg,
): Promise<{ workspace?: string; claimToken?: string }> {
  if (!auth.freePlan || !auth.sessionNamespace || !isSessionTokenConfigured()) return {};
  const payload = {
    sessionNamespace: auth.sessionNamespace,
    sessionUuid: auth.sessionUuid || auth.sessionNamespace,
  };
  try {
    const [workspace, claimToken] = await Promise.all([
      mintSessionToken(payload),
      mintClaimToken(payload),
    ]);
    return { workspace, claimToken };
  } catch (err) {
    console.error("freePlanTokens()", "ERROR", err);
    return {};
  }
}

/**
 * Claim token for a specific workspace, without granting the workspace itself.
 * Used on read paths, where the reader may legitimately need to save an item it
 * can see but must not be enrolled into that item's workspace.
 */
async function freePlanClaimTokenFor(
  auth: AuthArg,
  namespace: unknown,
): Promise<{ claimToken?: string }> {
  if (!auth.freePlan || typeof namespace !== "string" || !namespace) return {};
  if (!isSessionTokenConfigured()) return {};
  try {
    const claimToken = await mintClaimToken({
      sessionNamespace: namespace,
      sessionUuid: auth.sessionUuid || namespace,
    });
    return { claimToken };
  } catch (err) {
    console.error("freePlanClaimTokenFor()", "ERROR", err);
    return {};
  }
}

function freePlanItemFields(auth: AuthArg, now = Date.now()) {
  return {
    freePlan: true,
    sessionNamespace: auth.sessionNamespace,
    expiresAt: now + FREE_PLAN_ITEM_TTL_MS,
  };
}

// How a version came to be. Best-effort provenance: callers that know pass it,
// everything else falls back to the item's client tag.
export type VersionSource =
  | "chat"
  | "editor"
  | "mcp"
  | "generation-job"
  | "claim"
  | "share"
  | "backfill"
  | "unknown";

const VERSION_LABEL_MAX = 200;

const VERSION_SOURCES: VersionSource[] = [
  "chat",
  "editor",
  "mcp",
  "generation-job",
  "claim",
  "share",
  "backfill",
  "unknown",
];

// `source` reaches us from a GraphQL arg, so it's caller-supplied — clamp it to
// the known set rather than storing whatever a client sends.
function normalizeVersionSource(source: unknown): VersionSource | undefined {
  if (typeof source !== "string") return undefined;
  return VERSION_SOURCES.includes(source as VersionSource)
    ? (source as VersionSource)
    : undefined;
}

// Callers that know how a change originated pass `source` explicitly; otherwise
// the item's client tag is the best available signal.
function defaultVersionSource(client?: string): VersionSource {
  if (client === "mcp") return "mcp";
  return "unknown";
}

// Append-only record of one content state of an item. Pointer-only: the taskId is
// content-addressed and permanently stored by api.graffiticode.org, so the code
// itself is never duplicated here (see docs/item-versioning.md).
//
// Doc id is `${itemId}__${taskId}`, which makes writes idempotent by construction:
// generate-job retries, double-saves, and reverting to an earlier state (which
// yields the SAME taskId, since tasks are content-addressed) all collapse onto the
// existing doc rather than piling up rows.
//
// Never throws — a failed version write must not fail the mutation that triggered it.
export async function recordVersion({
  auth,
  itemId,
  taskId,
  lang,
  upstreamLangs,
  name,
  mark,
  client,
  source = "unknown",
  label,
  createdAt = Date.now(),
}: {
  auth: AuthArg;
  itemId: string;
  taskId: string;
  lang: string;
  upstreamLangs?: string[];
  name?: string;
  mark?: number;
  client?: string;
  source?: VersionSource;
  label?: string;
  createdAt?: number;
}) {
  try {
    if (!itemId || !taskId || !lang) return;
    const upstream = Array.isArray(upstreamLangs) ? upstreamLangs : [];
    const version: Record<string, any> = {
      itemId,
      taskId,
      lang,
      upstreamLangs: upstream,
      // Denormalized head-first chain, so the tasks list can filter by lang
      // sequence without a round-trip per compound task.
      langs: [lang, ...upstream],
      name: name ?? null,
      mark: mark ?? null,
      client: client ?? "console",
      source,
      createdAt,
    };
    if (label) {
      version.label = String(label).slice(0, VERSION_LABEL_MAX);
    }
    if (auth.freePlan) {
      Object.assign(version, freePlanItemFields(auth, createdAt));
    }
    const ref = db.doc(`users/${auth.uid}/versions/${itemId}__${taskId}`);
    // create-if-absent, NOT set/merge: reverting to an earlier state re-derives
    // the same content-addressed taskId, and merging would overwrite that
    // version's original createdAt/source — silently rewriting history and
    // yanking an old row to the top of the list. Record the revisit instead.
    try {
      await ref.create(version);
    } catch (err: any) {
      // 6 = ALREADY_EXISTS
      if (err?.code === 6) {
        await ref.update({ lastSeenAt: createdAt });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("recordVersion()", "ERROR", itemId, taskId, error);
  }
}

/**
 * Count a billable item exactly once — the first time a distinct item gains a
 * valid taskId (its first successful compile). Called from createItem (sync /
 * template creates) and from updateItem's no-taskId -> first-taskId transition
 * (async console/MCP creates whose artifact is filled in by the worker).
 *
 * Excludes revisions (taskId -> different taskId), share/claim copies, and
 * anonymous free-plan sessions (metered separately). Idempotent via a `billed`
 * flag on the item doc set inside a transaction, so overlapping paths and
 * retries never double-count.
 *
 * Effects: writes a `type: 'item_created'` usage record (units: 1), increments
 * the monthly counter (mirroring logCompile's period reset), and reports one
 * Stripe meter event for paid tiers. Best-effort: never throws into the caller.
 *
 * Local runs (tsx scripts) record the usage row at units: 0 and stop there —
 * they write to prod Firestore but cannot reach the live Stripe customer, so
 * counting them would consume a real allowance nothing could ever invoice.
 */
export async function recordBillableItem({
  auth,
  itemId,
  taskId,
  lang,
  client,
  source,
}: {
  auth: AuthArg;
  itemId: string;
  taskId: string;
  lang?: string;
  client?: string;
  source?: VersionSource;
}) {
  try {
    if (!itemId || !taskId) return;
    // Share/claim copies re-post existing content; they are not authored items.
    if (source === "claim" || source === "share") return;

    const itemRef = db.doc(`users/${auth.uid}/items/${itemId}`);

    // Idempotency: count each distinct item once. Set `billed` on the item doc
    // in a transaction; bail if it's already billed or is a copy.
    const shouldCount = await db.runTransaction(async (tx) => {
      const snap = await tx.get(itemRef);
      if (!snap.exists) return false;
      const d = snap.data() || {};
      if (d.billed) return false;
      if (d.sharedFrom || d.claimedFrom) return false;
      tx.update(itemRef, { billed: true, billedTaskId: taskId, billedAt: Date.now() });
      return true;
    });
    if (!shouldCount) return;

    const now = new Date();
    const env = currentEnv();

    // A tsx script (corpus generation, evals, backfills) writes to PROD
    // Firestore but carries .env.local's TEST Stripe key, so its meter events
    // can never reach the live customer — reportItemUsage() just swallows the
    // error. That divergence went unnoticed for a month: 906 items counted
    // against a live account's allowance that Stripe was never told about.
    // Local items stay in `usage` for cost telemetry (training runs are real
    // spend) but carry units: 0 — the same "recorded, never billed" shape
    // logCompile and the token meter already use, which is what keeps them out
    // of checkItemCreateAllowed's self-heal sum.
    //
    // A sponsored language is the other reason an item is real usage but not
    // billable: we carry its cost deliberately. Keyed on the LANGUAGE, which the
    // server decides (the scope gate re-routes a mis-labelled request), never on
    // `client`, which is caller-supplied and would therefore be a bypass.
    const sponsored = isLanguageSponsored(lang);
    const billable = env !== "local" && !sponsored;

    // Audit record for the billable item.
    //
    // `nonBillableReason` separates the two kinds of units: 0 row, because they
    // are shown very differently — sponsored usage is the customer's and belongs
    // on their usage page, a local script run is ours and must never appear
    // there. Absent on rows written before this existed, which reads correctly
    // as "billable".
    await db.collection("usage").add({
      userId: auth.uid,
      itemId,
      taskId,
      units: billable ? 1 : 0,
      // Order matters: a local run in a sponsored language is BOTH, and "local"
      // has to win. Labelling it "sponsored" would put a training run on the
      // customer's usage page as though it were their own free usage.
      ...(billable ? {} : {
        nonBillableReason: env === "local" ? "local-script" : "sponsored",
      }),
      // Namespaced so a client/partner sponsor (`client:acme`) can be added
      // later without a migration, and so a cap can be derived retroactively.
      // Only on rows that are actually the customer's sponsored usage.
      ...(sponsored && env !== "local"
        ? { sponsorId: `lang:${String(lang).replace(/^L/i, "")}` }
        : {}),
      createdAt: now,
      timestamp: now.toISOString(),
      lang: lang ?? null,
      client: client ?? "console",
      // Same marker the ai_generation records carry. Without it the item count
      // could not be scoped to the same environment as the spend that produced
      // it, and cost-per-item divided prod-only generations by all-env items.
      env,
      type: "item_created",
    });

    // Increment the monthly counter, resetting at the billing-period boundary
    // (mirrors logCompile). currentMonthTotal is the item count for the period.
    const userDoc = await db.collection("users").doc(auth.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const subscription = userData?.subscription || {};
    const usageDocRef = db.collection("usage").doc(auth.uid);
    const usageDoc = await usageDocRef.get();
    // The usage doc is created by the first billable item and never deleted, so
    // its absence is the account's first-ever item (not merely first this period).
    const firstForAccount = !usageDoc.exists;
    const periodStart = subscription.currentPeriodStart
      ? new Date(subscription.currentPeriodStart)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    if (billable) {
      if (usageDoc.exists) {
        const currentData = usageDoc.data();
        const lastReset = currentData.lastReset ? new Date(currentData.lastReset) : null;
        const isNewBillingPeriod = !lastReset || lastReset < periodStart;
        if (isNewBillingPeriod) {
          await usageDocRef.set({
            currentMonthTotal: 1,
            lastReset: periodStart.toISOString(),
            lastUpdated: now.toISOString(),
          });
        } else {
          await usageDocRef.update({
            currentMonthTotal: admin.firestore.FieldValue.increment(1),
            lastUpdated: now.toISOString(),
          });
        }
      } else {
        await usageDocRef.set({
          currentMonthTotal: 1,
          lastReset: periodStart.toISOString(),
          lastUpdated: now.toISOString(),
        });
      }
    }

    emitEvent("item_created", {
      ...actor(auth),
      lang,
      app: client ?? "console",
      first_for_account: firstForAccount || undefined,
      source,
    });

    // A local run stops here. It is not the customer's usage at all: no
    // allowance consumed, no meter event, no trial pace. Its stdout never
    // reaches Cloud Logging, so the emitEvent above cannot reach the funnel
    // digest either.
    if (env === "local") return;

    // Anonymous free-plan (MCP trial) items are COUNTED — the writes above are
    // what checkItemCreateAllowed reads, so the trial account's own plan
    // allowance becomes the monthly budget — but never INVOICED. Stop here,
    // before the meter report, and record the day's tally for the derived
    // daily pace. A sponsored trial item still counts toward pace: it is real
    // trial activity, it just isn't paid for by anyone.
    if (auth.freePlan) {
      await recordTrialItem(now);
      return;
    }

    // A sponsored item IS the customer's usage — it reached the funnel above and
    // it shows on their usage page — but nobody is invoiced for it, so it must
    // not reach the meter.
    if (!billable) return;

    // Report to the Stripe metered price (metered tiers only — paid, or Bronze
    // enrolled in pay-as-you-go). Best-effort.
    await reportItemUsage({
      subscription,
      stripeCustomerId: userData?.stripeCustomerId,
      identifier: `${itemId}__${taskId}`,
    });
  } catch (error) {
    console.error("recordBillableItem()", "ERROR", itemId, taskId, error);
  }
}
// import { buildDynamicSchema } from "./schemas";

const SECRET_NAME_RE = /^[a-z0-9-]+$/;

// Re-exported so existing importers of these symbols keep working after the
// move to lib/task-api.ts and lib/user-credentials.ts. New code should import
// from those modules directly.
export { parseCode, postTask, getData, getSecretsForUser, getPublicValuesForUser };

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

// Global cache for templates to avoid repeated fetches
const templateCache = new Map<string, string>();

const taskDaoFactory = buildTaskDaoFactory();
const getTaskDaoForStore = buildGetTaskDaoForStorageType(taskDaoFactory);
const taskDao = getTaskDaoForStore("firestore");

const db = getFirestore();

export async function logCompile({ auth, units, id, timestamp, status, data }) {
  try {
    const [{ lang }] = await getApiTask({ id, auth });
    const path = `users/${auth.uid}/compiles/${id}`;
    data = JSON.parse(data);
    await db.doc(path).set({ id, timestamp, status, lang, data });

    // Item-based billing: compiles are free (iteration is included). Keep a
    // zero-unit audit record for history/telemetry, but never meter compiles or
    // touch the monthly item counter. Billing is driven by recordBillableItem.
    await db.collection("usage").add({
      userId: auth.uid,
      taskId: id,
      units: 0,
      createdAt: new Date(),
      timestamp,
      lang,
      type: "compile",
      status,
    });

    return JSON.stringify({ success: true });
  } catch (x) {
    console.log("logCompile()", "ERROR", x);
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

const TASK_VERSIONS_DEFAULT_LIMIT = 200;
const TASK_VERSIONS_MAX_LIMIT = 1000;

// The tasks list: every recorded content state for a language, newest first.
// Replaces the `compiles` feed, which went silent once /data responses started
// being edge-served and the api's origin callback stopped firing.
export async function getTaskVersions({
  auth,
  lang,
  client,
  itemId,
  limit,
  startAfter,
}: {
  auth: AuthArg;
  lang: string;
  client?: string;
  itemId?: string;
  limit?: number;
  startAfter?: string;
}) {
  try {
    let query = db
      .collection(`users/${auth.uid}/versions`)
      .where("lang", "==", lang) as FirebaseFirestore.Query;
    if (client && client !== "all") {
      query = query.where("client", "==", client);
    }
    if (itemId) {
      query = query.where("itemId", "==", itemId);
    }
    query = query.orderBy("createdAt", "desc");
    if (startAfter) {
      const cursor = Number(startAfter);
      if (Number.isFinite(cursor)) {
        query = query.startAfter(cursor);
      }
    }
    const capped = Math.min(
      Math.max(Number(limit) || TASK_VERSIONS_DEFAULT_LIMIT, 1),
      TASK_VERSIONS_MAX_LIMIT,
    );
    const snap = await query.limit(capped).get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      const upstreamLangs = Array.isArray(data.upstreamLangs) ? data.upstreamLangs : [];
      return {
        id: doc.id,
        itemId: data.itemId,
        taskId: data.taskId,
        lang: data.lang,
        // Older records predate the denormalized chain; derive it when missing.
        langs: Array.isArray(data.langs) && data.langs.length
          ? data.langs
          : [data.lang, ...upstreamLangs],
        name: data.name ?? null,
        mark: data.mark ?? null,
        client: data.client ?? "console",
        source: data.source ?? "unknown",
        label: data.label ?? null,
        createdAt: String(data.createdAt),
      };
    });
  } catch (error) {
    console.error("getTaskVersions()", "ERROR", error);
    throw new Error(`Failed to get task versions: ${error.message}`);
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
  source,
  label,
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
  // Provenance for the version record written on taskId change. Best-effort:
  // defaults to the client tag when the caller doesn't know.
  source?: VersionSource;
  label?: string;
  // When true, create a fast "shell" item with no task and
  // generationStatus="generating" — the caller (startCodeGeneration) runs the
  // real generation asynchronously and fills in the taskId later. Skips the
  // synchronous template generateCode below.
  deferGeneration?: boolean;
}) {
  try {
    // Gate item creation against the account's item budget BEFORE spending any
    // generation compute. Free tiers hard-cap; paid tiers block only past a
    // customer-set overage cap.
    //
    // Anonymous free-plan callers run the SAME gate: the trial account is a real
    // account with a real subscription, and auth.uid already resolves to it, so
    // its plan allowance is the trial's monthly budget. Move that account
    // between tiers and the cap follows with no code change. It carries an
    // overageLimitItems of 0, which turns the paid-tier branch into a hard cap.
    await assertItemCreateAllowed(auth, lang);

    // Generate a unique ID for the item
    const itemRef = db.collection(`users/${auth.uid}/items`).doc();
    const id = itemRef.id;
    // If no name provided, use "unnamed"
    if (!name) {
      name = "unnamed";
    }
    // If no taskId provided, create a minimal template task
    let generatedHelp = help || "[]";
    let generatedRid: string | undefined;
    if (!taskId && !deferGeneration) {
      const result = await generateCodeForRequest({
        auth,
        prompt: "Create a minimal starting template",
        language: lang,
        options: {},
        currentSrc: null,
        itemId: id,
      });
      generatedRid = result.rid;
      taskId = result.taskId;
      if (!taskId) {
        // If generation returned errors (e.g., out-of-scope), surface them to the user
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
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
    // Use merge: true so the tokenUsage that was accumulated during generation is preserved
    await itemRef.set(item, { merge: true });

    // Backfill token usage docs that were written with itemId: null (deferred generation).
    // On the generation path, all docs have itemId set, so this is a no-op; it covers
    // other paths and provides safety against async late arrivals (e.g., judgeCode).
    if (generatedRid) {
      await backfillTokenUsageItemId({ auth, rid: generatedRid, itemId: id });
    }

    if (taskId) {
      const resolvedSource = normalizeVersionSource(source) ?? defaultVersionSource(item.client);
      await recordVersion({
        auth,
        itemId: id,
        taskId,
        lang,
        upstreamLangs: item.upstreamLangs,
        name,
        mark: item.mark,
        client: item.client,
        source: resolvedSource,
        label,
        createdAt: timestamp,
      });
      // First successful compile of a distinct item — count it for billing.
      await recordBillableItem({
        auth,
        itemId: id,
        taskId,
        lang,
        client: item.client,
        source: resolvedSource,
      });
    }
    return {
      ...item,
      created: String(timestamp),
      updated: String(timestamp),
      ...(await freePlanTokens(auth)),
    };
  } catch (error) {
    console.error("createItem()", "ERROR", error);
    // Message and type are unchanged — callers and MCP error rendering both read
    // `.message`. `cause` is attached so a caller can still tell a quota refusal
    // from a genuine failure, which the workspace registry needs to record the
    // first attempt's outcome as "wall" rather than "error".
    const wrapped = new Error(`Failed to create item: ${error.message}`);
    (wrapped as Error & { cause?: unknown }).cause = error;
    throw wrapped;
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
  source,
  label,
  onRenderable,
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
  // Provenance for the version record written when taskId changes.
  source?: VersionSource;
  label?: string;
  /**
   * Called the moment the item is RENDERABLE — immediately after the taskId write
   * lands, before the re-read and the version/billing records.
   *
   * It exists for the generation worker. Measured on L0000 "multiply 10 and 21"
   * (console 07ecc7b): of the 773ms between `item_generation_timing` and the item
   * reading "ready", 308ms was bookkeeping and 24ms was a re-read — work no viewer
   * waits on, all of it landing BEFORE the status flip. The item was fully
   * renderable a third of a second before anyone could see it.
   *
   * Deliberately NOT "move the writes off the request". They still run, still
   * awaited, still before the worker returns 200 — so nothing becomes lossier and
   * the billing row cannot be dropped by a process that dies in a new window. Only
   * the announcement moves.
   *
   * Throwing here would abandon those writes, so it is caught and logged: a failed
   * status flip must not cost the version and billing records.
   */
  onRenderable?: () => Promise<void>;
}) {
  // Step timings for the one caller that waits on them: the generation worker,
  // whose whole post-generation path is round trips (see generate-job.ts). Logged
  // only when the taskId actually changes, which is the create/update path.
  const tUpdateItem = Date.now();
  let tApiTask = 0;
  let apiTaskMs = 0;
  let readMs = 0;
  let writeMs = 0;
  let rereadMs = 0;
  let versionMs = 0;
  try {
    const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
    const tRead = Date.now();
    const itemDoc = await itemRef.get();
    readMs = Date.now() - tRead;
    if (!itemDoc.exists) {
      throw new Error("Item not found");
    }
    const itemData = itemDoc.data();
    // By-id update: the item id is the capability, so a stateless client can refine an
    // item it created under a now-expired MCP session. Listing stays session-gated.
    if (!isItemVisibleToFreePlan(itemData, auth, { byId: true })) {
      if (isExpiredForFreePlan(itemData, auth)) throw buildItemExpiredError();
      throw new Error("Item not found");
    }
    // This is a mutation on an existing item, so the item's workspace wins over
    // whatever ephemeral session the request arrived on.
    adoptWorkspace(auth, itemData);
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
          tApiTask = Date.now();
          const apiTask = await getApiTask({ id: taskId, auth });
          apiTaskMs = Date.now() - tApiTask;
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
    const tWrite = Date.now();
    await itemRef.update(updates);
    writeMs = Date.now() - tWrite;
    // The item now has its taskId: renderable. Announce before the bookkeeping.
    let renderableMs = 0;
    if (onRenderable && taskId !== undefined) {
      const tHook = Date.now();
      try {
        await onRenderable();
      } catch (err) {
        console.error("updateItem(): onRenderable failed for item", id, err);
      }
      renderableMs = Date.now() - tHook;
    }
    // Re-reads the document that was just written, to build the return value.
    // The generation worker discards that return value entirely.
    const tReread = Date.now();
    const updatedDoc = await itemRef.get();
    rereadMs = Date.now() - tReread;
    const data = updatedDoc.data();
    // A changed taskId IS a new version — the one signal every producer (chat,
    // direct editor edit, generation worker, MCP) funnels through.
    if (taskIdChanged) {
      versionMs = Date.now();
      const resolvedSource = normalizeVersionSource(source) ?? defaultVersionSource(data.client);
      await recordVersion({
        auth,
        itemId: id,
        taskId,
        lang: data.lang,
        upstreamLangs: data.upstreamLangs,
        name: data.name,
        mark: data.mark,
        client: data.client,
        source: resolvedSource,
        label,
        createdAt: updates.updated,
      });
      // Bill only the no-taskId -> first-taskId transition (the async console/MCP
      // create landing its first artifact). Later taskId -> taskId changes are
      // revisions and must not be counted; recordBillableItem's `billed` guard is
      // a second line of defense.
      if (!itemData.taskId) {
        await recordBillableItem({
          auth,
          itemId: id,
          taskId,
          lang: data.lang,
          client: data.client,
          source: resolvedSource,
        });
      } else {
        // A real taskId -> taskId change: the content actually moved. Not
        // billable, but it is the edit signal the digest reports as depth.
        emitEvent("item_updated", {
          ...actor(auth),
          lang: data.lang,
          app: data.client ?? "console",
          source: resolvedSource,
        });
        if (auth.freePlan) {
          // This is a revision against the trial budget. Counting the successful
          // change rather than the attempt means a generation that failed to
          // compile doesn't burn one of only a handful of revisions — runaway
          // retries are bounded by the burst limiter instead.
          await itemRef.update({
            trialRevisions: admin.firestore.FieldValue.increment(1),
          });
        }
      }
    }
    if (taskIdChanged) {
      console.log(
        `[updateItem] id=${id} read=${readMs} apiTask=${apiTaskMs} write=${writeMs} ` +
          `reread=${rereadMs} onRenderable=${renderableMs} ` +
          `bookkeeping=${versionMs ? Date.now() - versionMs : 0} ` +
          `total=${Date.now() - tUpdateItem}`,
      );
    }
    const tTokens = Date.now();
    const tokens = await freePlanTokens(auth);
    if (taskIdChanged && Date.now() - tTokens > 50) {
      console.log(`[updateItem] id=${id} freePlanTokens=${Date.now() - tTokens}`);
    }
    return {
      id,
      ...data,
      created: String(data.created),
      updated: String(data.updated),
      ...tokens,
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

// --- Generation lease (idempotency for the Cloud Tasks worker) --------------
//
// Cloud Tasks re-dispatches a task whenever it doesn't see a response within the
// dispatch window, and it cannot tell a dead attempt from a slow one. A
// generation that outruns that window is therefore re-dispatched WHILE the first
// attempt is still running, and both do a full LLM run against the same item.
// Observed 2026-08-28: three dispatches per job, a uniform 125s apart, every one
// of them generating.
//
// The lease makes the worker idempotent — the first attempt to claim an item
// wins and later attempts return without generating. It is held only for the
// life of an attempt and released on every terminal path, so a user's next
// update_item on the same item is never blocked by it. The expiry is the
// backstop for a worker that dies without releasing: it must outlive the longest
// possible attempt so that an UNEXPIRED lease always means a live attempt rather
// than a stuck one.
//
// It was 5 minutes, justified by "Cloud Run caps the request at 300s". That
// stopped being true on 2026-08-31: the Cloud Run timeout and the queue's
// dispatchDeadline are both 900s now, and CODEGEN_REQUEST_BUDGET_MS alone allows
// 420s before the parse/postTask/item-write that follow. So any generation past
// 300s expired its own lease while still running, and the queue's second attempt
// (retryConfig.maxAttempts = 2) could claim it and start a SECOND concurrent
// generation on the same item — the duplicate-generation failure of 2026-08-28,
// reopened from the other side. Matched to the 900s dispatch deadline: past that
// point Cloud Tasks has given up, so no attempt can still be live.
const GENERATION_LEASE_MS = 15 * 60_000;

export type GenerationClaim = "claimed" | "busy" | "missing";

export async function claimGeneration({
  auth,
  id,
  owner,
}: {
  auth: AuthArg;
  id: string;
  owner: string;
}): Promise<GenerationClaim> {
  const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists) return "missing" as GenerationClaim;
    const data = snap.data() || {};
    const holder = data.generationLeaseOwner;
    const expires = Number(data.generationLeaseExpires) || 0;
    if (holder && holder !== owner && expires > Date.now()) {
      return "busy" as GenerationClaim;
    }
    tx.update(itemRef, {
      generationLeaseOwner: owner,
      generationLeaseExpires: Date.now() + GENERATION_LEASE_MS,
    });
    return "claimed" as GenerationClaim;
  });
}

// Release only what we still hold: if the lease already expired and another
// attempt took it, clearing it here would hand the item to a third.
export async function releaseGeneration({
  auth,
  id,
  owner,
}: {
  auth: AuthArg;
  id: string;
  owner: string;
}): Promise<void> {
  const itemRef = db.doc(`users/${auth.uid}/items/${id}`);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(itemRef);
      if (!snap.exists) return;
      if ((snap.data() || {}).generationLeaseOwner !== owner) return;
      tx.update(itemRef, {
        generationLeaseOwner: null,
        generationLeaseExpires: null,
      });
    });
  } catch (err) {
    // Best-effort: the lease expires on its own, and failing to release must
    // never turn a successful generation into a failed request.
    console.error("releaseGeneration()", "ERROR", id, err);
  }
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
            // This repost is where a shared/claimed item's v1 comes into
            // existence — the copy sites deliberately leave taskId null, and the
            // original's taskId isn't in this uid's ACL, so it can't be recorded
            // there. Idempotent, so re-running on a later read is harmless.
            await recordVersion({
              auth,
              itemId: doc.id,
              taskId,
              lang: data.lang,
              upstreamLangs: data.upstreamLangs,
              name: data.name,
              mark: data.mark,
              client: data.client,
              source: data.claimedFrom ? "claim" : "share",
            });
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

// Cached specs live on the item doc under `spec`. `coverage.missing` holds verbatim authored
// strings, so the stored copy is clamped: an item doc already carries `code` (the full AST) and
// `help` (the full chat transcript), and a heavily-elided spec must not push it toward the 1MB
// ceiling. The value RETURNED to the caller is always the fresh, unclamped report.
const SPEC_COVERAGE_MISSING_LIMIT = 50;

/**
 * A cache entry is valid only for the exact content state and prompt/model configuration that
 * produced it. taskId is content-addressed so it covers content; the model stamp catches a
 * MODEL_PRIORITY retier or a SPEC_MODEL override; the version stamp catches a prompt-asset edit.
 */
function isSpecCacheHit(cached: any, taskId: string): boolean {
  return !!cached
    && typeof cached.text === "string"
    && cached.text.length > 0
    && typeof cached.lang === "string"
    && cached.taskId === taskId
    && cached.version === SPEC_CACHE_VERSION
    // The entry's own lang, not the item doc's: a spec is generated from the task, whose lang
    // is fixed by the same content hash as the taskId. The item doc's `lang` can be rewritten
    // on its own (a scope-gate re-route) without the task changing underneath it.
    && cached.model === specModelFor(cached.lang);
}

// Side-write, never load-bearing: the spec has already been generated and paid for by the time
// we get here, so a failed cache write must not fail the request. Mirrors recordVersion().
async function cacheSpec({ auth, id, taskId, spec, lang, coverage, model }) {
  try {
    // A targeted update, deliberately NOT routed through updateItem: generating a spec is not
    // a content change, so it must not bump `updated`, refresh a free-plan `expiresAt`, or mint
    // a version record. `update` with a map value replaces the whole map, so a stale entry is
    // overwritten wholesale.
    await db.doc(`users/${auth.uid}/items/${id}`).update({
      spec: {
        text: spec,
        taskId,
        lang,
        model,
        version: SPEC_CACHE_VERSION,
        coverage: {
          checked: coverage?.checked ?? 0,
          missing: (coverage?.missing ?? []).slice(0, SPEC_COVERAGE_MISSING_LIMIT),
        },
        generatedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error("cacheSpec(): failed to store spec for item", id, error);
  }
}

// Produce a platform-neutral English spec of an item's content, for handing across languages.
// Resolves the item -> head taskId, then delegates to the spec generator. The item id is an
// opaque handle here; the returned spec (English) is the only cross-language exchange unit.
//
// Read-through cached on the item doc: generation is a multi-second Anthropic call and sits in
// an agent's hot path, while the result is a pure function of the (content-addressed) taskId
// plus the dialect's prompt assets and model. The cache rides along on share/claim copies,
// which spread the whole doc and re-derive the same taskId.
export async function getSpec({ auth, id }) {
  const rid = generateRequestId();
  const item = await getItem({ auth, id, includeSpec: true });
  if (!item) {
    throw new Error(`Item not found: ${id}`);
  }
  if (!item.taskId) {
    throw new Error(`Item ${id} has no compiled task yet`);
  }
  const cached = (item as any).spec;
  if (isSpecCacheHit(cached, item.taskId)) {
    console.log(`[spec-gen] cache hit lang=${cached.lang}`);
    return {
      spec: cached.text,
      lang: cached.lang,
      itemId: id,
      coverage: {
        checked: cached.coverage?.checked ?? 0,
        missing: cached.coverage?.missing ?? [],
      },
    };
  }
  const { spec, lang, coverage, model } = await generateSpec({ auth, taskId: item.taskId, rid, itemId: id });
  // Never cache an empty spec: that was the silent failure mode of a thinking-capable model
  // leading with a `thinking` block, and caching it would make a transient bug permanent.
  if (spec.trim().length > 0) {
    await cacheSpec({ auth, id, taskId: item.taskId, spec, lang, coverage, model });
  }
  return { spec, lang, itemId: id, coverage };
}

// `includeSpec` is server-internal and defaults off on purpose: /api/item dumps this return
// value straight to JSON (`res.status(200).json(item)`), so unconditionally projecting the
// cached spec would bloat that response for every caller. Only getSpec asks for it.
export async function getItem({ auth, id, includeSpec = false }: {
  auth: AuthArg;
  id: string;
  includeSpec?: boolean;
}) {
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
      if (isExpiredForFreePlan(data, auth)) throw buildItemExpiredError();
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
          // Mirrors getItems(): the repost is where a shared/claimed item's
          // first version record is born.
          await recordVersion({
            auth,
            itemId: id,
            taskId,
            lang: data.lang,
            upstreamLangs: data.upstreamLangs,
            name: data.name,
            mark: data.mark,
            client: data.client,
            source: data.claimedFrom ? "claim" : "share",
          });
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
      // Claim token only — a read must be able to offer "save this item" for the
      // workspace the item actually lives in (this retrieval path is where the
      // claim link is surfaced, after the agent polls a create to "ready"), but
      // it must NOT hand back a workspace handle: seeing an item is not joining
      // its workspace. Minted from the ITEM's namespace, not the reader's, which
      // is the whole fix — the reader's ephemeral namespace holds nothing.
      ...(await freePlanClaimTokenFor(auth, data.sessionNamespace)),
      ...(includeSpec ? { spec: data.spec ?? null } : {}),
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
/**
 * The claim link was OPENED — the step between "agent surfaced a claim link" and
 * "items transferred", which until now left no trace at all. Firestore only ever
 * recorded successful claims, so a link that was clicked and abandoned (or never
 * clicked) was indistinguishable from one that was never issued, and the middle
 * of the anonymous→account funnel could not be measured.
 *
 * `src` attributes the click to where the link was surfaced: "chat" (the
 * claim_url an agent prints) vs "footer" (the render-host's Claim button on
 * view_url). Those two convert very differently and the copy for each is tuned
 * separately, so a blended rate is not actionable.
 */
/**
 * The pre-sign-in claim funnel: three stages, one shape.
 *
 *   claim_view             the claim link was opened
 *   claim_auth_shown       the sign-in dialog was put in front of them
 *   claim_email_submitted  they entered an address and asked for a code
 *
 * All three fire before an account exists, so none can ride the authenticated
 * GraphQL path, and together they are the only view we have of WHERE a claim is
 * abandoned. That distinction is the point: a drop between view and auth_shown
 * is a page that failed to render something; a drop between auth_shown and
 * email_submitted is the ask itself being declined, which is a copy and
 * positioning problem and not a bug. Before these existed the two were
 * indistinguishable — establishing which one had happened meant cross-checking
 * the auth service's request log in a different GCP project, and only because
 * someone thought to look.
 *
 * `claim_email_submitted` NEVER carries the address. What the funnel needs to
 * know is that someone got that far; the address itself is the user's, is not
 * needed to answer the question, and would turn a counter into personal data.
 * The attempt is recorded even when the send subsequently fails, so a repeated
 * submission in one visit reads as a delivery problem rather than vanishing.
 */
export type ClaimStage = "view" | "auth_shown" | "email_submitted";

const CLAIM_STAGE_EVENTS: Record<ClaimStage, string> = {
  view: "claim_view",
  auth_shown: "claim_auth_shown",
  email_submitted: "claim_email_submitted",
};

export function logClaimStage(fields: { stage: ClaimStage; session: string; src: string }) {
  try {
    console.log(JSON.stringify({
      ev: CLAIM_STAGE_EVENTS[fields.stage],
      t: new Date().toISOString(),
      session: fields.session,
      src: fields.src,
    }));
  } catch {
    // ignore
  }
}

/**
 * `claim_id` and `items` are what make a claim joinable to the rest of an item's
 * life. The MCP stream logs an item id at create and on every update; without the
 * ids here, a claim could only be matched to a session, so "this specific item was
 * made, revised twice, then claimed" was not a question the logs could answer.
 *
 * `items` carries the SOURCE (free-plan) ids — the ones the MCP server logged —
 * paired with the new ids in the account, since a claim copies rather than moves.
 * Capped: a claim of hundreds of items is a report, not an event.
 */
const CLAIM_ITEMS_LOGGED_MAX = 50;

export function logClaimEvent(fields: {
  outcome: "ok" | "error";
  transferred?: number;
  session: string;
  err?: string;
  claimId?: string;
  items?: { from: string; to: string }[];
}) {
  try {
    console.log(JSON.stringify({
      ev: "claim",
      t: new Date().toISOString(),
      outcome: fields.outcome,
      session: fields.session,
      claim_id: fields.claimId,
      transferred: fields.transferred,
      items: fields.items?.slice(0, CLAIM_ITEMS_LOGGED_MAX),
      items_truncated:
        fields.items && fields.items.length > CLAIM_ITEMS_LOGGED_MAX ? fields.items.length : undefined,
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
  // One id for this whole claim, stamped on every doc it creates and logged with
  // it. Without it a claimed item can be traced back to a session but not to the
  // single act that moved it, and a session that claims four times (which the
  // logs show happening) collapses into one indistinguishable blur. Declared
  // outside the try so a failed claim is still identifiable in the logs.
  const claimId = randomUUID();

  try {
  const snapshot = await db
    .collection(`users/${trialAuth.uid}/items`)
    .where("freePlan", "==", true)
    .where("sessionNamespace", "==", sessionNamespace)
    .get();

  let transferred = 0;
  const items: { id: string; lang: string; created: number }[] = [];
  const claimedPairs: { from: string; to: string }[] = [];
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
      // The workspace this item actually came from — recorded explicitly rather
      // than left to be re-derived by hashing `claimedFrom`. Since workspace
      // adoption, the claim token's sessionUuid is whichever session happened to
      // present the token, which is not necessarily the session whose hash
      // equals the workspace the items live in. Re-hashing the uuid therefore
      // yields the wrong namespace and the funnel report loses the join back to
      // the originating session's events.
      claimedFromNamespace: sessionNamespace,
      // The claim that produced this doc — the same id logged on the claim event,
      // so an item in the console can be walked back to its MCP lifecycle.
      claimId,
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
    claimedPairs.push({ from: doc.id, to: newId });
    items.push({ id: newId, lang: String(data.lang || ""), created: timestamp });
  }

  items.sort((a, b) => b.created - a.created);
  logClaimEvent({ outcome: "ok", transferred, session: sessionNamespace, claimId, items: claimedPairs });
  return {
    transferred,
    sessionNamespace,
    items: items.map(({ id, lang }) => ({ id, lang })),
  };
  } catch (err: any) {
    logClaimEvent({ outcome: "error", session: sessionNamespace, claimId, err: String(err?.message ?? err) });
    throw err;
  }
}
