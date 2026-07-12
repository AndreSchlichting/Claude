import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Asset, Portfolio, Position, Settings, Currency, Analysis, WarningEvent, Transaction, EventLogEntry, EventType } from '../types'

const STORAGE_KEY = 'tdl_state_v1'

// JSON-Reviver: ISO-Datumsstrings zurück in Date-Objekte wandeln
const dateReviver = (_key: string, value: any) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value)
  }
  return value
}

const emptyPortfolio = (id: string, name: string, type: Portfolio['type']): Portfolio => ({
  id, name, type,
  positions: [],
  totalValue: 0,
  totalCost: 0,
  realizedGainLoss: 0,
  unrealizedGainLoss: 0,
  currency: 'EUR'
})

export const useAppStore = defineStore('app', () => {
  // State
  const assets = ref<Asset[]>([])
  // Portfolioarten nach §120.2: echt, Test, Paper, Shadow
  const portfolios = ref<Portfolio[]>([
    emptyPortfolio('pf_real', 'Echtes Portfolio', 'real'),
    emptyPortfolio('pf_test', 'Testportfolio', 'test'),
    emptyPortfolio('pf_paper', 'Paper Trading', 'paper'),
    emptyPortfolio('pf_shadow', 'Shadow Portfolio', 'shadow')
  ])
  const eventLog = ref<EventLogEntry[]>([])
  const analyses = ref<Analysis[]>([])
  const warningEvents = ref<WarningEvent[]>([])
  const transactions = ref<Transaction[]>([])
  const selectedCurrency = ref<Currency>('EUR')
  const selectedLanguage = ref<'de' | 'en'>('de')
  const settings = ref<Settings>({
    language: 'de',
    currency: 'EUR',
    tradingMode: 'daytrading',
    theme: 'light',
    riskPerTrade: 1,
    dailyLossLimit: 500,
    weeklyLossLimit: 2000,
    monthlyLossLimit: 5000,
    maxCryptoQuota: 20,
    maxPositionSize: 10,
    maxOpenTrades: 5,
    brutalSuccessModeEnabled: true,
    acousticWarningsEnabled: false,
    riskOffMode: false,
    learningHints: true,
    warningThresholds: {
      strongMovePercent: 3.0,
      volumeSpikeRatio: 2.4,
      stopProximityPercent: 1.5,
      gapPercent: 2.0,
      staleDataMinutes: 30
    },
    bafinWatchlist: [],
    soundVolume: 50,
    dataRefreshInterval: 30000,
    feeProfile: {
      name: 'Trade Republic',
      buyFee: 1,
      sellFee: 1,
      minFee: 1,
      spreadAssumption: 0.15,
      slippageAssumption: 0.1,
      foreignCurrencyFee: 0.25
    },
    taxAssumption: {
      country: 'DE',
      capitalGainsTax: 26.375,
      solidarityTax: 5.5,
      churchTax: false,
      sparerPauschbetrag: 1000,
      cryptoHoldingPeriod: 365
    }
  })

  // Computed
  const activeCurrency = computed(() => selectedCurrency.value)
  const activeLanguage = computed(() => selectedLanguage.value)
  const totalPortfolioValue = computed(() => {
    return portfolios.value.reduce((sum, p) => sum + p.totalValue, 0)
  })
  const totalPortfolioCost = computed(() => {
    return portfolios.value.reduce((sum, p) => sum + p.totalCost, 0)
  })
  const totalGainLoss = computed(() => {
    return portfolios.value.reduce((sum, p) => sum + (p.realizedGainLoss + p.unrealizedGainLoss), 0)
  })
  const activeWarnings = computed(() => {
    return warningEvents.value.filter(w => !w.isResolved)
  })

  // Actions
  const addAsset = (asset: Asset) => {
    assets.value.push(asset)
  }

  const updateAsset = (assetId: string, updates: Partial<Asset>) => {
    const asset = assets.value.find(a => a.id === assetId)
    if (asset) {
      Object.assign(asset, updates)
    }
  }

  const addPosition = (portfolioId: string, position: Position) => {
    const portfolio = portfolios.value.find(p => p.id === portfolioId)
    if (portfolio) {
      portfolio.positions.push(position)
    }
  }

  const setCurrency = (currency: Currency) => {
    selectedCurrency.value = currency
    settings.value.currency = currency
  }

  const setLanguage = (language: 'de' | 'en') => {
    selectedLanguage.value = language
    settings.value.language = language
  }

  const addAnalysis = (analysis: Analysis) => {
    analyses.value.push(analysis)
  }

  const addWarning = (warning: WarningEvent) => {
    warningEvents.value.push(warning)
  }

  const resolveWarning = (warningId: string) => {
    const warning = warningEvents.value.find(w => w.id === warningId)
    if (warning) {
      warning.isResolved = true
    }
  }

  const addTransaction = (transaction: Transaction) => {
    transactions.value.push(transaction)
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    Object.assign(settings.value, newSettings)
  }

  // Ereignisprotokoll (§126): jede Warnung und jedes Signal wird gespeichert
  const logEvent = (type: EventType, message: string, opts?: { assetId?: string; assetSymbol?: string; detail?: string }) => {
    eventLog.value.unshift({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
      type,
      message,
      assetId: opts?.assetId,
      assetSymbol: opts?.assetSymbol,
      detail: opts?.detail
    })
    // Protokoll auf 500 Einträge begrenzen
    if (eventLog.value.length > 500) {
      eventLog.value = eventLog.value.slice(0, 500)
    }
  }

  const markEventAsFalseAlarm = (eventId: string) => {
    const event = eventLog.value.find(e => e.id === eventId)
    if (event) event.markedAsFalseAlarm = true
  }

  // --- Persistenz: Zustand überlebt Neuladen der Seite ---
  const loadPersisted = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw, dateReviver)
      if (data.portfolios) portfolios.value = data.portfolios
      if (data.eventLog) eventLog.value = data.eventLog
      if (data.transactions) transactions.value = data.transactions
      if (data.analyses) analyses.value = data.analyses
      if (data.warningEvents) warningEvents.value = data.warningEvents
      if (data.settings) Object.assign(settings.value, data.settings)
      if (data.selectedCurrency) selectedCurrency.value = data.selectedCurrency
      if (data.selectedLanguage) selectedLanguage.value = data.selectedLanguage
    } catch (e) {
      console.warn('Persistenz: Laden fehlgeschlagen', e)
    }
  }

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        portfolios: portfolios.value,
        eventLog: eventLog.value.slice(0, 300),
        transactions: transactions.value,
        analyses: analyses.value.slice(0, 100),
        warningEvents: warningEvents.value.slice(-100),
        settings: settings.value,
        selectedCurrency: selectedCurrency.value,
        selectedLanguage: selectedLanguage.value
      }))
    } catch (e) {
      console.warn('Persistenz: Speichern fehlgeschlagen', e)
    }
  }

  loadPersisted()
  watch([portfolios, eventLog, transactions, analyses, warningEvents, settings, selectedCurrency, selectedLanguage],
    persist, { deep: true })

  return {
    // State
    assets,
    portfolios,
    analyses,
    warningEvents,
    eventLog,
    transactions,
    selectedCurrency,
    selectedLanguage,
    settings,

    // Computed
    activeCurrency,
    activeLanguage,
    totalPortfolioValue,
    totalPortfolioCost,
    totalGainLoss,
    activeWarnings,

    // Actions
    addAsset,
    updateAsset,
    addPosition,
    setCurrency,
    setLanguage,
    addAnalysis,
    addWarning,
    resolveWarning,
    addTransaction,
    updateSettings,
    logEvent,
    markEventAsFalseAlarm
  }
})
