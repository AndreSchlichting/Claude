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

// CoinGecko-Fallback für Krypto (kostenlos, CORS-freundlich, kein Key)
const COINGECKO_IDS: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', DOT: 'polkadot', LTC: 'litecoin', LINK: 'chainlink', AVAX: 'avalanche-2' }

async function coingeckoPrice(symbol: string): Promise<number> {
  const id = COINGECKO_IDS[symbol.toUpperCase()]
  if (!id) return 0
  try {
    const resp = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: id, vs_currencies: 'usd' }, timeout: 8000
    })
    return resp.data?.[id]?.usd || 0
  } catch { return 0 }
}

// Lokaler Server (npm run webhooks) als Stooq-Proxy für Aktien/Indizes ohne Key
async function localStooqHistory(stooqSymbol: string): Promise<PricePoint[]> {
  try {
    const resp = await axios.get(`http://localhost:3777/stooq/${encodeURIComponent(stooqSymbol)}`, { timeout: 12000 })
    const rows = resp.data?.rows || []
    return rows.map((r: any) => ({
      timestamp: new Date(r.date), open: r.open, high: r.high, low: r.low,
      close: r.close, volume: r.volume || 0, interval: '1d'
    }))
  } catch { return [] }
}

/** Stooq-Symbol für ein Asset ableiten (US-Aktien: aapl.us, DE: .de) */
function stooqSymbolFor(asset: Asset): string {
  if (asset.exchange && /xetra|frankfurt|germany/i.test(asset.exchange)) return `${asset.symbol.toLowerCase()}.de`
  return `${asset.symbol.toLowerCase()}.us`
}

export interface FxRate { pair: string; label: string; rate: number; changePercent: number | null }

export interface SymbolSearchResult {
  symbol: string
  name: string
  type: 'crypto' | 'stock' | 'etf'
  region?: string
  currency: 'USD' | 'EUR'
  binanceSymbol?: string
}

