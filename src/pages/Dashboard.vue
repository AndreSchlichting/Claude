<template>
  <div class="space-y-8">
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Portfolio Wert"
        :value="formatCurrency(store.totalPortfolioValue)"
        :trend="totalGainLossPercent"
        :isPositive="store.totalGainLoss >= 0"
      />
      <StatCard
        title="Realisierte G/V"
        :value="formatCurrency(totalRealized)"
        :isPositive="totalRealized >= 0"
      />
      <StatCard
        title="Unrealisierte G/V"
        :value="formatCurrency(totalUnrealized)"
        :isPositive="totalUnrealized >= 0"
      />
      <StatCard
        title="Aktive Positionen"
        :value="String(totalPositions)"
      />
    </div>

    <!-- Marktampel / Regime-Filter -->
    <MarketLight />

    <!-- TradingView-Webhooks (Ausbaustufe 0.7) -->
    <WebhookSignals />

    <!-- Anstehende wichtige Termine -->
    <div v-if="store.upcomingEvents.length > 0" class="card border-l-4 border-blue-400">
      <div class="flex justify-between items-center mb-2">
        <p class="font-bold text-sm">📅 Termine in den nächsten 7 Tagen</p>
        <RouterLink to="/kalender" class="text-xs text-primary hover:underline">Kalender öffnen →</RouterLink>
      </div>
      <ul class="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <li v-for="e in store.upcomingEvents.slice(0, 4)" :key="e.id">
          <b>{{ e.date }}</b>: {{ e.title }}
          <span v-if="e.importance === 'hoch'" class="text-red-600 font-medium">• wichtig</span>
        </li>
      </ul>
    </div>

    <!-- Watchlist -->
    <div v-if="watchlistAssets.length > 0" class="card">
      <h2 class="text-lg font-bold mb-4">⭐ Watchlist</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="asset in watchlistAssets"
          :key="asset.id"
          class="p-3 rounded-xl bg-white/40 dark:bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/60 dark:hover:bg-white/10"
          @click="navigateToAsset(asset.id)"
        >
          <div>
            <p class="font-bold text-sm">{{ asset.symbol }}</p>
            <p class="text-xs text-gray-500">{{ asset.name }}</p>
          </div>
          <p class="font-bold">{{ store.formatInActive(asset.currentPrice, asset.currency) }}</p>
        </div>
      </div>
    </div>

    <!-- Active Warnings -->
    <div v-if="store.activeWarnings.length > 0" class="card border-l-4 border-orange-500">
      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <AlertTriangle class="text-orange-600" :size="20" />
        Aktive Warnungen ({{ store.activeWarnings.length }})
      </h2>
      <div class="space-y-2">
        <div
          v-for="warning in store.activeWarnings.slice(0, 5)"
          :key="warning.id"
          :class="[
            'p-3 rounded flex justify-between items-center',
            warning.level === 'red' ? 'bg-red-50 dark:bg-red-900' :
            warning.level === 'orange' ? 'bg-orange-50 dark:bg-orange-900' :
            'bg-yellow-50 dark:bg-yellow-900'
          ]"
        >
          <div>
            <p class="font-medium">{{ warning.message }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatTime(warning.timestamp) }}</p>
          </div>
          <button
            @click="store.resolveWarning(warning.id)"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Assets & Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Asset Charts -->
      <div class="lg:col-span-2">
        <PortfolioChart
          v-if="store.portfolios.length > 0"
          :positions="allPositions"
          :totalValue="store.totalPortfolioValue"
        />
      </div>

      <!-- Asset List -->
      <div class="lg:col-span-3 card">
        <h2 class="text-lg font-bold mb-4">Assets im Portfolio</h2>
        <div v-if="store.assets.length > 0" class="space-y-3">
          <div
            v-for="asset in store.assets"
            :key="asset.id"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            @click="navigateToAsset(asset.id)"
          >
            <div class="flex justify-between items-start">
              <div class="flex items-start gap-2">
                <button
                  @click.stop="store.toggleWatchlist(asset.id)"
                  class="text-lg leading-none mt-0.5"
                  :title="store.watchlist.includes(asset.id) ? 'Von Watchlist entfernen' : 'Zur Watchlist'"
                >
                  {{ store.watchlist.includes(asset.id) ? '⭐' : '☆' }}
                </button>
                <div>
                  <h3 class="font-bold text-lg">{{ asset.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ asset.symbol }} • {{ asset.assetClass }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold">{{ store.formatInActive(asset.currentPrice, asset.currency) }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ asset.currency !== store.activeCurrency ? `Original: ${asset.currency}` : `in ${asset.currency}` }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-600 dark:text-gray-400">
          <p>Keine Assets hinzugefügt. Starten Sie mit einer Asset-Verwaltung.</p>
        </div>
      </div>

      <!-- Quick Info -->
      <div class="card">
        <h2 class="text-lg font-bold mb-4">Trading-Status</h2>
        <div class="space-y-3">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Modus</p>
            <p class="font-bold capitalize">{{ store.settings.tradingMode }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Risiko pro Trade</p>
            <p class="font-bold">{{ store.settings.riskPerTrade }}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">TagesLimit</p>
            <p class="font-bold">{{ formatCurrency(store.settings.dailyLossLimit) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Brutal-Modus</p>
            <p :class="store.settings.brutalSuccessModeEnabled ? 'font-bold text-green-600' : 'font-bold text-gray-600'">
              {{ store.settings.brutalSuccessModeEnabled ? 'AKTIV' : 'Aus' }}
            </p>
          </div>
          <RouterLink to="/settings" class="btn btn-primary w-full mt-4">
            Einstellungen
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Recent Analyses -->
    <div class="card" v-if="store.analyses.length > 0">
      <h2 class="text-lg font-bold mb-4">Letzte Analysen</h2>
      <div class="space-y-2">
        <div
          v-for="analysis in store.analyses.slice(0, 3)"
          :key="analysis.id"
          class="p-3 border border-gray-200 dark:border-gray-700 rounded flex justify-between items-center"
        >
          <div>
            <p class="font-medium">{{ analysis.thesisTitle }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatTime(analysis.timestamp) }}</p>
          </div>
          <span :class="[
            'px-2 py-1 rounded text-sm font-medium',
            analysis.warningLevel === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900' :
            analysis.warningLevel === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900' :
            analysis.warningLevel === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900' :
            'bg-gray-100 text-gray-800'
          ]">
            {{ analysis.warningLevel }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import StatCard from '../components/StatCard.vue'
import PortfolioChart from '../components/PortfolioChart.vue'
import MarketLight from '../components/MarketLight.vue'

const store = useAppStore()
const router = useRouter()
const loading = ref(true)

const allPositions = computed(() => {
  return store.portfolios.flatMap(p => p.positions)
})

const watchlistAssets = computed(() => {
  return store.assets.filter(a => store.watchlist.includes(a.id))
})

const totalPositions = computed(() => {
  return store.portfolios.reduce((sum, p) => sum + p.positions.length, 0)
})

const totalRealized = computed(() => {
  return store.portfolios.reduce((sum, p) => sum + p.realizedGainLoss, 0)
})

const totalUnrealized = computed(() => {
  return store.portfolios.reduce((sum, p) => sum + p.unrealizedGainLoss, 0)
})

const totalGainLossPercent = computed(() => {
  if (store.totalPortfolioCost === 0) return 0
  return ((store.totalGainLoss / store.totalPortfolioCost) * 100).toFixed(2)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: store.activeCurrency,
  }).format(value)
}

const formatPrice = (value: number) => {
  const symbol = store.activeCurrency === 'EUR' ? '€' : '$'
  return `${symbol} ${value.toFixed(2)}`
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const navigateToAsset = (assetId: string) => {
  router.push({ name: 'AssetDetail', params: { id: assetId } })
}

onMounted(async () => {
  try {
    // Lade Assets beim Start
    const assets = await apiService.getAssets()
    assets.forEach(asset => store.addAsset(asset))

    // Lade historische Daten für Charts
    for (const asset of assets.slice(0, 3)) {
      const history = await apiService.getPriceHistory(asset.id, '1d', 50)
      if (history.length > 0) {
        asset.priceHistory = history
        store.updateAsset(asset.id, { priceHistory: history })
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden der Assets:', error)
  } finally {
    loading.value = false
  }
})
</script>
