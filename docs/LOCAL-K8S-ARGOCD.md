# Local Kubernetes + ArgoCD Setup (minikube) for RockNDogs

This guide documents all the commands we used to get RockNDogs running on a local Kubernetes cluster with ArgoCD, plus handy verification and troubleshooting steps.

Tested on: macOS + Docker Desktop + minikube (Docker driver)

## Prerequisites

- Docker Desktop for Mac
- Homebrew
- kubectl (installed by Docker Desktop or via brew)
- minikube

Optional:
- jq (for pretty JSON)
- ArgoCD CLI (not required for this guide)

Install minikube if needed:

```zsh
brew install minikube
```

## 1) Start a local Kubernetes cluster (minikube)

```zsh
minikube start --driver=docker --memory=4096 --cpus=2
kubectl get nodes
```

Notes:
- Using the Docker driver on macOS means some commands (like `minikube service --url`) keep a terminal open; you can use `kubectl port-forward` instead.

## 2) Install ArgoCD

Create the ArgoCD namespace and install the core manifests:

```zsh
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for pods:

```zsh
kubectl get pods -n argocd
```

Get the initial admin password:

```zsh
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo
```

Port-forward the ArgoCD API/UI to your localhost:

```zsh
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open the UI at https://localhost:8080 and log in as:
- Username: `admin`
- Password: output from the command above

## 3) Create app namespace and apply base manifests (if needed)

We manage resources via GitOps, but ensure the app namespace exists:

```zsh
kubectl apply -f k8s/namespace.yaml
kubectl get ns rockndogs
```

## 4) Configure the ArgoCD Application (GitOps)

ArgoCD will watch your repository `k8s/` folder and sync resources:

```zsh
kubectl apply -f k8s/argocd-application.yaml
kubectl get applications -n argocd -o wide
```

- Status should become `Synced` + `Healthy` once all resources are up.
- If your repo is private, configure ArgoCD repo credentials via UI or CLI.

## 5) Build and load the Docker image into minikube

Build RockNDogs and load it into the minikube image cache:

```zsh
# From the repo root
docker build -t rockndogs:v7 .
minikube image load rockndogs:v7
```

Pin the deployment image (done in repo at `k8s/deployment.yaml`):

```yaml
# snippet
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: rockndogs
        image: rockndogs:v7
        imagePullPolicy: IfNotPresent
```

Commit and push so ArgoCD syncs:

```zsh
git add k8s/deployment.yaml
git commit -m "Pin app image to rockndogs:v7 and keep replicas=1"
git push origin main
```

Optionally update live image without committing (for quick tests):

```zsh
kubectl set image deployment/rockndogs-app rockndogs=rockndogs:v7 -n rockndogs
```

## 6) Config and secrets

We use a ConfigMap and Secret for app settings:

```zsh
kubectl get configmap rockndogs-config -n rockndogs -o yaml
kubectl get secret rockndogs-secrets -n rockndogs -o yaml
```

Expect these env vars (from `k8s/configmap.yaml`):
- `MONGODB_URI=mongodb://mongodb:27017/shopping`
- `ELASTICSEARCH_URL=http://elasticsearch:9200`
- `REDIS_HOST=redis`, `REDIS_PORT=6379`
- `NODE_ENV=production`, `PORT=3000`

## 7) Verify pods and logs

```zsh
kubectl get pods -n rockndogs -o wide
kubectl logs -n rockndogs deploy/rockndogs-app --tail=100
kubectl get rs -n rockndogs -l app=rockndogs
kubectl rollout status deployment/rockndogs-app -n rockndogs
```

Useful deployment snapshot with jq:

```zsh
kubectl get deploy -n rockndogs rockndogs-app -o json | \
  jq '{replicas: .spec.replicas, readyReplicas: .status.readyReplicas, updatedReplicas: .status.updatedReplicas, availableReplicas: .status.availableReplicas, observedGeneration: .status.observedGeneration}'
```

## 8) Access the RockNDogs service

---

## Understanding Kubernetes Networking (The Confusing Parts Explained)

