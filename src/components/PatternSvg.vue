<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" preserveAspectRatio="xMidYMid meet">
    <rect :width="W" :height="H" rx="8" class="fill-white/60 dark:fill-white/5" />
    <g v-for="(k, i) in candles" :key="i">
      <line :x1="k.x" :x2="k.x" :y1="k.yHigh" :y2="k.yLow"
        :stroke="k.up ? '#16a34a' : '#dc2626'" stroke-width="2" />
      <rect :x="k.x - cw / 2" :y="Math.min(k.yOpen, k.yClose)"
        :width="cw" :height="Math.max(2, Math.abs(k.yClose - k.yOpen))"
        :fill="k.up ? '#16a34a' : '#dc2626'" rx="1" />
    </g>
    <!-- Markierung der Musterkerzen -->
    <rect v-if="highlightCount > 0"
      :x="candles[candles.length - highlightCount].x - cw"
      :y="4" :width="highlightCount * step" :height="H - 8"
      fill="none" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="4 3" rx="6" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Schemabild eines Kerzenmusters aus [open, high, low, close]-Beispieldaten
const props = defineProps<{
  sample: number[][]
  highlightCount?: number  // wie viele Kerzen am Ende gehören zum Muster
}>()

const W = 260
const H = 130
const step = computed(() => W / (props.sample.length + 0.5))
const cw = computed(() => Math.min(22, step.value * 0.55))

const highlightCount = computed(() => props.highlightCount || 0)

const candles = computed(() => {
  const highs = props.sample.map(s => s[1])
  const lows = props.sample.map(s => s[2])
  const min = Math.min(...lows)
  const max = Math.max(...highs)
  const y = (v: number) => 10 + (H - 20) * (1 - (v - min) / (max - min || 1))
  return props.sample.map((s, i) => ({
    x: step.value * (i + 0.75),
    yOpen: y(s[0]), yHigh: y(s[1]), yLow: y(s[2]), yClose: y(s[3]),
    up: s[3] >= s[0]
  }))
})
</script>

<script lang="ts">
export default { name: 'PatternSvg' }
</script>
