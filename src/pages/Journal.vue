<template>
  <div class="space-y-6">
    <div class="card">
      <h1 class="text-3xl font-bold mb-2">Trade-Journal</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Brutale Ehrlichkeit gegenüber dem eigenen Verhalten - jeder Trade wird dokumentiert und bewertet
      </p>
    </div>

    <!-- Journal-Statistik -->
    <div v-if="closedTrades.length > 0" class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="card !p-4">
        <p class="text-xs text-gray-500">Trades gesamt</p>
        <p class="font-bold text-xl">{{ store.journal.length }}</p>
      </div>
      <div class="card !p-4">
        <p class="text-xs text-gray-500">Trefferquote</p>
        <p class="font-bold text-xl">{{ winRate.toFixed(0) }}%</p>
      </div>
      <div class="card !p-4">
        <p class="text-xs text-gray-500">Gesamtergebnis</p>
        <p :class="['font-bold text-xl', totalResult >= 0 ? 'text-green-600' : 'text-red-600']">
          {{ totalResult >= 0 ? '+' : '' }}{{ totalResult.toFixed(2) }} €
        </p>
      </div>
      <div class="card !p-4">
        <p class="text-xs text-gray-500">Plantreue</p>
        <p class="font-bold text-xl">{{ planFollowedRate.toFixed(0) }}%</p>
      </div>
      <div class="card !p-4">
        <p class="text-xs text-gray-500">Teuerste Emotion</p>
        <p class="font-bold text-sm">{{ worstEmotion }}</p>
      </div>
    </div>

    <!-- Verhaltens-Warnung -->
    <div v-if="behaviorWarning" class="card border-l-4 border-orange-500 bg-orange-50/40 dark:bg-orange-950/30">
      <p class="text-sm font-medium text-orange-900 dark:text-orange-200">🔍 Verhaltensmuster erkannt</p>
      <p class="text-sm text-orange-800 dark:text-orange-300 mt-1">{{ behaviorWarning }}</p>
    </div>

    <!-- Neuen Trade eintragen -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Trade eintragen</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Asset-Symbol *</label>
          <input v-model="form.assetSymbol" placeholder="z.B. AAPL, BTC" class="input-field w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Richtung</label>
          <select v-model="form.direction" class="input-field w-full">
            <option value="long">Long (Kauf)</option>
            <option value="short">Short (Verkauf)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Einstiegskurs *</label>
          <input v-model.number="form.entryPrice" type="number" step="0.01" class="input-field w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Stückzahl *</label>
          <input v-model.number="form.quantity" type="number" step="0.000001" class="input-field w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Emotion beim Einstieg *</label>
          <select v-model="form.emotion" class="input-field w-full">
            <option value="ruhig">😌 Ruhig &amp; geplant</option>
            <option value="neutral">😐 Neutral</option>
            <option value="gierig">🤑 Gierig</option>
            <option value="aengstlich">😰 Ängstlich</option>
            <option value="fomo">🏃 FOMO (Angst zu verpassen)</option>
            <option value="rache">😤 Rache-Trade</option>
            <option value="euphorie">🚀 Euphorie</option>
          </select>
        </div>
        <div class="md:col-span-3">
          <label class="block text-sm font-medium mb-1">Einstiegsthese (warum dieser Trade?) *</label>
          <input v-model="form.thesis" placeholder="z.B. Ausbruch über Widerstand 124,50 mit Volumen, Stop unter Swing-Tief" class="input-field w-full" />
        </div>
      </div>
      <button @click="addEntry" :disabled="!formValid" class="btn btn-primary mt-4 disabled:opacity-50">
        Trade ins Journal
      </button>
    </div>

    <!-- Offene Trades -->
    <div v-if="openTrades.length > 0" class="card">
      <h2 class="text-lg font-bold mb-4">Offene Trades ({{ openTrades.length }})</h2>
      <div class="space-y-3">
        <div v-for="trade in openTrades" :key="trade.id" class="p-4 rounded-xl bg-white/40 dark:bg-white/5">
          <div class="flex justify-between items-start flex-wrap gap-3">
            <div>
              <p class="font-bold">{{ trade.assetSymbol }} {{ trade.direction === 'long' ? '📈 Long' : '📉 Short' }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ trade.quantity }} @ {{ trade.entryPrice.toFixed(2) }} • {{ formatDate(trade.createdAt) }} • {{ emotionLabel(trade.emotion) }}
              </p>
              <p class="text-sm mt-1">{{ trade.thesis }}</p>
            </div>
            <div class="flex items-end gap-2">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Exit-Kurs</label>
                <input v-model.number="exitPrices[trade.id]" type="number" step="0.01" class="input-field w-28 text-sm" />
              </div>
              <label class="flex items-center gap-1 text-xs pb-2">
                <input type="checkbox" v-model="planFollowed[trade.id]" class="rounded" /> Plan befolgt
              </label>
              <button @click="closeTrade(trade.id)" :disabled="!exitPrices[trade.id]" class="btn btn-secondary text-sm disabled:opacity-50">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Geschlossene Trades -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Abgeschlossene Trades</h2>
      <div v-if="closedTrades.length > 0" class="space-y-2">
        <div v-for="trade in closedTrades" :key="trade.id"
          class="p-3 rounded-xl bg-white/40 dark:bg-white/5 flex justify-between items-center flex-wrap gap-2">
          <div class="min-w-0">
            <p class="font-medium text-sm">
              {{ trade.assetSymbol }} {{ trade.direction }} • {{ trade.quantity }} @ {{ trade.entryPrice.toFixed(2) }} → {{ trade.exitPrice?.toFixed(2) }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDate(trade.createdAt) }} • {{ emotionLabel(trade.emotion) }}
              • Plan {{ trade.planFollowed ? '✓ befolgt' : '✗ gebrochen' }}
            </p>
            <p v-if="trade.lessons" class="text-xs text-blue-700 dark:text-blue-300 mt-0.5">💡 {{ trade.lessons }}</p>
          </div>
          <span :class="['font-bold text-sm px-2 py-1 rounded-lg',
            (trade.netResult || 0) >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200']">
            {{ (trade.netResult || 0) >= 0 ? '+' : '' }}{{ (trade.netResult || 0).toFixed(2) }} €
          </span>
        </div>
      </div>
      <p v-else class="text-center py-6 text-gray-500 text-sm">Noch keine abgeschlossenen Trades</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '../stores'
