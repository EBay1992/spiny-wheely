# Deploy spinyWheely on Fly.io (no Redis)

One Fly app serves **both** the React client and the NestJS API behind nginx on a single URL. PostgreSQL runs on [Fly Postgres](https://fly.io/docs/postgres/). Redis is **not** required — omit `REDIS_HOST` and the API uses Postgres only (fine for a live demo on one machine).

## What you get

| URL | Serves |
|-----|--------|
| `https://<app>.fly.dev/` | Player + operator UI |
| `https://<app>.fly.dev/player/*` | Player REST API |
| `https://<app>.fly.dev/admin/*` | Operator REST API |
| `wss://<app>.fly.dev/wheel` | Wheel WebSocket |

Demo logins (seeded by migrations): `demo@spinywheely.test` / `player123`, `admin@spinywheely.test` / `admin123`.

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed and logged in (`fly auth login`)
- Billing may be required for Postgres (Fly free allowances change; check current Fly pricing)

## 1. Create the Fly app

From the **repo root**:

```bash
# Pick a globally unique app name, or keep spinywheely if available
fly apps create spinywheely --org personal
```

Edit `deploy/fly/fly.toml` and set `app = 'your-unique-name'` if needed.

## 2. Create and attach Postgres

```bash
fly postgres create --name spinywheely-db --region iad --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1

fly postgres attach spinywheely-db --app spinywheely
```

This sets the `DATABASE_URL` secret on the app. Migrations run automatically on each deploy.

## 3. Set secrets

```bash
fly secrets set --app spinywheely JWT_SECRET="$(openssl rand -hex 32)"
```

Do **not** set `REDIS_HOST` for this demo layout.

## 4. Deploy

```bash
fly deploy --config deploy/fly/fly.toml
```

First build compiles backend + frontend and may take a few minutes.

## 5. Open the demo

```bash
fly open --app spinywheely
```

Log in on the **Player** tab, spin the wheel, then try the **Operator** tab for metrics/RTP.

## Useful commands

```bash
fly logs --app spinywheely
fly status --app spinywheely
fly ssh console --app spinywheely
fly scale count 1 --app spinywheely   # keep one machine for live sessions
```

## Cost / live-session tips

- `auto_stop_machines = 'off'` and `min_machines_running = 1` in `fly.toml` keep the app awake during an interview (uses more credits).
- For a short demo, you can set `auto_stop_machines = 'on'` after the session to save cost.
- Single-instance without Redis is correct for demos; do not scale to multiple machines without adding Redis (see [deploy/SCALING.md](../SCALING.md)).

## Two-app alternative (optional)

If you prefer separate API and static frontend apps:

1. Deploy API with `backend/Dockerfile` and `fly postgres attach`.
2. Build frontend with `VITE_API_URL=https://your-api.fly.dev` and deploy as a static/nginx app.

The all-in-one image in this folder avoids CORS/WebSocket cross-origin setup for interviews.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Health check failing | `fly logs` — usually DB not attached or migrations failed |
| WebSocket won’t connect | Ensure you use the combined deploy (same origin), not split apps without `VITE_API_URL` |
| 502 on first request | Wait for health grace period (~45s) after deploy |
| Login fails | Confirm migrations ran; check `DATABASE_URL` with `fly secrets list` |
