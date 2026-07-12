<template>
  <div class="space-y-6">
    <!-- Portfolio Tabs -->
    <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="type in ['real', 'test', 'paper', 'shadow']"
        :key="type"
        @click="activePortfolioType = type as any"
        :class="[
          'px-4 py-2 font-medium border-b-2 transition-colors',
          activePortfolioType === type
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        ]"
      >
        {{ type === 'real' ? 'Echtgeld' : type === 'test' ? 'Test' : type === 'paper' ? 'Paper' : 'Shadow' }} Portfolio
      </button>
    </div>

    <!-- Portfolio Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Portfolio Wert"
        :value="formatCurrency(activePortfolio?.totalValue || 0)"
      />
      <StatCard
        title="Gewinn/Verlust"
        :value="formatCurrency(activePortfolio?.realizedGainLoss || 0)"
        :isPositive="(activePortfolio?.realizedGainLoss || 0) >= 0"
      />
      <StatCard
        title="Positionen"
        :value="String(activePortfolio?.positions.length || 0)"
      />
    </div>

    <!-- Positions Table -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Positionen</h2>
      <div v-if="activePortfolio && activePortfolio.positions.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left">Asset</th>
              <th class="px-4 py-3 text-right">Menge</th>
              <th class="px-4 py-3 text-right">Kaufpreis</th>
              <th class="px-4 py-3 text-right">Aktueller Preis</th>
              <th class="px-4 py-3 text-right">G/V</th>
              <th class="px-4 py-3 text-right">G/V %</th>
              <th class="px-4 py-3 text-left">Steuerstatus</th>
              <th class="px-4 py-3 text-center">Aktion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="position in activePortfolio.positions"
              :key="position.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="selectedPositionId = position.id"
              :class="selectedPositionId === position.id ? 'bg-blue-50 dark:bg-blue-900' : ''"
            >
              <td class="px-4 py-3">
                <div>
                  <p class="font-medium">{{ position.asset.name }}</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">{{ position.asset.symbol }}</p>
                </div>
              </td>
              <td class="px-4 py-3 text-right">{{ position.quantity }}</td>
              <td class="px-4 py-3 text-right">{{ formatPrice(position.buyPrice) }}</td>
              <td class="px-4 py-3 text-right">{{ formatPrice(position.asset.currentPrice) }}</td>
              <td :class="['px-4 py-3 text-right font-medium', getGLClass(position)]">
                {{ formatCurrency(calculateGL(position)) }}
              </td>
              <td :class="['px-4 py-3 text-right font-medium', getGLClass(position)]">
                {{ calculateGLPercent(position).toFixed(2) }}%
              </td>
              <td class="px-4 py-3 text-left">
                <span class="text-xs px-2 py-0.5 rounded-lg" :class="taxStatusClass(position)">
                  {{ taxStatus(position) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  @click="sellPosition(position.id)"
                  class="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm font-medium"
                >
                  Verkaufen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-center py-8 text-gray-600 dark:text-gray-400">
        <p>Keine Positionen in diesem Portfolio</p>
      </div>
    </div>

    <!-- Korrelations-/Klumpenrisiko-Warnung -->
    <div v-if="clusterRiskWarning" class="card border-l-4 border-orange-500 bg-orange-50/40 dark:bg-orange-950/30">
      <p class="text-sm font-bold text-orange-900 dark:text-orange-200">⚠ Klumpenrisiko erkannt</p>
      <p class="text-sm text-orange-800 dark:text-orange-300 mt-1">{{ clusterRiskWarning }}</p>
    </div>

    <!-- Steuerreport-Export (§123.5) -->
    <div class="card flex justify-between items-center flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold">Steuerreport</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Export aller Positionen mit geschätzter Steuer (CSV). Keine Steuerberatung - nur Näherungswerte.
        </p>
      </div>
      <button @click="exportTaxReport" class="btn btn-primary">📄 Steuerreport exportieren</button>
    </div>

    <!-- Depotübertrag (§121) -->
    <DepotImport />

    <!-- Shadow-Portfolio Hinweis (§120.4) -->
    <div v-if="activePortfolioType === 'shadow'" class="card bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500">
      <p class="text-sm text-blue-900 dark:text-blue-200 font-medium">Shadow Portfolio</p>
      <p class="text-xs text-blue-800 dark:text-blue-300 mt-1">
        Bildet ab, was passiert wäre, wenn alle regelkonformen Signale gehandelt worden wären.
        Vergleich: Was hätte die Strategie gemacht? Was habe ich tatsächlich gemacht? Was hat mich mein Verhalten gekostet?
      </p>
    </div>

    <!-- Add New Position -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Neue Position hinzufügen</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select class="input-field" v-model="newPosition.assetId">
          <option value="">-- Asset auswählen --</option>
          <option v-for="asset in store.assets" :key="asset.id" :value="asset.id">
            {{ asset.name }} ({{ asset.symbol }})
          </option>
        </select>
        <input type="number" v-model.number="newPosition.quantity" placeholder="Menge" class="input-field" />
        <input type="number" v-model.number="newPosition.buyPrice" placeholder="Kaufpreis" class="input-field" />
        <input type="date" v-model="newPosition.buyDate" class="input-field" />
        <button @click="addNewPosition" class="btn btn-primary md:col-span-2">
          Position hinzufügen
        </button>
      </div>
    </div>

    <!-- Sell Simulation for Selected Position -->
    <div v-if="selectedPosition" class="space-y-6">
      <div class="card border-l-4 border-blue-500">
        <p class="text-sm font-medium text-blue-900 dark:text-blue-200">
          📊 Verkaufssimulation für {{ selectedPosition.asset.symbol }}
        </p>
      </div>
      <SellSimulation
        :position="selectedPosition"
        :feeProfile="store.settings.feeProfile"
        :taxAssumption="store.settings.taxAssumption"
      />
    </div>

    <!-- Transaction History -->
    <div class="card" v-if="transactions.length > 0">
      <h2 class="text-lg font-bold mb-4">Transaktions-Historie</h2>
      <div class="space-y-2">
        <div
          v-for="tx in transactions.slice(0, 10)"
          :key="tx.id"
          class="p-3 border border-gray-200 dark:border-gray-700 rounded flex justify-between items-center"
        >
          <div>
            <p class="font-medium">{{ tx.type === 'buy' ? 'Kauf' : 'Verkauf' }} - {{ tx.quantity }} Stücke</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatTime(tx.date) }}</p>
          </div>
          <p :class="['font-bold', tx.type === 'buy' ? 'text-red-600' : 'text-green-600']">
            {{ tx.type === 'buy' ? '-' : '+' }}{{ formatCurrency(tx.quantity * tx.price) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import StatCard from '../components/StatCard.vue'
import SellSimulation from '../components/SellSimulation.vue'
import DepotImport from '../components/DepotImport.vue'
import { NetResultEngine } from '../services/netResultEngine'
import type { Position } from '../types'

const store = useAppStore()
const activePortfolioType = ref<'real' | 'test' | 'paper' | 'shadow'>('real')
const selectedPositionId = ref<string | null>(null)

const activePortfolio = computed(() => {
  return store.portfolios.find(p => p.type === activePortfolioType.value)
})

const selectedPosition = computed(() => {
  if (!selectedPositionId.value) return null
  return store.portfolios
    .flatMap(p => p.positions)
    .find(p => p.id === selectedPositionId.value) || null
})

const transactions = computed(() => {
  return store.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const newPosition = ref({
  assetId: '',
  quantity: 1,
  buyPrice: 0,
  buyDate: new Date().toISOString().split('T')[0]
})

const calculateGL = (position: Position) => {
  return (position.asset.currentPrice - position.buyPrice) * position.quantity
}

const calculateGLPercent = (position: Position) => {
  if (position.buyPrice === 0) return 0
  return ((position.asset.currentPrice - position.buyPrice) / position.buyPrice) * 100
}

const getGLClass = (position: Position) => {
  const gl = calculateGL(position)
  return gl >= 0 ? 'text-green-600' : 'text-red-600'
}

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
    day: 'numeric'
  }).format(new Date(date))
}

const addNewPosition = () => {
  const asset = store.assets.find(a => a.id === newPosition.value.assetId)
  if (!asset || !activePortfolio.value) return

  const position: Position = {
    id: `pos_${Date.now()}`,
    asset,
    quantity: newPosition.value.quantity,
    buyPrice: newPosition.value.buyPrice,
    buyDate: new Date(newPosition.value.buyDate),
    buyFees: 1,
    currency: store.activeCurrency,
    portfolioType: activePortfolioType.value,
    entryThesis: '',
    stopLoss: newPosition.value.buyPrice * 0.95,
    profitTarget: newPosition.value.buyPrice * 1.1
  }

  store.addPosition(activePortfolio.value.id, position)
  newPosition.value = {
    assetId: '',
    quantity: 1,
    buyPrice: 0,
    buyDate: new Date().toISOString().split('T')[0]
  }
}

/**
 * Echter Verkauf: Netto-Ergebnis berechnen, Position schließen,
 * realisierten G/V verbuchen, Transaktion + Protokoll schreiben.
 */
const sellPosition = (positionId: string) => {
  const portfolio = store.portfolios.find(p => p.positions.some(pos => pos.id === positionId))
  const position = portfolio?.positions.find(pos => pos.id === positionId)
  if (!portfolio || !position) return

  const result = NetResultEngine.calculateNetResult(
    position, position.asset.currentPrice,
    store.settings.feeProfile, store.settings.taxAssumption, 'EUR'
  )

  const ok = confirm(
    `${position.quantity}x ${position.asset.symbol} zu ${position.asset.currentPrice.toFixed(2)} verkaufen?\n\n` +
    `Brutto-Gewinn: ${result.grossGain.toFixed(2)} €\n` +
    `Gebühren: -${result.totalFees.toFixed(2)} €\n` +
    `Steuer (geschätzt): -${result.estimatedTax.toFixed(2)} €\n` +
    `─────────────────\n` +
    `NETTO: ${result.netGain.toFixed(2)} €`
  )
  if (!ok) return

  portfolio.realizedGainLoss += result.netGain
  portfolio.positions = portfolio.positions.filter(pos => pos.id !== positionId)
  if (selectedPositionId.value === positionId) selectedPositionId.value = null

  store.addTransaction({
    id: `tx_${Date.now()}`,
    portfolioId: portfolio.id,
    assetId: position.asset.id,
    type: 'sell',
    quantity: position.quantity,
    price: position.asset.currentPrice,
    fees: result.sellFees,
    taxes: result.estimatedTax,
    currency: position.currency,
    date: new Date(),
    note: `Netto: ${result.netGain.toFixed(2)} €`
  })
  store.logEvent('trade_ausgefuehrt',
    `Verkauf: ${position.quantity}x ${position.asset.symbol} @ ${position.asset.currentPrice.toFixed(2)} (Netto ${result.netGain >= 0 ? '+' : ''}${result.netGain.toFixed(2)} €)`,
    { assetId: position.asset.id, assetSymbol: position.asset.symbol })
}

/**
 * Korrelations-/Klumpenrisiko-Check: tragen mehrere Positionen dasselbe Risiko?
 */
const clusterRiskWarning = computed(() => {
  const positions = store.portfolios.filter(p => p.type === 'real' || p.type === 'paper').flatMap(p => p.positions)
  if (positions.length < 2) return ''

  const byClass = new Map<string, { count: number; value: number }>()
  let totalValue = 0
  positions.forEach(pos => {
    const value = pos.quantity * pos.asset.currentPrice
    totalValue += value
    const entry = byClass.get(pos.asset.assetClass) || { count: 0, value: 0 }
    entry.count++
    entry.value += value
    byClass.set(pos.asset.assetClass, entry)
  })

  const warnings: string[] = []
  byClass.forEach((entry, assetClass) => {
    const share = totalValue > 0 ? (entry.value / totalValue) * 100 : 0
    if (entry.count >= 3 && share > 60) {
      warnings.push(`${entry.count} Positionen in "${assetClass}" = ${share.toFixed(0)}% des Portfolios. Das ist EIN Klumpenrisiko, keine Diversifikation - fällt die Assetklasse, fallen alle Positionen zusammen.`)
    } else if (assetClass === 'crypto' && share > store.settings.maxCryptoQuota) {
      warnings.push(`Krypto-Quote ${share.toFixed(0)}% über deinem Limit von ${store.settings.maxCryptoQuota}%.`)
    }
  })
  return warnings.join(' ')
})

/**
 * Steuerstatus je Position (§120.5 / §123.4)
 */
const taxStatus = (position: Position): string => {
  const gain = calculateGL(position)
  const holdingDays = Math.floor((Date.now() - new Date(position.buyDate).getTime()) / 86400000)

  if (position.asset.assetClass === 'crypto') {
    if (holdingDays >= store.settings.taxAssumption.cryptoHoldingPeriod) {
      return 'steuerfrei möglich (Haltedauer)'
    }
    return gain > 0 ? `steuerpflichtig geschätzt (noch ${store.settings.taxAssumption.cryptoHoldingPeriod - holdingDays} Tage)` : 'steuerlich offen'
  }
  if (gain <= 0) return 'steuerlich offen'
  return 'steuerpflichtig geschätzt'
}

const taxStatusClass = (position: Position): string => {
  const status = taxStatus(position)
  if (status.startsWith('steuerfrei')) return 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200'
  if (status.startsWith('steuerpflichtig')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200'
  return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
}

/**
 * Steuerreport-Export als CSV (§123.5)
 */
const exportTaxReport = () => {
  const rows = [
    ['Asset', 'Symbol', 'Assetklasse', 'Portfolio', 'Kaufdatum', 'Haltedauer (Tage)', 'Stückzahl',
     'Kaufkurs', 'Aktueller Kurs', 'Kaufwert', 'Aktueller Wert', 'Unrealisiert G/V',
     'Steuerstatus', 'Geschätzte Steuer bei Verkauf'].join(';')
  ]

  store.portfolios.forEach(pf => {
    pf.positions.forEach(pos => {
      const gain = calculateGL(pos)
      const result = NetResultEngine.calculateNetResult(
        pos, pos.asset.currentPrice, store.settings.feeProfile, store.settings.taxAssumption, 'EUR'
      )
      const holdingDays = Math.floor((Date.now() - new Date(pos.buyDate).getTime()) / 86400000)
      rows.push([
        pos.asset.name, pos.asset.symbol, pos.asset.assetClass, pf.name,
        new Date(pos.buyDate).toLocaleDateString('de-DE'), holdingDays, pos.quantity,
        pos.buyPrice.toFixed(2).replace('.', ','), pos.asset.currentPrice.toFixed(2).replace('.', ','),
        (pos.buyPrice * pos.quantity).toFixed(2).replace('.', ','),
        (pos.asset.currentPrice * pos.quantity).toFixed(2).replace('.', ','),
        gain.toFixed(2).replace('.', ','),
        taxStatus(pos),
        result.estimatedTax.toFixed(2).replace('.', ',')
      ].join(';'))
    })
  })

  const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `steuerreport_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  store.logEvent('steuerereignis', 'Steuerreport als CSV exportiert')
}
</script>
