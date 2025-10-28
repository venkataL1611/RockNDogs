# E2E Test Troubleshooting Guide

## Quick Fix: Run E2E Tests Locally

The E2E tests require:

1. **MongoDB** with test data seeded
2. **Application** running on port 3000
3. **Elasticsearch** (optional, has fallback)
4. **Redis** (optional, has fallback)

### Easy Way: Use the Helper Script

```bash
# This script does everything for you:
npm run test:e2e:local
```

The script will:

- ✅ Check MongoDB is accessible
- ✅ Seed test data
- ✅ Start the app on port 3000
- ✅ Run E2E tests
- ✅ Clean up after tests

### Manual Way (Step by Step)

If you prefer to run steps manually:

#### 1. Ensure MongoDB is running

**Option A: Via Kubernetes port-forward (if using minikube)**

```bash
kubectl port-forward -n rockndogs svc/mongodb 27017:27017 &
```

**Option B: Via Docker Compose**

```bash
docker compose up -d mongodb
```

**Option C: Local MongoDB**

```bash
brew services start mongodb-community
```

#### 2. Seed test data

```bash
NODE_ENV=test MONGODB_URI=mongodb://localhost:27017/shopping_test \
  node tests/seed-test-data.js
```

#### 3. Start the application

```bash
NODE_ENV=test PORT=3000 MONGODB_URI=mongodb://localhost:27017/shopping_test \
  npm start &
```

Wait for app to be ready:

```bash
npx wait-on http://localhost:3000 -t 30000
```

#### 4. Run E2E tests

```bash
TEST_URL=http://localhost:3000 npm run test:e2e
```

#### 5. Clean up

```bash
# Kill the app
pkill -f "node ./bin/www"
```

## Common Issues

### Issue: "Expected products.length > 0, Received: 0"

**Cause:** Database is empty—no test data seeded.

**Fix:**

```bash
# Seed test data first
NODE_ENV=test MONGODB_URI=mongodb://localhost:27017/shopping_test \
  node tests/seed-test-data.js
```

### Issue: "MongoDB connection error"

**Cause:** MongoDB is not running or not accessible on localhost:27017.

**Fix:**

```bash
# Check if MongoDB is accessible
nc -zv localhost 27017

# If not, start it via one of the methods above
kubectl port-forward -n rockndogs svc/mongodb 27017:27017 &
```

### Issue: "Port 3000 is already in use"

**Cause:** Another process is using port 3000.

**Fix:**

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start &
TEST_URL=http://localhost:3001 npm run test:e2e
```

### Issue: "Application failed to start"

**Cause:** Missing dependencies or environment issues.

**Fix:**

```bash
# Check application logs
tail -n 50 /tmp/e2e-app.log

# Ensure dependencies are installed
npm ci

# Try starting manually to see errors
NODE_ENV=test PORT=3000 npm start
```

### Issue: "Cannot find module 'puppeteer/.../chrome'"

**Cause:** Puppeteer's Chrome binary is missing.

**Fix:**

```bash
# Reinstall puppeteer
npm rebuild puppeteer

# Or install Chrome manually
npx puppeteer browsers install chrome
```

### Issue: Tests pass locally but fail in CI

**Cause:** Different environment setup between local and CI.

**Fix:**

- CI uses fresh databases and always seeds data
- Check `.github/workflows/ci.yml` for exact setup steps
- Ensure local environment matches CI (MongoDB version, Node version)

## Environment Variables

E2E tests use these environment variables:

| Variable            | Default                                   | Description                         |
| ------------------- | ----------------------------------------- | ----------------------------------- |
| `TEST_URL`          | `http://localhost:3000`                   | Application URL for tests           |
| `MONGODB_URI`       | `mongodb://localhost:27017/shopping_test` | Test database connection            |
| `NODE_ENV`          | `test`                                    | Environment mode                    |
| `PORT`              | `3000`                                    | Application port                    |
| `ELASTICSEARCH_URL` | `http://localhost:9200`                   | Elasticsearch connection (optional) |
| `REDIS_HOST`        | `localhost`                               | Redis host (optional)               |
| `REDIS_PORT`        | `6379`                                    | Redis port (optional)               |

