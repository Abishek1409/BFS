@echo off
echo ========================================
echo   Starting Print Server...
echo ========================================
echo.

REM Change to the directory where this bat file is located
cd /d "%~dp0"

REM Printer IP variables must be saved in Windows with setx before auto-start.
if not defined PRINTER1_IP if not defined PRINTER2_IP (
    echo ERROR: Printer IPs are not configured.
    echo Set PRINTER1_IP and optionally PRINTER2_IP with the actual WiFi printer addresses.
    echo Example: setx PRINTER1_IP "192.168.1.19"
    echo Close and reopen this window after using setx, then retry.
    pause
    exit /b 1
)

if not exist "node_modules\express" (
    echo ERROR: Dependencies are missing. Run npm install in this folder first.
    pause
    exit /b 1
)

REM Start the print server
node print-server.js

REM If node command fails, show error
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start print server!
    echo.
    echo Please make sure:
    echo 1. Node.js is installed
    echo 2. Dependencies are installed (run: npm install)
    echo.
    pause
)
