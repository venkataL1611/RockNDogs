#!/bin/bash

# Test setup script
# Run before tests to ensure services are running

echo "🚀 Starting test environment..."

# Check if MongoDB is running
if ! docker ps | grep -q rockndogs-mongodb; then
  echo "⚠️  MongoDB container not running"
  echo "Starting Docker services..."
  docker start rockndogs-mongodb rockndogs-elasticsearch rockndogs-redis
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

echo "✨ Test environment ready!"
