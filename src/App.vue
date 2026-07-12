<template>
  <div class="min-h-screen glass-bg text-gray-900 dark:text-gray-100">
    <Header />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>

    <!-- Akutes Warn-Popup (§125.3): kritische Warnung mit Puls-Animation -->
    <Transition name="fade">
      <div
        v-if="criticalWarning"
        class="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 warn-pulse
          bg-red-50/90 dark:bg-red-950/80 backdrop-blur-2xl
          border border-red-300/60 dark:border-red-700/60 shadow-2xl"
      >
        <div class="flex items-start gap-3">
          <span class="text-2xl warn-blink">🚨</span>
          <div class="min-w-0">
            <p class="font-bold text-red-900 dark:text-red-200 text-sm">
              {{ criticalWarning.level === 'black' ? 'NOTFALL' : 'ALARM' }}: {{ criticalWarning.type }}
            </p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ criticalWarning.message }}</p>
            <button
              @click="store.resolveWarning(criticalWarning.id)"
              class="mt-2 text-xs font-medium text-red-700 dark:text-red-300 underline"
            >
              Bestätigen &amp; ausblenden
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Header from './components/Header.vue'
import { RouterView } from 'vue-router'
import { useAppStore } from './stores'
import { apiService } from './services/api'

const store = useAppStore()

const criticalWarning = computed(() => {
  return store.activeWarnings.find(w => w.level === 'red' || w.level === 'black') || null
})

onMounted(async () => {
  // Echten EUR/USD-Kurs laden (EZB), damit die Währungsumschaltung korrekt rechnet
  const rate = await apiService.getExchangeRate('EUR', 'USD')
  store.setUsdPerEur(rate)
})
</script>

<style>
:root {
  color-scheme: light dark;
}

body {
  margin: 0;
  padding: 0;
}

html.dark {
  color-scheme: dark;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
