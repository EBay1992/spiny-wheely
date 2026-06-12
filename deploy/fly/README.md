# Deploy on Fly.io (one machine, full stack)

One **Fly machine** runs a **single container** with all services:

| Process | Role |
|---------|------|
| PostgreSQL 16 | Database (data on `/data/postgres` volume) |
| Redis 7 | Cache + Socket.IO fan-out |
| NestJS API | REST + WebSocket on `:3000` |
| nginx | React static files + reverse proxy on `:8080` |

No Docker-in-Docker — builds cleanly on Fly/Depot remote builders.

Public URL: `https://<app>.fly.dev`

Demo logins: `demo@spinywheely.test` / `player123`, `admin@spinywheely.test` / `admin123`

## Quick deploy

```bash
bash deploy/fly/setup.sh
```

## Manual deploy

```bash
fly apps create spinywheely --org personal
fly volumes create pg_data --size 1 --region iad -a spinywheely

fly secrets set -a spinywheely \
  JWT_SECRET="$(openssl rand -hex 32)" \
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"

fly deploy . --config deploy/fly/fly.toml --dockerfile deploy/fly/Dockerfile --ha=false
```

## Scaling beyond one machine

This Fly deploy is a single-machine stack. For multiple API replicas, use **[deploy/SCALING.md](../SCALING.md)** (Docker Compose POC or Kubernetes). All replicas share one Redis instance for the Socket.IO adapter.

## Operations

```bash
fly logs -a spinywheely
fly machine start -a spinywheely    # if stopped
fly ssh console -a spinywheely
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on DinD / privileged | Use this Dockerfile (no DinD) |
| `initdb: must specify a password` | Fixed in entrypoint (`--pwfile`); redeploy |
| Crash loop / load balance errors | Symptom of entrypoint exit — check `fly logs` for the first error |
| Health check timeout | Wait ~90s on first boot (Postgres init + migrations) |
| `JWT_SECRET is required` | `fly secrets set JWT_SECRET=...` |
| Machine stopped | `fly machine start -a spinywheely` |
