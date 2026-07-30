const Delivery = require('../models/Delivery.model');
const Driver = require('../models/Driver.model');
const Order = require('../models/Order.model');
const Shop = require('../models/Shop.model');
const { success, error } = require('../utils/apiResponse');

// Shop owner creates a delivery request for a confirmed order
exports.createDelivery = async (req, res, next) => {
  try {
    const { orderId, notes, deliveryFee = 0 } = req.body;

    const order = await Order.findById(orderId).populate('items.shop');
    if (!order) return error(res, 'Order not found', 404);
    if (!['confirmed', 'processing'].includes(order.status)) {
      return error(res, 'Only confirmed or processing orders can have a delivery created', 400);
    }

    const existing = await Delivery.findOne({ order: orderId });
    if (existing) return error(res, 'Delivery already created for this order', 409);

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return error(res, 'Shop not found', 404);

    const delivery = await Delivery.create({
      order: orderId,
      shop: shop._id,
      customer: order.user,
      pickupAddress: shop.address || {},
      deliveryAddress: order.shippingAddress,
      deliveryFee: Number(deliveryFee),
      notes,
      status: 'pending',
    });

    await delivery.populate([
      { path: 'order', select: 'orderNumber total' },
      { path: 'shop', select: 'name address' },
      { path: 'customer', select: 'name phone' },
    ]);

    return success(res, { delivery }, 'Delivery request created', 201);
  } catch (err) {
    next(err);
  }
};

// Shop owner assigns a driver to the delivery
exports.assignDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return error(res, 'Delivery not found', 404);
    if (delivery.status !== 'pending') return error(res, 'Delivery is not in pending state', 400);

    const driver = await Driver.findById(driverId);
    if (!driver) return error(res, 'Driver not found', 404);
    if (!driver.isAvailable || driver.currentDelivery) {
      return error(res, 'Driver is not available', 400);
    }

    delivery.driver = driverId;
    delivery.status = 'assigned';
    delivery.assignedAt = new Date();
    await delivery.save();

    driver.isAvailable = false;
    driver.currentDelivery = delivery._id;
    await driver.save();

    await delivery.populate([
      { path: 'driver', populate: { path: 'user', select: 'name phone' } },
      { path: 'order', select: 'orderNumber' },
      { path: 'customer', select: 'name phone' },
    ]);

    return success(res, { delivery }, 'Driver assigned successfully');
  } catch (err) {
    next(err);
  }
};

// Driver accepts the assigned delivery
exports.acceptDelivery = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return error(res, 'Delivery not found', 404);
    if (delivery.driver?.toString() !== driver._id.toString()) {
      return error(res, 'This delivery is not assigned to you', 403);
    }
    if (delivery.status !== 'assigned') return error(res, 'Delivery is not in assigned state', 400);

    delivery.status = 'accepted';
    delivery.acceptedAt = new Date();
    await delivery.save();

    return success(res, { delivery }, 'Delivery accepted');
  } catch (err) {
    next(err);
  }
};

// Driver marks as picked up from shop
exports.markPickedUp = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return error(res, 'Delivery not found', 404);
    if (delivery.driver?.toString() !== driver._id.toString()) return error(res, 'Not your delivery', 403);
    if (!['accepted'].includes(delivery.status)) return error(res, 'Cannot mark as picked up at this stage', 400);

    delivery.status = 'in_transit';
    delivery.pickedUpAt = new Date();
    await delivery.save();

    await Order.findByIdAndUpdate(delivery.order, { status: 'shipped' });

    return success(res, { delivery }, 'Marked as picked up — in transit');
  } catch (err) {
    next(err);
  }
};

// Driver marks as delivered
exports.markDelivered = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return error(res, 'Delivery not found', 404);
    if (delivery.driver?.toString() !== driver._id.toString()) return error(res, 'Not your delivery', 403);
    if (delivery.status !== 'in_transit') return error(res, 'Delivery is not in transit', 400);

    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    await delivery.save();

    driver.currentDelivery = null;
    driver.isAvailable = true;
    driver.totalDeliveries += 1;
    await driver.save();

    await Order.findByIdAndUpdate(delivery.order, { status: 'delivered' });

    return success(res, { delivery }, 'Delivery completed!');
  } catch (err) {
    next(err);
  }
};

