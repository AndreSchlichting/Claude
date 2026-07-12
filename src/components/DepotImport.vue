<template>
  <div class="card">
    <h2 class="text-lg font-bold mb-2">Depotübertrag / Position übernehmen</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Bestehende Positionen aus anderen Depots (z.B. Trade Republic) übernehmen.
      Anschaffungswerte und Gebühren bleiben für die Steuerlogik erhalten.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1">Asset *</label>
        <select v-model="form.assetId" class="input-field w-full">
          <option value="">-- Asset auswählen --</option>
          <option v-for="asset in store.assets" :key="asset.id" :value="asset.id">
            {{ asset.symbol }} - {{ asset.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">ISIN (optional)</label>
        <input v-model="form.isin" placeholder="z.B. US0378331005" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Kaufdatum *</label>
        <input v-model="form.buyDate" type="date" :max="today" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Anschaffungskurs *</label>
        <input v-model.number="form.buyPrice" type="number" step="0.01" min="0" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Stückzahl *</label>
        <input v-model.number="form.quantity" type="number" step="0.000001" min="0" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Gebühren beim Kauf</label>
        <input v-model.number="form.fees" type="number" step="0.01" min="0" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Währung</label>
        <select v-model="form.currency" class="input-field w-full">
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Wechselkurs bei Kauf (falls USD)</label>
        <input v-model.number="form.exchangeRate" type="number" step="0.0001" class="input-field w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Depotquelle</label>
        <select v-model="form.depotSource" class="input-field w-full">
          <option value="Trade Republic">Trade Republic</option>
          <option value="Interactive Brokers">Interactive Brokers</option>
          <option value="Kraken">Kraken</option>
          <option value="Binance">Binance</option>
          <option value="Sonstige">Sonstige</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Ziel-Portfolio</label>
        <select v-model="form.portfolioType" class="input-field w-full">
          <option value="real">Echtes Portfolio</option>
          <option value="test">Testportfolio</option>
        </select>
      </div>
    </div>

    <!-- Plausibilitätsprüfung (§121.4) -->
    <div v-if="plausibilityIssues.length > 0" class="mt-4 p-3 bg-orange-50 dark:bg-orange-900 rounded">
      <p class="text-sm font-bold text-orange-900 dark:text-orange-200 mb-1">Plausibilitätsprüfung:</p>
      <ul class="text-xs text-orange-800 dark:text-orange-300 space-y-0.5">
        <li v-for="(issue, i) in plausibilityIssues" :key="i">⚠ {{ issue }}</li>
      </ul>
      <p class="text-xs text-orange-800 dark:text-orange-300 mt-2">
        Übernahme ist trotzdem möglich - die Position wird als "unplausibel markiert" gekennzeichnet.
      </p>
    </div>

    <div class="mt-4 flex gap-3">
      <button @click="importPosition" :disabled="!isValid" class="btn btn-primary flex-1 disabled:opacity-50">
        Position übernehmen
      </button>
      <button @click="resetForm" class="btn btn-secondary">Zurücksetzen</button>
    </div>

    <p v-if="successMessage" class="mt-3 text-sm text-green-700 dark:text-green-300 font-medium">
      ✓ {{ successMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import type { Position, PortfolioType } from '../types'

const store = useAppStore()
const successMessage = ref('')
const today = new Date().toISOString().split('T')[0]

const form = ref({
  assetId: '',
  isin: '',
  buyDate: today,
  buyPrice: 0,
  quantity: 0,
  fees: 1,
  currency: 'EUR' as 'EUR' | 'USD',
  exchangeRate: 1,
  depotSource: 'Trade Republic',
  portfolioType: 'real' as PortfolioType
})

const selectedAsset = computed(() => store.assets.find(a => a.id === form.value.assetId))

const isValid = computed(() => {
  return form.value.assetId && form.value.buyPrice > 0 && form.value.quantity > 0 && form.value.buyDate
})

/**
 * Plausibilitätsprüfung nach §121.4:
 * ISIN passt zu Asset? Kurs im historischen Bereich? Gebühren plausibel? Datum handelslogisch?
 */
const plausibilityIssues = computed(() => {
  const issues: string[] = []
  const asset = selectedAsset.value
  if (!asset) return issues

  // ISIN-Prüfung
  if (form.value.isin && asset.isin && form.value.isin.trim().toUpperCase() !== asset.isin) {
    issues.push(`ISIN passt nicht zum Asset (erwartet: ${asset.isin})`)
  }
  if (form.value.isin && !/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(form.value.isin.trim().toUpperCase())) {
    issues.push('ISIN-Format ungültig (12 Zeichen, z.B. US0378331005)')
  }

  // Kaufkurs im plausiblen Bereich? (±80% vom aktuellen Kurs als grobe Historik-Annahme)
  if (form.value.buyPrice > 0 && asset.currentPrice > 0) {
    const ratio = form.value.buyPrice / asset.currentPrice
    if (ratio > 5 || ratio < 0.2) {
      issues.push(`Kaufkurs ${form.value.buyPrice} weicht stark vom aktuellen Kurs (${asset.currentPrice.toFixed(2)}) ab - Split oder Tippfehler?`)
    }
  }

  // Gebühren plausibel? (>5% vom Kaufwert ist verdächtig)
  const buyValue = form.value.buyPrice * form.value.quantity
  if (buyValue > 0 && form.value.fees > buyValue * 0.05) {
    issues.push(`Gebühren (${form.value.fees}) über 5% des Kaufwerts - bitte prüfen`)
  }

  // Kaufdatum handelslogisch? (Wochenende bei Aktien)
  if (form.value.buyDate && asset.assetClass !== 'crypto') {
    const day = new Date(form.value.buyDate).getDay()
    if (day === 0 || day === 6) {
      issues.push('Kaufdatum liegt am Wochenende - bei Aktien kein Börsenhandel')
    }
  }

  // Währung passt zum Handelsplatz?
  if (form.value.currency !== asset.currency) {
    issues.push(`Währung ${form.value.currency} weicht von Handelswährung des Assets (${asset.currency}) ab - Wechselkurs angeben`)
  }

  return issues
})

const importPosition = () => {
  const asset = selectedAsset.value
  if (!asset || !isValid.value) return

  const portfolio = store.portfolios.find(p => p.type === form.value.portfolioType)
  if (!portfolio) return

  const position: Position = {
    id: `pos_import_${Date.now()}`,
    asset,
    quantity: form.value.quantity,
    buyPrice: form.value.buyPrice,
    buyDate: new Date(form.value.buyDate),
    buyFees: form.value.fees,
    currency: form.value.currency,
    portfolioType: form.value.portfolioType,
    entryThesis: `Depotübertrag von ${form.value.depotSource}`,
    stopLoss: form.value.buyPrice * 0.9,
    profitTarget: form.value.buyPrice * 1.2,
    exchangeRateAtBuy: form.value.exchangeRate,
    depotSource: form.value.depotSource,
    transferDate: new Date(),
    plausibilityIssues: plausibilityIssues.value.length > 0 ? [...plausibilityIssues.value] : undefined
  }

  store.addPosition(portfolio.id, position)
  store.logEvent(
    form.value.portfolioType === 'test' ? 'testposition_angelegt' : 'trade_ausgefuehrt',
    `Depotübertrag: ${form.value.quantity}x ${asset.symbol} zu ${form.value.buyPrice} übernommen`,
    { assetId: asset.id, assetSymbol: asset.symbol, detail: `Quelle: ${form.value.depotSource}${plausibilityIssues.value.length ? ' (mit Plausibilitätswarnungen)' : ''}` }
  )

  successMessage.value = `${form.value.quantity}x ${asset.symbol} ins ${portfolio.name} übernommen`
  setTimeout(() => { successMessage.value = '' }, 4000)
  resetForm()
}

const resetForm = () => {
  form.value = {
    assetId: '', isin: '', buyDate: today, buyPrice: 0, quantity: 0,
    fees: 1, currency: 'EUR', exchangeRate: 1,
    depotSource: 'Trade Republic', portfolioType: 'real'
  }
}
</script>
