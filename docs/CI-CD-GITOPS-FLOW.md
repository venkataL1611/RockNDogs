# CI/CD and GitOps Flow

This guide documents how code moves from commit to running in Kubernetes using GitHub Actions, GHCR, and ArgoCD. It also includes rollback, validation, and troubleshooting steps.

## Overview

RockNDogs uses GitOps with GitHub Actions for CI/CD and ArgoCD for Kubernetes deployments:

- GitHub Actions: quality gates (lint, unit, E2E, security) on PRs; builds on main
- GitHub Container Registry (GHCR): stores multi-arch Docker images
- ArgoCD: watches `k8s/` on `main` and auto-syncs to the cluster

## Diagram (Mermaid)

```mermaid
flowchart LR
  A[Commit to main] --> B[GitHub Actions]
  B --> C[Build multi-arch image]
  C --> D[Push to GHCR\n ghcr.io/<owner_lc>/rockndogs:<short-sha>]
  D --> E[Update k8s/deployment.yaml]
  E --> F[Commit to main \n [skip ci]]
  F --> G[ArgoCD detects change]
  G --> H[Sync to cluster]
  H --> I[Kubernetes rolling update]
  I --> J[New pods Healthy]
```

## Detailed Workflow

### 1. Pull Request (feature/\* → main)

When you open a PR or push to any branch:

```yaml
Triggered by:
  - pull_request targeting main
```

**Jobs that run:**

- ✅ **lint**: ESLint checks code style
- ✅ **test**: Unit tests + E2E tests with MongoDB, Elasticsearch, Redis
- ✅ **security**: npm audit + Snyk scan

**Jobs that DON'T run:**

- ❌ **build**: Skipped (only runs on main)
- ❌ **docker-build**: Skipped (only runs on main)
- ❌ **update-manifest**: Skipped (only runs on main)
- ❌ **deploy-staging/production**: Skipped (only runs on main)

**Why?** PRs are for validation only. We don't deploy feature branches.

### 2. Merge to main

When a PR is merged to `main`:

```yaml
Triggered by:
  - push to main branch
```

**All jobs run in sequence:**

1. **lint, test, security** (same as PR, must pass)

2. **docker-build** (needs: lint, test, security)
   - Logs into GitHub Container Registry (GHCR)
   - Builds multi-arch Docker image (linux/amd64, linux/arm64)
   - Tags image with:
     - Short SHA: `ghcr.io/<owner_lower>/rockndogs:<7-char-sha>`
     - Latest: `ghcr.io/<owner_lower>/rockndogs:latest` (only on main)
   - Pushes to GHCR
   - Uses layer caching for fast builds

