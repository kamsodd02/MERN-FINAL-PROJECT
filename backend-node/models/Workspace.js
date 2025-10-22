const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  logo: String, // URL to workspace logo

  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Members & Permissions
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'viewer'
    },
    permissions: {
      canCreateQuestionnaires: { type: Boolean, default: true },
      canEditQuestionnaires: { type: Boolean, default: true },
      canDeleteQuestionnaires: { type: Boolean, default: false },
      canViewAllResponses: { type: Boolean, default: true },
      canExportData: { type: Boolean, default: true },
      canManageMembers: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Settings
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestAccess: {
      type: Boolean,
      default: false
    },
    defaultQuestionnaireSettings: {
      allowAnonymous: { type: Boolean, default: true },
      showProgress: { type: Boolean, default: true },
      theme: {
        primaryColor: { type: String, default: '#3B82F6' }
      }
    },
    branding: {
      primaryColor: { type: String, default: '#3B82F6' },
      logo: String,
      customDomain: String
    }
  },

  // Statistics
  stats: {
    totalQuestionnaires: { type: Number, default: 0 },
    totalResponses: { type: Number, default: 0 },
    activeQuestionnaires: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 }
  },

  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'active'
    },
    limits: {
      maxQuestionnaires: { type: Number, default: 10 },
      maxResponsesPerMonth: { type: Number, default: 1000 },
      maxMembers: { type: Number, default: 5 },
      maxStorage: { type: Number, default: 100 }, // MB
      features: {
        advancedAnalytics: { type: Boolean, default: false },
        customBranding: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false }
      }
    },
    currentUsage: {
      questionnaires: { type: Number, default: 0 },
      responsesThisMonth: { type: Number, default: 0 },
      storageUsed: { type: Number, default: 0 }
    }
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ 'subscription.plan': 1, 'subscription.status': 1 });

// Virtual for member count
workspaceSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Pre-save middleware to update member count
workspaceSchema.pre('save', function(next) {
  this.stats.totalMembers = this.members.length;
  next();
});

// Instance methods
workspaceSchema.methods.addMember = function(userId, role, invitedBy) {
  // Check if user is already a member
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member of this workspace');
  }

  // Check subscription limits
  if (this.members.length >= this.subscription.limits.maxMembers) {
    throw new Error('Workspace member limit reached');
  }

  // Add new member
  this.members.push({
    user: userId,
    role: role,
    permissions: this.getPermissionsForRole(role),
    invitedBy: invitedBy,
    joinedAt: new Date()
  });
};

workspaceSchema.methods.removeMember = function(userId) {
  // Cannot remove owner
  if (this.owner.toString() === userId.toString()) {
    throw new Error('Cannot remove workspace owner');
  }

  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
};

workspaceSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  member.role = newRole;
  member.permissions = this.getPermissionsForRole(newRole);
};

workspaceSchema.methods.getPermissionsForRole = function(role) {
  const rolePermissions = {
    owner: {
      canCreateQuestionnaires: true,
      canEditQuestionnaires: true,
      canDeleteQuestionnaires: true,
      canViewAllResponses: true,
      canExportData: true,
      canManageMembers: true,
      canManageSettings: true
    },
    admin: {
      canCreateQuestionnaires: true,
      canEditQuestionnaires: true,
      canDeleteQuestionnaires: true,
      canViewAllResponses: true,
      canExportData: true,
      canManageMembers: true,
      canManageSettings: true
    },
    editor: {
      canCreateQuestionnaires: true,
      canEditQuestionnaires: true,
      canDeleteQuestionnaires: false,
      canViewAllResponses: true,
      canExportData: true,
      canManageMembers: false,
      canManageSettings: false
    },
    viewer: {
      canCreateQuestionnaires: false,
      canEditQuestionnaires: false,
      canDeleteQuestionnaires: false,
      canViewAllResponses: true,
      canExportData: false,
      canManageMembers: false,
      canManageSettings: false
    }
  };
  return rolePermissions[role] || rolePermissions.viewer;
};

workspaceSchema.methods.canUserCreateQuestionnaire = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.permissions.canCreateQuestionnaires : false;
};

workspaceSchema.methods.canUserManageMembers = function(userId) {
  // Owner can always manage members
  if (this.owner.toString() === userId.toString()) return true;

  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.permissions.canManageMembers : false;
};

workspaceSchema.methods.checkLimits = function() {
  const limits = this.subscription.limits;
  const usage = this.subscription.currentUsage;

  if (usage.questionnaires >= limits.maxQuestionnaires) {
    throw new Error('Questionnaire limit reached for this workspace');
  }

  if (usage.responsesThisMonth >= limits.maxResponsesPerMonth) {
    throw new Error('Monthly response limit reached for this workspace');
  }

  if (usage.storageUsed >= limits.maxStorage) {
    throw new Error('Storage limit reached for this workspace');
  }
};

workspaceSchema.methods.updateUsage = function(type, increment = 1) {
  if (!this.subscription.currentUsage.hasOwnProperty(type)) {
    throw new Error(`Invalid usage type: ${type}`);
  }

  this.subscription.currentUsage[type] += increment;
};

// Static methods
workspaceSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.user': userId });
};

workspaceSchema.statics.findOwnedByUser = function(userId) {
  return this.find({ owner: userId });
};

module.exports = mongoose.model('Workspace', workspaceSchema);