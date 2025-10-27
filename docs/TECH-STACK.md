# RockNDogs Tech Stack

A concise overview of the technologies used for security, testing/QA, and tracing/observability in this project, with pointers to where they’re configured.

## Runtime and Web Framework

- Node.js 18.x (CI targets 18)
- Express 4.x (`express@^4.16.3`)
- Templating: express-handlebars (`express-handlebars@^3.0.0`)
  - Engine setup in `app.js` with `.hbs` extension
- Static files: `public/`

## Data, Search, and Caching

- MongoDB (local dev via Docker; CI service)
  - ODM: Mongoose (`mongoose@^5.3.1`)
  - Seed/restore: `seed/restore-database.js`, `tests/seed-test-data.js`
- Elasticsearch 7.17.x (for search)
  - Client: `@elastic/elasticsearch@^7.17.14`
  - Legacy: `mongoosastic@^5.0.0` present
- Redis (cache/session tooling)
  - Runtime: Docker `redis:7-alpine`
  - Node client dependency: `redis@^2.8.0` (legacy API)

## Authentication and Sessions

- Passport (`passport@^0.4.0`) with `passport-local@^1.0.0`
- Session management: `express-session@^1.15.6`
- Password hashing: `bcrypt-nodejs@0.0.3`
- Configured in `app.js` and `config/passport`

## Security Hardening

Configured primarily in `app.js` and documented in `docs/SECURITY.md`.

- HTTP Security Headers: `helmet@^8.1.0`
  - Content Security Policy (CSP) for scripts/styles/fonts/images
  - Strict-Transport-Security (HSTS) in production
  - Upgrade Insecure Requests (conditional)
- Rate Limiting: `express-rate-limit@^8.1.0`
  - Dedicated login limiter (5/15min)
  - General API limiter (100/15min)
- NoSQL Injection Mitigation: `express-mongo-sanitize@^2.2.0`
- Input Validation: `express-validator@^7.3.0`
- Sessions: httpOnly, sameSite='strict', secure in production
- Proxy trust enabled in production for HTTPS detection
- CSRF: `csurf@^1.11.0` is installed but not yet wired (see recommendations in `docs/SECURITY.md`)

## Logging and Diagnostics

- HTTP logging: `morgan@~1.9.0`
- Debug logger: `debug@~2.6.9` (used in `bin/www`)

## Testing and Code Quality

- Test Runner: `jest@^29.7.0`
- HTTP assertions: `supertest@^6.3.4`
- E2E browser automation: `puppeteer@^21.11.0`
- Wait for server: `wait-on@^7.2.0`
- Linting: `eslint@^8.57.1` with `eslint-config-airbnb-base@^15.0.0` and `eslint-plugin-import@^2.32.0`
- Formatting: `prettier@^3.6.2`
- Git hooks: `husky@^8.0.3` + `lint-staged@^15.5.2`
- Coverage: Jest coverage uploaded to Codecov in CI
- Test docs: `docs/TESTING.md`

Scripts (`package.json`):
- `npm test`, `npm run test:unit`, `npm run test:e2e`, `npm run test:coverage`
- `npm run lint`, `npm run lint:fix`
- `npm run prepare` (husky install)

## CI/CD

- GitHub Actions: `.github/workflows/ci.yml`
  - Jobs: Lint, Test (unit + E2E), Security (npm audit + Snyk), Coverage upload (Codecov)
  - CI services: MongoDB, Elasticsearch, Redis
  - Test DB isolation: seeds `shopping_test` only

## Tracing and Observability

- OpenTelemetry (Node.js)
  - API: `@opentelemetry/api@^1.9.0`
  - Node SDK: `@opentelemetry/sdk-node@^0.207.0`
  - Auto-instrumentations: `@opentelemetry/auto-instrumentations-node@^0.66.0`
    - Enabled: HTTP, Express, MongoDB, Redis, Mongoose
    - Some unused instrumentations explicitly disabled
  - Exporter: OTLP HTTP `@opentelemetry/exporter-trace-otlp-http@^0.207.0`
- Jaeger (all-in-one) via Docker Compose
  - UI: http://localhost:16686
  - OTLP HTTP: http://localhost:4318
  - OTLP gRPC: http://localhost:4317
- App wiring
  - `bin/www` requires `tracing.js` before loading the app to enable auto-instrumentation
  - `tracing.js` sets service name `rockndogs-shop`, configures exporter, and handles graceful shutdown
  - Custom span example: payment gateway in `routes/cart.js`
- Tracing docs: `docs/TRACING.md`

## Local Infrastructure (Docker Compose)

- `docker-compose.yml` provisions:
  - MongoDB 6.0 (for local dev)
  - Elasticsearch 7.17.14
  - Redis 7-alpine
  - Jaeger all-in-one (UI + OTLP collectors)

## Documentation Index

- Security: `docs/SECURITY.md`
- Testing: `docs/TESTING.md`
- Tracing: `docs/TRACING.md`
- Database: `docs/DATABASE.md`

## Notes and Caveats

- Redis client in app (`redis@^2.8.0`) is legacy; consider upgrading to `redis@^4` to match modern API and Redis 7 server.
- `csurf` is installed but not configured; consider `csrf-csrf` and template token integration if you need CSRF protection.
- Some legacy deps (e.g., `mongoosastic`, `mocha`) exist; they are not currently used in scripts and can be removed or upgraded as needed.
