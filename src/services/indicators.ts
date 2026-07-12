import type { PricePoint } from '../types'

/**
 * Technische Indikatoren für die Profi-Analyse.
 * Reine Funktionen, keine Abhängigkeiten.
 */

export function sma(values: number[], period: number): number[] {
  const out: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(NaN); continue }
    const slice = values.slice(i - period + 1, i + 1)
    out.push(slice.reduce((a, b) => a + b, 0) / period)
  }
  return out
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = []
  const k = 2 / (period + 1)
  let prev = values[0]
  values.forEach((v, i) => {
    prev = i === 0 ? v : v * k + prev * (1 - k)
    out.push(prev)
  })
  return out
}

/** RSI nach Wilder (Standard 14) */
export function rsi(closes: number[], period = 14): number[] {
  const out: number[] = [NaN]
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    const gain = Math.max(0, change)
    const loss = Math.max(0, -change)
    if (i <= period) {
      avgGain += gain / period
      avgLoss += loss / period
      out.push(NaN)
      if (i === period) {
        out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      out.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
    }
  }
  return out
}

/** MACD (12/26/9) */
export function macd(closes: number[]): { macdLine: number[]; signal: number[]; histogram: number[] } {
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal = ema(macdLine, 9)
  const histogram = macdLine.map((v, i) => v - signal[i])
  return { macdLine, signal, histogram }
}

/** Bollinger-Bänder (20, 2) */
export function bollinger(closes: number[], period = 20, mult = 2) {
  const mid = sma(closes, period)
  const upper: number[] = []
  const lower: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { upper.push(NaN); lower.push(NaN); continue }
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = mid[i]
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period)
    upper.push(mean + mult * std)
    lower.push(mean - mult * std)
  }
  return { mid, upper, lower }
}

/** Average True Range (Volatilität) */
export function atr(history: PricePoint[], period = 14): number {
  if (history.length < 2) return 0
  const trs: number[] = []
  for (let i = 1; i < history.length; i++) {
    const h = history[i].high, l = history[i].low, pc = history[i - 1].close
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
  }
  const slice = trs.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

export interface MarketStructure {
  trend: 'aufwaerts' | 'abwaerts' | 'seitwaerts'
  higherHighs: number
  higherLows: number
  lowerHighs: number
  lowerLows: number
  lastSwingHigh: number
  lastSwingLow: number
  description: string
}

/**
 * Marktstruktur-Analyse (Higher Highs / Higher Lows):
 * Profis handeln die Struktur, nicht den Indikator.
 */
export function marketStructure(history: PricePoint[], lookback = 3): MarketStructure {
  const swingHighs: number[] = []
  const swingLows: number[] = []

  for (let i = lookback; i < history.length - lookback; i++) {
    const isHigh = history.slice(i - lookback, i + lookback + 1).every(p => p.high <= history[i].high)
    const isLow = history.slice(i - lookback, i + lookback + 1).every(p => p.low >= history[i].low)
    if (isHigh) swingHighs.push(history[i].high)
    if (isLow) swingLows.push(history[i].low)
  }

  let hh = 0, hl = 0, lh = 0, ll = 0
  for (let i = 1; i < swingHighs.length; i++) {
    if (swingHighs[i] > swingHighs[i - 1]) hh++; else lh++
  }
  for (let i = 1; i < swingLows.length; i++) {
    if (swingLows[i] > swingLows[i - 1]) hl++; else ll++
  }

  let trend: MarketStructure['trend'] = 'seitwaerts'
  let description = 'Keine klare Struktur - Range-Markt.'
  if (hh + hl > (lh + ll) * 1.5 && hh >= 1 && hl >= 1) {
    trend = 'aufwaerts'
    description = 'Intakte Aufwärtsstruktur: steigende Hochs und steigende Tiefs.'
  } else if (lh + ll > (hh + hl) * 1.5 && lh >= 1 && ll >= 1) {
    trend = 'abwaerts'
    description = 'Abwärtsstruktur: fallende Hochs und fallende Tiefs. Keine Long-Setups gegen die Struktur.'
  }

  return {
    trend, higherHighs: hh, higherLows: hl, lowerHighs: lh, lowerLows: ll,
    lastSwingHigh: swingHighs[swingHighs.length - 1] || Math.max(...history.map(p => p.high)),
    lastSwingLow: swingLows[swingLows.length - 1] || Math.min(...history.map(p => p.low)),
    description
  }
}

export interface KeyZone {
  price: number
  type: 'unterstuetzung' | 'widerstand'
  strength: number // Anzahl Berührungen
  distancePercent: number
}

/**
 * Schlüsselzonen (Support/Resistance) über Preis-Cluster:
 * Zonen, an denen der Markt mehrfach reagiert hat.
 */
export function keyZones(history: PricePoint[], currentPrice: number, maxZones = 4): KeyZone[] {
  if (history.length < 10) return []
  const prices: number[] = []
  history.forEach(p => { prices.push(p.high, p.low) })
  const min = Math.min(...prices), max = Math.max(...prices)
  const bucketSize = (max - min) / 20 || 1

  const buckets = new Map<number, number>()
  prices.forEach(p => {
    const b = Math.round((p - min) / bucketSize)
    buckets.set(b, (buckets.get(b) || 0) + 1)
  })

  const zones: KeyZone[] = []
  Array.from(buckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxZones * 2)
    .forEach(([bucket, count]) => {
      const price = min + bucket * bucketSize
      zones.push({
        price,
        type: price < currentPrice ? 'unterstuetzung' : 'widerstand',
        strength: count,
        distancePercent: ((price - currentPrice) / currentPrice) * 100
      })
    })

  // Nächstgelegene Zonen zuerst
  return zones
    .sort((a, b) => Math.abs(a.distancePercent) - Math.abs(b.distancePercent))
    .slice(0, maxZones)
}

export interface VolumeNode {
  priceLevel: number
  volume: number
  isHighVolumeNode: boolean
}

/**
 * Vereinfachtes Volumenprofil: Wo wurde am meisten gehandelt?
 * High-Volume-Nodes wirken wie Magnete/Liquiditätszonen.
 */
export function volumeProfile(history: PricePoint[], buckets = 12): VolumeNode[] {
  if (history.length < 5) return []
  const min = Math.min(...history.map(p => p.low))
  const max = Math.max(...history.map(p => p.high))
  const size = (max - min) / buckets || 1

  const profile: number[] = new Array(buckets).fill(0)
  history.forEach(p => {
    const typical = (p.high + p.low + p.close) / 3
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor((typical - min) / size)))
    profile[idx] += p.volume
  })

  const avgVol = profile.reduce((a, b) => a + b, 0) / buckets
  return profile.map((vol, i) => ({
    priceLevel: min + (i + 0.5) * size,
    volume: vol,
    isHighVolumeNode: vol > avgVol * 1.5
  }))
}

/** Relative Stärke gegenüber Vergleichszeitraum (Momentum in %) */
export function momentumPercent(closes: number[], period = 10): number {
  if (closes.length < period + 1) return 0
  const now = closes[closes.length - 1]
  const then = closes[closes.length - 1 - period]
  return ((now - then) / then) * 100
}
