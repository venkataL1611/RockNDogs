# Testing Guide

## Overview
This project includes comprehensive automated testing with Jest, Puppeteer, ESLint, and Husky for pre-commit hooks.

## Test Structure

```
tests/
├── e2e/           # End-to-end tests with Puppeteer
│   └── app.test.js
├── unit/          # Unit and integration tests
│   └── api.test.js
└── setup.sh       # Test environment setup script
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Linting

### Check for lint errors
```bash
npm run lint
```

### Auto-fix lint errors
```bash
npm run lint:fix
```

## Pre-commit Hooks

Husky is configured to automatically run linting and tests before each commit:

1. **Lint-staged**: Runs ESLint on staged files
2. **Format**: Auto-fixes code style issues
3. **Tests**: Runs relevant tests

### Manual Hook Setup
If hooks aren't working, run:
```bash
npm run prepare
```

## Test Coverage

### What's Tested

#### E2E Tests (Puppeteer)
- ✅ Homepage loading and navigation
- ✅ Authentication (login/signup flows)
- ✅ Product browsing (dog foods & supplies)
- ✅ Search functionality (live search)
- ✅ Cart operations (authenticated/unauthenticated)
- ✅ Categories dropdown
- ✅ Security headers validation
- ✅ Responsive design (mobile/tablet)
- ✅ Performance metrics

#### Unit Tests (Jest + Supertest)
- ✅ API endpoints
- ✅ Route handlers
- ✅ Security middleware
- ✅ Error handling
- ✅ 404 pages

### Coverage Goals
- **Lines**: > 70%
- **Functions**: > 70%
- **Branches**: > 60%

## CI/CD Pipeline

GitHub Actions workflow runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Pipeline Stages
1. **Lint**: ESLint code quality check
2. **Test**: Unit and E2E tests with Docker services
3. **Security**: npm audit and Snyk scanning
4. **Coverage**: Upload to Codecov

## Prerequisites

### Local Development
```bash
# Install dependencies
npm install

# Ensure Docker services are running
docker ps  # Should show: mongodb, elasticsearch, redis

# Run tests
npm test
```

### Required Services
- MongoDB (port 27017)
- Elasticsearch (port 9200)
- Redis (port 6379)
- Application server (port 3000)

## Troubleshooting

### Tests Failing
```bash
# Check if services are running
docker ps

# Restart services
docker restart rockndogs-mongodb rockndogs-elasticsearch rockndogs-redis

# Clear Jest cache
npx jest --clearCache
```

### Puppeteer Issues
```bash
# Install Chromium dependencies (Linux)
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
  libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 lsb-release wget xdg-utils

# macOS - no additional setup needed
```

### Lint Errors
```bash
# Auto-fix most errors
npm run lint:fix

# Check specific files
npx eslint path/to/file.js
```

## Writing New Tests

### E2E Test Example
```javascript
test('should do something', async () => {
  await page.goto(`${BASE_URL}/some-page`);
  await page.click('button#submit');
  await page.waitForNavigation();
  
  const result = await page.$eval('#result', el => el.textContent);
  expect(result).toBe('Expected Value');
});
```

### Unit Test Example
```javascript
test('should return success', async () => {
  const response = await request(app)
    .get('/api/endpoint')
    .expect(200);
  
  expect(response.body).toHaveProperty('data');
});
```

## Best Practices

1. **Always run tests locally before pushing**
2. **Write tests for new features**
3. **Update tests when changing functionality**
4. **Keep tests fast and isolated**
5. **Use descriptive test names**
6. **Mock external services when appropriate**

## Continuous Integration

The CI pipeline ensures:
- Code quality (linting)
- Test coverage
- Security vulnerabilities are caught
- All tests pass before merge

### Status Badges
Add to README.md:
```markdown
![CI](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/REPO)
```

## Support

For issues with tests:
1. Check test logs: `npm test -- --verbose`
2. Run tests in watch mode: `npm run test:watch`
3. Check GitHub Actions logs for CI failures
4. Review ESLint output: `npm run lint`
