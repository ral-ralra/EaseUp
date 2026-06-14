@echo off
setlocal
cd /d "%~dp0"
echo EaseUp desktop starting...
taskkill /F /IM electron.exe /T >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul
call npm.cmd run desktop
