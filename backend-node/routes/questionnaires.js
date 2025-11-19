const express = require('express');
const mongoose = require('mongoose');
const Questionnaire = require('../models/Questionnaire');
const Response = require('../models/Response');
const Workspace = require('../models/Workspace');
const Analytics = require('../models/Analytics');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/questionnaires - List user's questionnaires
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, workspace, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { creator: req.user.userId };

    if (status) query.status = status;
    if (workspace) query.workspace = workspace;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add workspace access for collaborators
    const userWorkspaces = await Workspace.find({
      $or: [
        { owner: req.user.userId },
        { 'members.user': req.user.userId }
      ]
    }).select('_id');

    const workspaceIds = userWorkspaces.map(w => w._id);
    query.$or = [
      { creator: req.user.userId },
      { workspace: { $in: workspaceIds } }
    ];

    const questionnaires = await Questionnaire.find(query)
      .populate('creator', 'firstName lastName email')
      .populate('workspace', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Questionnaire.countDocuments(query);

    res.json({
      questionnaires,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({ message: 'Failed to fetch questionnaires' });
  }
});

// POST /api/questionnaires - Create new questionnaire
router.post('/', async (req, res) => {
  try {
    const { title, description, category, workspace, questions, settings } = req.body;

    // Validate workspace access
    if (workspace) {
      const userWorkspace = await Workspace.findOne({
        _id: workspace,
        $or: [
          { owner: req.user.userId },
          { 'members.user': req.user.userId, 'members.role': { $in: ['admin', 'editor'] } }
        ]
      });

      if (!userWorkspace) {
        return res.status(403).json({ message: 'Access denied to workspace' });
      }
    }

    const questionnaire = new Questionnaire({
      title,
      description,
      category,
      creator: req.user.userId,
      workspace,
      questions: questions || [],
      settings: settings || {}
    });

    await questionnaire.save();

    // Log creation
    await AuditLog.create({
      user: req.user.userId,
      action: 'create',
      resource: 'questionnaire',
      resourceId: questionnaire._id,
      details: { title: questionnaire.title }
    });

    await questionnaire.populate('creator', 'firstName lastName email');
    await questionnaire.populate('workspace', 'name');

    res.status(201).json(questionnaire);
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    res.status(500).json({ message: 'Failed to create questionnaire' });
  }
});

// GET /api/questionnaires/:id - Get questionnaire details
router.get('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id)
      .populate('creator', 'firstName lastName email')
      .populate('workspace', 'name')
      .populate('collaborators.user', 'firstName lastName email');

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check access permissions
    const hasAccess = questionnaire.creator.toString() === req.user.userId ||
      questionnaire.collaborators.some(c => c.user._id.toString() === req.user.userId);

    if (!hasAccess && questionnaire.settings.isPublic !== true) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(questionnaire);
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({ message: 'Failed to fetch questionnaire' });
  }
});

// PUT /api/questionnaires/:id - Update questionnaire
router.put('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check edit permissions
    if (!questionnaire.canUserEdit(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, category, questions, settings } = req.body;

    // Update fields
    if (title !== undefined) questionnaire.title = title;
    if (description !== undefined) questionnaire.description = description;
    if (category !== undefined) questionnaire.category = category;
    if (questions !== undefined) questionnaire.questions = questions;
    if (settings !== undefined) questionnaire.settings = { ...questionnaire.settings, ...settings };

    await questionnaire.save();

    // Log update
    await AuditLog.create({
      user: req.user.userId,
      action: 'update',
      resource: 'questionnaire',
      resourceId: questionnaire._id,
      details: { title: questionnaire.title }
    });

    await questionnaire.populate('creator', 'firstName lastName email');
    await questionnaire.populate('workspace', 'name');

    res.json(questionnaire);
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    res.status(500).json({ message: 'Failed to update questionnaire' });
  }
});

// DELETE /api/questionnaires/:id - Delete questionnaire
router.delete('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check delete permissions
    const canDelete = questionnaire.creator.toString() === req.user.userId ||
      questionnaire.collaborators.some(c =>
        c.user.toString() === req.user.userId && c.permissions.canDelete
      );

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete associated responses
    await Response.deleteMany({ questionnaire: req.params.id });

    // Delete questionnaire
    await questionnaire.deleteOne();

    // Log deletion
    await AuditLog.create({
      user: req.user.userId,
      action: 'delete',
      resource: 'questionnaire',
      resourceId: req.params.id,
      details: { title: questionnaire.title }
    });

    res.json({ message: 'Questionnaire deleted successfully' });
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    res.status(500).json({ message: 'Failed to delete questionnaire' });
  }
});

