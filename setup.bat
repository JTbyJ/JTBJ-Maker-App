@echo off
title Just Jane Maker Lab - Setup
color 0D
echo.
echo  ==========================================
echo   Just Jane Maker Lab - First-Time Setup
echo  ==========================================
echo.
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js is not installed. Get it at https://nodejs.org
  pause & exit /b 1
)
echo  [OK] Node.js found.
echo.
echo  Installing Electron (may take a minute)...
echo.
call npm install
if %errorlevel% neq 0 (
  echo  [ERROR] npm install failed. Check internet and try again.
  pause & exit /b 1
)
echo.
echo  Setup complete! Run START-MAKER-LAB.bat to launch.
echo.
pause
