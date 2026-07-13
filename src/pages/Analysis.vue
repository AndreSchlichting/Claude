<template>
  <div class="space-y-3">
    <div class="card">
      <h1 class="text-xl font-bold mb-1">Analyse-Engine</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Professionelle Entscheidungsfindung mit Begründung, Szenarien und Warnsystem
      </p>
    </div>

    <!-- Filter -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select v-model="filters.asset" class="input-field">
          <option value="">-- Alle Assets --</option>
          <option v-for="asset in store.assets" :key="asset.id" :value="asset.id">
            {{ asset.name }}
          </option>
        </select>
        <select v-model="filters.tradingMode" class="input-field">
          <option value="">-- Alle Modi --</option>
          <option value="daytrading">Daytrading</option>
          <option value="swing">Swing</option>
          <option value="investment">Investment</option>
        </select>
        <select v-model="filters.warningLevel" class="input-field">
          <option value="">-- Alle Levels --</option>
          <option value="green">Grün</option>
          <option value="yellow">Gelb</option>
          <option value="orange">Orange</option>
          <option value="red">Rot</option>
        </select>
      </div>
    </div>

    <!-- Analyses List -->
    <div class="space-y-4">
      <div
        v-for="analysis in filteredAnalyses"
        :key="analysis.id"
        class="card border-l-4"
        :class="[
          analysis.warningLevel === 'green' ? 'border-green-500' :
          analysis.warningLevel === 'yellow' ? 'border-yellow-500' :
          analysis.warningLevel === 'orange' ? 'border-orange-500' :
          analysis.warningLevel === 'red' ? 'border-red-500' : 'border-gray-300'
        ]"
      >
        <!-- Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-bold">{{ analysis.thesisTitle }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatTime(analysis.timestamp) }}</p>
          </div>
          <span :class="[
            'px-3 py-1 rounded font-medium text-sm',
            analysis.warningLevel === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900' :
            analysis.warningLevel === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900' :
            analysis.warningLevel === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900' :
            analysis.warningLevel === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900' :
            'bg-gray-100 text-gray-800'
          ]">
            {{ analysis.warningLevel.toUpperCase() }}
          </span>
        </div>

        <!-- Analysis Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <!-- Left Column -->
          <div class="space-y-4">
            <div>
              <p class="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">EINSTIEGSTHESE</p>
              <p class="text-gray-900 dark:text-white">{{ analysis.entryThesis }}</p>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">AUSSTIEGSTHESE</p>
              <p class="text-gray-900 dark:text-white">{{ analysis.exitThesis }}</p>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">UNGÜLTIGKEITSBEDINGUNG</p>
              <p class="text-red-600 dark:text-red-400">{{ analysis.invalidityCondition }}</p>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-3">
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">STOP / ZIEL</p>
              <p class="font-bold">{{ analysis.stopLevel.toFixed(2) }} / {{ analysis.profitTarget.toFixed(2) }}</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">CHANCE-RISIKO</p>
              <p class="font-bold text-lg">{{ analysis.chanceRiskRatio.toFixed(2) }}:1</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">KONFIDENZ</p>
              <div class="flex items-center gap-2 mt-1">
                <div class="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div class="h-full bg-primary" :style="{ width: `${analysis.confidence}%` }"></div>
                </div>
                <p class="font-bold text-sm">{{ analysis.confidence }}%</p>
              </div>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">TRADING MODE</p>
              <p class="font-bold capitalize">{{ analysis.tradingMode }}</p>
            </div>
          </div>
        </div>

        <!-- Decision -->
        <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <p class="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">ENTSCHEIDUNG</p>
          <div class="flex items-center justify-between">
            <span :class="[
              'px-4 py-2 rounded font-bold',
              analysis.decision === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900' :
              analysis.decision === 'sell' ? 'bg-red-100 text-red-800 dark:bg-red-900' :
              analysis.decision === 'finger_weg' ? 'bg-red-200 text-red-900 dark:bg-red-800' :
              analysis.decision === 'scam' ? 'bg-red-300 text-red-900' :
              'bg-gray-100 text-gray-800'
            ]">
              {{ formatDecision(analysis.decision) }}
            </span>
            <p class="text-gray-900 dark:text-white font-medium">{{ analysis.decisionReason }}</p>
          </div>
        </div>

        <!-- Scenarios -->
        <div class="mb-6">
          <p class="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">SZENARIEN</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ScenarioCard
              title="Bullisch"
              :scenario="analysis.bullishScenario"
              class="border-l-4 border-green-500"
            />
            <ScenarioCard
              title="Neutral"
              :scenario="analysis.neutralScenario"
              class="border-l-4 border-gray-500"
            />
            <ScenarioCard
              title="Bärisch"
              :scenario="analysis.bearishScenario"
              class="border-l-4 border-red-500"
            />
            <ScenarioCard
              title="Stress"
              :scenario="analysis.stressScenario"
              class="border-l-4 border-orange-500"
            />
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="analysis.warningReasons.length > 0" class="p-4 bg-orange-50 dark:bg-orange-900 rounded">
          <p class="text-sm font-bold text-orange-900 dark:text-orange-200 mb-2">WARNGRÜNDE</p>
          <ul class="space-y-1">
            <li v-for="(reason, i) in analysis.warningReasons" :key="i" class="text-sm text-orange-800 dark:text-orange-200">
              • {{ reason }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="filteredAnalyses.length === 0" class="card text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">Keine Analysen gefunden</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import ScenarioCard from '../components/ScenarioCard.vue'

const store = useAppStore()

const filters = ref({
  asset: '',
  tradingMode: '',
  warningLevel: ''
})

const filteredAnalyses = computed(() => {
  return store.analyses.filter(a => {
    if (filters.value.asset && a.assetId !== filters.value.asset) return false
    if (filters.value.tradingMode && a.tradingMode !== filters.value.tradingMode) return false
    if (filters.value.warningLevel && a.warningLevel !== filters.value.warningLevel) return false
    return true
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const formatDecision = (decision: string) => {
  const map: Record<string, string> = {
    'buy': 'Kauf empfohlen',
    'buy_on_trigger': 'Kauf bei Trigger',
    'hold': 'Halten',
    'watch': 'Beobachten',
    'sell': 'Verkaufen',
    'finger_weg': 'Finger weg!',
    'scam': 'Scam-Verdacht',
    'unclear': 'Unklar'
  }
  return map[decision] || decision
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
</script>
