import type { PricePoint } from '../types'
import { atr } from './indicators'

export interface BacktestTrade {
  entryDate: Date
  entryPrice: number
  exitDate: Date
  exitPrice: number
  result: 'gewinn' | 'verlust'
  rMultiple: number // Ergebnis in R (Vielfache des Risikos)
}

export interface BacktestResult {
  strategy: string
  trades: BacktestTrade[]
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalR: number
  avgR: number
  maxDrawdownR: number
  verdict: string
}

/**
 * Backtest-Light: prüft, wie oft ein einfaches Breakout-Setup
 * in der geladenen Historie funktioniert hätte.
 * Kein Ersatz für einen echten Backtest - aber ein ehrlicher Realitätscheck.
 */
export class Backtest {
  /**
   * Breakout-Strategie: Einstieg beim Ausbruch über das 20-Kerzen-Hoch,
   * Stop = Einstieg - 1.5 ATR, Ziel = Einstieg + 3 ATR (2:1).
   */
  static runBreakout(history: PricePoint[]): BacktestResult | null {
    if (!history || history.length < 40) return null

    const trades: BacktestTrade[] = []
    let i = 21

    while (i < history.length - 1) {
      const lookback = history.slice(i - 20, i)
      const breakoutLevel = Math.max(...lookback.map(p => p.high))
      const candle = history[i]

      // Einstieg: Schlusskurs über 20er-Hoch
      if (candle.close > breakoutLevel) {
        const entryPrice = candle.close
        const atrValue = atr(history.slice(Math.max(0, i - 15), i + 1)) || entryPrice * 0.02
        const stopPrice = entryPrice - 1.5 * atrValue
        const targetPrice = entryPrice + 3 * atrValue
        const risk = entryPrice - stopPrice

        // Trade verfolgen bis Stop oder Ziel
        let exitIdx = -1
        let exitPrice = entryPrice
        for (let j = i + 1; j < history.length; j++) {
          if (history[j].low <= stopPrice) {
            exitIdx = j
            exitPrice = stopPrice
            break
          }
          if (history[j].high >= targetPrice) {
            exitIdx = j
            exitPrice = targetPrice
            break
          }
        }

        if (exitIdx > 0) {
          const rMultiple = (exitPrice - entryPrice) / risk
          trades.push({
            entryDate: candle.timestamp,
            entryPrice,
            exitDate: history[exitIdx].timestamp,
            exitPrice,
            result: rMultiple > 0 ? 'gewinn' : 'verlust',
            rMultiple
          })
          i = exitIdx + 1
          continue
        } else {
          break // offener Trade am Ende - nicht werten
        }
      }
      i++
    }

    if (trades.length === 0) {
      return {
        strategy: 'Breakout (20-Kerzen-Hoch, 2:1)',
        trades: [], totalTrades: 0, wins: 0, losses: 0,
        winRate: 0, totalR: 0, avgR: 0, maxDrawdownR: 0,
        verdict: 'Kein einziges Setup im Zeitraum - Strategie passt nicht zu diesem Markt/Zeitraum.'
      }
    }

    const wins = trades.filter(t => t.rMultiple > 0).length
    const losses = trades.length - wins
    const totalR = trades.reduce((s, t) => s + t.rMultiple, 0)
    const winRate = (wins / trades.length) * 100

    // Max Drawdown in R
    let peak = 0, equity = 0, maxDD = 0
    trades.forEach(t => {
      equity += t.rMultiple
      peak = Math.max(peak, equity)
      maxDD = Math.max(maxDD, peak - equity)
    })

    let verdict: string
    if (totalR > 2 && winRate >= 40) {
      verdict = `Positiv: ${totalR.toFixed(1)}R Gesamtergebnis bei ${winRate.toFixed(0)}% Trefferquote. Bei 2:1-Zielen reichen schon ~35% Treffer für Profit.`
    } else if (totalR > 0) {
      verdict = `Knapp positiv (${totalR.toFixed(1)}R) - funktioniert, aber ohne Puffer. Gebühren und Slippage können das Ergebnis kippen.`
    } else {
      verdict = `Negativ (${totalR.toFixed(1)}R): Dieses Setup hätte in diesem Zeitraum Geld verloren. Finger weg oder anderen Markt/Zeitraum wählen.`
    }

    return {
      strategy: 'Breakout (20-Kerzen-Hoch, Stop 1.5 ATR, Ziel 3 ATR = 2:1)',
      trades, totalTrades: trades.length, wins, losses,
      winRate, totalR, avgR: totalR / trades.length, maxDrawdownR: maxDD,
      verdict
    }
  }
}

export default Backtest
