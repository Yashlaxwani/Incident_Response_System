const express = require('express');
const {
  getAuditLogs,
  getResourceAuditLogs
} = require('../controllers/auditLogController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);
router.use(authorize('superadmin'));

// Routes
router.get('/', getAuditLogs);
router.get('/resource/:resourceType/:resourceId', getResourceAuditLogs);

module.exports = router;