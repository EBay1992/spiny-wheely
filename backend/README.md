# @spiny-wheely/backend

NestJS operator API for spinyWheely — player HTTP, wheel WebSocket, wallet settlement, and game math.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 10 |
| Database | PostgreSQL 16 (TypeORM) |
| Cache / WS fan-out | Redis 7 (ioredis, Socket.IO adapter) |
| Real-time | Socket.IO (`/wheel` namespace) |
| Auth | JWT (player + admin roles) |

## Quick start

From the **monorepo root**:

```bash
docker compose up -d
npm install
cp backend/.env.example backend/.env
npm run migration:run
npm run dev:api
```

API: http://localhost:3000  
Health: http://localhost:3000/health  
Wheel WS: `ws://localhost:3000/wheel`

## Environment

Copy `.env.example` → `.env` in this directory.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP listen port |
| `DATABASE_*` | see example | PostgreSQL connection |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Redis |
| `DATABASE_POOL_MAX` | `10` | Connection pool per process |
| `JWT_SECRET` | — | Signing key (change in production) |
| `INSTANCE_ID` | `HOSTNAME` | Shown in `/health` for load-balancer checks |

## Project layout

```
src/
├── admin/           # Operator HTTP API
├── auth/            # JWT, guards (HTTP + WebSocket)
├── bet-session/     # Wager history persistence (event listener)
├── common/          # Enums, wager limits, house-edge utils
├── database/        # Entities, migrations, data-source
├── game-config/     # RTP / volatility configuration
├── game-math/wheel/ # Pure RNG engine + segment definitions
├── games/wheel/     # WebSocket gateway + spin service
├── health/          # Readiness probes
├── player/          # Player HTTP API
├── redis/           # Redis client + IO adapter
├── wallet/          # Balance cache, debit/credit, events
├── app.module.ts
└── main.ts
```

## HTTP API

### Player (`/player`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/player/auth/login` | — | Returns JWT |
| `GET` | `/player/profile` | Player JWT | Balance, currency, limits |
| `GET` | `/player/wager-history` | Player JWT | Paginated bet history |

### Admin (`/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/auth/login` | — | Operator JWT |
| `GET` | `/admin/metrics` | Admin JWT | Platform RTP / volume |
| `GET` | `/admin/games/config` | Admin JWT | Game configurations |
| `PATCH` | `/admin/games/config/:id` | Admin JWT | Update RTP, volatility, live flag |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `GET` | `/health/ready` | DB + Redis readiness |

## WebSocket — Wheel (`/wheel`)

Connect with `auth: { token: <player JWT> }`.

| Event (client → server) | Payload | Description |
|-------------------------|---------|-------------|
| `wheel:preview` | — | Request segment layout |
| `wheel:spin` | `{ wagerAmount }` | Place wager and spin |

| Event (server → client) | Description |
|-------------------------|-------------|
| `wheel:preview` | Segment tables per tier |
| `wheel:result` | Authoritative path, multiplier, balance |
| `wheel:error` | Validation or settlement error |
| `wheel:latest` | Broadcast of latest public result |

## Spin flow

1. Validate wager against `MIN_WAGER` / `MAX_WAGER` and game config.
2. **Debit** wager via `WalletService.settleBet()` (pessimistic row lock).
3. Run `WheelRngEngine` — small → optional middle → optional big tier.
4. **Credit** payout if multiplier > 0; `0x` keeps the debit.
5. Cache round in Redis; emit `wheel:result`.
6. `bet.settled` event → `BetSessionListener` writes history async.

## Scripts

```bash
npm run dev          # watch mode
npm run build        # compile to dist/
npm run start:prod   # node dist/main.js
npm run migration:run
```

From monorepo root: `npm run migration:run`, `npm run build:api`, `npm run start:api`.

## Docker

```bash
# From repo root
docker build -t spinywheely-api -f backend/Dockerfile .
```

Multi-instance: see [deploy/SCALING.md](../deploy/SCALING.md).

## Architecture

System-wide diagrams: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
