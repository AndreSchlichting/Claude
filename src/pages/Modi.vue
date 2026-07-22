<template>
  <div class="space-y-3">
    <div class="card">
      <h1 class="text-xl font-bold mb-1">Entscheidungsmodi</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Jeder Modus beantwortet eine klare Entscheidungsfrage (Lastenheft 5, §142)
      </p>
    </div>

    <!-- Modus-Auswahl -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="mode in modes"
        :key="mode.id"
        @click="activeMode = mode.id"
        :class="['glass-chip', activeMode === mode.id ? 'glass-chip-active' : 'glass-chip-inactive']"
      >
        {{ mode.icon }} {{ mode.label }}
      </button>
    </div>

    <!-- ============ PRE-MARKET (§142.1) ============ -->
    <template v-if="activeMode === 'premarket'">
      <div class="card bg-blue-50/40 dark:bg-blue-950/30">
        <p class="font-bold text-sm">Entscheidungsfrage: Was kommt heute überhaupt infrage?</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="font-bold mb-3 text-green-700 dark:text-green-400">📈 Gewinner (Gap-up)</h3>
          <div v-if="gainers.length" class="space-y-2">
            <div v-for="s in gainers" :key="s.asset.id" class="flex justify-between items-center p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-sm">
              <span class="font-medium">{{ s.asset.symbol }}</span>
              <span class="text-green-600 font-bold">+{{ s.gapPercent.toFixed(2) }}%</span>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500">Keine Gap-ups erkannt</p>
        </div>
        <div class="card">
          <h3 class="font-bold mb-3 text-red-700 dark:text-red-400">📉 Verlierer (Gap-down)</h3>
          <div v-if="losers.length" class="space-y-2">
            <div v-for="s in losers" :key="s.asset.id" class="flex justify-between items-center p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-sm">
              <span class="font-medium">{{ s.asset.symbol }}</span>
              <span class="text-red-600 font-bold">{{ s.gapPercent.toFixed(2) }}%</span>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500">Keine Gap-downs erkannt</p>
        </div>
      </div>
      <div class="card">
        <h3 class="font-bold mb-3">Tages-Watchlist</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Assets mit erhöhtem Volumen oder starker Vorbewegung:</p>
        <div class="space-y-2">
          <div v-for="s in scanResults.slice(0, 5)" :key="s.asset.id" class="flex justify-between items-center p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-sm">
            <span class="font-medium">{{ s.asset.symbol }} <span class="text-gray-500 text-xs">{{ s.asset.name }}</span></span>
            <span class="text-xs text-gray-500">Move {{ s.movePercent.toFixed(1) }}% • Vol {{ s.volumeRatio.toFixed(1) }}x</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ LIVE-SCANNER (§142.3) ============ -->
    <template v-if="activeMode === 'scanner'">
      <div class="card bg-blue-50/40 dark:bg-blue-950/30 flex justify-between items-center flex-wrap gap-3">
        <p class="font-bold text-sm">Entscheidungsfrage: Was passiert gerade akut?</p>
        <button @click="refreshScanner" class="btn btn-secondary text-sm" :disabled="scanning">
          {{ scanning ? 'Scanne...' : '🔄 Neu scannen' }}
        </button>
      </div>
      <div class="card">
        <div v-if="scanResults.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-500 border-b border-white/40 dark:border-white/10">
                <th class="py-2 pr-4">Asset</th>
                <th class="py-2 pr-4 text-right">Kurs</th>
                <th class="py-2 pr-4 text-right">Bewegung</th>
                <th class="py-2 pr-4 text-right">Volumen</th>
                <th class="py-2 pr-4 text-center">Tageshoch/-tief</th>
                <th class="py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/30 dark:divide-white/5">
              <tr v-for="s in scanResults" :key="s.asset.id">
                <td class="py-2.5 pr-4 font-medium">{{ s.asset.symbol }}</td>
                <td class="py-2.5 pr-4 text-right">{{ s.asset.currentPrice.toFixed(2) }}</td>
                <td :class="['py-2.5 pr-4 text-right font-bold', s.movePercent >= 0 ? 'text-green-600' : 'text-red-600']">
                  {{ s.movePercent >= 0 ? '+' : '' }}{{ s.movePercent.toFixed(2) }}%
                </td>
                <td class="py-2.5 pr-4 text-right" :class="s.volumeRatio > 1.5 ? 'text-indigo-600 font-bold' : ''">
                  {{ s.volumeRatio.toFixed(1) }}x
                </td>
                <td class="py-2.5 pr-4 text-center text-xs">
                  <span v-if="s.newHigh" class="text-green-600 font-bold">neues Hoch</span>
                  <span v-else-if="s.newLow" class="text-red-600 font-bold">neues Tief</span>
                  <span v-else class="text-gray-400">–</span>
                </td>
                <td class="py-2.5 text-xs">
                  <span v-if="Math.abs(s.movePercent) > 3" class="text-red-600 font-medium warn-blink">⚠ akut</span>
                  <span v-else-if="s.volumeRatio > 2" class="text-indigo-600 font-medium">Volumen-Spike</span>
                  <span v-else class="text-gray-400">ruhig</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-center py-6 text-gray-500 text-sm">Klicke "Neu scannen", um alle Assets zu prüfen</p>
      </div>
    </template>

    <!-- ============ TRADE-MANAGEMENT (§142.4) ============ -->
    <template v-if="activeMode === 'management'">
      <div class="card bg-blue-50/40 dark:bg-blue-950/30">
        <p class="font-bold text-sm">Entscheidungsfrage: Halten, reduzieren, Stop nachziehen oder schließen?</p>
      </div>
      <div v-if="openPositions.length" class="space-y-4">
        <div v-for="pos in openPositions" :key="pos.id" class="card">
          <div class="flex justify-between items-start flex-wrap gap-3 mb-4">
            <div>
              <h3 class="font-bold">{{ pos.asset.symbol }} <span class="text-gray-500 text-sm font-normal">{{ pos.quantity }} Stück • {{ pos.portfolioType }}</span></h3>
              <p class="text-xs text-gray-500">Einstieg {{ pos.buyPrice.toFixed(2) }} am {{ formatDate(pos.buyDate) }}</p>
            </div>
            <span :class="['px-3 py-1 rounded-lg text-sm font-bold', unrealized(pos) >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200']">
              {{ unrealized(pos) >= 0 ? '+' : '' }}{{ unrealized(pos).toFixed(2) }} €
            </span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
            <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Aktuell</p>
              <p class="font-bold">{{ pos.asset.currentPrice.toFixed(2) }}</p>
            </div>
            <div class="p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/30">
              <p class="text-xs text-gray-500">Stop / Abstand</p>
              <p class="font-bold">{{ pos.stopLoss.toFixed(2) }}
                <span :class="['text-xs', stopDistance(pos) < 2 ? 'text-red-600 font-bold' : 'text-gray-500']">
                  ({{ stopDistance(pos).toFixed(1) }}%)
                </span>
              </p>
            </div>
            <div class="p-2.5 rounded-xl bg-green-50/60 dark:bg-green-950/30">
              <p class="text-xs text-gray-500">Ziel / Abstand</p>
              <p class="font-bold">{{ pos.profitTarget.toFixed(2) }}
                <span class="text-xs text-gray-500">({{ targetDistance(pos).toFixed(1) }}%)</span>
              </p>
            </div>
            <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs text-gray-500">Rest-Risiko</p>
              <p class="font-bold">{{ restRisk(pos).toFixed(2) }} €</p>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 text-sm">
            <p class="font-bold text-indigo-900 dark:text-indigo-200 text-xs mb-1">EMPFEHLUNG</p>
            <p>{{ managementAdvice(pos) }}</p>
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-8 text-gray-500">Keine offenen Positionen</div>
    </template>

    <!-- ============ EXIT-MODUS (§142.5) ============ -->
    <template v-if="activeMode === 'exit'">
      <div class="card bg-blue-50/40 dark:bg-blue-950/30">
        <p class="font-bold text-sm">Entscheidungsfrage: Gewinn sichern oder Position weiter laufen lassen?</p>
      </div>
      <div v-if="openPositions.length" class="space-y-4">
        <div v-for="pos in openPositions" :key="pos.id" class="card">
          <h3 class="font-bold mb-3">{{ pos.asset.symbol }} - Exit-Checkliste</h3>
          <div class="space-y-2 text-sm">
            <div v-for="(check, i) in exitChecklist(pos)" :key="i"
              class="flex justify-between items-center p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
              <span>{{ check.question }}</span>
              <span :class="['font-bold text-xs px-2 py-0.5 rounded-lg',
                check.answer === 'ja' ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200' :
                check.answer === 'nein' ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200' :
                'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300']">
                {{ check.answer.toUpperCase() }}
              </span>
            </div>
          </div>
          <div class="mt-4 p-3 rounded-xl text-sm font-medium"
            :class="exitScore(pos) >= 2 ? 'bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200' : 'bg-green-50/70 dark:bg-green-950/40 text-green-900 dark:text-green-200'">
            {{ exitRecommendation(pos) }}
          </div>
        </div>
      </div>
      <div v-else class="card text-center py-8 text-gray-500">Keine offenen Positionen</div>
    </template>

    <!-- ============ RISK-OFF (§142.6) ============ -->
    <template v-if="activeMode === 'riskoff'">
      <div class="card bg-blue-50/40 dark:bg-blue-950/30">
        <p class="font-bold text-sm">Entscheidungsfrage: Muss das Kapital jetzt geschützt werden?</p>
      </div>
      <div class="card" :class="store.settings.riskOffMode ? 'border-l-4 border-red-500' : ''">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 class="font-bold text-lg">Risk-Off-Modus: {{ store.settings.riskOffMode ? 'AKTIV' : 'inaktiv' }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Wenn aktiv: keine neuen Trades, bestehende Positionen prüfen, Risiko reduzieren.
            </p>
          </div>
          <button
            @click="toggleRiskOff"
            :class="['btn', store.settings.riskOffMode ? 'btn-secondary' : 'btn-danger']"
          >
            {{ store.settings.riskOffMode ? 'Risk-Off beenden' : '🛑 Risk-Off aktivieren' }}
          </button>
        </div>
      </div>
      <div class="card">
        <h3 class="font-bold mb-3">Automatische Trigger-Prüfung</h3>
        <div class="space-y-2 text-sm">
          <div v-for="(t, i) in riskOffTriggers" :key="i"
            class="flex justify-between items-center p-2.5 rounded-xl"
            :class="t.triggered ? 'bg-red-50/70 dark:bg-red-950/40' : 'bg-white/40 dark:bg-white/5'">
            <span>{{ t.label }}</span>
            <span :class="['font-bold text-xs', t.triggered ? 'text-red-600 warn-blink' : 'text-green-600']">
              {{ t.triggered ? '⚠ AUSGELÖST' : '✓ ok' }}
            </span>
          </div>
        </div>
        <p v-if="riskOffTriggers.some(t => t.triggered)" class="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
          Empfehlung: Risk-Off aktivieren und Positionen im Trade-Management prüfen.
        </p>
      </div>
    </template>
    <!-- ============ NEWS-SCHOCK (§142.8) ============ -->
    <template v-if="activeMode === 'newsschock'">
      <div class="card bg-blue-50/40 dark:bg-blue-950/30">
        <p class="font-bold text-sm">Entscheidungsfrage: Verändert diese Nachricht die Lage sofort?</p>
      </div>

      <div class="card">
        <h3 class="font-bold mb-2">Typische Auslöser</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Earnings-Überraschung • Gewinnwarnung • Analystenabstufung • Übernahmegerücht •
          regulatorische Nachricht • Betrugsverdacht • Handelsaussetzung • Krypto-Hack •
          ETF-Zulassung/Ablehnung • Zentralbankentscheidung
        </p>
      </div>

      <div v-if="!store.settings.riskOffMode" class="card border-l-4 border-red-500">
        <h3 class="font-bold mb-3">News-Schock auslösen</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Konsequenz: Rote Warnung wird erzeugt, Risk-Off aktiviert sich, neue Einstiege sind blockiert,
          bis die Lage geklärt ist.
        </p>
        <div class="flex gap-2 flex-wrap">
          <input v-model="newsShockNote" placeholder="Was ist passiert? (z.B. 'Fed-Entscheid überraschend hawkish')"
            class="input-field flex-1 min-w-[240px]" />
          <button @click="triggerNewsShock" :disabled="!newsShockNote.trim()" class="btn btn-danger disabled:opacity-50">
            📰 News-Schock auslösen
          </button>
        </div>
      </div>

      <div v-else class="card border-l-4 border-red-500 bg-red-50/40 dark:bg-red-950/30">
        <h3 class="font-bold text-red-900 dark:text-red-200 mb-2">🚨 News-Schock / Risk-Off AKTIV</h3>
        <ul class="text-sm text-red-800 dark:text-red-300 space-y-1 mb-4">
          <li>• Neue Einstiege sind blockiert (Trade-Gate)</li>
          <li>• Offene Positionen im Trade-Management prüfen</li>
          <li>• Erst wieder handeln, wenn die Lage verstanden ist - nicht, wenn sie sich nur beruhigt anfühlt</li>
        </ul>
        <button @click="clearNewsShock" class="btn btn-secondary">✓ Lage geklärt - Handel wieder freigeben</button>
      </div>

      <div v-if="openPositions.length" class="card">
        <h3 class="font-bold mb-3">Betroffene offene Positionen ({{ openPositions.length }})</h3>
        <div class="space-y-2">
          <div v-for="pos in openPositions" :key="pos.id"
            class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 flex justify-between items-center text-sm">
            <span class="font-medium">{{ pos.asset.symbol }} • {{ pos.quantity }} Stück</span>
            <span :class="unrealized(pos) >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
              {{ unrealized(pos) >= 0 ? '+' : '' }}{{ unrealized(pos).toFixed(2) }} €
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import { rsi } from '../services/indicators'
import type { Position } from '../types'

const store = useAppStore()
const activeMode = ref('scanner')
const scanning = ref(false)

const modes = [
  { id: 'premarket', label: 'Pre-Market', icon: '🌅' },
  { id: 'scanner', label: 'Live-Scanner', icon: '📡' },
  { id: 'management', label: 'Trade-Management', icon: '🎯' },
  { id: 'exit', label: 'Exit-Modus', icon: '🚪' },
  { id: 'riskoff', label: 'Risk-Off', icon: '🛑' },
  { id: 'newsschock', label: 'News-Schock', icon: '📰' }
]

// News-Schock-Modus (§142.8): sofortige Neubewertung bei Nachrichten
const newsShockNote = ref('')

const triggerNewsShock = () => {
  if (!newsShockNote.value.trim()) return
  store.settings.riskOffMode = true
  store.addWarning({
    id: `warn_newsshock_${Date.now()}`,
    timestamp: new Date(),
    assetId: '',
    level: 'red',
    type: 'News-Schock',
    message: `News-Schock ausgelöst: ${newsShockNote.value.trim()} - Positionen sofort prüfen, neue Einstiege blockiert`,
    isResolved: false
  })
  store.logEvent('news_erkannt', `NEWS-SCHOCK: ${newsShockNote.value.trim()}`,
    { detail: 'Risk-Off aktiviert, neue Einstiege blockiert (§142.8)' })
  newsShockNote.value = ''
}

const clearNewsShock = () => {
  store.settings.riskOffMode = false
  store.logEvent('modus_geaendert', 'News-Schock aufgehoben: Lage geklärt, Handel wieder freigegeben')
}

interface ScanResult {
  asset: any
  movePercent: number
  volumeRatio: number
  gapPercent: number
  newHigh: boolean
  newLow: boolean
}

const scanResults = ref<ScanResult[]>([])

const refreshScanner = async () => {
  scanning.value = true
  try {
    const results: ScanResult[] = []
    for (const asset of store.assets) {
      let h = asset.priceHistory
      if (!h || h.length < 10) {
        h = await apiService.getPriceHistory(asset.id, '1d', 60)
        if (h.length > 0) asset.priceHistory = h
      }
      if (!h || h.length < 10) continue

      const closes = h.map(p => p.close)
      const last = h[h.length - 1]
      const prev = h[h.length - 2]
      const move5 = ((closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6]) * 100
      const avgVol = h.slice(-20).reduce((s, p) => s + p.volume, 0) / Math.min(20, h.length)
      const highMax = Math.max(...h.slice(0, -1).map(p => p.high))
      const lowMin = Math.min(...h.slice(0, -1).map(p => p.low))

      results.push({
        asset,
        movePercent: move5,
        volumeRatio: last.volume / (avgVol || 1),
        gapPercent: prev ? ((last.open - prev.close) / prev.close) * 100 : 0,
        newHigh: last.high >= highMax,
        newLow: last.low <= lowMin
      })
    }
    scanResults.value = results.sort((a, b) => Math.abs(b.movePercent) - Math.abs(a.movePercent))

    // Akute Bewegungen protokollieren
    results.filter(r => Math.abs(r.movePercent) > 3).forEach(r => {
      store.logEvent('starke_bewegung', `Scanner: ${r.asset.symbol} bewegt sich ${r.movePercent.toFixed(1)}%`,
        { assetId: r.asset.id, assetSymbol: r.asset.symbol })
    })

    // Preis-Alerts gegen aktuelle Kurse prüfen
    store.checkPriceAlerts()

    // Paper-Broker: fällige Stops/Ziele automatisch ausführen (3.0-Simulation)
    store.settlePaperPositions()

    // Watchlist-Assets lokal archivieren (max. 1x täglich, spart Traffic)
    store.snapshotWatchlist()
  } finally {
    scanning.value = false
  }
}

const gainers = computed(() => scanResults.value.filter(s => s.gapPercent > 0.3).sort((a, b) => b.gapPercent - a.gapPercent).slice(0, 5))
const losers = computed(() => scanResults.value.filter(s => s.gapPercent < -0.3).sort((a, b) => a.gapPercent - b.gapPercent).slice(0, 5))

const openPositions = computed(() => {
  return store.portfolios.filter(p => p.type !== 'shadow').flatMap(p => p.positions)
})

const unrealized = (pos: Position) => (pos.asset.currentPrice - pos.buyPrice) * pos.quantity
const stopDistance = (pos: Position) => ((pos.asset.currentPrice - pos.stopLoss) / pos.asset.currentPrice) * 100
const targetDistance = (pos: Position) => ((pos.profitTarget - pos.asset.currentPrice) / pos.asset.currentPrice) * 100
const restRisk = (pos: Position) => Math.max(0, (pos.asset.currentPrice - pos.stopLoss) * pos.quantity)

const managementAdvice = (pos: Position): string => {
  const gain = unrealized(pos)
  const price = pos.asset.currentPrice
  if (price <= pos.stopLoss) return 'Stop erreicht oder unterschritten - Ausstieg gemäß Plan umsetzen.'
  if (price >= pos.profitTarget) return 'Ziel erreicht - Teilverkauf umsetzen oder Stop eng nachziehen und Rest laufen lassen.'
  if (gain > 0 && price > pos.buyPrice * 1.05 && pos.stopLoss < pos.buyPrice) {
    return `Position +${((price / pos.buyPrice - 1) * 100).toFixed(1)}% im Gewinn - Stop auf Einstand (${pos.buyPrice.toFixed(2)}) nachziehen, um das Risiko auf null zu setzen.`
  }
  if (stopDistance(pos) < 2) return 'Kurs nahe am Stop - keine Aktion nötig, der Plan arbeitet. Stop NICHT nach unten verschieben.'
  return 'Halten. Setup arbeitet, kein Handlungsbedarf.'
}

// Exit-Checkliste nach §142.5
const exitChecklist = (pos: Position) => {
  const h = pos.asset.priceHistory || []
  const closes = h.map(p => p.close)
  const rsiArr = closes.length > 15 ? rsi(closes) : []
  const rsiNow = rsiArr[rsiArr.length - 1]
  const lastVols = h.slice(-5)
  const downVolume = lastVols.length >= 2 &&
    lastVols[lastVols.length - 1].close < lastVols[lastVols.length - 1].open &&
    lastVols[lastVols.length - 1].volume > (h.slice(-20).reduce((s, p) => s + p.volume, 0) / Math.min(20, h.length)) * 1.3

  return [
    { question: 'Ist das Ziel erreicht?', answer: pos.asset.currentPrice >= pos.profitTarget ? 'ja' : 'nein' },
    { question: 'Ist das Momentum gebrochen (RSI < 45)?', answer: rsiNow === undefined || isNaN(rsiNow) ? 'unklar' : rsiNow < 45 ? 'ja' : 'nein' },
    { question: 'Dreht das Volumen gegen die Position?', answer: h.length < 20 ? 'unklar' : downVolume ? 'ja' : 'nein' },
    { question: 'Ist der Kurs unter dem Einstieg?', answer: pos.asset.currentPrice < pos.buyPrice ? 'ja' : 'nein' },
    { question: 'Ist der Stop in Gefahr (< 2% Abstand)?', answer: stopDistance(pos) < 2 ? 'ja' : 'nein' }
  ]
}

const exitScore = (pos: Position) => exitChecklist(pos).filter(c => c.answer === 'ja').length

const exitRecommendation = (pos: Position): string => {
  const score = exitScore(pos)
  if (pos.asset.currentPrice >= pos.profitTarget) return '✅ Ziel erreicht: Gewinn sichern - Teilverkauf oder kompletter Ausstieg.'
  if (score >= 3) return '🚨 Mehrere Exit-Signale: Ausstieg oder deutliche Reduzierung prüfen. Das ursprüngliche Setup ist geschwächt.'
  if (score === 2) return '⚠️ Zwei Exit-Signale: Stop nachziehen und Position eng überwachen.'
  return '✅ Setup intakt: Position weiter laufen lassen, Stop respektieren.'
}

// Risk-Off Trigger nach §142.6
const riskOffTriggers = computed(() => {
  const positions = openPositions.value
  const losing = positions.filter(p => unrealized(p) < 0)
  const totalUnrealizedLoss = losing.reduce((s, p) => s + unrealized(p), 0)
  const bigDrops = scanResults.value.filter(s => s.movePercent < -3).length

  return [
    {
      label: `Mehrere Positionen im Verlust (${losing.length} von ${positions.length})`,
      triggered: losing.length >= 3
    },
    {
      label: `Unrealisierter Verlust ${Math.abs(totalUnrealizedLoss).toFixed(0)}€ nähert sich Tageslimit (${store.settings.dailyLossLimit}€)`,
      triggered: Math.abs(totalUnrealizedLoss) > store.settings.dailyLossLimit * 0.5
    },
    {
      label: `Breiter Marktabverkauf (${bigDrops} Assets > -3%)`,
      triggered: bigDrops >= 2
    },
    {
      label: 'Aktive Rot/Schwarz-Warnungen vorhanden',
      triggered: store.activeWarnings.some(w => w.level === 'red' || w.level === 'black')
    }
  ]
})

const toggleRiskOff = () => {
  store.settings.riskOffMode = !store.settings.riskOffMode
  store.logEvent('modus_geaendert',
    `Risk-Off-Modus ${store.settings.riskOffMode ? 'AKTIVIERT - keine neuen Trades' : 'beendet'}`)
}

const formatDate = (d: Date) => new Intl.DateTimeFormat('de-DE').format(new Date(d))

onMounted(async () => {
  if (store.assets.length === 0) {
    const assets = await apiService.getAssets()
    assets.forEach(a => store.addAsset(a))
  }
  refreshScanner()
})
</script>
