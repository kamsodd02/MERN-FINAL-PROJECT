# Testing and Debugging Guide for MERN Questionnaire Platform

This guide provides comprehensive steps to test and debug your MERN Questionnaire Platform project.

## 1. Review Project Structure and Dependencies

### Project Overview
- **Frontend**: React app with Vite (port 5173)
- **Backend Services**:
  - Node.js + Express (port 5000) - Auth, questionnaires, responses
  - FastAPI + Python (port 8000) - AI analysis, Excel export
- **Database**: MongoDB (local or Atlas)

### Check Dependencies
```bash
# Frontend
cd frontend
npm list

# Backend Node
cd ../backend-node
npm list

# Backend FastAPI
cd ../backend-fastapi
pip list
```

### Environment Setup
Ensure `.env` files are configured:
- `backend-node/.env`: MONGODB_URI, JWT_SECRET, PORT
- `backend-fastapi/.env`: DATABASE_URL, SECRET_KEY (if needed)

## 2. Setup Testing Environment

### Prerequisites
- Node.js v18+
- Python 3.8+
- MongoDB (local or Atlas)
- Git

### Database Setup
```bash
# Option 1: Local MongoDB
# Install MongoDB Community Server
# Start service: net start MongoDB (Windows) or brew services start mongodb-community (macOS)

# Option 2: MongoDB Atlas
# Create cluster, get connection string, update .env
```

### Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Backend Node
cd ../backend-node && npm install

# Backend FastAPI
cd ../backend-fastapi && pip install -r requirements.txt
```

### Start Services
Use the provided scripts:
```bash
# Windows: Double-click start-local.bat
# OR manual:
cd backend-node && npm run dev &
cd ../frontend && npm run dev &
cd ../backend-fastapi && uvicorn main:app --reload --port 8000 &
```

## 3. Test Backend Services

### Node.js Backend (Port 5000)

#### API Endpoints Testing
Use Postman or curl to test:

**Health Check:**
```bash
curl http://localhost:5000/health
# Expected: {"status":"OK"}
```

**Authentication:**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: JWT token
```

**Questionnaires:**
```bash
# Create questionnaire (with JWT token)
curl -X POST http://localhost:5000/api/questionnaires \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Survey","questions":[{"type":"text","question":"What is your name?"}]}'

# Get questionnaires
curl -X GET http://localhost:5000/api/questionnaires \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Database Connection
Check MongoDB connection:
```javascript
// In backend-node terminal
const mongoose = require('mongoose');
console.log('MongoDB connected:', mongoose.connection.readyState === 1);
```

### FastAPI Backend (Port 8000)

**Health Check:**
```bash
curl http://localhost:8000/
# Expected: {"message":"FastAPI AI Service"}
```

**AI Analysis:**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"responses":[{"question":"Rate our service","answer":"5"}]}'
```

## 4. Test Frontend Functionality

### Access Application
- Open http://localhost:5173 in browser
- Check console for errors (F12 > Console)

### User Flows

**Registration/Login:**
1. Navigate to /register
2. Create account
3. Login
4. Check if redirected to dashboard

**Create Questionnaire:**
1. Login
2. Go to questionnaire builder
3. Add questions (text, multiple choice, rating)
4. Save questionnaire
5. Check if appears in questionnaire list

**Take Survey:**
1. Get shareable link from questionnaire
2. Open in incognito/new browser
3. Fill out survey
4. Submit
5. Check responses in dashboard

**Analytics:**
1. View responses in dashboard
2. Check if AI insights load
3. Test export functionality

### Browser Dev Tools
- **Console**: Check for JavaScript errors
- **Network**: Monitor API calls
- **Application**: Check localStorage for tokens

## 5. Test Database Operations

### MongoDB Checks
```bash
# Connect to MongoDB shell
mongosh "mongodb://localhost:27017/mern-questionnaire"

# Check collections
show collections

# View documents
db.users.find()
db.questionnaires.find()
db.responses.find()
```

### Data Integrity
- Verify user data after registration
- Check questionnaire structure
- Validate response storage
- Test data relationships

## 6. Debug Common Issues

### Frontend Issues
**Build Errors:**
```bash
cd frontend
npm run build
# Check for TypeScript/ESLint errors
```

**Runtime Errors:**
- Check browser console
- Verify API endpoints match
- Ensure CORS is configured

### Backend Issues
**Connection Errors:**
```bash
# Check ports
netstat -ano | findstr :5000
netstat -ano | findstr :8000
netstat -ano | findstr :5173
```

**Database Errors:**
```bash
# Check MongoDB logs
# Windows: Check Event Viewer or MongoDB log files
```

**API Errors:**
- Use Postman to isolate issues
- Check request/response headers
- Verify JWT tokens

### Common Fixes
**Port Conflicts:**
```bash
# Kill process on port
netstat -ano | findstr :PORT
taskkill /PID <PID> /F
```

**Dependency Issues:**
```bash
# Clear caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Environment Variables:**
- Ensure .env files are in correct directories
- Restart services after .env changes

## 7. Perform End-to-End Testing

### Complete User Journey
1. **User Registration & Login**
2. **Create Workspace** (if applicable)
3. **Build Questionnaire**
4. **Configure Settings** (logic, themes)
5. **Generate Share Link**
6. **Respondent Experience** (different browser)
7. **View Responses & Analytics**
8. **Export Data**
9. **AI Insights** (if FastAPI running)

### Cross-Browser Testing
- Test in Chrome, Firefox, Safari, Edge
- Check mobile responsiveness

### Performance Testing
- Load time < 3 seconds
- API response time < 500ms
- Memory usage monitoring

## 8. Document Testing Results

### Create Test Report
```markdown
# Test Report - [Date]

## Summary
- Total tests: X
- Passed: X
- Failed: X
- Issues found: X

## Test Cases
### Authentication
- [ ] User registration
- [ ] User login
- [ ] JWT token validation

### Questionnaire Management
- [ ] Create questionnaire
- [ ] Edit questionnaire
- [ ] Delete questionnaire

### Response Collection
- [ ] Submit responses
- [ ] View responses
- [ ] Export responses

## Issues Found
1. Issue description
   - Steps to reproduce
   - Expected vs actual
   - Severity: High/Medium/Low

## Recommendations
- Fix priority issues
- Add unit tests
- Implement monitoring
```

### Logging
- Implement structured logging
- Monitor error rates
- Set up alerts for critical issues

## Additional Tools

### Testing Frameworks
```bash
# Frontend
npm install --save-dev @testing-library/react jest

# Backend Node
npm install --save-dev jest supertest

# Backend Python
pip install pytest fastapi-testclient
```

### Monitoring
- Add Winston for Node.js logging
- Use Morgan for HTTP request logging
- Implement health checks

### Deployment Testing
- Test on staging environment
- Load testing with Artillery
- Security scanning

## Troubleshooting Checklist

- [ ] All services running on correct ports
- [ ] Database connection established
- [ ] Environment variables loaded
- [ ] Dependencies installed
- [ ] CORS configured
- [ ] JWT secret consistent
- [ ] API endpoints match frontend calls
- [ ] Browser cache cleared
- [ ] Firewall not blocking ports

This guide should help you systematically test and debug your MERN Questionnaire Platform. Start with basic health checks and progress to complex user flows.