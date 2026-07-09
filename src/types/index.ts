// Asset Types
export type AssetClass = 'stock' | 'crypto' | 'etf' | 'index'
export type TradingMode = 'daytrading' | 'swing' | 'investment'
export type Currency = 'USD' | 'EUR'
export type WarningLevel = 'green' | 'yellow' | 'orange' | 'red' | 'black'
export type DecisionType = 'buy' | 'buy_on_trigger' | 'hold' | 'watch' | 'sell' | 'finger_weg' | 'scam' | 'unclear'

export interface Asset {
  id: string
  name: string
  symbol: string
  isin?: string
  assetClass: AssetClass
  currentPrice: number
  currency: Currency
  exchange?: string
  lastUpdated: Date
  priceHistory?: PricePoint[]
}

export interface PricePoint {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  interval: string
}

export interface Position {
  id: string
  asset: Asset
  quantity: number
  buyPrice: number
  buyDate: Date
  buyFees: number
  currency: Currency
  portfolioType: 'real' | 'test' | 'paper'
  entryThesis: string
  stopLoss: number
  profitTarget: number
}

export interface Analysis {
  id: string
  assetId: string
  tradingMode: TradingMode
  timestamp: Date

  // Fundamentals
  thesisTitle: string
  marketPhase: string
  technicalOutlook: string
  fundamentalOutlook?: string
  newsOutlook?: string
  volumeOutlook: string

  // Entry & Exit
  entryThesis: string
  exitThesis: string
  invalidityCondition: string
  counterArguments: string[]

  // Risk & Reward
  stopLevel: number
  profitTarget: number
  chanceRiskRatio: number
  confidence: number // 0-100

  // Decision
  decision: DecisionType
  decisionReason: string
  trigger?: string

  // Scenarios
  bullishScenario: Scenario
  neutralScenario: Scenario
  bearishScenario: Scenario
  stressScenario: Scenario
  invalidityScenario: Scenario

  // Risk Assessment
  warningLevel: WarningLevel
  warningReasons: string[]
}

export interface Scenario {
  description: string
  conditions: string[]
  consequences: string[]
  probability?: number // 0-100
}

export interface Portfolio {
  id: string
  name: string
  type: 'real' | 'test' | 'paper'
  positions: Position[]
  totalValue: number
  totalCost: number
  realizedGainLoss: number
  unrealizedGainLoss: number
  currency: Currency
}

export interface Transaction {
  id: string
  portfolioId: string
  assetId: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  fees: number
  taxes: number
  currency: Currency
  date: Date
  note?: string
}

export interface WarningEvent {
  id: string
  timestamp: Date
  assetId: string
  level: WarningLevel
  type: string
  message: string
  details?: Record<string, any>
  isResolved: boolean
}

export interface TaxAssumption {
  country: string
  capitalGainsTax: number
  solidarityTax: number
  churchTax: boolean
  sparerPauschbetrag: number
  etfPartialExemption?: number
  cryptoHoldingPeriod: number
}

export interface FeeProfile {
  name: string
  buyFee: number
  sellFee: number
  percentageFee?: number
  minFee: number
  spreadAssumption: number
  slippageAssumption: number
  foreignCurrencyFee: number
}

export interface Settings {
  language: 'de' | 'en'
  currency: Currency
  tradingMode: TradingMode
  theme: 'light' | 'dark' | 'auto'
  riskPerTrade: number
  dailyLossLimit: number
  weeklyLossLimit: number
  monthlyLossLimit: number
  maxCryptoQuota: number
  maxPositionSize: number
  maxOpenTrades: number
  brutalSuccessModeEnabled: boolean
  acousticWarningsEnabled: boolean
  feeProfile: FeeProfile
  taxAssumption: TaxAssumption
  soundVolume: number
  dataRefreshInterval: number
}

export interface Signal {
  id: string
  assetId: string
  timestamp: Date
  tradingMode: TradingMode
  signalType: string
  strength: number // 0-100
  price: number
  recommendation: DecisionType
  confidence: number
}
