<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Header />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import { RouterView } from 'vue-router'
</script>

<style>
:root {
  color-scheme: light dark;
}

body {
  margin: 0;
  padding: 0;
}

html.dark {
  color-scheme: dark;
}
</style>
