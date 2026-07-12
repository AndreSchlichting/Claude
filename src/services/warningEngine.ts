import type { PricePoint, Asset, Position, WarningLevel } from '../types'

export type AlertSeverity = 'info' | 'achtung' | 'warnung' | 'alarm' | 'notfall'

export interface AcuteWarning {
  id: string
  timestamp: Date
  assetId: string
  assetSymbol: string
  severity: AlertSeverity
  type: string
  message: string
  detail: string
  action: string
  acknowledged: boolean
}

/**
 * Akutwarnsystem (Lastenheft 4, §125)
 * Erkennt starke Kursbewegungen, Stop-Nähe, Zielerreichung,
 * Volumen-Spikes und Datenfehler in Echtzeit.
 */
export class WarningEngine {
  private static audioContext: AudioContext | null = null

  /**
   * Prüft ein Asset auf akute Warnereignisse
   */
  static checkAsset(
    asset: Asset,
    priceHistory: PricePoint[],
    positions: Position[],
    thresholds = {
      strongMovePercent: 3.0,      // Kursbewegung in kurzer Zeit
      volumeSpikeRatio: 2.4,       // Volumen vs. Durchschnitt
      stopProximityPercent: 1.5,   // Abstand zum Stop
      gapPercent: 2.0,             // Gap-up/-down
      staleDataMinutes: 30         // Datenalter
    }
  ): AcuteWarning[] {
    const warnings: AcuteWarning[] = []

    if (!priceHistory || priceHistory.length < 5) {
      warnings.push(this.createWarning(asset, 'warnung', 'Datenfehler',
        'Zu wenig Kursdaten für Überwachung',
        `Nur ${priceHistory?.length || 0} Datenpunkte vorhanden`,
        'Datenquelle prüfen'))
      return warnings
    }

    // 1. Datenalter prüfen
    const lastPoint = priceHistory[priceHistory.length - 1]
    const dataAgeMin = (Date.now() - new Date(lastPoint.timestamp).getTime()) / 60000
    if (dataAgeMin > thresholds.staleDataMinutes && asset.assetClass === 'crypto') {
      warnings.push(this.createWarning(asset, 'warnung', 'Datenfehler',
        'Kursdaten veraltet',
        `Letzte Aktualisierung vor ${Math.round(dataAgeMin)} Minuten`,
        'Keine Signale auf Basis alter Daten handeln'))
    }

    // 2. Starke Kursbewegung (letzte 5 Kerzen)
    const recent = priceHistory.slice(-5)
    const moveStart = recent[0].close
    const movePercent = ((asset.currentPrice - moveStart) / moveStart) * 100
    if (Math.abs(movePercent) >= thresholds.strongMovePercent) {
      const hasPosition = positions.some(p => p.asset.id === asset.id)
      warnings.push(this.createWarning(
        asset,
        hasPosition ? 'alarm' : 'achtung',
        movePercent > 0 ? 'Starker Kursanstieg' : 'Starker Kursfall',
        `${asset.symbol} bewegt sich ${movePercent > 0 ? '+' : ''}${movePercent.toFixed(1)}% in kurzer Zeit`,
        hasPosition ? 'Offene Position betroffen!' : 'Keine offene Position',
        hasPosition ? 'Position sofort prüfen' : 'Beobachten'
      ))
    }

    // 3. Volumen-Spike
    const avgVolume = priceHistory.slice(-20).reduce((s, p) => s + p.volume, 0) / Math.min(20, priceHistory.length)
    const volumeRatio = lastPoint.volume / (avgVolume || 1)
    if (volumeRatio >= thresholds.volumeSpikeRatio) {
      warnings.push(this.createWarning(asset, 'achtung', 'Ungewöhnliches Volumen',
        `Volumen ${(volumeRatio * 100 - 100).toFixed(0)}% über Durchschnitt`,
        `Aktuell ${lastPoint.volume.toLocaleString('de-DE')} vs. Ø ${Math.round(avgVolume).toLocaleString('de-DE')}`,
        'Auf News und Ausbrüche achten'))
    }

    // 4. Gap-Erkennung
    if (priceHistory.length >= 2) {
      const prev = priceHistory[priceHistory.length - 2]
      const gapPercent = ((lastPoint.open - prev.close) / prev.close) * 100
      if (Math.abs(gapPercent) >= thresholds.gapPercent) {
        warnings.push(this.createWarning(asset, 'warnung',
          gapPercent > 0 ? 'Gap-up' : 'Gap-down',
          `Kurslücke von ${gapPercent.toFixed(1)}% erkannt`,
          `Von ${prev.close.toFixed(2)} auf ${lastPoint.open.toFixed(2)}`,
          'Gap-Fill-Risiko beachten, Stops prüfen'))
      }
    }

    // 5. Stop-Nähe & Zielerreichung für offene Positionen
    positions.filter(p => p.asset.id === asset.id).forEach(pos => {
      const stopDistance = ((asset.currentPrice - pos.stopLoss) / asset.currentPrice) * 100
      if (stopDistance > 0 && stopDistance <= thresholds.stopProximityPercent) {
        warnings.push(this.createWarning(asset, 'alarm', 'Stop-Nähe',
          `Kurs nur ${stopDistance.toFixed(1)}% über Stop (${pos.stopLoss.toFixed(2)})`,
          `Position: ${pos.quantity} Stück, Einstieg ${pos.buyPrice.toFixed(2)}`,
          'Position sofort prüfen: halten oder aussteigen'))
      }
      if (stopDistance <= 0) {
        warnings.push(this.createWarning(asset, 'notfall', 'Stop erreicht',
          `Kurs unter Stop-Level (${pos.stopLoss.toFixed(2)})`,
          `Aktuell: ${asset.currentPrice.toFixed(2)}`,
          'Ausstieg gemäß Plan umsetzen'))
      }
      if (asset.currentPrice >= pos.profitTarget) {
        warnings.push(this.createWarning(asset, 'alarm', 'Ziel erreicht',
          `Kursziel ${pos.profitTarget.toFixed(2)} erreicht`,
          `Unrealisierter Gewinn: ${((asset.currentPrice - pos.buyPrice) * pos.quantity).toFixed(2)}`,
          'Teilverkauf oder Stop nachziehen'))
      }
    })

    return warnings
  }

