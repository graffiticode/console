// OAuth access token for calling Google Cloud REST APIs from Cloud Run.
//
// We call GCP REST endpoints directly (fetch + this token) rather than using
// the @google-cloud/* SDKs: those load JSON/proto config files at runtime that
// Next.js standalone output-tracing doesn't bundle, which 500s the route.
// See the header comment on src/lib/generation-queue.ts.
//
// The metadata server returns the Cloud Run runtime service account's token
// with the cloud-platform scope, so the same token works for Cloud Tasks and
// Cloud Logging alike. Locally there is no metadata server and this throws —
// callers are expected to have a local escape hatch.

const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

export async function getAccessToken(): Promise<string> {
  const res = await fetch(METADATA_TOKEN_URL, {
    headers: { "Metadata-Flavor": "Google" },
  });
  if (!res.ok) {
    throw new Error(`metadata token fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}
