<template>
  <div class="card flex items-center justify-between flex-wrap gap-4">
    <div class="flex items-center gap-4">
      <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg', lightClass]">
        {{ lightIcon }}
      </div>
      <div>
        <p class="font-bold">Marktampel: {{ lightLabel }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ description }}</p>
      </div>
    </div>
    <div class="text-right">
      <p class="text-xs text-gray-500">Assets über EMA50</p>
      <p class="font-bold text-lg">{{ aboveCount }} / {{ totalCount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores'
import { ema } from '../services/indicators'

const store = useAppStore()

/**
 * Marktampel / Regime-Filter: Wie viele Assets notieren über ihrem EMA50?
 * Beantwortet die Frage: Ist heute überhaupt ein Long-Tag?
 */
const assessment = computed(() => {
  let above = 0
  let total = 0
  store.assets.forEach(asset => {
    const h = asset.priceHistory
    if (!h || h.length < 50 || asset.currentPrice <= 0) return
    const closes = h.map(p => p.close)
    const ema50 = ema(closes, 50)
    total++
    if (asset.currentPrice > ema50[ema50.length - 1]) above++
  })
  return { above, total, share: total > 0 ? above / total : 0.5 }
})

const aboveCount = computed(() => assessment.value.above)
const totalCount = computed(() => assessment.value.total)

const light = computed(() => {
  if (assessment.value.total === 0) return 'unklar'
  if (assessment.value.share >= 0.6) return 'gruen'
  if (assessment.value.share >= 0.4) return 'gelb'
  return 'rot'
})

const lightClass = computed(() => ({
  gruen: 'bg-green-500/90',
  gelb: 'bg-yellow-500/90',
  rot: 'bg-red-500/90',
  unklar: 'bg-gray-400/90'
}[light.value]))

const lightIcon = computed(() => ({ gruen: '🟢', gelb: '🟡', rot: '🔴', unklar: '⚪' }[light.value]))

const lightLabel = computed(() => ({
  gruen: 'Risk-on', gelb: 'Gemischt', rot: 'Risk-off', unklar: 'Keine Daten'
}[light.value]))

const description = computed(() => ({
  gruen: 'Breiter Markt über EMA50 - Long-Setups haben Rückenwind.',
  gelb: 'Gemischtes Bild - nur A-Setups handeln, Positionsgrößen reduzieren.',
  rot: 'Mehrheit unter EMA50 - Kapitalschutz vor Rendite. Long nur mit sehr gutem Grund.',
  unklar: 'Kursdaten laden, um die Marktlage zu bewerten.'
}[light.value]))
</script>
