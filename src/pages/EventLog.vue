<template>
  <div class="space-y-6">
    <div class="card">
      <h1 class="text-3xl font-bold mb-2">Ereignisprotokoll</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Alle Signale, Warnungen und Trades werden historisch gespeichert und fließen ins Review ein
      </p>
    </div>

    <!-- Filter -->
    <div class="card grid grid-cols-1 md:grid-cols-3 gap-4">
      <select v-model="filterType" class="input-field">
        <option value="">-- Alle Ereignistypen --</option>
        <option v-for="(label, type) in eventTypeLabels" :key="type" :value="type">{{ label }}</option>
      </select>
      <input v-model="filterAsset" placeholder="Asset-Symbol filtern..." class="input-field" />
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="hideFalseAlarms" class="rounded" />
        Falsche Alarme ausblenden
      </label>
    </div>

    <!-- Events -->
    <div class="card">
      <div v-if="filteredEvents.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="py-3 flex justify-between items-start gap-4"
          :class="event.markedAsFalseAlarm ? 'opacity-40' : ''"
        >
          <div class="flex items-start gap-3 min-w-0">
            <span :class="['mt-1 shrink-0 w-2.5 h-2.5 rounded-full', typeColor(event.type)]"></span>
            <div class="min-w-0">
              <p class="font-medium text-sm">
                <span v-if="event.assetSymbol" class="font-bold">{{ event.assetSymbol }}:</span>
                {{ event.message }}
              </p>
              <p v-if="event.detail" class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{{ event.detail }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ eventTypeLabels[event.type] || event.type }} • {{ formatTime(event.timestamp) }}
              </p>
            </div>
          </div>
          <button
            v-if="!event.markedAsFalseAlarm && isWarningType(event.type)"
            @click="store.markEventAsFalseAlarm(event.id)"
            class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
            title="Als falschen Alarm markieren"
          >
            Falscher Alarm
          </button>
          <span v-else-if="event.markedAsFalseAlarm" class="text-xs text-gray-500 shrink-0">
            als Fehlalarm markiert
          </span>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-600 dark:text-gray-400">
        <p>Noch keine Ereignisse protokolliert</p>
        <p class="text-sm mt-1">Signale, Warnungen und Trades erscheinen hier automatisch</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import type { EventType } from '../types'

const store = useAppStore()
const filterType = ref('')
const filterAsset = ref('')
const hideFalseAlarms = ref(false)

const eventTypeLabels: Record<string, string> = {
  signal_erzeugt: 'Signal erzeugt',
  signal_blockiert: 'Signal blockiert',
  warnung_ausgeloest: 'Warnung ausgelöst',
  stop_erreicht: 'Stop erreicht',
  ziel_erreicht: 'Ziel erreicht',
  starke_bewegung: 'Starke Bewegung',
  news_erkannt: 'News erkannt',
  scam_warnung: 'Scam-Warnung',
  datenfehler: 'Datenfehler',
  trade_ausgefuehrt: 'Trade ausgeführt',
  trade_verworfen: 'Trade verworfen',
  regelbruch: 'Regelbruch',
  steuerereignis: 'Steuerereignis',
  gebuehrenaenderung: 'Gebührenänderung',
  testposition_angelegt: 'Testposition angelegt',
  modus_geaendert: 'Modus geändert'
}

const filteredEvents = computed(() => {
  return store.eventLog.filter(e => {
    if (filterType.value && e.type !== filterType.value) return false
    if (filterAsset.value && !(e.assetSymbol || '').toLowerCase().includes(filterAsset.value.toLowerCase())) return false
    if (hideFalseAlarms.value && e.markedAsFalseAlarm) return false
    return true
  })
})

const isWarningType = (type: EventType) => {
  return ['warnung_ausgeloest', 'starke_bewegung', 'scam_warnung', 'datenfehler', 'stop_erreicht'].includes(type)
}

const typeColor = (type: EventType) => {
  if (['scam_warnung', 'stop_erreicht', 'regelbruch'].includes(type)) return 'bg-red-500'
  if (['warnung_ausgeloest', 'starke_bewegung', 'datenfehler'].includes(type)) return 'bg-orange-500'
  if (['ziel_erreicht', 'trade_ausgefuehrt'].includes(type)) return 'bg-green-500'
  if (['signal_erzeugt', 'testposition_angelegt'].includes(type)) return 'bg-blue-500'
  return 'bg-gray-400'
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(date))
}
</script>
