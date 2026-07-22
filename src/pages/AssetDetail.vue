<template>
  <div v-if="asset" class="space-y-3">
    <!-- Header -->
    <div class="card flex justify-between items-start">
      <div>
        <h1 class="text-xl font-bold">{{ asset.name }}</h1>
        <p class="text-gray-600 dark:text-gray-400">{{ asset.symbol }} • {{ asset.assetClass }}</p>
      </div>
      <div class="text-right">
        <p class="text-4xl font-bold">{{ store.formatInActive(asset.currentPrice, asset.currency) }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Originalwährung: {{ asset.currency }}</p>
      </div>
    </div>

    <!-- Kurs in € und US-$ (echte EZB-Umrechnung) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card border-2" :class="store.activeCurrency === 'EUR' ? 'border-primary' : 'border-gray-200 dark:border-gray-700 opacity-50'">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Kurs in €</p>
        <p class="text-2xl font-bold">
          € {{ priceInEur.toFixed(2) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Aktueller Kurs in Euro</p>
      </div>
      <div class="card border-2" :class="store.activeCurrency === 'USD' ? 'border-primary' : 'border-gray-200 dark:border-gray-700 opacity-50'">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Kurs in US-$</p>
        <p class="text-2xl font-bold">
          $ {{ priceInUsd.toFixed(2) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Aktueller Kurs in US-Dollar</p>
      </div>
    </div>
    <p class="text-xs text-gray-500 -mt-3 px-1">
      EZB-Referenzkurs: 1 € = {{ store.usdPerEur.toFixed(4) }} $ (frankfurter.app)
    </p>

    <!-- Kerzenchart (rot/grün) - Kerzen in der AKTIVEN Währung umgerechnet -->
    <CandleChart
      v-if="convertedHistory.length > 0"
      :priceHistory="convertedHistory"
      :title="`${asset?.symbol} - Kerzenchart in ${store.activeCurrency === 'EUR' ? '€' : 'US-$'}`"
    />

    <!-- Fundamental-Dashboard (HKCM-Vorlage) -->
    <FundamentalDashboard v-if="asset" :asset="asset" />

    <!-- Preis-Alerts -->
    <div class="card">
      <h2 class="text-lg font-bold mb-3">🔔 Preis-Alerts</h2>
      <div class="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Alarm-Level</label>
          <input v-model.number="newAlertPrice" type="number" step="0.01" class="input-field w-32" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Richtung</label>
          <select v-model="newAlertDirection" class="input-field">
            <option value="ueber">Kurs steigt über</option>
            <option value="unter">Kurs fällt unter</option>
          </select>
        </div>
        <button @click="addAlert" :disabled="!newAlertPrice" class="btn btn-primary disabled:opacity-50">
          Alert setzen
        </button>
      </div>
      <div v-if="assetAlerts.length > 0" class="space-y-2">
        <div v-for="alert in assetAlerts" :key="alert.id"
          class="flex justify-between items-center p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-sm">
          <span :class="alert.active ? '' : 'line-through opacity-50'">
            {{ alert.direction === 'ueber' ? '↗ über' : '↘ unter' }} {{ alert.price.toFixed(2) }}
            <span v-if="!alert.active" class="text-xs text-orange-600 ml-2">ausgelöst</span>
          </span>
          <button @click="store.removePriceAlert(alert.id)" class="text-gray-400 hover:text-red-500">✕</button>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500">Keine Alerts gesetzt. Alerts werden beim Scannen und Laden geprüft.</p>
    </div>

    <!-- Current Analysis -->
    <div v-if="currentAnalysis" class="card border-l-4" :class="[
      currentAnalysis.warningLevel === 'green' ? 'border-green-500' :
      currentAnalysis.warningLevel === 'yellow' ? 'border-yellow-500' :
      currentAnalysis.warningLevel === 'red' ? 'border-red-500' : 'border-gray-300'
    ]">
      <h2 class="text-lg font-bold mb-4">Aktuelle Analyse</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div class="mb-4">
            <span class="inline-block px-3 py-1 rounded-full text-sm font-medium"
              :class="[
                currentAnalysis.warningLevel === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                currentAnalysis.warningLevel === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                currentAnalysis.warningLevel === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              ]">
              {{ currentAnalysis.warningLevel.toUpperCase() }}
            </span>
          </div>
          <p class="font-bold text-lg mb-2">{{ currentAnalysis.thesisTitle }}</p>
          <p class="text-gray-700 dark:text-gray-300 text-sm">{{ currentAnalysis.entryThesis }}</p>
        </div>
        <div class="space-y-3">
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p class="text-sm text-gray-600 dark:text-gray-400">Entry Stop</p>
            <p class="font-bold">{{ formatPrice(currentAnalysis.stopLevel) }} / {{ formatPrice(currentAnalysis.profitTarget) }}</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p class="text-sm text-gray-600 dark:text-gray-400">Chance-Risiko</p>
            <p class="font-bold">{{ currentAnalysis.chanceRiskRatio.toFixed(2) }}:1</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p class="text-sm text-gray-600 dark:text-gray-400">Konfidenz</p>
            <p class="font-bold">{{ currentAnalysis.confidence }}%</p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p class="text-sm text-gray-600 dark:text-gray-400">Entscheidung</p>
            <p class="font-bold capitalize">{{ currentAnalysis.decision }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Positions -->
    <div v-if="positions.length > 0" class="card">
      <h2 class="text-lg font-bold mb-4">Positionen</h2>
      <div class="space-y-3">
        <div
          v-for="position in positions"
          :key="position.id"
          class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div class="flex justify-between items-start">
            <div>
              <p class="font-bold">{{ position.quantity }} Stücke</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Kaufpreis: {{ formatPrice(position.buyPrice) }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatTime(position.buyDate) }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold">{{ formatPrice(position.quantity * asset.currentPrice) }}</p>
              <p :class="[
                'text-sm font-medium',
                (position.quantity * asset.currentPrice - position.quantity * position.buyPrice) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              ]">
                {{ formatPrice(position.quantity * asset.currentPrice - position.quantity * position.buyPrice) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="card text-center py-8">
    <p class="text-gray-600 dark:text-gray-400">Asset nicht gefunden</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import CandleChart from '../components/CandleChart.vue'
import FundamentalDashboard from '../components/FundamentalDashboard.vue'

const route = useRoute()
const store = useAppStore()

const loading = ref(true)

// Echte EUR/USD-Umrechnung über den EZB-Kurs aus dem Store
const priceInEur = computed(() => {
  if (!asset.value) return 0
  return asset.value.currency === 'EUR'
    ? asset.value.currentPrice
    : asset.value.currentPrice / store.usdPerEur
})

const priceInUsd = computed(() => {
  if (!asset.value) return 0
  return asset.value.currency === 'USD'
    ? asset.value.currentPrice
    : asset.value.currentPrice * store.usdPerEur
})

/**
 * Kerzen in die aktive Währung umrechnen:
 * Bei EUR/USD-Umschaltung ändert sich der komplette Chart.
 */
const convertedHistory = computed(() => {
  const h = asset.value?.priceHistory || []
  if (!asset.value || h.length === 0) return []
  const from = asset.value.currency
  const to = store.activeCurrency
  if (from === to) return h
  const factor = from === 'EUR' ? store.usdPerEur : 1 / store.usdPerEur
  return h.map(p => ({
    ...p,
    open: p.open * factor,
    high: p.high * factor,
    low: p.low * factor,
    close: p.close * factor
  }))
})
const newAlertPrice = ref(0)
const newAlertDirection = ref<'ueber' | 'unter'>('ueber')

const assetAlerts = computed(() => store.priceAlerts.filter(a => a.assetId === assetId))

const addAlert = () => {
  if (!newAlertPrice.value || !asset.value) return
  store.addPriceAlert({
    id: `alert_${Date.now()}`,
    assetId: assetId,
    assetSymbol: asset.value.symbol,
    price: newAlertPrice.value,
    direction: newAlertDirection.value,
    active: true,
    createdAt: new Date()
  })
  store.logEvent('signal_erzeugt', `Preis-Alert gesetzt: ${asset.value.symbol} ${newAlertDirection.value} ${newAlertPrice.value}`,
    { assetId, assetSymbol: asset.value.symbol })
  newAlertPrice.value = 0
}

const assetId = route.params.id as string

const asset = computed(() => {
  return store.assets.find(a => a.id === assetId)
})

const positions = computed(() => {
  return store.portfolios
    .flatMap(p => p.positions)
    .filter(pos => pos.asset.id === assetId)
})

const currentAnalysis = computed(() => {
  return store.analyses
    .filter(a => a.assetId === assetId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
})

const formatPrice = (value: number) => {
  const symbol = store.activeCurrency === 'EUR' ? '€' : '$'
  return `${symbol} ${value.toFixed(2)}`
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

onMounted(async () => {
  try {
    // Lade Asset Details
    const assetData = await apiService.getAssetById(assetId)
    if (assetData) {
      store.addAsset(assetData)

      // Lade Kurs-Historie
      const history = await apiService.getPriceHistory(assetId, '1d', 100)
      if (history.length > 0) {
        store.updateAsset(assetId, { priceHistory: history })
      }

      // Lade echten EZB-Wechselkurs
      const rate = await apiService.getExchangeRate('EUR', 'USD')
      store.setUsdPerEur(rate)
    }
  } catch (error) {
    console.error('Fehler beim Laden des Assets:', error)
  } finally {
    loading.value = false
  }
})
</script>
