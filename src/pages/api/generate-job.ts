// Cloud Tasks worker for async code generation. Enqueued by the
// startCodeGeneration mutation (see src/lib/generation-queue.ts). Runs the same
// generateCode service the synchronous mutation uses, then persists the result
// and flips the item's generationStatus so clients polling get_item see it.
//
// Cloud Tasks holds this request open for the full 60-110s generation (CPU
// allocated throughout) — the console already sustains requests this long via
// the synchronous /api path, so no special runtime config is needed.
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { generateCodeForRequest } from "../../lib/code-generation/generate-for-request";
import {
  updateItem,
  getItem,
  setItemGenerationStatus,
  claimGeneration,
  releaseGeneration,
} from "./resolvers";
import { client } from "../../lib/auth";
import { getCredentialsForApiKey } from "../../lib/api-credentials";
import { getFreePlanCredentials } from "../../lib/free-plan-context";
import { GENERATION_JOB_VERSION } from "../../lib/generation-queue";
import type { AuthReplay, GenerationJob } from "../../lib/generation-queue";
import { emitEvent, actor } from "../../lib/funnel-events";
import { resolveFirstOutcome } from "../../lib/workspace-registry";

type Auth = { uid: string; token: string; freePlan?: boolean; sessionNamespace?: string };

// Mirror of the auth resolution in api/index.ts, driven by the replayed
// credential rather than live request headers.
async function reconstructAuth(replay: AuthReplay): Promise<Auth> {
  if (replay.kind === "freePlan") {
    const { uid, idToken } = await getFreePlanCredentials();
    return { uid, token: idToken, freePlan: true, sessionNamespace: replay.sessionNamespace };
  }
  try {
    const { uid } = await client.verifyToken(replay.token);
    return { uid, token: replay.token };
  } catch {
    const { uid, idToken } = await getCredentialsForApiKey(replay.token);
    return { uid, token: idToken };
  }
}

