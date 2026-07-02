#!/usr/bin/env bash

set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-tydeploy@t0ops}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/geo-course/weapp}"
REMOTE_RELEASE_ROOT="${REMOTE_RELEASE_ROOT:-/opt/geo-course/releases}"
REMOTE_PM2_NAME="${REMOTE_PM2_NAME:-geo-course-server}"
REMOTE_PM2_OWNER="${REMOTE_PM2_OWNER:-ops}"
REMOTE_PM2_WRAPPER="${REMOTE_PM2_WRAPPER:-/usr/local/bin/geo-course-server-pm2}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://ty-server-api.tysmarts.cn}"
ALLOWED_DEV_ORIGIN="${ALLOWED_DEV_ORIGIN:-http://localhost:4007}"
FORBIDDEN_TEST_ORIGIN="${FORBIDDEN_TEST_ORIGIN:-https://evil.example.com}"
DEPLOY_RELEASE_TAG="${DEPLOY_RELEASE_TAG:-${GITHUB_REF_NAME:-manual}}"

REMOTE_SERVER_ROOT="$REMOTE_ROOT/apps/server"
REMOTE_ADMIN_ROOT="$REMOTE_SERVER_ROOT/public/admin"
REMOTE_DIST_ROOT="$REMOTE_SERVER_ROOT/dist"
REMOTE_SRC_ROOT="$REMOTE_SERVER_ROOT/src"
REMOTE_DEPLOY_ROOT="$REMOTE_ROOT/deploy/t0ops"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_ROOT="$REPO_ROOT/apps/server"
SERVER_ADMIN_PUBLIC_ROOT="$SERVER_ROOT/public/admin"

LOCAL_HEALTH_URL="http://127.0.0.1:4010/api/health"
PUBLIC_HEALTH_URL="$PUBLIC_BASE_URL/api/health"
PUBLIC_ADMIN_LOGIN_URL="$PUBLIC_BASE_URL/admin/login"

RELEASE_ID=""

log() {
  printf '[deploy-from-runner] %s\n' "$*"
}

