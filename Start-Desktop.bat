@echo off
title Trading Decision Lab - Desktop
cd /d "%~dp0"

echo ============================================
echo   Trading Decision Lab - Desktop-Version
echo ============================================
echo.

node --version >nul 2>nul
if not errorlevel 1 goto node_ok

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
node --version >nul 2>nul
if not errorlevel 1 goto node_ok

if exist "%LocalAppData%\Programs\nodejs\node.exe" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
node --version >nul 2>nul
if not errorlevel 1 goto node_ok

if exist "%~dp0runtime\node\node.exe" set "PATH=%~dp0runtime\node;%PATH%"
node --version >nul 2>nul
if not errorlevel 1 goto node_ok

echo Node.js nicht gefunden.
echo Bitte zuerst Start.bat ausfuehren - sie richtet Node.js
echo automatisch ein. Danach diese Datei erneut starten.
echo.
pause
exit /b 1

:node_ok
if exist node_modules goto deps_ok
echo Erste Einrichtung: Abhaengigkeiten werden installiert...
call npm install
if errorlevel 1 goto install_failed

:deps_ok
if exist dist goto build_ok
echo App wird gebaut...
call npm run build

:build_ok
echo Starte Desktop-App...
call npm run desktop
pause
exit /b 0

:install_failed
echo [FEHLER] Installation fehlgeschlagen.
pause
exit /b 1
