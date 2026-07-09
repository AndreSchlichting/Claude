<template>
  <div class="space-y-6">
    <div class="card">
      <h1 class="text-3xl font-bold mb-2">Daytrading Mode</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Kurzzeitige Setups mit Fokus auf heutigen Handelstag • Kerzenintervalle: 1-60 Min
      </p>
    </div>

    <!-- Data Quality Warning -->
    <div v-if="!dataQualitySufficient" class="card bg-orange-50 dark:bg-orange-900 border-l-4 border-orange-500">
      <p class="text-orange-900 dark:text-orange-200 font-medium">
        ⚠️ Datenqualität unzureichend für Daytrading
      </p>
      <p class="text-sm text-orange-800 dark:text-orange-300 mt-1">
        {{ dataQualityReason }}
      </p>
    </div>

    <!-- Asset Selector -->
    <div class="card">
      <label class="block text-sm font-medium mb-3">Asset auswählen</label>
      <select v-model="selectedAssetId" class="input-field w-full">
        <option value="">-- Alle Assets --</option>
        <option v-for="asset in store.assets" :key="asset.id" :value="asset.id">
          {{ asset.symbol }} - {{ asset.name }}
        </option>
      </select>
    </div>

    <!-- Active Signals -->
    <div v-if="selectedAssetId && daytradesignals.length > 0" class="space-y-4">
      <div
        v-for="signal in daytradesignals"
        :key="signal.id"
        class="card border-l-4"
        :class="[
          signal.isTooLate ? 'border-gray-400 opacity-60' : 'border-primary'
        ]"
      >
        <!-- Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-bold">{{ formatSignalType(signal.signalType) }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatTime(signal.timestamp) }}</p>
          </div>
          <div class="text-right">
            <span v-if="signal.isTooLate" class="px-3 py-1 bg-gray-300 text-gray-900 rounded font-medium text-sm">
              VERPASST
            </span>
            <span v-else :class="[
              'px-3 py-1 rounded font-medium text-sm',
              signal.recommendation === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900' :
              signal.recommendation === 'buy_on_trigger' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900' :
              'bg-gray-100 text-gray-800'
            ]">
              {{ formatDecision(signal.recommendation) }}
            </span>
          </div>
        </div>

        <!-- FOMO Warning -->
        <div v-if="signal.isTooLate" class="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <p class="text-sm font-medium text-gray-900 dark:text-white">Nicht hinterherlaufen!</p>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ signal.tooLateReason }}</p>
        </div>

        <!-- Signal Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">GRUND</p>
            <p class="text-sm text-gray-900 dark:text-white">{{ signal.reason }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">KONFIDENZ</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                <div class="h-full bg-primary" :style="{ width: `${signal.confidence}%` }"></div>
              </div>
              <p class="font-bold text-sm">{{ signal.confidence }}%</p>
            </div>
          </div>
        </div>

        <!-- Entry / Stop / Target -->
        <div class="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div class="p-3 bg-green-50 dark:bg-green-900 rounded">
            <p class="text-xs text-green-900 dark:text-green-200 mb-1 font-bold">EINSTIEG</p>
            <p class="font-bold text-lg">€ {{ signal.entry.toFixed(2) }}</p>
            <p v-if="signal.price !== signal.entry" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Aktuell: € {{ signal.price.toFixed(2) }}
            </p>
          </div>
          <div class="p-3 bg-red-50 dark:bg-red-900 rounded">
            <p class="text-xs text-red-900 dark:text-red-200 mb-1 font-bold">STOP</p>
            <p class="font-bold text-lg">€ {{ signal.stop.toFixed(2) }}</p>
            <p class="text-xs text-red-600 dark:text-red-300 mt-1">
              -{{ ((signal.entry - signal.stop) / signal.entry * 100).toFixed(2) }}%
            </p>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-900 rounded">
            <p class="text-xs text-blue-900 dark:text-blue-200 mb-1 font-bold">ZIEL</p>
            <p class="font-bold text-lg">€ {{ signal.target.toFixed(2) }}</p>
            <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
              +{{ ((signal.target - signal.entry) / signal.entry * 100).toFixed(2) }}%
            </p>
          </div>
        </div>

        <!-- Chance-Risiko -->
        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">CHANCE-RISIKO</p>
            <p class="font-bold text-xl text-primary">{{ signal.riskReward.toFixed(2) }}:1</p>
            <p v-if="signal.riskReward < 1.5" class="text-xs text-orange-600 dark:text-orange-300 mt-1">
              ⚠️ Suboptimal (Ziel ≥ 1.5:1)
            </p>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">STATUS</p>
            <p class="font-bold text-lg">{{ dayStats?.priceMovementPercent.toFixed(2) || 0 }}%</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Tagesbewegung</p>
          </div>
        </div>
      </div>
    </div>

    <!-- No Signals -->
    <div v-else-if="selectedAssetId && daytradesignals.length === 0" class="card text-center py-8">
      <p class="text-gray-600 dark:text-gray-400 mb-2">Keine Daytrading-Signale gefunden</p>
      <p class="text-sm text-gray-500 dark:text-gray-500">Warten auf neue Setups...</p>
    </div>

    <!-- No Asset Selected -->
    <div v-else class="card text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">Wählen Sie ein Asset aus, um Daytrading-Signale zu sehen</p>
    </div>

    <!-- Market Stats -->
    <div v-if="selectedAssetId && dayStats" class="card">
      <h2 class="text-lg font-bold mb-4">Tagesstatistiken</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Hoch</p>
          <p class="font-bold">€ {{ dayStats.high.toFixed(2) }}</p>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Tief</p>
          <p class="font-bold">€ {{ dayStats.low.toFixed(2) }}</p>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Gap</p>
          <p :class="['font-bold', dayStats.gap > 0 ? 'text-green-600' : 'text-red-600']">
            {{ dayStats.gapPercent > 0 ? '+' : '' }}{{ dayStats.gapPercent.toFixed(2) }}%
          </p>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Volumen Ratio</p>
          <p class="font-bold">{{ dayStats.volumeRatio.toFixed(1) }}x</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import { DaytradingEngine } from '../services/daytradingEngine'
import type { IntrabarSignal, DaytradesStats } from '../services/daytradingEngine'

const store = useAppStore()

const selectedAssetId = ref('')
const daytradesignals = ref<IntrabarSignal[]>([])
const dayStats = ref<DaytradesStats | null>(null)
const loading = ref(false)

const dataQualitySufficient = computed(() => {
  if (!selectedAssetId.value) return true
  const asset = store.assets.find(a => a.id === selectedAssetId.value)
  if (!asset?.priceHistory) return false
  const check = DaytradingEngine.isDataSufficientForDaytrading(asset.priceHistory)
  return check.sufficient
})

const dataQualityReason = computed(() => {
  if (dataQualitySufficient.value) return ''
  const asset = store.assets.find(a => a.id === selectedAssetId.value)
  if (!asset?.priceHistory) return 'Keine Kurshistorie verfügbar'
  const check = DaytradingEngine.isDataSufficientForDaytrading(asset.priceHistory)
  return check.reason || 'Daten unzureichend'
})

const loadDaytradesignals = async () => {
  if (!selectedAssetId.value) {
    daytradesignals.value = []
    dayStats.value = null
    return
  }

  loading.value = true

  try {
    const asset = store.assets.find(a => a.id === selectedAssetId.value)
    if (!asset) return

    // Lade Intraday-Daten (5-Minuten Kerzen)
    let history = asset.priceHistory
    if (!history || history.length < 5) {
      history = await apiService.getPriceHistory(selectedAssetId.value, '5min', 100)
      if (history.length > 0) {
        asset.priceHistory = history
      }
    }

    if (history && history.length > 0) {
      // Analysiere Signale
      const signals = DaytradingEngine.analyzeIntraday(
        asset,
        history,
        asset.currentPrice,
        'daytrading'
      )

      daytradesignals.value = signals

      // Berechne Stats (diese sind public im Engine)
      const closes = history.map(p => p.close)
      const high = Math.max(...history.map(p => p.high))
      const low = Math.min(...history.map(p => p.low))
      const currentPrice = closes[closes.length - 1]

      dayStats.value = {
        openedAt: history[0].timestamp,
        high,
        low,
        currentPrice,
        gap: currentPrice - history[0].open,
        gapPercent: ((currentPrice - history[0].open) / history[0].open) * 100,
        volume: history[history.length - 1].volume,
        avgVolume: history.slice(-20).reduce((sum, p) => sum + p.volume, 0) / 20,
        volumeRatio: history[history.length - 1].volume / (history.slice(-20).reduce((sum, p) => sum + p.volume, 0) / 20),
        hoursSincOpen: (Date.now() - history[0].timestamp.getTime()) / (1000 * 60 * 60),
        priceMovement: high - low,
        priceMovementPercent: ((high - low) / history[0].open) * 100,
        volatility: ((high - low) / history[0].open) * 100
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden von Daytrading-Signalen:', error)
  } finally {
    loading.value = false
  }
}

const formatSignalType = (type: string) => {
  const map: Record<string, string> = {
    'opening_range_breakout': 'Opening Range Breakout (ORB)',
    'vwap_pullback': 'VWAP Pullback',
    'momentum_breakout': 'Momentum Ausbruch',
    'gap_and_go': 'Gap & Go',
    'support_bounce': 'Support Bounce',
    'breakout_failure': 'Fehlausbruch'
  }
  return map[type] || type
}

const formatDecision = (decision: string) => {
  const map: Record<string, string> = {
    'buy': 'KAUF',
    'buy_on_trigger': 'Kauf bei Trigger',
    'watch': 'Beobachten',
    'hold': 'Halten'
  }
  return map[decision] || decision
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

watch(selectedAssetId, loadDaytradesignals)

onMounted(async () => {
  // Lade Assets
  if (store.assets.length === 0) {
    const assets = await apiService.getAssets()
    assets.forEach(asset => store.addAsset(asset))
  }
})
</script>
