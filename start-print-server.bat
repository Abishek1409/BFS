@echo off
echo ========================================
echo   Starting Print Server...
echo ========================================
echo.

REM Change to the directory where this bat file is located
cd /d "%~dp0"

REM Start the print server
node print-server.js

REM If node command fails, show error
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start print server!
    echo.
    echo Please make sure:
    echo 1. Node.js is installed
    echo 2. Dependencies are installed (run: npm install express cors)
    echo.
    pause
)
