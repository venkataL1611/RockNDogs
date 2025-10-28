# GitHub Actions CI/CD: How It All Works Together

## TL;DR - The Connection

Your **local E2E script** (`npm run test:e2e:local`) replicates **exactly** what GitHub Actions does in CI. This ensures:

1. ✅ Tests pass locally → Tests pass in CI
2. ✅ Same test data → Same results
3. ✅ Same environment setup → No surprises

## The Full CI/CD Flow

### On Every Push/PR (Any Branch)

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes code or opens PR                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions: Quality Gates (MUST PASS)                  │
├─────────────────────────────────────────────────────────────┤
│  Job 1: lint                                                 │
│    - npm ci                                                  │
│    - npm run lint                                            │
│                                                              │
│  Job 2: test (runs in parallel with lint)                   │
│    - Start MongoDB, Elasticsearch, Redis (Docker services)  │
│    - npm ci                                                  │
│    - node tests/seed-test-data.js ← Seeds test DB          │
│    - npm run test:unit                                      │
│    - npm start & (background)                               │
│    - npx wait-on http://localhost:3000                      │
│    - npm run test:e2e ← Your E2E tests                     │
│    - npm run test:coverage                                  │
│                                                              │
│  Job 3: security (runs in parallel)                         │
│    - npm audit                                              │
│    - Snyk security scan                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ All passed?  │
              └──────┬───────┘
                     │
        ┌────────────┴────────────┐
        │ NO                      │ YES
        ▼                         ▼
  ❌ PR blocked            ✅ PR ready to merge
  Build fails              (if on main → continue)
  Cannot merge                     │
                                   │
        ┌──────────────────────────┘
        │ (Only on main branch)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions: Build & Deploy (main only)                 │
├─────────────────────────────────────────────────────────────┤
│  Job 4: build (needs: [lint, test, security])               │
│    - npm ci --production                                     │
│    - Create deployment package (.tar.gz)                    │
│    - Upload as artifact                                     │
│                                                              │
│  Job 5: docker-build (needs: [lint, test, security])        │
│    - Login to GHCR                                          │
│    - docker build -t ghcr.io/.../rockndogs:<sha>           │
│    - docker push to GHCR                                    │
│    - Tag as :latest                                         │
│                                                              │
│  Job 6: update-manifest (needs: [docker-build])             │
│    - Update k8s/deployment.yaml with new image SHA          │
│    - git commit + push to main [skip ci]                   │
│                                                              │
│  Job 7: deploy-staging (needs: [build, docker-build])       │
│    - Placeholder for future staging deployment              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ArgoCD (watches k8s/ folder on main)                       │
├─────────────────────────────────────────────────────────────┤
│    - Detects manifest change                                 │
│    - Pulls new image from GHCR                              │
│    - kubectl apply (rolling update)                         │
│    - Health checks                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              🚀 Deployed!
```

## How Your E2E Script Helps CI

### The Problem Before

When you ran `npm run test:e2e` locally:

```
❌ Database empty → Tests fail
❌ App not running → Tests fail
❌ Different from CI → Confusion
```

### The Solution Now

Your script (`scripts/run-e2e-tests.sh`) **mirrors exactly** what CI does:

| CI Step                             | Your Local Script         |
| ----------------------------------- | ------------------------- |
| `node tests/seed-test-data.js`      | ✅ Step 1: Seeds database |
| `npm start &`                       | ✅ Step 2: Starts app     |
| `npx wait-on http://localhost:3000` | ✅ Step 3: Waits for app  |
| `npm run test:e2e`                  | ✅ Step 4: Runs E2E tests |
| Kill processes                      | ✅ Cleanup: Kills app     |

**Result:** If tests pass locally with your script, they'll pass in CI!

## How to Ensure Successful Builds

### 1. Test Locally Before Pushing

```bash
# Step 1: Run linter
npm run lint

# Step 2: Run unit tests
npm run test:unit

# Step 3: Run E2E tests (using the new script)
npm run test:e2e:local

# All passed? Safe to push!
git push origin develop
```

### 2. Watch CI in GitHub Actions

After pushing, monitor the workflow:

**Go to:** https://github.com/venkataL1611/RockNDogs/actions

You'll see jobs running in real-time:

- ✅ lint (typically 30s)
- ✅ test (typically 2-3 min - includes E2E)
- ✅ security (typically 1 min)

**On PRs:** Only these 3 run (no deployment)
**On main:** All 7 jobs run (includes docker-build, update-manifest)

### 3. Understanding Job Dependencies

