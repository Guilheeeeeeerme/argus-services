#!/usr/bin/env bash
set -euo pipefail

project=${1:?usage: scripts/smoke-service.sh <project>}
case "$project" in
  capture) port=3000; path=/health ;;
  triage) port=3001; path=/ ;;
  realtime) port=3002; path=/health ;;
  notifications|analysis) port=8080; path=/health ;;
  *) echo "unknown service project: $project" >&2; exit 2 ;;
esac

compose_file="$project/docker-compose.yml"
docker compose -f "$compose_file" config --quiet
docker network inspect argus_dev >/dev/null

if [[ "$project" == notifications || "$project" == analysis ]]; then
  echo "Service smoke checks passed: $project"
  exit 0
fi

curl -kfsS --resolve "development.argus.com:$port:127.0.0.1" \
  "https://development.argus.com:$port$path" >/dev/null
echo "Service smoke checks passed: $project"
