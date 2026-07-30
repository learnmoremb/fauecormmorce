const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const Shop = require('../models/Shop.model');
const { success, error } = require('../utils/apiResponse');

exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate({ path: 'items.product', select: 'name images basePrice variants isActive' })
      .populate({ path: 'items.shop', select: 'name' });

    if (!cart || cart.items.length === 0) return error(res, 'Cart is empty', 400);

    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (!item.product.isActive) return error(res, `Product "${item.product.name}" is no longer available`, 400);

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: item.product._id,
        shop: item.shop._id,
        name: item.product.name,
        image: item.product.images[0] || null,
        variantId: item.variantId,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      });

      // update sold count and stock
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { totalSold: item.quantity },
      });
    }

    const shippingFee = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shippingFee;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingFee,
      total,
      paymentStatus: 'paid',
      paymentMethod: 'mock_payment',
      paymentReference: 'MOCK-' + Date.now(),
      notes,
      status: 'confirmed',
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    return success(res, { order }, 'Order placed successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate({ path: 'items.product', select: 'name images' })
        .populate({ path: 'items.shop', select: 'name logo' })
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Order.countDocuments(query),
    ]);

    return success(res, { orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({ path: 'items.product', select: 'name images' })
      .populate({ path: 'items.shop', select: 'name logo address' })
      .populate('user', 'name email phone');

    if (!order) return error(res, 'Order not found', 404);
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return error(res, 'Not authorized', 403);
    }

    return success(res, { order });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return error(res, 'Order not found', 404);
    if (order.user.toString() !== req.user._id.toString()) return error(res, 'Not authorized', 403);
    if (!['pending', 'confirmed'].includes(order.status)) {
      return error(res, 'Order cannot be cancelled at this stage', 400);
    }
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();
    return success(res, { order }, 'Order cancelled');
  } catch (err) {
    next(err);
  }
};

exports.getShopOrders = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return error(res, 'Shop not found', 404);

    const { page = 1, limit = 10, status } = req.query;
    const query = { 'items.shop': shop._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).populate('user', 'name email phone').skip(skip).limit(Number(limit)).sort('-createdAt'),
      Order.countDocuments(query),
    ]);

    return success(res, { orders, total });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return error(res, 'Shop not found', 404);

    const order = await Order.findById(req.params.id);
    if (!order) return error(res, 'Order not found', 404);

    const allowed = ['processing', 'shipped', 'delivered'];
    if (!allowed.includes(status)) return error(res, 'Invalid status', 400);

    order.status = status;
    await order.save();
    return success(res, { order }, 'Order status updated');
  } catch (err) {
    next(err);
  }
};
