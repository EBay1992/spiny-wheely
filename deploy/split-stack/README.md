# Split deploy: Vercel + Render + Upstash

Production-style layout for a live demo:

| Layer | Provider | Service |
|-------|----------|---------|
| Frontend | **Vercel** | React static app |
| API | **Render** | NestJS Docker web service |
| Database | **Render** | Managed PostgreSQL |
| Cache / WS fan-out | **Upstash** | Serverless Redis (TLS) |

```
┌─────────────┐     HTTPS REST + WSS      ┌──────────────────┐
│   Vercel    │ ────────────────────────► │  Render API      │
│  (React)    │   VITE_API_URL            │  spinywheely-api │
└─────────────┘                           └────────┬─────────┘
                                                   │
                                          ┌────────┴─────────┐
                                          ▼                  ▼
                                   ┌────────────┐    ┌─────────────┐
                                   │ Render PG  │    │  Upstash    │
                                   └────────────┘    │  Redis      │
                                                     └─────────────┘
```

## 1. Upstash Redis

1. [console.upstash.com](https://console.upstash.com/) → **Create database**
2. Region: pick one close to Render (`us-west` / Oregon pairs well)
3. Copy **Redis URL** (`rediss://default:…@….upstash.io:6379`)

Keep this URL for step 3.

## 2. Render (API + Postgres)

### Option A — Blueprint (recommended)

1. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
2. Connect this repo → select `render.yaml`
3. After the first deploy, open **spinywheely-api** → **Environment**
4. Add:

   | Key | Value |
   |-----|-------|
   | `REDIS_URL` | Upstash Redis URL (`rediss://…`) |

5. **Save** → manual redeploy if needed
6. Copy the API public URL, e.g. `https://spinywheely-api.onrender.com`

Verify:

```bash
curl https://spinywheely-api.onrender.com/health
curl https://spinywheely-api.onrender.com/health/ready
```

`ready` should show `redis: ok` when `REDIS_URL` is set correctly.

### Option B — Manual

- **PostgreSQL** free instance → note internal `DATABASE_URL`
- **Web Service** → Docker, `backend/Dockerfile`, context `.`
- Env: `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `NODE_ENV=production`

> Free Render web services sleep after ~15 min idle; first request may take ~30s.

## 3. Vercel (frontend)

1. [vercel.com/new](https://vercel.com/new) → import this Git repo
2. Framework preset: **Vite** (or Other — `vercel.json` at repo root defines the build)
3. **Environment variables** (Production + Preview):

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://spinywheely-api.onrender.com` (your Render API URL, no trailing slash) |

4. Deploy

Open the Vercel URL → **Player** tab → `demo@spinywheely.test` / `player123`.

## Environment matrix (no conflicts)

| Where | `VITE_API_URL` | Backend Redis | Backend CORS |
|-------|----------------|---------------|--------------|
| **localhost** (`npm run dev`) | empty (ignored) | `REDIS_HOST=localhost` | auto (proxy = same origin) |
| **Vercel + Render** | `https://…onrender.com` | `REDIS_URL` (Upstash) | auto, or set `CORS_ORIGINS` |
| **Fly all-in-one** | empty (same origin) | optional | same origin |

Local dev **never** uses `VITE_API_URL` unless you set `VITE_USE_REMOTE_API=true` — so production env vars in Vercel cannot break localhost.

## Wiring checklist

- [ ] Upstash database created; `REDIS_URL` on Render
- [ ] Render API `/health` returns `ok`
- [ ] Render API `/health/ready` shows `database: ok`, `redis: ok`
- [ ] Vercel `VITE_API_URL` matches Render API origin exactly (`https`, no trailing `/`)
- [ ] Login works on Vercel URL
- [ ] Wheel spin connects (WebSocket to `VITE_API_URL/wheel`)

## Demo accounts

Seeded by migrations on first API deploy:

| Role | Email | Password |
|------|-------|----------|
| Player | `demo@spinywheely.test` | `player123` |
| Operator | `admin@spinywheely.test` | `admin123` |

## Local parity

```bash
# .env in backend/
REDIS_URL=rediss://default:YOUR_TOKEN@YOUR_HOST.upstash.io:6379

# .env in frontend/ (or export for build)
VITE_API_URL=http://localhost:3000
```

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Login CORS error | `VITE_API_URL` wrong or missing; rebuild Vercel after env change |
| WebSocket fails | Render API asleep — wake with `curl /health`; check browser console |
| `redis: fail` on `/health/ready` | Wrong `REDIS_URL`; must be Upstash **Redis URL**, not REST URL |
| 401 on spin | Token expired — log in again |
| Stale frontend | Vercel caches build env — redeploy after changing `VITE_API_URL` |

## Cost notes

- **Vercel** hobby: static hosting is typically free for demos
- **Render** free: API + DB with sleep/cold starts
- **Upstash** free tier: sufficient for interview traffic

## Other deploy options

- All-in-one on Fly.io (no Redis): [deploy/fly/README.md](../fly/README.md)
- Render-only (API + static on Render): use an older commit’s `render.yaml` with `spinywheely-web`
