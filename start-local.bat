@echo off
REM MERN Questionnaire Platform - Local Development Startup Script (Windows)
REM This script helps you quickly start the application locally on Windows

echo 🚀 Starting MERN Questionnaire Platform - Local Development
echo ===========================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v." %%i in ('node --version') do set NODE_MAJOR=%%i
if %NODE_MAJOR% lss 18 (
    echo ❌ Node.js version 18 or higher is required. Current version:
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB is not running. Attempting to start...
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo Please start MongoDB service manually: net start MongoDB
        echo Or install MongoDB from: https://www.mongodb.com/try/download/community
    )
)

REM Wait a moment for MongoDB to start
timeout /t 2 /nobreak >nul

REM Check MongoDB connection (simplified check)
echo Checking MongoDB connection...
mongosh --eval "db.adminCommand('ping')" --quiet >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running
) else (
    echo ⚠️  MongoDB connection check failed. The app will still start but database operations may fail.
    echo    Please ensure MongoDB is installed and running.
)

REM Install backend dependencies if needed
if not exist "backend-node\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend-node
    call npm install
    cd ..
)

REM Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Start services
echo 🔄 Starting services...

REM Start backend in background
echo 📡 Starting backend server on port 5000...
start /B cmd /C "cd backend-node && npm run dev > ../backend.log 2>&1"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in background
echo 🌐 Starting frontend server on port 5173...
start /B cmd /C "cd frontend && npm run dev > ../frontend.log 2>&1"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Application started successfully!
echo ====================================
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:5000
echo 💚 Health:   http://localhost:5000/health
echo.
echo 📝 To stop: Close the command windows or press Ctrl+C here
echo 📊 View logs: backend.log and frontend.log
echo.

REM Keep the script running
pause