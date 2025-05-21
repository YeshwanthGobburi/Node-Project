const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

const {
  getAllProducts,
  getProductById,
  getAllCategories,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');


// Public Routes 
// Get all categories
router.get('/categories', getAllCategories); 

// Get products by category
router.get('/category/:categoryName', getProductsByCategory); 

// View all products (authenticated users)
router.get('/', auth, getAllProducts); 

// Get single product by ID (authenticated users)
router.get('/:id', auth, getProductById);

// ----- Admin/Manager Protected Routes -----

// Create new product (admin + manager)
router.post('/', auth, authorize('admin', 'manager'), createProduct);

// Update product by ID (admin + manager)
router.put('/:id', auth, authorize('admin', 'manager'), updateProduct);

// Delete product(s) (admin only)
router.delete('/', auth, authorize('admin'), deleteProduct);

module.exports = router;
