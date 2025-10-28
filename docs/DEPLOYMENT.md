# 🚀 Build & Deployment Guide

This guide explains the CI/CD pipeline, build artifacts, and deployment process for RockNDogs.

---

## 📋 Current Pipeline Overview

### GitHub Actions (.github/workflows/ci.yml)

The pipeline runs on every push and consists of:

#### 1. **Lint** (Parallel)
- Runs ESLint to check code quality
- Ensures code follows Airbnb style guide

#### 2. **Test** (Parallel)
- Spins up MongoDB, Elasticsearch, Redis services
- Runs unit tests (`npm run test:unit`)
- Runs E2E tests with Puppeteer (`npm run test:e2e`)
- Generates coverage report
- Uploads coverage to Codecov

#### 3. **Security** (Parallel)
- Runs `npm audit` for known vulnerabilities
- Runs Snyk security scan (if token configured)

#### 4. **Build** (After tests pass)
- **Only runs on main branch**
- Creates deployment tarball: `rocknDogs-{commit}.tar.gz`
- Includes metadata (version, build date, commit hash)
- Uploads artifact (available for 30 days)

#### 5. **Docker Build** (After tests pass)
- **Only runs on main branch**
- Builds Docker image with multi-stage build
- Tags with commit SHA and "latest"
- Saves image as artifact

#### 6. **Deploy to Staging** (After build)
- **Only runs on main branch**
- Downloads build artifact
- Simulates deployment (can be replaced with real SSH)
- Runs health checks

#### 7. **Deploy to Production** (After staging)
- **Only runs on main branch**
- Requires manual approval in GitHub
- Simulates blue-green deployment
- Zero-downtime deployment strategy

---

## 🏗️ Build Artifacts

### What Gets Created

When you push to `main` branch:

```bash
# Tarball artifact
rocknDogs-abc1234.tar.gz
  ├── All application code
  ├── package.json & package-lock.json
  ├── node_modules (production only)
  └── Excludes: tests, coverage, .git, .env

# Metadata file
metadata.json
  {
    "version": "abc1234567890...",
    "branch": "main",
    "build_date": "2025-10-28T10:30:00Z",
    "build_number": "42",
    "git_commit": "abc1234",
    "git_author": "raviteja"
  }

# Docker image
rocknDogs-docker-abc1234.tar.gz
  └── Complete Docker image with all dependencies
```

### How to Download Artifacts

1. Go to GitHub → Actions tab
2. Click on a workflow run
3. Scroll to "Artifacts" section
4. Download `deployment-package` or `docker-image`

---

## 🐳 Docker Build Process

### Local Build

```bash
# Build image
docker build -t rocknDogs:local .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/shopping \
  -e ELASTICSEARCH_URL=http://host.docker.internal:9200 \
  -e REDIS_HOST=host.docker.internal \
  rocknDogs:local

# Test
curl http://localhost:3000/health
```

### Multi-Stage Build Explained

```dockerfile
# Stage 1: Builder
- Installs ALL dependencies (including dev)
- Copies application code
- Prunes dev dependencies

# Stage 2: Production
- Uses alpine (smaller image)
- Copies only production node_modules
- Runs as non-root user
- Includes health check
- Uses dumb-init for signal handling
```

**Benefits:**
- Smaller final image (~200MB vs 800MB)
- More secure (no dev dependencies)
- Proper signal handling (graceful shutdown)

---

## 🔄 Jenkins Pipeline

### Setup Jenkins

1. **Install Jenkins Plugins:**
   - NodeJS Plugin
   - Docker Pipeline Plugin
   - SSH Agent Plugin (for deployments)
   - Slack Notification (optional)

2. **Configure Jenkins:**
   ```bash
   # Add NodeJS installation
   Manage Jenkins → Global Tool Configuration
   → NodeJS installations → Add NodeJS
   Name: Node18
   Version: 18.x
   ```

3. **Create Pipeline Job:**
   - New Item → Pipeline
   - Pipeline script from SCM
   - Repository: Your GitHub repo
   - Script Path: `Jenkinsfile`

### Jenkins Pipeline Stages

```
Checkout → Install → Lint
                   ↓
              Unit Tests
                   ↓
              E2E Tests
                   ↓
          Security Scan (parallel)
         ├─ NPM Audit
         └─ Snyk Scan
                   ↓
         Build Artifact (main branch only)
                   ↓
      Build Docker Image (main branch only)
                   ↓
       Deploy to Staging (main branch only)
                   ↓
       Smoke Tests - Staging
                   ↓
    Deploy to Production (requires approval)
                   ↓
     Post-Deploy Validation
```

### Run Jenkins Pipeline

```bash
# Trigger automatically on git push
git push origin main

# Or trigger manually in Jenkins UI
Jenkins → Your Job → Build Now
```

---

## 📦 Deployment Strategies

### Strategy 1: Traditional Deployment (PM2)

```bash
# On the server
cd /opt/rocknDogs/releases
tar -xzf rocknDogs-abc1234.tar.gz -C ../current
cd ../current
npm ci --production
pm2 restart rocknDogs
pm2 save
```