### The Problem: Why Can't I Just Visit an IP?

When you run an app on your laptop normally, you visit `http://localhost:3000`. Easy.

But Kubernetes runs containers in a **separate network inside Docker**. Think of it like this:

```
Your Mac (192.168.1.100)
  |
  └─> Docker Network
        |
        └─> minikube VM (192.168.49.2)
              |
              └─> Kubernetes Cluster Network (10.x.x.x)
                    |
                    ├─> Pod: elasticsearch (10.244.0.11)
                    ├─> Pod: mongodb (10.244.0.10)
                    ├─> Pod: redis (10.244.0.12)
                    └─> Pod: rockndogs-app (10.244.0.28)
```

**Problem**: Your Mac browser can't directly reach 10.244.0.28 (the pod IP) because it's inside the Docker/Kubernetes network.

---

### Solution 1: Kubernetes Services (Internal DNS)

Kubernetes creates a **Service** which gives pods a stable DNS name:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: rockndogs-service
spec:
  selector:
    app: rockndogs
  ports:
  - port: 80          # Service listens on port 80
    targetPort: 3000  # Forwards to pod's port 3000
```

Now pods **inside the cluster** can talk to each other using DNS:
- `http://elasticsearch:9200` ✅
- `http://mongodb:27017` ✅
- `http://rockndogs-service:80` ✅

But your Mac browser still can't reach these! They're only accessible **inside** the cluster.

---

### Solution 2: Exposing Services to Your Mac

Kubernetes has 3 ways to expose services:

#### Option A: ClusterIP (Default - Internal Only)
```yaml
spec:
  type: ClusterIP  # Only reachable inside cluster
```
- ❌ Can't access from Mac browser
- ✅ Pods can talk to each other

#### Option B: NodePort (Expose on minikube Node)
```yaml
spec:
  type: NodePort  # Exposes on a high port (30000-32767)
```
- Service gets exposed on: `<minikube-ip>:<random-high-port>`
- Example: `192.168.49.2:30736`
- ❌ **Problem**: `192.168.49.2` is inside Docker, not reachable from Mac browser!

#### Option C: LoadBalancer (Needs External Tool)
```yaml
spec:
  type: LoadBalancer  # Requests an external IP
```
- On AWS/GCP/Azure: Creates a real load balancer with public IP ✅
- On minikube: Status stays `<pending>` unless you run `minikube tunnel` ⚠️

---

### Solution 3: Tunneling to Your Mac

Since the cluster is inside Docker, we need a **tunnel** to forward traffic from your Mac to the cluster.

#### Method 1: kubectl port-forward ⭐ **RECOMMENDED**

Forward a local port on your Mac to the service:

```zsh
kubectl port-forward -n rockndogs svc/rockndogs-service 3000:80
```

What this does:
```
Your Mac browser (localhost:3000)
       ↓
kubectl port-forward creates a tunnel
       ↓
Kubernetes Service (rockndogs-service:80)
       ↓
Pod (rockndogs-app:3000)
```

- ✅ Simple: Just one command
- ✅ No sudo needed
- ✅ Works immediately
- ❌ Terminal must stay open
- **Your URL**: `http://localhost:3000` ⭐

**To run in background:**
```zsh
kubectl port-forward -n rockndogs svc/rockndogs-service 3000:80 > /tmp/port-forward.log 2>&1 &
```

**To stop:**
```zsh
# Find the process
ps aux | grep "[k]ubectl port-forward"
# Kill it
kill <PID>
```

---

#### Method 2: minikube service --url

```zsh
minikube service rockndogs-service -n rockndogs --url
```

This creates a similar tunnel but:
- ❌ Terminal must stay open with this exact command running
- ❌ Gives you a random port each time
- ✅ Shows you the URL to copy

Output:
```
http://127.0.0.1:54321
❗ Because you are using a Docker driver on darwin, the terminal needs to be open to run it.
```

---

#### Method 3: minikube tunnel (For LoadBalancer Services)

If your service type is `LoadBalancer`, you need `minikube tunnel`:

```zsh
minikube tunnel
```

