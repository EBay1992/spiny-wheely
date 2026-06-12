# @spiny-wheely/backend

NestJS operator API — player HTTP, wheel WebSocket, wallet settlement, and game math.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 10 |
| Database | PostgreSQL 16 (TypeORM) |
| Cache / WS fan-out | Redis 7 (ioredis, Socket.IO adapter) |
| Real-time | Socket.IO (`/wheel` namespace) |
| Auth | JWT (player + admin roles) |

## Quick start

```bash
docker compose up -d
npm install
cp backend/.env.example backend/.env
npm run migration:run
npm run dev:api
```

API: http://localhost:3000 · Health: `/health` · Ready: `/health/ready` · WS: `ws://localhost:3000/wheel`

Demo: `demo@spinywheely.test` / `player123` · Operator: `admin@spinywheely.test` / `admin123`

## Environment

Copy `.env.example` → `.env`.

| Variable | Description |
|----------|-------------|
| `DATABASE_*` or `DATABASE_URL` | PostgreSQL |
| `REDIS_HOST` + `REDIS_PORT` | Local / Fly Compose (`localhost` or `redis`) |
| `REDIS_URL` | Managed Redis (`rediss://…`) — takes precedence over `REDIS_HOST` |
| `JWT_SECRET` | JWT signing key |
| `DATABASE_POOL_MAX` | Pool size per process (default `10`) |
| `INSTANCE_ID` | Shown in `/health` for LB checks |
| `CORS_ORIGINS` | Optional comma-separated origins (unset = allow all) |

Redis is **required** for multi-instance API replicas (Socket.IO adapter). Single-process can run without Redis but caching is disabled.

## HTTP API

### Player (`/player`)

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/player/auth/login` | — |
| `GET` | `/player/profile` | Player JWT |
| `GET` | `/player/game-info` | Player JWT |
| `GET` | `/player/wager-history` | Player JWT |

### Admin (`/admin`)

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/admin/auth/login` | — |
| `GET` | `/admin/metrics` | Admin JWT |
| `GET` | `/admin/games/config` | Admin JWT |
| `PATCH` | `/admin/games/config/:id` | Admin JWT |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `GET` | `/health/ready` | DB + Redis readiness |

## WebSocket — `/wheel`

Connect with `auth: { token: <player JWT> }`.

| Client → server | Server → client |
|-----------------|-----------------|
| `wheel:preview` | `wheel:preview` |
| `wheel:spin` `{ wagerAmount }` | `wheel:result` / `wheel:error` |

## Docker

```bash
docker build -t spinywheely-api -f backend/Dockerfile .
```

Multi-instance: [deploy/SCALING.md](../deploy/SCALING.md)

## Architecture

[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
