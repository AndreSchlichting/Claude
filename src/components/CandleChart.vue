<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-bold">{{ title || 'Kursverlauf' }}</h2>
      <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm" style="background:#16a34a"></span> steigend
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-sm" style="background:#dc2626"></span> fallend
        </span>
      </div>
    </div>

    <div v-if="candles.length === 0" class="w-full h-64 flex items-center justify-center text-gray-500">
      Keine Kursdaten verfügbar
    </div>

    <svg v-else :viewBox="`0 0 ${W} ${H}`" class="w-full select-none" preserveAspectRatio="none">
      <!-- Grid + Y-Achse -->
      <g v-for="tick in yTicks" :key="tick.y">
        <line :x1="padL" :x2="W - padR" :y1="tick.y" :y2="tick.y"
          stroke="currentColor" stroke-opacity="0.08" stroke-width="1" />
        <text :x="W - padR + 4" :y="tick.y + 3" font-size="9" fill="currentColor" fill-opacity="0.55">
          {{ tick.label }}
        </text>
      </g>

      <!-- Schlüsselzonen (optional) -->
      <g v-for="(zone, i) in zoneLines" :key="'z' + i">
        <line :x1="padL" :x2="W - padR" :y1="zone.y" :y2="zone.y"
          :stroke="zone.color" stroke-width="1" stroke-dasharray="4 3" stroke-opacity="0.6" />
        <text :x="padL + 2" :y="zone.y - 3" font-size="8" :fill="zone.color" fill-opacity="0.9">
          {{ zone.label }}
        </text>
      </g>

      <!-- Volumen-Balken -->
      <g v-for="(c, i) in candles" :key="'v' + i">
        <rect :x="c.x - candleW / 2" :y="volTop + (volH - c.volBarH)" :width="candleW" :height="c.volBarH"
          :fill="c.up ? '#16a34a' : '#dc2626'" opacity="0.30" />
      </g>

      <!-- Kerzen -->
      <g v-for="(c, i) in candles" :key="'c' + i">
        <line :x1="c.x" :x2="c.x" :y1="c.yHigh" :y2="c.yLow"
          :stroke="c.up ? '#16a34a' : '#dc2626'" stroke-width="1" />
        <rect :x="c.x - candleW / 2" :y="Math.min(c.yOpen, c.yClose)"
          :width="candleW" :height="Math.max(1, Math.abs(c.yClose - c.yOpen))"
          :fill="c.up ? '#16a34a' : '#dc2626'" rx="0.5" />
      </g>

      <!-- X-Achsen-Labels -->
      <text v-for="(lbl, i) in xLabels" :key="'x' + i" :x="lbl.x" :y="H - 2"
        font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.55">
        {{ lbl.text }}
      </text>
    </svg>

    <!-- Stats -->
    <div v-if="stats" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-600 dark:text-gray-400">Hoch</p>
        <p class="font-bold text-sm">{{ stats.high.toFixed(2) }}</p>
      </div>
      <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-600 dark:text-gray-400">Tief</p>
        <p class="font-bold text-sm">{{ stats.low.toFixed(2) }}</p>
      </div>
      <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-600 dark:text-gray-400">Veränderung</p>
        <p :class="['font-bold text-sm', stats.changePercent >= 0 ? 'text-green-600' : 'text-red-600']">
          {{ stats.changePercent >= 0 ? '+' : '' }}{{ stats.changePercent.toFixed(2) }}%
        </p>
      </div>
      <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
        <p class="text-xs text-gray-600 dark:text-gray-400">Ø Volumen</p>
        <p class="font-bold text-sm">{{ formatVolume(stats.avgVolume) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PricePoint } from '../types'
import type { KeyZone } from '../services/indicators'

interface Props {
  priceHistory: PricePoint[]
  title?: string
  zones?: KeyZone[]
  maxCandles?: number
}

const props = defineProps<Props>()

const W = 800
const H = 320
const padL = 8
const padR = 52
const padT = 10
const chartH = 230
const volTop = padT + chartH + 8
const volH = 50

const visible = computed(() => {
  const max = props.maxCandles || 80
  return props.priceHistory.slice(-max)
})

const priceRange = computed(() => {
  if (visible.value.length === 0) return { min: 0, max: 1 }
  let min = Math.min(...visible.value.map(p => p.low))
  let max = Math.max(...visible.value.map(p => p.high))
  // Zonen einbeziehen, falls nah
  props.zones?.forEach(z => {
    if (z.price > min * 0.9 && z.price < max * 1.1) {
      min = Math.min(min, z.price)
      max = Math.max(max, z.price)
    }
  })
  const pad = (max - min) * 0.05 || 1
  return { min: min - pad, max: max + pad }
})

const yFor = (price: number) => {
  const { min, max } = priceRange.value
  return padT + chartH - ((price - min) / (max - min)) * chartH
}

const candleW = computed(() => {
  const n = visible.value.length || 1
  return Math.max(2, Math.min(12, ((W - padL - padR) / n) * 0.65))
})

const candles = computed(() => {
  const n = visible.value.length
  if (n === 0) return []
  const step = (W - padL - padR) / n
  const maxVol = Math.max(...visible.value.map(p => p.volume), 1)
  return visible.value.map((p, i) => ({
    x: padL + step * (i + 0.5),
    yOpen: yFor(p.open),
    yClose: yFor(p.close),
    yHigh: yFor(p.high),
    yLow: yFor(p.low),
    up: p.close >= p.open,
    volBarH: (p.volume / maxVol) * volH
  }))
})

const yTicks = computed(() => {
  const { min, max } = priceRange.value
  const ticks = []
  for (let i = 0; i <= 4; i++) {
    const price = min + ((max - min) * i) / 4
    ticks.push({ y: yFor(price), label: price >= 1000 ? price.toFixed(0) : price.toFixed(2) })
  }
  return ticks
})

const xLabels = computed(() => {
  const n = visible.value.length
  if (n === 0) return []
  const step = (W - padL - padR) / n
  const count = 5
  const labels = []
  for (let i = 0; i < count; i++) {
    const idx = Math.min(n - 1, Math.floor((n - 1) * (i / (count - 1))))
    const p = visible.value[idx]
    labels.push({
      x: padL + step * (idx + 0.5),
      text: new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(new Date(p.timestamp))
    })
  }
  return labels
})

const zoneLines = computed(() => {
  if (!props.zones) return []
  const { min, max } = priceRange.value
  return props.zones
    .filter(z => z.price >= min && z.price <= max)
    .map(z => ({
      y: yFor(z.price),
      color: z.type === 'unterstuetzung' ? '#16a34a' : '#dc2626',
      label: `${z.type === 'unterstuetzung' ? 'S' : 'R'} ${z.price.toFixed(2)}`
    }))
})

const stats = computed(() => {
  if (visible.value.length === 0) return null
  const high = Math.max(...visible.value.map(p => p.high))
  const low = Math.min(...visible.value.map(p => p.low))
  const first = visible.value[0].close
  const last = visible.value[visible.value.length - 1].close
  const avgVolume = visible.value.reduce((s, p) => s + p.volume, 0) / visible.value.length
  return { high, low, changePercent: ((last - first) / first) * 100, avgVolume }
})

const formatVolume = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + ' Mrd'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' Mio'
  if (v >= 1e3) return (v / 1e3).toFixed(0) + ' Tsd'
  return v.toFixed(0)
}
</script>
