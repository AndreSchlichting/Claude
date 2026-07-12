@echo off
title Trading Decision Lab
cd /d "%~dp0"

echo ============================================
echo   Trading Decision Lab - Web-Version
echo ============================================
echo.

rem ---- Node.js suchen: PATH, Standardordner, Projektordner ----
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

rem ---- Nicht gefunden: portable Node.js automatisch herunterladen ----
echo Node.js wurde nicht gefunden.
echo Lade portable Node.js herunter - das passiert nur einmal...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-node.ps1"
if exist "%~dp0runtime\node\node.exe" set "PATH=%~dp0runtime\node;%PATH%"
node --version >nul 2>nul
if not errorlevel 1 goto node_ok

echo.
echo [FEHLER] Node.js konnte nicht eingerichtet werden.
echo Bitte Internetverbindung pruefen oder Node.js manuell
echo installieren: https://nodejs.org
echo.
pause
exit /b 1

:node_ok
for /f "delims=" %%v in ('node --version') do echo Node.js gefunden: %%v
echo.

rem ---- Beim ersten Start: Abhaengigkeiten installieren ----
if exist node_modules goto deps_ok
echo Erste Einrichtung: Abhaengigkeiten werden installiert...
echo Das dauert nur beim ersten Mal einige Minuten.
echo.
call npm install
if errorlevel 1 goto install_failed

:deps_ok
echo.
echo Starte die App... Der Browser oeffnet sich gleich automatisch.
echo Zum Beenden dieses Fenster schliessen oder STRG+C druecken.
echo.
start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:5173"
call npm run dev
pause
exit /b 0

:install_failed
echo.
echo [FEHLER] Installation fehlgeschlagen. Internetverbindung pruefen.
pause
exit /b 1
