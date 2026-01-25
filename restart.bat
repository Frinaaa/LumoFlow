@echo off
echo Stopping all Node and Electron processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo Clearing cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo Starting application...
npm start
