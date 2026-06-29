#!/usr/bin/env bash

set -euo pipefail

set -a
source /opt/geo-course/env/server.production.env
set +a

exec node /opt/geo-course/weapp/apps/server/dist/index.js
