# RockNDogs Tech Stack & Core Concepts

This document explains every technology used in RockNDogs, the concepts you need to understand it, and resources to fill knowledge gaps.

---

## Application Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP(S)
┌────────────────────────▼────────────────────────────────────┐
│              Load Balancer / Ingress                         │
│          (Kubernetes Service / NodePort)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                 Express.js App (Node.js)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware:                                           │   │
│  │  - Helmet (Security)                                  │   │
│  │  - Rate Limiting                                      │   │
│  │  - Passport Authentication                            │   │
│  │  - Session Management (Redis)                         │   │
│  │  - Feature Flags (runtime gating)                     │   │
│  │  - OpenTelemetry Tracing                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes & Controllers:                                 │   │
│  │  - / (Home/Shop)                                      │   │
│  │  - /search (Elasticsearch)                            │   │
│  │  - /user/* (Auth/Profile)                             │   │
│  │  - /cart (Shopping Cart)                              │   │
│  │  - /checkout (Stripe)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└──┬────────────┬────────────────┬───────────────────────────┘
   │            │                │
   ▼            ▼                ▼
┌──────┐   ┌────────────┐   ┌──────────┐
│MongoDB│   │Elasticsearch│   │  Redis   │
│ 27017 │   │    9200    │   │   6379   │
└───────┘   └────────────┘   └──────────┘
```

---

## Tech Stack Layers

### 1. Frontend (Templating & UI)

| Technology        | Purpose                         | Concepts to Learn                                                            |
| ----------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| **Handlebars.js** | Server-side HTML templating     | - Template engines<br>- Partials & layouts<br>- Helpers<br>- Context passing |
| **Bootstrap 4**   | CSS framework for responsive UI | - Grid system<br>- Components<br>- Responsive design<br>- Mobile-first       |
| **jQuery**        | DOM manipulation & AJAX         | - Selectors<br>- Event handling<br>- AJAX requests<br>- DOM traversal        |
| **Font Awesome**  | Icon library                    | - Icon classes<br>- CDN usage                                                |

**Key Files:**

- `views/layouts/layout.hbs` - Main layout
- `views/partials/header.hbs` - Reusable header
- `views/shop/*.hbs` - Page templates
- `public/stylesheets/style.css` - Custom styles

**Learning Resources:**

- Handlebars: https://handlebarsjs.com/guide/
- Bootstrap: https://getbootstrap.com/docs/4.6/getting-started/introduction/
- jQuery basics: https://learn.jquery.com/

---

### 2. Backend (Node.js & Express)

| Technology            | Version | Purpose             | Concepts to Learn                                                         |
| --------------------- | ------- | ------------------- | ------------------------------------------------------------------------- |
| **Node.js**           | 18.0.0  | JavaScript runtime  | - Event loop<br>- Async/await<br>- Streams<br>- Modules (CommonJS)        |
| **Express.js**        | 4.16.3  | Web framework       | - Routing<br>- Middleware<br>- Request/response cycle<br>- Error handling |
| **bcrypt-nodejs**     | 0.0.3   | Password hashing    | - Hashing vs encryption<br>- Salt rounds<br>- Password security           |
| **Passport.js**       | Latest  | Authentication      | - Strategies (local, OAuth)<br>- Sessions<br>- Serialization              |
| **express-session**   | Latest  | Session management  | - Session stores<br>- Cookies<br>- Session IDs                            |
| **connect-redis**     | Latest  | Redis session store | - Session persistence<br>- Distributed sessions                           |
| **express-validator** | 7.3.0   | Input validation    | - Validation chains<br>- Sanitization<br>- Error handling                 |
| **csurf**             | Latest  | CSRF protection     | - CSRF tokens<br>- Security best practices                                |
| _(optional)_          | -       | -                   | -                                                                         |

**Key Files:**

- `app.js` - Express app setup, middleware, error handling
- `routes/index.js` - Route definitions
- `bin/www` - Server startup

**Core Concepts:**

1. **Middleware Pipeline**: Request flows through middleware functions sequentially
2. **Routing**: Mapping HTTP methods + paths to handler functions
3. **Session Management**: Tracking user state across requests
4. **Authentication**: Verifying user identity with Passport strategies

**Learning Path:**

1. Node.js basics → https://nodejs.dev/learn
2. Express.js guide → https://expressjs.com/en/guide/routing.html
3. Passport.js docs → https://www.passportjs.org/docs/

---

### 3. Databases & Search

#### MongoDB (NoSQL Document Database)

| Technology       | Version | Purpose                    | Concepts to Learn                                                    |
| ---------------- | ------- | -------------------------- | -------------------------------------------------------------------- |
| **MongoDB**      | 6.0     | Primary database           | - Documents & collections<br>- BSON format<br>- Indexes<br>- Queries |
| **Mongoose**     | 5.x     | ODM (Object Data Modeling) | - Schemas<br>- Models<br>- Validation<br>- Middleware (hooks)        |
| **mongoosastic** | 5.0.0   | Elasticsearch integration  | - Auto-indexing<br>- Schema mapping<br>- Synchronization             |

**Key Files:**

- `models/dogfood.js` - DogFood schema & model
- `models/supply.js` - Supplies schema & model
- `models/category.js` - Category schema & model
- `seed/` - Data seeders

**Core Concepts:**

1. **Schema Design**: Defining document structure with types and validation
2. **Relationships**: Embedding vs referencing documents
3. **Indexes**: Improving query performance
4. **Middleware**: Pre/post hooks for save, update, delete operations

**MongoDB Connection:**

```javascript
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/shopping",
);
```

**Learning Resources:**

- MongoDB basics → https://www.mongodb.com/basics
- Mongoose guide → https://mongoosejs.com/docs/guide.html

---

#### Elasticsearch (Search Engine)

| Technology                 | Version | Purpose               | Concepts to Learn                                                     |
| -------------------------- | ------- | --------------------- | --------------------------------------------------------------------- |
| **Elasticsearch**          | 7.17.14 | Full-text search      | - Inverted index<br>- Analyzers<br>- Query DSL<br>- Relevance scoring |
| **@elastic/elasticsearch** | 7.17.14 | ES client for Node.js | - Client configuration<br>- Index management<br>- Search queries      |

**Key Concepts:**

1. **Full-Text Search**: Searching through text fields with relevance ranking
2. **Indexing**: Converting documents into searchable format
3. **Analyzers**: Tokenization, filtering, stemming for search
4. **Query DSL**: JSON-based query language

**How It Works in RockNDogs:**

```javascript
// In models/dogfood.js
DogFoodSchema.plugin(mongoosastic, {
  esClient: esClient, // Auto-indexes to Elasticsearch on save
});

// Search query in routes/index.js
DogFood.search(
  {
    query_string: { query: searchTerm },
  },
  callback,
);
```

**Learning Resources:**

- ES basics → https://www.elastic.co/guide/en/elasticsearch/reference/current/elasticsearch-intro.html
- Search concepts → https://www.elastic.co/blog/found-elasticsearch-from-the-bottom-up

---

#### Redis (In-Memory Cache/Store)

| Technology | Version | Purpose                  | Concepts to Learn                                                             |
| ---------- | ------- | ------------------------ | ----------------------------------------------------------------------------- |
| **Redis**  | 7       | Session store & caching  | - Key-value store<br>- Data structures<br>- TTL (expiration)<br>- Persistence |
| **redis**  | 2.8.0   | Redis client for Node.js | - Connection pooling<br>- Commands<br>- Pub/Sub                               |

**Use Cases in RockNDogs:**

1. **Session Storage**: Store user sessions (instead of in-memory)
2. **Caching**: Cache frequently accessed data (search results, product lists)

**Core Concepts:**

1. **Key-Value Store**: Simple data model (key → value)
2. **In-Memory**: Fast because data lives in RAM
3. **Persistence**: Optional disk writes for durability
4. **TTL**: Automatic expiration of keys

**Learning Resources:**

- Redis basics → https://redis.io/docs/getting-started/
- Node Redis → https://github.com/redis/node-redis

---

### 4. Security

| Technology             | Version | Purpose                    | Concepts to Learn                                                         |
| ---------------------- | ------- | -------------------------- | ------------------------------------------------------------------------- |
| **Helmet**             | 8.1.0   | HTTP security headers      | - Content Security Policy<br>- XSS protection<br>- HSTS<br>- Clickjacking |
| **express-rate-limit** | 8.1.0   | Rate limiting              | - DDoS protection<br>- Brute force prevention<br>- Token buckets          |
| **mongo-sanitize**     | 2.2.0   | NoSQL injection prevention | - Query sanitization<br>- Input validation                                |
| **csurf**              | Latest  | CSRF tokens                | - Cross-site request forgery<br>- Token validation                        |

**Security Layers:**

```
┌─────────────────────────────────────────┐
│ 1. Rate Limiting (express-rate-limit)   │ ← Prevent abuse
├─────────────────────────────────────────┤
│ 2. Helmet Headers                       │ ← Browser security
├─────────────────────────────────────────┤
│ 3. CSRF Tokens (csurf)                  │ ← Form security
├─────────────────────────────────────────┤
│ 4. Input Validation (express-validator) │ ← Data validation
├─────────────────────────────────────────┤
│ 5. Sanitization (mongo-sanitize)        │ ← Injection prevention
├─────────────────────────────────────────┤
│ 6. Authentication (Passport)            │ ← User verification
└─────────────────────────────────────────┘
```

**Learning Resources:**

- OWASP Top 10 → https://owasp.org/www-project-top-ten/
- Web security basics → https://web.dev/secure/

---

### 5. Testing

| Technology    | Version | Purpose             | Concepts to Learn                                                        |
| ------------- | ------- | ------------------- | ------------------------------------------------------------------------ |
| **Jest**      | 29.7.0  | Test framework      | - Unit tests<br>- Test suites<br>- Mocking<br>- Assertions               |
| **Supertest** | 6.3.4   | HTTP testing        | - API testing<br>- Integration tests<br>- Request/response               |
| **Puppeteer** | 21.11.0 | E2E browser testing | - Headless Chrome<br>- Selectors<br>- User interactions<br>- Screenshots |
| **ESLint**    | 8.57.1  | Code linting        | - Code style<br>- Best practices<br>- Error detection                    |

**Test Types:**

1. **Unit Tests**: Test individual functions/modules
2. **Integration Tests**: Test API endpoints with Supertest
3. **E2E Tests**: Test full user flows with Puppeteer

**Key Files:**

- `tests/unit/` - Unit tests
- `tests/integration/` - API integration tests
- `tests/e2e/` - End-to-end browser tests
- `.eslintrc.json` - Linting configuration
- `jest.config.js` - Jest configuration

**Learning Resources:**

- Jest → https://jestjs.io/docs/getting-started
- Testing best practices → https://testingjavascript.com/

---

### 6. Observability & Performance

| Technology          | Version    | Purpose              | Concepts to Learn                                                 |
| ------------------- | ---------- | -------------------- | ----------------------------------------------------------------- |
| **OpenTelemetry**   | 0.207.0    | Distributed tracing  | - Spans & traces<br>- Context propagation<br>- Instrumentation    |
| **Jaeger**          | All-in-one | Trace visualization  | - Distributed systems<br>- Service maps<br>- Performance analysis |
| **Autocannon**      | 8.0.0      | Load testing         | - RPS (requests/sec)<br>- Latency percentiles<br>- Throughput     |
| **Chrome DevTools** | Built-in   | CPU/memory profiling | - Flame graphs<br>- Heap snapshots<br>- Memory leaks              |

**Observability Pipeline:**

```
Application (Node.js)
  ↓ (OpenTelemetry SDK instruments code)
  ↓ (Generates spans/traces)
Jaeger Collector
  ↓ (Stores traces)
Jaeger UI
  ↓ (Visualizes)
Developer analyzes performance
```

**Key Concepts:**

1. **Tracing**: Following a request through multiple services
2. **Spans**: Individual operations (DB query, HTTP call)
3. **Traces**: Collection of related spans
4. **Metrics**: Aggregated measurements (RPS, latency)

**Load Testing Example:**

```zsh
# Test homepage
npm run load:test

# Test search endpoint
npm run load:search
```

**Learning Resources:**

- OpenTelemetry → https://opentelemetry.io/docs/concepts/
- Distributed tracing → https://www.jaegertracing.io/docs/1.6/architecture/

---

### 6.1 Logging (Pino + ELK)

| Component                 | Purpose                        | Notes                                       |
| ------------------------- | ------------------------------ | ------------------------------------------- |
| **Pino**                  | Structured JSON logging in app | Fast, low overhead; outputs to stdout       |
| **Fluent Bit / Filebeat** | Ship container stdout logs     | Add k8s metadata; send to ES                |
| **Elasticsearch**         | Central log storage and search | Apply index lifecycle policy for retention  |
| **Kibana**                | Dashboards and exploration     | Create index pattern e.g. `rockndogs-logs*` |

Runtime env vars (used by `lib/logger.js`):

- `LOG_LEVEL` (default: `info` in prod, `debug` in dev)
- `LOG_PRETTY` (dev only; set `false` to disable pretty printing)
- `LOG_TO_ELASTICSEARCH` (`true`/`false`; default `false` – usually ship via Fluent Bit)
- `ELASTICSEARCH_URL` (default: `http://localhost:9200`)
- `LOG_INDEX` (default: `rockndogs-logs`)

Recommendations:

- In Kubernetes, prefer: Pino → stdout → Fluent Bit → Elasticsearch → Kibana
- Skip Logstash initially; add only if you need heavy transforms/enrichment

---

### 7. Containerization (Docker)

| Technology        | Version | Purpose                  | Concepts to Learn                                                             |
| ----------------- | ------- | ------------------------ | ----------------------------------------------------------------------------- |
| **Docker**        | Latest  | Container runtime        | - Images vs containers<br>- Layers<br>- Volumes<br>- Networks                 |
| **Dockerfile**    | -       | Image definition         | - Multi-stage builds<br>- Base images<br>- COPY vs ADD<br>- CMD vs ENTRYPOINT |
| **.dockerignore** | -       | Exclude files from image | - Build context<br>- Image size optimization                                  |

**Our Dockerfile Structure:**

```dockerfile
# Stage 1: Builder (installs all deps)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm prune --production

# Stage 2: Production (copies only what's needed)
FROM node:18-alpine
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app .
USER nodejs
EXPOSE 3000
CMD ["dumb-init", "node", "bin/www"]
```

**Key Concepts:**

1. **Multi-Stage Builds**: Reduce final image size
2. **Non-Root User**: Security best practice
3. **dumb-init**: Proper signal handling (PID 1 problem)
4. **Health Checks**: Automatic container health monitoring

**Learning Resources:**

- Docker basics → https://docs.docker.com/get-started/
- Dockerfile best practices → https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

---

### 8. Orchestration (Kubernetes)

| Technology     | Version | Purpose                 | Concepts to Learn                                                             |
| -------------- | ------- | ----------------------- | ----------------------------------------------------------------------------- |
| **Kubernetes** | 1.34.0  | Container orchestration | - Pods<br>- Services<br>- Deployments<br>- Namespaces<br>- ConfigMaps/Secrets |
| **minikube**   | 1.37.0  | Local K8s cluster       | - Cluster setup<br>- Addons<br>- Networking modes                             |
| **kubectl**    | Latest  | K8s CLI tool            | - Commands<br>- Resource types<br>- YAML manifests                            |

**Kubernetes Resource Hierarchy:**

```
Cluster
 └─ Namespace (rockndogs)
      ├─ Deployment (rockndogs-app)
      │    └─ ReplicaSet
      │         └─ Pod(s) (rockndogs-app-xxx)
      │              └─ Container (rockndogs image)
      ├─ Service (rockndogs-service)
      ├─ ConfigMap (rockndogs-config)
      └─ Secret (rockndogs-secrets)
```

**Key Resources in RockNDogs:**

1. **Namespace** (`k8s/namespace.yaml`)
   - Isolates resources from other apps

2. **ConfigMap** (`k8s/configmap.yaml`)
   - Non-sensitive configuration (DB URLs, ports)

3. **Secret** (`k8s/secret.yaml`)
   - Sensitive data (session secrets, API keys)

4. **Deployment** (`k8s/deployment.yaml`)
   - Manages app replicas
   - Rolling updates
   - Health checks (liveness/readiness probes)

5. **Service** (`k8s/deployment.yaml` - bottom)
   - Stable network endpoint for pods
   - Load balancing across replicas

**Core Concepts:**

| Concept        | Description                              | Why We Need It                        |
| -------------- | ---------------------------------------- | ------------------------------------- |
| **Pod**        | Smallest deployable unit (1+ containers) | Runs our app container                |
| **Deployment** | Manages pod replicas & updates           | Zero-downtime updates, scaling        |
| **Service**    | Stable DNS name & load balancing         | Pods are ephemeral, Service is stable |
| **ConfigMap**  | Key-value config data                    | Separate config from code             |
| **Secret**     | Encrypted sensitive data                 | Passwords, tokens                     |
| **Namespace**  | Virtual cluster within cluster           | Multi-tenancy, isolation              |

**Networking Concepts:**

- **ClusterIP**: Internal-only (default)
- **NodePort**: Exposes on node's IP:port
- **LoadBalancer**: External IP (cloud only, needs minikube tunnel locally)
- **Ingress**: HTTP(S) routing to services

**Learning Resources:**

- K8s basics → https://kubernetes.io/docs/tutorials/kubernetes-basics/
- Interactive tutorial → https://www.katacoda.com/courses/kubernetes

---

### 9. GitOps (ArgoCD)

| Technology | Version | Purpose                    | Concepts to Learn                                                                      |
| ---------- | ------- | -------------------------- | -------------------------------------------------------------------------------------- |
| **ArgoCD** | Latest  | GitOps continuous delivery | - Declarative config<br>- Git as source of truth<br>- Sync policies<br>- Health checks |

**GitOps Workflow:**

```
1. Developer commits code
        ↓
2. Push to GitHub (main branch)
        ↓
3. ArgoCD detects change (polls Git every 3m)
        ↓
4. ArgoCD compares Git (desired state) vs Cluster (actual state)
        ↓
5. ArgoCD syncs: kubectl apply -f k8s/
        ↓
6. Kubernetes updates resources
        ↓
7. ArgoCD reports: Synced ✓, Healthy ✓
```

**Key Concepts:**

1. **Declarative Configuration**
   - Desired state in Git (YAML manifests)
   - ArgoCD makes cluster match Git

2. **Sync Policies**

   ```yaml
   automated:
     prune: true # Delete resources not in Git
     selfHeal: true # Revert manual changes
   ```

3. **Application Health**
   - Tracks resource status (Running, Degraded, Progressing)
   - Shows sync status (Synced, OutOfSync)

4. **Why GitOps?**
   - Git = audit trail (who changed what, when)
   - Rollback = `git revert` + ArgoCD syncs
   - No kubectl access needed for deployments
   - Disaster recovery = re-apply Git repo

**Our ArgoCD Application:**

```yaml
# k8s/argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: rockndogs
spec:
  source:
    repoURL: https://github.com/venkataL1611/RockNDogs.git
    path: k8s/
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: rockndogs
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Learning Resources:**

- ArgoCD concepts → https://argo-cd.readthedocs.io/en/stable/core_concepts/
- GitOps principles → https://www.gitops.tech/

---

### 10. CI/CD (GitHub Actions)

| Technology         | Version | Purpose          | Concepts to Learn                                          |
| ------------------ | ------- | ---------------- | ---------------------------------------------------------- |
| **GitHub Actions** | -       | CI/CD automation | - Workflows<br>- Jobs & steps<br>- Triggers<br>- Artifacts |

**Workflow file**: `.github/workflows/ci.yml`

**Triggers and concurrency**

- push: main, release/**, hotfix/**, tags v*.*.\*
- pull_request: targeting main
- workflow_dispatch: manual
- concurrency: per ref/PR; cancel in-progress to avoid duplicates

**Jobs**

- lint: ESLint with Node 18 cache
- test: Jest unit + E2E; spins up MongoDB 4.4/ES 7.17/Redis 7 services; seeds test data; starts app on :3000; runs tests; uploads coverage
- security: npm audit (non-blocking), Snyk (non-blocking)
- build: npm ci --omit=dev with HUSKY=0; build tarball artifact and metadata; upload-artifact v4
- docker-build: login to GHCR; buildx + QEMU; push multi-arch (linux/amd64, linux/arm64) image to `ghcr.io/<owner_lower>/rockndogs` with tags `<short-sha>` and `latest`
- update-manifest: replace image in `k8s/deployment.yaml` with new short SHA; lowercases owner; commit `[skip ci]`
- deploy-staging: simulated (echo plan)
- deploy-production: simulated with manual-approval note

**Notes**

- Use lowercase for GHCR owner to avoid InvalidImageName
- Multi-arch images prevent `no matching manifest for linux/arm64/v8` on ARM nodes
- Use `--omit=dev` instead of deprecated `--production`
- Husky guarded in CI to avoid prepare script failures

**Learning Resources:**

- GitHub Actions → https://docs.github.com/en/actions/learn-github-actions

---

### 11. Feature Flags

Feature flags let you enable/disable code paths (including % rollouts) at runtime without redeploying.

- Source: environment variable `FEATURE_FLAGS_JSON` (typically via Kubernetes ConfigMap)
- Access in code: helper exposes `req.isFlagOn(name)` and `res.locals.flags`
- Rollouts: boolean values, or rollout percentages like "10%" using stable hashing by user/session
- Ops: flip flags by editing ConfigMap and rolling restart (or via GitOps commit)

Example `FEATURE_FLAGS_JSON`:

```json
{
  "newCartIdempotency": true,
  "signupV2": "10%",
  "searchV2": false
}
```

Usage in route:

```js
router.get("/search", (req, res) => {
  const experimental = req.isFlagOn("searchV2");
  // branch logic based on flag
  res.render("shop/search-result", { experimental });
});
```

Usage in Handlebars:

```hbs
{{#if flags.signupV2}}
  <a href="/signup-v2" class="btn btn-primary">Try new signup</a>
{{else}}
  <a href="/signup" class="btn btn-secondary">Signup</a>
{{/if}}
```

---

### 12. Dependencies: Dev vs Production

- Runtime (`dependencies`): express, mongoose, redis, @elastic/elasticsearch, mongoosastic, helmet, etc.
- Dev (`devDependencies`): eslint, jest, supertest, puppeteer, husky, prettier, lint-staged, autocannon
- Production install: `npm ci --omit=dev` (CI/Docker)
- Husky guard: `HUSKY=0` in CI and a conditional `prepare` script prevents failures when devDeps are omitted

Verification tips:

- Local prod-only test: remove node_modules; `npm ci --omit=dev --ignore-scripts`; `NODE_ENV=production npm start`
- Check for misplaced deps: `npx depcheck` and `npm ls --omit=dev`

---

### 13. Troubleshooting (Playbook)

1. ImagePullBackOff: no matching manifest for linux/arm64/v8

- Cause: image published only for amd64; ARM node cannot pull
- Fix: enable buildx/QEMU and push multi-arch (linux/amd64, linux/arm64)

2. InvalidImageName in ArgoCD after sync

- Cause: GHCR owner had uppercase letters
- Fix: lowercase owner in both docker image path and manifest bump logic

3. Husky: not found during npm ci --production

- Cause: `prepare` runs while devDeps are omitted
- Fix: use `npm ci --omit=dev` and set `HUSKY=0`; guard `prepare` to only run if husky is installed

4. Two GitHub Actions runs per push

- Cause: push and pull_request both triggered on all branches
- Fix: restrict push to main/release/hotfix/tags and pull_request to main; add concurrency cancel-in-progress

5. E2E tests fail locally (no data)

- Cause: app started without seeding
- Fix: use helper script to seed, start app, wait, then run E2E

### 14. 2025-10 Updates Summary

- Node 18 LTS baseline; npm `--omit=dev` for prod installs
- GitHub Actions: updated actions to latest; added concurrency; fixed duplicate runs
- Docker: multi-arch images to GHCR (`ghcr.io/<owner_lower>/rockndogs`), tags `<short-sha>` and `latest`
- GitOps: CI auto-bumps `k8s/deployment.yaml` image to new SHA; ArgoCD auto-syncs
- Feature Flags: runtime gating via `FEATURE_FLAGS_JSON` with % rollouts
- E2E: stable runner seeding DB and waiting for app readiness

## Environment Variables (Configuration)

| Variable            | Purpose                              | Where Set                          |
| ------------------- | ------------------------------------ | ---------------------------------- |
| `NODE_ENV`          | Environment (development/production) | k8s/configmap.yaml                 |
| `PORT`              | App listening port                   | k8s/configmap.yaml                 |
| `MONGODB_URI`       | MongoDB connection string            | k8s/configmap.yaml                 |
| `ELASTICSEARCH_URL` | Elasticsearch endpoint               | k8s/configmap.yaml                 |
| `REDIS_HOST`        | Redis hostname                       | k8s/configmap.yaml                 |
| `REDIS_PORT`        | Redis port                           | k8s/configmap.yaml                 |
| `SESSION_SECRET`    | Session encryption key               | k8s/secret.yaml                    |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key               | app.js (hardcoded - should be env) |
| `STRIPE_SECRET_KEY` | Stripe secret key                    | app.js (hardcoded - should be env) |

**Why Environment Variables?**

- **Security**: Don't hardcode secrets in code
- **Flexibility**: Same code, different configs per environment
- **12-Factor App**: Strict separation of config from code

---

## Core Concepts You Need to Understand

### 1. HTTP & REST APIs

- **Request/Response cycle**
- **HTTP methods**: GET, POST, PUT, DELETE
- **Status codes**: 200, 302, 404, 500
- **Headers**: Content-Type, Authorization, cookies
- **REST principles**: Resources, verbs, statelessness

### 2. Asynchronous JavaScript

- **Callbacks**: Old-school async (callback hell)
- **Promises**: Better async with `.then()/.catch()`
- **Async/Await**: Modern async (looks synchronous)
- **Event Loop**: How Node.js handles concurrency

### 3. Authentication vs Authorization

- **Authentication**: Who are you? (login)
- **Authorization**: What can you do? (permissions)
- **Sessions**: Server-side state tracking
- **Tokens**: JWT, OAuth tokens (stateless)

### 4. Database Design

- **Normalization**: Reducing redundancy (SQL)
- **Denormalization**: Optimizing for reads (NoSQL)
- **Indexes**: Speed up queries
- **Relationships**: One-to-many, many-to-many

### 5. Caching Strategies

- **Cache-aside**: App checks cache, fetches DB if miss
- **Write-through**: App writes to cache + DB simultaneously
- **TTL**: Time-to-live (expiration)
- **Invalidation**: Removing stale cache entries

### 6. Container Orchestration

- **Desired State**: What you want (YAML manifest)
- **Actual State**: What's running now
- **Reconciliation Loop**: Controller makes actual = desired
- **Self-Healing**: Restart failed pods automatically

### 7. Observability (3 Pillars)

- **Logs**: What happened (text events)
- **Metrics**: How much (numbers, aggregations)
- **Traces**: Where time went (request flow)

---

## Knowledge Gaps Checklist

Use this to identify what to learn next:

### Backend Fundamentals

- [ ] Node.js event loop and async patterns
- [ ] Express middleware pipeline
- [ ] Passport authentication strategies
- [ ] Session management (cookies, server-side storage)
- [ ] Error handling in Express

### Databases

- [ ] MongoDB CRUD operations
- [ ] Mongoose schemas and validation
- [ ] Elasticsearch indexing and search
- [ ] Redis data structures (strings, hashes, sets)
- [ ] Database connection pooling

### Security

- [ ] OWASP Top 10 vulnerabilities
- [ ] Password hashing (bcrypt)
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] Rate limiting strategies

### DevOps & Cloud Native

- [ ] Docker basics (images, containers, volumes)
- [ ] Kubernetes resources (Pods, Deployments, Services)
- [ ] Kubernetes networking (ClusterIP, NodePort, LoadBalancer)
- [ ] ConfigMaps and Secrets management
- [ ] Health checks (liveness/readiness probes)

### CI/CD & GitOps

- [ ] GitHub Actions workflow syntax
- [ ] ArgoCD sync strategies
- [ ] Rolling updates and rollbacks
- [ ] Blue-green deployments
- [ ] Canary deployments

### Testing

- [ ] Unit testing with Jest
- [ ] Integration testing with Supertest
- [ ] E2E testing with Puppeteer
- [ ] Test-driven development (TDD)
- [ ] Code coverage

### Observability

- [ ] Distributed tracing concepts
- [ ] OpenTelemetry instrumentation
- [ ] Jaeger trace analysis
- [ ] Load testing with Autocannon
- [ ] Performance profiling (CPU, memory)

---

## Learning Path Recommendation

### Phase 1: Backend Fundamentals (2 weeks)

1. Node.js basics (event loop, async/await)
2. Express.js (routing, middleware, error handling)
3. REST API design

### Phase 2: Databases (2 weeks)

1. MongoDB basics (documents, collections, queries)
2. Mongoose ODM (schemas, models, validation)
3. Elasticsearch basics (indexing, searching)
4. Redis basics (key-value operations, caching)

### Phase 3: Security (1 week)

1. Authentication with Passport
2. Session management
3. Common vulnerabilities (OWASP Top 10)
4. Security middleware (Helmet, rate-limiting)

### Phase 4: Docker & Kubernetes (3 weeks)

1. Docker fundamentals (containers, images, Dockerfile)
2. Kubernetes basics (Pods, Deployments, Services)
3. Kubernetes networking (Services, Ingress)
4. ConfigMaps and Secrets
5. kubectl commands and troubleshooting

### Phase 5: GitOps & CI/CD (1 week)

1. ArgoCD concepts and setup
2. GitHub Actions workflows
3. Automated testing in CI/CD
4. Deployment strategies

### Phase 6: Observability (1 week)

1. OpenTelemetry tracing
2. Jaeger trace visualization
3. Load testing
4. Performance profiling

---

## Useful Commands Cheat Sheet

### Docker

```zsh
# Build image
docker build -t rockndogs:v7 .

# Run container locally
docker run -p 3000:3000 rockndogs:v7

# List images
docker images

# Remove image
docker rmi rockndogs:v7
```

### Kubernetes

```zsh
# Get resources
kubectl get pods -n rockndogs
kubectl get svc -n rockndogs
kubectl get deploy -n rockndogs

# Describe resource
kubectl describe pod <pod-name> -n rockndogs

# Logs
kubectl logs <pod-name> -n rockndogs
kubectl logs -f deploy/rockndogs-app -n rockndogs

# Exec into pod
kubectl exec -it <pod-name> -n rockndogs -- sh

# Port forward
kubectl port-forward svc/rockndogs-service -n rockndogs 3000:80

# Apply manifests
kubectl apply -f k8s/

# Delete resources
kubectl delete -f k8s/
```

### ArgoCD

```zsh
# Get applications
kubectl get applications -n argocd

# Force sync
kubectl patch app rockndogs -n argocd --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'

# Access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### MongoDB (from pod)

```zsh
# Connect to MongoDB shell
kubectl exec -it mongodb-xxx -n rockndogs -- mongosh shopping

# Show databases
show dbs

# Use database
use shopping

# Show collections
show collections

# Find documents
db.dogfoods.find().pretty()
```

### Elasticsearch (from pod or curl)

```zsh
# Check cluster health
curl http://elasticsearch:9200/_cluster/health?pretty

# List indexes
curl http://elasticsearch:9200/_cat/indices?v

# Search
curl -X GET "http://elasticsearch:9200/dogfoods/_search?q=title:food"
```

### Redis (from pod)

```zsh
# Connect to Redis CLI
kubectl exec -it redis-xxx -n rockndogs -- redis-cli

# List all keys
KEYS *

# Get value
GET session:xxx

# Set value
SET mykey "myvalue"

# Check TTL
TTL session:xxx
```

---

## Next Steps

1. **Run the app locally** (without Kubernetes) to understand the basics
2. **Read through the codebase** file by file
3. **Deploy to Kubernetes** following docs/LOCAL-K8S-ARGOCD.md
4. **Break things intentionally** to learn troubleshooting
5. **Add features** (new routes, models, search filters)
6. **Read logs and traces** in Jaeger to understand request flow

---

## Additional Resources

### Books

- "Node.js Design Patterns" by Mario Casciaro
- "Kubernetes in Action" by Marko Lukša
- "Site Reliability Engineering" (SRE Book) by Google

### Courses

- FreeCodeCamp: Node.js and Express
- Kubernetes.io interactive tutorials
- Docker Getting Started tutorial

### Documentation

- Node.js: https://nodejs.org/docs/
- Express: https://expressjs.com/
- Kubernetes: https://kubernetes.io/docs/
- MongoDB: https://www.mongodb.com/docs/
- ArgoCD: https://argo-cd.readthedocs.io/

---

This document is a living guide. Update it as you learn and add new technologies!
