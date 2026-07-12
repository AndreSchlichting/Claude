<template>
  <div class="space-y-6">
    <div class="card">
      <h1 class="text-3xl font-bold mb-2">Profi-Analyse</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Marktstruktur → Schlüsselzonen → Volumen → Momentum. Der Indikator bestätigt, er entscheidet nicht.
      </p>
    </div>

    <!-- Asset Selector -->
    <div class="card">
      <label class="block text-sm font-medium mb-2">Asset analysieren</label>
      <select v-model="selectedAssetId" class="input-field w-full" @change="runAnalysis">
        <option value="">-- Asset auswählen --</option>
        <option v-for="asset in store.assets" :key="asset.id" :value="asset.id">
          {{ asset.symbol }} - {{ asset.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="card text-center py-8 text-gray-500">Analysiere...</div>

    <template v-if="result">
      <!-- Kerzenchart mit Zonen -->
      <CandleChart
        :priceHistory="history"
        :zones="result.zones"
        :title="`${result.asset.symbol} - Kerzenchart mit Schlüsselzonen`"
      />

      <!-- These & Entscheidung -->
      <div class="card border-l-4" :class="decisionBorder">
        <div class="flex justify-between items-start flex-wrap gap-3 mb-4">
          <div>
            <p class="text-xs font-bold text-gray-500 dark:text-gray-400">ANALYSEQUALITÄT: {{ result.quality.toUpperCase() }}</p>
            <h2 class="text-xl font-bold mt-1">{{ result.these }}</h2>
          </div>
          <span :class="['px-4 py-2 rounded-xl font-bold text-sm', decisionBadge]">
            {{ decisionLabel }}
          </span>
        </div>
        <p class="text-sm text-gray-700 dark:text-gray-300">{{ result.decisionReason }}</p>
      </div>

      <!-- Pro / Contra (§118: Beweis & Gegenposition) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card border-l-4 border-green-500">
          <h3 class="font-bold mb-3 text-green-700 dark:text-green-400">Beweise (Pro)</h3>
          <ul class="space-y-2 text-sm">
            <li v-for="(b, i) in result.beweise" :key="i" class="flex gap-2">
              <span class="text-green-600 shrink-0">✓</span> {{ b }}
            </li>
          </ul>
        </div>
        <div class="card border-l-4 border-red-500">
          <h3 class="font-bold mb-3 text-red-700 dark:text-red-400">Gegenposition (Contra)</h3>
          <ul class="space-y-2 text-sm">
            <li v-for="(g, i) in result.gegenposition" :key="i" class="flex gap-2">
              <span class="text-red-600 shrink-0">✗</span> {{ g }}
            </li>
          </ul>
          <div class="mt-4 pt-3 border-t border-white/40 dark:border-white/10">
            <p class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">FALLHÖHE</p>
            <p class="text-sm">{{ result.fallhoehe }}</p>
          </div>
        </div>
      </div>

      <!-- Marktstruktur & Zonen -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="font-bold mb-3">Marktstruktur</h3>
          <div class="flex items-center gap-3 mb-3">
            <span :class="[
              'px-3 py-1 rounded-lg text-sm font-bold',
              result.structure.trend === 'aufwaerts' ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200' :
              result.structure.trend === 'abwaerts' ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200' :
              'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200'
            ]">
              {{ result.structure.trend === 'aufwaerts' ? '↗ Aufwärts' : result.structure.trend === 'abwaerts' ? '↘ Abwärts' : '→ Seitwärts' }}
            </span>
          </div>
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ result.structure.description }}</p>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Letztes Swing-Hoch</p>
              <p class="font-bold">{{ result.structure.lastSwingHigh.toFixed(2) }}</p>
            </div>
            <div class="p-2 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Letztes Swing-Tief</p>
              <p class="font-bold">{{ result.structure.lastSwingLow.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-bold mb-3">Schlüsselzonen (Support/Resistance)</h3>
          <div class="space-y-2">
            <div
              v-for="(zone, i) in result.zones"
              :key="i"
              class="flex justify-between items-center p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-sm"
            >
              <span :class="zone.type === 'unterstuetzung' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                {{ zone.type === 'unterstuetzung' ? '▲ Unterstützung' : '▼ Widerstand' }}
              </span>
              <span class="font-bold">{{ zone.price.toFixed(2) }}</span>
              <span class="text-xs text-gray-500">{{ zone.distancePercent > 0 ? '+' : '' }}{{ zone.distancePercent.toFixed(1) }}% • {{ zone.strength }}x getestet</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Indikatoren-Snapshot -->
      <div class="card">
        <h3 class="font-bold mb-4">Indikatoren (Bestätigung)</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs text-gray-500 mb-1">RSI (14)</p>
            <p :class="['font-bold text-lg', result.indicators.rsi14 > 70 ? 'text-red-600' : result.indicators.rsi14 < 30 ? 'text-green-600' : '']">
              {{ result.indicators.rsi14.toFixed(0) }}
            </p>
            <p class="text-xs text-gray-500">{{ result.indicators.rsi14 > 70 ? 'überkauft' : result.indicators.rsi14 < 30 ? 'überverkauft' : 'neutral' }}</p>
          </div>
          <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs text-gray-500 mb-1">MACD</p>
            <p :class="['font-bold text-lg', result.indicators.macdTrend === 'bullisch' ? 'text-green-600' : result.indicators.macdTrend === 'baerisch' ? 'text-red-600' : '']">
              {{ result.indicators.macdTrend }}
            </p>
            <p class="text-xs text-gray-500">Histogramm {{ result.indicators.macdHistogram.toFixed(3) }}</p>
          </div>
          <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs text-gray-500 mb-1">Kurs vs. EMA50</p>
            <p :class="['font-bold text-lg', result.indicators.priceVsEma50 >= 0 ? 'text-green-600' : 'text-red-600']">
              {{ result.indicators.priceVsEma50 >= 0 ? '+' : '' }}{{ result.indicators.priceVsEma50.toFixed(1) }}%
            </p>
            <p class="text-xs text-gray-500">EMA50: {{ result.indicators.ema50.toFixed(2) }}</p>
          </div>
          <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs text-gray-500 mb-1">ATR (Volatilität)</p>
            <p class="font-bold text-lg">{{ result.indicators.atrPercent.toFixed(1) }}%</p>
            <p class="text-xs text-gray-500">Bollinger: {{ result.indicators.bollingerPosition }}</p>
          </div>
        </div>
      </div>

      <!-- Volumenprofil / Liquidität -->
      <div class="card">
        <h3 class="font-bold mb-3">Volumenprofil (Liquiditätszonen)</h3>
        <div class="space-y-1.5">
          <div v-for="(node, i) in volumeNodesSorted" :key="i" class="flex items-center gap-3 text-sm">
            <span class="w-20 shrink-0 font-mono text-xs">{{ node.priceLevel.toFixed(2) }}</span>
            <div class="flex-1 h-3 rounded-full bg-white/30 dark:bg-white/5 overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="node.isHighVolumeNode ? 'bg-indigo-500/80' : 'bg-indigo-300/50'"
                :style="{ width: `${(node.volume / maxNodeVolume) * 100}%` }"
              ></div>
            </div>
            <span v-if="node.isHighVolumeNode" class="text-xs text-indigo-600 dark:text-indigo-300 font-medium shrink-0">HVN</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-3">
          HVN = High-Volume-Node: Zonen mit viel gehandeltem Volumen wirken wie Magnete und bieten Orientierung für Stops und Ziele.
        </p>
      </div>

      <!-- Backtest-Light -->
      <div class="card">
        <div class="flex justify-between items-center flex-wrap gap-3 mb-3">
          <div>
            <h3 class="font-bold">Backtest-Light</h3>
            <p class="text-xs text-gray-500">Wie oft hätte das Breakout-Setup (20er-Hoch, 2:1) in dieser Historie funktioniert?</p>
          </div>
          <button @click="runBacktest" class="btn btn-secondary text-sm">▶ Backtest starten</button>
        </div>
        <div v-if="backtestResult" class="space-y-3">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Trades</p>
              <p class="font-bold text-lg">{{ backtestResult.totalTrades }}</p>
            </div>
            <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Trefferquote</p>
              <p class="font-bold text-lg">{{ backtestResult.winRate.toFixed(0) }}%</p>
            </div>
            <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Gesamt (R)</p>
              <p :class="['font-bold text-lg', backtestResult.totalR >= 0 ? 'text-green-600' : 'text-red-600']">
                {{ backtestResult.totalR >= 0 ? '+' : '' }}{{ backtestResult.totalR.toFixed(1) }}R
              </p>
            </div>
            <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Ø pro Trade</p>
              <p class="font-bold text-lg">{{ backtestResult.avgR.toFixed(2) }}R</p>
            </div>
            <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Max. Drawdown</p>
              <p class="font-bold text-lg text-red-600">{{ backtestResult.maxDrawdownR.toFixed(1) }}R</p>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 text-sm">
            <p class="font-medium">{{ backtestResult.verdict }}</p>
            <p class="text-xs text-gray-500 mt-1">
              R = Vielfaches des eingesetzten Risikos. Vergangenheit garantiert keine Zukunft - der Backtest zeigt nur, ob das Setup zum Markt passt. Gebühren/Slippage nicht enthalten.
            </p>
          </div>
        </div>
      </div>

      <!-- Lernhinweise (§128 Wissensmodus) -->
      <div v-if="store.settings.learningHints" class="card border-l-4 border-blue-400">
        <h3 class="font-bold mb-3 flex items-center gap-2">💡 Lernhinweise</h3>
        <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li v-for="(hint, i) in result.lernhinweise" :key="i" class="flex gap-2">
            <span class="text-blue-500 shrink-0">›</span> {{ hint }}
          </li>
        </ul>
      </div>
    </template>

    <div v-else-if="selectedAssetId && !loading" class="card text-center py-8 text-gray-500">
      Nicht genug Kursdaten für eine belastbare Analyse (mind. 30 Kerzen nötig).
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import { ExpertAnalysis } from '../services/expertAnalysis'
import type { ExpertAnalysisResult } from '../services/expertAnalysis'
import { Backtest } from '../services/backtest'
import type { BacktestResult } from '../services/backtest'
import CandleChart from '../components/CandleChart.vue'
import type { PricePoint } from '../types'

const store = useAppStore()
const selectedAssetId = ref('')
const result = ref<ExpertAnalysisResult | null>(null)
const history = ref<PricePoint[]>([])
const loading = ref(false)
const backtestResult = ref<BacktestResult | null>(null)

const runBacktest = () => {
  backtestResult.value = Backtest.runBreakout(history.value)
  if (backtestResult.value) {
    store.logEvent('signal_erzeugt',
      `Backtest ${result.value?.asset.symbol}: ${backtestResult.value.totalTrades} Trades, ${backtestResult.value.totalR.toFixed(1)}R`,
      { assetSymbol: result.value?.asset.symbol })
  }
}

const runAnalysis = async () => {
  result.value = null
  if (!selectedAssetId.value) return
  loading.value = true
  try {
    const asset = store.assets.find(a => a.id === selectedAssetId.value)
    if (!asset) return

    let h = asset.priceHistory
    if (!h || h.length < 30) {
      h = await apiService.getPriceHistory(selectedAssetId.value, '1d', 120)
      if (h.length > 0) asset.priceHistory = h
    }
    history.value = h || []

    if (h && h.length >= 30) {
      result.value = ExpertAnalysis.analyze(asset, h)
      if (result.value) {
        store.logEvent('signal_erzeugt', `Profi-Analyse: ${result.value.decision} - ${result.value.these}`,
          { assetId: asset.id, assetSymbol: asset.symbol })
      }
    }
  } finally {
    loading.value = false
  }
}

const decisionLabel = computed(() => {
  const map: Record<string, string> = {
    handeln: 'HANDELN', warten: 'WARTEN AUF TRIGGER',
    beobachten: 'BEOBACHTEN', finger_weg: 'FINGER WEG'
  }
  return map[result.value?.decision || ''] || ''
})

const decisionBadge = computed(() => {
  switch (result.value?.decision) {
    case 'handeln': return 'bg-green-600 text-white'
    case 'warten': return 'bg-blue-600 text-white'
    case 'beobachten': return 'bg-gray-500 text-white'
    default: return 'bg-red-600 text-white'
  }
})

const decisionBorder = computed(() => {
  switch (result.value?.decision) {
    case 'handeln': return 'border-green-500'
    case 'warten': return 'border-blue-500'
    case 'beobachten': return 'border-gray-400'
    default: return 'border-red-500'
  }
})

const volumeNodesSorted = computed(() => {
  return [...(result.value?.volumeNodes || [])].reverse()
})

const maxNodeVolume = computed(() => {
  return Math.max(...(result.value?.volumeNodes.map(n => n.volume) || [1]), 1)
})

onMounted(async () => {
  if (store.assets.length === 0) {
    const assets = await apiService.getAssets()
    assets.forEach(a => store.addAsset(a))
  }
})
</script>
