const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, trim: true },
  logo: { type: String, default: null },
  banner: { type: String, default: null },
  category: {
    type: String,
    enum: ['electronics', 'fashion', 'home', 'sports', 'beauty', 'food', 'books', 'toys', 'other'],
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: { type: [Number], default: [] }, // [lng, lat]
  },
  phone: String,
  email: String,
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

shopSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  }
});

module.exports = mongoose.model('Shop', shopSchema);
