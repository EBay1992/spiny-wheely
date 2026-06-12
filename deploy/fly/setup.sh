#!/usr/bin/env bash
# Deploy spinyWheely to Fly.io (one machine, full stack).
set -euo pipefail

APP="${FLY_APP:-spinywheely}"
REGION="${FLY_REGION:-iad}"
VOLUME="${FLY_VOLUME:-pg_data}"
WAIT_TIMEOUT="${FLY_WAIT_TIMEOUT:-15m}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT}"

if ! command -v fly >/dev/null 2>&1; then
  echo "Install flyctl: https://fly.io/docs/hands-on/install-flyctl/" >&2
  exit 1
fi

if ! fly apps list 2>/dev/null | awk '{print $1}' | grep -qx "${APP}"; then
  echo "Creating Fly app ${APP}…"
  fly apps create "${APP}" --org personal
fi

if ! fly volumes list -a "${APP}" 2>/dev/null | grep -q "${VOLUME}"; then
  echo "Creating data volume ${VOLUME} (Postgres + Redis persistence)…"
  fly volumes create "${VOLUME}" --size 1 --region "${REGION}" -a "${APP}" --yes
fi

if ! fly secrets list -a "${APP}" 2>/dev/null | grep -q 'JWT_SECRET'; then
  echo "Setting secrets…"
  fly secrets set -a "${APP}" \
    JWT_SECRET="$(openssl rand -hex 32)" \
    POSTGRES_PASSWORD="$(openssl rand -hex 16)"
fi

echo "Deploying ${APP}…"
echo "Watch: fly logs -a ${APP}"
fly deploy . \
  --config deploy/fly/fly.toml \
  --dockerfile deploy/fly/Dockerfile \
  -a "${APP}" \
  --ha=false \
  --smoke-checks=false \
  --wait-timeout "${WAIT_TIMEOUT}" \
  -y

echo ""
echo "Deploy complete. First boot may take ~60–90s (Postgres init + migrations)."
echo "  fly logs -a ${APP}"
echo "  fly machine start -a ${APP}   # if stopped"
echo "  curl -sf https://${APP}.fly.dev/health && echo ok"
echo "  fly open -a ${APP}"
