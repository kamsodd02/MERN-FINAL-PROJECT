const mongoose = require('mongoose');

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

// Instance methods
analyticsSchema.methods.calculateResponseStats = async function() {
  const Response = mongoose.model('Response');

  const stats = await Response.aggregate([
    {
      $match: {
        questionnaire: this.questionnaire,
        createdAt: { $gte: this.dateRange.start, $lte: this.dateRange.end }
      }
    },
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
        medianCompletionTime: { $avg: '$metadata.completionTime' } // Simplified
      }
    }
  ]);

  if (stats.length > 0) {
    const stat = stats[0];
    this.responseStats = {
      total: stat.total,
      completed: stat.completed,
      abandoned: stat.abandoned,
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
      averageCompletionTime: Math.round(stat.avgCompletionTime || 0),
      medianCompletionTime: Math.round(stat.medianCompletionTime || 0)
    };
  }
};

analyticsSchema.methods.calculateQuestionAnalytics = async function() {
  const Response = mongoose.model('Response');
  const Questionnaire = mongoose.model('Questionnaire');

  // Get questionnaire to understand question structure
  const questionnaire = await Questionnaire.findById(this.questionnaire);
  if (!questionnaire) return;

  const questionAnalytics = [];

  for (const question of questionnaire.questions) {
    const responses = await Response.find({
      questionnaire: this.questionnaire,
      'answers.questionId': question.id,
      createdAt: { $gte: this.dateRange.start, $lte: this.dateRange.end }
    });

    const totalResponses = responses.length;
    const skippedCount = responses.filter(r =>
      r.answers.find(a => a.questionId === question.id && a.isSkipped)
    ).length;

    const analytics = {
      questionId: question.id,
      questionType: question.type,
      questionText: question.title,
      totalResponses,
      skippedCount
    };

    // Calculate type-specific analytics
    analytics.analytics = await this.calculateQuestionTypeAnalytics(question, responses);

    // Text analysis for text questions
    if (question.type.includes('text')) {
      analytics.textAnalysis = await this.performTextAnalysis(responses, question.id);
    }

    questionAnalytics.push(analytics);
  }

  this.questionAnalytics = questionAnalytics;
};

analyticsSchema.methods.calculateQuestionTypeAnalytics = function(question, responses) {
  const analytics = {};

  switch (question.type) {
    case 'multiple_choice':
    case 'checkboxes':
      analytics.optionCounts = {};
      question.options.forEach(option => {
        analytics.optionCounts[option.text] = 0;
      });

      responses.forEach(response => {
        const answer = response.answers.find(a => a.questionId === question.id);
        if (answer && answer.answer) {
          if (Array.isArray(answer.answer)) {
            answer.answer.forEach(ans => {
              if (analytics.optionCounts[ans]) {
                analytics.optionCounts[ans]++;
              }
            });
          } else {
            if (analytics.optionCounts[answer.answer]) {
              analytics.optionCounts[answer.answer]++;
            }
          }
        }
      });
      break;

    case 'rating':
    case 'scale':
      const ratings = responses
        .map(r => r.answers.find(a => a.questionId === question.id)?.answer)
        .filter(rating => rating !== null && rating !== undefined);

      analytics.average = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 0;
      analytics.min = ratings.length > 0 ? Math.min(...ratings) : 0;
      analytics.max = ratings.length > 0 ? Math.max(...ratings) : 0;
      analytics.distribution = this.calculateRatingDistribution(ratings, question);
      break;

    default:
      analytics.custom = 'Analytics not available for this question type';
  }

  return analytics;
};

analyticsSchema.methods.calculateRatingDistribution = function(ratings, question) {
  const distribution = {};
  const maxRating = question.validation?.max || 5;

  for (let i = 1; i <= maxRating; i++) {
    distribution[i] = 0;
  }

  ratings.forEach(rating => {
    if (distribution[rating] !== undefined) {
      distribution[rating]++;
    }
  });

  return distribution;
};

