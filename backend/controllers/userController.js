const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { createAuditLog } = require('../middleware/logger');

//       Get all users
// @route   GET /api/users
// @access  Private/SuperAdmin
exports.getUsers = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Build query
  let query = User.find();

  // Filter by role
  if (req.query.role) {
    query = query.find({ role: req.query.role });
  }

  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    });
  }

  // Sort
  if (req.query.sortBy && req.query.sortOrder) {
    const sortObj = {};
    sortObj[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sortObj);
  } else {
    query = query.sort({ createdAt: -1 });
  }

  // Executing query with pagination
  const total = await User.countDocuments(query);
  query = query.skip(startIndex).limit(limit);
  const users = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: users.length,
    pagination,
    totalPages: Math.ceil(total / limit),
    users
  });
});

//       Get single user
// @route   GET /api/users/:id
// @access  Private/SuperAdmin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

//       Create user
// @route   POST /api/users
// @access  Private/SuperAdmin
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department, phone } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new ErrorResponse('Email already in use', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    department,
    phone
  });

  // Create audit log
  createAuditLog(
    req.user,
    'user_register',
    `User ${user.name} created by ${req.user.name}`,
    user._id,
    'User',
    req
  );

  res.status(201).json({
    success: true,
    data: user
  });
});

//       Update user
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // If password is included, hash it
  if (req.body.password) {
    user.password = req.body.password;
    await user.save();
    
    // Remove password from req.body to avoid overwriting the hashed password
    delete req.body.password;
  }

  // Update user
  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Create audit log
  createAuditLog(
    req.user,
    'user_update',
    `User ${user.name} updated by ${req.user.name}`,
    user._id,
    'User',
    req
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

//       Delete user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Create audit log before deletion
  createAuditLog(
    req.user,
    'user_delete',
    `User ${user.name} deleted by ${req.user.name}`,
    user._id,
    'User',
    req
  );

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

//       Update user status (activate/deactivate)
// @route   PUT /api/users/:id/status
// @access  Private/SuperAdmin
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Update status
  user.isActive = req.body.isActive;
  await user.save();

  // Create audit log
  createAuditLog(
    req.user,
    'user_status_change',
    `User ${user.name} ${req.body.isActive ? 'activated' : 'deactivated'} by ${req.user.name}`,
    user._id,
    'User',
    req
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

//       Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

//       Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  // Fields to update
  const fieldsToUpdate = {
    name: req.body.name,
    department: req.body.department,
    phone: req.body.phone
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  // Create audit log
  createAuditLog(
    req.user,
    'user_update',
    `User ${req.user.name} updated their profile`,
    req.user._id,
    'User',
    req
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

//       Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Set new password
  user.password = req.body.newPassword;
  await user.save();

  // Create audit log
  createAuditLog(
    req.user,
    'user_update',
    `User ${req.user.name} changed their password`,
    req.user._id,
    'User',
    req
  );

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

//       Get user activity
// @route   GET /api/users/activity
// @access  Private
exports.getUserActivity = asyncHandler(async (req, res, next) => {
  // Get audit logs for the user
  const logs = await AuditLog.find({ user: req.user.id })
    .sort({ timestamp: -1 })
    .limit(10);

  // Format logs for frontend
  const activity = logs.map(log => ({
    _id: log._id,
    type: log.action.split('_')[0],
    description: log.details,
    timestamp: log.timestamp
  }));

  res.status(200).json(activity);
});

//       Get admin users (for incident assignment)
// @route   GET /api/admin/users/admins
// @access  Private/Admin
exports.getAdminUsers = asyncHandler(async (req, res, next) => {
  const admins = await User.find({ 
    role: { $in: ['admin', 'superadmin'] },
    isActive: true
  }).select('name email role');

  res.status(200).json(admins);
});