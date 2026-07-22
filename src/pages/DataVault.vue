<template>
  <div class="space-y-3">
    <div class="card">
      <h1 class="text-xl font-bold mb-1">Daten-Speicher</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Lokales Archiv je Asset (eindeutige ID über ISIN/WKN/Symbol) - Analysen, Berichte, Ereignisse
        und Kurs-Snapshots werden gespeichert, um Traffic zu reduzieren
      </p>
    </div>

    <!-- Speicherbelegung -->
    <div class="card">
      <h2 class="text-lg font-bold mb-3">💾 Speicherbelegung</h2>
      <div class="flex items-center gap-4 mb-2">
        <div class="flex-1 h-4 rounded-full bg-white/40 dark:bg-white/10 overflow-hidden">
          <div class="h-full rounded-full transition-all"
            :class="usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-orange-500' : 'bg-primary'"
            :style="{ width: `${Math.min(100, usagePercent)}%` }"></div>
        </div>
        <p class="font-bold text-sm whitespace-nowrap">{{ formatBytes(totalBytes) }} / ~5 MB ({{ usagePercent.toFixed(1) }}%)</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-3">
        <div v-for="s in storageBreakdown" :key="s.label" class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
          <p class="text-xs text-gray-500">{{ s.label }}</p>
          <p class="font-bold">{{ formatBytes(s.bytes) }}</p>
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-3">
        Grenze des Browser-Speichers: ca. 5 MB. Bei über 80% alte Kurs-Snapshots löschen oder per
        Einstellungen → Daten-Backup exportieren. 💡 Zukunftsidee NAS-DatenCollector: Der Export/Import
        (JSON) und der lokale Server sind dafür bereits die Vorstufe - die Datenstruktur bleibt gleich.
      </p>
      <button @click="refreshStorage" class="btn btn-secondary text-sm mt-2">🔄 Neu berechnen</button>
    </div>

    <!-- Dokument hinzufügen -->
    <div class="card">
      <h2 class="text-lg font-bold mb-3">Information ablegen</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium mb-1">Asset *</label>
          <select v-model="form.assetId" class="input-field w-full text-sm">
            <option value="">-- wählen --</option>
            <option v-for="a in store.assets" :key="a.id" :value="a.id">{{ a.symbol }} - {{ a.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Art</label>
          <select v-model="form.kind" class="input-field w-full text-sm">
            <option value="analyse">📊 Analyse</option>
            <option value="bericht">📄 Externer Bericht</option>
            <option value="ereignis">⚡ Ereignis</option>
            <option value="notiz">📝 Notiz</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-medium mb-1">Titel *</label>
          <input v-model="form.title" placeholder="z.B. HKCM Deep Dive Q1, Earnings-Ergebnis" class="input-field w-full text-sm" />
        </div>
        <div class="md:col-span-3">
          <label class="block text-xs font-medium mb-1">Inhalt / Link *</label>
          <textarea v-model="form.content" rows="2" placeholder="Text, Kernaussagen oder Link zum Dokument" class="input-field w-full text-sm"></textarea>
        </div>
        <div class="flex flex-col justify-end gap-1">
          <input v-model="form.source" placeholder="Quelle (optional)" class="input-field text-sm" />
          <button @click="saveDoc" :disabled="!form.assetId || !form.title.trim() || !form.content.trim()"
            class="btn btn-primary text-sm disabled:opacity-50">💾 Ablegen</button>
        </div>
      </div>
    </div>

    <!-- Archiv je Asset -->
    <div v-if="records.length > 0" class="space-y-3">
      <div v-for="rec in records" :key="rec.canonicalId" class="card">
        <div class="flex justify-between items-center flex-wrap gap-2 cursor-pointer" @click="toggleOpen(rec.canonicalId)">
          <div>
            <h3 class="font-bold">{{ rec.symbol }} <span class="text-gray-500 font-normal text-sm">{{ rec.name }}</span></h3>
            <p class="text-xs text-gray-500">
              ID: {{ rec.canonicalId }} • Kennungen: {{ rec.aliases.join(', ') }} • {{ rec.docs.length }} Einträge
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span v-for="(count, kind) in docCounts(rec)" :key="kind"
              class="text-xs px-2 py-0.5 rounded-lg bg-white/60 dark:bg-white/10">
              {{ kindIcon(String(kind)) }} {{ count }}
            </span>
            <span class="text-gray-400">{{ openRecords.includes(rec.canonicalId) ? '▲' : '▼' }}</span>
          </div>
        </div>

        <div v-if="openRecords.includes(rec.canonicalId)" class="mt-3 pt-3 border-t border-white/40 dark:border-white/10 space-y-1.5">
          <div v-for="doc in rec.docs" :key="doc.id"
            class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 flex justify-between items-start gap-2 text-sm">
            <div class="min-w-0">
              <p class="font-medium">{{ kindIcon(doc.kind) }} {{ doc.title }}
                <span class="text-xs text-gray-500">• {{ doc.date }}<span v-if="doc.source"> • {{ doc.source }}</span></span>
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 break-all">{{ formatContent(doc) }}</p>
            </div>
            <button @click="store.removeVaultDoc(rec.canonicalId, doc.id)" class="text-gray-400 hover:text-red-500 shrink-0">✕</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="card text-center py-6 text-gray-500 text-sm">
      Noch keine Daten archiviert. Kurs-Snapshots deiner ⭐-Watchlist-Assets werden beim Scanner-Lauf
      automatisch täglich abgelegt - Analysen und Berichte legst du oben manuell ab.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores'
import type { VaultRecord, VaultDocument, VaultDocKind } from '../types'

const store = useAppStore()
const openRecords = ref<string[]>([])

const form = ref({
  assetId: '',
  kind: 'analyse' as VaultDocKind,
  title: '',
  content: '',
  source: ''
})

const records = computed<VaultRecord[]>(() =>
  Object.values(store.assetVault).sort((a, b) => b.docs.length - a.docs.length))

const toggleOpen = (id: string) => {
  openRecords.value = openRecords.value.includes(id)
    ? openRecords.value.filter(x => x !== id)
    : [...openRecords.value, id]
}

const docCounts = (rec: VaultRecord) => {
  const counts: Record<string, number> = {}
  rec.docs.forEach(d => { counts[d.kind] = (counts[d.kind] || 0) + 1 })
  return counts
}

const kindIcon = (k: string) => ({
  analyse: '📊', bericht: '📄', ereignis: '⚡', notiz: '📝', kursdaten: '📈'
}[k] || '📌')

const formatContent = (doc: VaultDocument) => {
  if (doc.kind === 'kursdaten') {
    try {
      const d = JSON.parse(doc.content)
      return `Kurs: ${d.price} ${d.currency} (EUR/USD ${Number(d.usdPerEur).toFixed(4)})`
    } catch { return doc.content.slice(0, 120) }
  }
  return doc.content.length > 160 ? doc.content.slice(0, 160) + '…' : doc.content
}

const saveDoc = () => {
  const asset = store.assets.find(a => a.id === form.value.assetId)
  if (!asset) return
  store.addVaultDoc(asset, {
    date: new Date().toISOString().split('T')[0],
    kind: form.value.kind,
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    source: form.value.source.trim() || undefined
  })
  store.logEvent('news_erkannt', `Daten-Speicher: "${form.value.title.trim()}" für ${asset.symbol} abgelegt`,
    { assetId: asset.id, assetSymbol: asset.symbol })
  form.value = { assetId: '', kind: 'analyse', title: '', content: '', source: '' }
}

// --- Speicherbelegung ---
const totalBytes = ref(0)
const storageBreakdown = ref<Array<{ label: string; bytes: number }>>([])

const refreshStorage = () => {
  let total = 0
  const parts: Array<{ label: string; bytes: number }> = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const value = localStorage.getItem(key) || ''
    const bytes = new Blob([key + value]).size
    total += bytes
  }
  totalBytes.value = total

  // Aufschlüsselung des App-Zustands
  try {
    const raw = localStorage.getItem('tdl_state_v1') || '{}'
    const data = JSON.parse(raw)
    const sizeOf = (v: unknown) => new Blob([JSON.stringify(v ?? null)]).size
    parts.push(
      { label: 'Daten-Speicher (Vault)', bytes: sizeOf(data.assetVault) },
      { label: 'Portfolios & Trades', bytes: sizeOf(data.portfolios) + sizeOf(data.transactions) },
      { label: 'Protokoll & Journal', bytes: sizeOf(data.eventLog) + sizeOf(data.journal) },
      { label: 'Fundamentaldaten', bytes: sizeOf(data.fundamentals) },
      { label: 'Assets & Watchlist', bytes: sizeOf(data.assets) + sizeOf(data.watchlist) },
      { label: 'Einstellungen & Rest', bytes: Math.max(0, new Blob([raw]).size - parts.reduce((s, p) => s + p.bytes, 0)) }
    )
  } catch { /* leer lassen */ }
  storageBreakdown.value = parts.filter(p => p.bytes > 0)
}

const usagePercent = computed(() => (totalBytes.value / (5 * 1024 * 1024)) * 100)

const formatBytes = (b: number) => {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${b} B`
}

onMounted(refreshStorage)
</script>
