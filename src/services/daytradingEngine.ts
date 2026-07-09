import type { PricePoint, Asset, DecisionType } from '../types'

export interface IntrabarSignal {
  id: string
  timestamp: Date
  asset: Asset
  signalType: 'opening_range_breakout' | 'vwap_pullback' | 'momentum_breakout' | 'gap_and_go' | 'support_bounce' | 'breakout_failure'
  price: number
  confidence: number
  entry: number
  stop: number
  target: number
  riskReward: number
  recommendation: DecisionType
  reason: string
  isTooLate: boolean
  tooLateReason?: string
}

export interface DaytradesStats {
  openedAt: Date
  high: number
  low: number
  currentPrice: number
  gap: number
  gapPercent: number
  volume: number
  avgVolume: number
  volumeRatio: number
  hoursSincOpen: number
  priceMovement: number
  priceMovementPercent: number
  volatility: number
}

/**
 * Daytrading Engine für Intraday Analyse
 * Fokus: Kurze Zeitfenster (1min - 60min), heutiger Handelstag
 */
export class DaytradingEngine {
  /**
   * Analysiert aktuelle Intraday-Daten und identifiziert Daytrading-Setups
   */
  static analyzeIntraday(
    asset: Asset,
    priceHistory: PricePoint[],
    currentPrice: number,
    tradingMode: string
  ): IntrabarSignal[] {
    const signals: IntrabarSignal[] = []

    if (priceHistory.length < 5) {
      return signals // Nicht genug Daten
    }

    // Berechne Stats
    const stats = this.calculateDayStats(priceHistory, currentPrice)

    // Identifiziere verschiedene Signaltypen
    const orb = this.checkOpeningRangeBreakout(priceHistory, currentPrice)
    if (orb) signals.push(orb)

    const gag = this.checkGapAndGo(priceHistory, currentPrice, stats)
    if (gag) signals.push(gag)

    const vwap = this.checkVwapPullback(priceHistory, currentPrice)
    if (vwap) signals.push(vwap)

    const momentum = this.checkMomentumBreakout(priceHistory, currentPrice)
    if (momentum) signals.push(momentum)

    const support = this.checkSupportBounce(priceHistory, currentPrice)
    if (support) signals.push(support)

    // Prüfe auf FOMO-Warnung
    signals.forEach(signal => {
      const fomoCheck = this.checkFomoWarning(signal, currentPrice, priceHistory)
      if (fomoCheck.isTooLate) {
        signal.isTooLate = true
        signal.tooLateReason = fomoCheck.reason
        signal.recommendation = 'watch'
      }
    })

    return signals.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Opening Range Breakout (ORB)
   * Ideal für die erste Stunde nach Börseneröffnung
   */
  private static checkOpeningRangeBreakout(priceHistory: PricePoint[], currentPrice: number): IntrabarSignal | null {
    if (priceHistory.length < 15) return null // Braucht mind. 15 Min für ORB

    // Erste 15 Minuten = Opening Range
    const orStart = priceHistory.slice(0, 15)
    const orbHigh = Math.max(...orStart.map(p => p.high))
    const orbLow = Math.min(...orStart.map(p => p.low))
    const orbRange = orbHigh - orbLow

    if (orbRange === 0) return null

    // Prüfe Breakout nach oben
    if (currentPrice > orbHigh * 1.002) {
      const stopLevel = orbLow - orbRange * 0.1
      const target = orbHigh + orbRange * 2

      return {
        id: `signal_orb_${Date.now()}`,
        timestamp: new Date(),
        asset: {} as Asset,
        signalType: 'opening_range_breakout',
        price: currentPrice,
        confidence: 75,
        entry: orbHigh,
        stop: stopLevel,
        target: target,
        riskReward: (target - orbHigh) / (orbHigh - stopLevel),
        recommendation: 'buy_on_trigger',
        reason: `Ausbruch über Opening Range (${orbHigh.toFixed(2)}). Ziel: ${target.toFixed(2)}`,
        isTooLate: false
      }
    }

    return null
  }

  /**
   * Gap and Go - Kurs fällt/steigt zu Marktöffnung und läuft weiter
   */
  private static checkGapAndGo(priceHistory: PricePoint[], currentPrice: number, stats: DaytradesStats): IntrabarSignal | null {
    if (Math.abs(stats.gapPercent) < 0.5) return null // Gap muss mind. 0.5% sein

    const lastCandles = priceHistory.slice(-5)
    const closes = lastCandles.map(p => p.close)
    const avgClose = closes.reduce((a, b) => a + b) / closes.length

    // Prüfe ob Gap-Direction sich fortsetzt
    const isGapUp = stats.gap > 0
    const movingUp = closes.some(c => c > avgClose)
    const volumeStrong = stats.volumeRatio > 1.2

    if ((isGapUp && movingUp && volumeStrong) || (!isGapUp && !movingUp && volumeStrong)) {
      const target = currentPrice + (currentPrice * 0.02) // 2% Target
      const stop = stats.low - (currentPrice * 0.005) // Unter Low mit 0.5% Buffer

      return {
        id: `signal_gag_${Date.now()}`,
        timestamp: new Date(),
        asset: {} as Asset,
        signalType: 'gap_and_go',
        price: currentPrice,
        confidence: 70,
        entry: currentPrice,
        stop: stop,
        target: target,
        riskReward: (target - currentPrice) / (currentPrice - stop),
        recommendation: 'buy' ,
        reason: `Gap ${isGapUp ? 'up' : 'down'} ${stats.gapPercent.toFixed(2)}% mit Volumen Bestätigung`,
        isTooLate: false
      }
    }

    return null
  }

  /**
   * VWAP Pullback - Kurs zieht zurück zu VWAP und bounced ab
   */
  private static checkVwapPullback(priceHistory: PricePoint[], currentPrice: number): IntrabarSignal | null {
    if (priceHistory.length < 20) return null

    // Berechne VWAP
    const vwap = this.calculateVWAP(priceHistory)
    const distanceToVwap = Math.abs((currentPrice - vwap) / vwap) * 100

    // Wenn Kurs innerhalb 0.5% von VWAP
    if (distanceToVwap < 0.5 && currentPrice > vwap) {
      const lastCandles = priceHistory.slice(-5)
      const minLow = Math.min(...lastCandles.map(p => p.low))

      return {
        id: `signal_vwap_${Date.now()}`,
        timestamp: new Date(),
        asset: {} as Asset,
        signalType: 'vwap_pullback',
        price: currentPrice,
        confidence: 65,
        entry: currentPrice,
        stop: minLow - (currentPrice * 0.01),
        target: currentPrice * 1.015,
        riskReward: (currentPrice * 1.015 - currentPrice) / (currentPrice - (minLow - currentPrice * 0.01)),
        recommendation: 'buy_on_trigger',
        reason: `VWAP-Pullback Bounce. VWAP: ${vwap.toFixed(2)}`,
        isTooLate: false
      }
    }

    return null
  }

  /**
   * Momentum Breakout - Starker Kursanstieg mit hohem Volumen
   */
  private static checkMomentumBreakout(priceHistory: PricePoint[], currentPrice: number): IntrabarSignal | null {
    if (priceHistory.length < 10) return null

    const last5 = priceHistory.slice(-5)
    const avgVolume = priceHistory.slice(-20).reduce((sum, p) => sum + p.volume, 0) / 20
    const currentVolume = last5[last5.length - 1].volume

    // Volumen Spike
    if (currentVolume < avgVolume * 1.5) return null

    // Prüfe Momentum
    const closes = last5.map(p => p.close)
    const isMovingUp = closes[closes.length - 1] > closes[0]
    const momentumStrength = (closes[closes.length - 1] - closes[0]) / closes[0] * 100

    if (isMovingUp && momentumStrength > 0.5) {
      const highestHigh = Math.max(...last5.map(p => p.high))
      const lowestLow = Math.min(...last5.map(p => p.low))

      return {
        id: `signal_momentum_${Date.now()}`,
        timestamp: new Date(),
        asset: {} as Asset,
        signalType: 'momentum_breakout',
        price: currentPrice,
        confidence: 68,
        entry: currentPrice,
        stop: lowestLow - (currentPrice * 0.005),
        target: currentPrice * (1 + momentumStrength * 0.5 / 100),
        riskReward: (currentPrice * (1 + momentumStrength * 0.5 / 100) - currentPrice) / (currentPrice - (lowestLow - currentPrice * 0.005)),
        recommendation: 'buy',
        reason: `Momentum Ausbruch: +${momentumStrength.toFixed(2)}% mit ${(currentVolume / avgVolume).toFixed(1)}x Volumen`,
        isTooLate: false
      }
    }

    return null
  }

  /**
   * Support Bounce - Kurs testet Unterstützung und bounced ab
   */
  private static checkSupportBounce(priceHistory: PricePoint[], currentPrice: number): IntrabarSignal | null {
    if (priceHistory.length < 20) return null

    // Finde Support Level (lokales Tief)
    const last20 = priceHistory.slice(-20)
    const lows = last20.map(p => p.low)
    const minLow = Math.min(...lows)

    // Prüfe ob aktueller Kurs über Support und war nah dran
    const wasNearSupport = priceHistory.slice(-3).some(p => p.low < minLow * 1.002)
    const isAboveSupport = currentPrice > minLow * 1.003

    if (wasNearSupport && isAboveSupport) {
      const lastHigh = Math.max(...last20.map(p => p.high))

      return {
        id: `signal_support_${Date.now()}`,
        timestamp: new Date(),
        asset: {} as Asset,
        signalType: 'support_bounce',
        price: currentPrice,
        confidence: 62,
        entry: currentPrice,
        stop: minLow * 0.998,
        target: lastHigh,
        riskReward: (lastHigh - currentPrice) / (currentPrice - minLow * 0.998),
        recommendation: 'buy_on_trigger',
        reason: `Support Bounce von ${minLow.toFixed(2)}. Ziel: ${lastHigh.toFixed(2)}`,
        isTooLate: false
      }
    }

    return null
  }

  /**
   * FOMO-Warnung: Prüft ob Einstieg zu spät ist
   */
  private static checkFomoWarning(signal: IntrabarSignal, currentPrice: number, priceHistory: PricePoint[]): { isTooLate: boolean; reason?: string } {
    const distanceToEntry = Math.abs(currentPrice - signal.entry) / signal.entry * 100

    if (distanceToEntry > 1.5) {
      return {
        isTooLate: true,
        reason: `Signal verpasst: Kurs ${distanceToEntry.toFixed(2)}% vom idealen Entry entfernt`
      }
    }

    // Prüfe Stop-Distance
    const riskPercent = Math.abs(currentPrice - signal.stop) / currentPrice * 100
    if (riskPercent < 0.5) {
      return {
        isTooLate: true,
        reason: `Stop zu nah: Nur ${riskPercent.toFixed(2)}% Risiko (Minimum 0.5-1%)`
      }
    }

    // Prüfe letzte Kerze
    const lastCandle = priceHistory[priceHistory.length - 1]
    const kerzengröße = (lastCandle.high - lastCandle.low) / lastCandle.close * 100
    if (kerzengröße > 3) {
      return {
        isTooLate: true,
        reason: `Kerze zu groß: ${kerzengröße.toFixed(2)}% (Kein stabiler Einstieg)`
      }
    }

    return { isTooLate: false }
  }

  /**
   * Berechnet Tagesstatistiken
   */
  private static calculateDayStats(priceHistory: PricePoint[], currentPrice: number): DaytradesStats {
    const high = Math.max(...priceHistory.map(p => p.high))
    const low = Math.min(...priceHistory.map(p => p.low))
    const avgVolume = priceHistory.slice(-20).reduce((sum, p) => sum + p.volume, 0) / 20
    const currentVolume = priceHistory[priceHistory.length - 1].volume

    const openPrice = priceHistory[0].open
    const gap = currentPrice - openPrice
    const gapPercent = (gap / openPrice) * 100

    const volatility = ((high - low) / openPrice) * 100

    return {
      openedAt: priceHistory[0].timestamp,
      high,
      low,
      currentPrice,
      gap,
      gapPercent,
      volume: currentVolume,
      avgVolume,
      volumeRatio: currentVolume / avgVolume,
      hoursSincOpen: (Date.now() - priceHistory[0].timestamp.getTime()) / (1000 * 60 * 60),
      priceMovement: high - low,
      priceMovementPercent: ((high - low) / openPrice) * 100,
      volatility
    }
  }

  /**
   * Berechnet Volume Weighted Average Price (VWAP)
   */
  private static calculateVWAP(priceHistory: PricePoint[]): number {
    let totalVolume = 0
    let totalVolumePrice = 0

    priceHistory.forEach(candle => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3
      totalVolume += candle.volume
      totalVolumePrice += typicalPrice * candle.volume
    })

    return totalVolume > 0 ? totalVolumePrice / totalVolume : priceHistory[priceHistory.length - 1].close
  }

  /**
   * Prüft ob Markt überhaupt handelbbar ist (Datenqualität)
   */
  static isDataSufficientForDaytrading(priceHistory: PricePoint[]): { sufficient: boolean; reason?: string } {
    if (!priceHistory || priceHistory.length < 5) {
      return { sufficient: false, reason: 'Nicht genug Intraday-Daten' }
    }

    // Prüfe letzte Aktualisierung
    const lastUpdate = priceHistory[priceHistory.length - 1].timestamp
    const minutesSinceLastUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60)

    if (minutesSinceLastUpdate > 30) {
      return { sufficient: false, reason: 'Daten älter als 30 Minuten - nicht aktuell genug' }
    }

    return { sufficient: true }
  }
}

export default DaytradingEngine
