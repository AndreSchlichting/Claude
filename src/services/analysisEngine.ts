import type { Analysis, Asset, Scenario, WarningLevel, DecisionType } from '../types'

export interface AnalysisInput {
  assetId: string
  symbol: string
  currentPrice: number
  thesisTitle: string
  marketPhase: string
  technicalOutlook: string
  entryThesis: string
  exitThesis: string
  invalidityCondition: string
  counterArguments: string[]
  stopLevel: number
  profitTarget: number
  confidence: number
}

export class AnalysisEngine {
  /**
   * Erstellt eine vollständige professionelle Analyse
   * mit Begründung, Szenarien und Warnsystem
   */
  static createAnalysis(input: AnalysisInput, tradingMode: 'daytrading' | 'swing' | 'investment'): Analysis {
    const chanceRiskRatio = this.calculateChanceRisk(input.stopLevel, input.profitTarget, input.currentPrice)
    const warningLevel = this.assessWarningLevel(input, chanceRiskRatio)
    const decision = this.makeDecision(input, chanceRiskRatio, warningLevel)

    return {
      id: `analysis_${Date.now()}`,
      assetId: input.assetId,
      tradingMode,
      timestamp: new Date(),

      thesisTitle: input.thesisTitle,
      marketPhase: input.marketPhase,
      technicalOutlook: input.technicalOutlook,
      entryThesis: input.entryThesis,
      exitThesis: input.exitThesis,
      invalidityCondition: input.invalidityCondition,
      counterArguments: input.counterArguments,
      volumeOutlook: 'Volumen nicht analysiert',

      stopLevel: input.stopLevel,
      profitTarget: input.profitTarget,
      chanceRiskRatio,
      confidence: input.confidence,

      decision,
      decisionReason: this.getDecisionReason(decision, chanceRiskRatio, warningLevel),

      bullishScenario: this.createBullishScenario(input),
      neutralScenario: this.createNeutralScenario(input),
      bearishScenario: this.createBearishScenario(input),
      stressScenario: this.createStressScenario(input),
      invalidityScenario: {
        description: 'Ungültigkeitsszenario eingetreten',
        conditions: [input.invalidityCondition],
        consequences: ['Trade wird beendet', 'Rückkehr zur Beobachtung']
      },

      warningLevel,
      warningReasons: this.getWarningReasons(input, chanceRiskRatio, warningLevel)
    }
  }

  /**
   * Berechnet Chance-Risiko-Verhältnis
   */
  static calculateChanceRisk(stopLevel: number, profitTarget: number, entryPrice: number): number {
    const risk = Math.abs(entryPrice - stopLevel)
    const chance = Math.abs(profitTarget - entryPrice)
    return risk > 0 ? chance / risk : 0
  }

  /**
   * Bewertet Warnstufe basierend auf verschiedenen Kriterien
   */
  static assessWarningLevel(input: AnalysisInput, chanceRiskRatio: number): WarningLevel {
    // Schlechtes Chance-Risiko-Verhältnis
    if (chanceRiskRatio < 1) return 'red'
    if (chanceRiskRatio < 1.5) return 'orange'

    // Niedrige Konfidenz
    if (input.confidence < 40) return 'orange'
    if (input.confidence < 20) return 'red'

    // Stop zu nah am Kurs
    const riskPercent = Math.abs(input.currentPrice - input.stopLevel) / input.currentPrice * 100
    if (riskPercent < 1) return 'orange'

    // Guter Stand
    if (input.confidence > 75 && chanceRiskRatio > 2) return 'green'
    if (input.confidence > 60 && chanceRiskRatio > 1.5) return 'green'

    return 'yellow'
  }

  /**
   * Trifft Entscheidung basierend auf allen Faktoren
   */
  static makeDecision(input: AnalysisInput, chanceRiskRatio: number, warningLevel: WarningLevel): DecisionType {
    // Keine Trades bei roten Warnungen
    if (warningLevel === 'red') return 'finger_weg'

    // Schlechtes Chance-Risiko
    if (chanceRiskRatio < 1) return 'finger_weg'

    // Zögern bei schwacher Konfidenz
    if (input.confidence < 50) return 'watch'

    // Nur bei Trigger bei mittlerer Konfidenz
    if (input.confidence < 70) return 'buy_on_trigger'

    // Kaufempfehlung bei guter Konfidenz und gutem Setup
    if (chanceRiskRatio > 1.5 && input.confidence > 70) return 'buy'

    return 'hold'
  }

  /**
   * Erstellt bullisches Szenario
   */
  static createBullishScenario(input: AnalysisInput): Scenario {
    return {
      description: `Kurs bricht aus und läuft Richtung ${input.profitTarget}`,
      conditions: [
        'Initialer Ausbruch bestätigt sich',
        'Volumen zieht nach',
        'Keine bearischen Divergenzen'
      ],
      consequences: [
        'Gewinnziel angesteuert',
        'Position läuft mit Profit'
      ],
      probability: 50
    }
  }

  /**
   * Erstellt neutrales Szenario
   */
  static createNeutralScenario(input: AnalysisInput): Scenario {
    const midPrice = (input.stopLevel + input.profitTarget) / 2
    return {
      description: `Kurs bleibt in Range zwischen ${input.stopLevel} und ${input.profitTarget}`,
      conditions: [
        'Widerstand hält',
        'Kein klares Momentum',
        'Seitwärts-Bewegung'
      ],
      consequences: [
        'Kein Trade nötig',
        'Abwarten auf klarere Signale'
      ],
      probability: 30
    }
  }

