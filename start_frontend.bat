@echo off
title Brightloop Frontend (Vite + React)
cd /d "%~dp0frontend"

echo ========================================================
echo   Brightloop Frontend Launcher
echo ========================================================

:: Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing frontend dependencies...
    call npm.cmd install
)

echo [INFO] Starting Vite development server on http://localhost:5173 ...
call npm.cmd run dev

pause
