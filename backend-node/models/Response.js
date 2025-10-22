const mongoose = require('mongoose');

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
responseSchema.index({ questionnaire: 1, status: 1, 'metadata.submittedAt': -1 });

// Compound indexes for analytics
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

// Instance methods
responseSchema.methods.calculateScore = function(questionnaire) {
  if (!questionnaire || questionnaire.category !== 'quiz') return;

  let totalScore = 0;
  let maxScore = 0;
  const questionScores = [];

  this.answers.forEach(answer => {
    const question = questionnaire.questions.find(q => q.id === answer.questionId);
    if (question && question.options) {
      const correctOption = question.options.find(opt => opt.score !== undefined);
      if (correctOption) {
        maxScore += correctOption.score;
        const selectedOption = question.options.find(opt => opt.id === answer.answer);
        if (selectedOption && selectedOption.score !== undefined) {
          totalScore += selectedOption.score;
          questionScores.push({
            questionId: answer.questionId,
            score: selectedOption.score,
            maxScore: correctOption.score,
            isCorrect: selectedOption.score === correctOption.score
          });
        }
      }
    }
  });

  this.scoring = {
    totalScore,
    maxScore,
    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    grade: this.calculateGrade(totalScore, maxScore),
    passed: totalScore >= (maxScore * 0.6), // 60% passing threshold
    questionScores
  };
};

responseSchema.methods.calculateGrade = function(score, maxScore) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

responseSchema.methods.performQualityChecks = function() {
  const flags = [];

  // Speeding check (too fast completion)
  if (this.metadata.completionTime && this.progress.totalQuestions) {
    const avgTimePerQuestion = this.metadata.completionTime / this.progress.totalQuestions;
    if (avgTimePerQuestion < 5) { // Less than 5 seconds per question
      flags.push({
        type: 'speeding',
        severity: 'high',
        description: 'Response completed too quickly'
      });
    }
  }

  // Straight lining check (same answer pattern)
  const answerPattern = this.answers.map(a => a.answer).join('');
  if (answerPattern.length > 5 && /^(.)\1+$/.test(answerPattern)) {
    flags.push({
      type: 'straight_lining',
      severity: 'medium',
      description: 'Same answer pattern detected'
    });
  }

  // Bot detection (suspicious patterns)
  if (this.metadata.userAgent && /bot|crawler|spider/i.test(this.metadata.userAgent)) {
    flags.push({
      type: 'bot_detected',
      severity: 'high',
      description: 'Bot-like user agent detected'
    });
  }

  this.qualityChecks.flags = flags;
  this.qualityChecks.isSuspicious = flags.some(f => f.severity === 'high');
};

responseSchema.methods.addAuditEntry = function(action, performedBy, details = {}) {
  this.auditLog.push({
    action,
    performedBy,
    timestamp: new Date(),
    details,
    ipAddress: this.metadata.ipAddress,
    userAgent: this.metadata.userAgent
  });
};

// Static methods
responseSchema.statics.getResponseStats = function(questionnaireId) {
  return this.aggregate([
    { $match: { questionnaire: mongoose.Types.ObjectId(questionnaireId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        abandoned: {
          $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] }
        },
        avgCompletionTime: { $avg: '$metadata.completionTime' },
        lastResponseAt: { $max: '$metadata.submittedAt' }
      }
    }
  ]);
};

module.exports = mongoose.model('Response', responseSchema);