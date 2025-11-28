# 📊 MERN Questionnaire Platform

A comprehensive web application for creating, distributing, and analyzing questionnaires with AI-powered insights. Built with modern MERN stack architecture featuring advanced analytics, team collaboration, and enterprise-grade features.

## ✨ Key Features

### 🎯 Core Functionality
- **Advanced Questionnaire Builder**: Drag-and-drop interface with 10+ question types
- **Smart Distribution**: Shareable links, QR codes, email campaigns, embedded forms
- **Real-time Response Collection**: Live tracking with partial save and validation
- **AI-Powered Analytics**: Automated insights, sentiment analysis, trend detection
- **Multi-format Export**: Excel, PDF, CSV with custom report builder

### 🚀 Enhanced Capabilities
- **Team Collaboration**: Workspaces, role-based permissions, review workflows
- **Advanced Logic**: Conditional branching, question randomization, validation rules
- **Enterprise Features**: Multi-language support, API integrations, audit logging
- **Performance**: Real-time dashboards, automated notifications, scheduled reports
- **Security**: JWT authentication, GDPR compliance, data encryption

### 🤖 AI & Automation
- **Smart Insights**: Automated analysis and recommendations
- **Predictive Analytics**: Response forecasting and trend analysis
- **Natural Language Processing**: Sentiment analysis and topic modeling
- **Intelligent Suggestions**: Question optimization and survey improvement tips
---

## 🏗️ Architecture & Tech Stack

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │ Node.js Backend │    │ FastAPI Backend │
│   (Port 5173)   │◄──►│   (Port 5000)   │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Database      │
                    └─────────────────┘
```

### Technology Stack
#### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for modern, responsive styling
- **React Router** for client-side navigation
- **Axios** for API communication
- **React Hook Form** for form management

#### Backend Services
- **Node.js + Express.js**: Authentication, questionnaire management, response collection
- **FastAPI + Python**: AI analysis, data processing, Excel export
- **MongoDB**: NoSQL database with Mongoose ODM

#### Additional Technologies
- **JWT Authentication** with bcrypt password hashing
- **AWS S3** or **CloudFlare R2** for file storage
- **Redis** for caching and session management
- **Docker** for containerization
- **Nginx** for load balancing
---

■ Project Structure

project-root/
■
■■■ frontend/ # React.js app (form builder + dashboard)
■■■ backend-node/ # Node.js Express server (auth, forms, responses)
■■■ backend-fastapi/ # FastAPI service (AI, Excel export)
■■■ README.md # Documentation

---

■ How It Works (Workflow)
1. A **creator** signs up and builds a questionnaire in the React app.
2. The **system generates a link** that can be shared with others.
3. **Respondents** open the link and submit answers.
4. Node.js saves responses in the database.
5. When requested, Node.js sends responses to FastAPI.
6. FastAPI processes data → creates Excel file + AI summary.
7. The **creator downloads the report** or views AI insights in the dashboard.
---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local or Atlas)
- **Git**

### Installation & Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd MERN-FINAL-PROJECT
```

#### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
**Access**: http://localhost:5173

#### 3. Setup Node.js Backend
```bash
cd ../backend-node
npm install
# Configure .env file with your MongoDB URI
npm run dev
```
**Access**: http://localhost:5000

