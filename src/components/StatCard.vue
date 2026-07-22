<template>
  <div class="card">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ title }}</p>
    <div class="flex justify-between items-end">
      <p class="text-2xl font-bold">{{ value }}</p>
      <p v-if="trend !== undefined" :class="['text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600']">
        {{ isPositive ? '+' : '' }}{{ trend }}%
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string
  trend?: number
  isPositive?: boolean
}

defineProps<Props>()
</script>
