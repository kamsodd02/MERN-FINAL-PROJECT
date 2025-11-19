const express = require('express');
const mongoose = require('mongoose');
const Questionnaire = require('../models/Questionnaire');
const Response = require('../models/Response');
const Analytics = require('../models/Analytics');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/questionnaires/:questionnaireId/responses - Submit response
router.post('/questionnaires/:questionnaireId/responses', async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    const { answers, respondentEmail, isAnonymous = false } = req.body;

    // Find questionnaire
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check if questionnaire is published
    if (questionnaire.status !== 'published') {
      return res.status(400).json({ message: 'Questionnaire is not available for responses' });
    }

    // Check response limits
    if (questionnaire.settings.responseLimit?.enabled) {
      const currentResponses = await Response.countDocuments({
        questionnaire: questionnaireId,
        status: 'completed'
      });

      if (currentResponses >= questionnaire.settings.responseLimit.maxResponses) {
        return res.status(400).json({ message: 'Response limit reached' });
      }
    }

    // Check deadline
    if (questionnaire.settings.deadline?.enabled &&
        new Date() > questionnaire.settings.deadline.date) {
      return res.status(400).json({ message: 'Response deadline has passed' });
    }

    // Validate answers
    const validationErrors = [];
    questionnaire.questions.forEach(question => {
      const answer = answers.find(a => a.questionId === question.id);

      if (question.required && (!answer || !answer.answer)) {
        validationErrors.push(`Question "${question.title}" is required`);
      }

      // Type-specific validation
      if (answer && answer.answer) {
        if (question.validation) {
          if (question.validation.min !== undefined && answer.answer < question.validation.min) {
            validationErrors.push(`Answer for "${question.title}" is below minimum value`);
          }
          if (question.validation.max !== undefined && answer.answer > question.validation.max) {
            validationErrors.push(`Answer for "${question.title}" exceeds maximum value`);
          }
          if (question.validation.pattern && !new RegExp(question.validation.pattern).test(answer.answer)) {
            validationErrors.push(`Answer for "${question.title}" does not match required pattern`);
          }
        }
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Create or update response
    let response = await Response.findOne({
      questionnaire: questionnaireId,
      respondent: isAnonymous ? null : req.user?.userId,
      status: { $in: ['in_progress', 'completed'] }
    });

    const isNewResponse = !response;

    if (!response) {
      response = new Response({
        questionnaire: questionnaireId,
        respondent: isAnonymous ? null : req.user?.userId,
        respondentEmail: respondentEmail || req.user?.email,
        answers: [],
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          startedAt: new Date()
        },
        status: 'in_progress'
      });
    }

    // Update answers
    answers.forEach(newAnswer => {
      const existingAnswerIndex = response.answers.findIndex(
        a => a.questionId === newAnswer.questionId
      );

      if (existingAnswerIndex >= 0) {
        response.answers[existingAnswerIndex] = {
          ...response.answers[existingAnswerIndex],
          answer: newAnswer.answer,
          timestamp: new Date()
        };
      } else {
        response.answers.push({
          questionId: newAnswer.questionId,
          answer: newAnswer.answer,
          timestamp: new Date()
        });
      }
    });

    // Check if response is complete
    const requiredQuestions = questionnaire.questions.filter(q => q.required);
    const answeredRequired = requiredQuestions.every(q =>
      response.answers.some(a => a.questionId === q.id && a.answer)
    );

    if (answeredRequired) {
      response.status = 'completed';
      response.metadata.submittedAt = new Date();
      response.metadata.completionTime =
        (response.metadata.submittedAt - response.metadata.startedAt) / 1000;
    }

    await response.save();

    // Update questionnaire stats
    if (response.status === 'completed') {
      questionnaire.stats.totalResponses += isNewResponse ? 1 : 0;
      questionnaire.stats.completedResponses += isNewResponse ? 1 : 0;
      questionnaire.stats.completionRate =
        (questionnaire.stats.completedResponses / questionnaire.stats.totalResponses) * 100;
      questionnaire.stats.lastResponseAt = new Date();
      await questionnaire.save();
    }

    // Log response submission
    await AuditLog.create({
      user: req.user?.userId || null,
      action: response.status === 'completed' ? 'submit_response' : 'save_progress',
      resource: 'response',
      resourceId: response._id,
      details: {
        questionnaireId,
        isAnonymous,
        status: response.status
      }
    });

    res.status(isNewResponse ? 201 : 200).json({
      response,
      message: response.status === 'completed' ?
        'Response submitted successfully' : 'Progress saved successfully'
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Failed to submit response' });
  }
});

// GET /api/responses/:id - Get specific response
router.get('/:id', authenticate, async (req, res) => {
  try {
    const response = await Response.findById(req.params.id)
      .populate('questionnaire', 'title creator')
      .populate('respondent', 'firstName lastName email');

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Check access permissions
    const questionnaire = response.questionnaire;
    const hasAccess = questionnaire.creator.toString() === req.user.userId ||
      questionnaire.collaborators.some(c =>
        c.user.toString() === req.user.userId && c.permissions.canViewResponses
      );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ message: 'Failed to fetch response' });
  }
});

