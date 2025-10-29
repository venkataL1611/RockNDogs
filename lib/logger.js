// Lightweight structured logger compatible with ELK
// - JSON logs to stdout by default
// - Optional direct shipping to Elasticsearch via pino-elasticsearch
// - Express request logging via pino-http

const pino = require('pino');
const pinoHttp = require('pino-http');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_TO_ELASTICSEARCH = String(process.env.LOG_TO_ELASTICSEARCH || 'false').toLowerCase() === 'true';
const ES_NODE = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const LOG_INDEX = process.env.LOG_INDEX || 'rockndogs-logs';

// Build base logger
function buildLogger() {
  const base = { service: 'rockndogs', env: NODE_ENV };

  // In test environment, use minimal logging to avoid Jest issues
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
    return pino({
      level: 'silent', // silent in tests by default
      base
    });
  }

  // Pretty print for local dev only (optional, no extra dep required at runtime)
  const usePretty = NODE_ENV !== 'production' && process.env.LOG_PRETTY !== 'false';

  // Optional direct ES transport (bypass Logstash). If false, emit to stdout for cluster log collectors.
  let transport;
  if (LOG_TO_ELASTICSEARCH) {
    transport = {
      target: 'pino-elasticsearch',
      options: {
        node: ES_NODE,
        index: LOG_INDEX,
        // ensure ECS-like fields; leave defaults for simplicity
        'es-version': 7,
        'flush-bytes': 1000,
        'flush-interval': 2000
      }
    };
  } else if (usePretty) {
    transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: true,
        ignore: 'pid,hostname'
      }
    };
  }

  return pino(
    {
      level: LOG_LEVEL,
      base,
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'session', 'token'],
        remove: true
      }
    },
    transport
  );
}

const log = buildLogger();

// HTTP logger middleware for Express
const httpLogger = pinoHttp({
  logger: log,
  autoLogging: { ignore: (req) => req.url === '/health' },
  customProps: (req) => ({
    ip: req.ip,
    userId: req.user && (req.user.email || req.user._id),
    sessionId: req.sessionID
  }),
  wrapSerializers: true
});

module.exports = { log, httpLogger };
