@echo off
title Brightloop Backend (Axum + PostgreSQL)
cd /d "%~dp0backend"

echo ========================================================
echo   Brightloop Backend Launcher
echo ========================================================

:: Check if PostgreSQL port 5432 is listening
netstat -ano | findstr /R /C:":5432 .*LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] PostgreSQL is not running. Starting local PostgreSQL server...
    if exist "C:\Users\parja\pgsql\pgsql\bin\postgres.exe" (
        start "PostgreSQL Server" "C:\Users\parja\pgsql\pgsql\bin\postgres.exe" -D "C:\Users\parja\pgsql_data"
        timeout /t 3 /nobreak >nul
    ) else (
        echo [WARN] Could not find postgres.exe at default path. Ensure PostgreSQL is active.
    )
) else (
    echo [OK] PostgreSQL is already running on port 5432.
)

echo [INFO] Starting Rust Axum Backend on http://localhost:3000 ...
if exist "target\debug\brightloop-backend.exe" (
    echo [INFO] Launching precompiled binary: target\debug\brightloop-backend.exe
    target\debug\brightloop-backend.exe
) else (
    echo [INFO] Building and running via Cargo...
    cargo run
)

pause