// PUT /api/responses/:id - Update response
router.put('/:id', authenticate, async (req, res) => {
  try {
    const response = await Response.findById(req.params.id)
      .populate('questionnaire');

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Check if user can edit (only respondent can edit their own incomplete responses)
    if (response.respondent?.toString() !== req.user.userId ||
        response.status === 'completed') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { answers } = req.body;

    // Update answers
    answers.forEach(newAnswer => {
      const existingAnswerIndex = response.answers.findIndex(
        a => a.questionId === newAnswer.questionId
      );

      if (existingAnswerIndex >= 0) {
        response.answers[existingAnswerIndex] = {
          ...response.answers[existingAnswerIndex],
          answer: newAnswer.answer,
          timestamp: new Date()
        };
      } else {
        response.answers.push({
          questionId: newAnswer.questionId,
          answer: newAnswer.answer,
          timestamp: new Date()
        });
      }
    });

    await response.save();

    res.json(response);
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ message: 'Failed to update response' });
  }
});

// DELETE /api/responses/:id - Delete response
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const response = await Response.findById(req.params.id)
      .populate('questionnaire');

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Check delete permissions
    const questionnaire = response.questionnaire;
    const canDelete = questionnaire.creator.toString() === req.user.userId ||
      questionnaire.collaborators.some(c =>
        c.user.toString() === req.user.userId && c.permissions.canDelete
      );

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await response.deleteOne();

    // Update questionnaire stats
    questionnaire.stats.totalResponses = Math.max(0, questionnaire.stats.totalResponses - 1);
    questionnaire.stats.completedResponses = Math.max(0, questionnaire.stats.completedResponses - 1);
    questionnaire.stats.completionRate =
      questionnaire.stats.totalResponses > 0 ?
        (questionnaire.stats.completedResponses / questionnaire.stats.totalResponses) * 100 : 0;
    await questionnaire.save();

    // Log deletion
    await AuditLog.create({
      user: req.user.userId,
      action: 'delete',
      resource: 'response',
      resourceId: req.params.id,
      details: { questionnaireId: questionnaire._id }
    });

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ message: 'Failed to delete response' });
  }
});

// GET /api/questionnaires/:questionnaireId/responses/export - Export responses
router.get('/questionnaires/:questionnaireId/responses/export', authenticate, async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    const { format = 'json', includeMetadata = true } = req.query;

    // Find questionnaire
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      return res.status(404).json({ message: 'Questionnaire not found' });
    }

    // Check access permissions
    if (!questionnaire.canUserViewResponses(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get responses
    const responses = await Response.find({
      questionnaire: questionnaireId,
      status: 'completed'
    }).populate('respondent', 'firstName lastName email');

    // Format data based on export type
    let exportData;

    if (format === 'json') {
      exportData = {
        questionnaire: {
          id: questionnaire._id,
          title: questionnaire.title,
          description: questionnaire.description,
          questions: questionnaire.questions
        },
        responses: responses.map(response => ({
          id: response._id,
          respondent: response.respondent ? {
            id: response.respondent._id,
            email: response.respondent.email,
            name: `${response.respondent.firstName} ${response.respondent.lastName}`
          } : null,
          respondentEmail: response.respondentEmail,
          answers: response.answers,
          submittedAt: response.metadata.submittedAt,
          completionTime: response.metadata.completionTime,
          ...(includeMetadata && {
            metadata: response.metadata
          })
        })),
        exportInfo: {
          totalResponses: responses.length,
          exportedAt: new Date(),
          exportedBy: req.user.userId
        }
      };
    } else {
      // For other formats, return basic structure that FastAPI can process
      exportData = {
        questionnaire,
        responses: responses,
        format,
        includeMetadata: includeMetadata === 'true'
      };
    }

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting responses:', error);
    res.status(500).json({ message: 'Failed to export responses' });
  }
});

// GET /api/responses - Get user's responses (for respondents)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const responses = await Response.find({ respondent: req.user.userId })
      .populate('questionnaire', 'title description status')
      .sort({ 'metadata.submittedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Response.countDocuments({ respondent: req.user.userId });

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
    console.error('Error fetching user responses:', error);
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
});

module.exports = router;