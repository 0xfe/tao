#!/usr/bin/env bash
# Build and publish one environment. Immutable assets land before the short-lived index.
set -euo pipefail

usage() {
  cat <<'HELP'
Usage: ./upload.sh [dev|prod] [--dry-run] [--clean]

  prod      Default: build and upload to https://muthanna.com/tao/
  dev       Build and upload to https://muthanna.com/tao-dev/
  --dry-run Build and verify; print the destination without uploading.
  --clean   After publishing, wait 6 minutes for cached index pages/loading,
            then remove obsolete files only in the selected environment.

Index: 5-minute cache. Hashed assets: 1-day cache.
Without --clean, previous assets are retained. Do not run simultaneous
uploads to the same environment. Requires Node.js, npm and authenticated gcloud.
HELP
}

environment=''
clean=false
dry_run=false
for argument in "$@"; do
  case "$argument" in
    dev|prod)
      if [[ -n "$environment" ]]; then usage >&2; exit 2; fi
      environment="$argument" ;;
    --dry-run) dry_run=true ;;
    --clean)
      if [[ "$clean" == true ]]; then usage >&2; exit 2; fi
      clean=true ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'Unknown argument: %s\n' "$argument" >&2; usage >&2; exit 2 ;;
  esac
done
if [[ -z "$environment" ]]; then environment=prod; fi

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [[ "$dry_run" != true ]]; then
  command -v gcloud >/dev/null || { printf 'Install and authenticate the Google Cloud CLI first.\n' >&2; exit 1; }
fi
case "$environment" in
  dev) destination='gs://muthanna.com/tao-dev/' ;;
  prod) destination='gs://muthanna.com/tao/' ;;
esac

npm run build
# Freeze this release so a later local build cannot mix files during upload or cleanup.
staging=$(mktemp -d "${TMPDIR:-/tmp}/tao-upload.XXXXXX")
trap 'rm -rf -- "$staging"' EXIT
mkdir "$staging/site"
cp -R dist/. "$staging/site/"
node scripts/verify-build.mjs "$staging/site"

if [[ "$dry_run" == true ]]; then
  printf 'Verified build. Would upload assets first, then index.html to %s\n' "$destination"
  if [[ "$clean" == true ]]; then printf 'Would prune obsolete assets after the 360-second grace period.\n'; fi
  exit 0
fi

# Explicitly exclude the index and local receipt from the long-cache phase.
# Keep prior hashed versions available for clients holding the previous index.
asset_flags=(--recursive --checksums-only --predefined-acl=publicRead
  '--exclude=^(index\.html|\.build-manifest\.json)$'
  '--cache-control=public,max-age=86400,immutable'
  --gzip-in-flight=css,js,json,map,svg,txt)
printf 'Uploading assets to %s\n' "$destination"
gcloud storage rsync "$staging/site/" "$destination" "${asset_flags[@]}"

# Always copy index.html, even when bytes match, to set the intended metadata.
# must-revalidate prevents a stale index being reused after its freshness period.
gcloud storage cp "$staging/site/index.html" "${destination}index.html" \
  --predefined-acl=publicRead \
  '--cache-control=public,max-age=300,must-revalidate' \
  --content-type=text/html --gzip-in-flight=html
printf 'Published %s.\n' "$environment"

if [[ "$clean" == true ]]; then
  printf 'Waiting 360 seconds before pruning old assets (300-second index TTL + loading grace).\n'
  sleep 360
  # Abort pruning if another release has become current while we were waiting.
  # Deploys to the same environment must still be serialized by the caller.
  gcloud storage cat "${destination}index.html" > "$staging/remote-index.html"
  if ! cmp -s "$staging/site/index.html" "$staging/remote-index.html"; then
    printf 'The remote index changed; skipping cleanup. Retry --clean for the current release.\n' >&2
    exit 1
  fi
  node scripts/verify-build.mjs "$staging/site"
  gcloud storage rsync "$staging/site/" "$destination" "${asset_flags[@]}" \
    --delete-unmatched-destination-objects
  printf 'Removed obsolete artifacts from %s\n' "$destination"
fi
