# CI/CD and GitOps Summary

## What Changed

This commit implements a fully automated CI/CD pipeline that connects GitHub Actions with ArgoCD for GitOps-based deployments.

### Before

- GitHub Actions ran quality gates (lint, test, security) on all branches
- Build and docker-build jobs only ran on `main` but saved artifacts without deploying
- Deployments to Kubernetes required manual image builds and manifest updates
- No connection between CI and ArgoCD

### After

- **PRs**: Same as before—lint, test, security only (no deployment)
- **Merges to main**: Automated deployment flow:
  1. Quality gates pass (lint, test, security)
  2. Docker image built and pushed to GHCR with SHA tag
  3. `k8s/deployment.yaml` automatically updated with new image
  4. ArgoCD detects change and syncs to cluster
  5. Zero-downtime rolling update

## Key Changes

### 1. Workflow Permissions (`.github/workflows/ci.yml`)

Added required permissions for GHCR and manifest updates:

```yaml
permissions:
  contents: write # Push manifest updates back to main
  packages: write # Push Docker images to GHCR
  pull-requests: read
```

### 2. Docker Build Job (`.github/workflows/ci.yml`)

Changed from building local images to pushing to GitHub Container Registry:

**Before:**

- Built image: `rocknDogs:${{ github.sha }}`
- Saved as artifact
- Not accessible to Kubernetes

**After:**

- Logs into GHCR with `GITHUB_TOKEN`
- Builds and pushes: `ghcr.io/venkataL1611/rockndogs:<short-sha>`
- Also tags `latest` on main branch
- Uses GitHub Actions cache for faster builds

### 3. New Job: update-manifest (`.github/workflows/ci.yml`)

Automatically updates Kubernetes manifests after docker-build:

**What it does:**

1. Checks out repo with write permissions
2. Updates `k8s/deployment.yaml` image tag to new SHA
3. Commits: `chore(deploy): update image to <sha> [skip ci]`
4. Pushes back to main

**Note:** `[skip ci]` prevents infinite loop

### 4. Documentation

Created comprehensive guides:

- `docs/CI-CD-GITOPS-FLOW.md`: Complete flow documentation, troubleshooting, best practices
- `docs/QUICK-START-VALIDATION.md`: Step-by-step validation checklist

## Image Tagging Strategy

### Production (GHCR)

- **SHA tags**: `ghcr.io/venkataL1611/rockndogs:a1b2c3d` (immutable, traceable)
- **Latest tag**: `ghcr.io/venkataL1611/rockndogs:latest` (only on main)

### Local Development (minikube)

- Local tags: `rockndogs:v10-local` (not pushed to GHCR)
- Built in minikube's Docker daemon: `eval $(minikube docker-env)`

## How It Works

```
Developer                 GitHub Actions              GHCR                 ArgoCD               Kubernetes
    |                           |                       |                     |                      |
    |-- Create PR ------------->|                       |                     |                      |
    |                           |-- Lint/Test --------->|                     |                      |
    |<-- PR Checks Pass --------|                       |                     |                      |
    |                           |                       |                     |                      |
    |-- Merge to main --------->|                       |                     |                      |
    |                           |-- Build Image ------->|                     |                      |
    |                           |                       |<-- Push ------------|                      |
    |                           |-- Update manifest --->|                     |                      |
    |                           |   (commit to main)    |                     |                      |
    |                           |                       |                     |-- Detect change ---->|
    |                           |                       |                     |<-- Pull image -------|
    |                           |                       |                     |-- Sync ------------->|
    |                           |                       |                     |                      |-- Rolling update
    |                           |                       |                     |<-- Healthy ----------|
```

## ArgoCD Configuration

The ArgoCD application watches `k8s/` on main:

```yaml
# k8s/argocd-application.yaml
spec:
  source:
    repoURL: https://github.com/venkataL1611/RockNDogs.git
    targetRevision: HEAD # tracks main
    path: k8s
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Auto-sync is enabled, so changes to `k8s/deployment.yaml` trigger immediate syncs.

## Validation Checklist

Before merging this to production, validate:

- [ ] GHCR is enabled for the repository
- [ ] Workflow has required permissions (contents: write, packages: write)
- [ ] ArgoCD is installed and application is created
- [ ] Test on a feature branch first (only lint/test should run)
- [ ] Test merge to main (full pipeline should run)
- [ ] Verify image pushed to GHCR
- [ ] Verify manifest updated with new SHA
- [ ] Verify no infinite CI loops (commit should include [skip ci])
- [ ] Verify ArgoCD syncs and deploys new image
- [ ] Test rollback procedure

See `docs/QUICK-START-VALIDATION.md` for detailed test steps.

## Rollback

If deployment fails:

**Option 1: Revert manifest commit**

```bash
git log -n 5 --oneline k8s/deployment.yaml
git revert <commit-sha>
git push origin main
```

**Option 2: kubectl rollback**

```bash
kubectl rollout undo deployment/rockndogs-app -n rockndogs
```

**Option 3: ArgoCD UI**

- History and Rollback → Select previous revision → Rollback

## Security Notes

- `GITHUB_TOKEN` is automatically provided by GitHub Actions
- GHCR packages are public by default (change in package settings if needed)
- For private images, add `imagePullSecrets` to deployment
- Manifest commits use `github-actions[bot]` identity

## Next Steps

1. **Test the pipeline:**
   - Create a test branch and PR
   - Merge to main and validate full flow
   - Check ArgoCD syncs correctly

2. **Monitor first deployments:**
   - Watch CI runs: https://github.com/venkataL1611/RockNDogs/actions
   - Watch ArgoCD: `kubectl port-forward svc/argocd-server -n argocd 8080:443`
   - Check pod rollout: `kubectl get pods -n rockndogs -l app=rockndogs -w`

3. **Future enhancements:**
   - Add deployment notifications (Slack, email)
   - Implement staging/production environments with approvals
   - Set up monitoring (Prometheus, Grafana)
   - Add image scanning in CI (Trivy, Snyk Container)
   - Consider semantic versioning in addition to SHA tags

## Resources

- Main documentation: `docs/CI-CD-GITOPS-FLOW.md`
- Validation guide: `docs/QUICK-START-VALIDATION.md`
- Local K8s setup: `docs/LOCAL-K8S-ARGOCD.md`
- GitHub Actions: https://docs.github.com/en/actions
- GHCR: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- ArgoCD: https://argo-cd.readthedocs.io/

## Breaking Changes

⚠️ **Important:** After this change:

1. **Local minikube workflows must use GHCR images** OR continue building local images with local tags
2. **Manual deployment is no longer needed**—merging to main triggers deployment
3. **Image tags in `k8s/deployment.yaml` will be auto-updated**—don't edit manually

For local testing, continue using:

```bash
eval $(minikube docker-env)
docker build -t rockndogs:local .
kubectl set image deployment/rockndogs-app rockndogs=rockndogs:local -n rockndogs
```

## Questions?

See troubleshooting sections in:

- `docs/CI-CD-GITOPS-FLOW.md` (comprehensive guide)
- `docs/QUICK-START-VALIDATION.md` (common issues)
