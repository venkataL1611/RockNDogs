const express = require('express');

const router = express.Router();
const { trace } = require('@opentelemetry/api');
const Cart = require('../lib/cart');
const DogFood = require('../models/dogfood');
const Supply = require('../models/supply');
const Order = require('../models/order');

const tracer = trace.getTracer('rockndogs-cart');

// Simulate payment gateway (for learning distributed tracing)
async function simulatePaymentGateway(paymentMethod, amount) {
  // Create a custom span for payment processing
  return tracer.startActiveSpan('payment-gateway.process', async (span) => {
    try {
      span.setAttributes({
        'payment.method': paymentMethod,
        'payment.amount': amount,
        'payment.gateway': 'simulated'
      });

      console.log('[PAYMENT_GATEWAY] Processing payment:', paymentMethod, amount);

      // Simulate network delay
      await new Promise((resolve) => {
        setTimeout(resolve, 500 + Math.random() * 1000);
      });

      // Generate random number for testing
      const random = Math.random();
      console.log('[PAYMENT_GATEWAY] Random value:', random, '(fail if < 0.05)');

      // Simulate random failures (5% chance - reduced for better testing)
      if (random < 0.05) {
        console.log('[PAYMENT_GATEWAY] ❌ Payment declined');
        span.setAttributes({
          'payment.status': 'failed',
          'payment.error': 'declined'
        });
        span.recordException(new Error('Payment declined'));
        span.end();
        return {
          status: 'failed',
          message: 'Payment was declined. Please check your payment details and try again.'
        };
      }

      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;

      console.log('[PAYMENT_GATEWAY] ✅ Payment successful:', transactionId);
      span.setAttributes({
        'payment.status': 'success',
        'payment.transaction_id': transactionId
      });
      span.end();

      return {
        status: 'success',
        transactionId,
        amount
      };
    } catch (error) {
      span.recordException(error);
      span.end();
      throw error;
    }
  });
}
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl; // Save the original URL to redirect back after login
  res.redirect('/login');
}

router.get('/cart', ensureAuth, function (req, res) {
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  const { totalPrice } = cart;
  const taxAmount = (totalPrice * 0.08).toFixed(2);
  const grandTotal = (totalPrice + 5 + parseFloat(taxAmount)).toFixed(2);

  res.render('cart/cart', {
    title: 'Your Cart',
    products: cart.generateArray(),
    totalPrice,
    totalQty: cart.totalQty,
    taxAmount,
    grandTotal
  });
});

