const router = require('express').Router();
const { body } = require('express-validator');
const {
  createProduct, getProducts, getProductById,
  updateProduct, deleteProduct, getMyShopProducts
} = require('../controllers/product.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('basePrice').isNumeric().withMessage('Base price must be a number'),
];

router.get('/', getProducts);
router.get('/my-products', protect, requireRole('shop_owner'), getMyShopProducts);
router.get('/:id', getProductById);
router.post('/', protect, requireRole('shop_owner'), upload.array('images', 5), productRules, createProduct);
router.put('/:id', protect, requireRole('shop_owner'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, requireRole('shop_owner'), deleteProduct);

module.exports = router;
