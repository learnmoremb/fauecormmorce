const router = require('express').Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
