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
  binanceSymbol?: string
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

export type PortfolioType = 'real' | 'test' | 'paper' | 'shadow'

export interface Position {
  id: string
  asset: Asset
  quantity: number
  buyPrice: number
  buyDate: Date
  buyFees: number
  currency: Currency
  portfolioType: PortfolioType
  entryThesis: string
  stopLoss: number
  profitTarget: number
  // Depotübertrag (§121)
  exchangeRateAtBuy?: number
  depotSource?: string
  transferDate?: Date
  plausibilityIssues?: string[]
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
  type: PortfolioType
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

// Ereignisprotokoll (§126)
export type EventType =
  | 'signal_erzeugt' | 'signal_blockiert' | 'warnung_ausgeloest'
  | 'stop_erreicht' | 'ziel_erreicht' | 'starke_bewegung'
  | 'news_erkannt' | 'scam_warnung' | 'datenfehler'
  | 'trade_ausgefuehrt' | 'trade_verworfen' | 'regelbruch'
  | 'steuerereignis' | 'gebuehrenaenderung' | 'testposition_angelegt'
  | 'modus_geaendert'

export interface EventLogEntry {
  id: string
  timestamp: Date
  type: EventType
  assetId?: string
  assetSymbol?: string
  message: string
  detail?: string
  markedAsFalseAlarm?: boolean
}

// Trade-Journal: brutale Ehrlichkeit gegenüber dem eigenen Verhalten
export type TradeEmotion = 'ruhig' | 'neutral' | 'gierig' | 'aengstlich' | 'fomo' | 'rache' | 'euphorie'

export interface JournalEntry {
  id: string
  createdAt: Date
  closedAt?: Date
  assetSymbol: string
  direction: 'long' | 'short'
  entryPrice: number
  exitPrice?: number
  quantity: number
  thesis: string
  emotion: TradeEmotion
  planFollowed?: boolean
  lessons?: string
  status: 'offen' | 'geschlossen'
  netResult?: number
}

// News-/Makro-Kalender (Ausbaustufe 0.4)
export type CalendarImportance = 'niedrig' | 'mittel' | 'hoch'

export interface CalendarEvent {
  id: string
  date: string // JJJJ-MM-TT
  title: string
  importance: CalendarImportance
  category: 'earnings' | 'zentralbank' | 'makro' | 'krypto' | 'sonstiges'
  assetSymbol?: string
  note?: string
}

// Fundamental-Dashboard nach HKCM-Deep-Dive-Vorlage
export type FundamentalVerdict = 'kaufenswert' | 'beobachten' | 'halten' | 'meiden' | 'offen'

export interface FundamentalData {
  assetId: string
  updatedAt: Date
  // Investmentpass
  profil: string              // z.B. "Fintech-Plattform"
  bewertungLabel: string      // z.B. "fair bis attraktiv"
  these: string               // Investmentthese in einem Satz
  ersteinschaetzung: string   // Ersteinschaetzung / Fazit
  // Kennzahlen (als formatierte Strings, Quelle egal: API oder manuell)
  marktkapitalisierung?: string
  umsatz?: string
  umsatzwachstum?: string
  bruttomarge?: string
  operativeMarge?: string
  freeCashflow?: string
  liquiditaet?: string
  kgv?: string
  kuv?: string
  dividende?: string
  // Qualitative Abschnitte (HKCM-Fragenlogik)
  geschaeftsmodell: string    // Wie verdient X Geld?
  burggraben: string          // Warum gewinnt X?
  wachstumstreiber: string    // Woher kommt zukuenftiges Wachstum?
  chancen: string[]
  risiken: string[]
  urteil: FundamentalVerdict
  quellen?: string
}

// Tranchenplan: gestaffelter Ein- und Ausstieg
export interface Tranche {
  price: number
  percent: number // Anteil an der Gesamtposition in %
}

export interface TranchePlan {
  id: string
  createdAt: Date
  assetSymbol: string
  direction: 'long' | 'short'
  totalCapital: number
  stopPrice: number
  entries: Tranche[]
  exits: Tranche[]
  note?: string
}

// Preis-Alerts: Alarm-Level je Asset
export interface PriceAlert {
  id: string
  assetId: string
  assetSymbol: string
  price: number
  direction: 'ueber' | 'unter'
  active: boolean
  createdAt: Date
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

// Konfigurierbare Warnschwellen (§129.3)
export interface WarningThresholds {
  strongMovePercent: number
  volumeSpikeRatio: number
  stopProximityPercent: number
  gapPercent: number
  staleDataMinutes: number
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
  riskOffMode: boolean
  learningHints: boolean
  warningThresholds: WarningThresholds
  bafinWatchlist: string[]
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
