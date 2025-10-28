# Quick Start: Validating the New CI/CD Flow

This guide helps you validate that the automated CI → GHCR → ArgoCD pipeline is working correctly.

## Pre-Validation Checklist

Before testing the new flow, ensure:

- [ ] GitHub Container Registry (GHCR) is enabled for your repository
- [ ] ArgoCD is installed and running in your Kubernetes cluster
- [ ] The ArgoCD application is created and syncing: `kubectl get applications -n argocd`
- [ ] You have write access to the main branch (or a test branch configured)

## Test 1: Validate Workflow Syntax (Local)

```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "✅ Valid"

# Verify workflow changes
git diff main .github/workflows/ci.yml
```

**Expected:** No syntax errors; see updated docker-build and new update-manifest jobs.

## Test 2: Trigger CI on a Feature Branch (PR Flow)

This tests that PRs still work correctly (no deployment happens).

```bash
# Create a test branch
git checkout -b test/ci-validation

# Make a trivial change
echo "# Test CI" >> README.md
git add README.md
git commit -m "test: validate CI pipeline"
git push -u origin test/ci-validation
```

**Then:**

1. Open a PR on GitHub: test/ci-validation → main
2. Watch GitHub Actions run

**Expected Results:**

- ✅ lint job runs and passes
- ✅ test job runs and passes
- ✅ security job runs
- ❌ docker-build job **skipped** (only runs on main)
- ❌ update-manifest job **skipped** (only runs on main)

**Status check:** https://github.com/venkataL1611/RockNDogs/actions

## Test 3: Merge to Main (Full Pipeline)

This tests the complete CI → GHCR → manifest update flow.

```bash
# Merge the PR via GitHub UI, or:
git checkout main
git pull origin main
git merge test/ci-validation
git push origin main
```

**Watch the pipeline:**

1. Go to Actions: https://github.com/venkataL1611/RockNDogs/actions
2. Find the latest "CI/CD Pipeline" run

**Expected Results:**

- ✅ lint, test, security pass
- ✅ docker-build runs:
  - Logs into GHCR
  - Builds Docker image
  - Tags with short SHA (e.g., `a1b2c3d`) and `latest`
  - Pushes to `ghcr.io/venkataL1611/rockndogs`
- ✅ update-manifest runs:
  - Updates `k8s/deployment.yaml` with new image tag
  - Commits: `chore(deploy): update image to <sha> [skip ci]`
  - Pushes back to main
- ✅ deploy-staging runs (placeholder, simulates deployment)

**Verification Steps:**

1. Check GHCR for new image:

   ```bash
   # Via web: https://github.com/venkataL1611?tab=packages
   # Or via Docker:
   docker pull ghcr.io/venkataL1611/rockndogs:latest
   docker images | grep rockndogs
   ```

2. Check manifest was updated:

   ```bash
   git pull origin main
   git log -n 3 --oneline k8s/deployment.yaml
   # Should see: chore(deploy): update image to <sha> [skip ci]

   # View current image tag
   grep "image:" k8s/deployment.yaml
   # Should show: ghcr.io/venkataL1611/rockndogs:<short-sha>
   ```

3. Confirm no infinite loop:
   ```bash
   # The manifest commit should NOT trigger another CI run
   # Check recent workflow runs; should only see one for your merge
   gh run list --limit 5
   ```

## Test 4: ArgoCD Auto-Sync

This tests that ArgoCD picks up the manifest change and deploys to Kubernetes.

**Prerequisites:**

- Kubernetes cluster running (minikube or other)
- ArgoCD installed and application created
- Port-forward to ArgoCD UI:
  ```bash
  kubectl port-forward svc/argocd-server -n argocd 8080:443 &
  ```

**Steps:**

1. Check ArgoCD status before sync:

   ```bash
   kubectl get application rockndogs -n argocd
   # Note the current sync revision and status
   ```

2. Wait for ArgoCD to detect the change (polls every 3 min by default), or force sync:

   ```bash
   # Force sync via CLI
   kubectl patch application rockndogs -n argocd \
     --type merge -p '{"operation":{"sync":{}}}'

   # Or via UI: https://localhost:8080 → rockndogs → Sync button
   ```

3. Watch the sync progress:

   ```bash
   watch kubectl get pods -n rockndogs -l app=rockndogs
   # Should see rolling update: new pods created, old terminated
   ```

4. Check deployment image:

   ```bash
   kubectl get deployment rockndogs-app -n rockndogs \
     -o jsonpath='{.spec.template.spec.containers[0].image}'
   # Should show: ghcr.io/venkataL1611/rockndogs:<short-sha>
   ```

5. Verify pods are running new image:
   ```bash
   kubectl get pods -n rockndogs -l app=rockndogs -o wide
   kubectl describe pod -n rockndogs <pod-name> | grep Image:
   ```

**Expected Results:**

- ArgoCD status: **Synced + Healthy**
- Pods running with new GHCR image tag
- Zero downtime during rolling update

## Test 5: Image Pull from GHCR

This verifies the cluster can pull images from GHCR (important if repo is private).

```bash
# Try pulling the image manually
SHORT_SHA=$(grep "image:" k8s/deployment.yaml | awk -F: '{print $NF}' | tr -d ' ')
docker pull ghcr.io/venkataL1611/rockndogs:${SHORT_SHA}
```

**If pull fails:**

