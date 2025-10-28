# RockNDogs Setup Guide (Any System)

This guide shows two supported ways to run the project. Pick ONE at a time.

- Path A: Kubernetes (minikube + ArgoCD) — recommended for full-stack parity
- Path B: Docker Compose — quickest local-only

Both paths include: running the app, seeding data, accessing UIs, and running tests.

---

## Prerequisites

- Node.js 18.x and npm
- Git

Path A (Kubernetes):

- Docker
- kubectl
- minikube
- ArgoCD CLI (optional)

Path B (Compose):

- Docker with Compose

---

## Path A — Kubernetes (minikube + ArgoCD)

1. Start minikube

```bash
minikube start --memory=4096 --cpus=2
```

2. Apply manifests (if not already deployed via ArgoCD)

```bash
kubectl apply -f k8s/ -n rockndogs --recursive || true
```

3. ArgoCD access (port-forward)

```bash
nohup kubectl port-forward -n argocd svc/argocd-server 8080:443 > /tmp/argocd-pf.log 2>&1 &
# Open https://localhost:8080  (admin / your saved password)
```

4. App + dependencies access (port-forward)

```bash
# Start all port-forwards (app, mongodb, elasticsearch, redis, argocd)
bash scripts/port-forward-start.sh
# App: http://localhost:3000
# MongoDB (Compass): mongodb://localhost:27017
# Elasticsearch: http://localhost:9200
# Redis: localhost:6379
```

5. Seed data (optional, if not using included dataset)

```bash
kubectl exec -n rockndogs deploy/rockndogs-app -- node seed/restore-database.js
kubectl exec -n rockndogs deploy/rockndogs-app -- node ElasticSearch/reindex.js
```

6. Post-deploy smoke tests (automated)

- A Job `rockndogs-smoke-test` runs after each ArgoCD sync.
- It hits `/home`, `/shop/dogfoods`, searches for `victor`, and signs up/logs in a throwaway user.

7. Run tests locally

```bash
npm ci
npm run test:unit
npm run test:e2e
```

8. Stop port-forwards

```bash
bash scripts/port-forward-stop.sh
```

Note: Do not run Docker Compose at the same time as port-forwards; ports will collide.

---

## Path B — Docker Compose (local-only)

1. Start services

```bash
docker compose up -d
```

- App not included in Compose (run with `npm start` or via k8s). Compose provides MongoDB, ES, Redis for local dev/testing.

2. Seed test data (uses local services)

```bash
node tests/seed-test-data.js
node tests/seed-user.js
```

3. Run tests

```bash
npm ci
npm run test:unit
npm run test:e2e
```

4. Access UIs

- MongoDB (Compass): mongodb://localhost:27017
- Elasticsearch: http://localhost:9200
- Redis: localhost:6379

5. Stop services

```bash
docker compose down
```

---

## Switching Between Environments

- Use Compose OR minikube, not both.
- To switch to Kubernetes: `docker compose down` then `bash scripts/port-forward-start.sh`.
- To switch to Compose: `bash scripts/port-forward-stop.sh` then `docker compose up -d`.

Tests and scripts read environment variables:

- `MONGODB_URI` (default for tests: mongodb://localhost:27017/shopping_test)
- `ELASTICSEARCH_URL` (default http://localhost:9200)
- `REDIS_HOST`, `REDIS_PORT` (default localhost, 6379)
- `TEST_URL` (default http://localhost:3000)

---

## Common Tasks

- Start all k8s port-forwards:

```bash
make k8s-pf-start
```

- Stop all port-forwards:

```bash
make k8s-pf-stop
```

- Start Compose services:

```bash
make compose-up
```

- Stop Compose services:

```bash
make compose-down
```

- Run tests:

```bash
make test
```

- Seed user and products:

```bash
make seed-user
make seed-test
```

---

## Troubleshooting

- Ports busy: Stop Compose when using k8s (`docker compose down`). Stop port-forwards when using Compose.
- ArgoCD UI shows pending: ensure port-forward is running, or patch Service to LoadBalancer and run `minikube tunnel`.
- E2E tests flaky: Ensure app reachable at TEST_URL. Increase wait times or rerun.
- ES index empty: Run `node ElasticSearch/reindex.js` inside the app pod.
