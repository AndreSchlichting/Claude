@echo off
chcp 65001 >nul
title Trading Decision Lab - Desktop
cd /d "%~dp0"

echo ============================================
echo   Trading Decision Lab - Desktop-Version
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert.
    echo Bitte von https://nodejs.org herunterladen und installieren.
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
