const express = require('express');
const {
  getIncidents,
  getUserIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  updateIncidentStatus,
  assignIncident,
  bulkUpdateIncidents,
  bulkDeleteIncidents,
  exportIncidents
} = require('../controllers/incidentController');

const {
  getComments,
  addComment
} = require('../controllers/commentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Public routes (for authenticated users)
router.get('/user', getUserIncidents);
router.post('/', createIncident);

// Routes for specific incidents
router.route('/:id')
  .get(getIncident)
  .put(authorize('admin', 'superadmin'), updateIncident)
  .delete(authorize('admin', 'superadmin'), deleteIncident);

// Status update route
router.put('/:id/status', authorize('admin', 'superadmin'), updateIncidentStatus);

// Assignment route
router.put('/:id/assign', authorize('admin', 'superadmin'), assignIncident);

// Comments routes
router.route('/:incidentId/comments')
  .get(getComments)
  .post(addComment);

// Admin routes
router.use(authorize('admin', 'superadmin'));
router.get('/', getIncidents);
router.put('/bulk-update', bulkUpdateIncidents);
router.get('/export', exportIncidents);

// Super Admin routes
router.use(authorize('superadmin'));
router.delete('/bulk-delete', bulkDeleteIncidents);

module.exports = router;