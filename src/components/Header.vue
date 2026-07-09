<template>
  <header class="bg-white dark:bg-gray-800 shadow">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-primary">Trading Decision Lab</h1>
          <span class="text-sm text-gray-600 dark:text-gray-400">Brutal erfolgreich</span>
          <nav class="hidden md:flex gap-4 ml-8 border-l border-gray-300 dark:border-gray-600 pl-8">
            <RouterLink to="/" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Dashboard
            </RouterLink>
            <RouterLink to="/daytrading" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Daytrading
            </RouterLink>
            <RouterLink to="/portfolio" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
              Portfolio
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-6">
          <!-- Warnings Badge -->
          <div v-if="store.activeWarnings.length > 0" class="relative">
            <button class="relative p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg">
              <AlertTriangle :size="20" />
              <span class="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ store.activeWarnings.length }}
              </span>
            </button>
          </div>

          <!-- Currency Selector -->
          <div class="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-6">
            <button
              v-for="currency in ['EUR', 'USD']"
              :key="currency"
              @click="store.setCurrency(currency as any)"
              :class="[
                'px-3 py-1 rounded font-medium text-sm transition-colors',
                store.activeCurrency === currency
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 opacity-50 hover:opacity-75'
              ]"
            >
              {{ currency }}
            </button>
          </div>

          <!-- Language Selector -->
          <div class="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-6">
            <button
              v-for="lang in ['DE', 'EN']"
              :key="lang"
              @click="store.setLanguage((lang.toLowerCase() as any))"
              :class="[
                'px-3 py-1 rounded font-medium text-sm transition-colors',
                (store.activeLanguage === lang.toLowerCase())
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 opacity-50 hover:opacity-75'
              ]"
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
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-4 gap-4 text-sm">
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

const formatCurrency = (value: number) => {
  const symbol = store.activeCurrency === 'EUR' ? '€' : '$'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: store.activeCurrency,
  }).format(value)
}
</script>
