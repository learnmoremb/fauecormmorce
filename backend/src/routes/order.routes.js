const router = require('express').Router();
const {
  createOrder, getMyOrders, getOrderById, cancelOrder,
  getShopOrders, updateOrderStatus
} = require('../controllers/order.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/shop-orders', requireRole('shop_owner'), getShopOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', requireRole('shop_owner'), updateOrderStatus);

module.exports = router;
