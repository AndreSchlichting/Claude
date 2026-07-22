<template>
  <div class="space-y-3">
    <div class="card">
      <h1 class="text-xl font-bold mb-1">Replay- &amp; Lernmodus</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Vergangene Kursverläufe Kerze für Kerze nachspielen: Was hätte der Bot gesehen? Lernen ohne echtes Risiko (§142.7)
      </p>
    </div>

    <!-- Setup -->
    <div class="card grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1">Asset</label>
        <select v-model="selectedAssetId" class="input-field w-full" @change="loadReplay">
          <option value="">-- Asset auswählen --</option>
          <option v-for="asset in store.assets" :key="asset.id" :value="asset.id">
            {{ asset.symbol }} - {{ asset.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Kerzenintervall</label>
        <select v-model="interval" class="input-field w-full" @change="loadReplay">
          <option value="1d">1 Tag</option>
          <option value="60min">60 Minuten</option>
          <option value="15min">15 Minuten</option>
          <option value="5min">5 Minuten</option>
        </select>
      </div>
      <div class="flex items-end">
        <button @click="loadReplay" class="btn btn-primary w-full" :disabled="!selectedAssetId">
          Replay laden
        </button>
      </div>
    </div>

    <template v-if="fullHistory.length > minStart">
      <!-- Steuerung -->
      <div class="card">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <button @click="reset" class="btn btn-secondary text-sm">⏮ Neustart</button>
          <button @click="step(1)" class="btn btn-primary text-sm" :disabled="finished">▶ +1 Kerze</button>
          <button @click="step(5)" class="btn btn-secondary text-sm" :disabled="finished">⏩ +5 Kerzen</button>
          <button @click="toggleAutoplay" class="btn btn-secondary text-sm" :disabled="finished">
            {{ autoplay ? '⏸ Pause' : '▶▶ Auto-Play' }}
          </button>
          <span class="text-sm text-gray-600 dark:text-gray-400 ml-auto">
            Kerze {{ cursor }} / {{ fullHistory.length }}
            <span v-if="currentCandle"> • {{ formatTime(currentCandle.timestamp) }}</span>
          </span>
        </div>
        <input
          type="range" :min="minStart" :max="fullHistory.length" v-model.number="cursor"
          class="w-full" @input="onScrub"
        />
      </div>

      <!-- Chart zeigt nur bis zur aktuellen Kerze -->
      <CandleChart :priceHistory="visibleHistory" :title="`Replay: ${assetSymbol} (${interval})`" :maxCandles="80" />

      <!-- Aktuelle Signale an dieser Stelle -->
      <div class="card">
        <h3 class="font-bold mb-3">Was der Bot JETZT sehen würde</h3>
        <div v-if="currentSignals.length > 0" class="space-y-2">
          <div v-for="sig in currentSignals" :key="sig.id"
            class="p-3 rounded-xl bg-white/40 dark:bg-white/5 text-sm flex justify-between items-center flex-wrap gap-2">
            <div>
              <p class="font-bold">{{ sig.signalType }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">{{ sig.reason }}</p>
            </div>
            <div class="text-xs text-right">
              <p>Entry {{ sig.entry.toFixed(2) }} • Stop {{ sig.stop.toFixed(2) }} • Ziel {{ sig.target.toFixed(2) }}</p>
              <p class="font-bold">{{ sig.riskReward.toFixed(2) }}:1 • Konfidenz {{ sig.confidence }}%</p>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">Kein Setup an dieser Stelle - auch das ist eine Erkenntnis: meist ist Warten richtig.</p>
      </div>

      <!-- Replay-Protokoll: aufgetretene Signale und ihr Ausgang -->
      <div v-if="replayLog.length > 0" class="card">
        <h3 class="font-bold mb-3">Replay-Protokoll ({{ replayLog.length }} Signale)</h3>
        <div class="space-y-2">
          <div v-for="entry in replayLog" :key="entry.id"
            class="p-3 rounded-xl text-sm flex justify-between items-center flex-wrap gap-2"
            :class="entry.outcome === 'gewinn' ? 'bg-green-50/60 dark:bg-green-950/40' :
                    entry.outcome === 'verlust' ? 'bg-red-50/60 dark:bg-red-950/40' : 'bg-white/40 dark:bg-white/5'">
            <div>
              <p class="font-medium">Kerze {{ entry.candleIndex }}: {{ entry.signalType }}</p>
              <p class="text-xs text-gray-500">Entry {{ entry.entry.toFixed(2) }} • Stop {{ entry.stop.toFixed(2) }} • Ziel {{ entry.target.toFixed(2) }}</p>
            </div>
            <span class="font-bold text-xs px-2 py-1 rounded-lg"
              :class="entry.outcome === 'gewinn' ? 'bg-green-600 text-white' :
                      entry.outcome === 'verlust' ? 'bg-red-600 text-white' : 'bg-gray-400 text-white'">
              {{ entry.outcome === 'gewinn' ? '✓ ZIEL' : entry.outcome === 'verlust' ? '✗ STOP' : 'offen' }}
            </span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-white/40 dark:border-white/10 flex gap-6 text-sm">
          <span>Treffer: <b class="text-green-600">{{ replayLog.filter(e => e.outcome === 'gewinn').length }}</b></span>
          <span>Stops: <b class="text-red-600">{{ replayLog.filter(e => e.outcome === 'verlust').length }}</b></span>
          <span>Offen: <b>{{ replayLog.filter(e => e.outcome === 'offen').length }}</b></span>
        </div>
      </div>

      <!-- Lernhinweis -->
      <div v-if="store.settings.learningHints" class="card border-l-4 border-blue-400">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          💡 <b>Lernmodus:</b> Spiele denselben Zeitraum mehrmals durch. Achte darauf, wie oft ein Signal verlockend aussah,
          aber am Stop endete - und wie oft Geduld (kein Trade) die beste Entscheidung war.
          Das Replay zeigt die Signale ohne Nachhinein-Wissen: genau so unsicher fühlt sich Live-Trading an.
        </p>
      </div>
    </template>

    <div v-else-if="selectedAssetId && loaded" class="card text-center py-8 text-gray-500">
      Nicht genug Kursdaten für ein Replay (mind. {{ minStart + 10 }} Kerzen nötig).
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import { DaytradingEngine } from '../services/daytradingEngine'
import type { IntrabarSignal } from '../services/daytradingEngine'
import CandleChart from '../components/CandleChart.vue'
import type { PricePoint } from '../types'

const store = useAppStore()

const selectedAssetId = ref('')
const interval = ref('1d')
const fullHistory = ref<PricePoint[]>([])
const cursor = ref(30)
const minStart = 30
const autoplay = ref(false)
const loaded = ref(false)
let autoplayTimer: ReturnType<typeof setInterval> | null = null

interface ReplayLogEntry {
  id: string
  candleIndex: number
  signalType: string
  entry: number
  stop: number
  target: number
  outcome: 'offen' | 'gewinn' | 'verlust'
}
const replayLog = ref<ReplayLogEntry[]>([])
const seenSignalKeys = ref<Set<string>>(new Set())

const assetSymbol = computed(() => store.assets.find(a => a.id === selectedAssetId.value)?.symbol || '')
const visibleHistory = computed(() => fullHistory.value.slice(0, cursor.value))
const currentCandle = computed(() => visibleHistory.value[visibleHistory.value.length - 1])
const finished = computed(() => cursor.value >= fullHistory.value.length)
const currentSignals = ref<IntrabarSignal[]>([])

const loadReplay = async () => {
  if (!selectedAssetId.value) return
  stopAutoplay()
  const history = await apiService.getPriceHistory(selectedAssetId.value, interval.value, 200)
  fullHistory.value = history
  loaded.value = true
  reset()
}

const reset = () => {
  stopAutoplay()
  cursor.value = Math.min(minStart, fullHistory.value.length)
  replayLog.value = []
  seenSignalKeys.value = new Set()
  evaluate()
}

const step = (n: number) => {
  cursor.value = Math.min(fullHistory.value.length, cursor.value + n)
  evaluate()
  if (finished.value) stopAutoplay()
}

const onScrub = () => {
  // Beim Zurückspulen Log neu aufbauen wäre teuer - nur Signale neu berechnen
  evaluate(false)
}

/**
 * Berechnet Signale auf dem sichtbaren Ausschnitt (ohne Zukunftswissen)
 * und wertet offene Log-Einträge gegen die neueste Kerze aus.
 */
const evaluate = (track = true) => {
  const visible = visibleHistory.value
  if (visible.length < 10) { currentSignals.value = []; return }

  const asset = store.assets.find(a => a.id === selectedAssetId.value)
  if (!asset) return

  const currentPrice = visible[visible.length - 1].close
  const signals = DaytradingEngine.analyzeIntraday(asset, visible, currentPrice, 'daytrading')
  currentSignals.value = signals.filter(s => !s.isTooLate)

  if (!track) return

  // Neue Signale ins Replay-Log aufnehmen (einmal pro Typ+Kerzenbereich)
  currentSignals.value.forEach(sig => {
    const key = `${sig.signalType}_${Math.floor(cursor.value / 5)}`
    if (!seenSignalKeys.value.has(key)) {
      seenSignalKeys.value.add(key)
      replayLog.value.push({
        id: `rl_${cursor.value}_${sig.signalType}`,
        candleIndex: cursor.value,
        signalType: sig.signalType,
        entry: sig.entry,
        stop: sig.stop,
        target: sig.target,
        outcome: 'offen'
      })
    }
  })

  // Offene Einträge gegen die aktuelle Kerze prüfen
  const latest = visible[visible.length - 1]
  replayLog.value.forEach(entry => {
    if (entry.outcome !== 'offen' || entry.candleIndex >= cursor.value) return
    if (latest.low <= entry.stop) entry.outcome = 'verlust'
    else if (latest.high >= entry.target) entry.outcome = 'gewinn'
  })
}

const toggleAutoplay = () => {
  if (autoplay.value) { stopAutoplay(); return }
  autoplay.value = true
  autoplayTimer = setInterval(() => {
    if (finished.value) { stopAutoplay(); return }
    step(1)
  }, 800)
}

const stopAutoplay = () => {
  autoplay.value = false
  if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null }
}

const formatTime = (d: Date) => new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: '2-digit',
  ...(interval.value !== '1d' ? { hour: '2-digit', minute: '2-digit' } : {})
}).format(new Date(d))

onMounted(async () => {
  if (store.assets.length === 0) {
    const assets = await apiService.getAssets()
    assets.forEach(a => store.addAsset(a))
  }
})

onUnmounted(stopAutoplay)
</script>