die() {
  printf '[deploy-from-runner] ERROR: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

check_local_prereqs() {
  require_cmd pnpm
  require_cmd node
  require_cmd rsync
  require_cmd ssh
  require_cmd curl
  require_cmd git
}

check_remote_prereqs() {
  ssh "$REMOTE_HOST" "
    set -euo pipefail
    command -v rsync >/dev/null 2>&1
    command -v curl >/dev/null 2>&1
    command -v sudo >/dev/null 2>&1
    test -d '$REMOTE_ROOT'
    test -d '$REMOTE_SERVER_ROOT'
    test -f '$REMOTE_ROOT/deploy/t0ops/start-geo-course-server.sh'
    test -x '$REMOTE_PM2_WRAPPER'
    sudo -n -u '$REMOTE_PM2_OWNER' '$REMOTE_PM2_WRAPPER' status >/dev/null 2>&1
  " >/dev/null
}

install_and_build() {
  log "installing dependencies"
  (cd "$REPO_ROOT" && pnpm install --frozen-lockfile)

  log "building @geo/shared"
  (cd "$REPO_ROOT" && pnpm build:shared)

  log "building @geo/server"
  (cd "$REPO_ROOT" && pnpm build:server)

  log "building @geo/admin"
  (cd "$REPO_ROOT" && pnpm build:admin)

  test -f "$SERVER_ADMIN_PUBLIC_ROOT/index.html" || die "missing synced admin index: $SERVER_ADMIN_PUBLIC_ROOT/index.html"
}

run_local_tests() {
  local -a test_files

  mapfile -t test_files < <(
    find "$SERVER_ROOT/test" -maxdepth 1 -name '*.test.cjs' ! -name 'live-api-contract.test.cjs' | sort
  )

  [[ ${#test_files[@]} -gt 0 ]] || die "no local test files found under $SERVER_ROOT/test"

  log "running local regression tests"
  (cd "$REPO_ROOT" && node --test "${test_files[@]}")
}

should_run_live_contract_test() {
  [[ -f "$REPO_ROOT/.env" ]] && return 0
  [[ -n "${live_api_base_url:-}" && -n "${live_api_admin_username:-}" && -n "${live_api_admin_password:-}" ]]
}

run_optional_live_contract_test() {
  if should_run_live_contract_test; then
    log "running live API contract test"
    (cd "$REPO_ROOT" && node --test apps/server/test/live-api-contract.test.cjs)
  else
    log "skipping live API contract test because live_api_* env is not configured"
  fi
}

create_remote_backup() {
  local safe_release_tag
  safe_release_tag="$(printf '%s' "$DEPLOY_RELEASE_TAG" | tr -c 'A-Za-z0-9._-' '_')"
  RELEASE_ID="${safe_release_tag}-$(date '+%Y%m%d-%H%M%S')"

  ssh "$REMOTE_HOST" "
    set -euo pipefail
    release_dir='$REMOTE_RELEASE_ROOT/$RELEASE_ID'
    mkdir -p \"\$release_dir/server-dist\" \"\$release_dir/server-admin\" \"\$release_dir/server-src\" \"\$release_dir/deploy-t0ops\"
    if [ -d '$REMOTE_DIST_ROOT' ]; then
      rsync -a --delete '$REMOTE_DIST_ROOT/' \"\$release_dir/server-dist/\"
    fi
    if [ -d '$REMOTE_ADMIN_ROOT' ]; then
      rsync -a --delete '$REMOTE_ADMIN_ROOT/' \"\$release_dir/server-admin/\"
    fi
    if [ -f '$REMOTE_SRC_ROOT/index.ts' ]; then
      rsync -a '$REMOTE_SRC_ROOT/index.ts' \"\$release_dir/server-src/index.ts\"
    fi
    if [ -d '$REMOTE_DEPLOY_ROOT' ]; then
      rsync -a --delete '$REMOTE_DEPLOY_ROOT/' \"\$release_dir/deploy-t0ops/\"
    fi
    printf '%s\n' '$RELEASE_ID'
  "
}

sync_remote_release() {
  log "syncing server dist to $REMOTE_HOST"
  rsync -az --delete "$SERVER_ROOT/dist/" "$REMOTE_HOST:$REMOTE_DIST_ROOT/"

  log "syncing admin static files to $REMOTE_HOST"
  rsync -az --delete "$SERVER_ADMIN_PUBLIC_ROOT/" "$REMOTE_HOST:$REMOTE_ADMIN_ROOT/"

  log "syncing server source entry for runtime/source parity"
  rsync -az "$SERVER_ROOT/src/index.ts" "$REMOTE_HOST:$REMOTE_SRC_ROOT/index.ts"

  log "syncing deploy runtime scripts to $REMOTE_HOST"
  rsync -az --delete "$REPO_ROOT/deploy/t0ops/" "$REMOTE_HOST:$REMOTE_DEPLOY_ROOT/"
}

reload_remote_service() {
  log "reloading pm2 process $REMOTE_PM2_NAME"
  ssh "$REMOTE_HOST" "sudo -n -u '$REMOTE_PM2_OWNER' '$REMOTE_PM2_WRAPPER' reload"
}

verify_remote_service() {
  log "verifying remote health endpoint via loopback"
  ssh "$REMOTE_HOST" "curl -fsS -i '$LOCAL_HEALTH_URL' | sed -n '1,12p'"

  log "verifying public health endpoint"
  curl -fsS -i "$PUBLIC_HEALTH_URL" | sed -n '1,12p'

  log "verifying localhost dev origin is allowed"
  ssh "$REMOTE_HOST" "curl -fsS -i -X OPTIONS '$LOCAL_HEALTH_URL' -H 'Origin: $ALLOWED_DEV_ORIGIN' -H 'Access-Control-Request-Method: GET' | sed -n '1,20p'"

  log "verifying untrusted origin is rejected with 403"
  local forbidden_response
  forbidden_response="$(ssh "$REMOTE_HOST" "curl -sS -i -X OPTIONS '$LOCAL_HEALTH_URL' -H 'Origin: $FORBIDDEN_TEST_ORIGIN' -H 'Access-Control-Request-Method: GET' | sed -n '1,20p'")"
  printf '%s\n' "$forbidden_response"
  grep -q '403 Forbidden' <<<"$forbidden_response" || die "unexpected CORS response for forbidden origin"

  log "verifying public admin login page"
  local admin_html
  admin_html="$(curl -fsS "$PUBLIC_ADMIN_LOGIN_URL")"
  grep -q '<!doctype html>' <<<"$admin_html" || die "admin login page did not return HTML"
  grep -q '/admin/assets/' <<<"$admin_html" || die "admin login page is missing /admin/assets/ references"
}

main() {
  check_local_prereqs
  check_remote_prereqs
  install_and_build
  run_local_tests

  log "creating remote backup"
  create_remote_backup
  log "remote backup release id: $RELEASE_ID"

  sync_remote_release
  reload_remote_service
  verify_remote_service
  run_optional_live_contract_test

  log "deploy completed successfully"
  log "rollback target if needed: $RELEASE_ID"
}

main "$@"
