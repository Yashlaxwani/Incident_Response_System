const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');

// @desc    Upload files
// @route   POST /api/upload
// @access  Private
exports.uploadFiles = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse('Please upload at least one file', 400));
  }

  const fileUrls = req.files.map(file => ({
    name: file.originalname,
    url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
    type: file.mimetype,
    size: file.size
  }));

  res.status(200).json({
    success: true,
    count: fileUrls.length,
    fileUrls
  });
});