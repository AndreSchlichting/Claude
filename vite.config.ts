import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Relative Pfade: nötig für Electron (file://) und Capacitor (Android)
  base: './',
  server: {
    port: 5173,
    host: true
  }
})
