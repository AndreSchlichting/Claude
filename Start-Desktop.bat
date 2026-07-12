@echo off
chcp 65001 >nul
title Trading Decision Lab - Desktop
cd /d "%~dp0"

echo ============================================
echo   Trading Decision Lab - Desktop-Version
echo ============================================
echo.

set "NODE_OK="
node --version >nul 2>nul && set "NODE_OK=1"
if not defined NODE_OK if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    set "NODE_OK=1"
)
if not defined NODE_OK if exist "%LocalAppData%\Programs\nodejs\node.exe" (
    set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
    set "NODE_OK=1"
)
if not defined NODE_OK if exist "%~dp0runtime\node\node.exe" (
    set "PATH=%~dp0runtime\node;%PATH%"
    set "NODE_OK=1"
)
if not defined NODE_OK (
    echo Node.js nicht gefunden. Bitte zuerst Start.bat ausfuehren -
    echo sie richtet Node.js automatisch ein.
    pause
    exit /b 1
)

if not exist node_modules (
    echo Erste Einrichtung: Abhaengigkeiten werden installiert...
    call npm install
    if errorlevel 1 (
        echo [FEHLER] Installation fehlgeschlagen.
        pause
        exit /b 1
    )
)

if not exist dist (
    echo App wird gebaut...
    call npm run build
)

echo Starte Desktop-App...
call npm run desktop
pause
