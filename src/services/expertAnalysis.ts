import type { Asset, PricePoint } from '../types'
import { rsi, macd, bollinger, atr, ema, marketStructure, keyZones, volumeProfile, momentumPercent } from './indicators'
import type { MarketStructure, KeyZone, VolumeNode } from './indicators'

export interface IndicatorSnapshot {
  rsi14: number
  macdHistogram: number
  macdTrend: 'bullisch' | 'baerisch' | 'neutral'
  ema20: number
  ema50: number
  priceVsEma20: number  // % Abstand
  priceVsEma50: number
  bollingerPosition: 'oberes Band' | 'Mitte' | 'unteres Band'
  atr: number
  atrPercent: number
  momentum10: number
}

export interface ExpertAnalysisResult {
  asset: Asset
  timestamp: Date
  quality: 'hoch' | 'mittel' | 'niedrig'

  // Analyst-Framework (§118): These → Beweis → Gegenposition → Fallhöhe
  these: string
  beweise: string[]
  gegenposition: string[]
  fallhoehe: string

  structure: MarketStructure
  zones: KeyZone[]
  volumeNodes: VolumeNode[]
  indicators: IndicatorSnapshot

  mainReasonFor: string
  mainReasonAgainst: string
  decision: 'handeln' | 'warten' | 'beobachten' | 'finger_weg'
  decisionReason: string

  // Wissensmodus (§128): Lernhinweise zu den Entscheidungen
  lernhinweise: string[]
}

/**
 * Experten-Analyse-Modul (§118) im Stil professioneller Marktanalysten:
 * Erst die Marktstruktur, dann die Zonen, dann das Momentum -
 * der Indikator bestätigt, er entscheidet nicht.
 */
