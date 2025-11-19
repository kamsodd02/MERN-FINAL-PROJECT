# 🚀 MERN Questionnaire Platform - Deployment Guide

This guide provides step-by-step instructions to run the application locally and deploy it to production.

## 🏠 Local Development Setup

### Prerequisites
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local installation) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone and Setup Project
```bash
# Clone the repository
git clone <your-repository-url>
cd MERN-FINAL-PROJECT

# Install backend dependencies
cd backend-node
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### Step 2: Setup Local MongoDB
```bash
# Windows: Start MongoDB service
net start MongoDB

# macOS/Linux: Start MongoDB
sudo systemctl start mongod
# or
brew services start mongodb-community

# Verify MongoDB is running
mongod --version
```

### Step 3: Configure Environment Variables
The `.env` file in `backend-node/` is already configured for local development:
```env
MONGODB_URI_LOCAL=mongodb://localhost:27017/mern-questionnaire
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
FRONTEND_URL=http://localhost:5173
```

### Step 4: Start the Application
```bash
# Terminal 1: Start Backend
cd backend-node
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Optional: Terminal 3: Start FastAPI (for AI features)
cd backend-fastapi
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 5: Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **FastAPI**: http://localhost:8000
- **API Documentation**: http://localhost:5000/api/test

### Step 6: Test Basic Functionality
1. Visit http://localhost:5173
2. Click "Sign up" to create an account
3. Create your first questionnaire
4. Test the questionnaire builder
5. Submit a response
6. Check analytics

## ☁️ Production Deployment

### Option 1: Vercel + MongoDB Atlas (Recommended)

#### 1. Setup MongoDB Atlas
```bash
# Follow MONGODB_SETUP.md for Atlas configuration
# Get your connection string
```

#### 2. Deploy Backend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend-node
vercel --prod

# Set environment variables in Vercel dashboard
# MONGODB_URI=your-atlas-connection-string
# JWT_SECRET=your-production-jwt-secret
# NODE_ENV=production
# FRONTEND_URL=your-frontend-url
```

#### 3. Deploy Frontend to Vercel
```bash
cd frontend
vercel --prod

# Set environment variable
# VITE_API_URL=your-backend-vercel-url
```

### Option 2: Railway + Railway Database

#### 1. Create Railway Account
- Go to [Railway.app](https://railway.app)
- Connect your GitHub repository

#### 2. Deploy Services
Railway will automatically detect and deploy:
- `backend-node/` as Node.js service
- `frontend/` as static site
- `backend-fastapi/` as Python service

#### 3. Configure Environment Variables
In Railway dashboard, set:
```env
MONGODB_URI=your-railway-database-url
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
FRONTEND_URL=your-railway-frontend-url
```

### Option 3: Docker Deployment

#### 1. Create Docker Compose File
```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend-node
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/mern_questionnaire
      - JWT_SECRET=your-jwt-secret
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### 2. Create Dockerfiles

**backend-node/Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Deploy with Docker
```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f
```

## 🔧 Environment Configuration

### Development (.env)
```env
# Database
MONGODB_URI_LOCAL=mongodb://localhost:27017/mern-questionnaire

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# URLs
FRONTEND_URL=http://localhost:5173
FASTAPI_URL=http://localhost:8000
```

### Production (.env.production)
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Server
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=30d

# URLs
FRONTEND_URL=https://yourdomain.com
FASTAPI_URL=https://your-fastapi-service.com

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🧪 Testing Deployment

### Health Checks
```bash
# Backend health
curl https://your-backend-url/health

# API test
curl https://your-backend-url/api/test

# Frontend
curl https://your-frontend-url
```

### Functional Testing
1. **User Registration**: Create a new account
2. **Questionnaire Creation**: Build and publish a questionnaire
3. **Response Submission**: Submit responses anonymously
4. **Analytics**: Check dashboard and insights
5. **Export**: Test data export functionality

## 🔒 Security Checklist

### Pre-Production
- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure monitoring and logging

### Database Security
- [ ] Restrict IP access in MongoDB Atlas
- [ ] Use strong database passwords
- [ ] Enable database authentication
- [ ] Set up database backups

### Application Security
- [ ] Use environment variables for secrets
- [ ] Implement input validation
- [ ] Enable CSRF protection
- [ ] Set secure cookie options
- [ ] Regular security updates

## 📊 Monitoring & Maintenance

### Logs
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Vercel logs
vercel logs
```

### Backups
```bash
# MongoDB Atlas: Automatic backups enabled
# Local: Manual backups
mongodump --db mern-questionnaire --out backup-$(date +%Y%m%d)
```

### Updates
```bash
# Update dependencies
npm audit fix
npm update

# Rebuild and redeploy
docker-compose down
docker-compose up -d --build
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod

   # Test connection
   mongo --eval "db.stats()"
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :5000

   # Kill process
   kill -9 <PID>
   ```

3. **Build Failures**
   ```bash
   # Clear cache
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Environment Variables**
   ```bash
   # Check variables are loaded
   node -e "console.log(process.env)"
   ```

## 📞 Support

For issues:
1. Check application logs
2. Verify environment configuration
3. Test API endpoints individually
4. Check database connectivity
5. Review deployment platform documentation

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev                    # Start development servers
npm run build                  # Build for production
npm test                       # Run tests

# Docker
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f         # View logs

# Database
mongosh                        # MongoDB shell
mongodump --db mern-questionnaire  # Backup database
mongorestore backup-folder     # Restore database
```

---

**🎉 Your MERN Questionnaire Platform is ready for local development and production deployment!**