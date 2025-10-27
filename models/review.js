const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, required: true },
  productType: { type: String, required: true, enum: ['dogfood', 'supply'] },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userEmail: { type: String },
  rating: {
    type: Number, required: true, min: 1, max: 5
  },
  reviewTitle: { type: String, required: true },
  reviewText: { type: String, required: true },
  helpful: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
reviewSchema.index({ productId: 1, productType: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
