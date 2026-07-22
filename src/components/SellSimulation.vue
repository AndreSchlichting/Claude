<template>
  <div class="card">
    <h2 class="text-lg font-bold mb-4">Verkaufssimulation</h2>

    <!-- Price Input -->
    <div class="mb-6">
      <label class="block text-sm font-medium mb-2">Verkaufspreis (€)</label>
      <input
        v-model.number="sellPrice"
        type="number"
        step="0.01"
        class="input-field w-full"
        @input="recalculate"
      />
      <p v-if="currentPrice > 0" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
        Aktuell: {{ formatPrice(currentPrice) }}
      </p>
    </div>

    <!-- Results -->
    <div v-if="result" class="space-y-4">
      <!-- Waterfall Chart (Text-based) -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded font-mono text-sm space-y-2">
        <div class="flex justify-between">
          <span>Brutto-Gewinn:</span>
          <span :class="result.grossGain >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ result.grossGain >= 0 ? '+' : '' }}{{ formatPrice(result.grossGain) }}
          </span>
        </div>
        <div class="flex justify-between text-orange-600 dark:text-orange-400">
          <span>− Gebühren:</span>
          <span>−{{ formatPrice(result.totalFees) }}</span>
        </div>
        <div class="flex justify-between text-orange-600 dark:text-orange-400">
          <span>− Steuern (geschätzt):</span>
          <span>−{{ formatPrice(result.estimatedTax) }}</span>
        </div>
        <div class="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-lg">
          <span>= NETTO-GEWINN:</span>
          <span :class="result.netGain >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ result.netGain >= 0 ? '+' : '' }}{{ formatPrice(result.netGain) }}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span>Netto-Rendite:</span>
          <span :class="result.netGainPercent >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ result.netGainPercent >= 0 ? '+' : '' }}{{ result.netGainPercent.toFixed(2) }}%
          </span>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <p class="text-xs text-blue-900 dark:text-blue-200 mb-2">NETTO-ERLÖS</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">{{ formatPrice(result.netProceeds) }}</p>
          <p class="text-xs text-blue-800 dark:text-blue-300 mt-1">Nach allen Kosten</p>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900 rounded">
          <p class="text-xs text-orange-900 dark:text-orange-200 mb-2">GEBÜHREN TOTAL</p>
          <p class="text-2xl font-bold text-orange-900 dark:text-orange-200">{{ formatPrice(result.totalFees) }}</p>
          <p class="text-xs text-orange-800 dark:text-orange-300 mt-1">
            {{ (result.totalFees / result.buyValue * 100).toFixed(2) }}% vom Einsatz
          </p>
        </div>
        <div class="p-4 bg-red-50 dark:bg-red-900 rounded">
          <p class="text-xs text-red-900 dark:text-red-200 mb-2">STEUERN GESCHÄTZT</p>
          <p class="text-2xl font-bold text-red-900 dark:text-red-200">{{ formatPrice(result.estimatedTax) }}</p>
          <p class="text-xs text-red-800 dark:text-red-300 mt-1">
            Bei {{ result.taxableGainAfterFreeAmount > 0 ? '26,375%' : '0%' }}
          </p>
        </div>
      </div>

      <!-- Tax Details -->
      <div v-if="result.estimatedTax > 0" class="p-4 bg-gray-50 dark:bg-gray-700 rounded text-sm">
        <p class="font-bold mb-2">Steuerberechnung (Deutschland):</p>
        <ul class="space-y-1 text-gray-700 dark:text-gray-300">
          <li v-for="(assumption, i) in result.assumptions.slice(3)" :key="i" class="text-xs">
            • {{ assumption }}
          </li>
        </ul>
      </div>

      <!-- Fee Details -->
      <div v-if="result.totalFees > 0" class="p-4 bg-gray-50 dark:bg-gray-700 rounded text-sm">
        <p class="font-bold mb-2">Gebührenaufschlüsselung:</p>
        <ul class="space-y-1 text-gray-700 dark:text-gray-300 text-xs">
          <li v-for="(assumption, i) in result.assumptions.slice(0, 2)" :key="i">
            • {{ assumption }}
          </li>
        </ul>
      </div>

      <!-- Comparison Scenarios -->
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="font-bold text-sm mb-3">Vergleichszenarien:</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            v-for="scenario in scenarios"
            :key="scenario.name"
            :class="[
              'p-3 border rounded text-sm',
              sellPrice === scenario.price
                ? 'border-primary bg-primary bg-opacity-5'
                : 'border-gray-300 dark:border-gray-600'
            ]"
          >
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">{{ scenario.name }}</p>
            <p class="font-bold">{{ formatPrice(scenario.price) }}</p>
            <p :class="[
              'text-xs font-medium mt-1',
              scenario.netGain >= 0 ? 'text-green-600' : 'text-red-600'
            ]">
              {{ scenario.netGain >= 0 ? '+' : '' }}{{ formatPrice(scenario.netGain) }}
            </p>
          </div>
        </div>
      </div>

      <!-- "What-if" Calculator -->
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="font-bold text-sm mb-3">Zielpreis für bestimmten Netto-Gewinn</p>
        <div class="flex gap-2">
          <input
            v-model.number="targetNetGain"
            type="number"
            placeholder="Gewinn-Ziel (€)"
            class="input-field flex-1"
          />
          <button @click="calculateRequiredPrice" class="btn btn-primary">
            Berechnen
          </button>
        </div>
        <p v-if="requiredPriceInfo" class="text-sm text-gray-700 dark:text-gray-300 mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded">
          {{ requiredPriceInfo }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Position, FeeProfile, TaxAssumption } from '../types'
import { NetResultEngine } from '../services/netResultEngine'
import type { NetResultCalculation } from '../services/netResultEngine'

interface Props {
  position: Position
  feeProfile: FeeProfile
  taxAssumption: TaxAssumption
}

const props = defineProps<Props>()

const sellPrice = ref(props.position.asset.currentPrice)
const targetNetGain = ref(0)
const requiredPriceInfo = ref('')
const result = ref<NetResultCalculation | null>(null)

const currentPrice = computed(() => props.position.asset.currentPrice)

const scenarios = computed(() => {
  const basePrice = props.position.buyPrice
  return [
    {
      name: '0% (Break-Even)',
      price: basePrice,
      netGain: NetResultEngine.calculateNetResult(
        props.position,
        basePrice,
        props.feeProfile,
        props.taxAssumption,
        'EUR'
      ).netGain
    },
    {
      name: '+10%',
      price: basePrice * 1.1,
      netGain: NetResultEngine.calculateNetResult(
        props.position,
        basePrice * 1.1,
        props.feeProfile,
        props.taxAssumption,
        'EUR'
      ).netGain
    },
    {
      name: '+20%',
      price: basePrice * 1.2,
      netGain: NetResultEngine.calculateNetResult(
        props.position,
        basePrice * 1.2,
        props.feeProfile,
        props.taxAssumption,
        'EUR'
      ).netGain
    }
  ]
})

const recalculate = () => {
  result.value = NetResultEngine.calculateNetResult(
    props.position,
    sellPrice.value,
    props.feeProfile,
    props.taxAssumption,
    'EUR'
  )
}

const calculateRequiredPrice = () => {
  if (targetNetGain.value === 0) return
  const calc = NetResultEngine.calculateRequiredPriceForNetGain(
    props.position,
    targetNetGain.value,
    props.feeProfile,
    props.taxAssumption
  )
  requiredPriceInfo.value = calc.breakdown
  sellPrice.value = calc.requiredPrice
  recalculate()
}

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

// Initial calculation
recalculate()
</script>
