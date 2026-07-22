<template>
  <div v-if="serverReachable" class="card">
    <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
      <h2 class="text-lg font-bold">📰 Wirtschafts-News</h2>
      <button @click="load" class="btn btn-secondary text-sm" :disabled="loading">
        {{ loading ? 'Lade...' : '🔄' }}
      </button>
    </div>

    <!-- BaFin-Treffer: hart warnen -->
    <div v-if="bafinMatches.length > 0" class="mb-3 p-3 rounded-xl bg-red-50/80 dark:bg-red-950/50 border border-red-300">
      <p class="text-sm font-bold text-red-900 dark:text-red-200">⚫ BaFin-Warnung passt zu deinen Assets!</p>
      <p v-for="(m, i) in bafinMatches" :key="i" class="text-xs text-red-800 dark:text-red-300 mt-1">{{ m }}</p>
    </div>

    <div v-if="news.length > 0" class="space-y-1.5">
      <a v-for="(item, i) in news.slice(0, 6)" :key="i" :href="item.link" target="_blank" rel="noopener"
        class="block p-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 text-sm">
        <span class="font-medium">{{ item.title }}</span>
        <span class="text-xs text-gray-500 ml-2">{{ item.source }}</span>
      </a>
    </div>
    <p v-else class="text-sm text-gray-500">{{ newsError || 'Keine News geladen' }}</p>
    <p class="text-xs text-gray-400 mt-2">Quelle: RSS via lokalen Server (npm run webhooks) • News sind Kontext, keine Signale</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores'

const store = useAppStore()

interface FeedItem { title: string; link: string; pubDate: string; source: string }

const news = ref<FeedItem[]>([])
const bafinItems = ref<FeedItem[]>([])
const newsError = ref('')
const serverReachable = ref(false)
const loading = ref(false)

const bafinMatches = computed(() => {
  const matches: string[] = []
  bafinItems.value.forEach(item => {
    store.assets.forEach(asset => {
      const title = item.title.toLowerCase()
      if (title.includes(asset.name.toLowerCase()) || title.includes(asset.symbol.toLowerCase())) {
        matches.push(`${asset.symbol}: "${item.title}"`)
      }
    })
  })
  return matches
})

const fetchJson = async (path: string) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const resp = await fetch(`http://localhost:3777${path}`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!resp.ok) return null
    return await resp.json()
  } catch {
    return null
  }
}

const load = async () => {
  loading.value = true
  try {
    const newsData = await fetchJson('/news')
    if (newsData) {
      serverReachable.value = true
      news.value = newsData.items || []
      newsError.value = newsData.error || ''
    } else {
      serverReachable.value = false
      return
    }

    const bafinData = await fetchJson('/bafin')
    if (bafinData?.items?.length) {
      bafinItems.value = bafinData.items
      // Treffer als schwarze Warnung + Protokoll (§119.3)
      bafinMatches.value.forEach(match => {
        const already = store.eventLog.some(e => e.type === 'scam_warnung' && e.message.includes(match.slice(0, 40)))
        if (!already) {
          store.logEvent('scam_warnung', `BaFin-Abgleich: ${match}`, { detail: 'Automatischer RSS-Abgleich' })
          store.addWarning({
            id: `warn_bafin_${Date.now()}`, timestamp: new Date(), assetId: '',
            level: 'black', type: 'BaFin-Warnung',
            message: `Behördenwarnung passt zu Asset: ${match}`, isResolved: false
          })
        }
      })
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
