# RockNDogs Kubernetes Runtime Guide

Complete guide for running the RockNDogs app in Kubernetes - locally via minikube and in CI/CD.

---

## ✅ Current Status

**App is running on Kubernetes!**

- ✅ All pods running (MongoDB, Elasticsearch, Redis, Kibana, RockNDogs app)
- ✅ Structured logging with Pino (JSON logs to stdout)
- ✅ Fluent Bit DaemonSet collecting logs
- ✅ ArgoCD configured for GitOps (watches main branch)
- ✅ Tests passing with proper logger configuration
- ✅ Multi-arch Docker images supported (amd64 + arm64)

---

## 🚀 Quick Start - Local Minikube

### 1. Start minikube cluster

```bash
minikube start --driver=docker --memory=4096 --cpus=2
```

### 2. Apply all Kubernetes resources

```bash
# Apply main app and dependencies
kubectl apply -k k8s

# Apply logging stack (separate namespace)
kubectl apply -f k8s/logging/fluent-bit.yaml
```

### 3. Check pods status

```bash
kubectl get pods -n rockndogs
kubectl get pods -n logging
```

Expected output:

```
NAME                             READY   STATUS    RESTARTS   AGE
elasticsearch-xxx                1/1     Running   0          1m
kibana-xxx                       1/1     Running   0          1m
mongodb-xxx                      1/1     Running   0          1m
redis-xxx                        1/1     Running   0          1m
rockndogs-app-xxx                1/1     Running   0          1m
```

### 4. Access the application

**Option A: Port-forward (recommended for local dev)**

```bash
kubectl port-forward -n rockndogs svc/rockndogs-service 3000:3000
# Visit http://localhost:3000
```

**Option B: minikube service**

```bash
minikube service rockndogs-service -n rockndogs --url
# Keep terminal open, visit the displayed URL
```

**Option C: Ingress (if nginx ingress is enabled)**

```bash
# Enable ingress addon
minikube addons enable ingress

# Map host to minikube IP
MINIKUBE_IP=$(minikube ip)
echo "$MINIKUBE_IP rockndogs.local" | sudo tee -a /etc/hosts

# Visit http://rockndogs.local
```

### 5. Check logs

```bash
# App logs
kubectl logs -n rockndogs deployment/rockndogs-app --tail=50

# Follow logs in real-time
kubectl logs -n rockndogs deployment/rockndogs-app -f

# Fluent Bit logs (log shipper)
kubectl logs -n logging daemonset/fluent-bit --tail=20
```

### 6. Seed test data (optional)

```bash
# Get app pod name
APP_POD=$(kubectl get pods -n rockndogs -l app=rockndogs -o jsonpath='{.items[0].metadata.name}')

# Run seeders
kubectl exec -n rockndogs $APP_POD -- node seed/category-seeder.js
kubectl exec -n rockndogs $APP_POD -- node seed/product-seeder.js
kubectl exec -n rockndogs $APP_POD -- sh -c "node 'seed/supply-seeder .js'"
```

### 7. Test login functionality

Test users already seeded:

- **Email:** `testuser@test.com` / **Password:** `password123`
- **Email:** `sairt106@gmail.com` / **Password:** (your password)
- **Email:** `smoke-user@rockndogs.com` / **Password:** `smoke123`

```bash
# Run login test script
bash scripts/test-k8s-login.sh
```

---

## 🔄 CI/CD Pipeline with GitHub Actions

### Pipeline Overview

The CI/CD pipeline runs on every push and consists of:

1. **Lint** - ESLint code quality check
2. **Test** - Unit and E2E tests with MongoDB/ES/Redis services
3. **Security** - npm audit + Snyk scan
4. **Build** - Create deployment tarball (main branch only)
5. **Docker Build** - Multi-arch image (amd64 + arm64) → GHCR
6. **Update Manifest** - Bump k8s/deployment.yaml image tag
7. **Deploy Staging** - Simulated (can be replaced with real deployment)
8. **Deploy Production** - Requires manual approval

