<template>
  <div class="card">
    <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
      <h2 class="text-lg font-bold">📡 TradingView-Signale</h2>
      <button @click="fetchSignals" class="btn btn-secondary text-sm" :disabled="loading">
        {{ loading ? 'Lade...' : '🔄 Aktualisieren' }}
      </button>
    </div>

    <template v-if="serverReachable">
      <div v-if="signals.length > 0" class="space-y-2">
        <div v-for="sig in signals.slice().reverse().slice(0, 8)" :key="sig.id"
          class="p-3 rounded-xl bg-white/40 dark:bg-white/5 text-sm">
          <div class="flex justify-between items-start gap-2">
            <p class="font-medium break-all">{{ formatPayload(sig.payload) }}</p>
            <span class="text-xs text-gray-500 shrink-0">{{ formatTime(sig.receivedAt) }}</span>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500">
        Server läuft, aber noch keine Signale empfangen. Richte in TradingView einen Alert mit
        Webhook-URL ein (siehe WEBHOOKS-ANLEITUNG.md).
      </p>
    </template>

    <div v-else class="p-3 rounded-xl bg-gray-50/60 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-400">
      <p class="font-medium mb-1">Webhook-Server nicht erreichbar</p>
      <p class="text-xs">
        Starte ihn in einem Terminal mit <code class="bg-white/50 dark:bg-white/10 px-1 rounded">npm run webhooks</code>
        — danach empfängt er TradingView-Alerts auf <code class="bg-white/50 dark:bg-white/10 px-1 rounded">localhost:3777/webhook</code>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores'

const store = useAppStore()

interface WebhookSignal {
  id: string
  receivedAt: string
  payload: any
}

const signals = ref<WebhookSignal[]>([])
const serverReachable = ref(false)
const loading = ref(false)
const seenIds = new Set<string>()
let pollTimer: ReturnType<typeof setInterval> | null = null

const fetchSignals = async () => {
  loading.value = true
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const response = await fetch('http://localhost:3777/signals', { signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) throw new Error('not ok')

    const data: WebhookSignal[] = await response.json()
    serverReachable.value = true

    // Neue Signale ins Ereignisprotokoll + Warnung
    data.forEach(sig => {
      if (!seenIds.has(sig.id)) {
        seenIds.add(sig.id)
        // Beim ersten Laden nicht alles fluten - nur wenn schon initialisiert
        if (signals.value.length > 0 || data.indexOf(sig) >= data.length - 3) {
          store.logEvent('news_erkannt', `TradingView-Signal: ${formatPayload(sig.payload).slice(0, 120)}`,
            { detail: sig.receivedAt })
        }
      }
    })

    signals.value = data
  } catch {
    serverReachable.value = false
  } finally {
    loading.value = false
  }
}

const formatPayload = (payload: any): string => {
  if (typeof payload === 'string') return payload
  if (payload?.text) return payload.text
  // TradingView-typische Felder hübsch darstellen
  const parts: string[] = []
  if (payload?.ticker) parts.push(payload.ticker)
  if (payload?.action) parts.push(payload.action.toUpperCase())
  if (payload?.price) parts.push(`@ ${payload.price}`)
  if (payload?.message) parts.push(payload.message)
  return parts.length ? parts.join(' ') : JSON.stringify(payload)
}

const formatTime = (iso: string) => new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
}).format(new Date(iso))

onMounted(() => {
  fetchSignals()
  pollTimer = setInterval(fetchSignals, 30000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
