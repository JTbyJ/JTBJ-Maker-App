
@echo off
title Just Jane Maker Lab
color 0D
echo.
echo  Launching Just Jane Maker Lab...
echo.
if not exist "node_modules\" (
  echo  [!] node_modules not found. Running setup first...
  call setup.bat
)
npm start
