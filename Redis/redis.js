const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

client.on('connect', function () {
  console.log('Redis client connected');
});

client.on('error', function (err) {
  console.log(`Something went wrong ${err}`);
});
