const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Actor
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: String, // Denormalized for performance

  // Action
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user_login', 'user_logout', 'user_register', 'user_update', 'user_delete',
      // Questionnaire actions
      'questionnaire_create', 'questionnaire_update', 'questionnaire_delete',
      'questionnaire_publish', 'questionnaire_close', 'questionnaire_clone',
      // Response actions
      'response_create', 'response_update', 'response_delete', 'response_export',
      // Workspace actions
      'workspace_create', 'workspace_update', 'workspace_delete',
      'workspace_member_add', 'workspace_member_remove', 'workspace_member_update',
      // System actions
      'system_backup', 'system_restore', 'admin_action'
    ]
  },

  // Target Entity
  entityType: {
    type: String,
    required: true,
    enum: ['user', 'questionnaire', 'response', 'workspace', 'system']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // Changes
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String] // Fields that were changed
  },

  // Context
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    location: {
      country: String,
      city: String
    },
    deviceInfo: {
      type: String, // desktop, mobile, tablet
      os: String,
      browser: String
    }
  },

  // Compliance
  compliance: {
    gdpr: {
      dataSubject: String, // Email of data subject
      purpose: String, // Purpose of processing
      consent: Boolean
    },
    retention: {
      deleteAfter: Date,
      retentionReason: String
    }
  },

  // Risk Assessment
  risk: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    flags: [{
      type: String,
      enum: ['suspicious_ip', 'unusual_time', 'bulk_action', 'sensitive_data']
    }]
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  // Automatic expiration for old logs
  expires: '365d' // Keep logs for 1 year
});

// Indexes
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'risk.level': 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'metadata.ipAddress': 1, timestamp: -1 });

// Pre-save middleware
auditLogSchema.pre('save', function(next) {
  // Assess risk level based on action and context
  this.assessRisk();
  next();
});

// Instance methods
auditLogSchema.methods.assessRisk = function() {
  let riskLevel = 'low';
  const flags = [];

  // High-risk actions
  const highRiskActions = [
    'user_delete', 'questionnaire_delete', 'workspace_delete',
    'response_delete', 'admin_action'
  ];

  if (highRiskActions.includes(this.action)) {
    riskLevel = 'high';
  }

  // Suspicious patterns
  if (this.metadata.ipAddress) {
    // Check for suspicious IP patterns (simplified)
    const suspiciousPatterns = [
      /^192\.168\./,  // Private IP in logs
      /^10\./,        // Private IP in logs
      /^172\./        // Private IP in logs
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(this.metadata.ipAddress))) {
      flags.push('suspicious_ip');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
  }

  // Unusual timing (bulk actions)
  if (this.changes && this.changes.fields && this.changes.fields.length > 10) {
    flags.push('bulk_action');
    riskLevel = 'medium';
  }

  // Sensitive data changes
  const sensitiveFields = ['password', 'email', 'personalInfo', 'paymentInfo'];
  if (this.changes && this.changes.fields) {
    const hasSensitiveData = this.changes.fields.some(field =>
      sensitiveFields.some(sensitive => field.includes(sensitive))
    );

    if (hasSensitiveData) {
      flags.push('sensitive_data');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }
  }

  this.risk.level = riskLevel;
  this.risk.flags = flags;
};

// Static methods
auditLogSchema.statics.logAction = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking main functionality
    return null;
  }
};

auditLogSchema.statics.logUserAction = async function(userId, action, entityType, entityId, changes = {}, metadata = {}) {
  const User = mongoose.model('User');
  let userEmail = null;

  try {
    const user = await User.findById(userId).select('email');
    userEmail = user ? user.email : null;
  } catch (error) {
    console.error('Failed to fetch user email for audit log:', error);
  }

  return this.logAction({
    user: userId,
    userEmail,
    action,
    entityType,
    entityId,
    changes,
    metadata
  });
};

auditLogSchema.statics.logSystemAction = async function(action, entityType, entityId, changes = {}, metadata = {}) {
  return this.logAction({
    action,
    entityType,
    entityId,
    changes,
    metadata
  });
};

auditLogSchema.statics.getEntityHistory = function(entityType, entityId, limit = 50) {
  return this.find({
    entityType,
    entityId
  })
  .populate('user', 'firstName lastName email')
  .sort({ timestamp: -1 })
  .limit(limit);
};

auditLogSchema.statics.getUserActivity = function(userId, limit = 100) {
  return this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

auditLogSchema.statics.getSecurityEvents = function(riskLevel = 'high', days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.find({
    'risk.level': riskLevel,
    timestamp: { $gte: since }
  })
  .populate('user', 'firstName lastName email')
  .sort({ timestamp: -1 });
};

auditLogSchema.statics.getGDPRLogs = function(dataSubjectEmail, days = 2555) { // 7 years for GDPR
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.find({
    'compliance.gdpr.dataSubject': dataSubjectEmail,
    timestamp: { $gte: since }
  })
  .sort({ timestamp: -1 });
};

auditLogSchema.statics.cleanupOldLogs = function(daysToKeep = 365) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    'compliance.retention.deleteAfter': { $exists: false }
  });
};

auditLogSchema.statics.anonymizeOldLogs = function(daysToAnonymize = 2555) { // 7 years
  const cutoffDate = new Date(Date.now() - daysToAnonymize * 24 * 60 * 60 * 1000);

  return this.updateMany(
    {
      timestamp: { $lt: cutoffDate },
      'compliance.gdpr.dataSubject': { $exists: true }
    },
    {
      $unset: {
        user: 1,
        userEmail: 1,
        'metadata.ipAddress': 1,
        'metadata.location': 1
      },
      $set: {
        'compliance.retention.deleteAfter': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Keep anonymized for another year
        anonymizedAt: new Date()
      }
    }
  );
};

// Helper function to extract changes between objects
auditLogSchema.statics.extractChanges = function(before, after) {
  const changes = { before, after, fields: [] };
  const fields = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const field of fields) {
    const beforeValue = before ? before[field] : undefined;
    const afterValue = after ? after[field] : undefined;

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes.fields.push(field);
    }
  }

  return changes;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);