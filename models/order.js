const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  userName: { type: String, required: true },

  // Order items
  items: [{
    productId: { type: String, required: true },
    productType: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imagepath: { type: String }
  }],

  // Pricing
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 5.00 },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },

  // Shipping address
  shippingAddress: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true }
  },

  // Payment
  paymentMethod: { type: String, required: true, enum: ['credit_card', 'debit_card', 'paypal'] },
  paymentStatus: {
    type: String, required: true, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending'
  },
  transactionId: { type: String },

  // Order status
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  estimatedDelivery: { type: Date }
});

// Generate order number before saving
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
