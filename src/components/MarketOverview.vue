<template>
  <div class="card">
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-base font-bold">🌍 Märkte &amp; Devisen</h2>
      <button @click="load" class="text-xs text-primary hover:underline" :disabled="loading">
        {{ loading ? 'lädt...' : '🔄 aktualisieren' }}
      </button>
    </div>

    <!-- Leitindizes -->
    <div v-if="indices.length > 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1.5 mb-2">
      <div v-for="idx in indices" :key="idx.symbol" class="p-2 rounded-lg bg-white/40 dark:bg-white/5">
        <p class="text-[10px] text-gray-500 leading-tight">{{ idx.flag }} {{ idx.name }}</p>
        <p class="font-bold text-sm leading-tight">{{ idx.value ? idx.value.toLocaleString('de-DE', { maximumFractionDigits: 0 }) : 'n/a' }}</p>
        <p v-if="idx.changePercent !== null" :class="['text-xs font-bold leading-tight', idx.changePercent >= 0 ? 'text-green-500' : 'text-red-500']">
          {{ idx.changePercent >= 0 ? '▲' : '▼' }} {{ Math.abs(idx.changePercent).toFixed(2) }}%
        </p>
        <p v-else class="text-xs text-gray-400">–</p>
      </div>
    </div>
    <p v-else-if="!loading" class="text-xs text-gray-500 mb-2">
      Indizes brauchen den lokalen Server: <code class="bg-white/40 dark:bg-white/10 px-1 rounded">npm run webhooks</code> starten (Doppelklick Start-Server.bat).
    </p>

    <!-- Wechselkurse -->
    <div v-if="fxRates.length > 0" class="grid grid-cols-2 md:grid-cols-5 gap-1.5">
      <div v-for="fx in fxRates" :key="fx.pair" class="p-2 rounded-lg bg-white/40 dark:bg-white/5">
        <p class="text-[10px] text-gray-500 leading-tight">💱 {{ fx.label }}</p>
        <p class="font-bold text-sm leading-tight">{{ fx.rate.toLocaleString('de-DE', { maximumFractionDigits: fx.rate > 50 ? 2 : 4 }) }}</p>
        <p v-if="fx.changePercent !== null" :class="['text-xs font-bold leading-tight', fx.changePercent >= 0 ? 'text-green-500' : 'text-red-500']">
          {{ fx.changePercent >= 0 ? '▲' : '▼' }} {{ Math.abs(fx.changePercent).toFixed(2) }}%
        </p>
        <p v-else class="text-xs text-gray-400">EZB-frei</p>
      </div>
    </div>
    <p class="text-[10px] text-gray-400 mt-1.5">
      Indizes: Stooq (Vortagesvergleich) • Devisen: EZB-Referenzkurse, Rubel via er-api (kein EZB-Kurs seit 2022)
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiService } from '../services/api'
import type { FxRate } from '../services/api'

const indices = ref<Array<{ symbol: string; name: string; country: string; flag: string; value: number | null; changePercent: number | null }>>([])
const fxRates = ref<FxRate[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const [idx, fx] = await Promise.all([
      apiService.getMarketIndices(),
      apiService.getFxOverview()
    ])
    indices.value = idx.filter(i => i.value !== null)
    fxRates.value = fx
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
