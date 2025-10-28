#!/bin/bash

# Run E2E Tests - Local Development Script
# This script sets up the environment and runs E2E tests

set -e  # Exit on error

echo "🧪 RockNDogs E2E Test Runner"
echo "=============================="
echo ""

# Configuration
TEST_DB="shopping_test"
APP_PORT=3000
MONGODB_URI="mongodb://localhost:27017/${TEST_DB}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i ":$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    
    if [ ! -z "$APP_PID" ]; then
        echo "  Stopping application (PID: $APP_PID)..."
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    fi
    
    # Also kill any node processes on port 3000
    if port_in_use 3000; then
        echo "  Killing process on port 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    echo "✅ Cleanup complete"
}

# Register cleanup on exit
trap cleanup EXIT INT TERM

echo "📋 Pre-flight checks..."

# Check if MongoDB is accessible
if ! command_exists mongo && ! command_exists mongosh; then
    echo -e "${YELLOW}⚠️  Warning: MongoDB CLI not found. Assuming port-forward is active.${NC}"
fi

# Test MongoDB connection
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB is accessible on localhost:27017${NC}"
else
    echo -e "${RED}❌ MongoDB is not accessible on localhost:27017${NC}"
    echo ""
    echo "Start MongoDB with one of these methods:"
    echo "  1. Docker Compose: docker compose up -d mongodb"
    echo "  2. Port-forward from K8s: kubectl port-forward -n rockndogs svc/mongodb 27017:27017"
    echo "  3. Local MongoDB: brew services start mongodb-community"
    exit 1
fi

# Check if port 3000 is already in use
if port_in_use 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    read -p "Kill the process and continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "Exiting. Please free port 3000 manually."
        exit 1
    fi
fi

echo ""
echo "🌱 Step 1: Seeding test database..."
NODE_ENV=test MONGODB_URI="$MONGODB_URI" node tests/seed-test-data.js

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to seed test data${NC}"
    exit 1
fi

echo ""
echo "🚀 Step 2: Starting application..."
# Set environment variables for test mode
export NODE_ENV=test
export PORT=$APP_PORT
export MONGODB_URI="$MONGODB_URI"
export ELASTICSEARCH_URL="http://localhost:9200"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"

npm start > /tmp/e2e-app.log 2>&1 &
APP_PID=$!

echo "  Application PID: $APP_PID"
echo "  Logs: /tmp/e2e-app.log"

echo ""
echo "⏳ Step 3: Waiting for application to be ready..."
npx wait-on http://localhost:$APP_PORT -t 30000

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Application failed to start${NC}"
    echo ""
    echo "Application logs:"
    tail -n 50 /tmp/e2e-app.log
    exit 1
fi

echo -e "${GREEN}✅ Application is ready${NC}"

echo ""
echo "🧪 Step 4: Running E2E tests..."
TEST_URL="http://localhost:$APP_PORT" npm run test:e2e

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ All E2E tests passed!${NC}"
else
    echo -e "${RED}❌ Some E2E tests failed${NC}"
    echo ""
    echo "Application logs (last 30 lines):"
    tail -n 30 /tmp/e2e-app.log
fi

exit $TEST_RESULT
