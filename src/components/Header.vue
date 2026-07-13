<template>
  <header class="glass-header">
    <div class="container mx-auto px-4 py-2">
      <div class="flex justify-between items-center flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold text-primary whitespace-nowrap">Trading Decision Lab</h1>
          <nav class="hidden md:flex gap-3 ml-2 border-l border-gray-300/60 dark:border-white/10 pl-4">
            <RouterLink to="/" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Dashboard
            </RouterLink>
            <RouterLink to="/daytrading" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Daytrading
            </RouterLink>
            <RouterLink to="/modi" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Modi
            </RouterLink>
            <RouterLink to="/analyse" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Analyse
            </RouterLink>
            <RouterLink to="/portfolio" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Portfolio
            </RouterLink>
            <RouterLink to="/journal" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Journal
            </RouterLink>
            <RouterLink to="/replay" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Replay
            </RouterLink>
            <RouterLink to="/kalender" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Kalender
            </RouterLink>
            <RouterLink to="/protokoll" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Protokoll
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <!-- Risk-Off Badge -->
          <span v-if="store.settings.riskOffMode"
            class="px-2.5 py-1 rounded-lg bg-red-500/90 text-white text-xs font-bold warn-blink">
            RISK-OFF
          </span>

          <!-- Warnings Badge -->
          <div v-if="store.activeWarnings.length > 0" class="relative">
            <RouterLink to="/protokoll" class="relative p-2 text-orange-600 hover:bg-white/30 dark:hover:bg-white/10 rounded-xl inline-flex">
              <AlertTriangle :size="20" :class="hasCritical ? 'warn-blink text-red-600' : ''" />
              <span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ store.activeWarnings.length }}
              </span>
            </RouterLink>
          </div>

          <!-- Currency Selector -->
          <div class="flex items-center gap-1.5 border-l border-white/50 dark:border-white/10 pl-4">
            <button
              v-for="currency in ['EUR', 'USD']"
              :key="currency"
              @click="store.setCurrency(currency as any)"
              :class="['glass-chip', store.activeCurrency === currency ? 'glass-chip-active' : 'glass-chip-inactive']"
            >
              {{ currency }}
            </button>
          </div>

          <!-- Language Selector -->
          <div class="flex items-center gap-1.5 border-l border-white/50 dark:border-white/10 pl-4">
            <button
              v-for="lang in ['DE', 'EN']"
              :key="lang"
              @click="store.setLanguage((lang.toLowerCase() as any))"
              :class="['glass-chip', store.activeLanguage === lang.toLowerCase() ? 'glass-chip-active' : 'glass-chip-inactive']"
            >
              {{ lang }}
            </button>
          </div>

          <!-- Settings Link -->
          <RouterLink to="/settings" class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary">
            <Settings :size="20" />
          </RouterLink>
        </div>
      </div>

      <!-- Kompakte Info-Zeile -->
      <div class="mt-1.5 pt-1.5 border-t border-gray-200/70 dark:border-white/10 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span class="text-gray-600 dark:text-gray-400">Portfolio:
          <b class="text-gray-900 dark:text-white text-sm">{{ formatCurrency(store.totalPortfolioValue) }}</b>
        </span>
        <span class="text-gray-600 dark:text-gray-400">G/V:
          <b :class="['text-sm', store.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600']">{{ formatCurrency(store.totalGainLoss) }}</b>
        </span>
        <span class="text-gray-600 dark:text-gray-400">Warnungen:
          <b class="text-orange-600 text-sm">{{ store.activeWarnings.length }}</b>
        </span>
        <span class="text-gray-600 dark:text-gray-400">Positionen:
          <b class="text-gray-900 dark:text-white text-sm">{{ totalPositions }}</b>
        </span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertTriangle, Settings } from 'lucide-vue-next'
import { useAppStore } from '../stores'

const store = useAppStore()

const totalPositions = computed(() => {
  return store.portfolios.reduce((sum, p) => sum + p.positions.length, 0)
})

const hasCritical = computed(() => {
  return store.activeWarnings.some(w => w.level === 'red' || w.level === 'black')
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: store.activeCurrency,
  }).format(value)
}
</script>
