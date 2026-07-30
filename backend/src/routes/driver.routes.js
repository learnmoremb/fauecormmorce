const router = require('express').Router();
const { body } = require('express-validator');
const {
  registerDriver, getMyDriverProfile, updateDriverProfile,
  setAvailability, updateLocation, getNearbyDrivers, getDriverDeliveries,
} = require('../controllers/driver.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const registerRules = [
  body('vehicleType').isIn(['bicycle', 'motorcycle', 'car', 'van', 'truck']).withMessage('Invalid vehicle type'),
];

// Public — nearby driver search (used by shop owners)
router.get('/nearby', protect, getNearbyDrivers);

// Driver profile
router.post('/register', protect, upload.single('photo'), registerRules, registerDriver);
router.get('/me', protect, requireRole('driver'), getMyDriverProfile);
router.put('/me', protect, requireRole('driver'), upload.single('photo'), updateDriverProfile);
router.put('/availability', protect, requireRole('driver'), setAvailability);
router.put('/location', protect, requireRole('driver'), updateLocation);
router.get('/deliveries', protect, requireRole('driver'), getDriverDeliveries);

module.exports = router;
