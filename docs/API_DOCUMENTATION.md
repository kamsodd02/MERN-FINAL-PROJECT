# MERN Questionnaire Platform - API Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Data Formats](#data-formats)

---

## 🎯 Overview

The MERN Questionnaire Platform API provides a comprehensive RESTful interface for managing questionnaires, responses, users, and analytics. The API follows REST principles and uses JSON for request/response payloads.

### Base URL
```
https://api.questionnaire-platform.com
```

### Content Type
```
Content-Type: application/json
```

### Authentication
All API requests (except authentication endpoints) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "creator",
    "isEmailVerified": false
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "creator",
    "avatar": null,
    "isEmailVerified": true,
    "preferences": {
      "notifications": {
        "email": true,
        "inApp": true,
        "marketing": false
      },
      "theme": "auto",
      "language": "en",
      "timezone": "UTC"
    }
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/auth/logout
Logout user and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account with this email exists, a password reset link has been sent."
}
```

### POST /api/auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "abc123def456...",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

### POST /api/auth/verify-email
Verify email address using verification token.

**Request Body:**
```json
{
  "token": "xyz789uvw012..."
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

---

## 👤 User Management

### GET /api/users/profile
Get current user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Survey creator and data analyst",
    "role": "creator",
    "isActive": true,
    "isEmailVerified": true,
    "preferences": {
      "notifications": {
        "email": true,
        "inApp": true,
        "marketing": false
      },
      "theme": "auto",
      "language": "en",
      "timezone": "UTC"
    },
    "workspaces": [
      {
        "workspace": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j2",
          "name": "Marketing Team",
          "description": "Customer feedback surveys"
        },
        "role": "editor",
        "joinedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "lastLoginAt": "2024-01-20T14:25:00.000Z",
    "createdAt": "2023-12-01T09:00:00.000Z",
    "updatedAt": "2024-01-20T14:25:00.000Z"
  }
}
```

### PUT /api/users/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "bio": "Updated bio",
  "preferences": {
    "theme": "dark",
    "language": "es"
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "Johnny",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "bio": "Updated bio",
    "preferences": {
      "theme": "dark",
      "language": "es"
    },
    "updatedAt": "2024-01-20T15:30:00.000Z"
  }
}
```

### PUT /api/users/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

### DELETE /api/users/account
Delete user account (soft delete).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "password": "CurrentPass123!",
  "confirmDelete": "DELETE"
}
```

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

### GET /api/users/workspaces
Get user's workspaces.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "workspaces": [
    {
      "workspace": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Marketing Team",
        "description": "Customer feedback surveys"
      },
      "role": "editor",
      "joinedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /api/users/stats
Get user statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "stats": {
    "questionnairesCreated": 15,
    "responsesSubmitted": 234,
    "workspacesJoined": 3,
    "accountAge": 45,
    "lastLoginAt": "2024-01-20T14:25:00.000Z",
    "loginCount": 67
  }
}
```

---

## 🏢 Workspace Management

### GET /api/workspaces
Get user's workspaces.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term

**Response (200):**
```json
{
  "workspaces": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "Marketing Team",
      "description": "Customer feedback surveys",
      "logo": "https://example.com/logo.png",
      "role": "editor",
      "stats": {
        "totalQuestionnaires": 25,
        "totalResponses": 1250,
        "activeQuestionnaires": 8
      },
      "subscription": {
        "plan": "professional",
        "status": "active"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

### POST /api/workspaces
Create a new workspace.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Product Team",
  "description": "Product feedback and testing",
  "settings": {
    "isPublic": false,
    "defaultQuestionnaireSettings": {
      "allowAnonymous": true,
      "showProgress": true
    }
  }
}
```

**Response (201):**
```json
{
  "message": "Workspace created successfully",
  "workspace": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "name": "Product Team",
    "description": "Product feedback and testing",
    "owner": "64f1a2b3c4d5e6f7g8h9i0j1",
    "settings": {
      "isPublic": false,
      "defaultQuestionnaireSettings": {
        "allowAnonymous": true,
        "showProgress": true
      }
    },
    "stats": {
      "totalQuestionnaires": 0,
      "totalResponses": 0,
      "activeQuestionnaires": 0
    },
    "createdAt": "2024-01-20T16:00:00.000Z"
  }
}
```

### GET /api/workspaces/:id
Get workspace details.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "workspace": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "name": "Marketing Team",
    "description": "Customer feedback surveys",
    "logo": "https://example.com/logo.png",
    "owner": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "members": [
      {
        "user": {
          "id": "64f1a2b3c4d5e6f7g8h9i0j4",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@example.com"
        },
        "role": "viewer",
        "joinedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "settings": {
      "isPublic": false,
      "defaultQuestionnaireSettings": {
        "allowAnonymous": true,
        "showProgress": true
      }
    },
    "stats": {
      "totalQuestionnaires": 25,
      "totalResponses": 1250,
      "activeQuestionnaires": 8
    },
    "subscription": {
      "plan": "professional",
      "status": "active",
      "limits": {
        "maxQuestionnaires": 100,
        "maxResponsesPerMonth": 10000
      }
    }
  }
}
```

### PUT /api/workspaces/:id
Update workspace.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Updated Marketing Team",
  "description": "Updated description",
  "settings": {
    "defaultQuestionnaireSettings": {
      "allowAnonymous": false
    }
  }
}
```

