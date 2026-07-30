const router = require('express').Router();
const {
  createDelivery, assignDriver, acceptDelivery, markPickedUp, markDelivered,
  rejectDelivery, cancelDelivery, getDeliveryById, getDeliveryByOrder,
  getShopDeliveries, rateDelivery,
} = require('../controllers/delivery.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');

router.use(protect);

// Shop owner routes
router.post('/', requireRole('shop_owner'), createDelivery);
router.put('/:id/assign', requireRole('shop_owner'), assignDriver);
router.put('/:id/cancel', requireRole('shop_owner', 'admin'), cancelDelivery);
router.get('/shop', requireRole('shop_owner'), getShopDeliveries);

// Driver routes
router.put('/:id/accept', requireRole('driver'), acceptDelivery);
router.put('/:id/reject', requireRole('driver'), rejectDelivery);
router.put('/:id/pickup', requireRole('driver'), markPickedUp);
router.put('/:id/deliver', requireRole('driver'), markDelivered);

// Shared (customer tracking, driver view)
router.get('/order/:orderId', getDeliveryByOrder);
router.get('/:id', getDeliveryById);
router.post('/:id/rate', rateDelivery);

module.exports = router;