// POST /api/questionnaires/:id/publish - Publish questionnaire
router.post('/:id/publish', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check publish permissions
    const canPublish = questionnaire.creator.toString() === req.user.userId ||
      questionnaire.collaborators.some(c =>
        c.user.toString() === req.user.userId && c.permissions.canPublish
      );

    if (!canPublish) {
      return res.status(403).json({ message: 'Access denied' });
    }

    questionnaire.status = 'published';
    questionnaire.publishedAt = new Date();
    questionnaire.statusHistory.push({
      status: 'published',
      changedBy: req.user.userId,
      changedAt: new Date()
    });

    await questionnaire.save();

    // Log publish
    await AuditLog.create({
      user: req.user.userId,
      action: 'publish',
      resource: 'questionnaire',
      resourceId: questionnaire._id,
      details: { title: questionnaire.title }
    });

    res.json(questionnaire);
  } catch (error) {
    console.error('Error publishing questionnaire:', error);
    res.status(500).json({ message: 'Failed to publish questionnaire' });
  }
});

// POST /api/questionnaires/:id/clone - Clone questionnaire
router.post('/:id/clone', async (req, res) => {
  try {
    const original = await Questionnaire.findById(req.params.id);

    if (!original) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check access permissions
    const hasAccess = original.creator.toString() === req.user.userId ||
      original.collaborators.some(c => c.user._id.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const cloned = new Questionnaire({
      title: `${original.title} (Copy)`,
      description: original.description,
      category: original.category,
      creator: req.user.userId,
      workspace: original.workspace,
      questions: JSON.parse(JSON.stringify(original.questions)), // Deep clone
      settings: JSON.parse(JSON.stringify(original.settings))
    });

    await cloned.save();

    // Log clone
    await AuditLog.create({
      user: req.user.userId,
      action: 'clone',
      resource: 'questionnaire',
      resourceId: cloned._id,
      details: { title: cloned.title, originalId: original._id }
    });

    await cloned.populate('creator', 'firstName lastName email');
    await cloned.populate('workspace', 'name');

    res.status(201).json(cloned);
  } catch (error) {
    console.error('Error cloning questionnaire:', error);
    res.status(500).json({ message: 'Failed to clone questionnaire' });
  }
});

// GET /api/questionnaires/:id/responses - Get questionnaire responses
router.get('/:id/responses', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check view permissions
    if (!questionnaire.canUserViewResponses(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 50, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { questionnaire: req.params.id };
    if (status) query.status = status;

    const responses = await Response.find(query)
      .populate('respondent', 'firstName lastName email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Response.countDocuments(query);

    res.json({
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
});

// GET /api/questionnaires/:id/analytics - Get questionnaire analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check view permissions
    if (!questionnaire.canUserViewResponses(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get basic stats
    const totalResponses = await Response.countDocuments({
      questionnaire: req.params.id,
      status: 'completed'
    });

    const completedResponses = await Response.countDocuments({
      questionnaire: req.params.id,
      status: 'completed'
    });

    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

    // Get question analytics
    const questionAnalytics = [];
    for (const question of questionnaire.questions) {
      const responses = await Response.find({
        questionnaire: req.params.id,
        status: 'completed',
        'answers.questionId': question.id
      });

      const answers = responses.flatMap(r =>
        r.answers.filter(a => a.questionId === question.id)
      );

      let analytics = {
        questionId: question.id,
        questionTitle: question.title,
        questionType: question.type,
        totalAnswers: answers.length
      };

      // Calculate type-specific analytics
      if (question.type === 'multiple_choice' || question.type === 'checkboxes') {
        const optionCounts = {};
        question.options.forEach(opt => {
          optionCounts[opt.text] = 0;
        });

        answers.forEach(answer => {
          if (Array.isArray(answer.answer)) {
            answer.answer.forEach(val => {
              if (optionCounts[val] !== undefined) optionCounts[val]++;
            });
          } else {
            if (optionCounts[answer.answer] !== undefined) {
              optionCounts[answer.answer]++;
            }
          }
        });

        analytics.optionCounts = optionCounts;
      } else if (question.type === 'rating') {
        const ratings = answers.map(a => parseFloat(a.answer)).filter(r => !isNaN(r));
        analytics.averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        analytics.ratingDistribution = {};
        ratings.forEach(rating => {
          analytics.ratingDistribution[rating] = (analytics.ratingDistribution[rating] || 0) + 1;
        });
      }

      questionAnalytics.push(analytics);
    }

    res.json({
      questionnaireId: req.params.id,
      summary: {
        totalResponses,
        completedResponses,
        completionRate: Math.round(completionRate * 100) / 100
      },
      questionAnalytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// POST /api/questionnaires/:id/collaborators - Add collaborator
router.post('/:id/collaborators', async (req, res) => {
  try {
    const { userId, role } = req.body;
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Only creator or workspace admin can add collaborators
    if (questionnaire.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    questionnaire.addCollaborator(userId, role, req.user.userId);
    await questionnaire.save();

    await questionnaire.populate('collaborators.user', 'firstName lastName email');

    res.json(questionnaire.collaborators);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ message: 'Failed to add collaborator' });
  }
});

// DELETE /api/questionnaires/:id/collaborators/:userId - Remove collaborator
router.delete('/:id/collaborators/:userId', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);

    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Only creator can remove collaborators
    if (questionnaire.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    questionnaire.collaborators = questionnaire.collaborators.filter(
      c => c.user.toString() !== req.params.userId
    );

    await questionnaire.save();

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ message: 'Failed to remove collaborator' });
  }
});

module.exports = router;