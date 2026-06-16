#!/usr/bin/env bash
#
# Propagate GRAFFITICODE_SECRET_KEY from the deployed console secret to a
# language/compiler service so both ends share the same encrypt/decrypt key.
#
#   ./scripts/set-compiler-secret.sh <lang>      # e.g. l0166, L0166, or 0166
#
# Source: Secret Manager secret GRAFFITICODE_SECRET_KEY in project
#         "graffiticode-app" (the key the deployed console uses).
# Target: the Cloud Run service <lang> in project "graffiticode", with the same
#         secret mounted as the GRAFFITICODE_SECRET_KEY env var.
#
# IMPORTANT: this key MUST NEVER CHANGE. Encrypted values (baked into stored
# task ASTs and stored secrets) persist forever and can only be decrypted with
# the exact key that encrypted them. This script therefore refuses to overwrite
# an existing key in the target project with a different value.
#
set -euo pipefail

SRC_PROJECT="graffiticode-app"
DST_PROJECT="graffiticode"
REGION="us-central1"
SECRET_NAME="GRAFFITICODE_SECRET_KEY"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <lang>   (e.g. l0166, L0166, or 0166)" >&2
  exit 1
fi

# Normalize l0166 / L0166 / 0166 / 166 -> l0166 (the Cloud Run service name).
RAW="$1"
DIGITS="${RAW#[lL]}"
if ! [[ "${DIGITS}" =~ ^[0-9]+$ ]]; then
  echo "Invalid language '${RAW}': expected something like l0166 / L0166 / 0166" >&2
  exit 1
fi
SERVICE="l$(printf '%04d' "$((10#${DIGITS}))")"

echo "Target service: ${SERVICE} (project ${DST_PROJECT}, region ${REGION})"

# 1. Pull the canonical value from the deployed console secret.
if ! SRC_VALUE=$(gcloud secrets versions access latest \
      --secret="${SECRET_NAME}" --project="${SRC_PROJECT}" 2>/dev/null); then
  cat >&2 <<EOF
Cannot read ${SECRET_NAME} from project ${SRC_PROJECT}.

The console key must be created ONCE before it can be propagated. Generate a
strong value and store it (do this a single time, then never change it):

  printf '%s' "\$(openssl rand -hex 32)" | \\
    gcloud secrets create ${SECRET_NAME} --project=${SRC_PROJECT} \\
      --replication-policy=automatic --data-file=-

Then mount it on the console service and re-run this script.
EOF
  exit 1
fi
if [[ -z "${SRC_VALUE}" ]]; then
  echo "${SECRET_NAME} in ${SRC_PROJECT} is empty — refusing to propagate." >&2
  exit 1
fi

# 2. Upsert the secret in the target project, never changing an existing value.
if gcloud secrets describe "${SECRET_NAME}" --project="${DST_PROJECT}" >/dev/null 2>&1; then
  DST_VALUE=$(gcloud secrets versions access latest \
    --secret="${SECRET_NAME}" --project="${DST_PROJECT}" 2>/dev/null || true)
  if [[ -n "${DST_VALUE}" && "${DST_VALUE}" != "${SRC_VALUE}" ]]; then
    echo "ABORT: ${SECRET_NAME} already exists in ${DST_PROJECT} with a DIFFERENT value." >&2
    echo "Changing it would make all previously-encrypted values undecryptable." >&2
    exit 1
  fi
  if [[ -z "${DST_VALUE}" ]]; then
    echo "Adding first version to existing empty secret ${SECRET_NAME} in ${DST_PROJECT}"
    printf '%s' "${SRC_VALUE}" | gcloud secrets versions add "${SECRET_NAME}" \
      --project="${DST_PROJECT}" --data-file=-
  else
    echo "${SECRET_NAME} already matches in ${DST_PROJECT} — reusing existing version."
  fi
else
  echo "Creating ${SECRET_NAME} in ${DST_PROJECT}"
  printf '%s' "${SRC_VALUE}" | gcloud secrets create "${SECRET_NAME}" \
    --project="${DST_PROJECT}" --replication-policy=automatic --data-file=-
fi

# 3. Grant the service's runtime SA permission to read the secret.
SA=$(gcloud run services describe "${SERVICE}" \
  --project="${DST_PROJECT}" --region="${REGION}" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)
if [[ -z "${SA}" ]]; then
  PROJECT_NUMBER=$(gcloud projects describe "${DST_PROJECT}" --format='value(projectNumber)')
  SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo "Service has no explicit SA; using default compute SA: ${SA}"
fi
gcloud secrets add-iam-policy-binding "${SECRET_NAME}" \
  --project="${DST_PROJECT}" \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None >/dev/null

# 4. Mount it on the language service.
gcloud run services update "${SERVICE}" \
  --project="${DST_PROJECT}" \
  --region="${REGION}" \
  --update-secrets="${SECRET_NAME}=${SECRET_NAME}:latest"

echo
echo "Done. ${SERVICE} is rolling a new revision with ${SECRET_NAME} mounted."
echo "Verify with:"
echo "  gcloud run services describe ${SERVICE} --project ${DST_PROJECT} --region ${REGION} \\"
echo "    --format='value(spec.template.spec.containers[0].env)'"
