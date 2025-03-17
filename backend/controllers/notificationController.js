const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

//       Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json(notifications);
});

//       Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  // Check if notification belongs to user
  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Not authorized to access this notification`, 403));
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification
  });
});

//       Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

//       Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
  }

  // Check if notification belongs to user
  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`Not authorized to delete this notification`, 403));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

//       Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
exports.deleteReadNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ user: req.user.id, read: true });

  res.status(200).json({
    success: true,
    message: 'All read notifications deleted'
  });
});