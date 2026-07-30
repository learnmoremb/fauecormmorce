const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name: String,
  image: String,
  variantId: mongoose.Schema.Types.ObjectId,
  color: String,
  size: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
}, { _id: true });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: { type: String, required: true },
    phone: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    zipCode: String,
    coordinates: { type: [Number], default: [] }, // [lng, lat]
  },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: { type: String, default: 'mock_payment' },
  paymentReference: String,
  notes: String,
}, { timestamps: true });

orderSchema.pre('save', function () {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
});

module.exports = mongoose.model('Order', orderSchema);
