const redis = require('redis');
const { log } = require('../lib/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

client.on('connect', function () {
  log.info('Redis client connected');
});

client.on('error', function (err) {
  log.error({ err }, 'Redis client error');
});
