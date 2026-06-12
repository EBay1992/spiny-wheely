# spinyWheely Test Suite

## Structure

```
tests/
├── unit/           # Pure logic — no API
├── api/            # HTTP contract tests
├── e2e/            # WebSocket + wallet flows
├── load/           # Concurrency benchmarks
├── helpers/        # Clients, config
└── setup/          # API bootstrap (Docker + migrations)
```

## Prerequisites

| Suite | Requires |
|-------|----------|
| `test:unit` | Nothing |
| `test`, `test:api`, `test:e2e` | Docker Desktop running (Postgres + Redis); runner starts API if not running |

## Commands

```bash
npm run test:unit          # 45 unit tests
npm run test:api           # REST endpoints
npm run test:e2e           # Wheel + operator flows
npm run test:integration   # api + e2e
npm run test               # All 68 tests
npm run test:load:smoke    # Quick load check
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_URL` | `http://localhost:3000` | Target API |
| `TEST_PLAYER_EMAIL` | `player@spinywheely.test` | Player login |
| `TEST_PLAYER_PASSWORD` | `player123` | Player password |
| `TEST_ADMIN_EMAIL` | `admin@spinywheely.test` | Operator login |
| `TEST_ADMIN_PASSWORD` | `admin123` | Operator password |

Load-test variables: see `tests/load/` and root `package.json` scripts.

## Coverage map

| Area | Unit | API | E2E | Load |
|------|------|-----|-----|------|
| Wheel RNG (3-tier) | ✅ | | ✅ | |
| Segment geometry | ✅ | | | |
| Redis connection options | ✅ | | | |
| API URL resolution | ✅ | | | |
| Wager limits | ✅ | | | |
| Wager validation (UI) | ✅ | | | |
| SpinDto validation | ✅ | | | |
| Wager history cursor | ✅ | | | |
| House edge / volatility | ✅ | | | |
| Health check | | ✅ | | ✅ |
| Player auth/profile/game-info | | ✅ | | |
| Operator metrics/config | | ✅ | ✅ | |
| JWT role enforcement | | ✅ | | |
| Wheel auth & limits | | ✅ | | |
| Server settlement | | ✅ | ✅ | |
| Wheel preview | | | ✅ | |
| Concurrent spins | | | ✅ | ✅ |
| Operator RTP patch | | | ✅ | |
