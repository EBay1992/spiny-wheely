# @spiny-wheely/frontend

React player client for the spinyWheely wheel game. Presentation and animation only — all outcomes and balances are **server-authoritative**.

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 19 |
| Build | Vite |
| State | Zustand |
| Styling | styled-components |
| Real-time | socket.io-client |

## Quick start

```bash
docker compose up -d
npm install
cp backend/.env.example backend/.env
npm run migration:run
npm run dev              # API + client from repo root
```

Frontend only: `npm run dev:web` → http://localhost:5173

## Routes

| Path | Role | Description |
|------|------|-------------|
| `/login` | — | Player or operator sign-in |
| `/play` | Player | Wheel game |
| `/dashboard` | Player | Account, game info, wager history |
| `/admin` | Operator | Metrics and game configuration |

## Environment

See [`.env.example`](.env.example).

| Variable | When | Description |
|----------|------|-------------|
| `VITE_API_URL` | Cross-origin only | API origin (e.g. `https://spinywheely.fly.dev`) |
| `VITE_USE_REMOTE_API` | Local dev only | Set `true` to use `VITE_API_URL` instead of Vite proxy |

| Environment | `VITE_API_URL` | Result |
|-------------|----------------|--------|
| `npm run dev` | empty | Vite proxy → `localhost:3000` |
| `npm run dev` + `VITE_USE_REMOTE_API=true` | remote URL | Hits remote API (e.g. Fly) |
| Fly production | empty | Same origin — nginx proxies API |

## Project layout

```
src/
├── features/wheel/       # Wheel UI, bet panel, animations
├── features/auth/        # Login
├── features/player/      # Dashboard
├── features/admin/       # Operator console
├── features/errors/      # 404, unauthorized, error boundary
├── core/network/         # api.ts, socket.ts, config.ts
├── core/store/           # playerStore (Zustand)
└── shared/               # Styles, wager validation utils
```

## How it connects

### Development

Vite proxies (`vite.config.ts`): `/health`, `/player/*`, `/admin/auth|metrics|games`, `/socket.io` → `localhost:3000`. Wheel socket URL: `/wheel`.

### Production

`getApiUrl()` in `core/network/config.ts` resolves REST and WebSocket targets. Empty string = same origin (Fly or nginx).

## Scripts

```bash
npm run dev      # :5173
npm run build    # → dist/
npm run preview
npm run lint
```

Production build is bundled into `deploy/fly/Dockerfile` (API + static UI in one image).

## Architecture

[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) · [backend/README.md](../backend/README.md)
