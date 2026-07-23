// Cloud Tasks worker for async code generation. Enqueued by the
// startCodeGeneration mutation (see src/lib/generation-queue.ts). Runs the same
// generateCode service the synchronous mutation uses, then persists the result
// and flips the item's generationStatus so clients polling get_item see it.
//
// Cloud Tasks holds this request open for the full 60-110s generation (CPU
// allocated throughout) — the console already sustains requests this long via
// the synchronous /api path, so no special runtime config is needed.
import type { NextApiRequest, NextApiResponse } from "next";
import {
  generateCode,
  updateItem,
  getItem,
  setItemGenerationStatus,
} from "./resolvers";
import { client } from "../../lib/auth";
import { getCredentialsForApiKey } from "../../lib/api-credentials";
import { getFreePlanCredentials } from "../../lib/free-plan-context";
import type { AuthReplay, GenerationJob } from "../../lib/generation-queue";

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
  const { itemId, lang, prompt, modification, currentSrc, authReplay } = job || {};
  if (!itemId || !lang || !prompt || !authReplay) {
    return res.status(400).json({ error: "Missing required job fields" });
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

  try {
    const result = await generateCode({
      auth,
      prompt,
      language: lang,
      options: {},
      currentSrc: currentSrc ?? null,
      itemId,
    });

    if (result.errors?.length || !result.taskId) {
      const message = result.errors?.map((e: any) => e.message).join("\n") || "No taskId returned";
      await setItemGenerationStatus({ auth, id: itemId, status: "failed", error: message });
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

    return res.status(200).json({ status: "ready", taskId: result.taskId });
  } catch (err: any) {
    // Unexpected error: leave the item "generating" and return 5xx so Cloud
    // Tasks retries (capped by the queue's maxAttempts). If every attempt fails
    // the item stays "generating" and the MCP staleness guard reports it failed
    // — avoids flapping the status to "failed" between retries.
    console.error("[generate-job] generation failed", itemId, err);
    return res.status(500).json({ error: "generation_error" });
  }
}
