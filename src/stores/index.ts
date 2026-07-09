import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Asset, Portfolio, Position, Settings, Currency, Analysis, WarningEvent, Transaction } from '../types'

export const useAppStore = defineStore('app', () => {
  // State
  const assets = ref<Asset[]>([])
  const portfolios = ref<Portfolio[]>([])
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

  return {
    // State
    assets,
    portfolios,
    analyses,
    warningEvents,
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
    updateSettings
  }
})