export const apiService = {
  /**
   * Dynamisch gefundene Assets registrieren, damit Kursabruf funktioniert
   * (wird auch beim App-Start für gespeicherte Assets aufgerufen)
   */
  registerDynamicAsset(asset: Asset) {
    ASSET_REGISTRY[asset.id] = asset
    if (asset.binanceSymbol) {
      BINANCE_MAP[asset.id] = asset.binanceSymbol
    }
  },

  /**
   * Asset-Suche: Krypto über Binance (ohne Key), Aktien/ETFs über
   * Alpha Vantage SYMBOL_SEARCH (weltweit, braucht kostenlosen Key)
   */
  async searchSymbols(query: string): Promise<{ results: SymbolSearchResult[]; hint: string }> {
    const q = query.trim()
    if (!q) return { results: [], hint: '' }
    const results: SymbolSearchResult[] = []
    let hint = ''

    // 1. Krypto: existiert SYMBOL+USDT auf Binance?
    const cryptoSymbol = q.toUpperCase().replace(/USDT$/, '')
    try {
      const resp = await axios.get(`${BINANCE_BASE}/ticker/price`, {
        params: { symbol: `${cryptoSymbol}USDT` }, timeout: 6000
      })
      if (resp.data?.price) {
        results.push({
          symbol: cryptoSymbol,
          name: `${cryptoSymbol} (Kryptowährung, Binance)`,
          type: 'crypto',
          currency: 'USD',
          binanceSymbol: `${cryptoSymbol}USDT`
        })
      }
    } catch { /* kein Krypto-Treffer */ }

    // 2. Aktien/ETFs: Alpha Vantage SYMBOL_SEARCH
    try {
      const response = await axios.get(ALPHA_VANTAGE_BASE, {
        params: { function: 'SYMBOL_SEARCH', keywords: q, apikey: ALPHA_VANTAGE_KEY },
        timeout: 10000
      })
      const matches = response.data?.bestMatches || []
      if (matches.length === 0 && ALPHA_VANTAGE_KEY === 'demo') {
        hint = 'Aktien-/ETF-Suche braucht einen kostenlosen Alpha-Vantage-Key (alphavantage.co) in .env.local - Krypto-Suche funktioniert ohne.'
      }
      matches.slice(0, 8).forEach((m: any) => {
        const type = (m['3. type'] || '').toLowerCase().includes('etf') ? 'etf' : 'stock'
        results.push({
          symbol: m['1. symbol'],
          name: m['2. name'],
          type,
          region: m['4. region'],
          currency: (m['8. currency'] === 'EUR' ? 'EUR' : 'USD')
        })
      })
    } catch {
      if (!hint) hint = 'Aktien-Suche derzeit nicht erreichbar (Alpha Vantage).'
    }

    return { results, hint }
  },

  /**
   * Fundamentaldaten automatisch laden (Alpha Vantage OVERVIEW).
   * Liefert vorformatierte Kennzahlen für das HKCM-Dashboard.
   */
  async fetchFundamentalsOverview(symbol: string): Promise<Record<string, string> | null> {
    try {
      const response = await axios.get(ALPHA_VANTAGE_BASE, {
        params: { function: 'OVERVIEW', symbol, apikey: ALPHA_VANTAGE_KEY },
        timeout: 12000
      })
      const d = response.data
      if (!d || !d.Symbol) return null

      const fmtMrd = (v: string) => {
        const n = parseFloat(v)
        if (!n) return ''
        return n >= 1e9 ? `${(n / 1e9).toFixed(1).replace('.', ',')} Mrd. $`
             : n >= 1e6 ? `${(n / 1e6).toFixed(0)} Mio. $` : v
      }
      const fmtPct = (v: string) => {
        const n = parseFloat(v)
        return isNaN(n) ? '' : `${(n * 100).toFixed(1).replace('.', ',')}%`
      }

      return {
        name: d.Name || '',
        beschreibung: d.Description || '',
        profil: [d.Sector, d.Industry].filter(Boolean).join(' · '),
        marktkapitalisierung: fmtMrd(d.MarketCapitalization),
        umsatz: fmtMrd(d.RevenueTTM) + (d.RevenueTTM ? ' (TTM)' : ''),
        umsatzwachstum: fmtPct(d.QuarterlyRevenueGrowthYOY) + (d.QuarterlyRevenueGrowthYOY ? ' YoY (Quartal)' : ''),
        bruttomarge: d.GrossProfitTTM && d.RevenueTTM
          ? `${((parseFloat(d.GrossProfitTTM) / parseFloat(d.RevenueTTM)) * 100).toFixed(1).replace('.', ',')}%` : '',
        operativeMarge: fmtPct(d.OperatingMarginTTM),
        kgv: d.PERatio && d.PERatio !== 'None' ? d.PERatio : '',
        kuv: d.PriceToSalesRatioTTM && d.PriceToSalesRatioTTM !== 'None' ? d.PriceToSalesRatioTTM : '',
        dividende: d.DividendYield && d.DividendYield !== 'None' && parseFloat(d.DividendYield) > 0
          ? fmtPct(d.DividendYield) : 'Keine'
      }
    } catch {
      return null
    }
  },

  /**
   * Wechselkurs-Überblick: EUR gegen USD/JPY/GBP/CHF (EZB, mit Vortagesvergleich)
   * und RUB (open.er-api.com, da die EZB seit 2022 keinen RUB-Referenzkurs stellt)
   */
  async getFxOverview(): Promise<FxRate[]> {
    const out: FxRate[] = []
    try {
      const [latest, week] = await Promise.all([
        axios.get('https://api.frankfurter.app/latest', { params: { from: 'EUR', to: 'USD,JPY,GBP,CHF' }, timeout: 8000 }),
        axios.get('https://api.frankfurter.app/latest', { params: { from: 'EUR', to: 'USD,JPY,GBP,CHF', base: 'EUR' }, timeout: 8000 }).catch(() => null)
      ])
      const prevResp = await axios.get(
        `https://api.frankfurter.app/${new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]}`,
        { params: { from: 'EUR', to: 'USD,JPY,GBP,CHF' }, timeout: 8000 }
      ).catch(() => null)
      const rates = latest.data?.rates || {}
      const prev = prevResp?.data?.rates || {}
      const labels: Record<string, string> = { USD: 'Dollar-Euro', JPY: 'Yen-Euro', GBP: 'Pfund-Euro', CHF: 'Franken-Euro' }
      Object.entries(rates).forEach(([cur, rate]: [string, any]) => {
        out.push({
          pair: `EUR/${cur}`, label: labels[cur] || cur, rate,
          changePercent: prev[cur] ? ((rate - prev[cur]) / prev[cur]) * 100 : null
        })
      })
      void week
    } catch { /* EZB nicht erreichbar */ }

    // RUB separat (kein EZB-Referenzkurs mehr)
    try {
      const resp = await axios.get('https://open.er-api.com/v6/latest/EUR', { timeout: 8000 })
      const rub = resp.data?.rates?.RUB
      if (rub) out.push({ pair: 'EUR/RUB', label: 'Rubel-Euro', rate: rub, changePercent: null })
    } catch { /* optional */ }

    return out
  },

  /** Leitindizes (USA/DE/JP/CN/RU/UK) via lokalen Server + Stooq */
  async getMarketIndices(): Promise<Array<{ symbol: string; name: string; country: string; flag: string; value: number | null; changePercent: number | null }>> {
    try {
      const resp = await axios.get('http://localhost:3777/markets', { timeout: 15000 })
      return resp.data?.indices || []
    } catch { return [] }
  },

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
    if (data) {
      const points = parseAlphaVantageData(data, asset.symbol)
      if (points.length > 0) return points.slice(-limit)
    }

    // Fallback: Stooq via lokalen Server (npm run webhooks) - kostenlos, ohne Key
    const stooq = await localStooqHistory(stooqSymbolFor(asset))
    if (stooq.length > 0) return stooq.slice(-limit)

    // Letzter Ausweg: Demo-Daten (deutlich als solche erkennbar)
    return this._generateDemoHistory(limit)
  },

  // Aktueller Kurs - echte Daten
  async getCurrentPrice(assetId: string): Promise<number> {
    const asset = ASSET_REGISTRY[assetId]
    if (!asset) return 0

    // Krypto: Binance Live-Preis, Fallback CoinGecko (falls Binance blockiert)
    if (asset.assetClass === 'crypto') {
      if (BINANCE_MAP[assetId]) {
        const price = await fetchBinancePrice(BINANCE_MAP[assetId])
        if (price > 0) return price
      }
      const cg = await coingeckoPrice(asset.symbol)
      if (cg > 0) return cg
    }

    const data = await fetchFromAlphaVantage(asset.symbol, 'TIME_SERIES_DAILY')
    const timeSeries = data?.['Time Series (Daily)']
    if (timeSeries) {
      const latestDate = Object.keys(timeSeries)[0]
      const price = parseFloat(timeSeries[latestDate]?.['4. close'])
      if (price > 0) return price
    }

    // Fallback: Stooq via lokalen Server
    const stooq = await localStooqHistory(stooqSymbolFor(asset))
    if (stooq.length > 0) return stooq[stooq.length - 1].close
    return 0
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
