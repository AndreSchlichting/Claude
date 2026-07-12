@echo off
chcp 65001 >nul
title Trading Decision Lab
cd /d "%~dp0"

echo ============================================
echo   Trading Decision Lab - Web-Version
echo ============================================
echo.

set "NODE_OK="

REM --- 1) Node.js im PATH? ---
node --version >nul 2>nul && set "NODE_OK=1"

REM --- 2) Typische Installationsorte pruefen ---
if not defined NODE_OK if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    set "NODE_OK=1"
)
if not defined NODE_OK if exist "%LocalAppData%\Programs\nodejs\node.exe" (
    set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
    set "NODE_OK=1"
)

REM --- 3) Portable Node im Projektordner (von frueherem Lauf)? ---
if not defined NODE_OK if exist "%~dp0runtime\node\node.exe" (
    set "PATH=%~dp0runtime\node;%PATH%"
    set "NODE_OK=1"
)

REM --- 4) Portable Node.js automatisch herunterladen (einmalig, ca. 30 MB) ---
if not defined NODE_OK (
    echo Node.js wurde auf diesem Rechner nicht gefunden.
    echo Lade portable Node.js herunter - das passiert nur einmal...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $v='v22.12.0'; $zip=Join-Path $env:TEMP 'node-portable.zip'; Invoke-WebRequest -Uri ('https://nodejs.org/dist/'+$v+'/node-'+$v+'-win-x64.zip') -OutFile $zip; if (Test-Path '.\runtime\node') { Remove-Item -Recurse -Force '.\runtime\node' }; Expand-Archive -Path $zip -DestinationPath '.\runtime' -Force; Rename-Item -Path ('.\runtime\node-'+$v+'-win-x64') -NewName 'node'; Remove-Item $zip"
    if exist "%~dp0runtime\node\node.exe" (
        set "PATH=%~dp0runtime\node;%PATH%"
        set "NODE_OK=1"
        echo Portable Node.js eingerichtet.
        echo.
    ) else (
        echo [FEHLER] Automatischer Download fehlgeschlagen.
        echo Bitte Internetverbindung pruefen oder Node.js manuell
        echo von https://nodejs.org installieren und erneut starten.
        echo.
        pause
        exit /b 1
    )
)

for /f "delims=" %%v in ('node --version') do echo Node.js gefunden: %%v
echo.

REM --- Beim ersten Start: Abhaengigkeiten installieren ---
if not exist node_modules (
    echo Erste Einrichtung: Abhaengigkeiten werden installiert...
    echo Das dauert nur beim ersten Mal ein paar Minuten.
    echo.
    call npm install
    if errorlevel 1 (
        echo [FEHLER] Installation fehlgeschlagen. Internetverbindung pruefen.
        pause
        exit /b 1
    )
)

echo Starte die App... Der Browser oeffnet sich gleich automatisch.
echo Zum Beenden dieses Fenster schliessen oder STRG+C druecken.
echo.

start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"

call npm run dev
pause
