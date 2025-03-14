const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout',
      'user_register',
      'user_update',
      'user_delete',
      'user_status_change',
      'password_reset',
      'incident_create',
      'incident_update',
      'incident_delete',
      'incident_status_change',
      'incident_assignment',
      'comment_add',
      'comment_delete',
      'system'
    ]
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  resourceType: {
    type: String,
    enum: ['User', 'Incident', 'Comment', 'System']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);