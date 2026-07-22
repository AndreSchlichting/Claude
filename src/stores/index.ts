import { defineStore } from 'pinia'
import { PaperBroker } from '../services/paperBroker'
import { apiService } from '../services/api'
import { ref, computed, watch } from 'vue'
import type { Asset, Portfolio, Position, Settings, Currency, Analysis, WarningEvent, Transaction, EventLogEntry, EventType, JournalEntry, PriceAlert, CalendarEvent, TranchePlan, FundamentalData } from '../types'

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
  const journal = ref<JournalEntry[]>([])
  const priceAlerts = ref<PriceAlert[]>([])
  const watchlist = ref<string[]>([])
  const calendarEvents = ref<CalendarEvent[]>([])
  const tranchePlans = ref<TranchePlan[]>([])
  const fundamentals = ref<Record<string, FundamentalData>>({})
  // Echter EUR/USD-Kurs (EZB via frankfurter.app), wird beim Start geladen
  const usdPerEur = ref(1.09)
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
    if (assets.value.some(a => a.id === asset.id)) return
    assets.value.push(asset)
    apiService.registerDynamicAsset(asset)
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

  // --- Trade-Journal ---
  const addJournalEntry = (entry: JournalEntry) => {
    journal.value.unshift(entry)
    logEvent('trade_ausgefuehrt', `Journal: ${entry.direction} ${entry.assetSymbol} @ ${entry.entryPrice}`,
      { assetSymbol: entry.assetSymbol, detail: `Emotion: ${entry.emotion}` })
  }

  const closeJournalEntry = (id: string, exitPrice: number, planFollowed: boolean, lessons?: string) => {
    const entry = journal.value.find(j => j.id === id)
    if (!entry) return
    entry.exitPrice = exitPrice
    entry.closedAt = new Date()
    entry.status = 'geschlossen'
    entry.planFollowed = planFollowed
    entry.lessons = lessons
    const sign = entry.direction === 'long' ? 1 : -1
    entry.netResult = (exitPrice - entry.entryPrice) * entry.quantity * sign
  }

  // --- Preis-Alerts ---
  const addPriceAlert = (alert: PriceAlert) => {
    priceAlerts.value.push(alert)
  }

  const removePriceAlert = (id: string) => {
    priceAlerts.value = priceAlerts.value.filter(a => a.id !== id)
  }

  /** Prüft alle aktiven Alerts gegen aktuelle Kurse - wird von Scanner & Daytrading aufgerufen */
  const checkPriceAlerts = () => {
    priceAlerts.value.filter(a => a.active).forEach(alert => {
      const asset = assets.value.find(a => a.id === alert.assetId)
      if (!asset || asset.currentPrice <= 0) return
      const triggered = alert.direction === 'ueber'
        ? asset.currentPrice >= alert.price
        : asset.currentPrice <= alert.price
      if (triggered) {
        alert.active = false
        addWarning({
          id: `warn_alert_${alert.id}`, timestamp: new Date(), assetId: alert.assetId,
          level: 'orange', type: 'Preis-Alert',
          message: `${alert.assetSymbol}: Alarm-Level ${alert.price} ${alert.direction === 'ueber' ? 'überschritten' : 'unterschritten'} (aktuell ${asset.currentPrice.toFixed(2)})`,
          isResolved: false
        })
        logEvent('warnung_ausgeloest', `Preis-Alert ausgelöst: ${alert.assetSymbol} ${alert.direction} ${alert.price}`,
          { assetId: alert.assetId, assetSymbol: alert.assetSymbol })
      }
    })
  }

  /** Paper-Broker (3.0): faellige Stops/Ziele automatisch ausfuehren */
  const settlePaperPositions = () => {
    const fills = PaperBroker.settle(portfolios.value, settings.value)
    fills.forEach(fill => {
      transactions.value.push(fill.transaction)
      logEvent(fill.eventType, fill.message,
        { assetId: fill.position.asset.id, assetSymbol: fill.position.asset.symbol })
      addWarning({
        id: `warn_fill_${fill.transaction.id}`, timestamp: new Date(),
        assetId: fill.position.asset.id,
        level: fill.reason === 'stop' ? 'orange' : 'green',
        type: fill.reason === 'stop' ? 'Stop ausgefuehrt' : 'Ziel erreicht',
        message: fill.message, isResolved: false
      })
    })
    return fills.length
  }

  // --- Kalender (Ausbaustufe 0.4) ---
  const addCalendarEvent = (event: CalendarEvent) => {
    calendarEvents.value.push(event)
    calendarEvents.value.sort((a, b) => a.date.localeCompare(b.date))
    logEvent('news_erkannt', `Termin eingetragen: ${event.title} am ${event.date}`,
      { assetSymbol: event.assetSymbol })
  }

  const removeCalendarEvent = (id: string) => {
    calendarEvents.value = calendarEvents.value.filter(e => e.id !== id)
  }

  /** Termine in den nächsten X Tagen (für Warnungen und Positionsgrößen-Hinweise) */
  const upcomingEvents = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    return calendarEvents.value.filter(e => e.date >= today && e.date <= inSevenDays)
  })

  // --- Tranchenpläne ---
  const addTranchePlan = (plan: TranchePlan) => {
    tranchePlans.value.unshift(plan)
    logEvent('signal_erzeugt', `Tranchenplan angelegt: ${plan.assetSymbol} (${plan.entries.length} Einstiege, ${plan.exits.length} Ausstiege)`,
      { assetSymbol: plan.assetSymbol })
  }

  const removeTranchePlan = (id: string) => {
    tranchePlans.value = tranchePlans.value.filter(p => p.id !== id)
  }

  // --- Fundamentaldaten (HKCM-Dashboard) ---
  const setFundamentals = (data: FundamentalData) => {
    fundamentals.value[data.assetId] = data
    logEvent('signal_erzeugt', `Fundamental-Dashboard aktualisiert: ${data.assetId}`,
      { assetId: data.assetId })
  }

  // --- Währungsumrechnung ---
  const setUsdPerEur = (rate: number) => {
    if (rate > 0) usdPerEur.value = rate
  }

  /** Rechnet einen Betrag aus seiner Ursprungswährung in die aktive Währung um */
  const convertToActive = (amount: number, from: Currency): number => {
    const to = selectedCurrency.value
    if (from === to) return amount
    return from === 'EUR' ? amount * usdPerEur.value : amount / usdPerEur.value
  }

  /** Formatiert einen Betrag in der aktiven Währung (mit echter Umrechnung) */
  const formatInActive = (amount: number, from: Currency): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: selectedCurrency.value
    }).format(convertToActive(amount, from))
  }

  // --- Watchlist ---
  const toggleWatchlist = (assetId: string) => {
    if (watchlist.value.includes(assetId)) {
      watchlist.value = watchlist.value.filter(id => id !== assetId)
    } else {
      watchlist.value.push(assetId)
    }
  }

  // --- Persistenz: Zustand überlebt Neuladen der Seite ---
  const loadPersisted = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw, dateReviver)
      if (data.portfolios) portfolios.value = data.portfolios
      if (data.eventLog) eventLog.value = data.eventLog
      if (data.journal) journal.value = data.journal
      if (data.priceAlerts) priceAlerts.value = data.priceAlerts
      if (data.watchlist) watchlist.value = data.watchlist
      if (data.calendarEvents) calendarEvents.value = data.calendarEvents
      if (data.tranchePlans) tranchePlans.value = data.tranchePlans
      if (data.fundamentals) fundamentals.value = data.fundamentals
      if (data.assets) {
        assets.value = data.assets
        // Gespeicherte Assets wieder im API-Register anmelden (fuer Kursabruf)
        assets.value.forEach(a => apiService.registerDynamicAsset(a))
      }
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
        journal: journal.value,
        priceAlerts: priceAlerts.value,
        watchlist: watchlist.value,
        calendarEvents: calendarEvents.value,
        tranchePlans: tranchePlans.value,
        fundamentals: fundamentals.value,
        assets: assets.value.map(a => ({ ...a, priceHistory: [] })),
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
  watch([portfolios, eventLog, transactions, analyses, warningEvents, settings, selectedCurrency, selectedLanguage, journal, priceAlerts, watchlist, calendarEvents, tranchePlans, fundamentals, assets],
    persist, { deep: true })

  return {
    // State
    assets,
    portfolios,
    analyses,
    warningEvents,
    eventLog,
    journal,
    priceAlerts,
    watchlist,
    calendarEvents,
    tranchePlans,
    fundamentals,
    upcomingEvents,
    usdPerEur,
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
    markEventAsFalseAlarm,
    addJournalEntry,
    closeJournalEntry,
    addPriceAlert,
    removePriceAlert,
    checkPriceAlerts,
    toggleWatchlist,
    addCalendarEvent,
    removeCalendarEvent,
    addTranchePlan,
    removeTranchePlan,
    setFundamentals,
    setUsdPerEur,
    convertToActive,
    formatInActive,
    settlePaperPositions
  }
})
