const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification Content
  type: {
    type: String,
    required: true,
    enum: [
      'questionnaire_response', 'questionnaire_published', 'questionnaire_closed',
      'collaborator_added', 'workspace_invitation', 'report_ready',
      'subscription_expiring', 'system_maintenance', 'security_alert'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // Related Entities
  relatedEntities: {
    questionnaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Questionnaire'
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace'
    },
    response: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Response'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Delivery Status
  deliveryStatus: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date
    },
    inApp: {
      read: { type: Boolean, default: false },
      readAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    }
  },

  // Priority & Urgency
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: Date,

  // Actions (for interactive notifications)
  actions: [{
    label: String,
    url: String,
    type: {
      type: String,
      enum: ['primary', 'secondary', 'danger']
    }
  }],

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ 'deliveryStatus.inApp.read': 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.deliveryStatus.inApp.read = true;
  this.deliveryStatus.inApp.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markEmailAsOpened = function() {
  this.deliveryStatus.email.opened = true;
  this.deliveryStatus.email.openedAt = new Date();
  return this.save();
};

notificationSchema.methods.markEmailAsClicked = function() {
  this.deliveryStatus.email.clicked = true;
  this.deliveryStatus.email.clickedAt = new Date();
  return this.save();
};

notificationSchema.methods.addAction = function(label, url, type = 'primary') {
  this.actions.push({ label, url, type });
  return this.save();
};

// Static methods
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();

  // Trigger real-time notification (would integrate with WebSocket/Socket.io)
  // this.emitToUser(notification.recipient, notification);

  return notification;
};

notificationSchema.statics.createQuestionnaireResponseNotification = async function(questionnaireId, responseId) {
  const Questionnaire = mongoose.model('Questionnaire');
  const Response = mongoose.model('Response');

  const questionnaire = await Questionnaire.findById(questionnaireId);
  const response = await Response.findById(responseId);

  if (!questionnaire) return null;

  // Notify questionnaire creator
  const notification = await this.createNotification({
    recipient: questionnaire.creator,
    type: 'questionnaire_response',
    title: 'New Response Received',
    message: `Your questionnaire "${questionnaire.title}" received a new response.`,
    relatedEntities: {
      questionnaire: questionnaireId,
      response: responseId
    }
  });

  return notification;
};

notificationSchema.statics.createQuestionnairePublishedNotification = async function(questionnaireId, publishedBy) {
  const Questionnaire = mongoose.model('Questionnaire');
  const questionnaire = await Questionnaire.findById(questionnaireId);

  if (!questionnaire) return null;

  // Notify collaborators
  const notifications = [];
  for (const collaborator of questionnaire.collaborators) {
    const notification = await this.createNotification({
      recipient: collaborator.user,
      type: 'questionnaire_published',
      title: 'Questionnaire Published',
      message: `The questionnaire "${questionnaire.title}" has been published.`,
      relatedEntities: {
        questionnaire: questionnaireId,
        user: publishedBy
      },
      createdBy: publishedBy
    });
    notifications.push(notification);
  }

  return notifications;
};

notificationSchema.statics.createCollaboratorAddedNotification = async function(questionnaireId, collaboratorId, addedBy) {
  const Questionnaire = mongoose.model('Questionnaire');
  const questionnaire = await Questionnaire.findById(questionnaireId);

  if (!questionnaire) return null;

  const notification = await this.createNotification({
    recipient: collaboratorId,
    type: 'collaborator_added',
    title: 'Added as Collaborator',
    message: `You have been added as a collaborator to "${questionnaire.title}".`,
    relatedEntities: {
      questionnaire: questionnaireId,
      user: addedBy
    },
    createdBy: addedBy
  });

  return notification;
};

notificationSchema.statics.createWorkspaceInvitationNotification = async function(workspaceId, invitedUserId, invitedBy) {
  const Workspace = mongoose.model('Workspace');
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) return null;

  const notification = await this.createNotification({
    recipient: invitedUserId,
    type: 'workspace_invitation',
    title: 'Workspace Invitation',
    message: `You have been invited to join the workspace "${workspace.name}".`,
    relatedEntities: {
      workspace: workspaceId,
      user: invitedBy
    },
    createdBy: invitedBy,
    actions: [
      { label: 'Accept', url: `/workspace/${workspaceId}/accept`, type: 'primary' },
      { label: 'Decline', url: `/workspace/${workspaceId}/decline`, type: 'secondary' }
    ]
  });

  return notification;
};

notificationSchema.statics.createReportReadyNotification = async function(questionnaireId, reportType, generatedBy) {
  const Questionnaire = mongoose.model('Questionnaire');
  const questionnaire = await Questionnaire.findById(questionnaireId);

  if (!questionnaire) return null;

  const notification = await this.createNotification({
    recipient: questionnaire.creator,
    type: 'report_ready',
    title: 'Report Ready',
    message: `Your ${reportType} report for "${questionnaire.title}" is ready for download.`,
    relatedEntities: {
      questionnaire: questionnaireId,
      user: generatedBy
    },
    createdBy: generatedBy,
    priority: 'high'
  });

  return notification;
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    'deliveryStatus.inApp.read': false
  });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      'deliveryStatus.inApp.read': false
    },
    {
      'deliveryStatus.inApp.read': true,
      'deliveryStatus.inApp.readAt': new Date()
    }
  );
};

notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);