/**
 * Eingebauter Asset-Katalog: bekannte Aktien, ETFs, Indizes und Kryptos.
 * Liefert Vorschläge auch bei Tippfehlern (Fuzzy-Suche) - unabhängig von APIs.
 * Erweiterbar: einfach Einträge ergänzen.
 */
export interface CatalogEntry {
  symbol: string
  name: string
  type: 'stock' | 'etf' | 'crypto' | 'index'
  isin?: string
  currency: 'USD' | 'EUR'
  exchange?: string
  binanceSymbol?: string
  keywords?: string[]   // alternative Schreibweisen
}

export const ASSET_CATALOG: CatalogEntry[] = [
  // --- US-Aktien ---
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', isin: 'US0378331005', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', isin: 'US5949181045', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'Nvidia Corporation', type: 'stock', isin: 'US67066G1040', currency: 'USD', exchange: 'NASDAQ', keywords: ['nvidea'] },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', type: 'stock', isin: 'US02079K3059', currency: 'USD', exchange: 'NASDAQ', keywords: ['google'] },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', isin: 'US0231351067', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms (Facebook)', type: 'stock', isin: 'US30303M1027', currency: 'USD', exchange: 'NASDAQ', keywords: ['facebook'] },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', isin: 'US88160R1014', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway B', type: 'stock', isin: 'US0846707026', currency: 'USD', exchange: 'NYSE', keywords: ['berkshire', 'buffett'] },
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', isin: 'US46625H1005', currency: 'USD', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', type: 'stock', isin: 'US92826C8394', currency: 'USD', exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', isin: 'US4781601046', currency: 'USD', exchange: 'NYSE' },
  { symbol: 'KO', name: 'Coca-Cola Company', type: 'stock', isin: 'US1912161007', currency: 'USD', exchange: 'NYSE', keywords: ['cocacola', 'coca cola'] },
  { symbol: 'MCD', name: "McDonald's Corporation", type: 'stock', isin: 'US5801351017', currency: 'USD', exchange: 'NYSE', keywords: ['mcdonalds'] },
  { symbol: 'DIS', name: 'Walt Disney Company', type: 'stock', isin: 'US2546871060', currency: 'USD', exchange: 'NYSE', keywords: ['disney'] },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', isin: 'US64110L1061', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', isin: 'US0079031078', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corporation', type: 'stock', isin: 'US4581401001', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'XYZ', name: 'Block Inc. (Square)', type: 'stock', isin: 'US8522341036', currency: 'USD', exchange: 'NYSE', keywords: ['square', 'block'] },
  { symbol: 'BABA', name: 'Alibaba Group (ADR)', type: 'stock', isin: 'US01609W1027', currency: 'USD', exchange: 'NYSE', keywords: ['alibaba'] },
  { symbol: 'UAA', name: 'Under Armour Inc.', type: 'stock', isin: 'US9043111072', currency: 'USD', exchange: 'NYSE', keywords: ['under armour', 'underarmor'] },
  { symbol: 'PLTR', name: 'Palantir Technologies', type: 'stock', isin: 'US69608A1088', currency: 'USD', exchange: 'NASDAQ' },
  { symbol: 'PYPL', name: 'PayPal Holdings', type: 'stock', isin: 'US70450Y1038', currency: 'USD', exchange: 'NASDAQ' },
  // --- Deutsche Aktien ---
  { symbol: 'SAP', name: 'SAP SE', type: 'stock', isin: 'DE0007164600', currency: 'EUR', exchange: 'XETRA' },
  { symbol: 'SIE', name: 'Siemens AG', type: 'stock', isin: 'DE0007236101', currency: 'EUR', exchange: 'XETRA', keywords: ['siemens'] },
  { symbol: 'ALV', name: 'Allianz SE', type: 'stock', isin: 'DE0008404005', currency: 'EUR', exchange: 'XETRA', keywords: ['allianz'] },
  { symbol: 'BMW', name: 'BMW AG', type: 'stock', isin: 'DE0005190003', currency: 'EUR', exchange: 'XETRA' },
  { symbol: 'MBG', name: 'Mercedes-Benz Group', type: 'stock', isin: 'DE0007100000', currency: 'EUR', exchange: 'XETRA', keywords: ['mercedes', 'daimler'] },
  { symbol: 'VOW3', name: 'Volkswagen AG Vz.', type: 'stock', isin: 'DE0007664039', currency: 'EUR', exchange: 'XETRA', keywords: ['volkswagen', 'vw'] },
  { symbol: 'BAS', name: 'BASF SE', type: 'stock', isin: 'DE000BASF111', currency: 'EUR', exchange: 'XETRA', keywords: ['basf'] },
  { symbol: 'DTE', name: 'Deutsche Telekom', type: 'stock', isin: 'DE0005557508', currency: 'EUR', exchange: 'XETRA', keywords: ['telekom'] },
  { symbol: 'RHM', name: 'Rheinmetall AG', type: 'stock', isin: 'DE0007030009', currency: 'EUR', exchange: 'XETRA', keywords: ['rheinmetall'] },
  { symbol: 'DBK', name: 'Deutsche Bank AG', type: 'stock', isin: 'DE0005140008', currency: 'EUR', exchange: 'XETRA' },
  // --- ETFs ---
  { symbol: 'EUNL', name: 'iShares Core MSCI World ETF', type: 'etf', isin: 'IE00B4L5Y983', currency: 'EUR', exchange: 'XETRA', keywords: ['msci world', 'ishares world'] },
  { symbol: 'VWCE', name: 'Vanguard FTSE All-World ETF', type: 'etf', isin: 'IE00BK5BQT80', currency: 'EUR', exchange: 'XETRA', keywords: ['vanguard all world'] },
  { symbol: 'SXR8', name: 'iShares Core S&P 500 ETF', type: 'etf', isin: 'IE00B5BMR087', currency: 'EUR', exchange: 'XETRA', keywords: ['s&p 500 etf', 'sp500'] },
  { symbol: 'EXS1', name: 'iShares Core DAX ETF', type: 'etf', isin: 'DE0005933931', currency: 'EUR', exchange: 'XETRA', keywords: ['dax etf'] },
  { symbol: 'QQQ', name: 'Invesco Nasdaq-100 ETF', type: 'etf', isin: 'US46090E1038', currency: 'USD', exchange: 'NASDAQ', keywords: ['nasdaq etf'] },
  // --- Kryptowährungen ---
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', currency: 'USD', binanceSymbol: 'BTCUSDT', keywords: ['bitcoin'] },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', currency: 'USD', binanceSymbol: 'ETHUSDT', keywords: ['ethereum', 'ether'] },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', currency: 'USD', binanceSymbol: 'SOLUSDT' },
  { symbol: 'XRP', name: 'XRP (Ripple)', type: 'crypto', currency: 'USD', binanceSymbol: 'XRPUSDT', keywords: ['ripple'] },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', currency: 'USD', binanceSymbol: 'ADAUSDT' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', currency: 'USD', binanceSymbol: 'DOGEUSDT' },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto', currency: 'USD', binanceSymbol: 'DOTUSDT' },
  { symbol: 'LTC', name: 'Litecoin', type: 'crypto', currency: 'USD', binanceSymbol: 'LTCUSDT' },
  { symbol: 'LINK', name: 'Chainlink', type: 'crypto', currency: 'USD', binanceSymbol: 'LINKUSDT' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto', currency: 'USD', binanceSymbol: 'AVAXUSDT' }
]

/** Einfache Ähnlichkeit (Levenshtein-Distanz, für Tippfehler-Toleranz) */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length
  if (Math.abs(m - n) > 3) return 99
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[m][n]
}

/**
 * Fuzzy-Suche im Katalog: findet Treffer auch bei ungenauer Schreibweise.
 * Score: exakt > beginnt mit > enthält > ähnlich (Tippfehler).
 */
export function searchCatalog(query: string, limit = 8): CatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const scored = ASSET_CATALOG.map(entry => {
    const targets = [entry.symbol.toLowerCase(), entry.name.toLowerCase(), ...(entry.keywords || [])]
    let score = 0
    for (const t of targets) {
      if (t === q) score = Math.max(score, 100)
      else if (t.startsWith(q)) score = Math.max(score, 80)
      else if (t.includes(q)) score = Math.max(score, 60)
      else {
        // Tippfehler-Toleranz auf Wortebene
        for (const word of t.split(/\s+/)) {
          const d = editDistance(q, word)
          if (d <= 2 && q.length >= 4) score = Math.max(score, 50 - d * 10)
        }
      }
    }
    return { entry, score }
  })

  return scored.filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry)
}
