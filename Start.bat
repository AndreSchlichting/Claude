@echo off
chcp 65001 >nul
title Trading Decision Lab
cd /d "%~dp0"

echo ============================================
echo   Trading Decision Lab - Web-Version
echo ============================================
echo.

REM Pruefen, ob Node.js installiert ist
where node >nul 2>nul
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert.
    echo Bitte von https://nodejs.org herunterladen und installieren,
    echo danach diese Datei erneut starten.
    echo.
    pause
    exit /b 1
)

REM Beim ersten Start: Abhaengigkeiten installieren
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

REM Browser oeffnen (kurz verzoegert, damit der Server schon laeuft)
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"

REM Dev-Server starten
call npm run dev
