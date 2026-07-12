<template>
  <header class="glass-header">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center flex-wrap gap-3">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-primary">Trading Decision Lab</h1>
          <span class="hidden lg:inline text-sm text-gray-600 dark:text-gray-400">Brutal erfolgreich</span>
          <nav class="hidden md:flex gap-4 ml-4 border-l border-white/50 dark:border-white/10 pl-6">
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

      <!-- Info Bar -->
      <div class="mt-4 pt-4 border-t border-white/40 dark:border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-gray-600 dark:text-gray-400">Portfolio Wert</span>
          <p class="font-bold text-lg">{{ formatCurrency(store.totalPortfolioValue) }}</p>
        </div>
        <div>
          <span class="text-gray-600 dark:text-gray-400">Gewinn/Verlust</span>
          <p :class="['font-bold text-lg', store.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600']">
            {{ formatCurrency(store.totalGainLoss) }}
          </p>
        </div>
        <div>
          <span class="text-gray-600 dark:text-gray-400">Aktive Warnungen</span>
          <p class="font-bold text-lg text-orange-600">{{ store.activeWarnings.length }}</p>
        </div>
        <div>
          <span class="text-gray-600 dark:text-gray-400">Aktive Positionen</span>
          <p class="font-bold text-lg">{{ totalPositions }}</p>
        </div>
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
