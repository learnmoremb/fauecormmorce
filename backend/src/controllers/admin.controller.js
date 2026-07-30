const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Shop = require('../models/Shop.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const Driver = require('../models/Driver.model');
const { success, error } = require('../utils/apiResponse');

// ── Stats ──────────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [users, shops, pendingShops, products, orders, drivers] = await Promise.all([
      User.countDocuments(),
      Shop.countDocuments({ isActive: true }),
      Shop.countDocuments({ isVerified: false, isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Driver.countDocuments(),
    ]);

    const revenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    return success(res, {
      users,
      shops,
      pendingShops,
      products,
      orders,
      drivers,
      totalRevenue: revenue[0]?.total ?? 0,
    });
  } catch (err) {
    next(err);
  }
};

// ── Shops ──────────────────────────────────────────────────────────────────
exports.getShops = async (req, res, next) => {
  try {
    const { verified, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (verified === 'false') query.isVerified = false;
    if (verified === 'true') query.isVerified = true;
    if (search) query.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [shops, total] = await Promise.all([
      Shop.find(query)
        .populate('owner', 'name email phone createdAt')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Shop.countDocuments(query),
    ]);

    return success(res, { shops, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.verifyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email');
    if (!shop) return error(res, 'Shop not found', 404);

    shop.isVerified = true;
    shop.isActive = true;
    await shop.save();

    return success(res, { shop }, 'Shop verified successfully');
  } catch (err) {
    next(err);
  }
};

exports.rejectShop = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email');
    if (!shop) return error(res, 'Shop not found', 404);

    shop.isVerified = false;
    shop.isActive = false;
    await shop.save();

    return success(res, { shop }, `Shop rejected${reason ? ': ' + reason : ''}`);
  } catch (err) {
    next(err);
  }
};

exports.toggleShopActive = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return error(res, 'Shop not found', 404);

    shop.isActive = !shop.isActive;
    await shop.save();

    return success(res, { shop }, `Shop ${shop.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

// ── Users ──────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(query),
    ]);

    return success(res, { users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    if (user.role === 'admin') return error(res, 'Cannot deactivate admin accounts', 403);

    user.isActive = !user.isActive;
    await user.save();

    return success(res, { user }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

// ── Drivers ────────────────────────────────────────────────────────────────
exports.getDrivers = async (req, res, next) => {
  try {
    const { verified, search, page = 1, limit = 15 } = req.query;
    const driverQuery = {};
    if (verified === 'true') driverQuery.isVerified = true;
    if (verified === 'false') driverQuery.isVerified = false;

    let userIds;
    if (search) {
      const users = await User.find({
        role: 'driver',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      userIds = users.map(u => u._id);
      driverQuery.user = { $in: userIds };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [drivers, total] = await Promise.all([
      Driver.find(driverQuery)
        .populate('user', 'name email phone isActive createdAt')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Driver.countDocuments(driverQuery),
    ]);

    return success(res, { drivers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.createDriver = async (req, res, next) => {
  try {
    const { name, email, password, phone, vehicleType, vehiclePlate, licenseNumber } = req.body;

    if (!name || !email || !password || !vehicleType) {
      return error(res, 'name, email, password and vehicleType are required', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return error(res, 'Email already registered', 409);

    const user = await User.create({ name, email, password, phone, role: 'driver' });
    const driver = await Driver.create({ user: user._id, vehicleType, vehiclePlate, licenseNumber });
    await driver.populate('user', 'name email phone');

    return success(res, { driver }, 'Driver profile created', 201);
  } catch (err) {
    next(err);
  }
};

exports.verifyDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('user', 'name email');
    if (!driver) return error(res, 'Driver not found', 404);

    driver.isVerified = true;
    await driver.save();

    return success(res, { driver }, 'Driver verified');
  } catch (err) {
    next(err);
  }
};

exports.toggleDriverActive = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('user', 'name email');
    if (!driver) return error(res, 'Driver not found', 404);

    driver.isActive = !driver.isActive;
    await driver.save();

    return success(res, { driver }, `Driver ${driver.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

// ── Orders ─────────────────────────────────────────────────────────────────
exports.getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Order.countDocuments(query),
    ]);

    return success(res, { orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};
