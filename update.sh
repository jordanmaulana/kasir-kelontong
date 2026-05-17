#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> git pull"
git pull --ff-only

echo "==> docker compose build"
docker compose --env-file .env.docker build

echo "==> docker compose up -d (removing orphans from old Caddy setup)"
docker compose --env-file .env.docker up -d --remove-orphans

wait_healthy() {
  local svc="$1"
  echo "==> waiting for ${svc} healthy"
  until [ "$(docker compose --env-file .env.docker ps -q "$svc" | xargs -I{} docker inspect -f '{{.State.Health.Status}}' {})" = "healthy" ]; do
    sleep 2
  done
}

wait_healthy postgres
wait_healthy backend

echo "==> pruning dangling images (cleans old Caddy layers)"
docker image prune -f

echo "==> done"
docker compose --env-file .env.docker ps
