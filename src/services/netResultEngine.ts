import type { Position, FeeProfile, TaxAssumption, Settings } from '../types'

export interface NetResultCalculation {
  // Brutto-Werte
  currentValue: number
  buyValue: number
  grossGain: number
  grossGainPercent: number

  // Gebühren
  buyFees: number
  sellFees: number
  totalFees: number
  spreadCost: number
  slippageCost: number

  // Steuern
  estimatedTax: number
  taxableGain: number
  taxableGainAfterFreeAmount: number

  // Netto-Ergebnis
  netGain: number
  netGainPercent: number
  netProceeds: number

  // Komponenten
  components: {
    grossResult: number
    feesImpact: number
    taxesImpact: number
  }

  // Risiko & Schätzungen
  assumptions: string[]
}

/**
 * Engine für Netto-Ergebnis-Berechnung
 * Berücksichtigt: Gebühren, Steuern, Währungseffekte
 */
export class NetResultEngine {
  /**
   * Berechnet komplettes Netto-Ergebnis für eine Position
   */
  static calculateNetResult(
    position: Position,
    currentPrice: number,
    feeProfile: FeeProfile,
    taxAssumption: TaxAssumption,
    currency: 'EUR' | 'USD'
  ): NetResultCalculation {
    const assumptions: string[] = []

    // Brutto-Werte
    const buyValue = position.quantity * position.buyPrice
    const currentValue = position.quantity * currentPrice
    const grossGain = currentValue - buyValue
    const grossGainPercent = buyValue > 0 ? (grossGain / buyValue) * 100 : 0

    // Gebühren beim Kauf
    const buyFees = Math.max(feeProfile.buyFee, buyValue * (feeProfile.percentageFee || 0) / 100)

    // Gebühren beim Verkauf
    const sellFees = Math.max(feeProfile.sellFee, currentValue * (feeProfile.percentageFee || 0) / 100)

    // Spread-Kosten (Annahme)
    const spreadCost = (buyValue + currentValue) * (feeProfile.spreadAssumption / 100) / 2

    // Slippage-Kosten (Annahme)
    const slippageCost = (buyValue + currentValue) * (feeProfile.slippageAssumption / 100) / 2

    const totalFees = buyFees + sellFees + spreadCost + slippageCost
    assumptions.push(`Gebühren: Buy ${buyFees.toFixed(2)}€ + Sell ${sellFees.toFixed(2)}€`)
    assumptions.push(`Spread/Slippage: ${(spreadCost + slippageCost).toFixed(2)}€`)

    // Steuern
    const taxResult = this.calculateTaxes(grossGain, taxAssumption, position)
    const estimatedTax = taxResult.estimatedTax
    assumptions.push(...taxResult.assumptions)

    // Netto-Ergebnis
    const netGain = grossGain - totalFees - estimatedTax
    const netGainPercent = buyValue > 0 ? (netGain / buyValue) * 100 : 0
    const netProceeds = currentValue - totalFees - estimatedTax

    return {
      currentValue,
      buyValue,
      grossGain,
      grossGainPercent,
      buyFees,
      sellFees,
      totalFees,
      spreadCost,
      slippageCost,
      estimatedTax,
      taxableGain: taxResult.taxableGain,
      taxableGainAfterFreeAmount: taxResult.taxableGainAfterFreeAmount,
      netGain,
      netGainPercent,
      netProceeds,
      components: {
        grossResult: grossGain,
        feesImpact: -totalFees,
        taxesImpact: -estimatedTax
      },
      assumptions
    }
  }

  /**
   * Berechnet deutsche Steuern basierend auf Assetklasse & Haltedauer
   */
  private static calculateTaxes(
    gain: number,
    taxAssumption: TaxAssumption,
    position: Position
  ): { estimatedTax: number; taxableGain: number; taxableGainAfterFreeAmount: number; assumptions: string[] } {
    const assumptions: string[] = []

    if (gain <= 0) {
      return { estimatedTax: 0, taxableGain: 0, taxableGainAfterFreeAmount: 0, assumptions: ['Kein Gewinn = keine Steuer'] }
    }

    // Bestimme Haltedauer in Tagen
    const haltedauerDays = Math.floor((Date.now() - position.buyDate.getTime()) / (1000 * 60 * 60 * 24))

    // Krypto: Spezialbehandlung
    if (position.asset.assetClass === 'crypto') {
      return this.calculateCryptoTaxes(gain, haltedauerDays, taxAssumption, assumptions)
    }

    // Aktien/ETFs: Abgeltungsteuer
    return this.calculateEquityTaxes(gain, taxAssumption, assumptions)
  }

  /**
   * Berechnet Steuern für Kryptowährungen (private Veräußerungsgeschäfte)
   */
  private static calculateCryptoTaxes(
    gain: number,
    haltedauerDays: number,
    taxAssumption: TaxAssumption,
    assumptions: string[]
  ): { estimatedTax: number; taxableGain: number; taxableGainAfterFreeAmount: number; assumptions: string[] } {
    assumptions.push(`Krypto-Haltedauer: ${haltedauerDays} Tage`)

    // Nach 365 Tagen = Einkünfte aus privaten Veräußerungsgeschäften § 23 EStG
    if (haltedauerDays >= taxAssumption.cryptoHoldingPeriod) {
      assumptions.push('✓ Nach Haltedauer steuerfrei (§23 EStG)')
      return {
        estimatedTax: 0,
        taxableGain: 0,
        taxableGainAfterFreeAmount: 0,
        assumptions
      }
    }

    // Unter 1 Jahr: Freigrenze 1.000€
    const freeAmount = 1000
    const taxableGain = Math.max(0, gain - freeAmount)
    assumptions.push(`Freigrenze: ${freeAmount}€ (§23 Abs. 3 EStG)`)

    // Einkommensteuer + Soli + ggf. Kirchensteuer
    let taxRate = taxAssumption.capitalGainsTax + taxAssumption.solidarityTax

    if (taxAssumption.churchTax) {
      taxRate += 8 // Durchschnittliche Kirchensteuer 8-9%
      assumptions.push(`inkl. Kirchensteuer`)
    }

    const estimatedTax = taxableGain * (taxRate / 100)
    assumptions.push(`Steuersatz: ${taxRate.toFixed(2)}% (Gewinn - Freigrenze)`)

    return {
      estimatedTax,
      taxableGain: gain,
      taxableGainAfterFreeAmount: taxableGain,
      assumptions
    }
  }

