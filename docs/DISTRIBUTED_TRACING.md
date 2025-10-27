# Distributed Tracing - E-Commerce Transaction Flow

## Overview
This document explains the complete transaction flow from adding items to cart through payment processing, demonstrating distributed tracing concepts.

## Transaction Flow

### 1. Add to Cart
**Route**: `GET /cart/add/:type/:id`
**Trace Points**:
- Product lookup from database (DogFood or Supply collection)
- Cart session update
- Response redirect

### 2. View Cart
**Route**: `GET /cart`
**Trace Points**:
- Load cart from session
- Calculate subtotal, tax, shipping
- Render cart view

### 3. Cart Operations
- **Increase Quantity**: `GET /cart/increase/:id`
- **Decrease Quantity**: `GET /cart/decrease/:id`
- **Remove Item**: `GET /cart/remove/:id`

Each operation:
- Reads cart from session
- Updates cart state
- Persists to session
- Redirects back to cart

### 4. Checkout Page
**Route**: `GET /checkout`
**Trace Points**:
- Validate cart exists and has items
- Load cart details
- Calculate final totals
- Render checkout form

### 5. Process Payment
**Route**: `POST /checkout/process`
**Trace Points** (with timing):
```
[TRACE] Checkout process started
[TRACE] Creating order from cart
[TRACE] Processing payment via <method>
[PAYMENT_GATEWAY] Processing payment: <method> <amount>
[PAYMENT_GATEWAY] Payment successful: <transactionId>
[TRACE] Payment result: success
[TRACE] Creating order in database
[TRACE] Order saved: <orderNumber>
[TRACE] Checkout process completed in <duration> ms
```

**Steps**:
1. Validate cart
2. Extract shipping and payment details from form
3. Calculate order totals
4. Call payment gateway simulation
5. Create order in database
6. Clear cart
7. Redirect to confirmation

### 6. Payment Gateway Simulation
**Function**: `simulatePaymentGateway()`
**Behavior**:
- Simulates network latency (500-1500ms)
- 10% random failure rate
- Generates transaction ID on success
- Returns payment result object

### 7. Order Confirmation
**Route**: `GET /order/confirmation/:orderNumber`
**Trace Points**:
- Lookup order by order number
- Render confirmation with order details

## Distributed Tracing Concepts Demonstrated

### 1. Request Flow Tracing
Each request follows a path through multiple services:
```
User Request → Cart Service → Payment Gateway → Database → Response
```

### 2. Trace IDs
- Order Number acts as correlation ID
- Transaction ID from payment gateway
- Timestamps for duration tracking

### 3. Span Hierarchy
```
CheckoutProcess (Parent Span)
├── ValidateCart
├── ProcessPayment (External Service)
│   ├── AuthorizePayment
│   └── CapturePayment
├── CreateOrder (Database)
└── ClearSession
```

### 4. Service Dependencies
- **Cart Service** → Session Storage
- **Checkout Service** → Cart Service, Payment Gateway, Database
- **Payment Gateway** → External Payment Processor (simulated)
- **Order Service** → MongoDB

### 5. Performance Metrics
Console logs show:
- Operation duration
- Service response times
- Success/failure rates

## Testing Scenarios

### Success Flow
1. Add products to cart
2. Navigate to cart
3. Click "Proceed to Checkout"
4. Fill shipping address
5. Select payment method
6. Click "Place Order"
7. See confirmation page (90% probability)

### Failure Flow
1. Same as success through step 6
2. Payment fails (10% probability)
3. See payment failed page
4. Cart items preserved
5. Can retry payment

## Extending with OpenTelemetry

To add real distributed tracing:

```javascript
// Install: npm install @opentelemetry/api @opentelemetry/sdk-node

const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('rockndogs-checkout');

// Wrap checkout process
router.post('/checkout/process', async function(req, res) {
  const span = tracer.startSpan('checkout.process');
  
  try {
    span.addEvent('cart.validate');
    // ... cart validation
    
    span.addEvent('payment.start');
    const paymentSpan = tracer.startSpan('payment.gateway', { parent: span });
    const paymentResult = await simulatePaymentGateway(...);
    paymentSpan.end();
    
    span.addEvent('order.create');
    const orderSpan = tracer.startSpan('order.save', { parent: span });
    await order.save();
    orderSpan.end();
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR });
  } finally {
    span.end();
  }
});
```

## Monitoring Points

Key metrics to track:
- Cart abandonment rate
- Average checkout duration
- Payment success rate (currently 90%)
- Order creation time
- Payment gateway response time (500-1500ms simulated)

## Current Console Output Example

```
[TRACE] Checkout process started
[TRACE] Creating order from cart
[TRACE] Processing payment via credit_card
[PAYMENT_GATEWAY] Processing payment: credit_card 78.99
[PAYMENT_GATEWAY] Payment successful: TXN172999234567890
[TRACE] Payment result: success
[TRACE] Creating order in database
[TRACE] Order saved: ORD172999234568123
[TRACE] Checkout process completed in 1247 ms
```

This demonstrates the complete request lifecycle for learning distributed tracing!
