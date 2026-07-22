<template>
  <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded">
    <h4 class="font-bold mb-2">{{ title }}</h4>
    <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ scenario.description }}</p>
    <div>
      <p class="text-xs text-gray-600 dark:text-gray-400 font-bold mb-1">Bedingungen:</p>
      <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1">
        <li v-for="(cond, i) in scenario.conditions" :key="i">• {{ cond }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Scenario } from '../types'

interface Props {
  title: string
  scenario: Scenario
}

defineProps<Props>()
</script>
