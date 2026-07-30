const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const { success, error } = require('../utils/apiResponse');

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({ path: 'items.product', select: 'name images basePrice isActive shop' })
      .populate({ path: 'items.shop', select: 'name logo' });

    if (!cart) return success(res, { cart: { items: [], total: 0 } });
    return success(res, { cart });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    const product = await Product.findById(productId).populate('shop');
    if (!product || !product.isActive) return error(res, 'Product not found', 404);

    let itemPrice = product.basePrice;
    let color, size;

    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) return error(res, 'Variant not found', 404);
      if (variant.stock < quantity) return error(res, 'Insufficient stock', 400);
      itemPrice = variant.price;
      color = variant.color;
      size = variant.size;
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existingIdx = cart.items.findIndex(
      i => i.product.toString() === productId && String(i.variantId) === String(variantId)
    );

    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: productId,
        shop: product.shop._id,
        variantId: variantId || null,
        quantity: Number(quantity),
        price: itemPrice,
        color,
        size,
      });
    }

    await cart.save();
    await cart.populate([
      { path: 'items.product', select: 'name images basePrice' },
      { path: 'items.shop', select: 'name logo' },
    ]);

    return success(res, { cart }, 'Item added to cart');
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return error(res, 'Cart not found', 404);

    const item = cart.items.id(req.params.itemId);
    if (!item) return error(res, 'Cart item not found', 404);

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      item.quantity = Number(quantity);
    }

    await cart.save();
    return success(res, { cart }, 'Cart updated');
  } catch (err) {
    next(err);
  }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return error(res, 'Cart not found', 404);

    const item = cart.items.id(req.params.itemId);
    if (!item) return error(res, 'Item not found', 404);

    item.deleteOne();
    await cart.save();
    return success(res, { cart }, 'Item removed');
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    return success(res, null, 'Cart cleared');
  } catch (err) {
    next(err);
  }
};
