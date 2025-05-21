const express = require('express');
const router = express.Router();
const { checkoutCart,  getSales, processReturn } = require('../controllers/saleController');
const { exportAndEmailSalesCSV } = require('../controllers/exportController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

// Only admin, manager, cashier can checkout
router.post('/checkout', auth, authorize('admin', 'manager', 'cashier'), checkoutCart);

// Only auth can check the sales
router.get('/', auth, authorize('admin', 'manager', 'cashier'), getSales);

//Return products 
router.post('/:saleId/return', auth, authorize('admin', 'manager', 'cashier'), processReturn);



//to generate sale file
//router.get('/export/csv', exportSalesAsCSV);
router.post('/export/email', auth, authorize('admin', 'manager'), exportAndEmailSalesCSV);



module.exports = router;


