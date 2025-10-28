# Dependency Management & Environment Configuration

This guide explains how to manage dependencies and configuration across different environments (development, testing, production) in the RockNDogs application.

---

## Table of Contents

1. [Understanding Dev vs Production Dependencies](#understanding-dev-vs-production-dependencies)
2. [Managing Dependencies in package.json](#managing-dependencies-in-packagejson)
3. [Docker Build Optimization](#docker-build-optimization)
4. [Kubernetes Configuration Management](#kubernetes-configuration-management)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Best Practices](#best-practices)

---

## Understanding Dev vs Production Dependencies

### What Are Dev Dependencies?

**Dev dependencies** are packages needed only during development or testing:

- Testing frameworks (jest, mocha)
- Linters (eslint, prettier)
- Build tools (webpack, babel)
- Git hooks (husky, lint-staged)
- Development utilities (nodemon)

**Production dependencies** are packages needed to run the application:

- Web frameworks (express)
- Databases (mongoose, redis)
- Authentication (passport)
- Template engines (hbs, ejs)
- Utilities used at runtime

### Why Separate Them?

1. **Smaller Docker images**: Production images don't need testing tools
2. **Faster builds**: Skip installing dev tools in CI/CD
3. **Security**: Fewer dependencies = smaller attack surface
4. **Cost**: Smaller images = less storage/bandwidth costs

---

## Managing Dependencies in package.json

### Structure

```json
{
  "dependencies": {
    "express": "^4.16.3",
    "mongoose": "^5.3.1",
    "passport": "^0.4.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.57.1",
    "husky": "^8.0.3"
  }
}
```

### Installing Dependencies

#### Development (install everything)

```bash
npm install
# or
npm ci
```

This installs both `dependencies` and `devDependencies`.

#### Production (install only runtime deps)

```bash
npm ci --only=production
# or (newer syntax)
npm ci --omit=dev
```

This skips all `devDependencies`.

#### Adding New Dependencies

**Production dependency:**

```bash
npm install express --save
# Adds to "dependencies"
```

**Dev dependency:**

```bash
npm install jest --save-dev
# Adds to "devDependencies"
```

### The Husky Issue

**Problem:** Husky is a dev dependency that sets up git hooks via the `prepare` script:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^8.0.3"
  }
}
```

When running `npm ci --only=production`, the `prepare` script still runs but husky isn't installed, causing errors.

**Solution:** Skip npm scripts during production install:

```bash
npm ci --only=production --ignore-scripts
```

---

## Docker Build Optimization

### Multi-Stage Build Pattern

```dockerfile
# Stage 1: Builder (has all dependencies)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY . .

# Stage 2: Production (only runtime files)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
CMD ["node", "./bin/www"]
```

### Why This Works

1. **Builder stage**: Installs only production dependencies
2. **--ignore-scripts**: Skips `husky install` and other dev scripts
3. **Multi-stage**: Final image only contains production code
4. **Result**: Fast builds (~9 seconds vs several minutes)

### Before vs After

**Before** (slow, includes dev deps):

```dockerfile
RUN npm ci
RUN npm prune --production
# Takes 2-5 minutes, installs then removes dev deps
```

**After** (fast, production only):

```dockerfile
RUN npm ci --only=production --ignore-scripts
# Takes ~9 seconds, never installs dev deps
```

---

## Kubernetes Configuration Management

### ConfigMap Structure

ConfigMaps store **non-sensitive** environment variables:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rockndogs-config
  namespace: rockndogs
data:
  # Database connections
  MONGODB_URI: "mongodb://mongodb:27017/shopping"
  ELASTICSEARCH_URL: "http://elasticsearch:9200"
  REDIS_HOST: "redis"
  REDIS_PORT: "6379"

  # Application config
  NODE_ENV: "production"
  PORT: "3000"

  # Session config (environment-specific)
  SESSION_SECURE: "false" # false for HTTP, true for HTTPS
  SESSION_SAME_SITE: "lax" # lax for testing, strict for production
```

### Secret Structure

Secrets store **sensitive** data (passwords, API keys):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: rockndogs-secrets
  namespace: rockndogs
type: Opaque
data:
  SESSION_SECRET: <base64-encoded-value>
```

**Create secrets:**

```bash
kubectl create secret generic rockndogs-secrets \
  --from-literal=SESSION_SECRET=your-secret-key \
  --namespace=rockndogs
```

### Using ConfigMap & Secrets in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rockndogs-app
spec:
  template:
    spec:
      containers:
        - name: rockndogs
          image: rockndogs:v10

          # Load ALL config from ConfigMap
          envFrom:
            - configMapRef:
                name: rockndogs-config

          # Load individual secrets
          env:
            - name: SESSION_SECRET
              valueFrom:
                secretKeyRef:
                  name: rockndogs-secrets
                  key: SESSION_SECRET
```

### Updating Configuration

#### Update ConfigMap

```bash
# Edit the configmap
kubectl edit configmap rockndogs-config -n rockndogs

# Or apply changes from file
kubectl apply -f k8s/configmap.yaml
```

#### Restart Pods to Load New Config

```bash
# ConfigMaps don't auto-reload, must restart pods
kubectl rollout restart deployment/rockndogs-app -n rockndogs

# Wait for rollout to complete
kubectl rollout status deployment/rockndogs-app -n rockndogs
```

#### View Current Config in Running Pod

```bash
# See all environment variables
kubectl exec -n rockndogs deploy/rockndogs-app -- env

# Filter for specific vars
kubectl exec -n rockndogs deploy/rockndogs-app -- env | grep SESSION
```

---

## Environment-Specific Configuration

### Local Development

**Use:** `.env` file or shell environment variables

```bash
# .env (not committed to git)
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shopping
ELASTICSEARCH_URL=http://localhost:9200
REDIS_HOST=localhost
SESSION_SECURE=false
```

**Install all dependencies:**

```bash
npm install
```

**Run with:**

```bash
npm start
```

### Docker Compose (Local Testing)

**Use:** `docker-compose.yml` with environment block

```yaml
services:
  app:
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://mongodb:27017/shopping
      SESSION_SECURE: "false"
```

**Benefits:**

- Full stack locally
- Close to production setup
- Easy to tear down

### Kubernetes (Production-like)

**Use:** ConfigMap + Secrets

```yaml
# ConfigMap for non-sensitive config
data:
  NODE_ENV: "production"
  SESSION_SECURE: "false" # false for port-forward testing
```

**Switch environments:**

```bash
# Use Docker Compose
make compose-up

# Switch to Kubernetes
make compose-down
make k8s-pf-start
```

### CI/CD (GitHub Actions)

**Use:** GitHub Secrets + workflow environment variables

```yaml
env:
  NODE_ENV: test
  MONGODB_URI: mongodb://localhost:27017/test
  ELASTICSEARCH_URL: http://localhost:9200
```

**Install only what's needed:**

```bash
# For tests, need dev dependencies
npm ci

# For building Docker images
docker build -t app:$VERSION .
# (Dockerfile uses npm ci --only=production)
```

---

## Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore
.env
*.pem
*.key
config/secrets.js
```

### 2. Use Environment Variables

**Bad:**

```javascript
const dbUrl = "mongodb://localhost:27017/shopping";
```

**Good:**

```javascript
const dbUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/shopping";
```

### 3. Validate Required Env Vars

```javascript
const requiredEnvVars = ["MONGODB_URI", "SESSION_SECRET"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### 4. Document All Environment Variables

Create a `.env.example` file:

```bash
# .env.example (committed to git)
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shopping
SESSION_SECRET=change-me-in-production
```

### 5. Use Different Values per Environment

| Variable       | Development | Testing   | Production  |
| -------------- | ----------- | --------- | ----------- |
| NODE_ENV       | development | test      | production  |
| SESSION_SECURE | false       | false     | true        |
| LOG_LEVEL      | debug       | info      | warn        |
| MONGODB_URI    | localhost   | localhost | cluster-url |

### 6. Keep Docker Images Lean

```dockerfile
# ✅ Good: Production deps only
RUN npm ci --only=production --ignore-scripts

# ❌ Bad: All deps including dev
RUN npm ci
```

### 7. Separate Build & Runtime Config

**Build-time** (Dockerfile):

- Base image version
- System dependencies (apk packages)
- npm dependencies

**Runtime** (ConfigMap/Secrets):

- Database URLs
- API keys
- Feature flags
- Environment mode

### 8. Use ConfigMap for Behavior Changes

Example: Session cookie security

**Before (hardcoded):**

```javascript
cookie: {
  secure: process.env.NODE_ENV === "production";
}
```

**After (configurable):**

```javascript
const sessionSecure =
  process.env.SESSION_SECURE === "true" ||
  (process.env.SESSION_SECURE === undefined &&
    process.env.NODE_ENV === "production");

cookie: {
  secure: sessionSecure;
}
```

Now you can override in ConfigMap for testing:

```yaml
data:
  NODE_ENV: "production"
  SESSION_SECURE: "false" # Override for HTTP testing
```

---

## Common Patterns

### Pattern 1: Load Config from Multiple Sources

```javascript
// config/index.js
const config = {
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/shopping",
  },
  session: {
    secret: process.env.SESSION_SECRET || "dev-secret",
    secure: process.env.SESSION_SECURE === "true",
  },
};

module.exports = config;
```

### Pattern 2: Environment-Specific Files

```javascript
// config/environments/development.js
module.exports = {
  logging: "debug",
  sessionSecure: false,
};

// config/environments/production.js
module.exports = {
  logging: "warn",
  sessionSecure: true,
};

// Load appropriate config
const env = process.env.NODE_ENV || "development";
const config = require(`./environments/${env}`);
```

### Pattern 3: Kubernetes Configuration Layers

```bash
# Base configuration (shared across environments)
k8s/base/configmap.yaml

# Environment-specific overlays
k8s/overlays/development/configmap.yaml
k8s/overlays/production/configmap.yaml
```

---

## Troubleshooting

### Issue: "husky: not found" during Docker build

**Cause:** `npm ci --only=production` skips husky but `prepare` script still runs

**Fix:**

```dockerfile
RUN npm ci --only=production --ignore-scripts
```

### Issue: ConfigMap changes not reflected in pods

**Cause:** Pods don't automatically reload ConfigMaps

**Fix:**

```bash
kubectl rollout restart deployment/rockndogs-app -n rockndogs
```

### Issue: Different behavior in dev vs production

**Cause:** Missing environment variable or different default values

**Fix:**

1. List all env vars in running pod:
   ```bash
   kubectl exec -n rockndogs deploy/rockndogs-app -- env
   ```
2. Compare with local:
   ```bash
   printenv | grep -E 'MONGODB|REDIS|SESSION'
   ```
3. Update ConfigMap to match

### Issue: "Cannot find module" in production

**Cause:** Dev dependency imported in production code

**Fix:**

1. Find the import:
   ```bash
   grep -r "require.*jest\|require.*eslint" --include="*.js" --exclude-dir=node_modules
   ```
2. Move to dev-only code or replace with production dependency

---

## Summary

| Aspect                | Development            | Production                                  |
| --------------------- | ---------------------- | ------------------------------------------- |
| **Dependencies**      | All (dev + prod)       | Production only                             |
| **Install command**   | `npm ci`               | `npm ci --only=production --ignore-scripts` |
| **Config source**     | `.env` file            | ConfigMap + Secrets                         |
| **Secrets**           | Hardcoded/local        | Kubernetes Secrets                          |
| **NODE_ENV**          | development            | production                                  |
| **SESSION_SECURE**    | false                  | true (or false for testing)                 |
| **Docker image size** | Large (with dev tools) | Small (runtime only)                        |
| **Build time**        | Slower (more deps)     | Fast (~9 seconds)                           |

**Key Takeaway:** Separate concerns—use `devDependencies` for tooling, `dependencies` for runtime, ConfigMaps for configuration, and Secrets for sensitive data. This keeps production lean, secure, and fast.
