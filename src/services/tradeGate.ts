import type { Analysis, Asset, Settings, WarningLevel } from '../types'

export type SetupGrade = 'A' | 'B' | 'C'

export interface TradePermission {
  allowed: boolean
  grade: SetupGrade
  liveTradingAllowed: boolean
  paperOnly: boolean
  riskFactor: number // Multiplikator für Positionsgröße (1.0 = volles Risiko)
  blockedReasons: string[]
  warnings: string[]
  decision: string
}

export interface RedFlagResult {
  level: WarningLevel
  flags: string[]
  verdict: 'ok' | 'vorsicht' | 'hohes_risiko' | 'finger_weg' | 'scam_verdacht'
  verdictText: string
}

/**
 * Trade Gate (Lastenheft 4, §127 Brutal-erfolgreich-Modus + §119 Finger-weg-Modul)
 *
 * Grundsätze:
 * - Kapitalerhalt vor Rendite
 * - Nicht-Handeln ist eine legitime Entscheidung
 * - Harte Sperre bei Rot/Schwarz
 * - Der Bot soll nicht überzeugen. Er soll prüfen.
 */
export class TradeGate {
  /**
   * Bewertet Setup-Qualität: A / B / C
   * A-Setup: CRV >= 2, Konfidenz >= 75, grüne Warnstufe
   * B-Setup: CRV >= 1.5, Konfidenz >= 60, max. gelbe Warnstufe
   * C-Setup: alles darunter
   */
  static gradeSetup(analysis: Analysis): SetupGrade {
    if (analysis.chanceRiskRatio >= 2 && analysis.confidence >= 75 && analysis.warningLevel === 'green') {
      return 'A'
    }
    if (analysis.chanceRiskRatio >= 1.5 && analysis.confidence >= 60 &&
        (analysis.warningLevel === 'green' || analysis.warningLevel === 'yellow')) {
      return 'B'
    }
    return 'C'
  }

  /**
   * Zentrale Freigabeprüfung vor jedem Trade.
   * Im Brutal-erfolgreich-Modus gelten strengere Regeln (§127.2).
   */
  static evaluate(
    analysis: Analysis,
    settings: Settings,
    context: {
      todayLoss: number          // realisierter Tagesverlust (positiv = Verlust)
      openTradesCount: number
      hasExitPlan: boolean
      hasNetCalculation: boolean
      dataQualityOk: boolean
    }
  ): TradePermission {
    const blockedReasons: string[] = []
    const warnings: string[] = []
    const grade = this.gradeSetup(analysis)
    const brutal = settings.brutalSuccessModeEnabled
    let riskFactor = 1.0
    let paperOnly = false

    // Harte Sperren (gelten IMMER, nicht nur im Brutal-Modus)
    if (analysis.warningLevel === 'red' || analysis.warningLevel === 'black') {
      blockedReasons.push(`Warnstufe ${analysis.warningLevel === 'red' ? 'ROT (Finger weg)' : 'SCHWARZ (Scam-Verdacht)'} - Live-Trading blockiert`)
    }
    if (analysis.chanceRiskRatio < 1) {
      blockedReasons.push(`Chance-Risiko ${analysis.chanceRiskRatio.toFixed(2)}:1 unter 1:1 - kein Trade`)
    }
    if (context.todayLoss >= settings.dailyLossLimit) {
      blockedReasons.push(`Tagesverlustlimit erreicht (${context.todayLoss.toFixed(2)} von ${settings.dailyLossLimit}) - Handelsstopp für heute`)
    }
    if (context.openTradesCount >= settings.maxOpenTrades) {
      blockedReasons.push(`Maximale Anzahl offener Trades erreicht (${settings.maxOpenTrades})`)
    }

    // Brutal-erfolgreich-Modus: strengere Regeln (§127.2)
    if (brutal) {
      if (!context.dataQualityOk) {
        blockedReasons.push('Brutal-Modus: Keine Trades bei unklarer Datenlage')
      }
      if (!context.hasExitPlan) {
        blockedReasons.push('Brutal-Modus: Kein Trade ohne Ausstiegsplan')
      }
      if (!context.hasNetCalculation) {
        blockedReasons.push('Brutal-Modus: Kein Trade ohne Netto-Berechnung')
      }
      if (analysis.counterArguments.length === 0) {
        blockedReasons.push('Brutal-Modus: Kein Trade ohne Pro-/Contra-Begründung')
      }

      // Setup-Klassen-Regeln
      if (grade === 'B') {
        riskFactor = 0.5
        warnings.push('B-Setup: Risiko auf 50% reduziert (Brutal-Modus)')
      }
      if (grade === 'C') {
        paperOnly = true
        warnings.push('C-Setup: Nur Paper Trading erlaubt (Brutal-Modus)')
      }
    } else {
      if (grade === 'C') {
        riskFactor = 0.5
        warnings.push('C-Setup: Reduziertes Risiko empfohlen')
      }
    }

    const allowed = blockedReasons.length === 0
    const liveTradingAllowed = allowed && !paperOnly

    let decision: string
    if (!allowed) {
      decision = 'Kein Trade. ' + blockedReasons[0]
    } else if (paperOnly) {
      decision = 'Nur Paper Trading freigegeben.'
    } else if (grade === 'A') {
      decision = 'A-Setup: Trade freigegeben mit vollem Risikobudget.'
    } else {
      decision = `${grade}-Setup: Trade freigegeben mit Risikofaktor ${riskFactor}.`
    }

    return { allowed, grade, liveTradingAllowed, paperOnly, riskFactor, blockedReasons, warnings, decision }
  }