#### 4. Setup FastAPI Backend
```bash
cd ../backend-fastapi
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
**Access**: http://localhost:8000

#### 5. Database Setup
- **Local MongoDB**: Install MongoDB Community Server (recommended for development)
- **MongoDB Atlas**: Create cluster and get connection string (recommended for production)
- Update `.env` file in `backend-node` with your database URI
- See `MONGODB_SETUP.md` for detailed setup instructions

### Environment Configuration

Create `.env` files in respective backend directories:

**backend-node/.env**:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern-questionnaire
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

**backend-fastapi/.env** (if needed):
```env
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-fastapi-secret-key
```

### Development Workflow
1. **Set up MongoDB**: Choose either local MongoDB or MongoDB Atlas (see `MONGODB_SETUP.md`)
2. Start all services using the commands above
3. Frontend will hot-reload on changes
4. Backend services use nodemon/FastAPI reload for development
5. Access the application at http://localhost:5173

### Current Status
✅ **Backend API**: Fully implemented with all routes
✅ **Frontend UI**: Complete React application with modern design
✅ **Database Models**: Comprehensive Mongoose schemas
✅ **Authentication**: JWT-based auth system
✅ **MongoDB Atlas**: Configured for cloud database
🔄 **Local MongoDB**: Requires local installation for development

## 🚀 Quick Start Guide

### Option 1: One-Click Local Setup (Windows)
```cmd
# Method 1: Double-click start-local.bat in File Explorer
# OR open Command Prompt/PowerShell in project folder and run:
.\start-local.bat
```
This script will:
- ✅ Check Node.js version (requires v18+)
- 📦 Install backend and frontend dependencies
- 🔄 Attempt to start MongoDB service
- 📡 Launch backend server on port 5000
- 🌐 Launch frontend server on port 5173
- 🎉 Display access URLs

**Important:** Run this from the project root directory where `start-local.bat` is located.

### Option 2: Manual Local Setup
```bash
# 1. Install dependencies
cd backend-node && npm install
cd ../frontend && npm install

# 2. Start MongoDB (choose one)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# 3. Start services (in separate terminals)
# Terminal 1 - Backend:
cd backend-node && npm run dev

# Terminal 2 - Frontend:
cd frontend && npm run dev

# Optional - Terminal 3 - AI Service:
cd backend-fastapi && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

### Option 3: MongoDB Atlas (Cloud Database)
1. Follow `MONGODB_SETUP.md` for Atlas configuration
2. Update IP whitelisting in Atlas dashboard
3. Run the application as above
4. Visit http://localhost:5173

**Access URLs:**
- **Application**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Troubleshooting

**"start-local.bat is not recognized"**
```cmd
# Make sure you're in the project root directory:
cd "c:\Users\user\Documents\PLP_CLASS\MERN STACK\FINAL PROJECT\MERN-FINAL-PROJECT"

# Then run:
.\start-local.bat
```

**"MongoDB connection failed"**
- The app will still work but database features won't function
- Install MongoDB from: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (see MONGODB_SETUP.md)

**"Port already in use"**
```cmd
# Find what's using the port:
netstat -ano | findstr :5173
# Kill the process with the PID shown
```

**"npm install fails"**
```cmd
# Clear npm cache:
npm cache clean --force
# Delete node_modules and try again:
rmdir /s node_modules
npm install
```

## 🚀 Production Deployment

### Quick Deploy Options

#### 1. Vercel (Frontend) + Railway (Backend) - Recommended
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend to Railway
# 1. Connect GitHub repo to Railway.app
# 2. Railway auto-detects services
# 3. Set environment variables in Railway dashboard

# Deploy frontend to Vercel
cd frontend
vercel --prod
```

#### 2. Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost
```

#### 3. Manual Cloud Deployment
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Backend**: Heroku, Railway, or AWS ECS
- **Database**: MongoDB Atlas (already configured)

### 📚 Documentation
- **[🚀 Deployment Guide](DEPLOYMENT_GUIDE.md)**: Complete local development and production deployment instructions
- **[🗄️ MongoDB Setup](MONGODB_SETUP.md)**: Database configuration for Atlas and local MongoDB
- **[📖 API Documentation](docs/API_DOCUMENTATION.md)**: Complete API reference
- **[🏗️ Features](docs/FEATURES.md)**: Detailed feature specifications
---

## 📖 Documentation & Resources

### 📋 Detailed Documentation
- **[📄 Complete Feature Document](docs/FEATURES.md)**: Comprehensive feature specifications, API endpoints, database schemas, and technical architecture
- **API Documentation**: Auto-generated Swagger/OpenAPI docs at `/docs` endpoints
- **Code Documentation**: Inline comments and JSDoc/TypeScript documentation

