// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getAdminDashboard } = require('../controllers/adminController');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/role');

// Only admin and manager can access this route
router.get('/dashboard', authenticateToken, authorize('admin', 'manager'), getAdminDashboard);

module.exports = router;
