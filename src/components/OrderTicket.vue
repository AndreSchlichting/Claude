<template>
  <div class="card border-2 border-primary/60">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h2 class="text-lg font-bold">📋 Order-Ticket (manuelle Bestätigung)</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Kein Trade ohne bewusste Freigabe - das Ticket wird erst nach deiner Checkliste ausgeführt
        </p>
      </div>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
    </div>

    <!-- Order-Daten -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-500">Asset</p>
        <p class="font-bold">{{ asset.symbol }}</p>
        <p class="text-xs text-gray-500">{{ signal.signalType }}</p>
      </div>
      <div class="p-3 rounded-xl bg-green-50/60 dark:bg-green-950/30">
        <p class="text-xs text-gray-500">Einstieg</p>
        <p class="font-bold">{{ signal.entry.toFixed(2) }}</p>
      </div>
      <div class="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/30">
        <p class="text-xs text-gray-500">Stop</p>
        <p class="font-bold">{{ signal.stop.toFixed(2) }}</p>
      </div>
      <div class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30">
        <p class="text-xs text-gray-500">Ziel</p>
        <p class="font-bold">{{ signal.target.toFixed(2) }}</p>
      </div>
    </div>

    <!-- Positionsgröße aus Risiko -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Kontogröße (€)</label>
        <input v-model.number="accountSize" type="number" min="0" class="input-field w-full text-sm" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Risiko ({{ store.settings.riskPerTrade }}% laut Einstellungen)</label>
        <p class="font-bold pt-2">{{ riskEuro.toFixed(2) }} €</p>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Stückzahl (berechnet)</label>
        <p class="font-bold text-primary pt-2">{{ shares }}</p>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Ordervolumen + Gebühr</label>
        <p class="font-bold pt-2">{{ orderValue.toFixed(2) }} € <span class="text-xs text-gray-500">+ {{ store.settings.feeProfile.buyFee.toFixed(2) }} €</span></p>
      </div>
    </div>

    <!-- Pflicht-Checkliste (Brutal-Modus-Prinzipien) -->
    <div class="mb-4 p-4 rounded-xl bg-white/40 dark:bg-white/5">
      <p class="font-bold text-sm mb-3">Freigabe-Checkliste (alle Punkte Pflicht)</p>
      <label v-for="(item, i) in checklist" :key="i" class="flex items-start gap-2 text-sm py-1 cursor-pointer">
        <input type="checkbox" v-model="item.checked" class="rounded mt-0.5" />
        <span>{{ item.label }}</span>
      </label>
    </div>

    <!-- Blockaden -->
    <div v-if="blockers.length > 0" class="mb-4 p-3 rounded-xl bg-red-50/70 dark:bg-red-950/40">
      <p class="text-sm font-bold text-red-900 dark:text-red-200 mb-1">Ausführung blockiert:</p>
      <p v-for="(b, i) in blockers" :key="i" class="text-xs text-red-800 dark:text-red-300">• {{ b }}</p>
    </div>

    <div class="flex gap-3">
      <button
        @click="execute"
        :disabled="!canExecute"
        class="btn btn-primary flex-1 disabled:opacity-40"
      >
        ✓ Bestätigen &amp; ins {{ targetPortfolioLabel }} ausführen
      </button>
      <button @click="discard" class="btn btn-secondary">Verwerfen</button>
    </div>
    <p class="text-xs text-gray-500 mt-3">
      Hinweis: Echte Broker-Anbindung (Ausbaustufe 3.0) folgt später - bis dahin wird die Order
      im {{ targetPortfolioLabel }} simuliert und du führst sie parallel manuell beim Broker aus.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import type { Asset } from '../types'
import type { IntrabarSignal } from '../services/daytradingEngine'

const props = defineProps<{
  signal: IntrabarSignal
  asset: Asset
}>()

const emit = defineEmits<{ close: [] }>()

const store = useAppStore()
const accountSize = ref(10000)

