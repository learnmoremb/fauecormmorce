const mongoose = require('mongoose');

const locationSnapshotSchema = new mongoose.Schema({
  coordinates: { type: [Number], required: true }, // [lng, lat]
  recordedAt: { type: Date, default: Date.now },
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },

  pickupAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    coordinates: { type: [Number], default: [] }, // [lng, lat]
  },

  deliveryAddress: {
    name: String,
    phone: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: String,
    zipCode: String,
    coordinates: { type: [Number], default: [] },
  },

  status: {
    type: String,
    enum: [
      'pending',       // created, awaiting driver assignment
      'assigned',      // driver assigned, not yet accepted
      'accepted',      // driver accepted the job
      'picked_up',     // driver picked up from shop
      'in_transit',    // on the way to customer
      'delivered',     // completed
      'failed',        // could not deliver
      'cancelled',     // cancelled before pickup
    ],
    default: 'pending',
  },

  driverLocationHistory: [locationSnapshotSchema],
  currentDriverLocation: {
    coordinates: { type: [Number], default: [] },
    updatedAt: Date,
  },

  deliveryFee: { type: Number, default: 0 },
  estimatedDistance: { type: Number, default: 0 }, // km
  estimatedDuration: { type: Number, default: 0 }, // minutes

  assignedAt: Date,
  acceptedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,

  notes: String,
  failureReason: String,

  customerRating: { type: Number, min: 1, max: 5 },
  customerReview: String,
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
