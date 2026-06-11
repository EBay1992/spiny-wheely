# Horizontal scaling (Kubernetes POC)

This repo supports running **multiple API replicas** behind a load balancer. WebSockets use the **Socket.IO Redis adapter** so wheel events work regardless of which pod handles the connection.

## Architecture

```
                    ┌─────────────┐
  Clients ─────────►│ LB / Ingress│
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │ API pod │    │ API pod │    │ API pod │
      └────┬────┘    └────┬────┘    └────┬────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
              ┌────────────────────────┐
              │ Redis (WS pub/sub)     │
              │ PostgreSQL (wallet)    │
              └────────────────────────┘
```

## Quick start — Docker Compose (local POC)

```bash
# Infra + 3 API replicas + nginx on :8080
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d --build --scale api=3

# Run DB migrations (first time)
docker compose -f docker-compose.yml -f docker-compose.scale.yml --profile migrate run --rm migrate

# Verify replicas receive traffic
npm run scale:verify

# Load test through the LB
API_URL=http://localhost:8080 npm run test:load:smoke
```

`GET /health` returns `instanceId` (pod name in K8s, hostname in Docker) so you can confirm distribution.

## Quick start — Kubernetes

Requires a **running** cluster. `kubectl` alone is not enough — the API server must be up.

**Docker Desktop:** Settings → Kubernetes → **Enable Kubernetes** → Apply & Restart. Wait until status is **Running**.

```bash
kubectl cluster-info   # must succeed before deploy
npm run k8s:deploy

kubectl -n spinywheely port-forward svc/api 8080:80
npm run scale:verify
```

Optional ingress (nginx ingress controller):

```bash
kubectl apply -f deploy/kubernetes/ingress.yaml
# Add spinywheely.local → ingress IP to /etc/hosts
```

HPA scales API pods between **2–10** on CPU (70% target). Tune in `deploy/kubernetes/api-hpa.yaml`.

## Making it more potent

| Bottleneck | Symptom | Mitigation |
|------------|---------|------------|
| **Single wallet lock** | Many spins on one player serialize | Load test uses a **player pool** (1 wallet per worker); production needs many players or async settlement queue |
| **DB connections** | `too many connections` at scale | `DATABASE_POOL_MAX` per pod; add **PgBouncer**; `max_connections` on Postgres |
| **CPU on RNG/settlement** | High p99 on wheel | More API replicas + HPA; profile hot paths |
| **Postgres write throughput** | Wallet updates lag | Partition bet history; read replicas for reports only |
| **Redis** | WS fan-out delays | Redis Cluster / dedicated node; monitor memory |

### Recommended production path

1. **Managed Postgres + Redis** (RDS, Cloud SQL, ElastiCache) instead of in-cluster DB for real traffic.
2. **PgBouncer** between API and Postgres (`pool_mode=transaction`).
3. **BullMQ** (or similar) per-player spin queue if one whale hammers the same wallet.
4. **HPA** on custom metrics (RPS, queue depth) not just CPU.
5. **Separate WS and HTTP** only if HTTP admin traffic competes with game sockets (usually not needed first).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_POOL_MAX` | `10` | Postgres pool per API process |
| `INSTANCE_ID` | `HOSTNAME` | Shown in `/health` for LB verification |
| `REDIS_HOST` / `REDIS_PORT` | required | Socket.IO adapter + cache |

## Files

| Path | Role |
|------|------|
| `backend/src/redis/redis-io.adapter.ts` | Multi-instance WebSocket |
| `docker-compose.scale.yml` | 3× API + nginx |
| `deploy/kubernetes/` | K8s manifests + HPA |
| `tests/load/verify-replicas.mjs` | Replica distribution check |
| `deploy/k8s-deploy.sh` | Kubernetes deploy automation |
