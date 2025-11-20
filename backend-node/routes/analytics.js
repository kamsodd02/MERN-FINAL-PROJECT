const express = require('express');
const mongoose = require('mongoose');
const Questionnaire = require('../models/Questionnaire');
const Response = require('../models/Response');
const Analytics = require('../models/Analytics');
const { authenticate } = require('../middleware/auth');

// For newer mongoose versions
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/analytics/questionnaires/:questionnaireId/summary - Get response summary
router.get('/questionnaires/:questionnaireId/summary', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.questionnaireId);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check access permissions
    if (!questionnaire.canUserViewResponses(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get basic statistics
    const totalResponses = await Response.countDocuments({
      questionnaire: req.params.questionnaireId,
      status: 'completed'
    });

    const completedResponses = totalResponses; // All queried are completed
    const completionRate = totalResponses > 0 ? 100 : 0;

    // Get response timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const responseTimeline = await Response.aggregate([
      {
        $match: {
          questionnaire: mongoose.Types.ObjectId(req.params.questionnaireId),
          status: 'completed',
          'metadata.submittedAt': { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$metadata.submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get average completion time
    const completionTimeStats = await Response.aggregate([
      {
        $match: {
          questionnaire: mongoose.Types.ObjectId(req.params.questionnaireId),
          status: 'completed',
          'metadata.completionTime': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionTime: { $avg: '$metadata.completionTime' },
          minCompletionTime: { $min: '$metadata.completionTime' },
          maxCompletionTime: { $max: '$metadata.completionTime' }
        }
      }
    ]);

    const avgCompletionTime = completionTimeStats.length > 0 ?
      completionTimeStats[0].avgCompletionTime : 0;

    res.json({
      questionnaireId: req.params.questionnaireId,
      summary: {
        totalResponses,
        completedResponses,
        completionRate,
        averageCompletionTime: Math.round(avgCompletionTime),
        responseTimeline: responseTimeline.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ message: 'Failed to fetch analytics summary' });
  }
});

// GET /api/analytics/questionnaires/:questionnaireId/trends - Get response trends
router.get('/questionnaires/:questionnaireId/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const questionnaire = await Questionnaire.findById(req.params.questionnaireId);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check access permissions
    if (!questionnaire.canUserViewResponses(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get response trends
    const trends = await Response.aggregate([
      {
        $match: {
          questionnaire: mongoose.Types.ObjectId(req.params.questionnaireId),
          status: 'completed',
          'metadata.submittedAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === '24h' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
              date: '$metadata.submittedAt'
            }
          },
          count: { $sum: 1 },
          avgCompletionTime: { $avg: '$metadata.completionTime' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get question-specific trends (for questions with time-series data)
    const questionTrends = [];
    for (const question of questionnaire.questions) {
      if (question.type === 'rating' || question.type === 'scale') {
        const questionData = await Response.aggregate([
          {
            $match: {
              questionnaire: mongoose.Types.ObjectId(req.params.questionnaireId),
              status: 'completed',
              'metadata.submittedAt': { $gte: startDate }
            }
          },
          {
            $unwind: '$answers'
          },
          {
            $match: { 'answers.questionId': question.id }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: period === '24h' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
                  date: '$metadata.submittedAt'
                }
              },
              avgRating: { $avg: { $toDouble: '$answers.answer' } },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id': 1 }
          }
        ]);

        if (questionData.length > 0) {
          questionTrends.push({
            questionId: question.id,
            questionTitle: question.title,
            data: questionData.map(item => ({
              date: item._id,
              averageRating: Math.round(item.avgRating * 100) / 100,
              count: item.count
            }))
          });
        }
      }
    }

    res.json({
      questionnaireId: req.params.questionnaireId,
      period,
      trends: trends.map(trend => ({
        date: trend._id,
        responses: trend.count,
        avgCompletionTime: Math.round(trend.avgCompletionTime || 0)
      })),
      questionTrends
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ message: 'Failed to fetch trends' });
  }
});

// POST /api/analytics/questionnaires/:questionnaireId/insights - Generate AI insights
router.post('/questionnaires/:questionnaireId/insights', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.questionnaireId);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check access permissions
    if (!questionnaire.canUserViewResponses(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get recent responses for analysis
    const recentResponses = await Response.find({
      questionnaire: req.params.questionnaireId,
      status: 'completed'
    })
    .sort({ 'metadata.submittedAt': -1 })
    .limit(100); // Analyze last 100 responses

    // Prepare data for AI analysis
    const analysisData = {
      questionnaire: {
        title: questionnaire.title,
        questions: questionnaire.questions
      },
      responses: recentResponses.map(r => ({
        answers: r.answers,
        submittedAt: r.metadata.submittedAt
      }))
    };

    // For now, return mock insights (integrate with FastAPI later)
    const insights = {
      generatedAt: new Date(),
      summary: `Analysis of ${recentResponses.length} recent responses to "${questionnaire.title}"`,
      keyFindings: [
        'Response rate is trending positively',
        'Most respondents complete the questionnaire in under 5 minutes',
        'Question clarity appears to be good based on completion patterns'
      ],
      recommendations: [
        'Consider adding follow-up questions for low ratings',
        'The questionnaire length seems appropriate',
        'Mobile responsiveness is working well'
      ],
      sentimentOverview: {
        overall: 'positive',
        distribution: {
          positive: 65,
          neutral: 25,
          negative: 10
        }
      },
      correlations: [],
      dataPoints: recentResponses.length
    };

    // Save insights to database
    const analytics = new Analytics({
      questionnaire: req.params.questionnaireId,
      type: 'ai_insights',
      data: insights,
      generatedBy: req.user.userId
    });

    await analytics.save();

    res.json({
      questionnaireId: req.params.questionnaireId,
      insights,
      processingTime: 2.5,
      dataPoints: recentResponses.length
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ message: 'Failed to generate insights' });
  }
});

// GET /api/analytics/questionnaires/:questionnaireId/export - Export analytics
router.get('/questionnaires/:questionnaireId/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const questionnaire = await Questionnaire.findById(req.params.questionnaireId);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check access permissions
    if (!questionnaire.canUserViewResponses(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get analytics data
    const responses = await Response.find({
      questionnaire: req.params.questionnaireId,
      status: 'completed'
    });

    const analytics = {
      questionnaire: {
        id: questionnaire._id,
        title: questionnaire.title,
        totalResponses: responses.length
      },
      exportData: responses.map(response => ({
        responseId: response._id,
        submittedAt: response.metadata.submittedAt,
        completionTime: response.metadata.completionTime,
        answers: response.answers
      })),
      generatedAt: new Date()
    };

    if (format === 'json') {
      res.json(analytics);
    } else {
      // For other formats, this would integrate with FastAPI
      res.json({
        message: 'Export functionality available via FastAPI service',
        questionnaireId: req.params.questionnaireId,
        format,
        endpoint: `/api/export`
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ message: 'Failed to export analytics' });
  }
});

// GET /api/analytics/dashboard - Get user dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    // Get user's questionnaires
    const questionnaires = await Questionnaire.find({
      $or: [
        { creator: req.user.userId },
        { collaborators: { $elemMatch: { user: req.user.userId } } }
      ]
    });

    const questionnaireIds = questionnaires.map(q => q._id);

    // Get response statistics
    const totalResponses = await Response.countDocuments({
      questionnaire: { $in: questionnaireIds },
      status: 'completed'
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentResponses = await Response.countDocuments({
      questionnaire: { $in: questionnaireIds },
      status: 'completed',
      'metadata.submittedAt': { $gte: sevenDaysAgo }
    });

    // Get questionnaire status breakdown
    const statusBreakdown = await Questionnaire.aggregate([
      {
        $match: {
          $or: [
            { creator: new mongoose.Types.ObjectId(req.user.userId) },
            { collaborators: { $elemMatch: { user: new mongoose.Types.ObjectId(req.user.userId) } } }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalQuestionnaires: questionnaires.length,
        totalResponses,
        recentResponses,
        completionRate: questionnaires.length > 0 ?
          Math.round((totalResponses / questionnaires.length) * 100) / 100 : 0
      },
      statusBreakdown: statusBreakdown.map(item => ({
        status: item._id,
        count: item.count
      })),
      recentActivity: {
        period: '7 days',
        responses: recentResponses
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard analytics' });
  }
});

module.exports = router;