<template>
  <div class="card">
    <h2 class="text-lg font-bold mb-2">Positionsgrößen-Rechner</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Profis rechnen rückwärts vom Risiko: Erst das Risiko in Euro, dann die Stückzahl - nie umgekehrt.
    </p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1">Kontogröße (€)</label>
        <input v-model.number="accountSize" type="number" min="0" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Risiko pro Trade (%)</label>
        <input v-model.number="riskPercent" type="number" step="0.1" min="0.1" max="10" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Einstiegskurs</label>
        <input v-model.number="entry" type="number" step="0.01" min="0" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Stop-Kurs</label>
        <input v-model.number="stop" type="number" step="0.01" min="0" class="input-field w-full" />
      </div>
    </div>

    <div v-if="result" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-500">Risiko in Euro</p>
        <p class="font-bold text-lg">{{ result.riskEuro.toFixed(2) }} €</p>
      </div>
      <div class="p-3 rounded-xl bg-primary/10 border border-primary/30">
        <p class="text-xs text-gray-500">Stückzahl</p>
        <p class="font-bold text-lg text-primary">{{ result.shares }}</p>
      </div>
      <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-500">Positionswert</p>
        <p class="font-bold text-lg">{{ result.positionValue.toFixed(2) }} €</p>
      </div>
      <div class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-500">Stop-Abstand</p>
        <p class="font-bold text-lg">{{ result.stopDistancePercent.toFixed(2) }}%</p>
      </div>
    </div>

    <div v-if="result && result.warnings.length" class="mt-3 p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/40">
      <p v-for="(w, i) in result.warnings" :key="i" class="text-xs text-orange-800 dark:text-orange-300">⚠ {{ w }}</p>
    </div>

    <p v-if="invalidInput" class="mt-3 text-sm text-red-600">
      Stop muss unter dem Einstieg liegen (Long-Berechnung) und alle Werte größer 0 sein.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'

const store = useAppStore()

const accountSize = ref(10000)
const riskPercent = ref(store.settings.riskPerTrade || 1)
const entry = ref(0)
const stop = ref(0)

const invalidInput = computed(() => {
  return entry.value > 0 && stop.value > 0 && stop.value >= entry.value
})

const result = computed(() => {
  if (entry.value <= 0 || stop.value <= 0 || stop.value >= entry.value || accountSize.value <= 0) return null

  const riskEuro = accountSize.value * (riskPercent.value / 100)
  const riskPerShare = entry.value - stop.value
  const shares = Math.floor(riskEuro / riskPerShare)
  const positionValue = shares * entry.value
  const stopDistancePercent = (riskPerShare / entry.value) * 100

  const warnings: string[] = []
  const maxPosition = accountSize.value * (store.settings.maxPositionSize / 100)
  if (positionValue > maxPosition) {
    warnings.push(`Positionswert (${positionValue.toFixed(0)}€) über Max-Einzelposition (${store.settings.maxPositionSize}% = ${maxPosition.toFixed(0)}€). Stückzahl reduzieren oder Stop enger (aber nur wenn technisch sinnvoll!).`)
  }
  if (stopDistancePercent < 0.5) {
    warnings.push('Stop-Abstand unter 0,5% - Gefahr, durch normales Rauschen ausgestoppt zu werden.')
  }
  if (riskPercent.value > 2) {
    warnings.push('Mehr als 2% Risiko pro Trade widerspricht dem Kapitalerhalt-Grundsatz.')
  }

  return { riskEuro, shares, positionValue, stopDistancePercent, warnings }
})
</script>
