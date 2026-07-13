#!/usr/bin/env bash
#
# Clear the deployed console's in-memory caches by bouncing its Cloud Run
# revision: shift live traffic to the previous ready revision, then roll a
# FRESH revision of the same image and route traffic back to it.
#
#   ./scripts/gcp-clear-cache.sh [--wait <seconds>]
#   npm run gcp:clear-cache
#
# Why a fresh revision and not just a traffic toggle: the service runs with
# minScale=1, so the current (tip) revision keeps a warm instance even at 0%
# traffic. Toggling traffic away and back can hand the request straight back to
# that same warm instance, leaving in-process caches (e.g. the api-credentials
# cache) intact. Redeploying the identical image with a rotating cache-bust env
# var forces a brand-new revision with brand-new instances, guaranteeing the
# caches are cleared. The code version is unchanged (same image digest/tag).
#
set -euo pipefail

PROJECT="graffiticode-app"
SERVICE="console"
REGION="us-central1"
WAIT_SECONDS=5

while [[ $# -gt 0 ]]; do
  case "$1" in
    --wait) WAIT_SECONDS="${2:?--wait needs a value}"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

echo "Service: ${SERVICE} (project ${PROJECT}, region ${REGION})"

# The revision currently serving traffic, and its image.
read -r CURRENT_REV IMAGE < <(gcloud run services describe "${SERVICE}" \
  --project "${PROJECT}" --region "${REGION}" \
  --format="value(status.latestReadyRevisionName, spec.template.spec.containers[0].image)")

if [[ -z "${CURRENT_REV}" || -z "${IMAGE}" ]]; then
  echo "Could not resolve current revision/image." >&2
  exit 1
fi
echo "Current revision: ${CURRENT_REV}"
echo "Current image:    ${IMAGE}"

# Newest ready revision that isn't the current one = the "previous" version.
PREVIOUS_REV="$(gcloud run revisions list --service "${SERVICE}" \
  --project "${PROJECT}" --region "${REGION}" \
  --sort-by="~metadata.creationTimestamp" \
  --filter="status.conditions.type=Ready AND status.conditions.status=True" \
  --format="value(metadata.name)" \
  | grep -v "^${CURRENT_REV}\$" | head -n1 || true)"

# Step 1: flip live traffic to the previous revision (if one exists).
if [[ -n "${PREVIOUS_REV}" ]]; then
  echo ""
  echo "==> Routing 100% traffic to previous revision: ${PREVIOUS_REV}"
  gcloud run services update-traffic "${SERVICE}" \
    --project "${PROJECT}" --region "${REGION}" \
    --to-revisions="${PREVIOUS_REV}=100" --quiet
  echo "    Waiting ${WAIT_SECONDS}s for the tip revision to drain..."
  sleep "${WAIT_SECONDS}"
else
  echo "No previous ready revision found; skipping the toggle-away step."
fi

# Step 2: roll a fresh revision of the SAME image. The rotating env var
# guarantees a new revision (new instances = clean cache).
STAMP="$(date +%s)"
echo ""
echo "==> Deploying a fresh revision of ${IMAGE} (cache-bust ${STAMP})"
gcloud run deploy "${SERVICE}" \
  --project "${PROJECT}" --region "${REGION}" \
  --image "${IMAGE}" \
  --update-env-vars "CONSOLE_CACHE_FLUSHED_AT=${STAMP}" \
  --quiet

# Step 3: promote the fresh revision. Step 1 pinned traffic to a specific
# revision, so `deploy` left the new revision at 0%; --to-latest undoes the pin
# and routes 100% to the just-deployed (latest) revision.
echo ""
echo "==> Routing 100% traffic to the fresh (latest) revision"
gcloud run services update-traffic "${SERVICE}" \
  --project "${PROJECT}" --region "${REGION}" \
  --to-latest --quiet

# Report the revision actually serving traffic (not just the latest ready one).
NEW_REV="$(gcloud run services describe "${SERVICE}" \
  --project "${PROJECT}" --region "${REGION}" \
  --format="value(status.traffic[0].revisionName)")"

echo ""
echo "Done. Now serving fresh revision: ${NEW_REV} (100% traffic)"
echo "In-memory caches cleared."