  /**
   * Finger-weg-Modul (§119): Red-Flag-Prüfung für Assets.
   * Warnstufen: grün / gelb / orange / rot / schwarz.
   * "Scam bestätigt" nur mit belastbarer Quelle (z.B. BaFin-Warnung).
   */
  static assessAssetRisk(asset: Asset, metrics: {
    avgDailyVolume?: number      // Stück/Tag
    spreadPercent?: number
    hasFinancialData?: boolean
    isPennyStock?: boolean
    priceRunupWithoutNews?: boolean
    regulatoryWarning?: boolean  // BaFin/SEC-Warnung vorhanden (harte Quelle)
    contractVerified?: boolean   // nur Krypto
    liquidityLocked?: boolean    // nur Krypto
    hasAudit?: boolean           // nur Krypto
  }): RedFlagResult {
    const flags: string[] = []

    // Schwarz: nur mit belastbarer Quelle (§119.3)
    if (metrics.regulatoryWarning) {
      return {
        level: 'black',
        flags: ['Behördenwarnung vorhanden (BaFin/SEC)'],
        verdict: 'scam_verdacht',
        verdictText: 'Finger weg. Keine Analyse als Investment. Keine Trading-Freigabe.'
      }
    }

    // Aktien-Red-Flags (§119.4)
    if (asset.assetClass === 'stock' || asset.assetClass === 'etf') {
      if (metrics.avgDailyVolume !== undefined && metrics.avgDailyVolume < 10000) {
        flags.push('Extrem geringe Liquidität')
      }
      if (metrics.spreadPercent !== undefined && metrics.spreadPercent > 4) {
        flags.push(`Auffällig hoher Spread (${metrics.spreadPercent.toFixed(1)}%)`)
      }
      if (metrics.isPennyStock) {
        flags.push('Penny-Stock-Struktur')
      }
      if (metrics.hasFinancialData === false) {
        flags.push('Keine belastbaren Finanzdaten')
      }
      if (metrics.priceRunupWithoutNews) {
        flags.push('Auffälliger Kursanstieg ohne News (Pump-and-Dump-Muster möglich)')
      }
    }

    // Krypto-Red-Flags (§119.5)
    if (asset.assetClass === 'crypto') {
      if (metrics.contractVerified === false) {
        flags.push('Smart Contract nicht verifiziert')
      }
      if (metrics.liquidityLocked === false) {
        flags.push('Liquidität nicht gesperrt')
      }
      if (metrics.hasAudit === false) {
        flags.push('Kein Audit vorhanden')
      }
      if (metrics.priceRunupWithoutNews) {
        flags.push('Aggressiver Anstieg ohne fundamentalen Grund')
      }
    }

    // Bewertung nach Anzahl und Schwere der Flags
    let level: WarningLevel
    let verdict: RedFlagResult['verdict']
    let verdictText: string

    if (flags.length === 0) {
      level = 'green'; verdict = 'ok'
      verdictText = 'Keine auffälligen Warnsignale.'
    } else if (flags.length === 1) {
      level = 'yellow'; verdict = 'vorsicht'
      verdictText = 'Erhöhte Vorsicht: ein Warnsignal vorhanden.'
    } else if (flags.length === 2) {
      level = 'orange'; verdict = 'hohes_risiko'
      verdictText = 'Hohes Risiko: mehrere Warnsignale. Positionsgröße reduzieren oder verzichten.'
    } else {
      level = 'red'; verdict = 'finger_weg'
      verdictText = 'Finger weg: keine Trading-Freigabe, keine Aufnahme ins Live-Portfolio. Nur Beobachtung möglich.'
    }

    return { level, flags, verdict, verdictText }
  }
}

export default TradeGate
