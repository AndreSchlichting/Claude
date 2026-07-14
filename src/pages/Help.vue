<template>
  <div class="space-y-3">
    <div class="card">
      <h1 class="text-xl font-bold mb-1">Hilfe &amp; Schnelleinstieg</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Was macht welche Seite - und in welcher Reihenfolge arbeitet ein Profi damit?
      </p>
    </div>

    <!-- Empfohlener Arbeitsablauf -->
    <div class="card border-l-4 border-primary">
      <h2 class="text-lg font-bold mb-3">Der tägliche Ablauf (empfohlen)</h2>
      <ol class="space-y-2 text-sm">
        <li v-for="(step, i) in workflow" :key="i" class="flex gap-3">
          <span class="shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{{ i + 1 }}</span>
          <span><b>{{ step.title }}:</b> {{ step.text }}</span>
        </li>
      </ol>
    </div>

    <!-- Seiten-Erklärungen -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="page in pages" :key="page.title" class="card">
        <h3 class="font-bold mb-1">{{ page.icon }} {{ page.title }}</h3>
        <p class="text-sm text-gray-700 dark:text-gray-300">{{ page.text }}</p>
      </div>
    </div>

    <!-- Grundsätze -->
    <div class="card">
      <h2 class="text-lg font-bold mb-3">Die 10 Grundsätze des Systems</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <p v-for="(g, i) in grundsaetze" :key="i">{{ i + 1 }}. {{ g }}</p>
      </div>
      <p class="text-sm font-bold mt-3 text-primary">Der Bot soll nicht überzeugen. Er soll prüfen.</p>
    </div>

    <!-- FAQ -->
    <div class="card">
      <h2 class="text-lg font-bold mb-3">Häufige Fragen</h2>
      <div class="space-y-3 text-sm">
        <div v-for="(faq, i) in faqs" :key="i">
          <p class="font-bold">{{ faq.q }}</p>
          <p class="text-gray-700 dark:text-gray-300">{{ faq.a }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const workflow = [
  { title: 'Marktlage prüfen', text: 'Dashboard: Marktampel (Risk-on/off?), Warnungen, Termine der nächsten Tage. Rot = heute eher kein Long-Tag.' },
  { title: 'Kandidaten finden', text: 'Modi → Pre-Market/Live-Scanner: Wo ist Bewegung und Volumen? Watchlist füllen.' },
  { title: 'Analysieren', text: 'Analyse-Seite: Marktstruktur, Zonen, Momentum. Nur handeln, wenn These + Beweise + akzeptable Gegenposition.' },
  { title: 'Signal & Größe', text: 'Daytrading: Signal prüfen (A/B/C-Setup), Positionsgröße rückwärts vom Risiko rechnen.' },
  { title: 'Order-Ticket', text: 'Checkliste durchgehen (Ausstiegsplan, CRV, Emotion). Erst dann bestätigen - oder bewusst verwerfen.' },
  { title: 'Journal führen', text: 'Jeden Trade mit Emotion und These eintragen. Beim Schließen: Plan befolgt? Was gelernt?' },
  { title: 'Positionen managen', text: 'Modi → Trade-Management/Exit: Stop nachziehen, Teilverkauf, oder laufen lassen - nach Regeln, nicht nach Gefühl.' },
  { title: 'Wöchentlich reviewen', text: 'Protokoll → Wochenreview + Journal-Statistik: Was kostet Geld? Welche Emotion? Welches Muster?' }
]

const pages = [
  { icon: '🏠', title: 'Dashboard', text: 'Überblick: Marktampel, Portfolio-Kennzahlen, Watchlist, Termine, TradingView-Signale, Warnungen.' },
  { icon: '⚡', title: 'Daytrading', text: 'Intraday-Signale (Ausbruch, Gap&Go, VWAP...) mit Entry/Stop/Ziel, Kerzenintervall 1-60 Min, Ansichtszeitraum, Datenstatus, Order-Ticket, Positionsrechner.' },
  { icon: '🎛️', title: 'Modi', text: 'Sechs Entscheidungsmodi: Pre-Market, Live-Scanner, Trade-Management, Exit, Risk-Off, News-Schock. Jeder beantwortet EINE klare Frage.' },
  { icon: '📊', title: 'Analyse', text: 'Profi-Analyse wie beim Analysten: Marktstruktur → Schlüsselzonen → Volumenprofil → Indikatoren. Mit These, Pro/Contra, Fallhöhe, Backtest und Lernhinweisen.' },
  { icon: '💼', title: 'Portfolio', text: 'Vier Portfolios (Echt/Test/Paper/Shadow), Verkauf mit Netto-Vorschau, Steuerstatus, Steuerreport-Export, Depotübertrag, CSV-Import, Tranchenplan, Klumpenrisiko-Check.' },
  { icon: '📓', title: 'Journal', text: 'Jeder Trade mit Einstiegsthese und Emotion. Statistik zeigt Trefferquote, Plantreue und die "teuerste Emotion". Erkennt Verhaltensmuster.' },
  { icon: '⏮️', title: 'Replay', text: 'Vergangene Kurse Kerze für Kerze nachspielen - ohne Zukunftswissen. Zeigt, welche Signale der Bot gesehen hätte und wie sie ausgingen. Lernen ohne Risiko.' },
  { icon: '📅', title: 'Kalender', text: 'Earnings, Fed/EZB, Makro-Termine. Wichtige Termine der nächsten 7 Tage erscheinen als Warnung - ein Termin in 3 Tagen ändert die Positionsgröße heute.' },
  { icon: '📜', title: 'Protokoll', text: 'Jedes Signal, jede Warnung, jeder Trade wird gespeichert. Wochenreview mit Fehlalarm-Quote. Falsche Alarme markierbar.' },
  { icon: '⚙️', title: 'Einstellungen', text: 'Risiko-Limits, Brutal-Modus, Warnschwellen, akustische Warnungen mit Testton, Gebührenprofile, deutsche Steuerlogik, BaFin-Watchlist, Daten-Backup.' }
]

const grundsaetze = [
  'Kapitalerhalt vor Rendite',
  'Begründung vor Signal',
  'Ausstieg vor Einstieg',
  'Risiko vor Gewinn',
  'Echtdaten vor Analyse',
  'Plausibilität vor Score',
  'Warnung vor Aktion',
  'Netto-Ergebnis vor Brutto-Gewinn',
  'Nicht-Handeln ist eine legitime Entscheidung',
  'Ein schlechter Trade darf nicht schön erklärt werden'
]

const faqs = [
  { q: 'Woher kommen die Kursdaten?', a: 'Krypto (BTC/ETH): live von der Binance Public API, ohne Anmeldung. Aktien/ETFs: Alpha Vantage - dafür kostenlosen Key auf alphavantage.co holen und in die Datei .env.local eintragen (VITE_ALPHA_VANTAGE_KEY=deinkey). Wechselkurs EUR/USD: EZB-Referenzkurs.' },
  { q: 'Gehen meine Daten beim Schließen verloren?', a: 'Nein. Portfolios, Journal, Protokoll und Einstellungen werden im Browser gespeichert. Zusätzlich: Einstellungen → Daten-Backup als JSON-Datei sichern.' },
  { q: 'Was bedeutet A/B/C-Setup?', a: 'A: Chance-Risiko ≥ 2:1 und Konfidenz ≥ 75% - volles Risikobudget. B: ≥ 1,5:1 und ≥ 60% - im Brutal-Modus nur halbes Risiko. C: alles darunter - im Brutal-Modus nur Paper Trading.' },
  { q: 'Warum blockiert die App meinen Trade?', a: 'Das Trade-Gate prüft hart: rote/schwarze Warnung, Chance-Risiko unter 1:1, Tagesverlustlimit, zu viele offene Trades, Risk-Off aktiv. Das ist kein Fehler - das ist der Kapitalschutz.' },
  { q: 'Wie starte ich die App?', a: 'Windows: Doppelklick auf Start.bat - sie richtet beim ersten Mal alles automatisch ein (inkl. Node.js). Desktop-Fenster: Start-Desktop.bat. Handy: Adresse im Browser öffnen → "Zum Startbildschirm hinzufügen".' },
  { q: 'Ist die Steuerberechnung verbindlich?', a: 'Nein - Näherungswerte nach deutscher Logik (Abgeltungsteuer, Soli, Krypto-Haltedauer §23 EStG). Keine Steuerberatung. Für die Steuererklärung zählen die Abrechnungen deines Brokers.' }
]
</script>
