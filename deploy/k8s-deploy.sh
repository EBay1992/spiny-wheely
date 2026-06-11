#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${IMAGE:-spinywheely-api:latest}"
CLUSTER="${CLUSTER:-docker-desktop}"

require_cluster() {
  if ! command -v kubectl >/dev/null 2>&1; then
    echo "error: kubectl is not installed."
    exit 1
  fi

  if ! kubectl cluster-info >/dev/null 2>&1; then
    cat <<'EOF'

error: No Kubernetes cluster is reachable (connection refused on the API server).

Enable a local cluster first:

  Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & Restart
  Wait until the cluster status shows "Running", then re-run: npm run k8s:deploy

Alternatives:
  • minikube start
  • kind create cluster

Or skip Kubernetes and use the Docker Compose scale POC (no K8s required):

  npm run scale:up
  npm run scale:migrate
  npm run scale:verify

EOF
    exit 1
  fi

  echo "==> Cluster: $(kubectl config current-context 2>/dev/null || echo unknown)"
}

require_cluster

echo "==> Building API image: ${IMAGE}"
docker build -t "${IMAGE}" -f "${ROOT}/backend/Dockerfile" "${ROOT}"

if [[ "${CLUSTER}" == "kind" ]] && command -v kind >/dev/null 2>&1; then
  echo "==> Loading image into kind cluster"
  kind load docker-image "${IMAGE}"
fi

if [[ ! -f "${ROOT}/deploy/kubernetes/secret.yaml" ]]; then
  echo "==> Creating secret.yaml from example (edit for production)"
  cp "${ROOT}/deploy/kubernetes/secret.example.yaml" "${ROOT}/deploy/kubernetes/secret.yaml"
fi

echo "==> Applying secrets + Kubernetes manifests"
kubectl apply -f "${ROOT}/deploy/kubernetes/secret.yaml"
kubectl apply -k "${ROOT}/deploy/kubernetes"

echo "==> Waiting for postgres + redis"
kubectl -n spinywheely rollout status deployment/postgres --timeout=120s
kubectl -n spinywheely rollout status deployment/redis --timeout=120s

echo "==> Running migrations"
kubectl -n spinywheely delete job api-migrate --ignore-not-found
kubectl apply -f "${ROOT}/deploy/kubernetes/migrate-job.yaml"
kubectl -n spinywheely wait --for=condition=complete job/api-migrate --timeout=120s

echo "==> Rolling out API (3 replicas)"
kubectl -n spinywheely rollout status deployment/api --timeout=180s

echo ""
echo "Done. Port-forward: kubectl -n spinywheely port-forward svc/api 8080:80"
echo "Then: npm run scale:verify"
