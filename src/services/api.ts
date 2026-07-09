import axios from 'axios'
import type { Asset, PricePoint } from '../types'

// Alpha Vantage API Key (kostenlos unter https://www.alphavantage.co/api/)
const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo'
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'

// Cache für API-Aufrufe (um Rate-Limits zu vermeiden)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 Minuten

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
  }
}

/**
 * Lädt echte Kursdaten von Alpha Vantage
 */
async function fetchFromAlphaVantage(symbol: string, dataType: string = 'TIME_SERIES_DAILY') {
  const cacheKey = `av_${symbol}_${dataType}`

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
        outputsize: 'compact'
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
  const timeSeries = data['Time Series (Daily)'] || data['Time Series (5min)'] || {}

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

  // Price History - echte Daten von Alpha Vantage
  async getPriceHistory(assetId: string, interval: string = '1d', limit: number = 100): Promise<PricePoint[]> {
    const asset = ASSET_REGISTRY[assetId]
    if (!asset) return []

    const dataType = interval === '5min' ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY'
    const data = await fetchFromAlphaVantage(asset.symbol, dataType)

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

  // Wechselkurs EUR/USD
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
      // Alpha Vantage FX-Daten
      const data = await fetchFromAlphaVantage(`${from}${to}`, 'CURRENCY_EXCHANGE_RATE')

      if (data && data['Realtime Currency Exchange Rate']) {
        const rate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate'])
        cache.set(cacheKey, { data: rate, timestamp: Date.now() })
        return rate
      }
    } catch (error) {
      console.error(`Fehler beim Abruf von ${from}/${to}:`, error)
    }

    // Fallback: Standard-Wechselkurse
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
