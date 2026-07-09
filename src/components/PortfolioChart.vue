<template>
  <div class="card">
    <h2 class="text-lg font-bold mb-4">Portfolio Verteilung</h2>

    <div v-if="loading" class="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
      <p class="text-gray-600 dark:text-gray-400">Chart wird geladen...</p>
    </div>

    <div v-else-if="chartCanvas" class="w-full">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <div v-else class="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
      <p class="text-gray-600 dark:text-gray-400">Keine Positionen vorhanden</p>
    </div>

    <!-- Legend -->
    <div v-if="positions.length > 0" class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="(position, i) in positions"
        :key="position.id"
        class="p-3 border-l-4 rounded"
        :style="{ borderColor: colors[i % colors.length] }"
      >
        <p class="font-medium text-sm">{{ position.asset.symbol }}</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">{{ position.asset.name }}</p>
        <p class="text-sm font-bold mt-1">{{ (position.value / totalValue * 100).toFixed(1) }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import type { Position } from '../types'

interface Props {
  positions: Position[]
  totalValue: number
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const chart = ref<Chart | null>(null)
const loading = ref(false)

const colors = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'
]

const positions = computed(() => {
  return props.positions.map((pos, i) => ({
    ...pos,
    value: pos.quantity * pos.asset.currentPrice,
    color: colors[i % colors.length]
  }))
})

const renderChart = () => {
  if (!chartCanvas.value || positions.value.length === 0) return

  const isDark = document.documentElement.classList.contains('dark')

  if (chart.value) {
    chart.value.destroy()
  }

  chart.value = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: positions.value.map(p => p.asset.symbol),
      datasets: [{
        data: positions.value.map(p => p.value),
        backgroundColor: positions.value.map(p => p.color),
        borderColor: isDark ? '#1F2937' : '#FFFFFF',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#D1D5DB' : '#4B5563',
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          titleColor: isDark ? '#FFFFFF' : '#000000',
          bodyColor: isDark ? '#FFFFFF' : '#000000',
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a: number, b: any) => a + b, 0) as number
              const percentage = ((context.parsed as number) / total * 100).toFixed(1)
              return `${percentage}%`
            }
          }
        }
      }
    }
  })
}

onMounted(() => {
  if (positions.value.length > 0) {
    renderChart()
  }
})
</script>
