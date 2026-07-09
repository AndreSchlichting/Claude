<template>
  <div v-if="asset" class="space-y-6">
    <!-- Header -->
    <div class="card flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold">{{ asset.name }}</h1>
        <p class="text-gray-600 dark:text-gray-400">{{ asset.symbol }} • {{ asset.assetClass }}</p>
      </div>
      <div class="text-right">
        <p class="text-4xl font-bold">{{ formatPrice(asset.currentPrice) }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">in {{ asset.currency }}</p>
      </div>
    </div>

    <!-- Price Comparison (EUR vs USD) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card border-2" :class="store.activeCurrency === 'EUR' ? 'border-primary' : 'border-gray-200 dark:border-gray-700 opacity-50'">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Kurs in €</p>
        <p class="text-2xl font-bold">
          {{ formatPrice(asset.currency === 'EUR' ? asset.currentPrice : asset.currentPrice / exchangeRate) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Aktueller Kurs in Euro</p>
      </div>
      <div class="card border-2" :class="store.activeCurrency === 'USD' ? 'border-primary' : 'border-gray-200 dark:border-gray-700 opacity-50'">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Kurs in US-$</p>
        <p class="text-2xl font-bold">
          {{ formatPrice(asset.currency === 'USD' ? asset.currentPrice : asset.currentPrice * exchangeRate) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Aktueller Kurs in US-Dollar</p>
      </div>
    </div>

    <!-- Price Chart -->
    <PriceChart
      v-if="asset?.priceHistory"
      :priceHistory="asset.priceHistory"
      :symbol="asset.symbol"
    />

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
import PriceChart from '../components/PriceChart.vue'

const route = useRoute()
const store = useAppStore()

const exchangeRate = ref(1.1)
const loading = ref(true)

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

      // Lade Wechselkurs
      const rate = await apiService.getExchangeRate('EUR', 'USD')
      exchangeRate.value = rate
    }
  } catch (error) {
    console.error('Fehler beim Laden des Assets:', error)
  } finally {
    loading.value = false
  }
})
</script>
