#!/bin/sh
set -e

PGDATA=/data/postgres
PGLOG=/var/log/postgresql/postgresql.log
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-spinywheely}"

: "${JWT_SECRET:?JWT_SECRET is required — fly secrets set JWT_SECRET=...}"

mkdir -p /data/postgres /data/redis /run/postgresql /var/log/postgresql
chown -R postgres:postgres /data/postgres /run/postgresql /var/log/postgresql

# Remove partial init from a previous failed boot (including dotfiles).
if [ -d "${PGDATA}" ] && [ ! -f "${PGDATA}/PG_VERSION" ]; then
  echo "[fly] Cleaning incomplete Postgres data directory…"
  find "${PGDATA}" -mindepth 1 -delete
fi

if [ ! -f "${PGDATA}/PG_VERSION" ]; then
  echo "[fly] Initializing Postgres in ${PGDATA}…"
  INIT_PW="/run/postgresql/.initpw"
  printf '%s\n' "${POSTGRES_PASSWORD}" > "${INIT_PW}"
  chown postgres:postgres "${INIT_PW}"
  chmod 600 "${INIT_PW}"

  su-exec postgres initdb -D "${PGDATA}" \
    --auth-local=trust \
    --auth-host=scram-sha-256 \
    --pwfile="${INIT_PW}"
  rm -f "${INIT_PW}"

  {
    echo "listen_addresses = '127.0.0.1'"
    echo "port = 5432"
  } >> "${PGDATA}/postgresql.conf"
  echo "host all all 127.0.0.1/32 scram-sha-256" >> "${PGDATA}/pg_hba.conf"

  su-exec postgres pg_ctl -D "${PGDATA}" -l "${PGLOG}" -w start
  su-exec postgres psql -v ON_ERROR_STOP=1 <<-EOSQL
    CREATE USER spinywheely WITH PASSWORD '${POSTGRES_PASSWORD}' SUPERUSER;
    CREATE DATABASE spinywheely OWNER spinywheely;
EOSQL
  su-exec postgres pg_ctl -D "${PGDATA}" -m fast -w stop
fi

echo "[fly] Starting Postgres…"
su-exec postgres pg_ctl -D "${PGDATA}" -l "${PGLOG}" -w start

echo "[fly] Starting Redis…"
redis-server --daemonize yes --dir /data/redis --appendonly yes

until pg_isready -h 127.0.0.1 -U spinywheely -d spinywheely >/dev/null 2>&1; do
  sleep 1
done

# Embedded Postgres — ignore any external DATABASE_URL Fly secret.
unset DATABASE_URL
export DATABASE_HOST=127.0.0.1
export DATABASE_PORT=5432
export DATABASE_USER=spinywheely
export DATABASE_PASSWORD="${POSTGRES_PASSWORD}"
export DATABASE_NAME=spinywheely
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6379
export PORT=3000

echo "[fly] Running migrations…"
node backend/dist/database/run-migrations.js

echo "[fly] Starting API on :3000…"
su-exec spiny node backend/dist/main.js &

echo "[fly] Starting nginx on :8080…"
exec nginx -g 'daemon off;'
