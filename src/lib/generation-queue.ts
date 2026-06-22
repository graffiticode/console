// Enqueues async code-generation jobs onto a Cloud Tasks queue that calls the
// /api/generate-job worker. Cloud Tasks holds that HTTP request open while the
// 60-110s generation runs (CPU allocated the whole time, with retries), so the
// MCP-facing startCodeGeneration mutation can return immediately and clients
// poll get_item for completion. See src/pages/api/generate-job.ts.
//
// We call the Cloud Tasks REST API directly (fetch + metadata-server token)
// rather than @google-cloud/tasks: the SDK loads JSON/proto config files at
// runtime that Next.js standalone output-tracing doesn't bundle, which 500s the
// route. REST has no such footprint.

const PROJECT =
  process.env.GENERATION_QUEUE_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  "graffiticode-app";
const LOCATION = process.env.GENERATION_QUEUE_LOCATION || "us-central1";
const QUEUE = process.env.GENERATION_QUEUE_NAME || "generation-jobs";
const SECRET = process.env.INTERNAL_JOB_SECRET || "";
const CONSOLE_URL = process.env.CONSOLE_URL || "https://console.graffiticode.org";
const WORKER_URL = process.env.GENERATION_JOB_URL || `${CONSOLE_URL}/api/generate-job`;
// Fire the worker directly (un-awaited fetch) instead of via Cloud Tasks. Set
// for local dev, where the dev server stays running and there's no queue.
const LOCAL = process.env.GENERATION_QUEUE_LOCAL === "1";

const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

// Worker auth: how the worker re-derives credentials to act as the caller.
// Free-plan re-derives fresh creds (idTokens are short-lived, dispatch can lag),
// so we carry the session rather than a baked idToken.
export type AuthReplay =
  | { kind: "bearer"; token: string }
  | { kind: "freePlan"; sessionNamespace?: string; sessionUuid?: string };

export interface GenerationJob {
  itemId: string;
  lang: string;
  prompt: string;
  modification: string;
  currentSrc?: string | null;
  authReplay: AuthReplay;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(METADATA_TOKEN_URL, { headers: { "Metadata-Flavor": "Google" } });
  if (!res.ok) {
    throw new Error(`metadata token fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function enqueueGenerationJob(job: GenerationJob): Promise<void> {
  if (!SECRET) {
    throw new Error("INTERNAL_JOB_SECRET is not configured — cannot enqueue generation job");
  }
  const body = JSON.stringify(job);

  if (LOCAL) {
    // Local dev: invoke the worker without awaiting completion. The dev server
    // keeps running, so the request finishes in the background.
    void fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Job-Secret": SECRET },
      body,
    }).catch((err) => console.error("[generation-queue] local dispatch failed", err));
    return;
  }

  const token = await getAccessToken();
  const url = `https://cloudtasks.googleapis.com/v2/projects/${PROJECT}/locations/${LOCATION}/queues/${QUEUE}/tasks`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      task: {
        httpRequest: {
          url: WORKER_URL,
          httpMethod: "POST",
          headers: { "Content-Type": "application/json", "X-Internal-Job-Secret": SECRET },
          body: Buffer.from(body).toString("base64"),
        },
        // Worker generation runs well under this; bounds a stuck dispatch.
        dispatchDeadline: "300s",
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloud Tasks createTask failed: ${res.status} ${text}`);
  }
}
