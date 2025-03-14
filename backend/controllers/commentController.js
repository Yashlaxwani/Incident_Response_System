const Comment = require('../models/Comment');
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { createAuditLog } = require('../middleware/logger');

// @desc    Get comments for an incident
// @route   GET /api/incidents/:incidentId/comments
// @access  Private
exports.getComments = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.incidentId);

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.incidentId}`, 404));
  }

  // Check if user has permission to view this incident's comments
  if (
    req.user.role !== 'admin' && 
    req.user.role !== 'superadmin' && 
    incident.reportedBy.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`Not authorized to access this incident's comments`, 403));
  }

  const comments = await Comment.find({ incident: req.params.incidentId })
    .sort({ createdAt: 1 })
    .populate('user', 'name email');

  res.status(200).json(comments);
});

// @desc    Add comment to an incident
// @route   POST /api/incidents/:incidentId/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const incident = await Incident.findById(req.params.incidentId)
    .populate('reportedBy', 'name');

  if (!incident) {
    return next(new ErrorResponse(`Incident not found with id of ${req.params.incidentId}`, 404));
  }

  // Check if user has permission to comment on this incident
  if (
    req.user.role !== 'admin' && 
    req.user.role !== 'superadmin' && 
    incident.reportedBy._id.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`Not authorized to comment on this incident`, 403));
  }

  // Create comment
  const comment = await Comment.create({
    content: req.body.content,
    incident: req.params.incidentId,
    user: req.user.id
  });

  // Populate user data
  await comment.populate('user', 'name email');

  // Create audit log
  createAuditLog(
    req.user,
    'comment_add',
    `Comment added to incident "${incident.title}" by ${req.user.name}`,
    comment._id,
    'Comment',
    req
  );

  // Create notification for the incident owner if not the commenter
  if (
    incident.reportedBy && 
    incident.reportedBy._id.toString() !== req.user.id
  ) {
    await Notification.create({
      user: incident.reportedBy._id,
      title: 'New Comment',
      message: `${req.user.name} commented on your incident "${incident.title}"`,
      type: 'comment',
      incidentId: incident._id
    });

    // Notify user via socket.io (handled in socket handler)
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(incident.reportedBy._id.toString()).emit('notification', {
        type: 'comment',
        incidentId: incident._id,
        title: 'New Comment',
        message: `${req.user.name} commented on your incident "${incident.title}"`
      });
    }
  }

  // If comment is by user and incident is assigned to admin, notify admin
  if (
    req.user.role === 'user' && 
    incident.assignedTo && 
    incident.assignedTo.toString() !== req.user.id
  ) {
    await Notification.create({
      user: incident.assignedTo,
      title: 'New Comment',
      message: `${req.user.name} commented on incident "${incident.title}" assigned to you`,
      type: 'comment',
      incidentId: incident._id
    });

    // Notify assigned admin via socket.io (handled in socket handler)
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(incident.assignedTo.toString()).emit('notification', {
        type: 'comment',
        incidentId: incident._id,
        title: 'New Comment',
        message: `${req.user.name} commented on incident "${incident.title}" assigned to you`
      });
    }
  }

  // Notify all users in the incident room via socket.io
  if (req.app.get('io')) {
    const io = req.app.get('io');
    io.to(`incident-${incident._id}`).emit('newComment', {
      comment
    });
  }

  res.status(201).json(comment);
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404));
  }

  // Check if user is comment owner or admin/superadmin
  if (
    comment.user.toString() !== req.user.id && 
    req.user.role !== 'admin' && 
    req.user.role !== 'superadmin'
  ) {
    return next(new ErrorResponse(`Not authorized to delete this comment`, 403));
  }

  // Create audit log before deletion
  createAuditLog(
    req.user,
    'comment_delete',
    `Comment deleted by ${req.user.name}`,
    comment._id,
    'Comment',
    req
  );

  await comment.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});