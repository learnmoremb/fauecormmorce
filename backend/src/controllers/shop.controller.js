const { validationResult } = require('express-validator');
const Shop = require('../models/Shop.model');
const { success, error } = require('../utils/apiResponse');

// FormData can't carry nested objects natively — the client sends `address` as a
// JSON string alongside the file upload, so it needs parsing back into an object.
function parseAddress(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return undefined; }
}

exports.createShop = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, 'Validation failed', 400, errors.array());

    const existing = await Shop.findOne({ owner: req.user._id });
    if (existing) return error(res, 'You already have a registered shop', 409);

    const shopData = { ...req.body, owner: req.user._id };
    if (shopData.address !== undefined) shopData.address = parseAddress(shopData.address);
    if (req.file) shopData.logo = `/uploads/${req.file.filename}`;

    const shop = await Shop.create(shopData);
    return success(res, { shop }, 'Shop created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return error(res, 'Shop not found', 404);
    return success(res, { shop });
  } catch (err) {
    next(err);
  }
};

exports.updateShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return error(res, 'Shop not found', 404);

    const allowed = ['name', 'description', 'category', 'address', 'phone', 'email'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        shop[field] = field === 'address' ? parseAddress(req.body[field]) : req.body[field];
      }
    });
    if (req.file) shop.logo = `/uploads/${req.file.filename}`;

    await shop.save();
    return success(res, { shop }, 'Shop updated');
  } catch (err) {
    next(err);
  }
};

exports.getAllShops = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [shops, total] = await Promise.all([
      Shop.find(query).populate('owner', 'name email').skip(skip).limit(Number(limit)).sort('-createdAt'),
      Shop.countDocuments(query),
    ]);

    return success(res, { shops, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getShopById = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email');
    if (!shop || !shop.isActive) return error(res, 'Shop not found', 404);
    return success(res, { shop });
  } catch (err) {
    next(err);
  }
};
