import type { PricePoint } from '../types'

/**
 * Kerzenmuster-Datenbank (an TA-Lib Pattern Recognition angelehnt,
 * https://ta-lib.github.io/ta-lib-python/func_groups/pattern_recognition.html)
 *
 * Erweiterbar: neue Muster einfach ans PATTERNS-Array anhängen -
 * Training, Quiz und Chart-Erkennung nutzen sie automatisch.
 * Inhalte orientiert an klassischer Kerzenlehre (Nison) /
 * Börsenbibel Technische Analyse Band 1.
 */

export type PatternSignal = 'bullisch' | 'bearisch' | 'neutral'

export interface CandlePattern {
  id: string
  talibName: string
  name: string
  signal: PatternSignal
  candles: number
  reliability: 'hoch' | 'mittel' | 'niedrig'
  description: string     // Wie sieht das Muster aus?
  psychology: string      // Was passiert im Markt?
  expectation: string     // Was ist laut Theorie zu erwarten?
  tradingHint: string     // Wie ist das (Kauf-)Signal zu werten?
  sample: number[][]      // Beispielkerzen [open, high, low, close] für Schemabild
  detect: (c: PricePoint[], i: number) => boolean
}

// --- Hilfsfunktionen ---
const body = (k: PricePoint) => Math.abs(k.close - k.open)
const range = (k: PricePoint) => Math.max(k.high - k.low, 1e-9)
const upper = (k: PricePoint) => k.high - Math.max(k.open, k.close)
const lower = (k: PricePoint) => Math.min(k.open, k.close) - k.low
const green = (k: PricePoint) => k.close > k.open
const red = (k: PricePoint) => k.close < k.open
const downtrendBefore = (c: PricePoint[], i: number, n = 3) =>
  i >= n && c[i - n].close > c[i - 1].close
const uptrendBefore = (c: PricePoint[], i: number, n = 3) =>
  i >= n && c[i - n].close < c[i - 1].close

