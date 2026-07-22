@echo off
title Trading Decision Lab - Daten-Server
cd /d "%~dp0"

echo ============================================
echo   Trading Decision Lab - Daten-Server
echo   (Indizes, News, BaFin, Aktienkurse, Webhooks)
echo ============================================
echo.

node --version >nul 2>nul
if not errorlevel 1 goto node_ok
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
node --version >nul 2>nul
if not errorlevel 1 goto node_ok
if exist "%~dp0runtime\node\node.exe" set "PATH=%~dp0runtime\node;%PATH%"
node --version >nul 2>nul
if not errorlevel 1 goto node_ok
echo Node.js nicht gefunden - bitte zuerst Start.bat ausfuehren.
pause
exit /b 1

:node_ok
echo Server laeuft auf http://localhost:3777
echo Dieses Fenster geoeffnet lassen! Beenden mit STRG+C.
echo.
node server\webhook-server.mjs
pause
