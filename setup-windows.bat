@echo off
echo ========================================
echo Possiflow Print Server - Windows Setup
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install from: https://nodejs.org
    pause
    exit /b 1
)

echo Enter the WiFi IP address for each printer.
echo Leave Printer 2 blank if you only use one printer.
echo Find these addresses on the printer network status page.
echo.
set /p PRINTER1_IP=Printer 1 IP: 
if not defined PRINTER1_IP (
    echo ERROR: Printer 1 IP is required.
    pause
    exit /b 1
)
set /p PRINTER2_IP=Printer 2 IP (optional): 

echo Saving printer addresses for future logins...
call setx PRINTER1_IP "%PRINTER1_IP%"
if defined PRINTER2_IP (
    call setx PRINTER2_IP "%PRINTER2_IP%"
) else (
    set "PRINTER2_IP="
    reg delete "HKCU\Environment" /v PRINTER2_IP /f >nul 2>nul
)

echo.
echo Installing project dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed.
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
call pm2 delete possiflow-printer >nul 2>nul
call pm2 start print-server.js --name possiflow-printer --update-env

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
echo Test Printer 1: http://localhost:3000/test/printer1
echo.
echo Useful commands:
echo   pm2 status              - Check if running
echo   pm2 logs possiflow-printer - View logs
echo   pm2 restart possiflow-printer - Restart server
echo.
pause
