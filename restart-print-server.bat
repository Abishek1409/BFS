@echo off
echo ================================================
echo  RESTARTING BFS PRINT SERVER WITH UPDATES
echo ================================================
echo.

echo [1/3] Stopping old print server...
echo.

REM Kill all Node.js processes
taskkill /F /IM node.exe >nul 2>&1

REM Kill hidden cmd processes that might be running the server
wmic process where "CommandLine like '%%print-server.js%%'" delete >nul 2>&1

echo [2/3] Waiting for port to be released...
timeout /t 3 /nobreak >nul

echo [3/3] Starting updated print server (hidden mode)...
echo.

REM Run the VBS script to start server in background (same as auto-start)
cscript //nologo "%~dp0start-print-server-hidden.vbs"

timeout /t 2 /nobreak >nul

echo.
echo ================================================
echo  DONE! Print server restarted with updates
echo ================================================
echo.
echo The server is now running in the background.
echo Check that it's working:
echo   1. Open: http://localhost:3000/test
echo   2. Should show: "success": true
echo.
echo If you see errors, try:
echo   - Restart your computer
echo   - Or run this script again
echo.

pause