// Help-history entry shape shared with the MCP server's parseHelp /
// buildContextualPrompt — keep in lockstep so subsequent updates parse it.
function appendHelpEntry(helpJson: string, modification: string, taskId: string): string {
  let history: unknown[] = [];
  try {
    const parsed = JSON.parse(helpJson || "[]");
    if (Array.isArray(parsed)) history = parsed;
  } catch {
    history = [];
  }
  history.push({
    user: modification,
    help: { text: modification },
    type: "user",
    timestamp: new Date().toISOString(),
    taskId,
  });
  return JSON.stringify(history);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.INTERNAL_JOB_SECRET || "";
  if (!secret || req.headers["x-internal-job-secret"] !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const job = req.body as GenerationJob;
  const {
    v,
    itemId,
    lang,
    prompt,
    modification,
    currentSrc,
    authReplay,
    client,
  } = job || {};
  if (!itemId || !lang || !prompt || !authReplay) {
    return res.status(400).json({ error: "Missing required job fields" });
  }
  // Tasks enqueued before versioning carry no `v`; treat them as v1 since the
  // required fields above are identical. A version we don't recognize is from a
  // NEWER revision, so fail loudly rather than guessing at its shape — 400 keeps
  // Cloud Tasks from retrying a payload this revision will never understand.
  if (v !== undefined && v !== GENERATION_JOB_VERSION) {
    console.error("[generate-job] unsupported payload version", v, itemId);
    return res.status(400).json({ error: "unsupported_job_version", v });
  }

  let auth: Auth;
  try {
    auth = await reconstructAuth(authReplay);
  } catch (err) {
    // Auth could not be reconstructed — return 5xx so Cloud Tasks retries
    // (capped by the queue's maxAttempts) in case it was a transient blip.
    console.error("[generate-job] auth reconstruction failed", itemId, err);
    return res.status(500).json({ error: "auth_failed" });
  }

  // The workspace this generation belongs to, as the same key actor() stamps on
  // events so the registry and the event stream agree. resolveFirstOutcome only
  // moves a row out of "pending", so calling it on every generation is safe:
  // all but the workspace's first attempt no-op.
  const workspaceKey = (actor(auth) as { session?: string }).session;

  // Claim the item before doing any work. A Cloud Tasks re-dispatch that lands
  // while the first attempt is still generating must NOT generate again — see
  // claimGeneration in resolvers.ts. The owner is per-ATTEMPT, not per-task,
  // because retries of one task carry the same task name and are exactly what
  // we are deduplicating.
  const attemptId = randomUUID();
  const claim = await claimGeneration({ auth, id: itemId, owner: attemptId });
  if (claim === "missing") {
    // Nothing to generate into; retrying will not conjure the item.
    console.error("[generate-job] item missing", itemId);
    return res.status(200).json({ status: "missing" });
  }
  if (claim === "busy") {
    // Another attempt holds the lease and is still running. 2xx so the queue
    // stops retrying: if that attempt dies, the item stays "generating" and the
    // MCP staleness guard reports it — the same contract as exhausted retries.
    console.warn("[generate-job] duplicate dispatch ignored", itemId);
    return res.status(200).json({ status: "duplicate" });
  }

  try {
    const result = await generateCodeForRequest({
      auth,
      prompt,
      language: lang,
      options: {},
      currentSrc: currentSrc ?? null,
      itemId,
      // Already on the job payload (see generation-queue.ts); passed down so the
      // language gate's funnel event can be qualified as MCP activity.
      client,
    });

    if (result.errors?.length || !result.taskId) {
      const message = result.errors?.map((e: any) => e.message).join("\n") || "No taskId returned";
      await setItemGenerationStatus({ auth, id: itemId, status: "failed", error: message });
      // Only the terminal failure is reported. The catch below returns 5xx so
      // Cloud Tasks retries, and emitting there would count one failure once per
      // attempt.
      // `app` mirrors the item_created/item_updated convention in resolvers.ts —
      // it is what lets the MCP-only report keep this event (isMcpOrigin).
      emitEvent("item_generation_failed", { ...actor(auth), lang, app: client ?? "console", err: message });
      await resolveFirstOutcome(workspaceKey, "generation_failed");
      await releaseGeneration({ auth, id: itemId, owner: attemptId });
      // Handled outcome — 2xx so the queue does NOT retry.
      return res.status(200).json({ status: "failed", error: message });
    }

    // Persist the new task + appended help, then mark ready. updateItem handles
    // the code-refresh + (free-plan) expiry bump on taskId change.
    const existing = await getItem({ auth, id: itemId });
    const updatedHelp = appendHelpEntry(existing?.help ?? "[]", modification, result.taskId);
    // If the pre-flight scope gate re-routed away from the client's pick, persist the corrected
    // language (and any composition upstreams) so MCP get_item reflects what was actually built.
    const rerouted = result.language && result.language !== lang;
    await updateItem({
      auth,
      id: itemId,
      taskId: result.taskId,
      help: updatedHelp,
      source: "generation-job",
      label: modification,
      ...(rerouted ? { lang: result.language } : {}),
      ...(Array.isArray(result.upstreamLangs) ? { upstreamLangs: result.upstreamLangs } : {}),
    });
    await setItemGenerationStatus({ auth, id: itemId, status: "ready" });
    await resolveFirstOutcome(workspaceKey, "ok");
    await releaseGeneration({ auth, id: itemId, owner: attemptId });

    return res.status(200).json({ status: "ready", taskId: result.taskId });
  } catch (err: any) {
    // Unexpected error: leave the item "generating" and return 5xx so Cloud
    // Tasks retries (capped by the queue's maxAttempts). If every attempt fails
    // the item stays "generating" and the MCP staleness guard reports it failed
    // — avoids flapping the status to "failed" between retries.
    console.error("[generate-job] generation failed", itemId, err);
    // Release so the Cloud Tasks retry can claim it: this attempt is genuinely
    // over, and a retry is the point of returning 5xx here.
    await releaseGeneration({ auth, id: itemId, owner: attemptId });
    return res.status(500).json({ error: "generation_error" });
  }
}