**Deployment Script (`deploy.sh`):**
```bash
#!/bin/bash
set -e

APP_DIR="/opt/rocknDogs"
RELEASE_DIR="$APP_DIR/releases/$(date +%Y%m%d-%H%M%S)"
CURRENT_DIR="$APP_DIR/current"

# Extract to timestamped directory
mkdir -p $RELEASE_DIR
tar -xzf rocknDogs-*.tar.gz -C $RELEASE_DIR

# Install dependencies
cd $RELEASE_DIR
npm ci --production

# Run migrations (if any)
# npm run migrate

# Symlink to current
rm -rf $CURRENT_DIR
ln -s $RELEASE_DIR $CURRENT_DIR

# Restart application
pm2 restart rocknDogs

# Health check
sleep 5
curl -f http://localhost:3000/health || (pm2 logs --err && exit 1)

echo "✅ Deployment successful!"
```

### Strategy 2: Docker Deployment

```bash
# Load Docker image on server
docker load < rocknDogs-docker-abc1234.tar.gz

# Run with docker-compose
docker-compose down
docker-compose up -d

# Or run standalone
docker run -d \
  --name rocknDogs \
  --restart unless-stopped \
  -p 3000:3000 \
  -e MONGODB_URI=$MONGODB_URI \
  -e ELASTICSEARCH_URL=$ELASTICSEARCH_URL \
  rocknDogs:abc1234
```

### Strategy 3: Blue-Green Deployment

```bash
# Scenario: Currently running on "blue" (port 3001)

# 1. Deploy to "green" environment (port 3002)
pm2 start ecosystem.config.js --env production-green

# 2. Wait for green to be healthy
until curl -f http://localhost:3002/health; do sleep 1; done

# 3. Run smoke tests on green
npm run smoke-tests -- --url http://localhost:3002

# 4. Switch nginx to point to green
nginx -s reload  # (after updating upstream config)

# 5. Monitor for 5 minutes
sleep 300

# 6. Stop blue (keep for rollback)
pm2 stop blue

# 7. If issues: Quick rollback
# pm2 start blue && nginx -s reload
```

### Strategy 4: Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rocknDogs
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: app
        image: rocknDogs:abc1234
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
```

```bash
# Deploy
kubectl apply -f k8s/
kubectl rollout status deployment/rocknDogs

# Rollback if needed
kubectl rollout undo deployment/rocknDogs
```

---

## 🧪 Testing Deployments Locally

### Test the Build Process

```bash
# 1. Create artifact locally
npm ci --production
tar -czf rocknDogs-test.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='tests' \
  .

# 2. Simulate deployment
mkdir -p /tmp/deploy-test
tar -xzf rocknDogs-test.tar.gz -C /tmp/deploy-test
cd /tmp/deploy-test
npm ci --production
PORT=4000 npm start

# 3. Test
curl http://localhost:4000/health
```

### Test Docker Build

```bash
# Build
docker build -t rocknDogs:test .

# Run with dependencies
docker-compose up -d mongodb elasticsearch redis
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/shopping \
  rocknDogs:test

# Test
curl http://localhost:3000
```

### Test GitHub Actions Locally

Use [act](https://github.com/nektos/act) to run GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow
act push

# Run specific job
act -j build
```

---

## 🔍 Monitoring Deployments

### Health Checks

```bash
# Basic health check
curl http://your-server.com/health

# Detailed checks
curl http://your-server.com/health | jq .
# {
#   "status": "healthy",
#   "mongodb": "connected",
#   "elasticsearch": "connected",
#   "redis": "connected",
#   "uptime": 3600
# }
```

### Deployment Metrics

```bash
# Response time
curl -w "@curl-format.txt" -o /dev/null -s http://your-server.com/

# Error rate (check last 5 minutes)
pm2 logs --err --lines 100 | grep -c "Error"

# Memory usage
pm2 monit

# Requests per minute
pm2 logs | grep "GET" | wc -l
```

### Rollback Procedure

```bash
# If deployment fails:

# Method 1: PM2 (if keeping releases)
cd /opt/rocknDogs
rm current
ln -s releases/previous-good current
pm2 restart rocknDogs

# Method 2: Docker
docker-compose down
docker-compose up -d previous-image-tag

# Method 3: Kubernetes
kubectl rollout undo deployment/rocknDogs
```

---

## 🎯 Best Practices

1. **Always test locally first:**
   ```bash
   npm test && npm run lint
   ```

2. **Use environment-specific configs:**
   ```bash
   .env.staging
   .env.production
   ```

3. **Keep backups:**
   - Database backups before deploy
   - Previous release on server for 24 hours

4. **Gradual rollout:**
   - Deploy to staging first
   - Run smoke tests
   - Deploy to 1 production server
   - Monitor for 5-10 minutes
   - Deploy to remaining servers

5. **Monitor after deployment:**
   - Watch error logs for 15 minutes
   - Check response times
   - Verify key features work

---

## 📚 Quick Reference

### GitHub Actions

```bash
# View runs
https://github.com/YOUR_USERNAME/RockNDogs/actions

# Download artifact
Actions → Run → Artifacts section

# Re-run failed job
Actions → Failed run → Re-run jobs
```

### Jenkins

```bash
# Build manually
Jenkins → RockNDogs → Build Now

# View console output
Build #42 → Console Output

# Download artifact
Build #42 → Artifacts → Download
```

### Deployment Commands

```bash
# Traditional
ssh user@server 'cd /opt/rocknDogs && ./deploy.sh'

# Docker
docker-compose up -d --build

# Kubernetes
kubectl apply -f k8s/ && kubectl rollout status deployment/rocknDogs
```

---

**Happy Deploying! 🚀**