## GitHub Actions Workflow

The CI workflow (`.github/workflows/ci.yml`) runs E2E tests automatically:

```yaml
- name: Seed Test Data
  run: node tests/seed-test-data.js
  env:
    NODE_ENV: test
    MONGODB_URI: mongodb://localhost:27017/shopping_test

- name: Start Application
  run: npm start &
  env:
    NODE_ENV: test
    PORT: 3000

- name: Wait for Application
  run: npx wait-on http://localhost:3000 -t 30000

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    TEST_URL: http://localhost:3000
```

## Test Data

The seeding script (`tests/seed-test-data.js`) creates:

- **3 dog food products** (Pedigree, Victor, Victor Plus)
- **3 supplies** (Dog Leash, Dog Bowl, Dog Toy)

All in the `shopping_test` database (never production!).

## Verifying Test Data

Check if data was seeded correctly:

```bash
# Using mongosh (newer)
mongosh mongodb://localhost:27017/shopping_test
> db.dogfoods.countDocuments()
> db.supplies.countDocuments()

# Using mongo (older)
mongo mongodb://localhost:27017/shopping_test
> db.dogfoods.count()
> db.supplies.count()
```

Expected: 3 dogfoods, 3 supplies.

## Running Specific E2E Tests

```bash
# Run only one test file
npm run test:e2e -- tests/e2e/app.test.js

# Run tests matching a pattern
npm run test:e2e -- -t "Product Browsing"

# Run with verbose output
npm run test:e2e -- --verbose

# Run with Puppeteer in non-headless mode (see browser)
HEADLESS=false npm run test:e2e
```

## Debugging E2E Tests

### Enable Puppeteer debugging

Edit `tests/e2e/app.test.js`:

```javascript
const launchOptions = {
  headless: false, // See the browser
  devtools: true, // Open DevTools
  slowMo: 250, // Slow down by 250ms
  // ... rest
};
```

### Take screenshots on failure

Add to your test:

```javascript
afterEach(async () => {
  if (page && global.testFailed) {
    await page.screenshot({ path: `test-failure-${Date.now()}.png` });
  }
});
```

### View application logs during tests

```bash
# In one terminal: tail logs
tail -f /tmp/e2e-app.log

# In another terminal: run tests
npm run test:e2e:local
```

## Best Practices

1. **Always seed data** before E2E tests (done automatically by helper script)
2. **Use test database** (`shopping_test`), never production
3. **Clean up** after tests (kill app, clear ports)
4. **Port conflicts**: Use unique ports if running multiple test suites
5. **CI parity**: Match local environment to CI as closely as possible

## Quick Commands Reference

```bash
# Full E2E test suite (recommended)
npm run test:e2e:local

# Manual MongoDB check
nc -zv localhost 27017

# Check what's on port 3000
lsof -i:3000

# Kill port 3000
lsof -ti:3000 | xargs kill -9

# View app logs
tail -f /tmp/e2e-app.log

# Seed only
NODE_ENV=test node tests/seed-test-data.js

# Check seeded data
mongosh mongodb://localhost:27017/shopping_test --eval "db.dogfoods.countDocuments()"
```

## Getting Help

If tests still fail after following this guide:

1. Check application logs: `tail -n 100 /tmp/e2e-app.log`
2. Verify MongoDB: `mongosh mongodb://localhost:27017/shopping_test`
3. Check CI workflow: `.github/workflows/ci.yml` for exact setup
4. Review test expectations: `tests/e2e/app.test.js`

## Related Documentation

- E2E Test File: `tests/e2e/app.test.js`
- Seeding Script: `tests/seed-test-data.js`
- CI Workflow: `.github/workflows/ci.yml`
- Helper Script: `scripts/run-e2e-tests.sh`