  /**
   * Berechnet Steuern für Aktien/ETFs (Abgeltungsteuer)
   */
  private static calculateEquityTaxes(
    gain: number,
    taxAssumption: TaxAssumption,
    assumptions: string[]
  ): { estimatedTax: number; taxableGain: number; taxableGainAfterFreeAmount: number; assumptions: string[] } {
    // Sparer-Pauschbetrag
    const freeAmount = taxAssumption.sparerPauschbetrag // 1.000€
    const taxableGain = Math.max(0, gain - freeAmount)

    assumptions.push(`Sparer-Pauschbetrag: ${freeAmount}€ (§20 Abs. 9 EStG)`)

    // Abgeltungsteuer berechnet sich nur auf Gewinne über Pauschbetrag
    let taxRate = taxAssumption.capitalGainsTax // 26,375% (25% + 5,5% Soli)

    if (taxAssumption.churchTax) {
      taxRate += 8
      assumptions.push(`inkl. Kirchensteuer`)
    }

    const estimatedTax = taxableGain * (taxRate / 100)
    assumptions.push(`Abgeltungsteuer: ${taxRate.toFixed(2)}% (Gewinn - Pauschbetrag)`)

    return {
      estimatedTax,
      taxableGain: gain,
      taxableGainAfterFreeAmount: taxableGain,
      assumptions
    }
  }

  /**
   * Formatiert Netto-Ergebnis für Anzeige
   */
  static formatResult(result: NetResultCalculation, currency: 'EUR' | 'USD'): string {
    const symbol = currency === 'EUR' ? '€' : '$'
    const lines = [
      `BRUTTO-ERGEBNIS: ${symbol} ${result.grossGain.toFixed(2)} (${result.grossGainPercent.toFixed(2)}%)`,
      ``,
      `GEBÜHREN (gesamt): -${symbol} ${result.totalFees.toFixed(2)}`,
      `  • Kaufgebühr: ${symbol} ${result.buyFees.toFixed(2)}`,
      `  • Verkaufsgebühr: ${symbol} ${result.sellFees.toFixed(2)}`,
      `  • Spread/Slippage: ${symbol} ${(result.spreadCost + result.slippageCost).toFixed(2)}`,
      ``,
      `STEUERN (geschätzt): -${symbol} ${result.estimatedTax.toFixed(2)}`,
      `  • Steuerbarer Gewinn: ${symbol} ${result.taxableGain.toFixed(2)}`,
      `  • Nach Freibetrag: ${symbol} ${result.taxableGainAfterFreeAmount.toFixed(2)}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `NETTO-ERGEBNIS: ${symbol} ${result.netGain.toFixed(2)} (${result.netGainPercent.toFixed(2)}%)`,
      `NETTO-ERLÖS: ${symbol} ${result.netProceeds.toFixed(2)}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    ]

    return lines.join('\n')
  }

  /**
   * Vergleicht verschiedene Verkaufsszenarien
   */
  static compareScenarios(
    position: Position,
    feeProfile: FeeProfile,
    taxAssumption: TaxAssumption,
    scenarios: { name: string; price: number }[]
  ): Array<{ name: string; price: number; result: NetResultCalculation }> {
    return scenarios.map(scenario => ({
      ...scenario,
      result: this.calculateNetResult(
        position,
        scenario.price,
        feeProfile,
        taxAssumption,
        'EUR'
      )
    }))
  }

  /**
   * Berechnet erforderlichen Verkaufspreis für bestimmten Netto-Gewinn
   */
  static calculateRequiredPriceForNetGain(
    position: Position,
    targetNetGain: number,
    feeProfile: FeeProfile,
    taxAssumption: TaxAssumption
  ): { requiredPrice: number; breakdown: string } {
    // Iteratives Finden des benötigten Preises
    let minPrice = position.buyPrice
    let maxPrice = position.buyPrice * 2 // Max 100% Gewinn annahme
    let requiredPrice = minPrice

    for (let i = 0; i < 10; i++) {
      const midPrice = (minPrice + maxPrice) / 2
      const result = this.calculateNetResult(position, midPrice, feeProfile, taxAssumption, 'EUR')

      if (result.netGain < targetNetGain) {
        minPrice = midPrice
      } else {
        maxPrice = midPrice
      }
      requiredPrice = midPrice
    }

    const result = this.calculateNetResult(position, requiredPrice, feeProfile, taxAssumption, 'EUR')
    const breakdown = `Für Netto-Gewinn von €${targetNetGain.toFixed(2)} musst du bei €${requiredPrice.toFixed(2)} verkaufen (aktuell €${position.asset.currentPrice.toFixed(2)})`

    return { requiredPrice, breakdown }
  }
}

export default NetResultEngine