### Key CI Features

✅ **Multi-arch Docker images** - Works on both Intel and ARM (M1/M2 Macs)
✅ **Automatic image tagging** - Short SHA + latest tag
✅ **GitOps manifest updates** - Auto-bumps deployment image in k8s/
✅ **Structured logging in tests** - Pino logger uses `silent` level in Jest
✅ **Service mocking** - MongoDB, Elasticsearch, Redis run as GitHub Actions services

### Test Configuration

The logger is configured to be silent during tests to avoid Jest issues:

```javascript
// lib/logger.js
if (
  process.env.NODE_ENV === "test" ||
  process.env.JEST_WORKER_ID !== undefined
) {
  return pino({
    level: "silent", // no output during tests
    base,
  });
}
```

### Running Tests Locally (Same as CI)

```bash
# Unit tests
NODE_ENV=test npm run test:unit

# E2E tests (requires services running)
docker-compose up -d mongodb elasticsearch redis
npm run test:e2e
```

### Viewing CI/CD Runs

```bash
# Go to GitHub Actions
https://github.com/venkataL1611/RockNDogs/actions

# Or check latest run status
gh run list --limit 5  # requires GitHub CLI
```

---

## 🎯 GitOps with ArgoCD

### ArgoCD Setup

ArgoCD watches the `main` branch (or HEAD) and automatically syncs changes to the cluster.

**ArgoCD Application:** `k8s/argocd-application.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: rockndogs
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/venkataL1611/RockNDogs.git
    targetRevision: HEAD # watches default branch
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: rockndogs
  syncPolicy:
    automated:
      prune: true # removes resources not in git
      selfHeal: true # reverts manual kubectl changes
```

### Install ArgoCD

```bash
# Create namespace and install
kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo

# Access ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Visit https://localhost:8080
# Username: admin
# Password: (from above command)
```

### Apply ArgoCD Application

```bash
kubectl apply -f k8s/argocd-application.yaml
kubectl get application -n argocd
```

### ArgoCD Workflow

1. **Developer pushes to `main`** → CI builds multi-arch image → pushes to GHCR
2. **CI updates `k8s/deployment.yaml`** → commits new image tag with `[skip ci]`
3. **ArgoCD detects change** → syncs new image to cluster
4. **Kubernetes rolls out** → creates new pods with updated image

### Manual Sync (if needed)

```bash
# Via kubectl
kubectl patch application rockndogs -n argocd \
  --type merge -p '{"operation":{"initiatedBy":{"username":"manual"},"sync":{}}}'

# Or via ArgoCD UI
# Click "Sync" → "Synchronize"
```

---

## 📊 Observability

### Logging (Pino + Fluent Bit + Elasticsearch + Kibana)

**Architecture:**

```
App (Pino) → stdout (JSON logs) → Fluent Bit → Elasticsearch → Kibana
```

**Accessing Logs:**

1. **Via kubectl:**

```bash
kubectl logs -n rockndogs deployment/rockndogs-app --tail=50
```

2. **Via Kibana (if deployed):**

```bash
kubectl port-forward -n rockndogs svc/kibana 5601:5601
# Visit http://localhost:5601
# Create index pattern: rockndogs-logs*
```

3. **Via Elasticsearch directly:**

```bash
kubectl port-forward -n rockndogs svc/elasticsearch 9200:9200

# Query recent logs
curl http://localhost:9200/rockndogs-logs-*/_search?size=10&sort=@timestamp:desc
```

### Distributed Tracing (Jaeger)

```bash
# If running via docker-compose locally
docker-compose up -d jaeger

# Access Jaeger UI
open http://localhost:16686
```

### Metrics & Health Checks

```bash
# Pod health
kubectl get pods -n rockndogs -o wide

# Deployment status
kubectl rollout status deployment/rockndogs-app -n rockndogs

# Resource usage
kubectl top pods -n rockndogs
```

---

