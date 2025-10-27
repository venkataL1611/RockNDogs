/**
 * OpenTelemetry Tracing Configuration
 * Sets up distributed tracing with Jaeger for request visualization
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// Configure the trace exporter to send traces to Jaeger
const jaegerEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
const traceExporter = new OTLPTraceExporter({
  // Jaeger OTLP HTTP endpoint (default port 4318)
  url: jaegerEndpoint,
});

// Initialize the OpenTelemetry SDK
const sdk = new NodeSDK({
  serviceName: 'rockndogs-shop',
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Automatically instrument these libraries
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingPaths: ['/health', '/favicon.ico'],
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongodb': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongoose': {
        enabled: true,
      },
      // Disable instrumentations we don't use
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
    }),
  ],
});

// Start the SDK (synchronous, no promise)
try {
  sdk.start();
  console.log('✅ OpenTelemetry tracing initialized');
  console.log(`📊 Sending traces to: ${jaegerEndpoint}`);
} catch (err) {
  console.error('❌ Error initializing tracing:', err);
}

// Gracefully shut down on process exit
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('🛑 Tracing terminated'))
    .catch((err) => console.error('Error shutting down tracing', err))
    .finally(() => process.exit(0));
});

module.exports = sdk;
