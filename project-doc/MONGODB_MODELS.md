# MongoDB Database Schema - MERN Questionnaire Platform

## 📋 Table of Contents
1. [Database Overview](#database-overview)
2. [Core Models](#core-models)
3. [Supporting Models](#supporting-models)
4. [Relationships & References](#relationships--references)
5. [Indexing Strategy](#indexing-strategy)
6. [Validation Rules](#validation-rules)
7. [Data Migration Strategy](#data-migration-strategy)

---

## 🗄️ Database Overview

### Database Architecture
- **Database Name**: `mern-questionnaire`
- **ODM**: Mongoose for Node.js backend
- **Design Pattern**: Document-based with references
- **Indexing**: Strategic compound indexes for performance
- **Validation**: Schema-level and application-level validation

### Design Principles
- **Normalization**: Balance between embedding and referencing
- **Scalability**: Horizontal scaling with sharding considerations
- **Performance**: Optimized queries with proper indexing
- **Flexibility**: Schema evolution support
- **Security**: Data isolation and access control

---

## 🎯 Core Models

### 1. User Model
```javascript
const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include in queries by default
  },

  // Profile Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String, // URL to avatar image
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },

  // Account Settings
  role: {
    type: String,
    enum: ['admin', 'creator', 'respondent', 'viewer'],
    default: 'creator'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Authentication
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    deviceInfo: {
      userAgent: String,
      ipAddress: String
    }
  }],

  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // Activity Tracking
  lastLoginAt: Date,
  lastActiveAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },

  // Relationships
  workspaces: [{
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'viewer'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
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

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'workspaces.workspace': 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
```

### 2. Questionnaire Model
```javascript
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
questionnaireSchema.index({ 'collaborators.user': 1 });
questionnaireSchema.index({ 'questions.id': 1 });

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

module.exports = mongoose.model('Questionnaire', questionnaireSchema);
```

### 3. Response Model
```javascript
const responseSchema = new mongoose.Schema({
  // Relationships
  questionnaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for anonymous responses
  },

  // Response Data
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      required: true
    },
    answer: mongoose.Schema.Types.Mixed, // Flexible type for different answer formats
    metadata: {
      timeSpent: Number, // Time spent on this question in seconds
      isSkipped: {
        type: Boolean,
        default: false
      },
      isValid: {
        type: Boolean,
        default: true
      },
      validationErrors: [String]
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Response Metadata
  metadata: {
    // Session Information
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: Date,
    lastModifiedAt: Date,

    // Device & Location
    ipAddress: String,
    userAgent: String,
    referrer: String,
    language: String,
    timezone: String,

    // Geolocation (optional)
    location: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },

    // Performance Metrics
    completionTime: Number, // Total time in seconds
    pageViews: Number,
    questionViews: Number,

    // Source Tracking
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String
  },

  // Status & Progress
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'disqualified'],
    default: 'in_progress'
  },
  progress: {
    completedQuestions: {
      type: Number,
      default: 0
    },
    totalQuestions: Number,
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Respondent Information (for non-anonymous responses)
  respondentInfo: {
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    firstName: String,
    lastName: String,
    customFields: mongoose.Schema.Types.Mixed // For additional respondent data
  },

  // Scoring & Analysis (for quizzes/assessments)
  scoring: {
    totalScore: Number,
    maxScore: Number,
    percentage: Number,
    grade: String, // A, B, C, etc.
    passed: Boolean,
    questionScores: [{
      questionId: String,
      score: Number,
      maxScore: Number,
      isCorrect: Boolean
    }]
  },

  // Quality Assurance
  qualityChecks: {
    isSuspicious: {
      type: Boolean,
      default: false
    },
    flags: [{
      type: {
        type: String,
        enum: ['speeding', 'straight_lining', 'inconsistent', 'bot_detected']
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      description: String,
      flaggedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String
  },

  // Integration Data
  integrations: {
    webhookDelivered: {
      type: Boolean,
      default: false
    },
    webhookAttempts: {
      type: Number,
      default: 0
    },
    webhookLastAttempt: Date,
    webhookResponse: mongoose.Schema.Types.Mixed,

    // CRM Integration
    crmSynced: {
      type: Boolean,
      default: false
    },
    crmId: String,
    crmLastSync: Date,

    // Email Marketing
    emailSent: {
      type: Boolean,
      default: false
    },
    emailOpened: {
      type: Boolean,
      default: false
    },
    emailClicked: {
      type: Boolean,
      default: false
    }
  },

  // Audit Trail
  auditLog: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'submitted', 'reviewed', 'flagged', 'deleted']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
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
responseSchema.index({ questionnaire: 1, createdAt: -1 });
responseSchema.index({ respondent: 1, createdAt: -1 });
responseSchema.index({ status: 1, 'metadata.submittedAt': -1 });
responseSchema.index({ 'metadata.sessionId': 1 }, { unique: true });
responseSchema.index({ 'qualityChecks.isSuspicious': 1 });
responseSchema.index({ 'integrations.crmSynced': 1 });

// Compound indexes for analytics
responseSchema.index({ questionnaire: 1, status: 1, 'metadata.submittedAt': -1 });
responseSchema.index({ questionnaire: 1, 'metadata.ipAddress': 1 });

// Virtual for completion status
responseSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for response duration
responseSchema.virtual('duration').get(function() {
  if (!this.metadata.submittedAt || !this.metadata.startedAt) return null;
  return Math.floor((this.metadata.submittedAt - this.metadata.startedAt) / 1000);
});

// Pre-save middleware for progress calculation
responseSchema.pre('save', function(next) {
  if (this.answers && this.progress) {
    this.progress.completedQuestions = this.answers.filter(a => a.answer !== null && a.answer !== undefined && a.answer !== '').length;
    if (this.progress.totalQuestions) {
      this.progress.percentage = Math.round((this.progress.completedQuestions / this.progress.totalQuestions) * 100);
    }
  }
  next();
});

module.exports = mongoose.model('Response', responseSchema);
```

---

## 🏢 Supporting Models

### 4. Workspace Model
```javascript
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

module.exports = mongoose.model('Workspace', workspaceSchema);
```

### 5. Analytics Model
```javascript
const analyticsSchema = new mongoose.Schema({
  // Relationships
  questionnaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },

  // Time Range
  dateRange: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },

  // Response Statistics
  responseStats: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    abandoned: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 }, // in seconds
    medianCompletionTime: { type: Number, default: 0 }
  },

  // Question Analytics
  questionAnalytics: [{
    questionId: String,
    questionType: String,
    questionText: String,

    // Response counts
    totalResponses: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },

    // Type-specific analytics
    analytics: mongoose.Schema.Types.Mixed, // Flexible for different question types

    // Text analysis (for text questions)
    textAnalysis: {
      wordCount: Number,
      averageLength: Number,
      sentiment: {
        positive: { type: Number, default: 0 },
        neutral: { type: Number, default: 0 },
        negative: { type: Number, default: 0 }
      },
      keywords: [{
        word: String,
        count: Number,
        relevance: Number
      }]
    }
  }],

  // Demographic Analytics
  demographics: {
    deviceTypes: [{
      type: { type: String }, // desktop, mobile, tablet
      count: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }],
    browsers: [{
      name: String,
      version: String,
      count: { type: Number, default: 0 }
    }],
    locations: [{
      country: String,
      region: String,
      count: { type: Number, default: 0 }
    }],
    languages: [{
      code: String,
      name: String,
      count: { type: Number, default: 0 }
    }],
    timezones: [{
      name: String,
      offset: String,
      count: { type: Number, default: 0 }
    }]
  },

  // Time-based Analytics
  timeAnalytics: {
    hourlyDistribution: [{ hour: Number, count: Number }],
    dailyDistribution: [{ date: Date, count: Number }],
    weeklyDistribution: [{ week: String, count: Number }],
    monthlyDistribution: [{ month: String, count: Number }],

    // Peak times
    peakHours: [{
      hour: Number,
      count: Number,
      percentage: Number
    }],
    peakDays: [{
      day: String,
      count: Number,
      percentage: Number
    }]
  },

  // Quality Metrics
  qualityMetrics: {
    suspiciousResponses: { type: Number, default: 0 },
    averageSpeed: { type: Number, default: 0 }, // seconds per question
    straightLiningScore: { type: Number, default: 0 }, // 0-100
    attentionCheckPassRate: { type: Number, default: 0 }
  },

  // Custom Metrics
  customMetrics: mongoose.Schema.Types.Mixed,

  // AI Insights
  aiInsights: {
    generatedAt: Date,
    summary: String,
    keyFindings: [String],
    recommendations: [String],
    sentimentOverview: {
      overall: String,
      trends: [String]
    },
    correlations: [{
      question1: String,
      question2: String,
      correlation: Number,
      significance: String
    }]
  },

  // Report Metadata
  reportType: {
    type: String,
    enum: ['realtime', 'daily', 'weekly', 'monthly', 'custom'],
    default: 'custom'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  },

  // Cache control
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  cacheExpiry: Date,

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
  timestamps: true
});

// Indexes
analyticsSchema.index({ questionnaire: 1, 'dateRange.start': 1, 'dateRange.end': 1 });
analyticsSchema.index({ workspace: 1, createdAt: -1 });
analyticsSchema.index({ reportType: 1, createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
```

### 6. Notification Model
```javascript
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

module.exports = mongoose.model('Notification', notificationSchema);
```

### 7. Audit Log Model
```javascript
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

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

---

## 🔗 Relationships & References

### Entity Relationships Diagram
```
User
├── 1:N Workspaces (member)
├── 1:N Questionnaires (creator)
├── 1:N Responses (respondent)
└── 1:N Notifications (recipient)

Workspace
├── 1:1 Owner (User)
├── 1:N Members (Users)
└── 1:N Questionnaires

Questionnaire
├── 1:1 Creator (User)
├── 1:1 Workspace
├── 1:N Collaborators (Users)
├── 1:N Responses
└── 1:1 Analytics

Response
├── 1:1 Questionnaire
├── 0:1 Respondent (User)
└── 1:N AuditLogs

Analytics
├── 1:1 Questionnaire
└── 1:1 Workspace

Notification
├── 1:1 Recipient (User)
├── 0:1 Questionnaire
├── 0:1 Workspace
├── 0:1 Response
└── 0:1 User

AuditLog
├── 0:1 User (actor)
├── 1:1 Entity (User/Questionnaire/Response/Workspace)
└── 1:1 Timestamp
```

### Reference Strategy
- **Populate**: Use Mongoose populate for frequently accessed references
- **Denormalization**: Store redundant data for performance (stats, counts)
- **Virtuals**: Computed fields for derived data
- **Embedded Documents**: For tightly coupled data (question options, logic conditions)

---

## 📊 Indexing Strategy

### Performance Indexes
```javascript
// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "workspaces.workspace": 1 });
db.users.createIndex({ role: 1, isActive: 1 });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ lastActiveAt: -1 });

// Questionnaire indexes
db.questionnaires.createIndex({ creator: 1, createdAt: -1 });
db.questionnaires.createIndex({ workspace: 1, status: 1, createdAt: -1 });
db.questionnaires.createIndex({ status: 1, publishedAt: -1 });
db.questionnaires.createIndex({ tags: 1 });
db.questionnaires.createIndex({ "collaborators.user": 1 });
db.questionnaires.createIndex({ "questions.id": 1 });

// Response indexes
db.responses.createIndex({ questionnaire: 1, createdAt: -1 });
db.responses.createIndex({ respondent: 1, createdAt: -1 });
db.responses.createIndex({ status: 1, "metadata.submittedAt": -1 });
db.responses.createIndex({ "metadata.sessionId": 1 }, { unique: true });
db.responses.createIndex({ "qualityChecks.isSuspicious": 1 });
db.responses.createIndex({ questionnaire: 1, status: 1, "metadata.submittedAt": -1 });

// Analytics indexes
db.analytics.createIndex({ questionnaire: 1, "dateRange.start": 1, "dateRange.end": 1 });
db.analytics.createIndex({ workspace: 1, createdAt: -1 });

// Notification indexes
db.notifications.createIndex({ recipient: 1, createdAt: -1 });
db.notifications.createIndex({ "deliveryStatus.inApp.read": 1, createdAt: -1 });

// Audit log indexes
db.auditlogs.createIndex({ user: 1, timestamp: -1 });
db.auditlogs.createIndex({ entityType: 1, entityId: 1, timestamp: -1 });
db.auditlogs.createIndex({ action: 1, timestamp: -1 });
```

### Index Maintenance
- **Monitoring**: Use MongoDB profiler to identify slow queries
- **Cleanup**: Remove unused indexes regularly
- **Compound Indexes**: Optimize for common query patterns
- **TTL Indexes**: Automatic expiration for temporary data

---

## ✅ Validation Rules

### Schema Validation
```javascript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// URL validation
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Custom validators
const validateEmail = function(email) {
  return emailRegex.test(email);
};

const validatePassword = function(password) {
  return passwordRegex.test(password);
};

const validateUrl = function(url) {
  return urlRegex.test(url);
};
```

### Business Logic Validation
- **Questionnaire Limits**: Check workspace subscription limits
- **Response Validation**: Question-specific validation rules
- **Permission Checks**: Role-based access control
- **Data Integrity**: Referential integrity validation

---

## 🚀 Data Migration Strategy

### Version Control
```javascript
// Migration versioning
const migrations = {
  '1.0.0': {
    description: 'Initial schema',
    up: async () => { /* migration logic */ },
    down: async () => { /* rollback logic */ }
  },
  '1.1.0': {
    description: 'Add analytics collection',
    up: async () => {
      // Create analytics collection
      await mongoose.connection.createCollection('analytics');
      // Migrate existing data
    },
    down: async () => {
      await mongoose.connection.dropCollection('analytics');
    }
  }
};
```

### Migration Best Practices
- **Incremental**: Small, reversible changes
- **Testing**: Test migrations on staging environment
- **Backup**: Always backup before migration
- **Rollback**: Implement rollback strategies
- **Documentation**: Document all schema changes

---

## 📈 Scaling Considerations

### Database Optimization
- **Read Replicas**: For read-heavy operations
- **Sharding**: Distribute data across multiple servers
- **Caching**: Redis for frequently accessed data
- **Archiving**: Move old data to cheaper storage

### Query Optimization
- **Covered Queries**: Include all fields in indexes
- **Pagination**: Implement cursor-based pagination
- **Aggregation Pipeline**: Use MongoDB aggregation for complex queries
- **Projection**: Only fetch required fields

### Performance Monitoring
- **Slow Query Log**: Monitor and optimize slow queries
- **Index Usage**: Track index effectiveness
- **Connection Pooling**: Optimize database connections
- **Memory Usage**: Monitor memory consumption

---

*This MongoDB schema document provides a comprehensive foundation for the MERN Questionnaire Platform, ensuring optimal performance, scalability, and maintainability.*