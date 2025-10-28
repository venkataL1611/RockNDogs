#!/bin/bash

# Test setup script
# Run before tests to ensure services are running

#!/usr/bin/env bash
set -euo pipefail

echo "Running test setup..."

# Set sensible defaults if not set
export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/shopping_test}
export ELASTICSEARCH_URL=${ELASTICSEARCH_URL:-http://localhost:9200}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}
export TEST_URL=${TEST_URL:-http://localhost:3000}

echo "Env for tests:"
echo "- MONGODB_URI=$MONGODB_URI"
echo "- ELASTICSEARCH_URL=$ELASTICSEARCH_URL"
echo "- REDIS_HOST=$REDIS_HOST:$REDIS_PORT"
echo "- TEST_URL=$TEST_URL"

# Seed user and sample data (safe for test DB)
node tests/seed-user.js || true
node tests/seed-test-data.js || true

echo "✨ Test environment ready!"

# Optional: manage Docker services only if explicitly requested
if [ "${USE_DOCKER:-0}" = "1" ]; then
  echo "🐳 USE_DOCKER=1 set — ensuring Docker services are running..."
  # Check if MongoDB is running
  if ! docker ps | grep -q rockndogs-mongodb; then
    echo "⚠️  MongoDB container not running"
    echo "Starting Docker services..."
    docker start rockndogs-mongodb rockndogs-elasticsearch rockndogs-redis || true
    sleep 5
  fi

  # Check if services are healthy
  if docker ps | grep -q rockndogs-mongodb; then
    echo "✅ MongoDB is running"
  else
    echo "❌ MongoDB failed to start"
    exit 1
  fi

  if docker ps | grep -q rockndogs-elasticsearch; then
    echo "✅ Elasticsearch is running"
  else
    echo "⚠️  Elasticsearch is not running"
  fi

  if docker ps | grep -q rockndogs-redis; then
    echo "✅ Redis is running"
  else
    echo "⚠️  Redis is not running"
  fi
else
  echo "⏭️  Skipping Docker service checks (using k8s/minikube port-forwards). Set USE_DOCKER=1 to enable."
fi

echo "✨ Test environment ready!"
