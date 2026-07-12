<template>
  <div class="card">
    <h2 class="text-lg font-bold mb-2">Tranchenplan</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Gestaffelter Ein- und Ausstieg: Nicht alles auf einmal kaufen, sondern in Tranchen -
      das reduziert das Timing-Risiko und erzwingt einen Plan.
    </p>

    <!-- Grunddaten -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium mb-1">Asset-Symbol *</label>
        <input v-model="form.assetSymbol" placeholder="z.B. AAPL, BTC" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Gesamtkapital (€) *</label>
        <input v-model.number="form.totalCapital" type="number" min="0" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Harter Stop *</label>
        <input v-model.number="form.stopPrice" type="number" step="0.01" min="0" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Richtung</label>
        <select v-model="form.direction" class="input-field w-full">
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
      </div>
    </div>

    <!-- Einstiegs-Tranchen -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <p class="font-bold text-sm text-green-700 dark:text-green-400">Einstiegs-Tranchen</p>
        <button @click="form.entries.push({ price: 0, percent: 0 })" class="text-xs text-primary font-medium">+ Tranche</button>
      </div>
      <div class="space-y-2">
        <div v-for="(t, i) in form.entries" :key="'e' + i" class="flex gap-2 items-center">
          <span class="text-xs text-gray-500 w-6">{{ i + 1 }}.</span>
          <input v-model.number="t.price" type="number" step="0.01" placeholder="Kurs" class="input-field flex-1 text-sm" />
          <input v-model.number="t.percent" type="number" step="5" placeholder="% der Position" class="input-field w-28 text-sm" />
          <span class="text-xs text-gray-500 w-4">%</span>
          <button v-if="form.entries.length > 1" @click="form.entries.splice(i, 1)" class="text-gray-400 hover:text-red-500">✕</button>
        </div>
      </div>
      <p v-if="entrySumWarning" class="text-xs text-orange-600 mt-1">⚠ {{ entrySumWarning }}</p>
    </div>

    <!-- Ausstiegs-Tranchen -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <p class="font-bold text-sm text-blue-700 dark:text-blue-400">Ausstiegs-Tranchen (Ziele)</p>
        <button @click="form.exits.push({ price: 0, percent: 0 })" class="text-xs text-primary font-medium">+ Tranche</button>
      </div>
      <div class="space-y-2">
        <div v-for="(t, i) in form.exits" :key="'x' + i" class="flex gap-2 items-center">
          <span class="text-xs text-gray-500 w-6">{{ i + 1 }}.</span>
          <input v-model.number="t.price" type="number" step="0.01" placeholder="Zielkurs" class="input-field flex-1 text-sm" />
          <input v-model.number="t.percent" type="number" step="5" placeholder="% der Position" class="input-field w-28 text-sm" />
          <span class="text-xs text-gray-500 w-4">%</span>
          <button v-if="form.exits.length > 1" @click="form.exits.splice(i, 1)" class="text-gray-400 hover:text-red-500">✕</button>
        </div>
      </div>
    </div>

    <!-- Berechnung -->
    <div v-if="calc" class="mb-4 p-4 rounded-xl bg-white/40 dark:bg-white/5">
      <p class="font-bold text-sm mb-3">Plan-Berechnung</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p class="text-xs text-gray-500">Stück gesamt</p>
          <p class="font-bold">{{ calc.totalShares.toFixed(4) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Ø Einstieg</p>
          <p class="font-bold">{{ calc.avgEntry.toFixed(2) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Risiko am Stop</p>
          <p class="font-bold text-red-600">{{ calc.riskAtStop.toFixed(2) }} €</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Gewinn wenn alle Ziele treffen</p>
          <p class="font-bold text-green-600">+{{ calc.profitIfAllExits.toFixed(2) }} €</p>
        </div>
      </div>
      <div class="mt-3 pt-3 border-t border-white/40 dark:border-white/10 space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <p v-for="(row, i) in calc.entryRows" :key="i">
          Einstieg {{ i + 1 }}: {{ row.shares.toFixed(4) }} Stück @ {{ row.price.toFixed(2) }} = {{ row.value.toFixed(2) }} €
        </p>
      </div>
      <p v-if="calc.riskWarning" class="mt-2 text-xs text-orange-600 font-medium">⚠ {{ calc.riskWarning }}</p>
    </div>

    <div class="flex gap-3">
      <button @click="savePlan" :disabled="!isValid" class="btn btn-primary flex-1 disabled:opacity-50">
        Tranchenplan speichern
      </button>
    </div>

    <!-- Gespeicherte Pläne -->
    <div v-if="store.tranchePlans.length > 0" class="mt-6 pt-4 border-t border-white/40 dark:border-white/10">
      <p class="font-bold text-sm mb-3">Gespeicherte Pläne</p>
      <div class="space-y-2">
        <div v-for="plan in store.tranchePlans" :key="plan.id"
          class="p-3 rounded-xl bg-white/40 dark:bg-white/5 flex justify-between items-center flex-wrap gap-2 text-sm">
          <div>
            <p class="font-bold">{{ plan.assetSymbol }} ({{ plan.direction }}) • {{ plan.totalCapital.toFixed(0) }} €</p>
            <p class="text-xs text-gray-500">
              Einstiege: {{ plan.entries.map(t => `${t.percent}% @ ${t.price}`).join(' → ') }}
              • Stop {{ plan.stopPrice }}
              • Ziele: {{ plan.exits.map(t => `${t.percent}% @ ${t.price}`).join(' → ') }}
            </p>
          </div>
          <button @click="store.removeTranchePlan(plan.id)" class="text-gray-400 hover:text-red-500">✕</button>
        </div>
      </div>
    </div>

    <p v-if="store.settings.learningHints" class="mt-4 text-xs text-blue-700 dark:text-blue-300">
      💡 Tranchen sind ein Plan, kein Nachkauf-Freibrief: Nachkaufen nur an vorher definierten Leveln
      mit intaktem Setup - nie, um einen Verlust zu "verbilligen" (Martingale zerstört Konten).
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import type { Tranche } from '../types'

const store = useAppStore()

const form = ref({
  assetSymbol: '',
  direction: 'long' as 'long' | 'short',
  totalCapital: 1000,
  stopPrice: 0,
  entries: [
    { price: 0, percent: 40 },
    { price: 0, percent: 30 },
    { price: 0, percent: 30 }
  ] as Tranche[],
  exits: [
    { price: 0, percent: 50 },
    { price: 0, percent: 50 }
  ] as Tranche[]
})

const entrySum = computed(() => form.value.entries.reduce((s, t) => s + (t.percent || 0), 0))

const entrySumWarning = computed(() => {
  if (Math.abs(entrySum.value - 100) > 0.5) {
    return `Einstiegs-Tranchen ergeben ${entrySum.value}% statt 100%`
  }
  return ''
})

const validEntries = computed(() => form.value.entries.filter(t => t.price > 0 && t.percent > 0))

const isValid = computed(() =>
  form.value.assetSymbol.trim() &&
  form.value.totalCapital > 0 &&
  form.value.stopPrice > 0 &&
  validEntries.value.length > 0 &&
  Math.abs(entrySum.value - 100) <= 0.5
)

const calc = computed(() => {
  const entries = validEntries.value
  if (entries.length === 0 || form.value.totalCapital <= 0) return null

  const entryRows = entries.map(t => {
    const value = form.value.totalCapital * (t.percent / 100)
    return { price: t.price, percent: t.percent, value, shares: value / t.price }
  })

  const totalShares = entryRows.reduce((s, r) => s + r.shares, 0)
  const totalValue = entryRows.reduce((s, r) => s + r.value, 0)
  const avgEntry = totalShares > 0 ? totalValue / totalShares : 0

  const sign = form.value.direction === 'long' ? 1 : -1
  const riskAtStop = Math.max(0, (avgEntry - form.value.stopPrice) * totalShares * sign)

  const validExits = form.value.exits.filter(t => t.price > 0 && t.percent > 0)
  const profitIfAllExits = validExits.reduce((s, t) => {
    const shares = totalShares * (t.percent / 100)
    return s + (t.price - avgEntry) * shares * sign
  }, 0)

  let riskWarning = ''
  const riskPercent = form.value.totalCapital > 0 ? (riskAtStop / form.value.totalCapital) * 100 : 0
  if (riskPercent > 15) {
    riskWarning = `Risiko am Stop = ${riskPercent.toFixed(0)}% des eingesetzten Kapitals - Stop weiter weg als sinnvoll oder Tranchen zu aggressiv.`
  }
  if (form.value.direction === 'long' && form.value.stopPrice >= avgEntry && avgEntry > 0) {
    riskWarning = 'Stop liegt über dem Ø-Einstieg - das ist bei Long kein Schutz.'
  }

  return { entryRows, totalShares, avgEntry, riskAtStop, profitIfAllExits, riskWarning }
})

const savePlan = () => {
  if (!isValid.value) return
  store.addTranchePlan({
    id: `tp_${Date.now()}`,
    createdAt: new Date(),
    assetSymbol: form.value.assetSymbol.trim().toUpperCase(),
    direction: form.value.direction,
    totalCapital: form.value.totalCapital,
    stopPrice: form.value.stopPrice,
    entries: validEntries.value.map(t => ({ ...t })),
    exits: form.value.exits.filter(t => t.price > 0 && t.percent > 0).map(t => ({ ...t }))
  })
  form.value.assetSymbol = ''
}
</script>
