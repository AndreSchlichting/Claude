import axios from 'axios'
import type { Asset, PricePoint } from '../types'

// Alpha Vantage API Key (kostenlos unter https://www.alphavantage.co/api/)
const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo'
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'

// Cache für API-Aufrufe (um Rate-Limits zu vermeiden)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 Minuten
const CRYPTO_CACHE_TTL = 30 * 1000 // Krypto: 30 Sekunden (24/7-Markt)

// Binance Public API: echte Krypto-Daten ohne API-Key
const BINANCE_BASE = 'https://api.binance.com/api/v3'
const BINANCE_MAP: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT'
}
// Kerzenintervall-Mapping App -> Binance
const BINANCE_INTERVALS: Record<string, string> = {
  '1min': '1m', '2min': '3m', '5min': '5m', '10min': '15m',
  '15min': '15m', '30min': '30m', '60min': '1h', '1d': '1d', '1w': '1w'
}

// Definierte Assets mit Symbol-Mapping
const ASSET_REGISTRY: Record<string, Asset> = {
  'apple': {
    id: 'apple',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    isin: 'US0378331005',
    assetClass: 'stock',
    currentPrice: 0,
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date(),
    priceHistory: []
  },
  'tesla': {
    id: 'tesla',
    name: 'Tesla Inc.',
    symbol: 'TSLA',
    isin: 'US0884591054',
    assetClass: 'stock',
    currentPrice: 0,
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date(),
    priceHistory: []
  },
  'microsoft': {
    id: 'microsoft',
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    isin: 'US5949181045',
    assetClass: 'stock',
    currentPrice: 0,
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date(),
    priceHistory: []
  },
  'google': {
    id: 'google',
    name: 'Alphabet Inc.',
    symbol: 'GOOGL',
    isin: 'US02079K3059',
    assetClass: 'stock',
    currentPrice: 0,
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date(),
    priceHistory: []
  },
  'amazon': {
    id: 'amazon',
    name: 'Amazon.com Inc.',
    symbol: 'AMZN',
    isin: 'US0231351067',
    assetClass: 'stock',
    currentPrice: 0,
    currency: 'USD',
    exchange: 'NASDAQ',
    lastUpdated: new Date(),
    priceHistory: []
  },
  'msci-world': {
    id: 'msci-world',
    name: 'iShares MSCI World ETF',
    symbol: 'EUNL',
    isin: 'IE00B4L5Y983',
    assetClass: 'etf',
    currentPrice: 0,
    currency: 'EUR',
    exchange: 'XETRA',
    lastUpdated: new Date(),
    priceHistory: []
  },
  'bitcoin': {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    assetClass: 'crypto',
    currentPrice: 0,
    currency: 'USD',
    exchange: 'Binance',
    lastUpdated: new Date(),
    priceHistory: []
  },
  'ethereum': {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    assetClass: 'crypto',
    currentPrice: 0,
    currency: 'USD',
    exchange: 'Binance',
    lastUpdated: new Date(),
    priceHistory: []
  }
}

/**
 * Binance Klines -> PricePoints (echte Krypto-Daten, 24/7)
 */
async function fetchBinanceKlines(binanceSymbol: string, interval: string, limit: number): Promise<PricePoint[]> {
  const cacheKey = `bn_klines_${binanceSymbol}_${interval}_${limit}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CRYPTO_CACHE_TTL) return cached.data

  try {
    const response = await axios.get(`${BINANCE_BASE}/klines`, {
      params: { symbol: binanceSymbol, interval, limit: Math.min(limit, 500) },
      timeout: 10000
    })
    const points: PricePoint[] = (response.data as any[]).map(k => ({
      timestamp: new Date(k[0]),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      interval
    }))
    cache.set(cacheKey, { data: points, timestamp: Date.now() })
    return points
  } catch (error) {
    console.error(`Binance-Fehler für ${binanceSymbol}:`, error)
    return []
  }
}

async function fetchBinancePrice(binanceSymbol: string): Promise<number> {
  const cacheKey = `bn_price_${binanceSymbol}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CRYPTO_CACHE_TTL) return cached.data

  try {
    const response = await axios.get(`${BINANCE_BASE}/ticker/price`, {
      params: { symbol: binanceSymbol },
      timeout: 8000
    })
    const price = parseFloat(response.data.price)
    cache.set(cacheKey, { data: price, timestamp: Date.now() })
    return price
  } catch {
    return 0
  }
}

/**
 * Lädt echte Kursdaten von Alpha Vantage
 */
async function fetchFromAlphaVantage(symbol: string, dataType: string = 'TIME_SERIES_DAILY', extraParams: Record<string, string> = {}) {
  const cacheKey = `av_${symbol}_${dataType}_${JSON.stringify(extraParams)}`

  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
  }

  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: dataType,
        symbol: symbol,
        apikey: ALPHA_VANTAGE_KEY,
        outputsize: 'compact',
        ...extraParams
      },
      timeout: 10000
    })

    const data = response.data

    // Cache result
    cache.set(cacheKey, { data, timestamp: Date.now() })

    return data
  } catch (error) {
    console.error(`Fehler beim Abruf von ${symbol}:`, error)
    return null
  }
}

/**
 * Parsiert Alpha Vantage Daten zu PricePoints
 */
