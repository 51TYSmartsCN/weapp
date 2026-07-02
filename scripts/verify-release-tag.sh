#!/usr/bin/env sh

set -eu

usage() {
  cat <<'EOF'
Usage:
  GITHUB_REF_NAME=release-vYYYYMMDD.N sh scripts/verify-release-tag.sh
  sh scripts/verify-release-tag.sh release-vYYYYMMDD.N

Environment:
  RELEASE_BRANCH=release
  RELEASE_TAG_PREFIX=release
  GITHUB_REF_NAME=release-vYYYYMMDD.N
  GITHUB_ACTOR=<github actor>                  Optional when no allowlist is configured
  DEPLOY_TAGGERS_ENV_NAME=PROD_DEPLOY_TAGGERS Optional env name that stores an allowlist
  PROD_DEPLOY_TAGGERS=a,b                      Optional comma/space separated allowlist
  GITHUB_OUTPUT=/path                          Optional GitHub Actions output file
EOF
}

fail() {
  echo "[verify-release-tag] ERROR: $*" >&2
  exit 1
}

emit_output() {
  key="$1"
  value="$2"
  printf '%s=%s\n' "$key" "$value"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s=%s\n' "$key" "$value" >> "$GITHUB_OUTPUT"
  fi
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

RELEASE_BRANCH="${RELEASE_BRANCH:-release}"
RELEASE_TAG_PREFIX="${RELEASE_TAG_PREFIX:-release}"
DEPLOY_TARGET_NAME="${DEPLOY_TARGET_NAME:-t0ops}"
DEPLOY_TAGGERS_ENV_NAME="${DEPLOY_TAGGERS_ENV_NAME:-PROD_DEPLOY_TAGGERS}"
TAG_NAME="${GITHUB_REF_NAME:-${1:-}}"
TAG_PATTERN="^${RELEASE_TAG_PREFIX}-v[0-9]{8}\\.[0-9]+$"
TAG_GLOB="${RELEASE_TAG_PREFIX}-v*"

[ -n "$TAG_NAME" ] || fail "missing tag name (pass GITHUB_REF_NAME or the first argument)"

if ! printf '%s\n' "$TAG_NAME" | grep -Eq "$TAG_PATTERN"; then
  fail "invalid ${RELEASE_TAG_PREFIX} tag name: $TAG_NAME"
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  fail "current directory is not a git repository"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  fail "git remote origin is not configured"
fi

git fetch --force --prune --tags --depth="${RELEASE_FETCH_DEPTH:-200}" --filter=blob:none origin \
  "+refs/heads/${RELEASE_BRANCH}:refs/remotes/origin/${RELEASE_BRANCH}" \
  "+refs/tags/${TAG_GLOB}:refs/tags/${TAG_GLOB}" >/dev/null 2>&1 ||
  fail "failed to fetch origin/${RELEASE_BRANCH} and ${TAG_GLOB}"

if ! git rev-parse --verify --quiet "refs/tags/${TAG_NAME}" >/dev/null; then
  fail "tag not found after fetch: $TAG_NAME"
fi

if ! git rev-parse --verify --quiet "refs/remotes/origin/${RELEASE_BRANCH}^{commit}" >/dev/null; then
  fail "release branch not found on origin: ${RELEASE_BRANCH}"
fi

TAG_COMMIT="$(git rev-list -n 1 "$TAG_NAME")"
RELEASE_HEAD="$(git rev-parse "refs/remotes/origin/${RELEASE_BRANCH}^{commit}")"

if [ "$TAG_COMMIT" != "$RELEASE_HEAD" ]; then
  fail "tag $TAG_NAME points to $TAG_COMMIT, but origin/${RELEASE_BRANCH} is $RELEASE_HEAD"
fi

TAGGERS="$(eval "printf '%s' \"\${$DEPLOY_TAGGERS_ENV_NAME:-}\"")"
if [ -n "$TAGGERS" ]; then
  ACTOR="${GITHUB_ACTOR:-}"
  [ -n "$ACTOR" ] || fail "missing GITHUB_ACTOR while ${DEPLOY_TAGGERS_ENV_NAME} allowlist is configured"

  actor_allowed=0
  normalized_taggers="$(printf '%s\n' "$TAGGERS" | tr ',;' '  ')"
  for candidate in $normalized_taggers; do
    if [ "$candidate" = "$ACTOR" ]; then
      actor_allowed=1
      break
    fi
  done

  [ "$actor_allowed" = "1" ] || fail "actor $ACTOR is not allowed to deploy ${DEPLOY_TARGET_NAME}"
  emit_output actor "$ACTOR"
fi

emit_output tag_name "$TAG_NAME"
emit_output tag_commit "$TAG_COMMIT"
emit_output release_branch "$RELEASE_BRANCH"
emit_output release_head "$RELEASE_HEAD"

echo "Release tag verified: $TAG_NAME -> $TAG_COMMIT"