### DELETE /api/workspaces/:id
Delete workspace.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### POST /api/workspaces/:id/members
Add member to workspace.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "email": "jane.smith@example.com",
  "role": "editor"
}
```

### PUT /api/workspaces/:id/members/:userId
Update member role.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "role": "admin"
}
```

### DELETE /api/workspaces/:id/members/:userId
Remove member from workspace.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

## 📝 Questionnaire Management

### GET /api/workspaces/:workspaceId/questionnaires
Get workspace questionnaires.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`, `limit`, `search`
- `status` (draft, published, closed)
- `category` (survey, quiz, feedback, etc.)

### POST /api/workspaces/:workspaceId/questionnaires
Create questionnaire.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our service",
  "category": "feedback",
  "questions": [
    {
      "id": "q1",
      "type": "rating",
      "title": "How satisfied are you with our service?",
      "required": true,
      "validation": {
        "min": 1,
        "max": 5
      }
    }
  ],
  "settings": {
    "allowAnonymous": true,
    "showProgress": true,
    "deadline": {
      "enabled": true,
      "date": "2024-02-01T00:00:00.000Z"
    }
  }
}
```

### GET /api/questionnaires/:id
Get questionnaire details.

### PUT /api/questionnaires/:id
Update questionnaire.

### DELETE /api/questionnaires/:id
Delete questionnaire.

### POST /api/questionnaires/:id/publish
Publish questionnaire.

### POST /api/questionnaires/:id/clone
Clone questionnaire.

### GET /api/questionnaires/:id/collaborators
Get collaborators.

### POST /api/questionnaires/:id/collaborators
Add collaborator.

### DELETE /api/questionnaires/:id/collaborators/:userId
Remove collaborator.

---

## 📊 Response Management

### GET /api/questionnaires/:id/responses
Get questionnaire responses.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`, `limit`
- `status` (completed, in_progress, abandoned)
- `startDate`, `endDate`
- `search`

### POST /api/questionnaires/:id/responses
Submit response.

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "answer": 4
    }
  ],
  "metadata": {
    "startedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

### GET /api/responses/:id
Get response details.

### PUT /api/responses/:id
Update response (if allowed).

### DELETE /api/responses/:id
Delete response.

### GET /api/questionnaires/:id/responses/export
Export responses.

**Query Parameters:**
- `format` (excel, csv, json)
- `startDate`, `endDate`
- `status`

---

## 📈 Analytics

### GET /api/questionnaires/:id/analytics/summary
Get analytics summary.

### GET /api/questionnaires/:id/analytics/trends
Get response trends.

### POST /api/questionnaires/:id/analytics/insights
Generate AI insights.

### GET /api/questionnaires/:id/analytics/export
Export analytics report.

---

## 🔔 Notifications

### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `page`, `limit`
- `read` (true/false)
- `type`

### PUT /api/notifications/:id/read
Mark notification as read.

### PUT /api/notifications/mark-all-read
Mark all notifications as read.

### GET /api/notifications/unread-count
Get unread count.

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": "Additional error information (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "All fields are required",
  "details": {
    "field": "email",
    "message": "Email format is invalid"
  }
}
```

### Authentication Errors
```json
{
  "error": "Authentication Error",
  "message": "Invalid credentials"
}
```

### Authorization Errors
```json
{
  "error": "Authorization Error",
  "message": "Access denied. Insufficient permissions."
}
```

---

## 🚦 Rate Limiting

API requests are rate limited to prevent abuse:

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **File uploads**: 50 requests per hour
- **Email sending**: 10 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## 📄 Data Formats

### Date Format
All dates use ISO 8601 format:
```
2024-01-20T14:25:00.000Z
```

### Pagination
List endpoints support pagination:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Filtering and Sorting
Most list endpoints support:
- `sort` (field:order, e.g., "createdAt:-1")
- `filter[field]` (field-specific filters)
- `search` (full-text search)

---

## 🔒 Security Notes

- All API communications use HTTPS
- JWT tokens expire after 7 days
- Refresh tokens expire after 30 days
- Passwords are hashed with bcrypt (12 rounds)
- Input validation and sanitization on all endpoints
- SQL injection prevention with parameterized queries
- XSS protection with input escaping
- CORS configured for allowed origins only

---

*This API documentation is automatically generated and kept in sync with the codebase. Last updated: January 2024*