function parseAlphaVantageData(data: any, symbol: string): PricePoint[] {
  const points: PricePoint[] = []
  // Findet den Time-Series-Schlüssel unabhängig vom Intervall
  const seriesKey = Object.keys(data).find(k => k.startsWith('Time Series')) || ''
  const timeSeries = data[seriesKey] || {}

  Object.entries(timeSeries).forEach(([timestamp, values]: [string, any]) => {
    points.push({
      timestamp: new Date(timestamp),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
      interval: 'daily'
    })
  })

  return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export const apiService = {
  // Assets
  async getAssets(): Promise<Asset[]> {
    const assets = Object.values(ASSET_REGISTRY)

    // Lade aktuelle Kurse für alle Assets
    for (const asset of assets) {
      const price = await this.getCurrentPrice(asset.id)
      if (price > 0) {
        asset.currentPrice = price
        asset.lastUpdated = new Date()
      }
    }

    return assets
  },

  async getAssetById(id: string): Promise<Asset | null> {
    const asset = ASSET_REGISTRY[id]
    if (asset) {
      const price = await this.getCurrentPrice(id)
      if (price > 0) {
        asset.currentPrice = price
        asset.lastUpdated = new Date()
      }
      return asset
    }
    return null
  },

  async searchAssets(query: string): Promise<Asset[]> {
    const assets = await this.getAssets()
    return assets.filter(a =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.symbol.toLowerCase().includes(query.toLowerCase())
    )
  },

  // Price History - echte Daten von Binance (Krypto) bzw. Alpha Vantage (Aktien/ETF)
  async getPriceHistory(assetId: string, interval: string = '1d', limit: number = 100): Promise<PricePoint[]> {
    const asset = ASSET_REGISTRY[assetId]
    if (!asset) return []

    // Krypto: Binance Public API (echt, 24/7, kein Key nötig)
    if (BINANCE_MAP[assetId]) {
      const bnInterval = BINANCE_INTERVALS[interval] || '1d'
      const points = await fetchBinanceKlines(BINANCE_MAP[assetId], bnInterval, limit)
      if (points.length > 0) return points
    }

    // Intraday-Intervalle (1min-60min) vs. Tagesdaten
    const isIntraday = /min$/.test(interval)
    const dataType = isIntraday ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY'
    const extraParams: Record<string, string> = isIntraday ? { interval } : {}
    const data = await fetchFromAlphaVantage(asset.symbol, dataType, extraParams)

    if (!data) {
      // Fallback zu Demo-Daten wenn API nicht verfügbar
      return this._generateDemoHistory(limit)
    }

    const points = parseAlphaVantageData(data, asset.symbol)
    return points.slice(-limit)
  },

  // Aktueller Kurs - echte Daten
  async getCurrentPrice(assetId: string): Promise<number> {
    const asset = ASSET_REGISTRY[assetId]
    if (!asset) return 0

    // Krypto: Binance Live-Preis
    if (BINANCE_MAP[assetId]) {
      const price = await fetchBinancePrice(BINANCE_MAP[assetId])
      if (price > 0) return price
    }

    const data = await fetchFromAlphaVantage(asset.symbol, 'TIME_SERIES_DAILY')

    if (!data) return 0

    const timeSeries = data['Time Series (Daily)']
    if (!timeSeries) return 0

    // Neuester Eintrag
    const latestDate = Object.keys(timeSeries)[0]
    const latestData = timeSeries[latestDate]

    return parseFloat(latestData['4. close']) || 0
  },

  // Demo-History für Fallback
  _generateDemoHistory(limit: number): PricePoint[] {
    const points: PricePoint[] = []
    const basePrice = 100
    for (let i = limit; i > 0; i--) {
      const offset = (Math.random() - 0.5) * 20
      const price = basePrice + offset
      points.push({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        open: price,
        high: price + 3,
        low: price - 3,
        close: price + (Math.random() - 0.5) * 2,
        volume: Math.floor(Math.random() * 5000000),
        interval: '1d'
      })
    }
    return points
  },

  // Real-time Simulation (würde später WebSocket sein)
  subscribeToPrice(assetId: string, callback: (priceChange: number) => void) {
    const interval = setInterval(() => {
      const randomChange = (Math.random() - 0.5) * 2
      callback(randomChange)
    }, 5000)
    return () => clearInterval(interval)
  },

  // Wechselkurs EUR/USD - echte EZB-Kurse via frankfurter.app (kein API-Key nötig)
  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1

    const cacheKey = `fx_${from}_${to}`
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
      }
    }

    try {
      // frankfurter.app: offizielle EZB-Referenzkurse, kostenlos, CORS-freundlich
      const response = await axios.get('https://api.frankfurter.app/latest', {
        params: { from, to },
        timeout: 8000
      })
      const rate = response.data?.rates?.[to]
      if (rate && rate > 0) {
        cache.set(cacheKey, { data: rate, timestamp: Date.now() })
        return rate
      }
    } catch (error) {
      console.error(`Wechselkurs ${from}/${to} nicht abrufbar:`, error)
    }

    // Fallback nur wenn API nicht erreichbar
    if (from === 'EUR' && to === 'USD') return 1.1
    if (from === 'USD' && to === 'EUR') return 0.91
    return 1
  },

  // News/Events (später mit NewsAPI integrieren)
  async getAssetNews(assetId: string, limit: number = 10) {
    return []
  },

  // Fundamentals (später mit Finnhub integrieren)
  async getAssetFundamentals(assetId: string) {
    return {}
  },

  // Cache clearen
  clearCache() {
    cache.clear()
  }
}

export default apiService