  private static createWarning(
    asset: Asset, severity: AlertSeverity, type: string,
    message: string, detail: string, action: string
  ): AcuteWarning {
    return {
      id: `warn_${asset.id}_${type.replace(/\s/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
      assetId: asset.id,
      assetSymbol: asset.symbol,
      severity, type, message, detail, action,
      acknowledged: false
    }
  }

  /**
   * Mappt Akut-Schweregrad auf Warnfarbe
   */
  static severityToLevel(severity: AlertSeverity): WarningLevel {
    const map: Record<AlertSeverity, WarningLevel> = {
      info: 'green', achtung: 'yellow', warnung: 'orange', alarm: 'red', notfall: 'black'
    }
    return map[severity]
  }

  /**
   * Akustische Warnung (Lastenheft 4, §125.4)
   * Web Audio API - unterschiedliche Töne je Warnstufe,
   * kein Daueralarm, Lautstärke einstellbar.
   */
  static playAlertSound(severity: AlertSeverity, volume: number = 50) {
    if (typeof window === 'undefined') return
    // Nur kritische Warnungen akustisch
    if (severity === 'info' || severity === 'achtung') return

    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext()
      }
      const ctx = this.audioContext
      const gain = ctx.createGain()
      gain.gain.value = Math.min(1, Math.max(0, volume / 100)) * 0.3
      gain.connect(ctx.destination)

      // Unterschiedliche Töne je Warnstufe
      const config: Record<string, { freq: number; beeps: number; dur: number }> = {
        warnung: { freq: 660, beeps: 1, dur: 0.25 },
        alarm: { freq: 880, beeps: 2, dur: 0.2 },
        notfall: { freq: 1100, beeps: 3, dur: 0.18 }
      }
      const c = config[severity]
      if (!c) return

      for (let i = 0; i < c.beeps; i++) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = c.freq
        osc.connect(gain)
        const start = ctx.currentTime + i * (c.dur + 0.12)
        osc.start(start)
        osc.stop(start + c.dur)
      }
    } catch {
      // Audio nicht verfügbar - visuell reicht
    }
  }

  /** Testton für Einstellungen */
  static playTestSound(volume: number) {
    this.playAlertSound('alarm', volume)
  }
}

export default WarningEngine
