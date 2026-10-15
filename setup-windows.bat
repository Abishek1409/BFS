@echo off
echo ========================================
echo Possiflow Print Server - Windows Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install from: https://nodejs.org
    pause
    exit /b 1
)

echo [1/4] Installing PM2...
call npm install -g pm2
call npm install -g pm2-windows-startup

echo.
echo [2/4] Configuring PM2 startup...
call pm2-startup install

echo.
echo [3/4] Starting print server...
call pm2 start simple-print-server.js --name possiflow-printer

echo.
echo [4/4] Saving configuration...
call pm2 save

echo.
echo ========================================
echo SUCCESS! Setup Complete!
echo ========================================
echo.
echo Print server will now start automatically when Windows boots.
echo.
echo Test it: http://localhost:3000/test
echo.
echo Useful commands:
echo   pm2 status              - Check if running
echo   pm2 logs possiflow-printer - View logs
echo   pm2 restart possiflow-printer - Restart server
echo.
pause