analyticsSchema.methods.performTextAnalysis = async function(responses, questionId) {
  const texts = responses
    .map(r => r.answers.find(a => a.questionId === questionId)?.answer)
    .filter(text => text && typeof text === 'string');

  if (texts.length === 0) {
    return {
      wordCount: 0,
      averageLength: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      keywords: []
    };
  }

  // Basic text analysis (would be enhanced with NLP libraries)
  const totalWords = texts.reduce((sum, text) => sum + text.split(' ').length, 0);
  const averageLength = totalWords / texts.length;

  // Simple sentiment analysis (placeholder)
  const sentiment = {
    positive: Math.floor(Math.random() * 30) + 20, // Mock data
    neutral: Math.floor(Math.random() * 40) + 30,
    negative: Math.floor(Math.random() * 20) + 10
  };

  // Extract keywords (simplified)
  const keywords = this.extractKeywords(texts);

  return {
    wordCount: totalWords,
    averageLength: Math.round(averageLength),
    sentiment,
    keywords
  };
};

analyticsSchema.methods.extractKeywords = function(texts) {
  const wordCount = {};
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

  texts.forEach(text => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word));

    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
  });

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      relevance: Math.round((count / texts.length) * 100)
    }));
};

analyticsSchema.methods.calculateDemographics = async function() {
  const Response = mongoose.model('Response');

  const demographics = await Response.aggregate([
    {
      $match: {
        questionnaire: this.questionnaire,
        createdAt: { $gte: this.dateRange.start, $lte: this.dateRange.end }
      }
    },
    {
      $group: {
        _id: null,
        deviceTypes: {
          $push: {
            $cond: {
              if: { $regexMatch: { input: '$metadata.userAgent', regex: /mobile/i } },
              then: 'mobile',
              else: {
                $cond: {
                  if: { $regexMatch: { input: '$metadata.userAgent', regex: /tablet/i } },
                  then: 'tablet',
                  else: 'desktop'
                }
              }
            }
          }
        },
        browsers: { $push: '$metadata.userAgent' },
        locations: { $push: '$metadata.location.country' },
        languages: { $push: '$metadata.language' },
        timezones: { $push: '$metadata.timezone' }
      }
    }
  ]);

  if (demographics.length > 0) {
    const data = demographics[0];
    this.demographics = {
      deviceTypes: this.aggregateArray(data.deviceTypes),
      browsers: this.aggregateArray(data.browsers.map(ua => this.parseBrowser(ua))),
      locations: this.aggregateArray(data.locations.filter(Boolean)),
      languages: this.aggregateArray(data.languages.filter(Boolean)),
      timezones: this.aggregateArray(data.timezones.filter(Boolean))
    };
  }
};

analyticsSchema.methods.aggregateArray = function(arr) {
  const counts = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });

  return Object.entries(counts).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / arr.length) * 100)
  }));
};

analyticsSchema.methods.parseBrowser = function(userAgent) {
  // Simplified browser detection
  if (!userAgent) return 'Unknown';

  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';

  return 'Other';
};

analyticsSchema.methods.generateReport = async function() {
  await Promise.all([
    this.calculateResponseStats(),
    this.calculateQuestionAnalytics(),
    this.calculateDemographics()
  ]);

  this.lastUpdated = new Date();
  this.cacheExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
};

// Static methods
analyticsSchema.statics.generateRealtimeAnalytics = function(questionnaireId, workspaceId) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

  return this.findOneAndUpdate(
    {
      questionnaire: questionnaireId,
      reportType: 'realtime',
      'dateRange.start': startDate,
      'dateRange.end': endDate
    },
    {
      questionnaire: questionnaireId,
      workspace: workspaceId,
      dateRange: { start: startDate, end: endDate },
      reportType: 'realtime'
    },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('Analytics', analyticsSchema);