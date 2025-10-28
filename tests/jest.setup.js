// Jest setup: set env defaults for tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Default connections for local dev; can be overridden by environment
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_test';
process.env.ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