What this does:
- Runs as a background process
- Assigns `127.0.0.1` as EXTERNAL-IP for LoadBalancer services
- ⚠️ Requires **sudo password** if service uses privileged ports (80, 443)
- ❌ More complex than port-forward

Check if it worked:
```zsh
kubectl get svc -n rockndogs
# Should show EXTERNAL-IP: 127.0.0.1
```

Then visit: `http://127.0.0.1` (port 80) or `http://127.0.0.1:80`

**Caveats:**
- Requires sudo for port 80
- Must keep running in background
- Can conflict with other services on port 80

---

### Summary: Which Method Should I Use?

| Method | When to Use | Pros | Cons |
|--------|-------------|------|------|
| **kubectl port-forward** ⭐ | Local development, testing | Simple, no sudo, stable URL | Terminal must stay open |
| **minikube service --url** | Quick one-time test | Auto-detects service | Random port, terminal must stay open |
| **minikube tunnel** | Using LoadBalancer type | Closest to production setup | Requires sudo, complex |

**For RockNDogs, we use port-forward:**

```zsh
# Start in background
kubectl port-forward -n rockndogs svc/rockndogs-service 3000:80 > /tmp/port-forward.log 2>&1 &

# Access at:
# http://localhost:3000
```

---

### Quick Troubleshooting

**Can't connect to localhost:3000?**

1. Check if port-forward is running:
```zsh
ps aux | grep "[k]ubectl port-forward"
```

2. Check if port 3000 is in use:
```zsh
lsof -i :3000
```

3. Restart port-forward:
```zsh
# Kill existing
pkill -f "kubectl port-forward.*rockndogs-service"

# Start fresh
kubectl port-forward -n rockndogs svc/rockndogs-service 3000:80 > /tmp/port-forward.log 2>&1 &
```

4. Check port-forward logs:
```zsh
tail -f /tmp/port-forward.log
```

**Service shows "connection refused"?**

Check if pods are running:
```zsh
kubectl get pods -n rockndogs
# Should show READY 1/1, STATUS Running
```

Check pod logs:
```zsh
kubectl logs -n rockndogs -l app=rockndogs --tail=50
```

---

NodePort service info:

```zsh
kubectl get svc -n rockndogs rockndogs-service -o wide
kubectl get svc -n rockndogs rockndogs-service -o jsonpath='{.spec.ports[0].nodePort}'
minikube ip
```

Two ways to reach the app:

- Port-forward (simple):

```zsh
kubectl port-forward svc/rockndogs-service -n rockndogs 8080:80
# Visit http://localhost:8080
```

- Minikube service URL (requires keeping terminal open on Docker driver):

```zsh
minikube service rockndogs-service -n rockndogs --url
```

In-cluster curl test (verifies Service works from a pod):

```zsh
kubectl run -n rockndogs curl-app --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s -o /dev/null -w "%{http_code}\n" http://rockndogs-service
# Expect 200 or 302 depending on route
```

## 9) Verify dependencies are reachable (from cluster)

Elasticsearch:

```zsh
kubectl run -n rockndogs curl-es --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl -v http://elasticsearch:9200
```

MongoDB TCP check (optional image with busybox or netcat):

```zsh
kubectl run -n rockndogs ncat --image=busybox:latest --rm -it --restart=Never -- \
  sh -c 'nc -zv mongodb 27017'
```

Redis TCP check:

```zsh
kubectl run -n rockndogs ncat2 --image=busybox:latest --rm -it --restart=Never -- \
  sh -c 'nc -zv redis 6379'
```

## 10) Seeding data and indexing Elasticsearch

Exec into the app pod or run seeders directly (adjust filenames as needed):

```zsh
# List pods to get the app pod name
kubectl get pods -n rockndogs -l app=rockndogs

# Exec and run seeders
APP_POD=$(kubectl get pods -n rockndogs -l app=rockndogs -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it -n rockndogs $APP_POD -- sh -c 'node seed/category-seeder.js'
kubectl exec -it -n rockndogs $APP_POD -- sh -c 'node seed/product-seeder.js'
# Note: filename has a space in repo; consider renaming to remove space
kubectl exec -it -n rockndogs $APP_POD -- sh -c "node 'seed/supply-seeder .js'"
```