router.get('/cart/add/:type/:id', ensureAuth, async function (req, res) {
  const productId = req.params.id;
  const { type } = req.params;
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  try {
    let product;
    if (type === 'dogfood') {
      product = await DogFood.findById(productId).exec();
      if (!product) throw new Error('DogFood not found');
    } else if (type === 'supply') {
      const s = await Supply.findById(productId).exec();
      if (!s) throw new Error('Supply not found');
      // Normalize to match cart expectations (Price number)
      product = {
        _id: s._id,
        imagepath: s.imagepath,
        title: s.Title,
        description: s.Title,
        Price: parseFloat(s.Price)
      };
    } else {
      throw new Error('Invalid product type');
    }
    cart.add(product, product._id);
    req.session.cart = cart;
    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Remove item from cart
router.get('/cart/remove/:id', ensureAuth, function (req, res) {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  if (cart.items && cart.items[productId]) {
    cart.totalQty -= cart.items[productId].qty;
    cart.totalPrice -= cart.items[productId].price;
    delete cart.items[productId];
    req.session.cart = cart;
  }

  res.redirect('/cart');
});

// Increase quantity
router.get('/cart/increase/:id', ensureAuth, function (req, res) {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  if (cart.items && cart.items[productId]) {
    cart.items[productId].qty += 1;
    cart.items[productId].price += cart.items[productId].item.Price;
    cart.totalQty += 1;
    cart.totalPrice += cart.items[productId].item.Price;
    req.session.cart = cart;
  }

  res.redirect('/cart');
});

// Decrease quantity
router.get('/cart/decrease/:id', ensureAuth, function (req, res) {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  if (cart.items && cart.items[productId] && cart.items[productId].qty > 1) {
    cart.items[productId].qty -= 1;
    cart.items[productId].price -= cart.items[productId].item.Price;
    cart.totalQty -= 1;
    cart.totalPrice -= cart.items[productId].item.Price;
    req.session.cart = cart;
  }

  res.redirect('/cart');
});

// Checkout page
router.get('/checkout', ensureAuth, function (req, res) {
  if (!req.session.cart || !req.session.cart.totalQty) {
    return res.redirect('/cart');
  }

  const cart = new Cart(req.session.cart);
  const { totalPrice } = cart;
  const taxAmount = (totalPrice * 0.08).toFixed(2);
  const grandTotal = (totalPrice + 5 + parseFloat(taxAmount)).toFixed(2);

  res.render('cart/checkout', {
    title: 'Checkout',
    products: cart.generateArray(),
    totalPrice,
    totalQty: cart.totalQty,
    taxAmount,
    grandTotal
  });
});

// Process checkout - Dummy payment gateway
router.post('/checkout/process', ensureAuth, async function (req, res) {
  console.log('[TRACE] Checkout process started');
  const startTime = Date.now();

  if (!req.session.cart || !req.session.cart.totalQty) {
    return res.redirect('/cart');
  }

  try {
    console.log('[TRACE] Creating order from cart');
    const cart = new Cart(req.session.cart);
    const {
      fullName, address, city, state, zipCode, phone, paymentMethod
    } = req.body;

    // Calculate totals
    const subtotal = cart.totalPrice;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const total = subtotal + 5 + tax;

    // Prepare order items
    const items = cart.generateArray().map((item) => ({
      productId: item.item._id,
      productType: item.item.type || 'dogfood',
      title: item.item.title,
      price: item.item.Price,
      quantity: item.qty,
      imagepath: item.item.imagepath
    }));

    // Simulate payment processing
    console.log('[TRACE] Processing payment via', paymentMethod);
    const paymentResult = await simulatePaymentGateway(paymentMethod, total);
    console.log('[TRACE] Payment result:', paymentResult.status);

    if (paymentResult.status === 'failed') {
      return res.render('cart/payment-failed', {
        title: 'Payment Failed',
        message: paymentResult.message
      });
    }

    // Create order
    console.log('[TRACE] Creating order in database');
    const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const order = new Order({
      orderNumber,
      userId: req.user ? req.user._id : null,
      userEmail: req.user ? req.user.email : 'guest@example.com',
      userName: fullName,
      items,
      subtotal,
      shipping: 5.00,
      tax,
      total,
      shippingAddress: {
        fullName, address, city, state, zipCode, phone
      },
      paymentMethod,
      paymentStatus: 'completed',
      transactionId: paymentResult.transactionId,
      orderStatus: 'confirmed',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await order.save();
    console.log('[TRACE] Order saved:', order.orderNumber);

    // Clear cart
    req.session.cart = null;

    const duration = Date.now() - startTime;
    console.log('[TRACE] Checkout process completed in', duration, 'ms');

    // Redirect to confirmation page
    res.redirect(`/order/confirmation/${order.orderNumber}`);
  } catch (err) {
    console.error('[TRACE] Checkout error:', err);
    res.render('cart/payment-failed', {
      title: 'Order Failed',
      message: 'An error occurred while processing your order. Please try again.'
    });
  }
});

// moved simulatePaymentGateway above

// Order confirmation page
router.get('/order/confirmation/:orderNumber', async function (req, res) {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });

    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }

    res.render('cart/confirmation', {
      title: 'Order Confirmation',
      order
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).render('error', { message: 'Error loading order' });
  }
});

module.exports = router;
