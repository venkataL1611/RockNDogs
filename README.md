# RockNDogs

An end to end E commerce application
RockNDogs is a Petstore application that stores information about various brands of Petfood. This application was built to get a basic understanding of how NoSQL Database work, how products can be searched using Powerful ElasticSearch, how to cache data that a web server needs and Content Delivery Network for improved performance.
Most of the code is based on Express Documentation , This website is Built by following a Youtube Tutorial by MaxMillian Shopping cart using Nodejs.
Link to tutorial : https://www.youtube.com/watch?v=-3vvxn78MH4
References:
https://expressjs.com/
https://www.npmjs.com/
https://docs.mongodb.com/manual/
https://www.compose.com/articles/mongoosastic-the-power-of-mongodb-and-elasticsearch-together/
https://css-tricks.com/adding-a-cdn-to-your-website/

## Requirements & component versions

Minimum required components and the versions used when this project was developed and tested:

- Node.js: 18.x LTS
- npm: 9.x+ (bundled with Node 18)
- MongoDB: 6.0 (see `docker-compose.yml` uses `mongo:6.0`)
- Elasticsearch: 7.17.14 (see `docker-compose.yml`)
- Redis: 7 (docker image `redis:7-alpine` used)

Main backend Node packages (from `package.json`):

- express: ^4.16.3
- mongoose: ^5.3.1
- mongoosastic: ^5.0.0
- @elastic/elasticsearch: ^7.17.14
- passport, passport-local: ^0.4.0, ^1.0.0
- express-session: ^1.15.6
- redis: ^2.8.0

Dev/test:

- jest: ^29
- eslint: ^8
- prettier: ^3
- puppeteer: ^21
- supertest: ^6

Notes:

- Elasticsearch 7.x clients are used in this codebase; if you upgrade to Elasticsearch 8.x you'll need to update the client usage and security settings.
- The project uses Docker Compose to run MongoDB, Elasticsearch and Redis (see `docker-compose.yml`). Using Docker is the recommended way to ensure compatibility.

Quick start (using Docker Compose):

```bash
# start dependencies
docker compose up -d

# install node dependencies (if you run the app locally)
npm install

# run the app
npm start
```

If you prefer not to use Docker, install MongoDB, Elasticsearch and Redis locally matching the versions above. Ensure ES is accessible on port 9200 and MongoDB on 27017.

## Tech Stack (2025 update)

- Backend: Node.js 18, Express
- Views: Handlebars/EJS (server-rendered)
- Data: MongoDB (Mongoose ODM), seeders for categories/products
- Search: Elasticsearch 7.x (mongoosastic integration)
- Cache/Session: Redis (cache; session optional)
- CI/CD: GitHub Actions with lint, unit, E2E, security, build, docker-build, manifest bump
- Containerization: Docker (GHCR), multi-arch images (linux/amd64, linux/arm64)
- GitOps: ArgoCD watches Kubernetes manifests and rolls out on manifest change
- Testing: Jest (unit + E2E with Puppeteer), Supertest, ESLint (Airbnb)
- Observability: OpenTelemetry hooks available (optional)

## CI/CD and GitOps

- Workflow lives at `.github/workflows/ci.yml`.
- On pull requests to `main`: lint, tests, and security checks run.
- On push to `main`: a Docker image is built and pushed to GHCR with tags `<short-sha>` and `latest`.
- The workflow then updates the Kubernetes deployment manifest to reference the new image tag and commits that change.
- ArgoCD detects the manifest change and performs a rolling deployment.
- Images are published for both `linux/amd64` and `linux/arm64` so ARM nodes can pull successfully.

See also: `docs/CI-CD-GITOPS-FLOW.md` for diagrams, permissions, rollback, and troubleshooting.

## Feature Flags

- Feature flags enable/disable code paths at runtime (including % rollouts) without code changes.
- Flags are supplied via an environment variable (e.g., `FEATURE_FLAGS_JSON`) and evaluated per request.
- Server routes can gate logic via a helper (e.g., `req.isFlagOn('flagName')`), and views can toggle sections with `res.locals.flags`.
- In Kubernetes, flags can be set in a ConfigMap and rolled out via GitOps.

## Dependencies: dev vs prod

- Runtime dependencies (`dependencies`) include Express, Mongoose, Redis client, Elasticsearch client, etc.
- Development dependencies (`devDependencies`) include ESLint, Jest, Supertest, Puppeteer, Husky, Prettier, etc.
- Production installs use `npm ci --omit=dev` to avoid installing dev tools.
- The `prepare` script is guarded so production installs do not fail when Husky isn’t present.

## Testing

- Unit/Integration: Jest + Supertest.
- E2E: Jest + Puppeteer; the suite seeds data, starts the app, waits for readiness, then runs tests.
- In CI, MongoDB/Elasticsearch/Redis run as services for tests.
