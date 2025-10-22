const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('workspaces.workspace', 'name description')
      .select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        workspaces: user.workspaces,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get user profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'avatar', 'bio', 'preferences'
    ];

    const updates = {};
    const oldUser = await User.findById(req.user._id);

    // Only allow updates to specific fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate updates
    if (updates.firstName && (!updates.firstName.trim() || updates.firstName.length > 50)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'First name must be 1-50 characters'
      });
    }

    if (updates.lastName && (!updates.lastName.trim() || updates.lastName.length > 50)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Last name must be 1-50 characters'
      });
    }

    if (updates.bio && updates.bio.length > 500) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Bio must be less than 500 characters'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Log profile update
    await AuditLog.logAction({
      user: user._id,
      userEmail: user.email,
      action: 'user_update',
      entityType: 'user',
      entityId: user._id,
      changes: AuditLog.extractChanges(oldUser, user),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        updatedFields: Object.keys(updates)
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update profile'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'New password must be at least 8 characters long'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    // Log password change
    await AuditLog.logAction({
      user: req.user._id,
      userEmail: req.user.email,
      action: 'password_changed',
      entityType: 'user',
      entityId: req.user._id,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to change password'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password, confirmDelete } = req.body;

    if (!password || confirmDelete !== 'DELETE') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password and confirmation required'
      });
    }

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is incorrect'
      });
    }

    // Check if user owns workspaces
    const Workspace = require('../models/Workspace');
    const ownedWorkspaces = await Workspace.countDocuments({ owner: req.user._id });

    if (ownedWorkspaces > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Cannot delete account while owning workspaces. Transfer ownership first.'
      });
    }

    // Soft delete - mark as inactive
    req.user.isActive = false;
    req.user.email = `deleted_${Date.now()}_${req.user.email}`;
    await req.user.save();

    // Log account deletion
    await AuditLog.logAction({
      user: req.user._id,
      userEmail: req.user.email,
      action: 'user_delete',
      entityType: 'user',
      entityId: req.user._id,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete account'
    });
  }
});

// @route   GET /api/users/workspaces
// @desc    Get user's workspaces
// @access  Private
router.get('/workspaces', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'workspaces.workspace',
        select: 'name description logo stats subscription'
      })
      .select('workspaces');

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      workspaces: user.workspaces.map(ws => ({
        workspace: ws.workspace,
        role: ws.role,
        joinedAt: ws.joinedAt
      }))
    });

  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get workspaces'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const Questionnaire = require('../models/Questionnaire');
    const Response = require('../models/Response');

    // Get user's questionnaires count
    const questionnairesCount = await Questionnaire.countDocuments({
      creator: req.user._id
    });

    // Get user's responses count
    const responsesCount = await Response.countDocuments({
      respondent: req.user._id
    });

    // Get workspaces count
    const workspacesCount = req.user.workspaces.length;

    res.json({
      stats: {
        questionnairesCreated: questionnairesCount,
        responsesSubmitted: responsesCount,
        workspacesJoined: workspacesCount,
        accountAge: Math.floor((Date.now() - req.user.createdAt) / (1000 * 60 * 60 * 24)), // days
        lastLoginAt: req.user.lastLoginAt,
        loginCount: req.user.loginCount
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get user statistics'
    });
  }
});

module.exports = router;