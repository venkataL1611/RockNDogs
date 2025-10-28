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