import type { TradeEmotion } from '../types'

const store = useAppStore()

const form = ref({
  assetSymbol: '',
  direction: 'long' as 'long' | 'short',
  entryPrice: 0,
  quantity: 0,
  emotion: 'ruhig' as TradeEmotion,
  thesis: ''
})

const exitPrices = reactive<Record<string, number>>({})
const planFollowed = reactive<Record<string, boolean>>({})

const formValid = computed(() =>
  form.value.assetSymbol.trim() && form.value.entryPrice > 0 && form.value.quantity > 0 && form.value.thesis.trim()
)

const openTrades = computed(() => store.journal.filter(j => j.status === 'offen'))
const closedTrades = computed(() => store.journal.filter(j => j.status === 'geschlossen'))

const winRate = computed(() => {
  const closed = closedTrades.value
  if (!closed.length) return 0
  return (closed.filter(t => (t.netResult || 0) > 0).length / closed.length) * 100
})

const totalResult = computed(() => closedTrades.value.reduce((s, t) => s + (t.netResult || 0), 0))

const planFollowedRate = computed(() => {
  const closed = closedTrades.value
  if (!closed.length) return 100
  return (closed.filter(t => t.planFollowed).length / closed.length) * 100
})

/** Welche Emotion hat am meisten Geld gekostet? */
const worstEmotion = computed(() => {
  const byEmotion = new Map<string, number>()
  closedTrades.value.forEach(t => {
    if ((t.netResult || 0) < 0) {
      byEmotion.set(t.emotion, (byEmotion.get(t.emotion) || 0) + (t.netResult || 0))
    }
  })
  if (byEmotion.size === 0) return '–'
  const worst = Array.from(byEmotion.entries()).sort((a, b) => a[1] - b[1])[0]
  return `${emotionLabel(worst[0] as TradeEmotion)} (${worst[1].toFixed(0)}€)`
})

/** Verhaltensmuster erkennen (§128: wiederkehrende Fehler → Lernhinweis) */
const behaviorWarning = computed(() => {
  const closed = closedTrades.value
  if (closed.length < 3) return ''

  const fomoTrades = closed.filter(t => ['fomo', 'gierig', 'rache', 'euphorie'].includes(t.emotion))
  const fomoLosses = fomoTrades.filter(t => (t.netResult || 0) < 0)
  if (fomoTrades.length >= 2 && fomoLosses.length / fomoTrades.length > 0.6) {
    return `${fomoLosses.length} von ${fomoTrades.length} emotionalen Trades (FOMO/Gier/Rache/Euphorie) endeten im Verlust. Das Muster kostet Geld: Nur noch Trades mit Emotion "ruhig & geplant" eingehen.`
  }

  const planBroken = closed.filter(t => t.planFollowed === false)
  const planBrokenLosses = planBroken.filter(t => (t.netResult || 0) < 0)
  if (planBroken.length >= 2 && planBrokenLosses.length / planBroken.length > 0.5) {
    return `Bei ${planBroken.length} Trades wurde der Plan gebrochen - die Mehrheit davon Verluste. Der Plan schützt das Kapital, nicht das Ego.`
  }

  return ''
})

const addEntry = () => {
  if (!formValid.value) return
  store.addJournalEntry({
    id: `jnl_${Date.now()}`,
    createdAt: new Date(),
    assetSymbol: form.value.assetSymbol.trim().toUpperCase(),
    direction: form.value.direction,
    entryPrice: form.value.entryPrice,
    quantity: form.value.quantity,
    thesis: form.value.thesis.trim(),
    emotion: form.value.emotion,
    status: 'offen'
  })
  form.value = { assetSymbol: '', direction: 'long', entryPrice: 0, quantity: 0, emotion: 'ruhig', thesis: '' }
}

const closeTrade = (id: string) => {
  const exit = exitPrices[id]
  if (!exit) return
  const lessons = prompt('Was nimmst du aus diesem Trade mit? (optional)') || undefined
  store.closeJournalEntry(id, exit, planFollowed[id] ?? true, lessons)
  delete exitPrices[id]
}

const emotionLabel = (e: TradeEmotion | string) => {
  const map: Record<string, string> = {
    ruhig: '😌 ruhig', neutral: '😐 neutral', gierig: '🤑 gierig',
    aengstlich: '😰 ängstlich', fomo: '🏃 FOMO', rache: '😤 Rache', euphorie: '🚀 Euphorie'
  }
  return map[e] || e
}

const formatDate = (d: Date) => new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
}).format(new Date(d))
</script>
