#!/bin/bash

# MERN Questionnaire Platform - Local Development Startup Script
# This script helps you quickly start the application locally

echo "🚀 Starting MERN Questionnaire Platform - Local Development"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB is not running. Attempting to start..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start mongodb-community 2>/dev/null || echo "Please start MongoDB manually: brew services start mongodb-community"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongod 2>/dev/null || echo "Please start MongoDB manually: sudo systemctl start mongod"
    else
        # Windows
        echo "Please start MongoDB service manually or run: net start MongoDB"
    fi
fi

# Wait a moment for MongoDB to start
sleep 2

# Check MongoDB connection
if mongosh --eval "db.adminCommand('ping')" --quiet; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB connection failed. The app will still start but database operations will fail."
    echo "   Please ensure MongoDB is installed and running."
fi

# Install backend dependencies if needed
if [ ! -d "backend-node/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend-node
    npm install
    cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start services in background
echo "🔄 Starting services..."

# Start backend
echo "📡 Starting backend server on port 5000..."
cd backend-node
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend server on port 5173..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

echo ""
echo "🎉 Application started successfully!"
echo "===================================="
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:5000"
echo "💚 Health:   http://localhost:5000/health"
echo ""
echo "📝 To stop the application, press Ctrl+C"
echo "📊 View logs with: tail -f backend.log frontend.log"
echo ""

# Function to cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait