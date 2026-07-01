#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_DIST_DIR="$ROOT_DIR/apps/admin/dist"
SERVER_ADMIN_PUBLIC_DIR="$ROOT_DIR/apps/server/public/admin"

if [ ! -d "$ADMIN_DIST_DIR" ]; then
  printf '[sync-admin-static] ERROR: admin build output not found: %s\n' "$ADMIN_DIST_DIR" >&2
  printf '[sync-admin-static] Run `pnpm build:admin` first.\n' >&2
  exit 1
fi

mkdir -p "$SERVER_ADMIN_PUBLIC_DIR"
rsync -a --delete "$ADMIN_DIST_DIR/" "$SERVER_ADMIN_PUBLIC_DIR/"

printf '[sync-admin-static] synced %s -> %s\n' "$ADMIN_DIST_DIR" "$SERVER_ADMIN_PUBLIC_DIR"
