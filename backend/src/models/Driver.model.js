const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleType: {
    type: String,
    enum: ['bicycle', 'motorcycle', 'car', 'van', 'truck'],
    required: true,
  },
  vehiclePlate: { type: String, trim: true },
  licenseNumber: { type: String, trim: true },
  photo: { type: String, default: null },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },

  isAvailable: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },

  currentDelivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },
}, { timestamps: true });

driverSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
