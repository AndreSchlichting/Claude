# Trading Decision Lab - Brutal erfolgreich

Professionelle Trading-App mit **Analyse-Engine**, **Warnsystem**, **Gebühren-** und **Steuermodell** für erfolgreiche Entscheidungen.

## 🎯 Vision

Wir wollen nicht ausprobieren. Wir wollen **brutal erfolgreich** werden.
- Nicht durch Glück
- Nicht durch Hype
- Nicht durch blinde Signale
- Sondern durch: **Transparenz, Wissen, Risiko-Disziplin, echte Daten, klare Begründungen und harte Warnsysteme**

## ✨ Features

### Phase 1: Grundgerüst ✅
- ✅ Vue 3 + TypeScript + Tailwind CSS
- ✅ Pinia State Management
- ✅ Multi-Language (DE/EN)
- ✅ Währungsumschaltung (EUR/USD) mit Grafik-Anpassung
- ✅ Dark Mode
- ✅ Professionelle UI-Architektur

### Phase 2: Kernfunktionalität 🚀
- [ ] Asset-Management (echte API-Daten)
- [ ] Portfolio-Verwaltung (Real/Test/Paper)
- [ ] Analyse-Engine (Begründungslogik + Szenarien)
- [ ] Warnsystem (grün/gelb/orange/rot/schwarz)
- [ ] Gebühren-Profile + deutsche Steuerlogik
- [ ] Netto-Ergebnis Berechnungen

### Phase 3: Trading-Modi 
- [ ] Daytrading (1min-60min Kerzen)
- [ ] Swingtrading + Investment
- [ ] Live-Scanner + Risk-Off Modus
- [ ] Replay & Lern-Modus

### Phase 4: Brutale Qualität
- [ ] Brutal-erfolgreich-Modus
- [ ] Akutwarnsystem
- [ ] Shadow Portfolio
- [ ] Akustische Warnungen

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Öffne http://localhost:5173

## 📁 Struktur

```
src/
├── components/        # Wiederverwendbare UI-Komponenten
├── pages/            # Seiten der App
├── stores/           # Pinia State (zentrale Datenverwaltung)
├── services/         # API + Business Logic
│   ├── api.ts        # Asset-Daten Services
│   └── analysisEngine.ts  # Professionelle Analyse-Engine
├── types/            # TypeScript Definitionen
├── router/           # Navigation
├── styles/           # Tailwind CSS
└── main.ts           # App Start
```

## 🎓 Kernprinzipien

**Kapitalerhalt vor Rendite**
**Begründung vor Signal**
**Ausstieg vor Einstieg**
**Risiko vor Gewinn**
**Echtdaten vor Analyse**
**Plausibilität vor Score**
**Warnung vor Aktion**
**Netto-Ergebnis vor Brutto-Gewinn**

## 💡 Analyse-Engine

Jede Analyse enthält:
1. **Kernaussage** - Was ist die Idee?
2. **Handelsmodus** - Daytrading/Swing/Investment?
3. **Marktphase** - Wo stehen wir im Zyklus?
4. **Technische Ausgangslage** - Charts, Levels, Muster
5. **Fundamentale Lage** - Business, Gewinne, Bewertung
6. **Nachrichtenlage** - News, Events, Catalyst
7. **Einstiegsthese** - Warum könnte man einsteigen?
8. **Ausstiegsthese** - Wann muss man raus?
9. **Ungültigkeitsbedingung** - Wann ist die Idee falsch?
10. **Gegenargumente** - Was spricht dagegen?
11. **Chance-Risiko-Verhältnis** - Stop und Ziel klar?
12. **Konfidenz** - Wie sicher sind wir?
13. **Szenarien** - bullisch/neutral/bärisch/stress
14. **Warnungen** - Rote Flaggen erkennen
15. **Entscheidung** - buy/sell/halten/beobachten/finger weg

## ⚠️ Warnsystem

| Farbe | Bedeutung | Aktion |
|-------|-----------|--------|
| 🟢 Grün | Normale Lage | Trading erlaubt |
| 🟡 Gelb | Erhöhte Vorsicht | Kleinere Position |
| 🟠 Orange | Hohes Risiko | Nur bei Signal |
| 🔴 Rot | FINGER WEG | KEIN Live-Trading |
| ⚫ Schwarz | SCAM-VERDACHT | BLOCKIERT |

## 💰 Gebührenmodelle

Vordefiniert:
- **Trade Republic**: 1€ Buy/Sell
- **Interactive Brokers**: Prozentual (komplexer)
- **Kraken**: 0,26% - 0,16% (Volumen-abhängig)
- **Binance**: 0,1% Standard

## 🇩🇪 Deutsche Steuerlogik

- Kapitalertragsteuer: **26,375%**
- Solidaritätszuschlag: **5,5%**
- Sparer-Pauschbetrag: **1.000€**
- Krypto-Haltedauer: **365 Tage** → steuerfrei
- ETF-Teilfreistellung: **0-30%** (konfigurierbar)

## 📊 Szenarien (Pflicht in jeder Analyse)

Jede Analyse muss 5 Szenarien adressieren:

```
Bullisch:    Kurs bricht aus Richtung Ziel
Neutral:     Range-Bewegung, kein Trade
Bärisch:     Setup ungültig, Stop getroffen
Stress:      Markt-Schock, Gap-down
Ungültig:    Original-Bedingung verloren
```

## 🎯 Entscheidungslogik

```
Chance-Risiko > 2:0 && Konfidenz > 75%  → BUY
Chance-Risiko > 1,5 && Konfidenz > 70%  → BUY_ON_TRIGGER
Chance-Risiko < 1:1                      → FINGER_WEG
Konfidenz < 50%                          → WATCH
```

## 🔄 Trading-Modi Übersicht

### Daytrading
- Zeitraum: **Heute** (aktueller Handelstag)
- Kerzen: **1min bis 60min**
- Fokus: Intraday-Bewegungen, Eröffnungen, Gaps

### Swingtrading  
- Zeitraum: **1-2 Wochen**
- Kerzen: **4h bis 1 Tag**
- Fokus: Multi-Tage Trends, Support/Resistance

### Investment
- Zeitraum: **Monate bis Jahre**
- Kerzen: **1 Woche bis 1 Monat**
- Fokus: Fundamentals, Long-Term Trends

## 📝 Geplante APIs

- **Real-Time**: Alpha Vantage, IEX Cloud, Finnhub
- **Historisch**: Yahoo Finance, Polygon.io
- **Krypto**: Binance, Kraken, CoinGecko
- **News**: NewsAPI, IEX Cloud
- **FX**: OpenExchangeRates, XE.com
- **Fundamentals**: Alpha Vantage, Finnhub

## 🧪 Testing

```bash
npm run type-check
npm run build
```

## 👨‍💻 Autor

**André Schlichting** | Trading Decision Lab v0.1
Fokus: **Brutale Erfolgsrate statt blinde Signale**

Thema offen? Nächste Ausbaustufen:
- **0.4**: News-/Makro-Kalender
- **0.7**: TradingView-Webhooks  
- **3.0**: Broker-API mit manueller Bestätigung

---

**Leitmotto**: Der Bot soll nicht überzeugen. Er soll **prüfen.**