- Check package visibility: https://github.com/venkataL1611?tab=packages → rockndogs → Settings
- For private packages, add imagePullSecrets to deployment:

  ```bash
  kubectl create secret docker-registry ghcr-secret \
    --docker-server=ghcr.io \
    --docker-username=venkataL1611 \
    --docker-password=<github-token> \
    -n rockndogs

  # Update deployment to use secret
  kubectl patch deployment rockndogs-app -n rockndogs \
    -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"ghcr-secret"}]}}}}'
  ```

## Test 6: Rollback Scenario

This tests the rollback process if a deployment has issues.

```bash
# View deployment history
kubectl rollout history deployment/rockndogs-app -n rockndogs

# Rollback to previous version
kubectl rollout undo deployment/rockndogs-app -n rockndogs

# Check status
kubectl rollout status deployment/rockndogs-app -n rockndogs

# Verify pods are running old image
kubectl get pods -n rockndogs -l app=rockndogs -o jsonpath='{.items[*].spec.containers[0].image}'
```

**Note:** This creates drift between Git and cluster. To reconcile:

```bash
# Get the image SHA from the previous commit
git log -n 5 --oneline k8s/deployment.yaml

# Update manifest to match running version, or
# Re-sync ArgoCD to restore Git state
```

## Test 7: Manual Workflow Dispatch

This tests triggering deployments manually without a PR.

**Steps:**

1. Go to: https://github.com/venkataL1611/RockNDogs/actions
2. Click **CI/CD Pipeline** workflow
3. Click **Run workflow** dropdown
4. Select branch: `main`
5. Click **Run workflow** button

**Expected:** All jobs run (lint, test, security, docker-build, update-manifest, deploy-staging)

## Common Issues and Fixes

### Issue: docker-build fails with "denied: permission_denied"

**Cause:** Workflow doesn't have permission to push to GHCR.

**Fix:**

1. Check workflow permissions at top of `.github/workflows/ci.yml`:
   ```yaml
   permissions:
     contents: write
     packages: write
   ```
2. Check package settings: https://github.com/venkataL1611?tab=packages → rockndogs → Manage Actions access
3. Ensure "Actions" has write access

### Issue: update-manifest fails with "Permission denied"

**Cause:** Workflow can't push commits back to main.

**Fix:**

1. Verify `contents: write` permission in workflow
2. Check branch protection rules: Settings → Branches → main
3. If protected, ensure "Allow GitHub Actions to push" is enabled

### Issue: ArgoCD shows "ImagePullBackOff"

**Cause:** Kubernetes can't pull image from GHCR.

**Fix:**

1. Check image exists: `docker manifest inspect ghcr.io/venkataL1611/rockndogs:<sha>`
2. If package is private, create imagePullSecret (see Test 5 above)
3. Check pod events: `kubectl describe pod <pod-name> -n rockndogs`

### Issue: Infinite CI loop

**Cause:** Manifest commits trigger new CI runs.

**Fix:** Ensure commit message includes `[skip ci]`:

```bash
git commit -m "chore(deploy): update image to <sha> [skip ci]"
```

This is already configured in the workflow.

### Issue: ArgoCD not syncing

**Cause:** ArgoCD not detecting manifest changes.

**Fix:**

1. Check application status: `kubectl describe application rockndogs -n argocd`
2. Verify repoURL and path in `k8s/argocd-application.yaml`
3. Force refresh: UI → Refresh button, or `kubectl patch application rockndogs -n argocd --type merge -p '{"operation":{"sync":{}}}'`
4. Check ArgoCD logs: `kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server`

## Success Criteria

All tests pass when:

- ✅ PRs trigger lint/test/security only (no deployment)
- ✅ Merges to main build and push to GHCR
- ✅ Manifest is auto-updated with new image SHA
- ✅ Manifest commit includes `[skip ci]` and doesn't loop
- ✅ ArgoCD detects change and syncs to cluster
- ✅ Pods run with new GHCR image
- ✅ Rolling update completes with zero downtime
- ✅ Rollback works correctly

## Monitoring Commands

Keep these handy for ongoing monitoring:

```bash
# Watch CI runs
gh run list --workflow=ci.yml --limit 10

# Watch ArgoCD sync status
watch kubectl get application rockndogs -n argocd

# Watch pods during deployment
watch kubectl get pods -n rockndogs -l app=rockndogs

# View current deployed image
kubectl get deployment rockndogs-app -n rockndogs \
  -o jsonpath='{.spec.template.spec.containers[0].image}' && echo

# View GHCR packages
gh api /user/packages/container/rockndogs/versions --jq '.[].metadata.container.tags[]'
```

## Next Steps After Validation

Once all tests pass:

1. **Update documentation:**
   - Link to docs/CI-CD-GITOPS-FLOW.md in main README
   - Add deployment badges to README

2. **Set up notifications:**
   - Configure Slack/email alerts for failed deployments
   - Add deployment status webhooks

3. **Enhance monitoring:**
   - Set up Prometheus + Grafana for cluster metrics
   - Add health check endpoints to app

4. **Implement proper environments:**
   - Configure GitHub Environments for staging/production
   - Add manual approval gates for production
   - Use separate namespaces or clusters

5. **Security hardening:**
   - Enable image scanning (Trivy, Snyk Container)
   - Set up container signing (Sigstore/Cosign)
   - Configure private GHCR packages with proper secrets

6. **Developer experience:**
   - Add PR preview environments (optional)
   - Document local development workflow
   - Create helper scripts for common tasks

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GHCR Authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [ArgoCD Getting Started](https://argo-cd.readthedocs.io/en/stable/getting_started/)
- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
