const AuditLog = require('../models/AuditLog');

// Create audit log
exports.createAuditLog = async (
  user,
  action,
  details,
  resourceId = null,
  resourceType = null,
  req = null
) => {
  try {
    const auditLog = {
      user: user ? user._id : null,
      action,
      details,
      resourceId,
      resourceType,
      ipAddress: req ? req.ip : null,
      userAgent: req ? req.headers['user-agent'] : null
    };

    await AuditLog.create(auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};