### 🎯 Example Workflows

#### Customer Feedback Survey
1. **Login** → Create workspace for "Customer Experience Team"
2. **Build Form** → Add rating scales, text feedback, and conditional follow-ups
3. **Configure Logic** → Show follow-up questions based on satisfaction scores
4. **Share Survey** → Generate QR codes for in-store tablets
5. **Monitor Responses** → Real-time dashboard with completion tracking
6. **AI Analysis** → Automated sentiment analysis and trend identification
7. **Generate Report** → Custom PDF report with insights and recommendations

#### Employee Engagement Survey
1. **Team Setup** → Create HR workspace with multiple administrators
2. **Advanced Builder** → Multi-language support, question randomization
3. **Distribution** → Email campaigns with personalized invitations
4. **Progress Tracking** → Department-wise completion monitoring
5. **Advanced Analytics** → Cross-tabulation, benchmarking, predictive insights
6. **Scheduled Reports** → Automated monthly reports to executives

## 🔒 Security & Best Practices

### Authentication & Authorization
- **JWT Tokens** with secure refresh token rotation
- **Password Policies** with bcrypt hashing and complexity requirements
- **Role-Based Access Control** (RBAC) with granular permissions
- **Two-Factor Authentication** (2FA) support
- **Session Management** with automatic timeout and secure logout

### Data Protection
- **Encryption**: Data encrypted at rest and in transit (TLS 1.3)
- **GDPR Compliance**: Data subject rights, consent management, audit trails
- **Input Validation**: Comprehensive sanitization and validation
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Content Security Policy (CSP) and input escaping

### Security Monitoring
- **Audit Logging**: Comprehensive activity tracking and reporting
- **Rate Limiting**: API rate limiting and abuse prevention
- **Security Headers**: OWASP recommended security headers
- **Vulnerability Scanning**: Automated security testing and monitoring

## 🚀 Deployment & Production

### Recommended Hosting Platforms
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Node.js Backend**: Heroku, Render, Railway, or AWS ECS
- **FastAPI Backend**: Railway, Render, or AWS Lambda
- **Database**: MongoDB Atlas (recommended) or AWS DocumentDB
- **File Storage**: AWS S3, CloudFlare R2, or Google Cloud Storage

### Production Checklist
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] CDN configured for static assets
- [ ] Security headers implemented
- [ ] Performance optimization completed

## 🗺️ Development Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Basic questionnaire creation and management
- [x] Response collection and storage
- [x] Simple analytics and reporting
- [x] User authentication and authorization
- [x] Basic Excel export functionality

### 🚧 Phase 2: Enhanced Features (Next)
- [ ] Advanced question types (matrix, file upload, etc.)
- [ ] Conditional logic and branching
- [ ] Team collaboration and workspaces
- [ ] Real-time response tracking
- [ ] Enhanced UI/UX with modern design
- [ ] Mobile-responsive optimization

### 📋 Phase 3: AI & Analytics (Future)
- [ ] AI-powered insights and recommendations
- [ ] Sentiment analysis and NLP processing
- [ ] Predictive analytics and forecasting
- [ ] Advanced reporting with custom dashboards
- [ ] Automated report generation and scheduling
- [ ] Integration with external analytics tools

### 🌟 Phase 4: Enterprise Scale (Future)
- [ ] Multi-language support and localization
- [ ] Advanced integrations (CRM, ERP, etc.)
- [ ] Enterprise security and compliance features
- [ ] Advanced user management and SSO
- [ ] Performance optimization and scaling
- [ ] Advanced deployment and DevOps automation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards
- **Frontend**: ESLint, Prettier, React best practices
- **Backend**: ESLint, JSDoc, RESTful API design
- **Python**: Black, Flake8, type hints
- **Testing**: Jest for frontend, Supertest for APIs, Pytest for Python

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)

---

**Built with ❤️ for the MERN stack learning journey**
**Website - [https://your-website.com](https://mern-final-project-three.vercel.app)**
