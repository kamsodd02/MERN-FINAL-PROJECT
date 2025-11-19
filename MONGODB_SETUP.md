# MongoDB Setup Guide

This guide explains how to set up MongoDB for the MERN Questionnaire Platform.

## Option 1: MongoDB Atlas (Cloud - Recommended for Production)

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new project called "MERN Questionnaire"

### 2. Create a Cluster
1. Click "Build a Database"
2. Choose "M0 Cluster" (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster (e.g., "QuestionnaireCluster")
5. Click "Create Cluster"

### 3. Set up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username: `adebayokamoru40_db_user`
5. Enter password: `MxcJcmWgD7dMRERY`
6. Set user privileges to "Read and write to any database"
7. Click "Add User"

### 4. Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, you can:
   - Add your current IP address, OR
   - Add `0.0.0.0/0` for all IPs (less secure but easier for development)
4. Click "Confirm"

### 5. Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Update the `.env` file with this connection string

### 6. Test Connection
The application will automatically try to connect. If you see connection errors, double-check:
- IP whitelisting
- Username/password
- Connection string format

## Option 2: Local MongoDB (Development)

### Install MongoDB Community Server

#### Windows:
1. Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Follow the installation wizard
4. Start MongoDB service

#### macOS (using Homebrew):
```bash
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu):
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Verify Installation
```bash
mongod --version
mongo --eval "db.adminCommand('ismaster')"
```

### Environment Configuration
The application is already configured to use local MongoDB by default in development:
```
MONGODB_URI_LOCAL=mongodb://localhost:27017/mern-questionnaire
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Ensure MongoDB service is running
   - Check if port 27017 is available
   - Verify connection string

2. **Authentication Failed**
   - Check username/password in Atlas
   - Ensure user has correct permissions
   - Verify database user exists

3. **IP Not Allowed**
   - Add your IP address to Atlas whitelist
   - Or use `0.0.0.0/0` for development (not recommended for production)

4. **Network Issues**
   - Check firewall settings
   - Ensure port 27017 is open
   - Try connecting with MongoDB Compass first

### Testing Connection

You can test the connection using the health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response when connected:
```json
{
  "status": "OK",
  "timestamp": "2025-11-15T17:00:00.000Z",
  "database": "connected",
  "uptime": 123.45
}
```

## Database Schema

The application creates the following collections automatically:
- `users` - User accounts and authentication
- `questionnaires` - Survey/questionnaire definitions
- `responses` - User responses to questionnaires
- `workspaces` - Team collaboration spaces
- `analytics` - AI-generated insights
- `auditlogs` - Activity tracking
- `notifications` - System notifications

## Production Deployment

For production deployment:
1. Use MongoDB Atlas with proper security
2. Set `NODE_ENV=production` in environment
3. Use strong, unique passwords
4. Restrict IP access to your server IPs only
5. Enable database backups
6. Monitor connection limits and performance

## Support

If you encounter issues:
1. Check the application logs in the terminal
2. Verify your `.env` configuration
3. Test connection with MongoDB Compass
4. Refer to [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)