<template>
  <div class="card">
    <h2 class="text-lg font-bold mb-2">🔍 Asset-Suche</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
      Aktien, ETFs und Kryptowährungen finden und zur App hinzufügen - danach überall verfügbar
      (Beobachtungsliste, Analyse, Daytrading, Portfolio).
    </p>

    <div class="flex gap-2">
      <input
        v-model="query"
        @keyup.enter="search"
        placeholder="z.B. SOL, Nvidia, NVDA, iShares, Alibaba..."
        class="input-field flex-1"
      />
      <button @click="search" :disabled="searching || !query.trim()" class="btn btn-primary disabled:opacity-50">
        {{ searching ? 'Suche...' : 'Suchen' }}
      </button>
    </div>

    <p v-if="hint" class="text-xs text-orange-700 dark:text-orange-300 mt-2">💡 {{ hint }}</p>

    <div v-if="results.length > 0" class="mt-4 space-y-2">
      <div v-for="r in results" :key="r.symbol + r.type"
        class="p-3 rounded-xl bg-white/40 dark:bg-white/5 flex justify-between items-center flex-wrap gap-2">
        <div>
          <p class="font-bold text-sm">
            {{ r.symbol }}
            <span :class="['ml-2 text-xs px-1.5 py-0.5 rounded font-medium',
              r.type === 'crypto' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' :
              r.type === 'etf' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200']">
              {{ r.type === 'crypto' ? 'Krypto' : r.type === 'etf' ? 'ETF' : 'Aktie' }}
            </span>
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            {{ r.name }}<span v-if="r.region"> • {{ r.region }}</span> • {{ r.currency }}
          </p>
        </div>
        <div class="flex gap-2">
          <button v-if="!isAdded(r)" @click="addAsset(r)" class="btn btn-primary text-sm">
            ＋ Hinzufügen
          </button>
          <button v-if="!isAdded(r)" @click="addAsset(r, true)" class="btn btn-secondary text-sm">
            ⭐ + Watchlist
          </button>
          <span v-else class="text-sm text-green-700 dark:text-green-400 font-medium py-1.5">✓ vorhanden</span>
        </div>
      </div>
    </div>

    <p v-else-if="searched && !searching" class="mt-3 text-sm text-gray-500">
      Keine Treffer für "{{ lastQuery }}".
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import type { SymbolSearchResult } from '../services/api'
import { searchCatalog } from '../services/assetCatalog'
import type { Asset } from '../types'

const store = useAppStore()

const query = ref('')
const lastQuery = ref('')
const results = ref<SymbolSearchResult[]>([])
const hint = ref('')
const searching = ref(false)
const searched = ref(false)

const search = async () => {
  if (!query.value.trim()) return
  searching.value = true
  searched.value = false
  lastQuery.value = query.value

  // 1. Sofort: Katalog-Vorschlaege (fuzzy, auch bei Tippfehlern, ohne API)
  const catalogHits: SymbolSearchResult[] = searchCatalog(query.value).map(e => ({
    symbol: e.symbol, name: e.name,
    type: e.type === 'index' ? 'etf' : e.type,
    region: e.exchange, currency: e.currency, binanceSymbol: e.binanceSymbol
  }))
  results.value = catalogHits
  hint.value = catalogHits.length ? '' : 'Keine Katalog-Treffer - versuche die Online-Suche...'

  // 2. Zusaetzlich: Online-Suche (Binance + Alpha Vantage), Duplikate raus
  try {
    const res = await apiService.searchSymbols(query.value)
    const merged = [...catalogHits]
    res.results.forEach(r => {
      if (!merged.some(m => m.symbol === r.symbol && m.type === r.type)) merged.push(r)
    })
    results.value = merged
    if (res.hint && merged.length === 0) hint.value = res.hint
    searched.value = true
  } finally {
    searching.value = false
    searched.value = true
  }
}

// Vorschlaege live beim Tippen (nur Katalog, kein Traffic)
import { watch as _watch } from 'vue'
_watch(query, (q) => {
  if (!q.trim()) { results.value = []; return }
  if (!searching.value) {
    results.value = searchCatalog(q).map(e => ({
      symbol: e.symbol, name: e.name,
      type: e.type === 'index' ? 'etf' : e.type,
      region: e.exchange, currency: e.currency, binanceSymbol: e.binanceSymbol
    }))
  }
})

const assetIdFor = (r: SymbolSearchResult) =>
  `${r.type}-${r.symbol.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

const isAdded = (r: SymbolSearchResult) =>
  store.assets.some(a => a.id === assetIdFor(r))

const addAsset = async (r: SymbolSearchResult, toWatchlist = false) => {
  const asset: Asset = {
    id: assetIdFor(r),
    name: r.name,
    symbol: r.symbol,
    assetClass: r.type === 'crypto' ? 'crypto' : r.type,
    currentPrice: 0,
    currency: r.currency,
    exchange: r.type === 'crypto' ? 'Binance' : r.region,
    binanceSymbol: r.binanceSymbol,
    lastUpdated: new Date(),
    priceHistory: []
  }

  store.addAsset(asset)
  if (toWatchlist) store.toggleWatchlist(asset.id)
  store.logEvent('testposition_angelegt', `Asset hinzugefügt: ${asset.symbol} (${asset.name})`,
    { assetId: asset.id, assetSymbol: asset.symbol, detail: toWatchlist ? 'auf Watchlist' : undefined })

  // Kurs direkt laden
  const price = await apiService.getCurrentPrice(asset.id)
  if (price > 0) store.updateAsset(asset.id, { currentPrice: price, lastUpdated: new Date() })
}
</script>
