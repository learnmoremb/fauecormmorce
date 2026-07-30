const { validationResult } = require('express-validator');
const Product = require('../models/Product.model');
const Shop = require('../models/Shop.model');
const { success, error } = require('../utils/apiResponse');

exports.createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, 'Validation failed', 400, errors.array());

    const shop = await Shop.findOne({ owner: req.user._id, isActive: true });
    if (!shop) return error(res, 'You must own an active shop to add products', 403);

    const { name, description, category, basePrice, variants, tags, attributes } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : (variants || []);
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
    const parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : (attributes || {});

    const product = await Product.create({
      shop: shop._id,
      name,
      description,
      category,
      basePrice: Number(basePrice),
      variants: parsedVariants,
      tags: parsedTags,
      images,
      attributes: parsedAttributes,
    });

    return success(res, { product }, 'Product created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, shop, minPrice, maxPrice, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const query = { isActive: true };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (shop) query.shop = shop;
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortMap = {
      '-createdAt': { createdAt: -1 },
      'price_asc': { basePrice: 1 },
      'price_desc': { basePrice: -1 },
      'rating': { rating: -1 },
      'popular': { totalSold: -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('shop', 'name slug logo category')
        .skip(skip)
        .limit(Number(limit))
        .sort(sortOption),
      Product.countDocuments(query),
    ]);

    return success(res, { products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop', 'name slug logo category address rating');
    if (!product || !product.isActive) return error(res, 'Product not found', 404);
    return success(res, { product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop');
    if (!product) return error(res, 'Product not found', 404);
    if (product.shop.owner.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized to update this product', 403);
    }

    const { name, description, category, basePrice, variants, tags, attributes, isActive } = req.body;
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (variants) product.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    if (tags) product.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    if (attributes) product.attributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
    if (isActive !== undefined) product.isActive = isActive;
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(f => `/uploads/${f.filename}`);
    }

    await product.save();
    return success(res, { product }, 'Product updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop');
    if (!product) return error(res, 'Product not found', 404);
    if (product.shop.owner.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403);
    }
    product.isActive = false;
    await product.save();
    return success(res, null, 'Product removed');
  } catch (err) {
    next(err);
  }
};

exports.getMyShopProducts = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return error(res, 'Shop not found', 404);
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find({ shop: shop._id }).skip(skip).limit(Number(limit)).sort('-createdAt'),
      Product.countDocuments({ shop: shop._id }),
    ]);
    return success(res, { products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};