export const PATTERNS: CandlePattern[] = [
  {
    id: 'hammer', talibName: 'CDLHAMMER', name: 'Hammer', signal: 'bullisch', candles: 1, reliability: 'mittel',
    description: 'Kleiner Körper am oberen Ende, langer unterer Schatten (mind. 2x Körper), kaum oberer Schatten - nach einem Abwärtstrend.',
    psychology: 'Verkäufer drücken den Kurs stark nach unten, aber Käufer erobern das Terrain bis Handelsschluss fast vollständig zurück.',
    expectation: 'Mögliche Trendwende nach oben (Bodenbildung). Bestätigung: die Folgekerze schließt über dem Hammer-Hoch.',
    tradingHint: 'KEIN sofortiges Kaufsignal - erst die Bestätigungskerze abwarten. Stop unter dem Hammer-Tief. Ohne vorherigen Abwärtstrend bedeutungslos.',
    sample: [[100,101,99,99.5],[99.5,100,97.5,98],[98,98.5,96,96.5],[96.5,97,92.5,96.8],[97,99.5,96.8,99.2]],
    detect: (c, i) => {
      const k = c[i]
      return downtrendBefore(c, i) && lower(k) >= 2 * body(k) && upper(k) <= body(k) * 0.6 && body(k) > 0
    }
  },
  {
    id: 'hangingman', talibName: 'CDLHANGINGMAN', name: 'Hanging Man', signal: 'bearisch', candles: 1, reliability: 'niedrig',
    description: 'Gleiche Form wie der Hammer (langer unterer Schatten, kleiner Körper oben) - aber nach einem AUFWÄRTSTREND.',
    psychology: 'Erstmals treten im Aufwärtstrend massive Verkäufe auf. Die Käufer retten den Schluss, aber die Abgabebereitschaft ist ein Warnsignal.',
    expectation: 'Mögliche Trendwende nach unten. Bestätigung: rote Folgekerze mit Schluss unter dem Hanging-Man-Körper.',
    tradingHint: 'Warnsignal für bestehende Long-Positionen: Stop nachziehen. Neue Shorts erst nach Bestätigung - das Muster allein hat geringe Trefferquote.',
    sample: [[95,96.5,94.8,96.2],[96.2,97.8,96,97.5],[97.5,99,97.3,98.8],[98.8,99.2,95,98.9],[98.9,99,96.5,97]],
    detect: (c, i) => {
      const k = c[i]
      return uptrendBefore(c, i) && lower(k) >= 2 * body(k) && upper(k) <= body(k) * 0.6 && body(k) > 0
    }
  },
  {
    id: 'invertedhammer', talibName: 'CDLINVERTEDHAMMER', name: 'Inverted Hammer', signal: 'bullisch', candles: 1, reliability: 'niedrig',
    description: 'Kleiner Körper am unteren Ende, langer oberer Schatten - nach einem Abwärtstrend.',
    psychology: 'Käufer testen nach dem Abverkauf erstmals höhere Kurse. Der Vorstoß wird noch abverkauft, zeigt aber erwachendes Kaufinteresse.',
    expectation: 'Mögliche Bodenbildung. Deutlich schwächer als der Hammer - Bestätigung zwingend.',
    tradingHint: 'Nur ein Frühindikator. Kauf erst, wenn die Folgekerze grün schließt und das Hoch überwindet. Stop unter dem Tief des Musters.',
    sample: [[101,101.5,99.5,100],[100,100.3,98,98.4],[98.4,98.8,96.5,97],[97,99.8,96.8,97.2],[97.2,99,97,98.7]],
    detect: (c, i) => {
      const k = c[i]
      return downtrendBefore(c, i) && upper(k) >= 2 * body(k) && lower(k) <= body(k) * 0.6 && body(k) > 0
    }
  },
  {
    id: 'shootingstar', talibName: 'CDLSHOOTINGSTAR', name: 'Shooting Star', signal: 'bearisch', candles: 1, reliability: 'mittel',
    description: 'Kleiner Körper unten, langer oberer Schatten (mind. 2x Körper) - nach einem Aufwärtstrend.',
    psychology: 'Käufer treiben den Kurs auf neue Hochs, werden aber massiv abverkauft - die Rally scheitert innerhalb einer Kerze.',
    expectation: 'Mögliche Trendwende nach unten, besonders an Widerstandszonen.',
    tradingHint: 'Für Longs: Gewinne sichern oder Stop eng nachziehen. Short-Einstieg erst unter dem Tief der Shooting-Star-Kerze.',
    sample: [[95,96,94.8,95.8],[95.8,97,95.5,96.7],[96.7,98,96.5,97.8],[97.8,101,97.6,98.1],[98.1,98.3,96,96.4]],
    detect: (c, i) => {
      const k = c[i]
      return uptrendBefore(c, i) && upper(k) >= 2 * body(k) && lower(k) <= body(k) * 0.6 && body(k) > 0
    }
  },
  {
    id: 'doji', talibName: 'CDLDOJI', name: 'Doji', signal: 'neutral', candles: 1, reliability: 'mittel',
    description: 'Eröffnung und Schluss liegen fast gleichauf - der Körper ist winzig, die Schatten können lang sein.',
    psychology: 'Perfektes Gleichgewicht: Weder Käufer noch Verkäufer setzen sich durch. Unentschlossenheit.',
    expectation: 'Allein richtungslos. Nach langem Trend: mögliches Erschöpfungssignal. An Unterstützung/Widerstand besonders beachtenswert.',
    tradingHint: 'Nie allein handeln! Ein Doji ist eine Frage, keine Antwort - die Folgekerze gibt die Richtung. In Seitwärtsphasen bedeutungslos.',
    sample: [[97,98.5,96.8,98.2],[98.2,99.5,98,99.2],[99.2,100.8,98.2,99.25],[99.25,100,98.5,99.5]],
    detect: (_c, i) => {
      return true && body(_c[i]) <= range(_c[i]) * 0.08
    }
  },
  {
    id: 'bullishengulfing', talibName: 'CDLENGULFING', name: 'Bullish Engulfing', signal: 'bullisch', candles: 2, reliability: 'hoch',
    description: 'Eine kleine rote Kerze wird von einer großen grünen Kerze komplett umschlossen (Körper zu Körper) - im Abwärtstrend.',
    psychology: 'Die Käufer übernehmen mit Macht: Sie kaufen nicht nur die Verluste des Vortags zurück, sondern treiben darüber hinaus.',
    expectation: 'Starkes Umkehrsignal am Ende eines Abwärtstrends - eines der zuverlässigsten Kerzenmuster.',
    tradingHint: 'Kaufsignal mit guter Trefferquote, wenn (1) klarer Abwärtstrend davor, (2) hohe grüne Kerze mit Volumen. Stop unter dem Tief der Engulfing-Kerze.',
    sample: [[101,101.5,99.5,100],[100,100.5,98,98.5],[98.5,99,96.8,97.2],[96.9,99.8,96.5,99.5],[99.5,101,99.2,100.6]],
    detect: (c, i) => {
      if (i < 1) return false
      const p = c[i - 1], k = c[i]
      return downtrendBefore(c, i, 2) && red(p) && green(k) &&
        k.open <= p.close && k.close >= p.open && body(k) > body(p) * 1.2
    }
  },
  {
    id: 'bearishengulfing', talibName: 'CDLENGULFING', name: 'Bearish Engulfing', signal: 'bearisch', candles: 2, reliability: 'hoch',
    description: 'Eine kleine grüne Kerze wird von einer großen roten Kerze komplett umschlossen - im Aufwärtstrend.',
    psychology: 'Die Verkäufer drehen den Markt: Alle Käufer des Vortags sind sofort im Minus.',
    expectation: 'Starkes Umkehrsignal am Ende eines Aufwärtstrends.',
    tradingHint: 'Für Longs: Ausstieg oder Stop unter das Muster-Tief. Short-Signal mit Bestätigung; Ziel: nächste Unterstützung.',
    sample: [[95,96,94.8,95.8],[95.8,97,95.5,96.7],[96.7,98,96.5,97.7],[98,98.4,95.5,95.8],[95.8,96,94,94.5]],
    detect: (c, i) => {
      if (i < 1) return false
      const p = c[i - 1], k = c[i]
      return uptrendBefore(c, i, 2) && green(p) && red(k) &&
        k.open >= p.close && k.close <= p.open && body(k) > body(p) * 1.2
    }
  },
  {
    id: 'bullishharami', talibName: 'CDLHARAMI', name: 'Bullish Harami', signal: 'bullisch', candles: 2, reliability: 'niedrig',
    description: 'Nach einer großen roten Kerze folgt eine kleine Kerze, deren Körper KOMPLETT im Körper der roten liegt („schwangere Kerze").',
    psychology: 'Der Verkaufsdruck versiegt abrupt - der Markt kommt zur Ruhe. Erste Stabilisierung.',
    expectation: 'Abschwächung des Abwärtstrends, mögliche Wende - aber schwächer als Engulfing.',
    tradingHint: 'Nur Beobachtungssignal. Kauf frühestens, wenn die dritte Kerze über dem Harami-Hoch schließt.',
    sample: [[102,102.5,100,100.4],[100.4,100.8,98,98.3],[98.3,98.6,95.5,95.9],[96.8,97.6,96.5,97.3],[97.3,98.8,97.1,98.5]],
    detect: (c, i) => {
      if (i < 1) return false
      const p = c[i - 1], k = c[i]
      return downtrendBefore(c, i, 2) && red(p) && body(p) > range(p) * 0.5 &&
        Math.max(k.open, k.close) < p.open && Math.min(k.open, k.close) > p.close
    }
  },
  {
    id: 'bearishharami', talibName: 'CDLHARAMI', name: 'Bearish Harami', signal: 'bearisch', candles: 2, reliability: 'niedrig',
    description: 'Nach einer großen grünen Kerze folgt eine kleine Kerze komplett innerhalb ihres Körpers - im Aufwärtstrend.',
    psychology: 'Die Kaufdynamik bricht ab; der Schwung ist raus.',
    expectation: 'Abschwächung des Aufwärtstrends, mögliche Konsolidierung oder Wende.',
    tradingHint: 'Warnsignal: Stops nachziehen. Kein eigenständiges Short-Signal.',
    sample: [[94,95,93.8,94.8],[94.8,96.2,94.6,96],[96,98.5,95.8,98.2],[97.4,97.8,96.8,97],[97,97.2,95.8,96.1]],
    detect: (c, i) => {
      if (i < 1) return false
      const p = c[i - 1], k = c[i]
      return uptrendBefore(c, i, 2) && green(p) && body(p) > range(p) * 0.5 &&
        Math.max(k.open, k.close) < p.close && Math.min(k.open, k.close) > p.open
    }
  },
  {
    id: 'piercing', talibName: 'CDLPIERCING', name: 'Piercing Line', signal: 'bullisch', candles: 2, reliability: 'mittel',
    description: 'Rote Kerze, dann grüne Kerze, die UNTER dem Vortagestief eröffnet und über der Mitte des roten Körpers schließt.',
    psychology: 'Panik-Eröffnung nach unten wird komplett gekauft - die Käufer erobern mehr als die Hälfte des Verlusts zurück.',
    expectation: 'Bullisches Umkehrsignal im Abwärtstrend; je höher der Schluss in der roten Kerze, desto stärker.',
    tradingHint: 'Kaufsignal nach Bestätigung. Schließt die grüne Kerze sogar ÜBER dem roten Körper, ist es ein Bullish Engulfing (stärker).',
    sample: [[102,102.4,100.2,100.5],[100.5,101,98.4,98.8],[98.8,99,96,96.4],[95.5,98.4,95.2,98.1],[98.1,99.6,97.9,99.3]],
    detect: (c, i) => {
      if (i < 1) return false
      const p = c[i - 1], k = c[i]
      const mid = (p.open + p.close) / 2
      return downtrendBefore(c, i, 2) && red(p) && green(k) &&
        k.open < p.close && k.close > mid && k.close < p.open
    }
  },
  {
    id: 'darkcloud', talibName: 'CDLDARKCLOUDCOVER', name: 'Dark Cloud Cover', signal: 'bearisch', candles: 2, reliability: 'mittel',
    description: 'Grüne Kerze, dann rote Kerze, die ÜBER dem Vortageshoch eröffnet und unter der Mitte des grünen Körpers schließt.',
    psychology: 'Euphorische Eröffnung wird abverkauft - die „dunkle Wolke" legt sich über die Rally.',
    expectation: 'Bearisches Umkehrsignal im Aufwärtstrend.',
    tradingHint: 'Longs absichern. Short erst unter dem Tief der roten Kerze.',
    sample: [[94,94.5,93.5,94.3],[94.3,95.8,94.1,95.5],[95.5,97.6,95.3,97.4],[98.2,98.6,95.9,96.2],[96.2,96.4,94.8,95.1]],
    detect: (c, i) => {
      if (i < 1) return false
      const p = c[i - 1], k = c[i]
      const mid = (p.open + p.close) / 2
      return uptrendBefore(c, i, 2) && green(p) && red(k) &&
        k.open > p.close && k.close < mid && k.close > p.open
    }
  },
  {
    id: 'morningstar', talibName: 'CDLMORNINGSTAR', name: 'Morning Star', signal: 'bullisch', candles: 3, reliability: 'hoch',
    description: 'Drei Kerzen: große rote, kleine Kerze (Stern, oft mit Lücke), große grüne, die tief in den roten Körper schließt.',
    psychology: 'Abverkauf → Stillstand → Übernahme durch die Käufer. Der „Morgenstern" kündigt den neuen Tag an.',
    expectation: 'Eines der stärksten Bodenbildungs-Muster, besonders an markanten Unterstützungen.',
    tradingHint: 'Kaufsignal nach Abschluss der dritten Kerze. Stop unter das Tief des Sterns. Je kleiner der Stern und je tiefer der Schluss der dritten Kerze im roten Körper, desto besser.',
    sample: [[103,103.4,100.5,100.8],[100.8,101,97.5,97.9],[97.2,97.8,96.4,96.9],[97.5,101.4,97.3,101],[101,102.6,100.8,102.2]],
    detect: (c, i) => {
      if (i < 2) return false
      const a = c[i - 2], b = c[i - 1], k = c[i]
      return downtrendBefore(c, i, 3) && red(a) && body(a) > range(a) * 0.5 &&
        body(b) < body(a) * 0.4 && green(k) && k.close > (a.open + a.close) / 2
    }
  },
  {
    id: 'eveningstar', talibName: 'CDLEVENINGSTAR', name: 'Evening Star', signal: 'bearisch', candles: 3, reliability: 'hoch',
    description: 'Drei Kerzen: große grüne, kleiner Stern oben, große rote, die tief in den grünen Körper schließt.',
    psychology: 'Rally → Erschöpfung am Hoch → Verkäufer übernehmen. Der „Abendstern" kündigt die Nacht an.',
    expectation: 'Starkes Topbildungs-Muster, besonders an Widerständen.',
    tradingHint: 'Für Longs klares Ausstiegs-/Absicherungssignal. Short nach Abschluss der dritten Kerze, Stop über dem Stern-Hoch.',
    sample: [[94,94.6,93.6,94.4],[94.4,97.2,94.2,97],[97.6,98.6,97.3,98.2],[97.8,98,94.9,95.3],[95.3,95.5,93.6,94]],
    detect: (c, i) => {
      if (i < 2) return false
      const a = c[i - 2], b = c[i - 1], k = c[i]
      return uptrendBefore(c, i, 3) && green(a) && body(a) > range(a) * 0.5 &&
        body(b) < body(a) * 0.4 && red(k) && k.close < (a.open + a.close) / 2
    }
  },
  {
    id: 'threewhitesoldiers', talibName: 'CDL3WHITESOLDIERS', name: 'Three White Soldiers', signal: 'bullisch', candles: 3, reliability: 'hoch',
    description: 'Drei große grüne Kerzen in Folge, jede eröffnet im Körper der vorigen und schließt nahe ihrem Hoch.',
    psychology: 'Stetiger, kontrollierter Kaufdruck über drei Perioden - keine Panik, sondern Stärke.',
    expectation: 'Trendwende nach oben bzw. starke Fortsetzung. Vorsicht, wenn die Kerzen immer kleiner werden (Erschöpfung).',
    tradingHint: 'Nach drei Soldaten ist der Einstieg oft schon spät (FOMO-Gefahr!) - besser den ersten Rücksetzer in Richtung der Bewegung kaufen.',
    sample: [[100,100.4,97.9,98.2],[97.9,99.9,97.7,99.6],[99.2,101.5,99,101.2],[100.8,103,100.6,102.7],[102.4,104.5,102.2,104.2]],
    detect: (c, i) => {
      if (i < 2) return false
      const a = c[i - 2], b = c[i - 1], k = c[i]
      const strong = (x: PricePoint) => green(x) && body(x) > range(x) * 0.6
      return strong(a) && strong(b) && strong(k) &&
        b.close > a.close && k.close > b.close &&
        b.open > a.open && k.open > b.open
    }
  },
  {
    id: 'threeblackcrows', talibName: 'CDL3BLACKCROWS', name: 'Three Black Crows', signal: 'bearisch', candles: 3, reliability: 'hoch',
    description: 'Drei große rote Kerzen in Folge, jede eröffnet im Körper der vorigen und schließt nahe ihrem Tief.',
    psychology: 'Anhaltender, kontrollierter Verkaufsdruck - die „drei schwarzen Krähen" sitzen auf dem toten Baum.',
    expectation: 'Trendwende nach unten bzw. starke Abwärts-Fortsetzung.',
    tradingHint: 'Bestehende Longs spätestens jetzt absichern. Nicht in fallende Messer kaufen - auf Stabilisierung warten.',
    sample: [[98,100.2,97.8,100],[100.3,100.5,98.1,98.4],[98.7,98.9,96.5,96.8],[97.1,97.3,94.9,95.2],[95.4,95.6,93.3,93.6]],
    detect: (c, i) => {
      if (i < 2) return false
      const a = c[i - 2], b = c[i - 1], k = c[i]
      const strong = (x: PricePoint) => red(x) && body(x) > range(x) * 0.6
      return strong(a) && strong(b) && strong(k) &&
        b.close < a.close && k.close < b.close
    }
  },
  {
    id: 'bullishmarubozu', talibName: 'CDLMARUBOZU', name: 'Bullish Marubozu', signal: 'bullisch', candles: 1, reliability: 'mittel',
    description: 'Große grüne Kerze praktisch ohne Schatten: Eröffnung am Tief, Schluss am Hoch.',
    psychology: 'Die Käufer dominieren vom ersten bis zum letzten Moment - maximale Stärke in einer Kerze.',
    expectation: 'Fortsetzung in Kerzenrichtung wahrscheinlich; als Ausbruchskerze über Widerstände besonders wertvoll.',
    tradingHint: 'Stark als Bestätigung eines Ausbruchs (mit Volumen!). Direkt nach großem Marubozu einzusteigen heißt aber: weiter Stop = schlechtes CRV.',
    sample: [[98,98.6,97.5,98.3],[98.3,98.9,97.9,98.6],[98.6,102.6,98.55,102.55],[102.5,103.8,102.2,103.4]],
    detect: (c, i) => {
      const k = c[i]
      return green(k) && body(k) >= range(k) * 0.93 && body(k) > 0
    }
  },
  {
    id: 'bearishmarubozu', talibName: 'CDLMARUBOZU', name: 'Bearish Marubozu', signal: 'bearisch', candles: 1, reliability: 'mittel',
    description: 'Große rote Kerze ohne Schatten: Eröffnung am Hoch, Schluss am Tief.',
    psychology: 'Die Verkäufer kontrollieren die komplette Periode.',
    expectation: 'Fortsetzung nach unten wahrscheinlich; als Bruchkerze unter Unterstützungen besonders relevant.',
    tradingHint: 'Warnung für Longs. Nach Bruch einer Unterstützung mit Marubozu: kein „Schnäppchenkauf" - der Markt zeigt seine Richtung.',
    sample: [[101,101.6,100.5,101.3],[101.3,101.9,100.9,101.6],[101.6,101.65,97.6,97.65],[97.6,98,96.4,96.8]],
    detect: (c, i) => {
      const k = c[i]
      return red(k) && body(k) >= range(k) * 0.93 && body(k) > 0
    }
  },
  {
    id: 'spinningtop', talibName: 'CDLSPINNINGTOP', name: 'Spinning Top', signal: 'neutral', candles: 1, reliability: 'niedrig',
    description: 'Kleiner Körper in der Mitte, deutliche Schatten auf BEIDEN Seiten - der „Kreisel".',
    psychology: 'Beide Seiten kämpfen, keine gewinnt. Volatile Unentschlossenheit.',
    expectation: 'Pause im Trend. Häufung von Spinning Tops nach starkem Trend = mögliche Erschöpfung.',
    tradingHint: 'Kein Handelssignal. In engen Ranges normal; nach langen Trends wachsam werden und Stops prüfen.',
    sample: [[97,98.2,96.8,97.9],[97.9,99.1,97.7,98.8],[98.8,100.3,97.3,99.1],[99.1,100,98.4,99.4]],
    detect: (c, i) => {
      const k = c[i]
      return body(k) > range(k) * 0.1 && body(k) < range(k) * 0.35 &&
        upper(k) > body(k) && lower(k) > body(k)
    }
  }
]

export interface PatternMatch {
  index: number          // Index der letzten Kerze des Musters
  pattern: CandlePattern
}

/**
 * Scannt eine Kurshistorie nach allen Mustern der Datenbank.
 * Pro Kerze wird maximal das "stärkste" Muster gemeldet
 * (mehr Kerzen > weniger Kerzen), um Marker-Spam zu vermeiden.
 */
export function scanPatterns(history: PricePoint[], maxLookback = 120): PatternMatch[] {
  const matches: PatternMatch[] = []
  const start = Math.max(3, history.length - maxLookback)

  for (let i = start; i < history.length; i++) {
    let best: CandlePattern | null = null
    for (const p of PATTERNS) {
      try {
        if (p.detect(history, i)) {
          if (!best || p.candles > best.candles ||
              (p.candles === best.candles && p.reliability === 'hoch' && best.reliability !== 'hoch')) {
            best = p
          }
        }
      } catch { /* defekte Kerze überspringen */ }
    }
    if (best) matches.push({ index: i, pattern: best })
  }
  return matches
}

export function getPattern(id: string): CandlePattern | undefined {
  return PATTERNS.find(p => p.id === id)
}
