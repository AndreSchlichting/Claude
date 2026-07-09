<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-bold">Kurs-Historisch</h2>
      <div class="flex gap-2">
        <button
          v-for="interval in ['1d', '1w', '1m']"
          :key="interval"
          @click="selectedInterval = interval"
          :class="[
            'px-2 py-1 text-xs font-medium rounded',
            selectedInterval === interval
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          ]"
        >
          {{ interval === '1d' ? '1T' : interval === '1w' ? '1W' : '1M' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
      <p class="text-gray-600 dark:text-gray-400">Chart wird geladen...</p>
    </div>

    <div v-else-if="chartData" class="w-full">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <div v-else class="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
      <p class="text-gray-600 dark:text-gray-400">Keine Daten verfügbar</p>
    </div>

    <!-- Stats unter Chart -->
    <div v-if="stats" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Hoch</p>
        <p class="font-bold">{{ formatPrice(stats.high) }}</p>
      </div>
      <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Tief</p>
        <p class="font-bold">{{ formatPrice(stats.low) }}</p>
      </div>
      <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Durchschnitt</p>
        <p class="font-bold">{{ formatPrice(stats.average) }}</p>
      </div>
      <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Volatilität</p>
        <p class="font-bold">{{ stats.volatility.toFixed(2) }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { PricePoint } from '../types'

interface Props {
  priceHistory: PricePoint[]
  symbol: string
  isDarkMode?: boolean
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chart = ref<Chart | null>(null)
const selectedInterval = ref('1d')
const loading = ref(false)

const chartData = computed(() => {
  if (!props.priceHistory || props.priceHistory.length === 0) return null

  const labels = props.priceHistory.map(p =>
    new Intl.DateTimeFormat('de-DE', { month: 'short', day: 'numeric' }).format(p.timestamp)
  )

  return {
    labels,
    datasets: [
      {
        label: `${props.symbol} (${selectedInterval.value})`,
        data: props.priceHistory.map(p => p.close),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointHoverRadius: 5
      }
    ]
  }
})

const stats = computed(() => {
  if (!props.priceHistory || props.priceHistory.length === 0) return null

  const closes = props.priceHistory.map(p => p.close)
  const high = Math.max(...closes)
  const low = Math.min(...closes)
  const average = closes.reduce((a, b) => a + b, 0) / closes.length

  // Volatilität (Standardabweichung)
  const variance = closes.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / closes.length
  const volatility = Math.sqrt(variance) / average * 100

  return {
    high,
    low,
    average,
    volatility
  }
})

const renderChart = () => {
  if (!chartCanvas.value || !chartData.value) return

  const isDark = props.isDarkMode || document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#9CA3AF' : '#6B7280'
  const gridColor = isDark ? '#374151' : '#E5E7EB'

  if (chart.value) {
    chart.value.destroy()
  }

  chart.value = new Chart(chartCanvas.value, {
    type: 'line',
    data: chartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: textColor,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          titleColor: isDark ? '#FFFFFF' : '#000000',
          bodyColor: isDark ? '#FFFFFF' : '#000000',
          borderColor: gridColor,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `€ ${context.parsed.y.toFixed(2)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: { size: 11 }
          }
        },
        y: {
          grid: {
            color: gridColor,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: { size: 11 },
            callback: function(value) {
              return '€ ' + value.toFixed(0)
            }
          }
        }
      }
    }
  })
}

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

onMounted(() => {
  renderChart()
})

watch(() => props.priceHistory, () => {
  renderChart()
})

watch(selectedInterval, () => {
  renderChart()
})
</script>
