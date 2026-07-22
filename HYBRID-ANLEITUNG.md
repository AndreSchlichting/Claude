# Hybridversion - Desktop & Android

Die App ist **eine Codebasis mit drei Auslieferungen**:

| Variante | Technik | Ergebnis |
|----------|---------|----------|
| 🌐 Web / PWA | Vite + Service Worker | Im Browser, auf Handy/Desktop „installierbar" |
| 🖥️ Desktop | Electron | Echte Windows-EXE (auch Mac/Linux) |
| 📱 Android | Capacitor | Echte APK für den Play Store oder Direktinstallation |

Alle drei nutzen **denselben Vue-Code** - Features müssen nur einmal entwickelt werden.

---

## 🖥️ Desktop (Windows-EXE)

Voraussetzung: Node.js auf dem Rechner, Projekt entpackt/geklont, einmal `npm install`.

**Direkt starten (ohne Installer):**
```bash
npm run build      # baut die Web-Assets nach dist/
npm run desktop    # öffnet die App als Desktop-Fenster
```

**Windows-Installer (.exe) bauen:**
```bash
npm run dist:win
```
Ergebnis liegt danach in `release/`:
- `Trading Decision Lab Setup x.x.x.exe` (Installer)
- `Trading Decision Lab x.x.x.exe` (portable, ohne Installation lauffähig)

Mac: `npm run dist:mac` (DMG) • Linux: `npm run dist:linux` (AppImage)

**Entwicklung mit Live-Reload:**
```bash
npm run dev                # Terminal 1: Vite-Dev-Server
# Terminal 2 (Windows PowerShell):
$env:ELECTRON_START_URL="http://localhost:5173"; npx electron .
# Terminal 2 (Mac/Linux):
ELECTRON_START_URL=http://localhost:5173 npx electron .
```

---

## 📱 Android (APK)

Voraussetzung: [Android Studio](https://developer.android.com/studio) installiert.

**Einmalig einrichten:**
```bash
npm run android:init     # installiert @capacitor/android und legt android/ an
```

**Nach jeder Code-Änderung:**
```bash
npm run android:sync     # baut Web-Assets und kopiert sie ins Android-Projekt
npm run android:open     # öffnet das Projekt in Android Studio
```

In Android Studio dann: **Build → Build APK** (oder direkt aufs angeschlossene Handy ausführen).

---

## 🌐 Web / PWA (weiterhin enthalten)

```bash
npm run dev        # Entwicklung auf http://localhost:5173
npm run build      # Produktions-Build nach dist/ (auf jeden Webspace legbar)
```

Auf dem Handy im Browser öffnen → „Zum Startbildschirm hinzufügen" → läuft wie eine App.

---

## Technische Hinweise

- `vite.config.ts` nutzt `base: './'` (relative Pfade), damit derselbe Build
  in Browser, Electron (`file://`) und Capacitor funktioniert.
- Der Router erkennt die Hybrid-Umgebung automatisch und schaltet dort auf
  Hash-Navigation um (`/#/daytrading`), im Web bleiben saubere URLs.
- Kursdaten (Binance/Alpha Vantage) brauchen in allen Varianten Internet -
  gespeicherte Portfolios/Journal/Einstellungen (localStorage) funktionieren offline.
