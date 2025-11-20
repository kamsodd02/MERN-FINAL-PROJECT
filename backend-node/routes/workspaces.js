const express = require('express');
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Questionnaire = require('../models/Questionnaire');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/workspaces - List user's workspaces
router.get('/', async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user.userId },
        { 'members.user': req.user.userId }
      ]
    })
    .populate('owner', 'firstName lastName email')
    .populate('members.user', 'firstName lastName email')
    .sort({ updatedAt: -1 });

    res.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ message: 'Failed to fetch workspaces' });
  }
});

// POST /api/workspaces - Create new workspace
router.post('/', async (req, res) => {
  try {
    const { name, description, settings } = req.body;

    // Check if user already has a workspace with this name
    const existingWorkspace = await Workspace.findOne({
      owner: req.user.userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingWorkspace) {
      return res.status(400).json({ message: 'Workspace with this name already exists' });
    }

    const workspace = new Workspace({
      name,
      description,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      settings: settings || {}
    });

    await workspace.save();

    // Log creation
    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      action: 'workspace_create',
      entityType: 'workspace',
      entityId: workspace._id,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await workspace.populate('owner', 'firstName lastName email');
    await workspace.populate('members.user', 'firstName lastName email');

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ message: 'Failed to create workspace' });
  }
});

// GET /api/workspaces/:id - Get workspace details
router.get('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check access
    const isMember = workspace.owner.toString() === req.user.userId ||
      workspace.members.some(m => m.user._id.toString() === req.user.userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ message: 'Failed to fetch workspace' });
  }
});

// PUT /api/workspaces/:id - Update workspace
router.put('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only owner can update workspace
    if (workspace.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, settings } = req.body;

    if (name !== undefined) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (settings !== undefined) workspace.settings = { ...workspace.settings, ...settings };

    await workspace.save();

    // Log update
    await AuditLog.create({
      user: req.user.userId,
      action: 'update',
      resource: 'workspace',
      resourceId: workspace._id,
      details: { name: workspace.name }
    });

    await workspace.populate('owner', 'firstName lastName email');
    await workspace.populate('members.user', 'firstName lastName email');

    res.json(workspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({ message: 'Failed to update workspace' });
  }
});

// DELETE /api/workspaces/:id - Delete workspace
router.delete('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only owner can delete workspace
    if (workspace.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if workspace has questionnaires
    const questionnaireCount = await Questionnaire.countDocuments({ workspace: req.params.id });
    if (questionnaireCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete workspace with existing questionnaires. Move or delete them first.'
      });
    }

    await workspace.deleteOne();

    // Log deletion
    await AuditLog.create({
      user: req.user.userId,
      action: 'delete',
      resource: 'workspace',
      resourceId: req.params.id,
      details: { name: workspace.name }
    });

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ message: 'Failed to delete workspace' });
  }
});

// POST /api/workspaces/:id/members - Add member to workspace
router.post('/:id/members', async (req, res) => {
  try {
    const { email, role = 'viewer' } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only owner or admin can add members
    const currentMember = workspace.members.find(m => m.user.toString() === req.user.userId);
    const isOwner = workspace.owner.toString() === req.user.userId;
    const isAdmin = currentMember && currentMember.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = workspace.members.find(m => m.user.toString() === user._id.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    // Add member
    workspace.members.push({
      user: user._id,
      role,
      joinedAt: new Date()
    });

    await workspace.save();

    // Log member addition
    await AuditLog.create({
      user: req.user.userId,
      action: 'add_member',
      resource: 'workspace',
      resourceId: workspace._id,
      details: { memberEmail: email, role }
    });

    await workspace.populate('members.user', 'firstName lastName email');

    res.json(workspace.members);
  } catch (error) {
    console.error('Error adding workspace member:', error);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// PUT /api/workspaces/:id/members/:userId - Update member role
router.put('/:id/members/:userId', async (req, res) => {
  try {
    const { role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only owner can update member roles
    if (workspace.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find member
    const member = workspace.members.find(m => m.user.toString() === req.params.userId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Cannot change owner's role
    if (member.user.toString() === workspace.owner.toString()) {
      return res.status(400).json({ message: 'Cannot change workspace owner role' });
    }

    member.role = role;
    await workspace.save();

    // Log role update
    await AuditLog.create({
      user: req.user.userId,
      action: 'update_member_role',
      resource: 'workspace',
      resourceId: workspace._id,
      details: { memberId: req.params.userId, newRole: role }
    });

    await workspace.populate('members.user', 'firstName lastName email');

    res.json(workspace.members);
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Failed to update member role' });
  }
});

// DELETE /api/workspaces/:id/members/:userId - Remove member from workspace
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only owner or admin can remove members
    const currentMember = workspace.members.find(m => m.user.toString() === req.user.userId);
    const isOwner = workspace.owner.toString() === req.user.userId;
    const isAdmin = currentMember && currentMember.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cannot remove owner
    if (req.params.userId === workspace.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove workspace owner' });
    }

    // Find member
    const memberIndex = workspace.members.findIndex(m => m.user.toString() === req.params.userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const removedMember = workspace.members.splice(memberIndex, 1)[0];
    await workspace.save();

    // Log member removal
    await AuditLog.create({
      user: req.user.userId,
      action: 'remove_member',
      resource: 'workspace',
      resourceId: workspace._id,
      details: { memberId: req.params.userId }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing workspace member:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

// GET /api/workspaces/:id/questionnaires - Get workspace questionnaires
router.get('/:id/questionnaires', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check access
    const isMember = workspace.owner.toString() === req.user.userId ||
      workspace.members.some(m => m.user._id.toString() === req.user.userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { workspace: req.params.id };
    if (status) query.status = status;

    const questionnaires = await Questionnaire.find(query)
      .populate('creator', 'firstName lastName email')
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
    console.error('Error fetching workspace questionnaires:', error);
    res.status(500).json({ message: 'Failed to fetch questionnaires' });
  }
});

// GET /api/workspaces/:id/stats - Get workspace statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check access
    const isMember = workspace.owner.toString() === req.user.userId ||
      workspace.members.some(m => m.user._id.toString() === req.user.userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get workspace statistics
    const questionnaireCount = await Questionnaire.countDocuments({ workspace: req.params.id });
    const publishedCount = await Questionnaire.countDocuments({
      workspace: req.params.id,
      status: 'published'
    });
    const draftCount = await Questionnaire.countDocuments({
      workspace: req.params.id,
      status: 'draft'
    });

    // Get response statistics
    const questionnaires = await Questionnaire.find({ workspace: req.params.id }, '_id');
    const questionnaireIds = questionnaires.map(q => q._id);

    const totalResponses = await mongoose.connection.db.collection('responses').aggregate([
      { $match: { questionnaire: { $in: questionnaireIds }, status: 'completed' } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).toArray();

    const responseCount = totalResponses.length > 0 ? totalResponses[0].count : 0;

    // Get member statistics
    const memberStats = {
      total: workspace.members.length + 1, // +1 for owner
      active: workspace.members.length + 1 // Assuming all are active
    };

    res.json({
      questionnaires: {
        total: questionnaireCount,
        published: publishedCount,
        draft: draftCount
      },
      responses: {
        total: responseCount
      },
      members: memberStats
    });
  } catch (error) {
    console.error('Error fetching workspace stats:', error);
    res.status(500).json({ message: 'Failed to fetch workspace statistics' });
  }
});

module.exports = router;