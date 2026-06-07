# spinyWheely Test Suite

Comprehensive tests for the iGaming monorepo.

## Structure

```
tests/
├── unit/           # Pure logic — no running API required
├── api/            # HTTP contract tests (player, operator, security)
├── e2e/            # Full flows — WebSocket wheel, wallet, operator RTP
├── load/           # Concurrency & latency benchmarks
├── helpers/        # Shared clients and config
└── setup/          # Vitest global setup (API health check)
```

## Prerequisites

| Suite | Requires |
|-------|----------|
| `unit` | Nothing |
| `api`, `e2e` | API running + Docker (Postgres, Redis) + migrations |
| `load` | Same as api/e2e |

```bash
docker compose up -d
npm run migration:run
npm run dev:api   # or npm run dev
```

## Commands (from repo root)

```bash
npm install

npm run test:unit          # Game math, segments, utils
npm run test:api           # REST endpoints
npm run test:e2e           # Wheel + wallet + operator flows
npm run test:integration   # api + e2e
npm run test               # All vitest suites
npm run test:load          # Load / stress test
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_URL` | `http://localhost:3000` | Target API |
| `TEST_PLAYER_EMAIL` | `player@spinywheely.test` | Player login |
| `TEST_PLAYER_PASSWORD` | `player123` | Player password |
| `TEST_ADMIN_EMAIL` | `admin@spinywheely.test` | Operator login |
| `TEST_ADMIN_PASSWORD` | `admin123` | Operator password |
| `SKIP_INTEGRATION` | — | Set `1` to skip api/e2e when API is down |
| `LOAD_CONCURRENCY` | `100` | HTTP/profile parallel workers |
| `LOAD_WHEEL_WORKERS` | `50` | WebSocket spin workers |
| `LOAD_DURATION_SEC` | `30` | Duration per scenario |
| `LOAD_WARMUP_SEC` | `3` | Warm-up before measured run |
| `LOAD_HEALTH_P95_MS` | `100` | SLA: health p95 latency |
| `LOAD_WHEEL_P95_MS` | `1000` | SLA: wheel p95 latency |
| `LOAD_MIXED` | `1` | Run mixed-traffic scenario |

### Load profiles

| Command | Profile |
|---------|---------|
| `npm run test:load:smoke` | Quick check (~5s/scenario) |
| `npm run test:load` | Standard high-traffic (100 workers × 30s) |
| `npm run test:load:heavy` | Stress (200 workers × 60s) |

Reports: JSON written to `tests/load/reports/load-report-*.json` with p50/p95/p99, throughput, error rate.

**Before first load test**, seed dedicated players (one wallet per wheel worker):

```bash
npm run migration:run
```

This creates `load-player-01@spinywheely.test` … `load-player-50@spinywheely.test` (password: `player123`, $50k balance each).

## Coverage map

| Area | Unit | API | E2E | Load |
|------|------|-----|-----|------|
| Wheel RNG (3-tier) | ✅ | | ✅ | |
| Segment geometry | ✅ | | | |
| Wager limits | ✅ | | | |
| Wager history cursor | ✅ | | | |
| House edge math | ✅ | | | |
| Health check | | ✅ | | ✅ |
| Player auth/profile | | ✅ | | |
| Wager history | | ✅ | ✅ | |
| Operator metrics/config | | ✅ | ✅ | |
| JWT role enforcement | | ✅ | | |
| Wheel auth & limits | | ✅ | | |
| Server settlement | | ✅ | ✅ | |
| Wheel preview | | | ✅ | |
| Concurrent spins | | | ✅ | ✅ |
| Operator RTP patch | | | ✅ | |
