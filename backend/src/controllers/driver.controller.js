const { validationResult } = require('express-validator');
const Driver = require('../models/Driver.model');
const Delivery = require('../models/Delivery.model');
const { success, error } = require('../utils/apiResponse');

exports.registerDriver = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, 'Validation failed', 400, errors.array());

    const existing = await Driver.findOne({ user: req.user._id });
    if (existing) return error(res, 'Driver profile already exists', 409);

    const { vehicleType, vehiclePlate, licenseNumber } = req.body;
    const driverData = { user: req.user._id, vehicleType, vehiclePlate, licenseNumber };
    if (req.file) driverData.photo = `/uploads/${req.file.filename}`;

    const driver = await Driver.create(driverData);
    await driver.populate('user', 'name email phone');

    return success(res, { driver }, 'Driver profile created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getMyDriverProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar')
      .populate('currentDelivery');
    if (!driver) return error(res, 'Driver profile not found', 404);
    return success(res, { driver });
  } catch (err) {
    next(err);
  }
};

exports.updateDriverProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);

    const { vehicleType, vehiclePlate, licenseNumber } = req.body;
    if (vehicleType) driver.vehicleType = vehicleType;
    if (vehiclePlate) driver.vehiclePlate = vehiclePlate;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (req.file) driver.photo = `/uploads/${req.file.filename}`;

    await driver.save();
    return success(res, { driver }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

exports.setAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);
    if (driver.currentDelivery && isAvailable === false) {
      return error(res, 'Cannot go offline while on an active delivery', 400);
    }
    driver.isAvailable = isAvailable;
    await driver.save();
    return success(res, { isAvailable: driver.isAvailable }, `You are now ${isAvailable ? 'online' : 'offline'}`);
  } catch (err) {
    next(err);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return error(res, 'Valid latitude and longitude required', 400);
    }

    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);

    driver.location = { type: 'Point', coordinates: [longitude, latitude] };
    await driver.save();

    // If on active delivery, push location to history and update current
    if (driver.currentDelivery) {
      await Delivery.findByIdAndUpdate(driver.currentDelivery, {
        'currentDriverLocation.coordinates': [longitude, latitude],
        'currentDriverLocation.updatedAt': new Date(),
        $push: {
          driverLocationHistory: {
            $each: [{ coordinates: [longitude, latitude], recordedAt: new Date() }],
            $slice: -50, // keep last 50 points
          },
        },
      });
    }

    return success(res, { location: { latitude, longitude } }, 'Location updated');
  } catch (err) {
    next(err);
  }
};

exports.getNearbyDrivers = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    if (!latitude || !longitude) return error(res, 'latitude and longitude required', 400);

    const radiusInMeters = Number(radius) * 1000;

    const drivers = await Driver.find({
      isAvailable: true,
      isActive: true,
      currentDelivery: null,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
          $maxDistance: radiusInMeters,
        },
      },
    })
      .populate('user', 'name phone avatar')
      .limit(20);

    // compute approximate distance for each driver
    const withDistance = drivers.map(d => {
      const [dLng, dLat] = d.location.coordinates;
      const dist = haversineKm(Number(latitude), Number(longitude), dLat, dLng);
      return { ...d.toObject(), distanceKm: Math.round(dist * 10) / 10 };
    });

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    return success(res, { drivers: withDistance, count: withDistance.length });
  } catch (err) {
    next(err);
  }
};

exports.getDriverDeliveries = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);

    const { status, page = 1, limit = 10 } = req.query;
    const query = { driver: driver._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .populate('order', 'orderNumber total items')
        .populate('shop', 'name address logo')
        .populate('customer', 'name phone')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Delivery.countDocuments(query),
    ]);

    return success(res, { deliveries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
