#!/bin/bash

# Automated Testing & Linting Setup Script
# Run this script to complete the installation

echo "🚀 Setting up automated testing and linting..."

# Install testing and linting dependencies
echo "📦 Installing dependencies..."
npm install --save-dev jest@^29.0.0 puppeteer@^21.0.0 eslint@^8.57.0 \
  eslint-config-airbnb-base@^15.0.0 eslint-plugin-import@^2.29.0 \
  husky@^8.0.0 lint-staged@^15.0.0 supertest@^6.3.0 wait-on@^7.0.0 \
  prettier@^3.0.0

# Initialize Husky
echo "🎣 Setting up Husky hooks..."
npx husky install

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x tests/setup.sh

# Run initial linting
echo "🔍 Running initial lint check..."
npm run lint:fix || true

# Display success message
echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Available commands:"
echo "  npm test              - Run all tests"
echo "  npm run test:unit     - Run unit tests"
echo "  npm run test:e2e      - Run E2E tests"
echo "  npm run test:coverage - Generate coverage report"
echo "  npm run lint          - Check code quality"
echo "  npm run lint:fix      - Fix code quality issues"
echo ""
echo "🎉 Automated testing is now active!"
echo "   Tests and linting will run automatically on git commit"
echo ""
echo "📖 See TESTING.md for full documentation"
