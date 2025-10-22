const mongoose = require('mongoose');

const questionnaireSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['survey', 'quiz', 'feedback', 'registration', 'assessment', 'poll'],
    default: 'survey'
  },

  // Ownership & Access
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },

  // Questions Structure
  questions: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'multiple_choice', 'checkboxes', 'text_short', 'text_long',
        'rating', 'scale', 'date', 'time', 'datetime', 'file_upload',
        'matrix', 'ranking', 'demographic'
      ]
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    helpText: {
      type: String,
      trim: true,
      maxlength: 500
    },

    // Question Configuration
    required: {
      type: Boolean,
      default: false
    },
    isVisible: {
      type: Boolean,
      default: true
    },

    // Type-specific options
    options: [{
      id: String,
      text: {
        type: String,
        required: true,
        trim: true
      },
      value: mongoose.Schema.Types.Mixed,
      isOther: {
        type: Boolean,
        default: false
      },
      image: String, // URL for image choices
      score: Number // For quiz scoring
    }],

    // Validation Rules
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      customError: String,
      fileTypes: [String], // For file uploads
      maxFileSize: Number // In bytes
    },

    // Conditional Logic
    logic: [{
      conditions: [{
        questionId: String,
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains', 'not_contains',
                 'greater_than', 'less_than', 'is_empty', 'is_not_empty']
        },
        value: mongoose.Schema.Types.Mixed
      }],
      action: {
        type: String,
        enum: ['show', 'hide', 'skip_to', 'require', 'unrequire']
      },
      targetQuestionId: String, // For skip_to action
      isAndCondition: {
        type: Boolean,
        default: true // true = AND, false = OR
      }
    }],

    // Advanced Features
    randomization: {
      enabled: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['options', 'questions'],
        default: 'options'
      }
    },

    // Metadata
    order: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Settings & Configuration
  settings: {
    // Access Control
    isPublic: {
      type: Boolean,
      default: false
    },
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    requireEmail: {
      type: Boolean,
      default: false
    },
    allowEditAfterSubmit: {
      type: Boolean,
      default: false
    },

    // Response Limits
    responseLimit: {
      enabled: {
        type: Boolean,
        default: false
      },
      maxResponses: Number,
      closeOnLimit: {
        type: Boolean,
        default: true
      }
    },

    // Timing
    deadline: {
      enabled: {
        type: Boolean,
        default: false
      },
      date: Date,
      closeOnDeadline: {
        type: Boolean,
        default: true
      }
    },

    // Appearance
    theme: {
      primaryColor: {
        type: String,
        default: '#3B82F6'
      },
      backgroundColor: {
        type: String,
        default: '#FFFFFF'
      },
      fontFamily: {
        type: String,
        default: 'Inter, sans-serif'
      },
      logo: String, // URL to logo
      customCSS: String
    },

    // Progress & Navigation
    showProgress: {
      type: Boolean,
      default: true
    },
    allowBackNavigation: {
      type: Boolean,
      default: true
    },

    // Notifications
    notifications: {
      emailOnResponse: {
        type: Boolean,
        default: false
      },
      emailOnComplete: {
        type: Boolean,
        default: false
      },
      webhookOnResponse: {
        type: Boolean,
        default: false
      },
      webhookUrl: String
    },

    // Advanced Features
    isTemplate: {
      type: Boolean,
      default: false
    },
    version: {
      type: Number,
      default: 1
    }
  },

  // Status & Workflow
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'closed', 'archived'],
    default: 'draft'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['draft', 'review', 'published', 'closed', 'archived']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],

  // Publishing Information
  publishedAt: Date,
  closedAt: Date,

  // Statistics (denormalized for performance)
  stats: {
    totalResponses: {
      type: Number,
      default: 0
    },
    completedResponses: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageCompletionTime: Number, // in seconds
    lastResponseAt: Date
  },

  // Collaboration
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    permissions: {
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canPublish: { type: Boolean, default: false },
      canViewResponses: { type: Boolean, default: true }
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Tags & Organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Version Control
  versions: [{
    version: Number,
    snapshot: mongoose.Schema.Types.Mixed, // Full questionnaire snapshot
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    changes: String // Description of changes
  }],

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

// Indexes for performance
questionnaireSchema.index({ creator: 1, createdAt: -1 });
questionnaireSchema.index({ workspace: 1, status: 1, createdAt: -1 });
questionnaireSchema.index({ status: 1, publishedAt: -1 });
questionnaireSchema.index({ tags: 1 });
questionnaireSchema.index({ "collaborators.user": 1 });
questionnaireSchema.index({ "questions.id": 1 });

// Virtual for public URL
questionnaireSchema.virtual('publicUrl').get(function() {
  return `${process.env.FRONTEND_URL}/questionnaire/${this._id}`;
});

// Pre-save middleware for version control
questionnaireSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.settings.version += 1;
  }
  next();
});

// Instance methods
questionnaireSchema.methods.canUserEdit = function(userId) {
  // Creator can always edit
  if (this.creator.toString() === userId.toString()) return true;

  // Check collaborators
  const collaborator = this.collaborators.find(c =>
    c.user.toString() === userId.toString() && c.permissions.canEdit
  );
  return !!collaborator;
};

questionnaireSchema.methods.canUserViewResponses = function(userId) {
  // Creator can always view
  if (this.creator.toString() === userId.toString()) return true;

  // Check collaborators
  const collaborator = this.collaborators.find(c =>
    c.user.toString() === userId.toString() && c.permissions.canViewResponses
  );
  return !!collaborator;
};

questionnaireSchema.methods.addCollaborator = function(userId, role, addedBy) {
  // Remove existing collaborator if any
  this.collaborators = this.collaborators.filter(c =>
    c.user.toString() !== userId.toString()
  );

  // Add new collaborator
  this.collaborators.push({
    user: userId,
    role: role,
    permissions: this.getPermissionsForRole(role),
    addedBy: addedBy,
    addedAt: new Date()
  });
};

questionnaireSchema.methods.getPermissionsForRole = function(role) {
  const rolePermissions = {
    viewer: {
      canEdit: false,
      canDelete: false,
      canPublish: false,
      canViewResponses: true
    },
    editor: {
      canEdit: true,
      canDelete: false,
      canPublish: false,
      canViewResponses: true
    },
    admin: {
      canEdit: true,
      canDelete: true,
      canPublish: true,
      canViewResponses: true
    }
  };
  return rolePermissions[role] || rolePermissions.viewer;
};

questionnaireSchema.methods.updateStats = function() {
  // This would be called after response operations
  // Implementation would calculate stats from responses collection
};

module.exports = mongoose.model('Questionnaire', questionnaireSchema);