```
lint ─────────┐
              ├─→ build ──→ docker-build ──→ update-manifest ──→ deploy-staging
test ─────────┤
              │
security ─────┘
```

**Key point:** `build` and `docker-build` ONLY run if lint, test, and security pass.

### 4. Checking Build Status

#### Via GitHub UI

**Pull Request view:**

```
✅ All checks have passed
   lint / Lint Code
   test / Run Tests
   security / Security Audit
```

**Actions tab:**

```
✅ CI/CD Pipeline #42 - feat(ci): implement automated CI/CD
   ✅ lint (33s)
   ✅ test (2m 15s)
   ✅ security (1m 5s)
   ✅ build (45s)           ← Only on main
   ✅ docker-build (2m 10s) ← Only on main
   ✅ update-manifest (12s) ← Only on main
```

#### Via GitHub CLI

```bash
# List recent workflow runs
gh run list --workflow=ci.yml --limit 5

# View specific run details
gh run view <run-id>

# Watch a run in real-time
gh run watch
```

#### Via Commit Status API

```bash
# Check commit status
gh api repos/venkataL1611/RockNDogs/commits/<sha>/status
```

### 5. Common Build Failures and Fixes

#### ❌ Lint Job Fails

**Error:** ESLint violations

**Fix locally:**

```bash
npm run lint        # See errors
npm run lint:fix    # Auto-fix
git add .
git commit --amend
git push --force-with-lease
```

#### ❌ Test Job Fails (Unit Tests)

**Error:** Unit tests fail

**Fix locally:**

```bash
npm run test:unit
# Fix failing tests
git commit -am "fix: resolve unit test failures"
git push
```

#### ❌ Test Job Fails (E2E Tests)

**Error:** E2E tests fail (products not found, pages not loading, etc.)

**Fix locally:**

```bash
# Run with the same setup as CI
npm run test:e2e:local

# If it fails:
# 1. Check logs: tail -f /tmp/e2e-app.log
# 2. Verify test data: mongosh mongodb://localhost:27017/shopping_test
# 3. Check app is accessible: curl http://localhost:3000

# Fix issues and test again
git commit -am "fix: resolve E2E test failures"
git push
```

#### ❌ Docker Build Fails

**Error:** `denied: permission_denied` or image build fails

**Possible causes:**

1. GHCR permissions not set correctly
2. Dockerfile syntax error
3. Build context issues

**Fix:**

```bash
# Test Docker build locally
docker build -t rockndogs:test .

# If successful locally but fails in CI:
# - Check workflow permissions (contents: write, packages: write)
# - Verify GHCR package settings
```

#### ❌ Update Manifest Fails

**Error:** Cannot push to main

**Possible causes:**

1. Branch protection blocking bot commits
2. Missing permissions

**Fix:**

- Settings → Branches → main → Edit protection rules
- Enable: "Allow GitHub Actions to push"

### 6. Pre-Push Checklist (Recommended)

Create a local pre-push script:

```bash
#!/bin/bash
# scripts/pre-push-check.sh

echo "🔍 Pre-push quality checks..."

echo "1️⃣  Linting..."
npm run lint || exit 1

echo "2️⃣  Unit tests..."
npm run test:unit || exit 1

echo "3️⃣  E2E tests..."
npm run test:e2e:local || exit 1

echo "✅ All checks passed! Safe to push."
```

Make it executable and run before pushing:

```bash
chmod +x scripts/pre-push-check.sh
./scripts/pre-push-check.sh && git push
```

### 7. Setting Up Git Hooks (Optional)

Automate pre-push checks with Husky:

```bash
# Edit .husky/pre-push (create if doesn't exist)
npx husky add .husky/pre-push "npm run lint && npm run test:unit"
```

**Note:** E2E tests are excluded from pre-push hooks by default (too slow). Run manually before important pushes.

### 8. Monitoring Deployments

After CI passes on main:

#### Check Docker Image in GHCR

```bash
# Via web
open https://github.com/venkataL1611?tab=packages

# Via CLI
gh api /user/packages/container/rockndogs/versions | jq '.[0].metadata.container.tags'

# Via Docker
docker pull ghcr.io/venkataL1611/rockndogs:latest
```

#### Check Manifest Update

```bash
# Pull latest main
git pull origin main

# Check recent deployment commits
git log --oneline --grep="chore(deploy)" -n 5

# View current image in deployment
grep "image:" k8s/deployment.yaml
```

#### Check ArgoCD Sync

