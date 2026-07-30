const router = require('express').Router();
const {
  getStats,
  getShops, verifyShop, rejectShop, toggleShopActive,
  getUsers, toggleUserActive,
  getDrivers, createDriver, verifyDriver, toggleDriverActive,
  getOrders,
} = require('../controllers/admin.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');

router.use(protect, requireRole('admin'));

router.get('/stats', getStats);

router.get('/shops', getShops);
router.put('/shops/:id/verify', verifyShop);
router.put('/shops/:id/reject', rejectShop);
router.put('/shops/:id/toggle', toggleShopActive);

router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUserActive);

router.get('/drivers', getDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id/verify', verifyDriver);
router.put('/drivers/:id/toggle', toggleDriverActive);

router.get('/orders', getOrders);

module.exports = router;
