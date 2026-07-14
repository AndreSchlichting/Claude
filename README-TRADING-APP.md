# Trading Decision Lab v0.9

Professionelles Trading-Entscheidungszentrum - **brutal ehrlich, mit echten Daten**.
Eine Codebasis, drei Auslieferungen: Web/PWA, Desktop (Electron), Android (Capacitor).

## Schnellstart

**Windows:** Doppelklick auf `Start.bat` - richtet beim ersten Mal alles automatisch ein
(lädt bei Bedarf portable Node.js herunter), öffnet dann den Browser.

**Desktop-Fenster:** `Start-Desktop.bat` • **Mac/Linux:** `./start.sh`

Details: `HYBRID-ANLEITUNG.md` (EXE/APK bauen) und `WEBHOOKS-ANLEITUNG.md` (TradingView).

## Seiten

| Seite | Funktion |
|-------|----------|
| Dashboard | Marktampel, Kennzahlen, Watchlist, Termine, TradingView-Signale, Warnungen |
| Daytrading | Intraday-Signale, Kerzenintervalle 1-60 Min, Ansichtszeitraum, Datenstatus, Order-Ticket, Positionsrechner |
| Modi | Pre-Market, Live-Scanner, Trade-Management, Exit, Risk-Off, News-Schock |
| Analyse | Marktstruktur, S/R-Zonen, Volumenprofil, RSI/MACD/EMA/ATR, Backtest, Lernhinweise |
| Portfolio | Echt/Test/Paper/Shadow, Netto-Verkauf, Steuerreport, Depotübertrag, CSV-Import, Tranchenplan |
| Journal | Trades mit Emotion & These, Trefferquote, Plantreue, Verhaltensmuster |
| Replay | Kurse Kerze für Kerze nachspielen, Signal-Tracking mit Ausgang |
| Kalender | Earnings/Fed/EZB-Termine mit Countdown und 7-Tage-Warnung |
| Protokoll | Alle Ereignisse, Wochenreview, Fehlalarm-Markierung |
| Hilfe | Arbeitsablauf, Seiten-Erklärungen, FAQ |
| Einstellungen | Risiko, Brutal-Modus, Warnschwellen, Gebühren, Steuern (DE), BaFin-Liste, Backup |

## Datenquellen (echt, kein Demo-Zwang)

- **Krypto** (BTC/ETH): Binance Public API - live, 24/7, kein Key nötig
- **Aktien/ETFs**: Alpha Vantage - kostenlosen Key auf alphavantage.co holen,
  in `.env.local` eintragen: `VITE_ALPHA_VANTAGE_KEY=deinkey`
- **EUR/USD**: EZB-Referenzkurs via frankfurter.app
- Fallback auf Demo-Daten nur, wenn keine API erreichbar ist

## Kernprinzipien

Kapitalerhalt vor Rendite • Begründung vor Signal • Ausstieg vor Einstieg •
Netto-Ergebnis vor Brutto-Gewinn • Nicht-Handeln ist eine legitime Entscheidung.

**Der Bot soll nicht überzeugen. Er soll prüfen.**

## Entwicklung

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Produktions-Build nach dist/
npm run type-check   # TypeScript pruefen
npm run webhooks     # TradingView-Webhook-Server (Port 3777)
npm run desktop      # Electron-Fenster (nach build)
npm run dist:win     # Windows-Installer bauen
```

## Hinweis

Keine Anlage- oder Steuerberatung. Steuerwerte sind Näherungen nach deutscher
Logik (§32d/§20/§23 EStG); verbindlich sind die Abrechnungen des Brokers.