## 🐛 Troubleshooting

### App Pod CrashLoopBackOff

```bash
# Check logs
kubectl logs -n rockndogs <pod-name> --tail=100

# Check events
kubectl describe pod -n rockndogs <pod-name>

# Common issues:
# - MongoDB not ready: wait for mongodb pod to be Running
# - Image pull error: check GHCR image exists and is public/accessible
# - Environment vars: check configmap and secret
```

### Login Not Working

1. **Check if users exist:**

```bash
APP_POD=$(kubectl get pods -n rockndogs -l app=rockndogs -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n rockndogs $APP_POD -- sh -c \
  "node -e \"const mongoose = require('mongoose'); \
  mongoose.connect('mongodb://mongodb:27017/shopping', { useNewUrlParser: true }); \
  const User = require('./models/user'); \
  setTimeout(async () => { \
    const users = await User.find({}, 'email name'); \
    console.log(JSON.stringify(users, null, 2)); \
    process.exit(0); \
  }, 2000);\""
```

2. **Check session configuration:**

```bash
kubectl get configmap -n rockndogs rockndogs-config -o yaml | grep SESSION
```

3. **Check app logs for authentication errors:**

```bash
kubectl logs -n rockndogs deployment/rockndogs-app | grep -i "login\|auth"
```

### Service Not Accessible

1. **Check service:**

```bash
kubectl get svc -n rockndogs rockndogs-service
# Should show port 3000 (or 80 if updated)
```

2. **Test from inside cluster:**

```bash
kubectl run -n rockndogs curl-test --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://rockndogs-service:3000
```

3. **Check endpoints:**

```bash
kubectl get endpoints -n rockndogs rockndogs-service
# Should list pod IPs
```

### ArgoCD Out of Sync

```bash
# Check application status
kubectl get application -n argocd rockndogs -o yaml

# Force sync
kubectl patch application rockndogs -n argocd \
  --type merge -p '{"operation":{"initiatedBy":{"username":"manual"},"sync":{}}}'

# Or disable auto-sync temporarily
kubectl patch application rockndogs -n argocd \
  --type merge -p '{"spec":{"syncPolicy":{"automated":null}}}'
```

### Image Pull Issues

```bash
# Check if image exists in GHCR
# Visit: https://github.com/venkataL1611?tab=packages

# For private images, create image pull secret
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token> \
  -n rockndogs

# Add to deployment (already has placeholder in k8s/deployment.yaml)
```

---

## 🧹 Cleanup

### Remove app from cluster

```bash
# Delete all rockndogs resources
kubectl delete -k k8s

# Delete logging stack
kubectl delete -f k8s/logging/fluent-bit.yaml

# Delete ArgoCD application
kubectl delete application rockndogs -n argocd
```

### Stop minikube

```bash
# Stop cluster (keeps state)
minikube stop

# Delete cluster (removes everything)
minikube delete
```

---

## 📚 Related Documentation

- [Local K8s + ArgoCD Setup](./LOCAL-K8S-ARGOCD.md) - Detailed minikube setup
- [CI/CD GitOps Flow](./CI-CD-GITOPS-FLOW.md) - Pipeline architecture
- [Fluent Bit Setup](./logging/FLUENT-BIT-SETUP.md) - Log shipping configuration
- [Tech Stack](./TECH-STACK-AND-CONCEPTS.md) - Architecture overview
- [Deployment Guide](./DEPLOYMENT.md) - All deployment strategies

---

## ✅ Quick Health Check

Run this to verify everything is working:

```bash
# Check all pods
kubectl get pods --all-namespaces | grep -E "rockndogs|logging"

# Test app accessibility
kubectl run -n rockndogs curl-test --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s -o /dev/null -w "HTTP %{http_code}\n" http://rockndogs-service:3000

# Check recent logs
kubectl logs -n rockndogs deployment/rockndogs-app --tail=10

echo "✅ All systems operational!"
```

---

**Happy Coding! 🎉**