  /**
   * Erstellt bärisches Szenario
   */
  static createBearishScenario(input: AnalysisInput): Scenario {
    return {
      description: `Kurs verliert Unterstützung und fällt unter ${input.stopLevel}`,
      conditions: [
        'Ausbruch war Fehlausbruch',
        'Keine Unterstützung vorhanden',
        'Volumen steigt auf Abwärtsbewegung'
      ],
      consequences: [
        'Setup ungültig',
        'Stop Loss getroffen',
        'Rückkehr zur Beobachtung'
      ],
      probability: 15
    }
  }

  /**
   * Erstellt Stress-Szenario
   */
  static createStressScenario(input: AnalysisInput): Scenario {
    return {
      description: 'Markt-Schock oder negative Nachrichten führen zu Gap-Down',
      conditions: [
        'Unerwartete Nachricht',
        'Gesamtmarkt dreht ab',
        'Hohe Volatilität'
      ],
      consequences: [
        'Massive Kurslücke möglich',
        'Stop Loss wird gaps überschritten',
        'Sofortige Neubewertung nötig'
      ],
      probability: 5
    }
  }

  /**
   * Gibt Begründung für die Entscheidung
   */
  static getDecisionReason(decision: DecisionType, chanceRiskRatio: number, warningLevel: WarningLevel): string {
    const reasons: Record<DecisionType, string> = {
      buy: 'Setup erfüllt alle Kriterien mit gutem Chance-Risiko-Verhältnis',
      buy_on_trigger: 'Warten auf Bestätigung des Triggers für besseren Einstieg',
      hold: 'Position halten bis Ziel oder Stop erreicht',
      watch: 'Beobachten bis klarere Signale entstehen',
      sell: 'Ausstiegsreason erfüllt - Position schließen',
      finger_weg: `Zu viele Risikofaktoren - Schlechtes Setup (Warnung: ${warningLevel})`,
      scam: 'Asset erfüllt Scam-Kriterien - Nicht handeln',
      unclear: 'Datenlage unklar - Nicht genug Informationen für Entscheidung'
    }
    return reasons[decision]
  }

  /**
   * Sammelt Warngründe
   */
  static getWarningReasons(input: AnalysisInput, chanceRiskRatio: number, warningLevel: WarningLevel): string[] {
    const reasons: string[] = []

    if (chanceRiskRatio < 1) {
      reasons.push(`Schlechtes Chance-Risiko: ${chanceRiskRatio.toFixed(2)}:1 (Minimum 1:1)`)
    }
    if (chanceRiskRatio < 1.5) {
      reasons.push(`Suboptimales Chance-Risiko: ${chanceRiskRatio.toFixed(2)}:1 (Ziel 1.5:1 oder besser)`)
    }
    if (input.confidence < 50) {
      reasons.push(`Niedrige Konfidenz: ${input.confidence}% (Minimum 60%)`)
    }
    if (input.confidence < 70) {
      reasons.push(`Mittlere Konfidenz: ${input.confidence}% (Empfehlung > 75%)`)
    }

    const riskPercent = Math.abs(input.currentPrice - input.stopLevel) / input.currentPrice * 100
    if (riskPercent < 1) {
      reasons.push(`Stop zu nah: ${riskPercent.toFixed(2)}% Abstand (Minimum 1-2%)`)
    }

    if (input.counterArguments.length > 0) {
      reasons.push(`Gegenargumente vorhanden: ${input.counterArguments.join(', ')}`)
    }

    return reasons
  }

  /**
   * Validiert komplette Analyse auf Konsistenz
   */
  static validateAnalysis(analysis: Analysis): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    if (analysis.chanceRiskRatio <= 0) {
      issues.push('Chance-Risiko-Verhältnis ungültig')
    }

    if (analysis.confidence < 0 || analysis.confidence > 100) {
      issues.push('Konfidenz muss zwischen 0-100% liegen')
    }

    if (analysis.stopLevel === analysis.profitTarget) {
      issues.push('Stop und Target dürfen nicht gleich sein')
    }

    if (analysis.decision === 'finger_weg' && analysis.warningLevel === 'green') {
      issues.push('Inkonsistenz: "Finger weg" bei grüner Warnung?')
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Generiert strukturierte Bericht für Export
   */
  static generateReport(analysis: Analysis): string {
    const lines = [
      `=== ANALYSE REPORT ===`,
      `${analysis.thesisTitle}`,
      `Zeitstempel: ${analysis.timestamp.toLocaleString('de-DE')}`,
      ``,
      `WARNSTUFE: ${analysis.warningLevel.toUpperCase()}`,
      `ENTSCHEIDUNG: ${analysis.decision}`,
      ``,
      `EINSTIEGSTHESE:`,
      `${analysis.entryThesis}`,
      ``,
      `AUSSTIEGSTHESE:`,
      `${analysis.exitThesis}`,
      ``,
      `TECHNISCHE DATEN:`,
      `Stop: ${analysis.stopLevel} | Ziel: ${analysis.profitTarget} | Verhältnis: ${analysis.chanceRiskRatio.toFixed(2)}:1`,
      `Konfidenz: ${analysis.confidence}%`,
      ``,
      `SZENARIEN:`,
      `Bullisch: ${analysis.bullishScenario.description}`,
      `Neutral: ${analysis.neutralScenario.description}`,
      `Bärisch: ${analysis.bearishScenario.description}`,
      ``
    ]

    if (analysis.warningReasons.length > 0) {
      lines.push(`WARNUNGEN:`)
      analysis.warningReasons.forEach(r => lines.push(`  • ${r}`))
    }

    return lines.join('\n')
  }
}

export default AnalysisEngine