const checklist = ref([
  { label: 'Ausstiegsplan ist klar: Stop und Ziel sind gesetzt und werden respektiert', checked: false },
  { label: `Chance-Risiko geprüft (${props.signal.riskReward.toFixed(2)}:1) und akzeptiert`, checked: false },
  { label: 'Keine rote/schwarze Warnung für dieses Asset aktiv', checked: false },
  { label: 'Kalender geprüft: kein wichtiger Termin (Earnings etc.) im Zielzeitraum', checked: false },
  { label: 'Emotion geprüft: Einstieg ist geplant, kein FOMO/Rache-Trade', checked: false }
])

const riskEuro = computed(() => accountSize.value * (store.settings.riskPerTrade / 100))

const shares = computed(() => {
  const riskPerShare = props.signal.entry - props.signal.stop
  if (riskPerShare <= 0) return 0
  return Math.floor(riskEuro.value / riskPerShare)
})

const orderValue = computed(() => shares.value * props.signal.entry)

const grade = computed<'A' | 'B' | 'C'>(() => {
  if (props.signal.riskReward >= 2 && props.signal.confidence >= 75) return 'A'
  if (props.signal.riskReward >= 1.5 && props.signal.confidence >= 60) return 'B'
  return 'C'
})

// Im Brutal-Modus: C-Setups nur Paper (§127.2). Ohne echte Broker-API landet ohnehin alles im Paper-Portfolio.
const targetPortfolioLabel = 'Paper-Portfolio'

const blockers = computed(() => {
  const list: string[] = []
  if (store.settings.riskOffMode) list.push('Risk-Off-Modus aktiv - keine neuen Trades (§142.6)')
  if (props.signal.riskReward < 1) list.push(`Chance-Risiko ${props.signal.riskReward.toFixed(2)}:1 unter 1:1`)
  if (shares.value <= 0) list.push('Stückzahl 0 - Kontogröße/Stop prüfen')
  const assetWarning = store.activeWarnings.find(w => w.assetId === props.asset.id && (w.level === 'red' || w.level === 'black'))
  if (assetWarning) list.push(`Aktive ${assetWarning.level === 'red' ? 'ROTE' : 'SCHWARZE'} Warnung für ${props.asset.symbol}`)
  if (store.settings.brutalSuccessModeEnabled && grade.value === 'C') {
    // Paper ist erlaubt - nur Hinweis, keine Blockade
  }
  return list
})

const canExecute = computed(() =>
  blockers.value.length === 0 && checklist.value.every(c => c.checked)
)

const execute = () => {
  const portfolio = store.portfolios.find(p => p.type === 'paper')
  if (!portfolio || !canExecute.value) return

  store.addPosition(portfolio.id, {
    id: `pos_ticket_${Date.now()}`,
    asset: props.asset,
    quantity: shares.value,
    buyPrice: props.signal.entry,
    buyDate: new Date(),
    buyFees: store.settings.feeProfile.buyFee,
    currency: props.asset.currency,
    portfolioType: 'paper',
    entryThesis: `${props.signal.signalType}: ${props.signal.reason}`,
    stopLoss: props.signal.stop,
    profitTarget: props.signal.target
  })

  store.addTransaction({
    id: `tx_ticket_${Date.now()}`,
    portfolioId: portfolio.id,
    assetId: props.asset.id,
    type: 'buy',
    quantity: shares.value,
    price: props.signal.entry,
    fees: store.settings.feeProfile.buyFee,
    taxes: 0,
    currency: props.asset.currency,
    date: new Date(),
    note: `Order-Ticket ${grade.value}-Setup`
  })

  store.logEvent('trade_ausgefuehrt',
    `Order-Ticket bestätigt: ${shares.value}x ${props.asset.symbol} @ ${props.signal.entry.toFixed(2)} (${grade.value}-Setup, Paper)`,
    { assetId: props.asset.id, assetSymbol: props.asset.symbol, detail: `Stop ${props.signal.stop.toFixed(2)}, Ziel ${props.signal.target.toFixed(2)}` })

  emit('close')
}

const discard = () => {
  store.logEvent('trade_verworfen',
    `Order-Ticket verworfen: ${props.asset.symbol} ${props.signal.signalType}`,
    { assetId: props.asset.id, assetSymbol: props.asset.symbol })
  emit('close')
}
</script>
