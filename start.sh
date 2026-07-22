#!/usr/bin/env bash
# Trading Decision Lab - Start-Skript für Mac/Linux
# Nutzung: ./start.sh  (einmalig vorher: chmod +x start.sh)
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  Trading Decision Lab"
echo "============================================"

if ! command -v node >/dev/null 2>&1; then
  echo "[FEHLER] Node.js ist nicht installiert: https://nodejs.org"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Erste Einrichtung: Abhängigkeiten werden installiert..."
  npm install
fi

echo "Starte die App... Browser öffnet sich gleich (http://localhost:5173)"
( sleep 4 && (xdg-open http://localhost:5173 2>/dev/null || open http://localhost:5173 2>/dev/null) ) &

npm run dev
