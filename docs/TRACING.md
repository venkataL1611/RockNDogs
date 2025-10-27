# Distributed Tracing with Jaeger & OpenTelemetry

This application is instrumented with OpenTelemetry to send distributed traces to Jaeger for visualization and performance analysis.

## 🎯 What You Get

- **Request visualization**: See the complete journey of each HTTP request
- **Performance insights**: Identify slow operations and bottlenecks
- **Service dependencies**: Understand how components interact
- **Custom spans**: Payment gateway and other critical operations are tracked
- **Auto-instrumentation**: Express, MongoDB, Redis, and HTTP calls are automatically traced

## 🚀 Quick Start

### 1. Start Jaeger

```bash
docker-compose up -d jaeger
```

This starts Jaeger All-in-One with:
- UI: http://localhost:16686
- OTLP HTTP: http://localhost:4318
- OTLP gRPC: http://localhost:4317

### 2. Start the Application

```bash
npm start
```

You'll see:
```
✅ OpenTelemetry tracing initialized
📊 Sending traces to: http://localhost:4318/v1/traces
```

### 3. Generate Traces

Make requests to your application:

```bash
# Browse products
curl http://localhost:3000/shop/dogfoods

# Search
curl http://localhost:3000/api/search?q=pedigree

# View supply page
curl http://localhost:3000/shop/supply
```

### 4. View Traces in Jaeger UI

1. Open http://localhost:16686 in your browser
2. Select **rockndogs-shop** from the Service dropdown
3. Click **Find Traces**
4. Click on any trace to see the detailed span timeline

## 📊 What's Instrumented

### Automatic Instrumentation

OpenTelemetry automatically traces:

- **HTTP requests**: All incoming and outgoing HTTP calls
- **Express routes**: Route handling, middleware execution
- **MongoDB queries**: Database operations with query details
- **Redis operations**: Cache reads and writes
- **Mongoose**: ORM operations

### Custom Spans

We've added manual instrumentation for business-critical operations:

#### Payment Gateway (`routes/cart.js`)

```javascript
const tracer = trace.getTracer('rockndogs-cart');

async function simulatePaymentGateway(paymentMethod, amount) {
  return tracer.startActiveSpan('payment-gateway.process', async (span) => {
    span.setAttributes({
      'payment.method': paymentMethod,
      'payment.amount': amount,
      'payment.gateway': 'simulated',
    });
    
    // ... payment logic ...
    
    span.end();
  });
}
```

## 🔍 Understanding Traces

### Trace Structure

Each trace shows:
- **Service name**: `rockndogs-shop`
- **Operation**: HTTP method + route (e.g., `GET /shop/dogfoods`)
- **Duration**: Total time for the request
- **Spans**: Individual operations within the request

### Reading a Span

Each span includes:
- **Operation name**: What was executed
- **Duration**: How long it took
- **Tags/Attributes**: Metadata (HTTP status, database queries, etc.)
- **Logs/Events**: Timestamped events during execution

### Example Trace Flow

```
GET /checkout/process (3.2s total)
├── middleware.ensureAuth (5ms)
├── database.find.cart (12ms)
├── payment-gateway.process (1.8s)  ← Custom span
│   ├── payment.method: "credit_card"
│   ├── payment.amount: 89.99
│   └── payment.transaction_id: "TXN..."
├── database.insert.order (45ms)
└── render.confirmation (120ms)
```

## 🛠 Configuration

### Environment Variables

```bash
# Change Jaeger endpoint (default: http://localhost:4318/v1/traces)
export OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces

# Start app with custom endpoint
npm start
```

### Tracing Configuration (`tracing.js`)

```javascript
const sdk = new NodeSDK({
  serviceName: 'rockndogs-shop',  // Change service name
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/favicon.ico'],  // Skip these
      },
      '@opentelemetry/instrumentation-mongodb': {
        enabled: true,  // Trace MongoDB
      },
      // ... more config
    }),
  ],
});
```

## 📈 Use Cases

### 1. Find Slow Operations

1. Go to Jaeger UI
2. Set **Min Duration** to 1s
3. Click **Find Traces**
4. Examine slow requests to identify bottlenecks

### 2. Debug Payment Failures

1. Search for traces with tag: `payment.status=failed`
2. Examine the payment-gateway span
3. Check logs and error attributes

### 3. Monitor Database Performance

1. Filter spans by operation: `mongodb.*`
2. Sort by duration
3. Identify slow queries

### 4. Analyze Request Patterns

1. View the **System Architecture** tab
2. See service dependencies
3. Understand call patterns

## 🔧 Adding Custom Spans

To trace your own operations:

```javascript
const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('your-module-name');

async function yourFunction() {
  return tracer.startActiveSpan('operation-name', async (span) => {
    try {
      // Add attributes
      span.setAttributes({
        'custom.key': 'value',
        'user.id': userId,
      });
      
      // Your code here
      const result = await doSomething();
      
      // Record events
      span.addEvent('processing_complete', {
        'items.count': result.length,
      });
      
      span.end();
      return result;
    } catch (error) {
      // Record exceptions
      span.recordException(error);
      span.end();
      throw error;
    }
  });
}
```

## 🐳 Docker Compose Setup

The `docker-compose.yml` includes:

```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  environment:
    - COLLECTOR_OTLP_ENABLED=true
  ports:
    - "16686:16686"  # UI
    - "4318:4318"    # OTLP HTTP
    - "4317:4317"    # OTLP gRPC
```

## 🎓 Learning Resources

- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Distributed Tracing Concepts](https://opentelemetry.io/docs/concepts/observability-primer/#distributed-traces)

## 🚨 Troubleshooting

### Traces Not Appearing

1. **Check Jaeger is running**:
   ```bash
   docker ps | grep jaeger
   ```

2. **Verify exporter URL**:
   ```bash
   # Should print: http://localhost:4318/v1/traces
   grep "Sending traces" logs/app.log
   ```

3. **Test Jaeger endpoint**:
   ```bash
   curl http://localhost:14269/
   ```

### High Overhead

If tracing causes performance issues:

1. **Disable unused instrumentations** in `tracing.js`:
   ```javascript
   '@opentelemetry/instrumentation-fs': { enabled: false },
   ```

2. **Use sampling** (not implemented yet, but can be added):
   ```javascript
   sampler: new TraceIdRatioBasedSampler(0.5),  // Sample 50%
   ```

## 📝 Next Steps

- **Add metrics**: Integrate OpenTelemetry metrics for Prometheus
- **Add logging**: Correlate logs with traces
- **Production setup**: Use Jaeger in production mode with Cassandra/Elasticsearch backend
- **Sampling**: Implement head-based or tail-based sampling for high-traffic scenarios

---

**Happy Tracing! 🔍**