3. **update-manifest** (needs: docker-build)
   - Checks out repo with write permissions
   - Updates `k8s/deployment.yaml` image tag to the new SHA
   - Commits change with message: `chore(deploy): update image to <sha> [skip ci]`
   - Pushes commit back to main
   - **Note:** `[skip ci]` prevents infinite loop (the commit won't trigger another CI run)

4. **deploy-staging** (needs: build, docker-build)
   - Placeholder for future staging environment
   - Currently simulates deployment steps

5. **deploy-production** (needs: deploy-staging)
   - Placeholder for future production environment
   - Requires manual approval via GitHub Environments

### 3. ArgoCD auto-sync

ArgoCD is configured to watch the `k8s/` directory on `main`:

```yaml
# k8s/argocd-application.yaml
spec:
  source:
    repoURL: https://github.com/venkataL1611/RockNDogs.git
  targetRevision: main
    path: k8s

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**What happens:**

1. ArgoCD polls the repo every 3 minutes (default)
2. Detects the manifest change (new image tag)
3. Pulls the new image from GHCR
4. Applies the updated deployment
5. Kubernetes does a rolling update (zero downtime)
6. Health checks ensure new pods are ready before old ones terminate

**View sync status:**

```bash
kubectl get applications -n argocd -o wide
# Or via ArgoCD UI: https://localhost:8080
```

## Image tagging strategy

### Production (main branch)

Images are tagged with the **short Git SHA** (7 characters):

```
ghcr.io/<owner_lower>/rockndogs:a1b2c3d
ghcr.io/<owner_lower>/rockndogs:latest
```

**Why SHA?**

- Immutable: Same SHA = same code
- Traceable: Easy to find which commit is deployed
- No version bumping needed: Git SHA auto-increments

**k8s/deployment.yaml** always points to a specific SHA:

```yaml
spec:
  template:
    spec:
      containers:
        - name: rockndogs
          image: ghcr.io/<owner_lower>/rockndogs:a1b2c3d
          imagePullPolicy: IfNotPresent
```

### Local Development (minikube)

For local testing, build images directly in minikube's Docker daemon:

```bash
# Point Docker CLI to minikube
eval $(minikube docker-env)

# Build with a local tag
docker build -t rockndogs:v10-local .

# Update deployment manually (not committed)
kubectl set image deployment/rockndogs-app rockndogs=rockndogs:v10-local -n rockndogs
```

**Local tags are NOT pushed to GHCR.** They're only for minikube testing.

## Permissions

The workflow requires these GitHub token permissions:

```yaml
permissions:
  contents: write # Push manifest updates back to main
  packages: write # Push Docker images to GHCR
  pull-requests: read # Read PR info
```

The default `GITHUB_TOKEN` is automatically provided by GitHub Actions.

## Manual deployment (workflow_dispatch)

You can trigger a deployment manually from GitHub:

1. Go to: **Actions** → **CI/CD Pipeline** → **Run workflow**
2. Select branch: `main`
3. Click **Run workflow**

This bypasses the PR process and runs all jobs (build, push, update manifest).

**Use cases:**

- Hot-fix deployment
- Testing the pipeline
- Re-deploying after infrastructure changes

## Rollback

If a deployment has issues:

### Option 1: Revert the manifest commit

```bash
# Find the previous image SHA
git log -n 5 --oneline k8s/deployment.yaml

# Revert to previous commit
git revert <commit-sha>
git push origin main
```

ArgoCD will auto-sync to the old image.

### Option 2: Manual kubectl rollback

```bash
# View rollout history
kubectl rollout history deployment/rockndogs-app -n rockndogs

# Rollback to previous revision
kubectl rollout undo deployment/rockndogs-app -n rockndogs

# Or rollback to specific revision
kubectl rollout undo deployment/rockndogs-app -n rockndogs --to-revision=3
```

**Note:** This creates drift between Git and cluster. Reconcile by updating the manifest afterward.

### Option 3: Use ArgoCD UI

1. Open ArgoCD: https://localhost:8080
2. Select `rockndogs` app
3. Click **History and Rollback**
4. Select previous revision
5. Click **Rollback**

## Monitoring deployments

### Check CI/CD pipeline status

```bash
# Via GitHub CLI
gh run list --workflow=ci.yml --limit 5

# View specific run
gh run view <run-id>
```

Or visit: https://github.com/venkataL1611/RockNDogs/actions

### Check ArgoCD sync status

```bash
# Get application status
kubectl get applications -n argocd

# Detailed view
kubectl describe application rockndogs -n argocd

# Or use port-forward for UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Visit: https://localhost:8080
```

### Check deployment status

```bash
# Current deployment
kubectl get deployment rockndogs-app -n rockndogs -o wide

# Pod status
kubectl get pods -n rockndogs -l app=rockndogs

# Rollout status
kubectl rollout status deployment/rockndogs-app -n rockndogs

# View current image
kubectl get deployment rockndogs-app -n rockndogs -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### Check image in GHCR

Visit: https://github.com/venkataL1611?tab=packages

Or via CLI:

```bash
# List all tags
gh api /user/packages/container/rockndogs/versions

# Pull specific image
docker pull ghcr.io/venkataL1611/rockndogs:a1b2c3d
```

## Troubleshooting

### Build fails on main

**Symptom:** docker-build job fails with authentication error

**Solution:**

1. Ensure GHCR is enabled for the repository
2. Check package permissions: Settings → Packages → rockndogs → Manage Actions access
3. Verify workflow has `packages: write` permission

### Manifest update fails

**Symptom:** update-manifest job fails to push commit

**Solution:**

1. Check workflow has `contents: write` permission
2. Ensure main branch is not protected without allowing bot commits
3. Check commit message includes `[skip ci]` to avoid loops

### ArgoCD not syncing

**Symptom:** Manifest updated but cluster still shows old image

**Solution:**

```bash
# Check ArgoCD app status
kubectl get application rockndogs -n argocd -o yaml

# Look for sync errors
kubectl describe application rockndogs -n argocd

# Force sync via CLI
kubectl patch application rockndogs -n argocd \
  --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'

# Or via UI: Click "Sync" button
```

### Image pull fails in cluster

**Symptom:** Pods stuck in `ImagePullBackOff`

**Solution:**

1. Check image exists in GHCR:

   ```bash
   docker manifest inspect ghcr.io/venkataL1611/rockndogs:<sha>
   ```

2. GHCR packages are public by default. If private, add imagePullSecrets:

   ```bash
   # Create secret
   kubectl create secret docker-registry ghcr-secret \
     --docker-server=ghcr.io \
     --docker-username=<your-username> \
     --docker-password=<github-token> \
     -n rockndogs

   # Update deployment
   kubectl patch deployment rockndogs-app -n rockndogs \
     -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"ghcr-secret"}]}}}}'
   ```

### Infinite CI loop

**Symptom:** Every commit triggers another CI run

**Solution:** Ensure manifest commits include `[skip ci]` in the message. This is already configured in the workflow:

```bash
git commit -m "chore(deploy): update image to <sha> [skip ci]"
```

## Best practices

### Branch strategy

- **main**: Production branch, protected, requires PR reviews
- **develop**: Integration branch for features (optional)
- **feature/\***: Feature branches, merge to main via PR

### Commit conventions

Use conventional commits for clear history:

```
feat(cart): add session-based idempotency guard
fix(auth): resolve cookie security for HTTP
chore(deploy): update image to a1b2c3d [skip ci]
docs: update CI/CD flow documentation
```

### Environment variables

- **ConfigMap** (`k8s/configmap.yaml`): Non-sensitive config (URLs, feature flags)
- **Secret** (`k8s/secret.yaml`): Sensitive data (passwords, API keys)

Update these separately from the app image. ArgoCD will sync them.

### Testing Before Merge

Always test locally before opening a PR:

```bash
# Lint
npm run lint

# Unit tests
npm run test:unit

# Local cluster test (optional)
eval $(minikube docker-env)
docker build -t rockndogs:test .
kubectl set image deployment/rockndogs-app rockndogs=rockndogs:test -n rockndogs
```

### Deployment Windows

For production:

- Deploy during low-traffic hours
- Monitor metrics after deployment
- Keep previous image SHA handy for quick rollback

## Security Notes

- **GITHUB_TOKEN**: Automatically provided by GitHub Actions, scoped to the repository
- **GHCR Images**: Set to public visibility for easier access. For private images, configure imagePullSecrets
- **ArgoCD Password**: Stored in `argocd-initial-admin-secret`. Change it after first login
- **Secrets**: Never commit secrets to Git. Use GitHub Secrets or Kubernetes Secrets

## Next steps

- [ ] Add semantic versioning tags (in addition to SHA tags)
- [ ] Implement proper staging/production environments with manual approval
- [ ] Add deployment notifications (Slack, email)
- [ ] Set up monitoring dashboards (Prometheus, Grafana)
- [ ] Configure image scanning in CI (Trivy, Snyk Container)

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
