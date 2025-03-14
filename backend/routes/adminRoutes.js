const express = require('express');
const { getAdminDashboard } = require('../controllers/dashboardController');
const { getAdminUsers } = require('../controllers/userController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Routes
router.get('/dashboard', getAdminDashboard);
router.get('/users/admins', getAdminUsers);

module.exports = router;