#!/bin/sh
set -e

echo "[fly] Running database migrations…"
node backend/dist/database/run-migrations.js

echo "[fly] Starting API on :3000 (Redis disabled unless REDIS_HOST is set)…"
node backend/dist/main.js &

echo "[fly] Starting nginx on :8080…"
exec nginx -g 'daemon off;'
