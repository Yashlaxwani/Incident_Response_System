const express = require('express');
const { getSuperAdminDashboard } = require('../controllers/dashboardController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);
router.use(authorize('superadmin'));

// Routes
router.get('/dashboard', getSuperAdminDashboard);

module.exports = router;