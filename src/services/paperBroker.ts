import type { Portfolio, Position, Settings, Transaction, EventType } from '../types'
import { NetResultEngine } from './netResultEngine'

export interface Fill {
  position: Position
  portfolioId: string
  exitPrice: number
  reason: 'stop' | 'ziel'
  netGain: number
  transaction: Transaction
  eventType: EventType
  message: string
}

/**
 * Paper-Broker (Ausbaustufe 3.0, Simulationsteil):
 * Führt Stop-Loss und Kursziele in Paper-/Test-Portfolios automatisch aus,
 * sobald der Kurs die Level erreicht - wie ein echter Broker, nur ohne Geld.
 * Die echte Broker-Anbindung ersetzt später nur die Ausführungsschicht.
 */
export class PaperBroker {
  /**
   * Prüft alle Positionen in Paper-/Test-Portfolios gegen aktuelle Kurse
   * und führt fällige Stops/Ziele aus. Gibt die Fills zurück.
   */
  static settle(portfolios: Portfolio[], settings: Settings): Fill[] {
    const fills: Fill[] = []

    portfolios
      .filter(p => p.type === 'paper' || p.type === 'test')
      .forEach(portfolio => {
        const remaining: Position[] = []

        portfolio.positions.forEach(pos => {
          const price = pos.asset.currentPrice
          if (!price || price <= 0) { remaining.push(pos); return }

          let exitPrice = 0
          let reason: 'stop' | 'ziel' | null = null

          if (pos.stopLoss > 0 && price <= pos.stopLoss) {
            exitPrice = pos.stopLoss
            reason = 'stop'
          } else if (pos.profitTarget > 0 && price >= pos.profitTarget) {
            exitPrice = pos.profitTarget
            reason = 'ziel'
          }

          if (!reason) { remaining.push(pos); return }

          const result = NetResultEngine.calculateNetResult(
            pos, exitPrice, settings.feeProfile, settings.taxAssumption, 'EUR'
          )
          portfolio.realizedGainLoss += result.netGain

          const transaction: Transaction = {
            id: `tx_paper_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            portfolioId: portfolio.id,
            assetId: pos.asset.id,
            type: 'sell',
            quantity: pos.quantity,
            price: exitPrice,
            fees: result.sellFees,
            taxes: result.estimatedTax,
            currency: pos.currency,
            date: new Date(),
            note: `Paper-Broker: ${reason === 'stop' ? 'Stop ausgeführt' : 'Ziel erreicht'} (Netto ${result.netGain.toFixed(2)} €)`
          }

          fills.push({
            position: pos,
            portfolioId: portfolio.id,
            exitPrice,
            reason,
            netGain: result.netGain,
            transaction,
            eventType: reason === 'stop' ? 'stop_erreicht' : 'ziel_erreicht',
            message: `Paper-Broker: ${pos.quantity}x ${pos.asset.symbol} ${reason === 'stop' ? 'am Stop' : 'am Ziel'} ${exitPrice.toFixed(2)} verkauft (Netto ${result.netGain >= 0 ? '+' : ''}${result.netGain.toFixed(2)} €)`
          })
        })

        portfolio.positions = remaining
      })

    return fills
  }
}

export default PaperBroker
