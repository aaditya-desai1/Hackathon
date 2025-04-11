@echo off
echo Stopping any running Node.js processes...
taskkill /f /im node.exe /t

echo.
echo Clearing browser cache might help with UI display issues...
echo Close browser tabs with the application before continuing.
timeout /t 3

echo.
echo Starting DataViz Pro servers...

echo.
echo Starting backend server in new window...
start cmd /k "cd backend && npm run dev"

echo.
echo Starting frontend server in new window...
start cmd /k "cd frontend && npm start"

echo.
echo Servers are starting! The application will open automatically in your browser.
echo You can close this window.
timeout /t 5 