```bash
# Get application status
kubectl get application rockndogs -n argocd

# Detailed status
kubectl describe application rockndogs -n argocd

# Via UI
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
open https://localhost:8080
```

#### Check Pods Running New Image

```bash
# Watch rollout
kubectl rollout status deployment/rockndogs-app -n rockndogs

# Verify image
kubectl get pods -n rockndogs -o jsonpath='{.items[*].spec.containers[0].image}'
```

## Build Success Criteria

Your build is successful when:

### ✅ On Pull Requests

- Lint passes
- Unit tests pass
- E2E tests pass
- Security audit completes (can have warnings)

### ✅ On Main Branch (Post-Merge)

All of the above, PLUS:

- Docker image builds and pushes to GHCR
- `k8s/deployment.yaml` updates with new SHA
- Manifest commit doesn't trigger infinite loop
- ArgoCD syncs within ~3 minutes
- Pods roll out successfully
- Application is accessible

## Debugging Failed Builds

### View Detailed Logs

```bash
# Via GitHub CLI
gh run view <run-id> --log

# Download all logs
gh run download <run-id>

# View specific job logs
gh run view <run-id> --log --job=<job-id>
```

### Re-run Failed Jobs

**Via UI:**

- Actions → Click failed run → "Re-run jobs" → "Re-run failed jobs"

**Via CLI:**

```bash
gh run rerun <run-id> --failed
```

### Test Exact CI Environment Locally

Use Docker to replicate CI:

```bash
# Run in a clean Ubuntu container (like CI)
docker run -it --rm \
  -v $(pwd):/app \
  -w /app \
  node:18 \
  bash

# Inside container, run CI steps manually
npm ci
npm run lint
# ... etc
```

## Best Practices for Reliable Builds

1. **Always test locally first** with `npm run test:e2e:local`
2. **Keep dependencies updated** (npm audit, Dependabot)
3. **Use semantic commit messages** (helps identify what broke)
4. **Enable branch protection** (require status checks before merge)
5. **Monitor first deployments** after CI changes
6. **Keep CI fast** (parallel jobs, caching, minimal builds)
7. **Don't skip CI** (even for "small" changes)

## CI Performance Tips

Current typical times:

- lint: ~30s
- test: ~2-3min (includes E2E)
- security: ~1min
- docker-build: ~2min (with cache)
- update-manifest: ~15s

**Total PR time: ~3-4 minutes**
**Total main time: ~6-8 minutes** (includes deployment)

To speed up:

- ✅ Already using `npm ci` (faster than `npm install`)
- ✅ Already using Node cache (`cache: 'npm'`)
- ✅ Already using Docker buildx cache
- Consider: Split E2E into separate workflow (run nightly)
- Consider: Use matrix strategy for parallel test runs

## Summary

### The E2E Script's Value for CI

| Before                                         | After                           |
| ---------------------------------------------- | ------------------------------- |
| Tests fail in CI, pass locally (or vice versa) | ✅ Local = CI environment       |
| Hard to debug CI failures                      | ✅ Reproduce failures locally   |
| Slow feedback loop (push → wait → fail)        | ✅ Test before pushing          |
| Uncertain about test requirements              | ✅ Script documents exact steps |

### Your Workflow Now

```bash
# 1. Develop feature
git checkout -b feature/my-feature

# 2. Test locally (matches CI exactly)
npm run lint
npm run test:unit
npm run test:e2e:local

# 3. Push (confident it will pass CI)
git push -u origin feature/my-feature

# 4. Open PR
gh pr create

# 5. Watch CI (should pass on first try)
gh pr checks

# 6. Merge when approved
gh pr merge

# 7. Watch deployment (main only)
gh run watch
kubectl get application rockndogs -n argocd -w
```

### Quick Reference

```bash
# Local testing (before push)
npm run lint                 # Check code style
npm run test:unit            # Unit tests
npm run test:e2e:local      # E2E tests (matches CI)

# CI monitoring (after push)
gh run list                  # List recent runs
gh run watch                 # Watch current run
gh run view --log            # View logs

# Deployment monitoring (after merge to main)
kubectl get application rockndogs -n argocd
kubectl get pods -n rockndogs -l app=rockndogs
kubectl rollout status deployment/rockndogs-app -n rockndogs
```

## Related Documentation

- Full CI/CD Flow: `docs/CI-CD-GITOPS-FLOW.md`
- E2E Testing Guide: `docs/E2E-TESTING-GUIDE.md`
- Validation Checklist: `docs/QUICK-START-VALIDATION.md`
- GitHub Actions Workflow: `.github/workflows/ci.yml`