// Driver rejects an assigned delivery
exports.rejectDelivery = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return error(res, 'Driver profile not found', 404);

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return error(res, 'Delivery not found', 404);
    if (delivery.driver?.toString() !== driver._id.toString()) return error(res, 'Not your delivery', 403);
    if (!['assigned', 'accepted'].includes(delivery.status)) return error(res, 'Cannot reject at this stage', 400);

    delivery.driver = null;
    delivery.status = 'pending';
    delivery.assignedAt = undefined;
    delivery.acceptedAt = undefined;
    delivery.failureReason = reason || 'Driver rejected';
    await delivery.save();

    driver.currentDelivery = null;
    driver.isAvailable = true;
    await driver.save();

    return success(res, { delivery }, 'Delivery rejected');
  } catch (err) {
    next(err);
  }
};

// Cancel delivery (shop owner)
exports.cancelDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return error(res, 'Delivery not found', 404);
    if (['delivered', 'in_transit'].includes(delivery.status)) {
      return error(res, 'Cannot cancel delivery at this stage', 400);
    }

    if (delivery.driver) {
      await Driver.findByIdAndUpdate(delivery.driver, { currentDelivery: null, isAvailable: true });
    }

    delivery.status = 'cancelled';
    await delivery.save();

    return success(res, { delivery }, 'Delivery cancelled');
  } catch (err) {
    next(err);
  }
};

// Get delivery by ID (customer, shop owner, driver, admin)
exports.getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } })
      .populate('order', 'orderNumber total items status')
      .populate('shop', 'name address logo phone')
      .populate('customer', 'name phone');

    if (!delivery) return error(res, 'Delivery not found', 404);

    const uid = req.user._id.toString();
    const isOwner = delivery.customer?._id?.toString() === uid;
    const isDriver = delivery.driver?.user?._id?.toString() === uid;
    const isShopOwner = req.user.role === 'shop_owner';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isDriver && !isShopOwner && !isAdmin) {
      return error(res, 'Not authorized', 403);
    }

    return success(res, { delivery });
  } catch (err) {
    next(err);
  }
};

// Get delivery by order ID (customer tracking)
exports.getDeliveryByOrder = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ order: req.params.orderId })
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } })
      .populate('shop', 'name address logo');

    if (!delivery) return error(res, 'No delivery found for this order', 404);
    return success(res, { delivery });
  } catch (err) {
    next(err);
  }
};

// Shop owner: list deliveries for their shop
exports.getShopDeliveries = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return error(res, 'Shop not found', 404);

    const { status, page = 1, limit = 10 } = req.query;
    const query = { shop: shop._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
        .populate('order', 'orderNumber total')
        .populate('customer', 'name phone')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Delivery.countDocuments(query),
    ]);

    return success(res, { deliveries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// Customer rates the delivery/driver
exports.rateDelivery = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return error(res, 'Rating must be between 1 and 5', 400);

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return error(res, 'Delivery not found', 404);
    if (delivery.customer.toString() !== req.user._id.toString()) return error(res, 'Not authorized', 403);
    if (delivery.status !== 'delivered') return error(res, 'Can only rate completed deliveries', 400);
    if (delivery.customerRating) return error(res, 'Already rated', 400);

    delivery.customerRating = rating;
    delivery.customerReview = review;
    await delivery.save();

    // update driver average rating
    if (delivery.driver) {
      const driver = await Driver.findById(delivery.driver);
      if (driver) {
        driver.rating = (driver.rating * driver.totalRatings + rating) / (driver.totalRatings + 1);
        driver.totalRatings += 1;
        await driver.save();
      }
    }

    return success(res, { delivery }, 'Thank you for your rating!');
  } catch (err) {
    next(err);
  }
};
