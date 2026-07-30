const router = require('express').Router();
const { body } = require('express-validator');
const { createShop, getMyShop, updateShop, getAllShops, getShopById } = require('../controllers/shop.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const shopRules = [
  body('name').trim().notEmpty().withMessage('Shop name is required'),
  body('category').notEmpty().withMessage('Category is required'),
];

router.get('/', getAllShops);
router.get('/my-shop', protect, requireRole('shop_owner'), getMyShop);
router.get('/:id', getShopById);
router.post('/', protect, requireRole('shop_owner'), upload.single('logo'), shopRules, createShop);
router.put('/', protect, requireRole('shop_owner'), upload.single('logo'), updateShop);

module.exports = router;
