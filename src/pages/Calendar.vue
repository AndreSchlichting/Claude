<template>
  <div class="space-y-6">
    <div class="card">
      <h1 class="text-3xl font-bold mb-2">News- &amp; Makro-Kalender</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Earnings, Zentralbank-Termine und Makro-Events - denn ein Termin in 3 Tagen verändert die Positionsgröße heute
      </p>
    </div>

    <!-- Warnung: anstehende wichtige Termine -->
    <div v-if="criticalUpcoming.length > 0" class="card border-l-4 border-orange-500 bg-orange-50/40 dark:bg-orange-950/30">
      <p class="font-bold text-sm text-orange-900 dark:text-orange-200 mb-2">⚠ Wichtige Termine in den nächsten 7 Tagen</p>
      <ul class="space-y-1 text-sm text-orange-800 dark:text-orange-300">
        <li v-for="e in criticalUpcoming" :key="e.id">
          <b>{{ formatDate(e.date) }}</b>: {{ e.title }}
          <span v-if="e.assetSymbol">({{ e.assetSymbol }})</span>
          — Positionsgröße reduzieren oder Trade aufschieben
        </li>
      </ul>
    </div>

    <!-- Termin eintragen -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Termin eintragen</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Datum *</label>
          <input v-model="form.date" type="date" class="input-field w-full" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Titel *</label>
          <input v-model="form.title" placeholder="z.B. Apple Earnings Q3, EZB-Zinsentscheid" class="input-field w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Kategorie</label>
          <select v-model="form.category" class="input-field w-full">
            <option value="earnings">📊 Earnings</option>
            <option value="zentralbank">🏛️ Zentralbank</option>
            <option value="makro">🌍 Makro-Daten</option>
            <option value="krypto">🪙 Krypto</option>
            <option value="sonstiges">📌 Sonstiges</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Wichtigkeit</label>
          <select v-model="form.importance" class="input-field w-full">
            <option value="niedrig">Niedrig</option>
            <option value="mittel">Mittel</option>
            <option value="hoch">Hoch</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Asset (optional)</label>
          <input v-model="form.assetSymbol" placeholder="z.B. AAPL" class="input-field w-full" />
        </div>
        <div class="md:col-span-3">
          <label class="block text-sm font-medium mb-1">Notiz (optional)</label>
          <input v-model="form.note" placeholder="z.B. Konsens-Erwartung, mögliche Auswirkung" class="input-field w-full" />
        </div>
        <div class="flex items-end">
          <button @click="addEvent" :disabled="!form.date || !form.title.trim()" class="btn btn-primary w-full disabled:opacity-50">
            Eintragen
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-3">
        Quellen zum Nachschlagen: Earnings-Termine auf den Investor-Relations-Seiten der Unternehmen •
        Fed: federalreserve.gov (FOMC-Kalender) • EZB: ecb.europa.eu (Sitzungskalender) •
        Makro: Wirtschaftskalender der Börsenportale
      </p>
    </div>

    <!-- Terminliste -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold">Kommende Termine</h2>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="showPast" class="rounded" /> Vergangene anzeigen
        </label>
      </div>
      <div v-if="visibleEvents.length > 0" class="space-y-2">
        <div v-for="e in visibleEvents" :key="e.id"
          class="p-3 rounded-xl bg-white/40 dark:bg-white/5 flex justify-between items-center flex-wrap gap-2"
          :class="isPast(e.date) ? 'opacity-50' : ''">
          <div class="flex items-center gap-3">
            <div class="text-center min-w-[52px]">
              <p class="font-bold text-sm">{{ formatDateShort(e.date) }}</p>
              <p class="text-xs" :class="daysUntilClass(e.date)">{{ daysUntilLabel(e.date) }}</p>
            </div>
            <div>
              <p class="font-medium text-sm">{{ categoryIcon(e.category) }} {{ e.title }}
                <span v-if="e.assetSymbol" class="text-xs text-gray-500">• {{ e.assetSymbol }}</span>
              </p>
              <p v-if="e.note" class="text-xs text-gray-500">{{ e.note }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span :class="['text-xs px-2 py-0.5 rounded-lg font-medium',
              e.importance === 'hoch' ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200' :
              e.importance === 'mittel' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200' :
              'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300']">
              {{ e.importance }}
            </span>
            <button @click="store.removeCalendarEvent(e.id)" class="text-gray-400 hover:text-red-500">✕</button>
          </div>
        </div>
      </div>
      <p v-else class="text-center py-6 text-gray-500 text-sm">
        Keine Termine eingetragen. Earnings-Termine deiner Positionen gehören hier rein - immer.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import type { CalendarImportance } from '../types'

const store = useAppStore()
const showPast = ref(false)
const today = new Date().toISOString().split('T')[0]

const form = ref({
  date: '',
  title: '',
  category: 'earnings' as 'earnings' | 'zentralbank' | 'makro' | 'krypto' | 'sonstiges',
  importance: 'mittel' as CalendarImportance,
  assetSymbol: '',
  note: ''
})

const visibleEvents = computed(() => {
  return store.calendarEvents.filter(e => showPast.value || e.date >= today)
})

const criticalUpcoming = computed(() => {
  return store.upcomingEvents.filter(e => e.importance === 'hoch')
})

const addEvent = () => {
  if (!form.value.date || !form.value.title.trim()) return
  store.addCalendarEvent({
    id: `cal_${Date.now()}`,
    date: form.value.date,
    title: form.value.title.trim(),
    category: form.value.category,
    importance: form.value.importance,
    assetSymbol: form.value.assetSymbol.trim().toUpperCase() || undefined,
    note: form.value.note.trim() || undefined
  })
  form.value = { date: '', title: '', category: 'earnings', importance: 'mittel', assetSymbol: '', note: '' }
}

const isPast = (date: string) => date < today

const daysUntil = (date: string) => {
  return Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000)
}

const daysUntilLabel = (date: string) => {
  const d = daysUntil(date)
  if (d < 0) return 'vorbei'
  if (d === 0) return 'HEUTE'
  if (d === 1) return 'morgen'
  return `in ${d} T.`
}

const daysUntilClass = (date: string) => {
  const d = daysUntil(date)
  if (d === 0) return 'text-red-600 font-bold warn-blink'
  if (d <= 3 && d > 0) return 'text-orange-600 font-bold'
  return 'text-gray-500'
}

const categoryIcon = (c: string) => ({
  earnings: '📊', zentralbank: '🏛️', makro: '🌍', krypto: '🪙', sonstiges: '📌'
}[c] || '📌')

const formatDate = (date: string) => new Intl.DateTimeFormat('de-DE', {
  weekday: 'short', day: '2-digit', month: '2-digit'
}).format(new Date(date))

const formatDateShort = (date: string) => new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit'
}).format(new Date(date))
</script>
