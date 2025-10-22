const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          error: 'Authentication Error',
          message: 'Token is not valid. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          error: 'Authentication Error',
          message: 'Account is deactivated.'
        });
      }

      // Add user to request
      req.user = user;
      next();

    } catch (tokenError) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Token is not valid.'
      });
    }

  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Authentication failed'
    });
  }
};

// Middleware to authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      AuditLog.logAction({
        user: req.user._id,
        userEmail: req.user.email,
        action: 'unauthorized_access',
        entityType: 'system',
        entityId: req.user._id,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          attemptedRoute: req.originalUrl,
          requiredRoles: roles,
          userRole: req.user.role
        }
      }).catch(err => console.error('Failed to log unauthorized access:', err));

      return res.status(403).json({
        error: 'Authorization Error',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Middleware to check workspace membership and permissions
const checkWorkspaceAccess = (requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

      if (!workspaceId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Workspace ID is required'
        });
      }

      const Workspace = require('../models/Workspace');
      const workspace = await Workspace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Workspace not found'
        });
      }

      // Check if user is owner
      if (workspace.owner.toString() === req.user._id.toString()) {
        req.workspace = workspace;
        req.userWorkspaceRole = 'owner';
        return next();
      }

      // Check if user is a member
      const membership = workspace.members.find(m =>
        m.user.toString() === req.user._id.toString()
      );

      if (!membership) {
        return res.status(403).json({
          error: 'Authorization Error',
          message: 'You are not a member of this workspace'
        });
      }

      // Check specific permission if required
      if (requiredPermission && !membership.permissions[requiredPermission]) {
        return res.status(403).json({
          error: 'Authorization Error',
          message: `You don't have permission to ${requiredPermission.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        });
      }

      req.workspace = workspace;
      req.userWorkspaceRole = membership.role;
      req.userWorkspacePermissions = membership.permissions;

      next();

    } catch (error) {
      console.error('Workspace access check error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to verify workspace access'
      });
    }
  };
};

// Middleware to check questionnaire ownership/collaboration
const checkQuestionnaireAccess = (requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      const questionnaireId = req.params.id || req.params.questionnaireId;

      if (!questionnaireId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Questionnaire ID is required'
        });
      }

      const Questionnaire = require('../models/Questionnaire');
      const questionnaire = await Questionnaire.findById(questionnaireId)
        .populate('workspace');

      if (!questionnaire) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Questionnaire not found'
        });
      }

      // Check if user is the creator
      if (questionnaire.creator.toString() === req.user._id.toString()) {
        req.questionnaire = questionnaire;
        req.userQuestionnaireRole = 'owner';
        return next();
      }

      // Check if user is a collaborator
      const collaborator = questionnaire.collaborators.find(c =>
        c.user.toString() === req.user._id.toString()
      );

      if (!collaborator) {
        // Check if user has workspace-level access
        if (req.workspace) {
          const membership = req.workspace.members.find(m =>
            m.user.toString() === req.user._id.toString()
          );

          if (membership && membership.permissions.canViewAllResponses) {
            req.questionnaire = questionnaire;
            req.userQuestionnaireRole = 'workspace_viewer';
            return next();
          }
        }

        return res.status(403).json({
          error: 'Authorization Error',
          message: 'You do not have access to this questionnaire'
        });
      }

      // Check specific permission if required
      if (requiredPermission && !collaborator.permissions[requiredPermission]) {
        return res.status(403).json({
          error: 'Authorization Error',
          message: `You don't have permission to ${requiredPermission.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        });
      }

      req.questionnaire = questionnaire;
      req.userQuestionnaireRole = collaborator.role;
      req.userQuestionnairePermissions = collaborator.permissions;

      next();

    } catch (error) {
      console.error('Questionnaire access check error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'Failed to verify questionnaire access'
      });
    }
  };
};

// Middleware to log API requests
const logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;

    // Log significant requests or errors
    if (res.statusCode >= 400 || duration > 5000) {
      try {
        await AuditLog.logAction({
          user: req.user ? req.user._id : null,
          userEmail: req.user ? req.user.email : null,
          action: 'api_request',
          entityType: 'system',
          entityId: req.user ? req.user._id : null,
          metadata: {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      } catch (error) {
        console.error('Failed to log API request:', error);
      }
    }
  });

  next();
};

module.exports = {
  authenticate,
  authorize,
  checkWorkspaceAccess,
  checkQuestionnaireAccess,
  logRequest,
  generateToken,
  generateRefreshToken
};