After seeding, mongoosastic should index documents into Elasticsearch. Verify indexes:

```zsh
kubectl run -n rockndogs curl-es2 --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl -s http://elasticsearch:9200/_cat/indices?v
```

## 11) ArgoCD status and sync

```zsh
kubectl get applications -n argocd -o wide
# If OutOfSync, sync via UI, or edit repo and push changes.
```

## 12) Troubleshooting snippets

CrashLoopBackOff investigation:

```zsh
kubectl logs -n rockndogs <pod-name> --tail=200
kubectl describe pod -n rockndogs <pod-name>

# Scale or update images quickly
kubectl set image deployment/rockndogs-app rockndogs=rockndogs:v7 -n rockndogs
kubectl scale deployment rockndogs-app -n rockndogs --replicas=1
kubectl rollout status deployment/rockndogs-app -n rockndogs

# Inspect and clean ReplicaSets (generally let ArgoCD/Deployments manage these)
kubectl get rs -n rockndogs -l app=rockndogs
kubectl delete rs -n rockndogs <replicaset-name>
```

ConfigMap and Secret checks:

```zsh
kubectl get configmap rockndogs-config -n rockndogs -o yaml
kubectl get secret rockndogs-secrets -n rockndogs -o yaml
```

ArgoCD UI access if port-forwarding stopped:

```zsh
kubectl port-forward svc/argocd-server -n argocd 8080:443
open https://localhost:8080
```

## 13) Cleanup

```zsh
# Stop port-forwards in their terminals first

# Remove namespaces
kubectl delete namespace rockndogs
kubectl delete namespace argocd

# Stop or delete the cluster
minikube stop
# Or remove completely
minikube delete
```

## Appendix: Quick reference of commands used in this project

- Cluster + ArgoCD
```zsh
minikube start --driver=docker --memory=4096 --cpus=2
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
kubectl port-forward svc/argocd-server -n argocd 8080:443
kubectl apply -f k8s/argocd-application.yaml
kubectl get applications -n argocd -o wide
```

- App + dependencies
```zsh
kubectl apply -f k8s/namespace.yaml
kubectl get ns rockndogs

# Build and load image
docker build -t rockndogs:v7 .
minikube image load rockndogs:v7

# Update image via GitOps or imperative set image
kubectl set image deployment/rockndogs-app rockndogs=rockndogs:v7 -n rockndogs

# Status
kubectl get pods -n rockndogs -o wide
kubectl logs -n rockndogs deploy/rockndogs-app --tail=100
kubectl get rs -n rockndogs -l app=rockndogs
kubectl rollout status deployment/rockndogs-app -n rockndogs
```

- Services and access
```zsh
kubectl get svc -n rockndogs rockndogs-service -o wide
kubectl get svc -n rockndogs rockndogs-service -o jsonpath='{.spec.ports[0].nodePort}'
minikube ip
kubectl port-forward svc/rockndogs-service -n rockndogs 8080:80
minikube service rockndogs-service -n rockndogs --url
```

- In-cluster tests
```zsh
kubectl run -n rockndogs curl-app --image=curlimages/curl:latest --rm -i --restart=Never -- curl -s -o /dev/null -w "%{http_code}\n" http://rockndogs-service
kubectl run -n rockndogs curl-es --image=curlimages/curl:latest --rm -it --restart=Never -- curl -v http://elasticsearch:9200
```

- Seeding + indexing
```zsh
APP_POD=$(kubectl get pods -n rockndogs -l app=rockndogs -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it -n rockndogs $APP_POD -- sh -c 'node seed/category-seeder.js'
kubectl exec -it -n rockndogs $APP_POD -- sh -c 'node seed/product-seeder.js'
kubectl exec -it -n rockndogs $APP_POD -- sh -c "node 'seed/supply-seeder .js'"
```

That’s it—you're set up with a local GitOps workflow using ArgoCD on minikube for RockNDogs.
