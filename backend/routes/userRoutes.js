const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserActivity,
  getAdminUsers
} = require('../controllers/userController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public routes
// None

// Protected routes
router.use(protect);

// User routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.put('/change-password', changePassword);
router.get('/activity', getUserActivity);

// Admin routes
router.get('/admins', authorize('admin', 'superadmin'), getAdminUsers);

// Super Admin routes
router.use(authorize('superadmin'));
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/status', updateUserStatus);

module.exports = router;