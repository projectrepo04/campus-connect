@echo off
chcp 65001 >nul
title Campus Connect
echo.
echo   ╔══════════════════════════════════════════╗
echo   ║      Campus Connect - Launcher           ║
echo   ╚══════════════════════════════════════════╝
echo.

echo [1/4] Stopping existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo       Ports 5000 and 5173 cleared.
echo.

echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo       Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo       ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)
if not exist "server\node_modules" (
    echo       Installing server dependencies...
    cd server && call npm install && cd ..
    if errorlevel 1 (
        echo       ERROR: Failed to install server dependencies.
        pause
        exit /b 1
    )
)
if not exist "client\node_modules" (
    echo       Installing client dependencies...
    cd client && call npm install && cd ..
    if errorlevel 1 (
        echo       ERROR: Failed to install client dependencies.
        pause
        exit /b 1
    )
)
echo       Dependencies ready.
echo.

echo [3/4] Creating required directories...
if not exist "server\uploads" mkdir "server\uploads"
if not exist "uploads" mkdir "uploads"
echo       Done.
echo.

echo [4/4] Starting application...
echo.
echo   ┌──────────────────────────────────────────┐
echo   │  Server:  http://localhost:5000           │
echo   │  Client:  http://localhost:5173           │
echo   │                                           │
echo   │  Press Ctrl+C to stop both services       │
echo   └──────────────────────────────────────────┘
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

npm run dev