export class ExpertAnalysis {
  static analyze(asset: Asset, history: PricePoint[]): ExpertAnalysisResult | null {
    if (!history || history.length < 30) return null

    const closes = history.map(p => p.close)
    const currentPrice = asset.currentPrice || closes[closes.length - 1]

    // 1. Marktstruktur (das Fundament)
    const structure = marketStructure(history)

    // 2. Schlüsselzonen & Liquidität
    const zones = keyZones(history, currentPrice)
    const volumeNodes = volumeProfile(history)

    // 3. Indikatoren (Bestätigung, nicht Entscheidung)
    const rsiArr = rsi(closes)
    const rsi14 = rsiArr[rsiArr.length - 1] || 50
    const { histogram } = macd(closes)
    const macdHist = histogram[histogram.length - 1] || 0
    const macdPrev = histogram[histogram.length - 2] || 0
    const ema20Arr = ema(closes, 20)
    const ema50Arr = ema(closes, 50)
    const ema20 = ema20Arr[ema20Arr.length - 1]
    const ema50 = ema50Arr[ema50Arr.length - 1]
    const boll = bollinger(closes)
    const bollUpper = boll.upper[boll.upper.length - 1]
    const bollLower = boll.lower[boll.lower.length - 1]
    const atrValue = atr(history)
    const mom10 = momentumPercent(closes)

    const indicators: IndicatorSnapshot = {
      rsi14,
      macdHistogram: macdHist,
      macdTrend: macdHist > 0 && macdHist > macdPrev ? 'bullisch' : macdHist < 0 && macdHist < macdPrev ? 'baerisch' : 'neutral',
      ema20, ema50,
      priceVsEma20: ((currentPrice - ema20) / ema20) * 100,
      priceVsEma50: ((currentPrice - ema50) / ema50) * 100,
      bollingerPosition: currentPrice >= bollUpper * 0.99 ? 'oberes Band' : currentPrice <= bollLower * 1.01 ? 'unteres Band' : 'Mitte',
      atr: atrValue,
      atrPercent: (atrValue / currentPrice) * 100,
      momentum10: mom10
    }

    // 4. Beweise sammeln (Pro-Argumente)
    const beweise: string[] = []
    const gegenposition: string[] = []

    if (structure.trend === 'aufwaerts') {
      beweise.push(structure.description)
    } else if (structure.trend === 'abwaerts') {
      gegenposition.push(structure.description)
    }

    if (currentPrice > ema50 && ema20 > ema50) {
      beweise.push(`Kurs über EMA50 und EMA20 über EMA50 - übergeordneter Trend intakt (+${indicators.priceVsEma50.toFixed(1)}% über EMA50)`)
    } else if (currentPrice < ema50) {
      gegenposition.push(`Kurs unter EMA50 (${indicators.priceVsEma50.toFixed(1)}%) - kein bestätigter Aufwärtstrend`)
    }

    if (indicators.macdTrend === 'bullisch') {
      beweise.push('MACD-Histogramm positiv und steigend - Momentum bestätigt')
    } else if (indicators.macdTrend === 'baerisch') {
      gegenposition.push('MACD-Histogramm negativ und fallend - Momentum gegen die Long-Seite')
    }

    if (rsi14 > 70) {
      gegenposition.push(`RSI überkauft (${rsi14.toFixed(0)}) - später Einstieg mit schlechtem Chance-Risiko`)
    } else if (rsi14 < 30) {
      beweise.push(`RSI überverkauft (${rsi14.toFixed(0)}) - mögliche Erholung, aber nur mit Struktur-Bestätigung`)
    } else if (rsi14 >= 45 && rsi14 <= 65 && structure.trend === 'aufwaerts') {
      beweise.push(`RSI im gesunden Bereich (${rsi14.toFixed(0)}) - Trend nicht überhitzt`)
    }

    const nearSupport = zones.find(z => z.type === 'unterstuetzung' && Math.abs(z.distancePercent) < 2)
    const nearResistance = zones.find(z => z.type === 'widerstand' && Math.abs(z.distancePercent) < 2)
    if (nearSupport) {
      beweise.push(`Kurs nahe Unterstützungszone ${nearSupport.price.toFixed(2)} (${nearSupport.strength}x getestet) - technisch sinnvoller Stop möglich`)
    }
    if (nearResistance) {
      gegenposition.push(`Widerstand bei ${nearResistance.price.toFixed(2)} nur ${Math.abs(nearResistance.distancePercent).toFixed(1)}% entfernt - begrenzte Fallhöhe nach oben vor Ausbruch`)
    }

    if (indicators.atrPercent > 5) {
      gegenposition.push(`Hohe Volatilität (ATR ${indicators.atrPercent.toFixed(1)}%) - Positionsgröße reduzieren`)
    }

    // 5. Fallhöhe (Risiko nach unten)
    const nextSupport = zones.find(z => z.type === 'unterstuetzung')
    const fallhoehe = nextSupport
      ? `Nächste Unterstützung bei ${nextSupport.price.toFixed(2)} (${nextSupport.distancePercent.toFixed(1)}%). Darunter ${structure.lastSwingLow.toFixed(2)} (letztes Swing-Tief).`
      : `Keine klare Unterstützung im Analysebereich - Fallhöhe unklar, erhöhtes Risiko.`

    // 6. These formulieren
    let these: string
    if (structure.trend === 'aufwaerts' && beweise.length >= 2) {
      these = `${asset.symbol} in intakter Aufwärtsstruktur. Long-Setups an Unterstützungen oder nach Ausbruch über ${structure.lastSwingHigh.toFixed(2)} bevorzugt.`
    } else if (structure.trend === 'abwaerts') {
      these = `${asset.symbol} in Abwärtsstruktur. Keine Long-Trades gegen die Struktur - warten auf Bodenbildung und Strukturbruch nach oben.`
    } else {
      these = `${asset.symbol} ohne klare Richtung (Range). Nur Handel an den Range-Grenzen mit engem Risiko oder abwarten.`
    }

    // 7. Entscheidung
    const proCount = beweise.length
    const contraCount = gegenposition.length
    let decision: ExpertAnalysisResult['decision']
    let decisionReason: string

    if (structure.trend === 'abwaerts' && contraCount >= 3) {
      decision = 'finger_weg'
      decisionReason = 'Struktur, Momentum und Zonen sprechen gegen einen Einstieg. Nicht-Handeln ist hier die richtige Entscheidung.'
    } else if (proCount >= 3 && contraCount <= 1) {
      decision = 'handeln'
      decisionReason = 'Struktur, Zonen und Momentum bestätigen sich gegenseitig. Setup mit klarem Stop umsetzbar.'
    } else if (proCount >= 2) {
      decision = 'warten'
      decisionReason = 'Grundlage vorhanden, aber Bestätigung fehlt (Trigger abwarten: Ausbruch oder Zonen-Retest).'
    } else {
      decision = 'beobachten'
      decisionReason = 'Zu wenige Pro-Argumente. Auf Watchlist, kein aktives Setup.'
    }

    // 8. Analysequalität
    const quality: ExpertAnalysisResult['quality'] =
      history.length >= 100 ? 'hoch' : history.length >= 50 ? 'mittel' : 'niedrig'

    // 9. Lernhinweise (§128) - fachlich, nicht belehrend
    const lernhinweise: string[] = []
    if (rsi14 > 70) {
      lernhinweise.push('Ein hoher RSI allein ist kein Verkaufssignal - in starken Trends bleibt der RSI lange überkauft. Aber ein Einstieg JETZT hätte einen weit entfernten Stop und damit ein schlechtes Chance-Risiko-Verhältnis.')
    }
    if (structure.trend === 'aufwaerts' && nearResistance) {
      lernhinweise.push('Vor einem Widerstand einzusteigen heißt, das schlechteste Chance-Risiko der Bewegung zu akzeptieren. Profis warten auf den Ausbruch mit Volumen oder den Retest der Zone.')
    }
    if (structure.trend === 'abwaerts') {
      lernhinweise.push('Gegen die Marktstruktur zu handeln ist der häufigste Anfängerfehler. Ein billiger Kurs kann noch billiger werden - erst der Strukturbruch (höheres Hoch + höheres Tief) ändert das Bild.')
    }
    if (indicators.atrPercent > 5) {
      lernhinweise.push('Hohe Volatilität bedeutet: gleicher Stop-Abstand = größeres Risiko in Euro. Die Positionsgröße muss an die ATR angepasst werden, nicht umgekehrt.')
    }
    lernhinweise.push('Reihenfolge der Profi-Analyse: 1. Marktstruktur (Trend), 2. Schlüsselzonen (wo reagiert der Markt), 3. Volumen/Liquidität, 4. Momentum als Bestätigung. Indikatoren bestätigen - sie entscheiden nicht.')

    return {
      asset,
      timestamp: new Date(),
      quality,
      these,
      beweise: beweise.length ? beweise : ['Keine belastbaren Pro-Argumente gefunden'],
      gegenposition: gegenposition.length ? gegenposition : ['Keine wesentlichen Gegenargumente gefunden'],
      fallhoehe,
      structure,
      zones,
      volumeNodes,
      indicators,
      mainReasonFor: beweise[0] || 'Kein Hauptargument',
      mainReasonAgainst: gegenposition[0] || 'Kein wesentliches Gegenargument',
      decision,
      decisionReason,
      lernhinweise
    }
  }
}

export default ExpertAnalysis
