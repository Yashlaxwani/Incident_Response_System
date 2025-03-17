const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');


// @route   GET /api/audit-logs
// @access  Private/SuperAdmin
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Build query
  let query = AuditLog.find();

  // Search by user or action
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.find({
      $or: [
        { details: searchRegex },
        { action: searchRegex }
      ]
    });
  }

  // Sort
  if (req.query.sortBy && req.query.sortOrder) {
    const sortObj = {};
    sortObj[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sortObj);
  } else {
    query = query.sort({ timestamp: -1 });
  }

  // Populate user data
  query = query.populate('user', 'name email');

  // Executing query with pagination
  const total = await AuditLog.countDocuments(query);
  query = query.skip(startIndex).limit(limit);
  const logs = await query;

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
    count: logs.length,
    pagination,
    totalPages: Math.ceil(total / limit),
    logs
  });
});


// @route   GET /api/audit-logs/resource/:resourceType/:resourceId
// @access  Private/Admin
exports.getResourceAuditLogs = asyncHandler(async (req, res, next) => {
  const { resourceType, resourceId } = req.params;

  const logs = await AuditLog.find({
    resourceType,
    resourceId
  })
    .sort({ timestamp: -1 })
    .populate('user', 'name email');

  res.status(200).json({
    success: true,
    count: logs.length,
    logs
  });
});