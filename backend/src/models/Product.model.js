const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  color: { type: String, trim: true },
  size: { type: String, trim: true },
  material: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, trim: true },
  images: [{ type: String }],
}, { _id: true });

const productSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: ['electronics', 'fashion', 'home', 'sports', 'beauty', 'food', 'books', 'toys', 'other'],
    required: true,
  },
  basePrice: { type: Number, required: true, min: 0 },
  variants: [variantSchema],
  tags: [{ type: String, lowercase: true, trim: true }],
  images: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  attributes: { type: Map, of: String },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ shop: 1, category: 1 });
productSchema.index({ basePrice: 1 });

module.exports = mongoose.model('Product', productSchema);
